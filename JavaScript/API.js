const API_URL = "http://localhost:21536/api/system"; // API地址
const REFRESH_INTERVAL = 1; // 刷新间隔（秒），用于计算网络速率
const FETCH_TIMEOUT_MS = 8000; // fetch 超时（毫秒）
let lastNet = {
    tx: 0, // 上一次采样的已发送字节数
    rx: 0 // 上一次采样的已接收字节数
};
let uptimeSec = 0; // 系统运行秒数（从接口获取并递增）
let isFirstFetch = true; // 用于第一次请求时跳过速率计算
let uptimeTimer = null; // 本地用于每秒递增 uptime 的定时器（只有在有有效 uptime 时启动）
// 聚焦进程追踪：记录当前聚焦进程 pid 和开始聚焦的时间戳（秒）
let focusedPid = null;
let focusStartSec = null;

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
 * 将字节数格式化为易读字符串（自动转换为 KB/MB/GB）
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
 * 从后端 API 拉取系统信息并更新页面显示
 * 包含：
 * - 在线状态指示
 * - CPU、内存、磁盘使用率显示
 * - 网络上/下行速率计算（MB/s）
 * - 当前焦点进程信息（窗口标题、可执行名、进程 CPU/内存）
 * - uptime（累计秒数）显示更新
 */
async function fetchSystem() {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    try {
        const res = await fetch(API_URL, {
            signal: controller.signal
        });
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

        // 聚焦时长逻辑：若 pid 变化则重置计时；否则显示当前聚焦持续秒数
        const nowSec = Math.floor(Date.now() / 1000);
        if (pid == null) {
            focusedPid = null;
            focusStartSec = null;
        } else {
            if (focusedPid !== pid) {
                focusedPid = pid;
                focusStartSec = nowSec;
            }
        }
        const focusDurationSec = (focusStartSec != null) ? Math.max(0, nowSec - focusStartSec) : 0;

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
            if (diskD) {
                const totalD = safeNumber(diskD.total_space, 0);
                const availD = safeNumber(diskD.available_space, 0);
                const usedD = Math.max(0, totalD - availD);
                const usedPctD = totalD > 0 ? (usedD / totalD * 100) : 0;
                setText("diskNameD", diskD.name || diskD.mount_point || "D盘");
                setText("diskTextD", `可用: ${formatBytes(availD)} / 总计: ${formatBytes(totalD)} (已用${usedPctD.toFixed(1)}%)`);
                const fillElD = getEl("diskFillD");
                if (fillElD) fillElD.style.width = Math.min(100, Math.max(0, usedPctD)) + "%";
            } else {
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

        // 聚焦卡显示聚焦时长（切换进程重置）
        const hours = String(Math.floor(focusDurationSec / 3600)).padStart(2, '0');
        const mins = String(Math.floor((focusDurationSec % 3600) / 60)).padStart(2, '0');
        const secs = String(focusDurationSec % 60).padStart(2, '0');
        setHTML("focus-card", `
    <div class="focus-title">🎯 ${title}</div>
    <div class="focus-details">程序名：${exe}<br>聚焦时长：${hours}:${mins}:${secs}</div>`);
    } catch (err) {
        clearTimeout(timeoutId);
        console.error("获取系统信息失败:", err);
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
        await new Promise(r => setTimeout(r, REFRESH_INTERVAL * 1000));
    }
})();