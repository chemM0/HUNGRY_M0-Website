(function(){
    const API = (typeof VISITOR_API_URL !== 'undefined') ? VISITOR_API_URL : (window.location.origin.replace(/:\/\/[^/]+$/, '') + '') ;
    // Prefer explicit URL via global VISITOR_API_URL, fallback to relative /api/visitors.php
    const endpoint = (typeof VISITOR_API_URL !== 'undefined') ? VISITOR_API_URL : (window.location.origin + '/api/visitors.php');

    function getEl(id){ return document.getElementById(id); }

    function updateUI(data){
        const siteEl = getEl('busuanzi_site_pv');
        const todayEl = getEl('busuanzi_today_site_pv');
        if(siteEl && typeof data.site_pv !== 'undefined') siteEl.textContent = String(data.site_pv);
        if(todayEl && typeof data.today_pv !== 'undefined') todayEl.textContent = String(data.today_pv);
    }

    // If no API available, fallback to localStorage
    function localFallback(){
        try{
            let pv = parseInt(localStorage.getItem('local_site_pv') || '0', 10);
            pv = pv + 1;
            localStorage.setItem('local_site_pv', String(pv));
            updateUI({site_pv: pv, today_pv: pv});
        }catch(e){ console.warn('local fallback failed', e); }
    }

    async function fetchAndInc(){
        // 如果是本地 file:// 访问，不统计，只显示本地计数或占位符
        if(window.location.protocol === 'file:'){
            updateUI({site_pv: '--', today_pv: '--'});
            return;
        }
        try{
            // First: try to POST increment
            const postRes = await fetch(endpoint, { method: 'POST', mode: 'cors' });
            if(!postRes.ok){ throw new Error('post failed'); }
            const json = await postRes.json();
            updateUI(json);
        }catch(e){
            console.warn('visitor API failed, falling back to GET or local', e);
            try{
                const getRes = await fetch(endpoint, { method: 'GET', mode: 'cors' });
                if(getRes.ok){
                    const j = await getRes.json();
                    updateUI(j);
                    return;
                }
            }catch(er){ /* ignore */ }
            localFallback();
        }
    }

    // Run on DOM ready
    if(document.readyState === 'loading'){
        document.addEventListener('DOMContentLoaded', fetchAndInc);
    } else {
        fetchAndInc();
    }
})();
