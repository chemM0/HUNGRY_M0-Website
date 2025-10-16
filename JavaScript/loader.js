(function(){
  // 超时时间（毫秒）：即使资源未完全加载，也会在此后隐藏加载遮罩以避免永久阻塞
  var LOAD_TIMEOUT = 6000;
  var loader = null;
  var start = Date.now();

  function hideLoader(reason){
    if(!loader) loader = document.getElementById('site-loader');
    if(!loader) return;
    if(loader.classList.contains('hidden')) return;
    // 记录耗时
    var took = Date.now() - start;
    try{ console.log('[loader] hiding, reason=', reason, ', took=', took + 'ms'); } catch(e){}
    // 增加小延时以便用户看到短暂动画
    requestAnimationFrame(function(){
      loader.classList.add('hidden');
      // 从 DOM 中移除，避免占用结构层级
      setTimeout(function(){ if(loader && loader.parentNode) loader.parentNode.removeChild(loader); }, 600);
    });
  }

  // 在 DOMContentLoaded 后，若页面资源尚未就绪，继续等 window.load 或超时
  function setup(){
    loader = document.getElementById('site-loader');
    if(!loader) return;

    // 如果页面已经完全加载（可能脚本延迟加载），立即隐藏
    if(document.readyState === 'complete'){
      hideLoader('document.complete');
      return;
    }

    // 当 window load 触发时，消失
    window.addEventListener('load', function(){ hideLoader('window.load'); });

    // 以防某些资源阻塞较久，设置超时
    setTimeout(function(){ hideLoader('timeout'); }, LOAD_TIMEOUT);

    // 允许用户通过点击跳过（无障碍友好）
    loader.addEventListener('click', function(){ hideLoader('user.click'); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
