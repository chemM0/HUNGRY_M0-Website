// Modernize existing refresh buttons and ensure click works reliably
// Refresh button has been intentionally disabled site-wide. The original script
// enhanced or created a corner refresh button; to remove the desktop refresh
// affordance we make this module a no-op. If you later want to re-enable it,
// remove this early return and restore the original implementation below.
(function(){
    // no-op: do not create or enhance refresh buttons
    return;
    function enhanceButton(btn){
        if(!btn || btn.__modernized) return;
        btn.__modernized = true;

        // keep accessible label
        var aria = btn.getAttribute('aria-label') || '刷新页面';

                // Replace inner HTML: visible short text + icon (text will be hidden on small screens)
                btn.innerHTML =
                                '<span class="refresh-btn__text">刷新</span>' +
                                '<span class="refresh-btn__icon" aria-hidden="true">' +
                                    '<svg class="svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">' +
                                        '<path d="M12 6V3L8 7l4 4V8a4 4 0 1 1-4 4H6a6 6 0 1 0 6-6z"/>' +
                                    '</svg>' +
                                '</span>';

                // ensure accessible label is on the button (screen readers) but not visible
                try{ btn.setAttribute('aria-label', aria); }catch(e){}

        // Defensive cleanup: remove any stray text nodes that contain only plus signs or whitespace
        Array.prototype.slice.call(btn.childNodes).forEach(function(node){
                if(node.nodeType === Node.TEXT_NODE && /^[\s\+]+$/.test(node.nodeValue)){
                        node.parentNode.removeChild(node);
                }
        });

        // mark for CSS to apply modern look
        btn.classList.add('modern-refresh');

        function doReload(){
            // quick micro-interaction
            btn.classList.add('pressed');
            btn.classList.add('is-spinning');
            // small delay so user sees feedback; then reload
            setTimeout(function(){
                try{ btn.classList.remove('is-spinning'); }catch(e){}
                // use normal reload
                window.location.reload();
            }, 260);
        }

        btn.addEventListener('click', function(e){
            e.preventDefault();
            doReload();
        });

        // keyboard accessibility: Enter / Space
        btn.addEventListener('keydown', function(e){
            if(e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar'){
                e.preventDefault();
                doReload();
            }
        });

        // Observe future mutations in case other scripts inject stray text nodes (e.g. '+')
        try{
            var mo = new MutationObserver(function(mutations){
                mutations.forEach(function(m){
                    if(m.type === 'childList' && m.addedNodes && m.addedNodes.length){
                        Array.prototype.slice.call(m.addedNodes).forEach(function(node){
                            if(node.nodeType === Node.TEXT_NODE && /^[\s\+]+$/.test(node.nodeValue)){
                                node.parentNode && node.parentNode.removeChild(node);
                            }
                        });
                    }
                });
            });
            mo.observe(btn, { childList: true, subtree: false });
            // store to allow future disconnect if needed
            btn.__refresh_observer = mo;
        }catch(e){ /* ignore if MutationObserver unavailable */ }
    }

    function init(){
        // enhance any existing #refreshBtn or elements with .refresh-btn
        var els = Array.prototype.slice.call(document.querySelectorAll('#refreshBtn, .refresh-btn'));
        if(els.length === 0){
            // If none exist, create a single modern button (fallback)
            var btn = document.createElement('button');
            btn.id = 'refreshBtn';
            btn.className = 'refresh-btn modern-refresh';
            btn.setAttribute('aria-label', '刷新页面');
            document.body.appendChild(btn);
            els.push(btn);
        }

        els.forEach(function(b){ enhanceButton(b); });
    }

    if(document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
