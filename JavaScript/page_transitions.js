// 全局页面切换动画脚本：拦截内部链接，先播放退出动画再导航
(function(){
    const ANIM_DURATION = 700; // 单位ms，需与 CSS 中的 transition-duration 保持一致或略长
    const LOADER_MIN_MS = 400; // loader 最少显示时间

    function isInternalLink(a){
        try{
            const url = new URL(a.href, location.href);
            return url.origin === location.origin;
        }catch(e){ return false; }
    }

    // 页面加载时先设为进入态，下一帧移除以触发过渡
    document.addEventListener('DOMContentLoaded', ()=>{
        document.body.classList.add('page-enter');
        requestAnimationFrame(()=>{
            requestAnimationFrame(()=>{
                document.body.classList.remove('page-enter');
            });
        });
    });

    // 创建并插入加载条元素（如果不存在）
    function ensureLoader(){
        if(window.matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
        let l = document.getElementById('pageLoader');
        if(!l){ l = document.createElement('div'); l.id = 'pageLoader'; document.body.appendChild(l); }
        // ensure .bar and .pct exist
        if(!l.querySelector('.bar')){
            const bar = document.createElement('div'); bar.className = 'bar'; l.appendChild(bar);
        }
        if(!l.querySelector('.pct')){
            const pct = document.createElement('div'); pct.className = 'pct'; pct.textContent = '0%'; l.appendChild(pct);
        }
        return l;
    }

    // 统一的过渡函数：防止重复触发，更新 loader 和百分比，并在 ANIM_DURATION 后导航
    let _transitionInProgress = false;
    function startTransition(href){
        if(_transitionInProgress) return; // 忽略重复触发
        _transitionInProgress = true;
        // 如果用户偏好减少动画，则直接导航
        if(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){ location.href = href; return; }

        const loader = ensureLoader();
        if(loader){ loader.style.opacity = '1'; loader.style.width = '6%'; }
        document.body.classList.add('page-exit');
        const start = Date.now();
        const bar = loader ? loader.querySelector('.bar') : null;
        const pctEl = loader ? loader.querySelector('.pct') : null;

        const step = setInterval(()=>{
            if(!loader) return;
            const elapsed = Date.now() - start;
            // 按 ANIM_DURATION 比例推进百分比，使所有路径时长一致
            const pct = Math.min(99, Math.round(6 + (elapsed / ANIM_DURATION) * 90));
            if(bar) bar.style.width = pct + '%';
            if(pctEl) pctEl.textContent = pct + '%';
        }, 80);

        setTimeout(()=>{
            clearInterval(step);
            if(bar){ bar.style.width = '100%'; }
            if(pctEl) pctEl.textContent = '100%';
            const wait = Math.max(0, LOADER_MIN_MS - (Date.now() - start));
            setTimeout(()=>{ _transitionInProgress = false; location.href = href; }, wait);
        }, ANIM_DURATION);
    }

    // 拦截点击并调用统一过渡
    document.addEventListener('click', (e)=>{
        const a = e.target.closest && e.target.closest('a');
        if(!a) return;
        if(!isInternalLink(a)) return;
        if(a.hasAttribute('data-no-transition')) return;
        if(e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        e.preventDefault();
        startTransition(a.href);
    });

    // 支持 programmatic navigation: window.navigateWithTransition(url)
    window.navigateWithTransition = function(url){ startTransition(url); };
})();
