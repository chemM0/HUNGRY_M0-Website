// 全站移动端导航绑定（在每个页面都可安全加载）
(function(){
    function bindMenu(){
        var toggle = document.getElementById('navToggle');
        var menu = document.getElementById('navMenu');
        if(!toggle || !menu) return false;
        function setOpen(open){
            if(open){
                menu.classList.add('open');
                toggle.setAttribute('aria-expanded','true');
                var first = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
                if(first) first.focus();
            } else {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded','false');
                try{ toggle.focus(); }catch(e){}
            }
        }
        toggle.addEventListener('click', function(e){ e.preventDefault(); setOpen(!menu.classList.contains('open')); });
        toggle.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setOpen(!menu.classList.contains('open')); } });
        document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menu.classList.contains('open')) setOpen(false); });
        document.addEventListener('click', function(e){ if(menu.classList.contains('open') && !e.target.closest('#navMenu') && !e.target.closest('#navToggle')) setOpen(false); });
        return true;
    }
    // 立即尝试绑定，并在 DOMContentLoaded 再尝试一次
    if(!bindMenu()){ document.addEventListener('DOMContentLoaded', bindMenu); }
})();
