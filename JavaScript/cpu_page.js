// CPU 分核实时图（不依赖外部库）
(function(){
    // 后端 API，本地开发可能运行在 localhost:21536
    // 注意：当页面通过 HTTPS 提供时，浏览器会阻止向 http://localhost 的请求（混合内容）。
    // 优先尝试 https://localhost:21536（若后端或代理支持），否则回退到配置的 HTTP 地址以便本地调试。
    const API_URL = "dd355f42.natappfree.cc/api/system";
    const REFRESH_INTERVAL = 1; // 秒
    const MAX_POINTS = 120; // 每个小图保留的数据点数

    let coreCount = 24;
    let history = [];
    let colors = [];
    let totalHistory = [];

    const containerId = 'cpuGrid';

    function genColors(n){
        const arr = [];
        for(let i=0;i<n;i++){
            const h = Math.round((i * 360 / Math.max(1,n)) % 360);
            arr.push(`hsl(${h}deg 70% 55% / 0.95)`);
        }
        return arr;
    }

    function createGrid(n){
        const root = document.getElementById(containerId);
        root.innerHTML = '';
        for(let i=0;i<n;i++){
            const card = document.createElement('div');
            card.className = 'core-card';
            const title = document.createElement('div');
            title.className = 'core-title';
            title.textContent = 'Core ' + i;
            const c = document.createElement('canvas');
            c.className = 'core-canvas';
            c.width = 400; c.height = 120;
            card.appendChild(title);
            card.appendChild(c);
            root.appendChild(card);
        }
    }

    function initWithCount(n){
        coreCount = Math.max(1, n || 24);
        history = Array.from({length:coreCount}, ()=>[]);
        colors = genColors(coreCount);
        createGrid(coreCount);
        // set CSS grid columns responsively
        const root = document.getElementById(containerId);
        root.style.gridTemplateColumns = `repeat(${Math.min(coreCount, 6)}, 1fr)`;
    }

    function drawSmall(canvas, data, color){
        const ctx = canvas.getContext('2d');
        const DPR = devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * DPR);
        canvas.height = Math.floor(rect.height * DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
        const w = rect.width, h = rect.height;
        // bg
        ctx.clearRect(0,0,w,h);
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#fff';
        ctx.fillRect(0,0,w,h);
        // grid lines
        ctx.strokeStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for(let y=0;y<=4;y++){
            const yy = 6 + y*( (h-12)/4 );
            ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(w,yy); ctx.stroke();
        }
        // draw line
        if(!data || data.length===0) return;
        const maxPoints = MAX_POINTS;
        const step = w / Math.max(1, maxPoints-1);
        ctx.beginPath(); ctx.lineWidth = 1.5; ctx.strokeStyle = color; ctx.globalAlpha = 0.95;
        for(let j=0;j<data.length;j++){
            const x = w - (data.length - 1 - j) * step;
            const y = (1 - Math.min(100,data[j])/100) * (h - 8) + 4;
            if(j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
        // last value
        const last = data[data.length-1];
        ctx.fillStyle = color; ctx.font = '10px sans-serif'; ctx.fillText((last||0).toFixed(0)+'%', w-30, 12);
    }

    function drawTotal(canvas, data, color){
        const ctx = canvas.getContext('2d');
        const DPR = devicePixelRatio || 1;
        const rect = canvas.getBoundingClientRect();
        canvas.width = Math.floor(rect.width * DPR);
        canvas.height = Math.floor(rect.height * DPR);
        ctx.setTransform(DPR,0,0,DPR,0,0);
        const w = rect.width, h = rect.height;
        ctx.clearRect(0,0,w,h);
        // background
        ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#fff';
        ctx.fillRect(0,0,w,h);
        // grid
        ctx.strokeStyle = document.body.classList.contains('dark') ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.06)';
        ctx.lineWidth = 1;
        for(let y=0;y<=4;y++){
            const yy = 6 + y*( (h-12)/4 );
            ctx.beginPath(); ctx.moveTo(0,yy); ctx.lineTo(w,yy); ctx.stroke();
        }
        if(!data || data.length===0) return;
        const maxPoints = MAX_POINTS;
        const step = w / Math.max(1, maxPoints-1);
        ctx.beginPath(); ctx.lineWidth = 2.0; ctx.strokeStyle = color || '#1976d2'; ctx.globalAlpha = 0.95;
        for(let j=0;j<data.length;j++){
            const x = w - (data.length - 1 - j) * step;
            const y = (1 - Math.min(100,data[j])/100) * (h - 8) + 4;
            if(j===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
        }
        ctx.stroke(); ctx.globalAlpha = 1;
        const last = data[data.length-1];
        ctx.fillStyle = color || '#1976d2'; ctx.font = '12px sans-serif'; ctx.fillText((last||0).toFixed(0)+'%', w-40, 16);
    }

    async function fetchOnce(){
        try{
            const controller = new AbortController();
            const t = setTimeout(()=>controller.abort(), 7000);
            // 为了兼容在 HTTPS 页面中运行，尝试使用候选地址列表（优先 https）
            const candidates = [API_URL];
            if (typeof location !== 'undefined' && location.protocol === 'https:' && API_URL.startsWith('http:')) {
                candidates.unshift(API_URL.replace(/^http:/i, 'https:'));
            }

            let res = null;
            let lastErr = null;
            for (const url of candidates) {
                try {
                    res = await fetch(url, { signal: controller.signal, mode: 'cors' });
                    if (res) break;
                } catch (e) {
                    lastErr = e;
                    console.warn(`fetch to ${url} failed:`, e);
                    continue;
                }
            }
            if (!res) throw lastErr || new Error('fetch failed for all candidates');
            clearTimeout(t);
            if(!res.ok) return;
            const data = await res.json();
            const cpu = data.cpu_usage || [];
            if(coreCount !== cpu.length){ initWithCount(cpu.length || 24); }
            // push per-core values
            for(let i=0;i<coreCount;i++){
                const v = Number(cpu[i]) || 0;
                const arr = history[i]; arr.push(v); if(arr.length>MAX_POINTS) arr.shift();
            }
            // push total CPU (average of cores)
            const avg = cpu.length>0 ? cpu.reduce((s,x)=>s+Number(x||0),0)/cpu.length : 0;
            totalHistory.push(avg); if(totalHistory.length>MAX_POINTS) totalHistory.shift();
            // render each small canvas
            const canvases = document.getElementsByClassName('core-canvas');
            for(let i=0;i<canvases.length;i++){
                drawSmall(canvases[i], history[i], colors[i]);
            }
            // render total canvas
            const totalCanvas = document.getElementById('totalCpuCanvas');
            if(totalCanvas){ drawTotal(totalCanvas, totalHistory, '#1976d2'); }
            const totalValEl = document.getElementById('totalCpuVal');
            if(totalValEl){ const last = totalHistory[totalHistory.length-1] || 0; totalValEl.textContent = Math.round(last) + '%'; }
        }catch(e){ console.warn('cpu_page fetch failed', e); }
    }

    window.addEventListener('load', ()=>{
        initWithCount(24);
        fetchOnce();
        setInterval(fetchOnce, REFRESH_INTERVAL * 1000);
        window.addEventListener('resize', ()=>{ fetchOnce(); });
    });
})();
