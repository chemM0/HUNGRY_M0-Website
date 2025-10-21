// 后端 API 地址（默认使用 HTTP 隧道）。
// 注意：若页面通过 HTTPS 提供服务，浏览器会阻止向 HTTP 的请求（混合内容）。
// 这里不硬编码在每次 fetch 前切换协议，而是在请求阶段优先尝试 HTTPS（若可用），
// 并在失败时回退到原始地址，同时在控制台给出更友好的诊断提示。
const API_URL = "http://r8ef8c75.natappfree.cc/api/system"; // 后端 API 地址
const REFRESH_INTERVAL = 1; // 刷新间隔（秒），用于计算网络速率
const FETCH_TIMEOUT_MS = 8000; // fetch 超时（毫秒）
// 连续失败计数，用于退避和给出更明显的诊断提示
let consecutiveFailures = 0;
let lastNet = {
    tx: 0, // 上一次采样的已发送字节数
    rx: 0 // 上一次采样的已接收字节数
};
let uptimeSec = 0; // 系统运行秒数（从接口获取并递增）
let isFirstFetch = true; // 首次请求时跳过上/下行速率计算
let uptimeTimer = null; // 本地用于每秒递增 uptime 的定时器（仅在后端返回有效 uptime 时启用）
// 聚焦进程信息：显示窗口标题与可执行名（不再记录或显示聚焦时长）

// 辅助：安全读写 DOM 元素
function getEl(id) {
    return document.getElementById(id) || null;
}

function setText(id, text) {
    const el = getEl(id);
    if (el) el.textContent = text;
}

function setHTML(id, html) {
    const el = getEl(id);
    if (el) el.innerHTML = html;
}

/**
 * 将任意值安全转换为数字，若转换失败则返回默认值
 * @param {*} val 任意值
 * @param {number} defaultVal 默认值（当值不能转换为有效数字时返回）
 */
function safeNumber(val, defaultVal = 0) {
    const n = Number(val);
    return isNaN(n) ? defaultVal : n;
}

/**
 * 将字节数格式化为可读字符串（自动转换为 KB/MB/GB）
 */
function formatBytes(bytes) {
    const b = Number(bytes) || 0;
    if (b < 1024) return b + ' B';
    const kb = b / 1024;
    if (kb < 1024) return kb.toFixed(1) + ' KB';
    const mb = kb / 1024;
    if (mb < 1024) return mb.toFixed(1) + ' MB';
    const gb = mb / 1024;
    return gb.toFixed(2) + ' GB';
}

/**
 * 从后端 API 拉取系统信息并更新页面显示。主要包括：
 * - 在线状态指示
 * - CPU、内存、磁盘使用率显示
 * - 网络上/下行速率计算（MB/s）
 * - 当前聚焦进程信息（窗口标题、可执行名、进程 CPU/内存）
 * - uptime（累计秒数）显示与本地递增
 */
