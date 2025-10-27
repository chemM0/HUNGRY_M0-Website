(function(){
  const API = (typeof window !== 'undefined' && window.GUESTBOOK_API_URL) ? window.GUESTBOOK_API_URL : 'https://watchmedo.hungry.top/guestbook.php';

  function esc(s){
    return String(s||'').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[c]));
  }

  // elements (support inline + sheet)
  const forms = Array.from(document.querySelectorAll('form.guestbook-form'));
  const lists = [document.getElementById('guestbookList'), document.getElementById('guestbookListSheet')].filter(Boolean);

  function getInputs(scope){
    const name = scope.querySelector('input[name="name"]');
    const msg = scope.querySelector('textarea[name="message"]');
    return {name, msg};
  }

  function renderItems(items){
    lists.forEach(list =>{
      if(!list) return;
      list.setAttribute('aria-busy','true');
      list.innerHTML = '';
      (items||[]).slice(0,8).forEach(it =>{
        const li = document.createElement('li');
        li.className = 'guestbook-item';
        const avatarText = (it.name||'?').trim().charAt(0).toUpperCase() || '?';
        const region = it.region ? ` · <span class="gb-region">${esc(it.region)}</span>` : '';
        li.innerHTML = `
          <div class="gb-avatar" aria-hidden="true">${esc(avatarText)}</div>
          <div class="gb-main">
            <div class="gb-head">
              <span class="gb-name">${esc(it.name||'匿名')}</span>
              <span class="gb-time">${esc(it.time||'')}</span>${region}
              <button class="gb-del" data-id="${esc(it.id)}" title="删除该留言">删除</button>
            </div>
            <div class="gb-text">${esc(it.message||'')}</div>
          </div>`;
        list.appendChild(li);
      });
      list.setAttribute('aria-busy','false');
    });
  }

  async function load(){
    try{
      const res = await fetch(API + '?t=' + Date.now(), {cache:'no-store'});
      const text = await res.text();
      let data;
      try{ data = JSON.parse(text); }catch(parseErr){
        const snippet = text.slice(0,120).replace(/\s+/g,' ').trim();
        throw new Error(`非 JSON 响应：${snippet}`);
      }
      if(data && data.ok) renderItems(data.items||[]);
      else throw new Error(data && data.error || '加载失败');
    }catch(e){
      lists.forEach(list=>{
        if(list){ list.innerHTML = `<li class="guestbook-item"><div class="gb-main"><div class="gb-text">加载留言失败：${esc(e.message||e)}</div></div></li>`; }
      });
    }
  }

  async function submit(e){
    e.preventDefault();
    const form = e.currentTarget;
    const {name, msg} = getInputs(form);
    const btn = form.querySelector('.gb-submit');
    const nameVal = (name && name.value) || '';
    const messageVal = (msg && msg.value) || '';
    if(!messageVal.trim()) return;
    btn && (btn.disabled = true);
    try{
      const res = await fetch(API, {
        method: 'POST',
        headers: {'Content-Type':'application/json'},
        body: JSON.stringify({name: nameVal, message: messageVal})
      });
      const text = await res.text();
      let data; try{ data = JSON.parse(text); }catch(_){ throw new Error(`提交失败：非 JSON 响应`); }
      if(!data.ok) throw new Error(data.error||'提交失败');
      // 记住昵称
      try{ localStorage.setItem('gb_name', nameVal); }catch(_){}
      // 清空消息框
      if(msg) msg.value = '';
      await load();
    }catch(e){
      alert('提交失败：' + (e.message||e));
    }finally{
      btn && (btn.disabled = false);
    }
  }

  // 删除逻辑：弹出输入框输入管理员密码（仅本地验证 UI），后端校验哈希
  async function onDelete(id){
    if(!id) return;
    let token = '';
    try{ token = localStorage.getItem('gb_admin_token') || ''; }catch(_){ token = ''; }
    if(!token){ token = prompt('请输入管理员密码以删除该留言：') || ''; }
    if(!token) return;
    try{
  const res = await fetch(API, { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ action:'delete', id, token }) });
  const text = await res.text();
  let data; try{ data = JSON.parse(text); }catch(_){ throw new Error('删除失败：非 JSON 响应'); }
      if(!data.ok) throw new Error(data.error||'删除失败');
      try{ localStorage.setItem('gb_admin_token', token); }catch(_){ }
      await load();
    }catch(e){ alert('删除失败：' + (e.message||e)); }
  }

  document.addEventListener('click', function(e){
    const btn = e.target.closest('.gb-del');
    if(btn){ e.preventDefault(); onDelete(btn.getAttribute('data-id')); }
  });

  // 名称记忆
  try{
    const saved = localStorage.getItem('gb_name');
    if(saved){
      forms.forEach(f=>{ const ins = getInputs(f); if(ins.name) ins.name.value = saved; });
    }
  }catch(_){ }

  // 绑定提交
  forms.forEach(f=> f.addEventListener('submit', submit));
  load();

  // 移动端抽屉开关
  const sheet = document.getElementById('guestbookSheet');
  const openBtn = document.getElementById('gbOpenBtn');
  function lockScroll(lock){ document.documentElement.style.overflow = lock ? 'hidden' : ''; document.body.style.overflow = lock ? 'hidden' : ''; }
  function openSheet(){ if(!sheet) return; sheet.classList.add('is-open'); sheet.setAttribute('aria-hidden','false'); lockScroll(true); }
  function closeSheet(){ if(!sheet) return; sheet.classList.add('is-closing'); setTimeout(()=>{ sheet.classList.remove('is-open','is-closing'); sheet.setAttribute('aria-hidden','true'); lockScroll(false); }, 260); }
  if(openBtn){ openBtn.addEventListener('click', openSheet); }
  if(sheet){
    sheet.addEventListener('click', function(e){ if(e.target.matches('[data-close="gb"], .gb-sheet__backdrop')) closeSheet(); });
    document.addEventListener('keydown', function(e){ if(e.key==='Escape' && sheet.classList.contains('is-open')) closeSheet(); });
  }
})();
