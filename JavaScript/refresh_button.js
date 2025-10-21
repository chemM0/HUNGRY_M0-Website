// 全局刷新按钮处理器，带全屏动画
(function(){
    function createOverlay(){
        var existing = document.getElementById('pageRefreshOverlay');
        if(existing) return existing;
        var o = document.createElement('div');
        o.id = 'pageRefreshOverlay';
        o.className = 'page-refresh-overlay';
        var spinner = document.createElement('div');
        spinner.className = 'refresh-spinner';
        spinner.setAttribute('aria-hidden', 'true');
        o.appendChild(spinner);
        document.body.appendChild(o);
    void o.offsetWidth; // 强制回流（触发布局以确保过渡正常）
        return o;
    }

    function playRefreshAnimation(cb){
        var overlay = createOverlay();
        if(overlay.classList.contains('visible')) return cb && cb();
        var done = false;
        function finish(){ if(done) return; done = true; cb && cb(); }
        overlay.addEventListener('transitionend', function onEnd(e){
            if(e.target !== overlay) return;
            overlay.removeEventListener('transitionend', onEnd);
            finish();
        });
        setTimeout(finish, 900); // fallback
        requestAnimationFrame(function(){ overlay.classList.add('visible'); });
    }

    // 暴露基于 Promise 的接口，供其他脚本（如 page_transitions）复用同一遮罩动画
    window.showFullScreenTransition = function(){
        return new Promise(function(resolve){
            playRefreshAnimation(function(){ resolve(); });
        });
    };

    function init(){
        document.querySelectorAll('.refresh-btn').forEach(function(btn){
            if(btn.__refresh_bound) return;
            btn.__refresh_bound = true;
            btn.addEventListener('click', function(e){
                e.preventDefault();
                // 添加微交互样式
                btn.classList.add('pressed');
                // 启动图标旋转（CSS: .is-spinning）
                btn.classList.add('is-spinning');
                setTimeout(function(){ btn.classList.remove('pressed'); }, 160);
                playRefreshAnimation(function(){
                    // 在真正刷新前短暂移除旋转样式以避免在某些浏览器中残留
                    try{ btn.classList.remove('is-spinning'); }catch(e){}
                    window.location.reload();
                });
            });
        });
            // 事件委托处理：拦截 back-prev 按钮与带过渡的数据链接
            document.addEventListener('click', function(e){
                var el = e.target;
                // Walk up to find actionable element
                while(el && el !== document.documentElement){
                    // 向上查找可操作元素
                    // 处理具有类 'back-prev' 的元素 -> history.back()
                    if(el.classList && el.classList.contains('back-prev')){
                        e.preventDefault();
                        if(window.showFullScreenTransition){
                            window.showFullScreenTransition().then(function(){ history.back(); });
                        }else{ history.back(); }
                        return;
                    }

                    // handle elements which have data-transition="back" or data-transition="link:..."
                    var dt = el.getAttribute && el.getAttribute('data-transition');
                    if(dt){
                        e.preventDefault();
                        if(dt === 'back'){
                            if(window.showFullScreenTransition){ window.showFullScreenTransition().then(function(){ history.back(); }); }
                            else { history.back(); }
                            return;
                        }
                        // data-transition="link:somepage.html"
                        if(dt.indexOf('link:') === 0){
                            var href = dt.slice(5);
                            if(window.showFullScreenTransition){ window.showFullScreenTransition().then(function(){ window.location.href = href; }); }
                            else { window.location.href = href; }
                            return;
                        }
                    }

                    el = el.parentNode;
                }
            }, false);
    }

    // 移动端滚动时隐藏刷新按钮，停止后再显示
    function addScrollHideBehavior(){
        var btn = document.getElementById('refreshBtn');
        if(!btn) return;
        var timer = null;
        function hide(){ btn.classList.add('hidden-on-scroll'); }
        function show(){ btn.classList.remove('hidden-on-scroll'); }
        window.addEventListener('scroll', function(){
            hide();
            if(timer) clearTimeout(timer);
            timer = setTimeout(function(){ show(); }, 700);
        }, { passive: true });
    }

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    // setup scroll-hide behavior regardless (function will check for element presence)
    try{ addScrollHideBehavior(); }catch(e){}

    // 清理回到页面时可能残留的全屏刷新覆盖层
    function cleanupRefreshOverlay(){
        try{
            var ov = document.getElementById('pageRefreshOverlay');
            if(!ov) return;
            ov.classList.remove('visible');
            ov.style.opacity = '0';
            setTimeout(function(){ if(ov && ov.parentNode) ov.parentNode.removeChild(ov); }, 400);
        }catch(e){}
    }
    window.addEventListener('pageshow', function(){ cleanupRefreshOverlay(); });
    document.addEventListener('visibilitychange', function(){ if(document.visibilityState === 'visible') cleanupRefreshOverlay(); });
})();
