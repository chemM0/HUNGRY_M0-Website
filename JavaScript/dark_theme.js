// 全站夜间模式开关（持久化到 localStorage）
(() => {
    // 夜间模式滑动开关逻辑
    const THEME_KEY = 'site_theme';

    function syncSwitchState() {
        const switchInput = document.getElementById('darkModeSwitch');
        if (!switchInput) return;
        const stored = localStorage.getItem(THEME_KEY);
        switchInput.checked = (stored === 'dark');
    }

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
            syncSwitchState();
        }catch(e){ /* ignore */ }
    }

    document.addEventListener('DOMContentLoaded', syncSwitchState);
    document.addEventListener('DOMContentLoaded', function() {
        const switchInput = document.getElementById('darkModeSwitch');
        if (switchInput) {
            switchInput.addEventListener('change', function(e) {
                setTheme(switchInput.checked);
            });
        }
    });

    applyStoredTheme();
})();

