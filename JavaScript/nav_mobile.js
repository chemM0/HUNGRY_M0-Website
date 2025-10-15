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
                document.body.classList.add('nav-open');
                var first = menu.querySelector('a, button, [tabindex]:not([tabindex="-1"])');
                if(first) first.focus();
            } else {
                menu.classList.remove('open');
                toggle.setAttribute('aria-expanded','false');
                document.body.classList.remove('nav-open');
                try{ toggle.focus(); }catch(e){}
            }
        }
        toggle.addEventListener('click', function(e){ e.preventDefault(); setOpen(!menu.classList.contains('open')); });
        toggle.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); setOpen(!menu.classList.contains('open')); } });
        document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && menu.classList.contains('open')) setOpen(false); });
        document.addEventListener('click', function(e){ if(menu.classList.contains('open') && !e.target.closest('#navMenu') && !e.target.closest('#navToggle')) setOpen(false); });

        // 子菜单折叠/展开（仅在小屏时启用）
        function bindSubmenus(){
            var parents = menu.querySelectorAll('li');
            parents.forEach(function(li){
                var sub = li.querySelector('ul');
                if(!sub) return;
                // 标记有子菜单的父项，便于添加指示器样式
                li.classList.add('has-submenu');
                var trigger = li.querySelector('a');
                if(!trigger) return;
                // 防止重复绑定
                if(trigger._submenuBound) return; trigger._submenuBound = true;
                trigger.addEventListener('click', function(ev){
                    // 仅在小屏并且菜单已打开时拦截链接，切换展开
                    if(window.matchMedia && window.matchMedia('(max-width: 768px)').matches && menu.classList.contains('open')){
                        ev.preventDefault();
                        li.classList.toggle('submenu-open');
                    }
                });
            });
        }
        // 初始绑定与在菜单打开时确保绑定就绪
        bindSubmenus();
        return true;
    }
    // 立即尝试绑定，并在 DOMContentLoaded 再尝试一次
    if(!bindMenu()){ document.addEventListener('DOMContentLoaded', bindMenu); }
})();
