// Global refresh button handler
(function(){
    function init(){
        document.querySelectorAll('.refresh-btn').forEach(function(btn){
            if(btn.__refresh_bound) return;
            btn.__refresh_bound = true;
            btn.addEventListener('click', function(e){
                e.preventDefault();
                // small pressed visual
                btn.classList.add('pressed');
                setTimeout(function(){ btn.classList.remove('pressed'); }, 160);
                // reload the page
                window.location.reload();
            });
        });
    }
    if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
