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
    // Ensure loader is exposed to assistive tech / rendering immediately
    try{ loader.removeAttribute('aria-hidden'); }catch(e){}

    // 准备百分比显示元素（如果 markup 中没有，则创建）
    var percentEl = loader.querySelector('.loader-percent');
    if(!percentEl){
      var inner = loader.querySelector('.loader-inner') || loader;
      percentEl = document.createElement('div');
      percentEl.className = 'loader-percent';
      inner.appendChild(percentEl);
    }

    function setDisplayProgress(pct){
      currentProgress = Math.max(0, Math.min(100, pct));
      if(percentEl){
        try{ percentEl.textContent = Math.round(currentProgress) + '%'; }catch(e){}
      }
    }
    setDisplayProgress(0);

    // 尝试基于页面资源的真实加载进度：统计 img, link[rel=stylesheet], script[src], video/audio
    function collectResources(){
      var nodes = [];
      try{
        document.querySelectorAll('img[src]').forEach(function(i){ nodes.push({el:i, url:i.currentSrc||i.src, type:'img'}); });
        document.querySelectorAll('link[rel="stylesheet"][href]').forEach(function(l){ nodes.push({el:l, url:l.href, type:'css'}); });
        document.querySelectorAll('script[src]').forEach(function(s){ nodes.push({el:s, url:s.src, type:'script'}); });
        document.querySelectorAll('video[src], audio[src]').forEach(function(m){ nodes.push({el:m, url:m.currentSrc||m.src, type:'media'}); });
      }catch(e){ /* ignore DOM access errors */ }
      // 去重 URL
      var seen = {};
      var uniq = [];
      nodes.forEach(function(n){ try{ var key = String(n.url||'').split('#')[0]; if(!key) return; if(!seen[key]){ seen[key]=true; uniq.push(n); } }catch(e){} });
      return uniq;
    }

    var resources = collectResources();
    var total = resources.length;
    var doneCount = 0;

    function setProgressFromCounts(){
      if(!barEl) return;
      // 保持最小起步在 5%，最大在 98%（未完成前）
      var pct = total > 0 ? (5 + (doneCount / total) * 90) : 0;
      pct = Math.min(98, Math.max(5, pct));
      setDisplayProgress(pct);
    }

    if(total === 0){
      // 没有可监控资源，回退到小幅模拟（保持快速感）
      setDisplayProgress(8);
      if(progressTimer) clearInterval(progressTimer);
      progressTimer = setInterval(function(){ currentProgress = Math.min(95, currentProgress + (0.5 + Math.random()*0.8)); setDisplayProgress(currentProgress); }, 180);
    } else {
      // 监听每个资源的 load/error 状态
      resources.forEach(function(r){
        var el = r.el;
        var handled = false;
        function mark(){ if(handled) return; handled = true; doneCount++; setProgressFromCounts(); }
        // For images, check .complete
        try{
          if(r.type === 'img' && el.complete && el.naturalWidth !== 0){ mark(); return; }
        }catch(e){}
        // For stylesheet/script, try to detect via performance entries
        try{
          if(performance && performance.getEntriesByType){
            var entries = performance.getEntriesByType('resource') || [];
            for(var i=0;i<entries.length;i++){ if(entries[i].name && entries[i].name.split('#')[0] === (r.url||'').split('#')[0]){ mark(); break; } }
            if(handled) return;
          }
        }catch(e){}

        // Attach listeners with per-resource timeout
        var onLoad = function(){ mark(); cleanup(); };
        var onError = function(){ mark(); cleanup(); };
        var cleanup = function(){ try{ el.removeEventListener('load', onLoad); el.removeEventListener('error', onError); }catch(e){} if(resTimeout) clearTimeout(resTimeout); };
        try{ el.addEventListener('load', onLoad); el.addEventListener('error', onError); }catch(e){ /* some elements might not support events */ }
        var resTimeout = setTimeout(function(){ mark(); cleanup(); }, Math.min(4000, LOAD_TIMEOUT));
      });
      // 初始化时立即更新一次百分比
      try{ setProgressFromCounts(); }catch(e){ /* ignore */ }
    }

    // 如果页面已经完全加载（可能脚本延迟加载），立即隐藏
    if(document.readyState === 'complete'){
      hideLoader('document.complete');
      return;
    }

    // 当 window load 触发时，消失
    window.addEventListener('load', function(){
      // 把进度直接推进到 100% 并短延时后隐藏
      try{ setDisplayProgress(100); }catch(e){}
      setTimeout(function(){ hideLoader('window.load'); }, 260);
    });

  // 以防某些资源阻塞较久，设置超时：在超时前推进到 100% 并隐藏
  setTimeout(function(){ try{ setDisplayProgress(100); }catch(e){}; hideLoader('timeout'); }, LOAD_TIMEOUT);

  // 在 DOMContentLoaded 后短延迟自动隐藏遮罩，提升首屏响应速度
  // 保留 window.load 和超时作为回退方案
  try{
    setTimeout(function(){
      if(loader && !loader.classList.contains('hidden')){
        try{ setDisplayProgress(100); }catch(e){}
        hideLoader('domcontentloaded-auto');
      }
    }, 300);
  }catch(e){ /* ignore */ }

    // 允许用户通过点击跳过（无障碍友好）
    loader.addEventListener('click', function(){ hideLoader('user.click'); });
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', setup);
  } else {
    setup();
  }
})();
