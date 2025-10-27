(function(){
  const API = (typeof window !== 'undefined' && window.GUESTBOOK_API_URL) ? window.GUESTBOOK_API_URL : 'wwwroot/api/guestbook.php';
  const form = document.getElementById('guestbookForm');
  const list = document.getElementById('guestbookList');

  function esc(s){
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  function renderItems(items){
    if(!list) return;
    list.setAttribute('aria-busy','true');
    list.innerHTML = '';
    (items||[]).slice(0,8).forEach(it =>{
      const li = document.createElement('li');
      li.className = 'guestbook-item';
      const avatarText = (it.name||'?').trim().charAt(0).toUpperCase() || '?';
      li.innerHTML = `
        <div class="gb-avatar" aria-hidden="true">${esc(avatarText)}</div>
        <div class="gb-main">
          <div class="gb-head"><span class="gb-name">${esc(it.name||'匿名')}</span><span class="gb-time">${esc(it.time||'')}</span></div>
          <div class="gb-text">${esc(it.message||'')}</div>
        </div>`;
      list.appendChild(li);
    });
    list.setAttribute('aria-busy','false');
  }

  async function load(){
    try{
      const res = await fetch(API + '?t=' + Date.now(), {cache:'no-store'});
      const data = await res.json();
      if(data && data.ok) renderItems(data.items||[]);
      else throw new Error(data && data.error || '加载失败');
    }catch(e){
      if(list){
        list.innerHTML = `<li class="guestbook-item"><div class="gb-main"><div class="gb-text">加载留言失败：${esc(e.message||e)}</div></div></li>`;
      }
    }
  }

  async function submit(e){
    e.preventDefault();
    if(!form) return;
    const name = (document.getElementById('gb_name')||{}).value || '';
    const message = (document.getElementById('gb_message')||{}).value || '';
    const btn = form.querySelector('.gb-submit');
    btn && (btn.disabled = true);
    try{
      const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name, message})
      });
      const data = await res.json();
      if(!data.ok) throw new Error(data.error||'提交失败');
      // 清空并刷新
      (document.getElementById('gb_message')||{}).value = '';
      await load();
    }catch(e){
      alert('提交失败：' + (e.message||e));
    }finally{
      btn && (btn.disabled = false);
    }
  }

  if(form){ form.addEventListener('submit', submit); }
  if(list){ load(); }
})();
