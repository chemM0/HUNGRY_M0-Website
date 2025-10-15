// 全站夜间模式开关（持久化到 localStorage）
(() => {
    const THEME_KEY = 'site_theme';

    function applyStoredTheme(){
        try{
            const stored = localStorage.getItem(THEME_KEY);
            if(stored === 'dark'){
                if(document.body) document.body.classList.add('dark'); else document.documentElement.classList.add('dark');
            } else if(stored === 'light'){
                if(document.body) document.body.classList.remove('dark'); else document.documentElement.classList.remove('dark');
            }
        }catch(e){ /* ignore */ }
    }

    function setTheme(isDark){
        try{
            if(isDark) {
                if(document.body) document.body.classList.add('dark'); else document.documentElement.classList.add('dark');
            } else {
                if(document.body) document.body.classList.remove('dark'); else document.documentElement.classList.remove('dark');
            }
            localStorage.setItem(THEME_KEY, isDark ? 'dark' : 'light');
        }catch(e){ /* ignore */ }
    }

    function updateButtonLabel(btn){
        if(!btn) return;
        const isDark = (document.body && document.body.classList.contains('dark')) || document.documentElement.classList.contains('dark');
        // 不直接修改 textContent（会导致重复图标），改为设置 data 属性供 CSS 伪元素使用
        btn.setAttribute('data-icon', isDark ? '☀️' : '🌙');
        btn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
        // 同步一个类，便于 CSS 更可靠地覆盖样式（提高 specificity）
        if(isDark) btn.classList.add('is-dark'); else btn.classList.remove('is-dark');
    }

    function bindToggle(){
        const btn = document.getElementById('darkToggle');
        if(!btn) return false;
        // 如果按钮被放在局部容器内，移动到 body 以确保 fixed 定位相对于视口生效
        try{
            if(btn.parentElement && btn.parentElement !== document.body){
                document.body.appendChild(btn);
            }
        }catch(e){ /* ignore */ }
        // 防止重复绑定（如果脚本被多次执行）
        if(btn.__dark_bound) return true;
        btn.__dark_bound = true;
        updateButtonLabel(btn);
        const doToggle = (e)=>{ if(e && e.preventDefault) e.preventDefault(); const isDark = !(document.body && document.body.classList.contains('dark')) && !document.documentElement.classList.contains('dark'); setTheme(isDark); updateButtonLabel(btn); };
        btn.addEventListener('click', doToggle);
        btn.addEventListener('keydown', (e)=>{ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); doToggle(e); } });
        // 同步初始类
        updateButtonLabel(btn);
        return true;
    }

    // 先尝试应用存储的主题，减少闪烁
    applyStoredTheme();

    // 尝试绑定一次；如果按钮稍后插入，则重试几次以确保绑定成功
    const tryBindOnce = ()=>{
        if(bindToggle()) return true;
        return false;
    };

    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', tryBindOnce);
    else tryBindOnce();

    // 如果首次未找到，重试（例如页面脚本稍后插入了按钮）——最大重试次数 10 次
    let attempts = 0;
    const retryInterval = setInterval(()=>{
        attempts++;
        if(tryBindOnce() || attempts >= 10) clearInterval(retryInterval);
    }, 200);
})();