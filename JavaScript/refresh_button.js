// Global refresh button handler with fullscreen animation
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
        void o.offsetWidth; // force reflow
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

    // Expose a Promise-based API so other scripts (page_transitions) can reuse the same overlay animation
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
                btn.classList.add('pressed');
                setTimeout(function(){ btn.classList.remove('pressed'); }, 160);
                playRefreshAnimation(function(){ window.location.reload(); });
            });
        });
            // Delegate handler: intercept back-prev buttons and other transition links
            document.addEventListener('click', function(e){
                var el = e.target;
                // Walk up to find actionable element
                while(el && el !== document.documentElement){
                    // handle elements with class 'back-prev' -> history.back()
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

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