async function fetchSystem() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    // 构建候选地址列表：若当前页面为 HTTPS 且配置的 API 使用 http:，
    // 则优先尝试替换为 https:（有些反向隧道或网关支持 https）。
    const candidates = [API_URL];
    if (typeof location !== 'undefined' && location.protocol === 'https:' && API_URL.startsWith('http:')) {
        const httpsCandidate = API_URL.replace(/^http:/i, 'https:');
        // 让 HTTPS 版本优先尝试
        candidates.unshift(httpsCandidate);
    }

    try {
        let res = null;
        let lastErr = null;
        // 逐一尝试候选地址，直到有成功的响应
        for (const url of candidates) {
            try {
                res = await fetch(url, {
                    signal: controller.signal,
                    mode: 'cors'
                });
                // 如果 fetch 在网络层面就抛出（比如被浏览器阻止），将进入 catch
                if (res) break;
            } catch (e) {
                lastErr = e;
                // 如果是混合内容被浏览器阻止的情况（在 HTTPS 页面请求 HTTP），
                // Chrome/Edge 常常抛出 TypeError。继续尝试下一个候选地址（如 https）。
                console.warn(`fetch to ${url} failed:`, e);
                continue;
            }
        }
        clearTimeout(timeoutId);

        if (!res) {
            // 没有任何候选地址能建立连接，抛出上次错误或通用错误
            throw lastErr || new Error('无法连接到 API：所有候选地址均失败');
        }
        clearTimeout(timeoutId);

        if (!res.ok) {
            // 读取响应体以便更好地定位问题
            const body = await res.text().catch(() => "<no body>");
            throw new Error(`HTTP ${res.status} - ${body}`);
        }
        const data = await res.json();

    // 更新在线状态 UI（安全写入）
        setText("online-status", "电脑在线 ✅");
        const dot = getEl("dot");
        if (dot) dot.style.background = "#4caf50";
    // 成功后重置连续失败计数
    consecutiveFailures = 0;

    // 计算 CPU 平均占用（数组取平均），保留数值形式用于后续计算
    const cpuArray = data.cpu_usage || [];
    const cpuAvg = cpuArray.length > 0 ? (cpuArray.reduce((s, v) => s + v, 0) / cpuArray.length) : 0;
    const cpu = (typeof cpuAvg === 'number') ? cpuAvg.toFixed(1) : 0;
    // 不再从后端读取 CPU 速度（已移除）
    const mem = safeNumber(data.memory_usage?.percent, 0).toFixed(1);
    const memUsed = safeNumber(data.memory_usage?.used, null);
    // 若后端未返回总内存，默认使用 24GB
    const DEFAULT_TOTAL_BYTES = 24 * 1024 * 1024 * 1024;
    const memTotal = safeNumber(data.memory_usage?.total, DEFAULT_TOTAL_BYTES);
        const disk = data.disks && data.disks.length > 0 ?
            (100 - (safeNumber(data.disks[0].available_space) / safeNumber(data.disks[0].total_space, 1) * 100)).toFixed(1) :
            0;

        const activeNetwork = data.network?.find(n => n.received > 0 || n.transmitted > 0) || {};
        const tx = safeNumber(activeNetwork.transmitted, 0);
        const rx = safeNumber(activeNetwork.received, 0);

        // 计算上/下行速率（MB/s），保证差值非负（处理计数回绕）
        let upRate = "0.00",
            downRate = "0.00";
        if (!isFirstFetch) {
            const deltaTx = Math.max(0, tx - lastNet.tx);
            const deltaRx = Math.max(0, rx - lastNet.rx);
            upRate = (deltaTx / (REFRESH_INTERVAL * 1024 * 1024)).toFixed(2);
            downRate = (deltaRx / (REFRESH_INTERVAL * 1024 * 1024)).toFixed(2);
        }

        lastNet = {
            tx,
            rx
        };
        isFirstFetch = false;

        // 获取当前焦点窗口对应的进程信息（如果有）
    const focus = data.processes?.find(p => p.is_focused) || {};
    const title = focus.window_title || "(无标题)";
    const exe = focus.executable_name || "未知进程";
    const pid = focus.pid || null;

        // 计算“进程占系统总 CPU 的百分比”。后端返回格式不确定，采用以下优先级：
        // 1) 如果值在 0-100，则视为已经是总 CPU 百分比（直接使用）；
        // 2) 如果值大于 100，常见情况是 "每核百分比之和"（例如占用 2 个核则为 200），
        //    则将其除以核数得到占全部 CPU 的百分比（例如 200/4core -> 50%）；
        // 3) 如果仍然异常，则退回到按不同除数归一化（兼容更老实现）。
        function computeProcessCpuPercent(raw, coreCount) {
            let val = Number(raw) || 0;
            coreCount = Math.max(1, Number(coreCount) || 1);
            if (val <= 0) return 0;
            // 已在 0-100 范围，直接认为是总占比
            if (val <= 100) {
                return Math.round(val * 10) / 10;
            }
            // 若大于 100，常见场景为 "每核百分比之和"，除以核数得到占全部 CPU 的百分比
            const byCores = val / coreCount;
            if (byCores <= 100) {
                return Math.round(byCores * 10) / 10;
            }
            // 退回兼容模式（尝试不同除数把数字压到 0-100）
            const divisors = [10, 100, 1000, 10000, 100000];
            for (let d of divisors) {
                const cand = val / d;
                if (cand <= 100) return Math.round(cand * 10) / 10;
            }
            return 100;
        }

        const normCpuUsage = computeProcessCpuPercent(safeNumber(focus.cpu_usage, 0), cpuArray.length || (navigator.hardwareConcurrency || 1));

        // 更新 uptime 并刷新显示
        // 仅当后端明确返回有效 uptime 时才显示并启动本地计时器；否则不显示并停止计时
        if (data.uptime != null) {
            const serverUptime = Number(data.uptime);
            if (!isNaN(serverUptime) && serverUptime >= 0) {
                uptimeSec = serverUptime;
                updateUptimeDisplay();

                // 确保本地每秒递增计时器正在运行（仅在成功获取到 uptime 时启动）
                if (!uptimeTimer) {
                    uptimeTimer = setInterval(() => {
                        uptimeSec++;
                        updateUptimeDisplay();
                    }, 1000);
                }
            } else {
                console.warn("忽略无效的 uptime 值:", data.uptime);
                // 如果返回的 uptime 无效，停止计时并隐藏显示
                if (uptimeTimer) {
                    clearInterval(uptimeTimer);
                    uptimeTimer = null;
                }
                setText("uptime", "--:--:--");
            }
        } else {
            // 后端未返回 uptime：将 uptime 显示为占位（不开始计时）
            if (uptimeTimer) {
                clearInterval(uptimeTimer);
                uptimeTimer = null;
            }
            setText("uptime", "--:--:--");
        }

        // 更新仪表显示
        updateMetric("cpu", cpu);
        updateMetric("mem", mem);
        updateMetric("disk", disk);

        // 更新磁盘卡（展示第一个磁盘的使用情况）
        try {
            const diskInfo = data.disks && data.disks.length > 0 ? data.disks[0] : null;
            if (diskInfo) {
                const total = safeNumber(diskInfo.total_space, 0);
                const avail = safeNumber(diskInfo.available_space, 0);
                const used = Math.max(0, total - avail);
                const usedPct = total > 0 ? (used / total * 100) : 0;
                // 尝试提取盘符（例如 'C:' 或 '/mnt/c' 等），用于显示在名称前
                const diskLetterEl = getEl("diskLetter");
                let diskLetter = '';
                try {
                    const mp = String(diskInfo.mount_point || '').toUpperCase();
                    if (mp && (mp.length >= 1)) {
                        // Windows 风格 'C:' 或 '/mnt/c' -> 取首字母
                        const m = mp.replace(/^\/MNT\//, '').replace(/\\\\/g, '');
                        diskLetter = (m[0] ? (m[0] + ':') : '');
                    }
                } catch (ex) {}
                if (diskLetterEl) diskLetterEl.textContent = diskLetter;
                setText("diskName", diskInfo.name || diskInfo.mount_point || "磁盘");
                setText("diskText", `可用: ${formatBytes(avail)} / 总计: ${formatBytes(total)} (已用${usedPct.toFixed(1)}%)`);
                const fillEl = getEl("diskFill");
                if (fillEl) fillEl.style.width = Math.min(100, Math.max(0, usedPct)) + "%";
            } else {
                setText("diskName", "--");
                setText("diskText", "可用: -- / 总计: --");
                const fillEl = getEl("diskFill");
                if (fillEl) fillEl.style.width = "0%";
            }
            // 找到并更新 D 盘（如果存在）
            // 更严格地匹配 D 盘：优先通过 mount_point 精确匹配（例如 'D:'、'D:\\'、'/mnt/d' 等）
            const diskD = data.disks && data.disks.find(d => {
                if (!d) return false;
                const mp = String(d.mount_point || '').toUpperCase();
                const name = String(d.name || '').toUpperCase();
                if (mp === 'D:' || mp.startsWith('D:') || mp === 'D:\\' || mp.startsWith('D:\\')) return true;
                if (mp.startsWith('/MNT/D') || mp === '/D' || mp === '/D/') return true;
                // 避免简单包含 'D' 的模糊匹配，仅当 name 精确类似 'D' 或 'D:' 时采用
                if (name === 'D' || name === 'D:' || name.endsWith(':D')) return true;
                return false;
            });
            var hasDiskD = !!getEl("diskFillD") || !!getEl("diskTextD") || !!getEl("diskNameD");
            if (diskD && hasDiskD) {
                const totalD = safeNumber(diskD.total_space, 0);
                const availD = safeNumber(diskD.available_space, 0);
                const usedD = Math.max(0, totalD - availD);
                const usedPctD = totalD > 0 ? (usedD / totalD * 100) : 0;
                // D 盘盘符
                const diskLetterDEl = getEl("diskLetterD");
                let diskLetterD = 'D:';
                try {
                    const mpD = String(diskD.mount_point || '').toUpperCase();
                    if (mpD && mpD.length >= 1) {
                        const mD = mpD.replace(/^\/MNT\//, '').replace(/\\\\/g, '');
                        diskLetterD = (mD[0] ? (mD[0] + ':') : diskLetterD);
                    }
                } catch (ex) {}
                if (diskLetterDEl) diskLetterDEl.textContent = diskLetterD;
                setText("diskNameD", diskD.name || diskD.mount_point || "D盘");
                setText("diskTextD", `可用: ${formatBytes(availD)} / 总计: ${formatBytes(totalD)} (已用${usedPctD.toFixed(1)}%)`);
                const fillElD = getEl("diskFillD");
                if (fillElD) fillElD.style.width = Math.min(100, Math.max(0, usedPctD)) + "%";
            } else if (hasDiskD) {
                setText("diskNameD", "--");
                setText("diskTextD", "可用: -- / 总计: --");
                const fillElD = getEl("diskFillD");
                if (fillElD) fillElD.style.width = "0%";
            }
        } catch (e) {
            console.warn('更新磁盘卡失败', e);
        }

        // 更新网络与焦点卡片显示
        setText("netVal", `↑ ${upRate}   ↓ ${downRate} (MB/s)`);

        // 更新内存卡片下方显示 已用 / 总量（总量缺省为 24GB）
        const memTextEl = getEl('memText');
        if (memTextEl) {
            if (memUsed != null && memTotal != null && memTotal > 0) {
                memTextEl.textContent = `${formatBytes(memUsed)} / ${formatBytes(memTotal)}`;
            } else if (memTotal != null && memTotal > 0) {
                memTextEl.textContent = `-- / ${formatBytes(memTotal)}`;
            } else {
                memTextEl.textContent = '-- / --';
            }
        }

        // 聚焦卡只显示标题与程序名（不再显示聚焦时长）
        setHTML("focus-card", `
    <div class="focus-title">🎯 ${title}</div>
    <div class="focus-details">程序名：${exe}</div>`);
    } catch (err) {
        clearTimeout(timeoutId);
        console.error("获取系统信息失败:", err);
        consecutiveFailures++;
        // 在页面上显示更明确的诊断信息（当连续失败时）
        if (consecutiveFailures >= 1) {
            // 针对证书或 TLS 问题，提供建议（浏览器会把证书错误归为 Failed to fetch）
            if (typeof location !== 'undefined' && location.protocol === 'https:' && API_URL.startsWith('https:')) {
                // 将更友好的诊断提示显示到 focus-card 区域，便于用户知道如何处理
                setHTML("focus-card", `\n    <div class="focus-title focus-title-error">⚠ 连接失败（可能为 TLS/证书问题）</div>\n    <div class="focus-details">无法连接到 API：可能原因包括证书未被信任或证书链不完整（浏览器错误：请查看 Network 面板的 net::ERR_CERT_* 信息）。<br>建议：在服务器上使用受信任的证书（Let's Encrypt 等），或在本地调试时将证书导入系统受信任根。若无法修改后端，可尝试使用同源的反向代理。</div>`);
            }
        }
        // 进一步诊断可能的混合内容问题：当页面是 HTTPS 且 API_URL 使用 http:，说明浏览器会阻止请求
        if (typeof location !== 'undefined' && location.protocol === 'https:' && API_URL.startsWith('http:')) {
            console.error('注意：当前页面通过 HTTPS 提供服务，但后端 API 使用 HTTP，这会被浏览器视为混合内容并被阻止。\n' +
                '解决方法：\n' +
                ' 1) 为后端启用 HTTPS（推荐）并将 API 地址更改为 https://...；\n' +
                " 2) 在同一域下通过反向代理或本地代理转发 API（例如 Nginx 或本地开发代理）；\n" +
                ' 3) 临时将页面改为通过 HTTP 提供以便调试（不推荐用于生产）。');
        }
        // 更详细地在控制台输出错误类型，便于定位（超时、网络、CORS、服务器错误等）
        setText("online-status", "API离线中 ❌");
        const dot = getEl("dot");
        if (dot) dot.style.background = "#f44336";
    setHTML("focus-card", `
    <div class="focus-title focus-title-error">⚠ 连接失败</div>
    <div class="focus-details">无法获取系统信息：${err.message}</div>`);

        // 清空所有指标显示，防止继续显示旧数据
        updateMetric("cpu", "--");
        updateMetric("mem", "--");
        updateMetric("disk", "--");
        setText("netVal", "-- MB/s");
        setText("diskName", "--");
        setText("diskText", "可用: -- / 总计: --");
        const fillEl = getEl("diskFill");
        if (fillEl) fillEl.style.width = "0%";
        setText("diskNameD", "--");
        setText("diskTextD", "可用: -- / 总计: --");
        const fillElD = getEl("diskFillD");
        if (fillElD) fillElD.style.width = "0%";

        // 标记下次为首次请求，避免在下次成功前使用错误的 lastNet 计算速率
        isFirstFetch = true;
    }
}

/**
 * 根据 uptimeSec 将运行时间格式化为 HH:MM:SS 并更新页面
 */
function updateUptimeDisplay() {
    const h = String(Math.floor(uptimeSec / 3600)).padStart(2, "0");
    const m = String(Math.floor((uptimeSec % 3600) / 60)).padStart(2, "0");
    const s = String(uptimeSec % 60).padStart(2, "0");
    document.getElementById("uptime").textContent = `${h}小时${m}分${s}秒`;
}

/**
 * 更新指定指标的文本显示，并做一个短暂的动画效果
 * @param {string} id 指标 id 前缀（例如 "cpu" -> 元素 id 为 cpuVal）
 * @param {string|number} val 要显示的值（通常为百分比字符串或数字）
 */
function updateMetric(id, val) {
    const el = document.getElementById(id + "Val");
    if (!el) {
        // 元素不存在（可能还未渲染或被移除），避免抛出异常
        console.warn(`updateMetric: 元素 ${id + "Val"} 未找到，跳过更新`);
        return;
    }
    // 当 val 为占位符（如 "--"）时直接显示，否则附加百分号
    if (typeof val === 'string' && val.trim() === '--') {
        el.textContent = val;
    } else {
        el.textContent = val + "%";
    }
    // 简单放大并改变颜色作为更新提示
    el.style.transform = "scale(1.15)";

    // 解析数值并判断是否需要高亮（仅对 cpu 和 mem 生效）
    const num = parseFloat(String(val).replace(/[^\d.-]/g, '')) || 0;
    const isHigh = (id === "cpu" || id === "mem") && num > 80;

    // 立即设置更新颜色：高于阈值则红色，否则使用短暂强调色
    el.style.color = isHigh ? "#f44336" : "#0d47a1";

    setTimeout(() => {
        el.style.transform = "scale(1)";
        // 根据是否为高负载决定最终颜色（高负载保持红色，否则恢复主题色）
        if (isHigh) {
            el.style.color = "#f44336";
        } else {
            el.style.color = document.body.classList.contains("dark") ? "#64b5f6" : "#1565c0";
        }
    }, 300);
}

// 注意：不再使用全局的每秒递增计时器。
// uptime 由 fetch 成功且包含有效 uptime 时启动定时器，连接失败或缺失 uptime 时停止计时器并显示占位符。

// 使用独立轮询，避免请求重叠（基于 REFRESH_INTERVAL）
(async function pollLoop() {
    while (true) {
        await fetchSystem();
        // 如果连续失败，使用更长的退避时间（简单线性退避）：
        // wait = REFRESH_INTERVAL + Math.min(60, consecutiveFailures * 2)
        const extra = Math.min(60, consecutiveFailures * 2);
        const waitSec = REFRESH_INTERVAL + extra;
        await new Promise(r => setTimeout(r, waitSec * 1000));
    }
})();