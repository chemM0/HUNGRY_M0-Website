(function(){
  // 超时时间（毫秒）：即使资源未完全加载，也会在此后隐藏加载遮罩以避免永久阻塞
  var LOAD_TIMEOUT = 6000;
  var loader = null;
  var start = Date.now();
  var progressTimer = null;
  var currentProgress = 0;

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
      // 停止进度计时器
      if(progressTimer){ clearInterval(progressTimer); progressTimer = null; }
    });
  }

  // 在 DOMContentLoaded 后，若页面资源尚未就绪，继续等 window.load 或超时
  function setup(){
    loader = document.getElementById('site-loader');
    if(!loader) return;

    // 准备进度条元素（如果 markup 中已有 .loader-progress，则使用它）
    var prog = loader.querySelector('.loader-progress');
    if(!prog){
      // 创建进度条结构并插入到 loader-inner
      var inner = loader.querySelector('.loader-inner') || loader;
      var pwrap = document.createElement('div');
      pwrap.className = 'loader-progress';
      var bar = document.createElement('div'); bar.className = 'progress-bar';
      pwrap.appendChild(bar);
      inner.appendChild(pwrap);
      prog = pwrap;
    }
    var barEl = prog.querySelector('.progress-bar');
    if(barEl){
      // 初始化进度并启动模拟器
      currentProgress = 4 + Math.random() * 6; // 从 4-10% 起步
      barEl.style.width = currentProgress + '%';
      if(progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(function(){
        // 模拟加速-减速：当接近 90% 时放慢增长
        var incr = (currentProgress < 50) ? (0.8 + Math.random()*1.6) : (currentProgress < 80 ? (0.3 + Math.random()*0.6) : (currentProgress < 95 ? (0.05 + Math.random()*0.2) : 0));
        currentProgress = Math.min(99.2, currentProgress + incr);
        barEl.style.width = currentProgress + '%';
      }, 120);
    }

    // 如果页面已经完全加载（可能脚本延迟加载），立即隐藏
    if(document.readyState === 'complete'){
      hideLoader('document.complete');
      return;
    }

    // 当 window load 触发时，消失
    window.addEventListener('load', function(){
      // 把进度直接推进到 100% 并短延时后隐藏
      try{ var bar = loader.querySelector('.progress-bar'); if(bar){ bar.style.width = '100%'; currentProgress = 100; } }catch(e){}
      setTimeout(function(){ hideLoader('window.load'); }, 260);
    });

  // 以防某些资源阻塞较久，设置超时：在超时前推进到 100% 并隐藏
  setTimeout(function(){ try{ var bar = loader.querySelector('.progress-bar'); if(bar){ bar.style.width = '100%'; currentProgress = 100; } }catch(e){}; hideLoader('timeout'); }, LOAD_TIMEOUT);

    // 允许用户通过点击跳过（无障碍友好）
    loader.addEventListener('click', function(){ hideLoader('user.click'); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
