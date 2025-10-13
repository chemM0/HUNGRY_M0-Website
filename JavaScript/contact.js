
// 点击卡片弹出二维码模态，模态内提供回退链接按钮
document.addEventListener('DOMContentLoaded', function(){
	const modal = document.createElement('div');
	modal.id = 'qrModal';
	modal.className = 'qr-modal';
	modal.innerHTML = `
		<div class="qr-backdrop"></div>
		<div class="qr-panel" role="dialog" aria-modal="true">
			<button class="qr-close" aria-label="关闭">✕</button>
			<div class="qr-content">
				<img id="qrImage" src="" alt="二维码" />
				<div id="qrLabel" class="qr-label">扫描二维码加我</div>
				<a id="qrDownload" class="btn" target="_blank" rel="noopener" download>下载二维码</a>
			</div>
		</div>
	`;
	document.body.appendChild(modal);

	const qrImage = document.getElementById('qrImage');
	const qrDownload = document.getElementById('qrDownload');
	const qrClose = modal.querySelector('.qr-close');
	const qrBackdrop = modal.querySelector('.qr-backdrop');

	// 强制下载：使用 fetch 获取图片并生成 blob，再创建临时链接触发下载
	qrDownload.addEventListener('click', async function (ev) {
		ev.preventDefault();
		const href = qrDownload.href;
		if (!href) return;
		// 如果 href 是锚('#') 或 javascript 之类，回退
		if (href === '#' || href.startsWith('javascript:')) return;
		try {
			qrDownload.textContent = '下载中...';
			const resp = await fetch(href, { mode: 'cors' });
			if (!resp.ok) throw new Error('network');
			const blob = await resp.blob();
			const url = URL.createObjectURL(blob);
			const a = document.createElement('a');
			a.href = url;
			a.download = qrDownload.getAttribute('download') || 'qrcode.png';
			document.body.appendChild(a);
			a.click();
			a.remove();
			URL.revokeObjectURL(url);
		} catch (err) {
			// 发生错误（如 CORS），回退到在新标签打开
			window.open(href, '_blank');
		} finally {
			qrDownload.textContent = '下载二维码';
		}
	});

	function openModal(imgSrc, webUrl, label) {
		qrImage.src = imgSrc || '';
		document.getElementById('qrLabel').textContent = label || '扫描二维码加我';
		if (imgSrc) {
			// configure download link to the QR image
			qrDownload.href = imgSrc;
			qrDownload.setAttribute('download', 'qrcode.png');
			qrDownload.style.display = '';
		} else if (webUrl) {
			// if no image, repurpose as open web link
			qrDownload.href = webUrl;
			qrDownload.removeAttribute('download');
			qrDownload.style.display = '';
		} else {
			qrDownload.style.display = 'none';
		}
		modal.classList.add('open');
		// focus for accessibility
		qrClose.focus();
	}
	function closeModal(){ modal.classList.remove('open'); }

	qrClose.addEventListener('click', closeModal);
	qrBackdrop.addEventListener('click', closeModal);
	document.addEventListener('keydown', function(e){ if(e.key === 'Escape') closeModal(); });

	// Make cards focusable and support keyboard; use event delegation to reliably catch clicks
	const grid = document.querySelector('.contact-grid');
	if (grid) {
		// make each card focusable
		grid.querySelectorAll('.contact-card').forEach(c=>{ if(!c.hasAttribute('tabindex')) c.setAttribute('tabindex', '0'); });

		grid.addEventListener('click', function(e){
			const card = e.target.closest && e.target.closest('.contact-card');
			if(!card) return;
			const qr = card.getAttribute('data-qr');
			const web = card.getAttribute('data-web');
			const label = card.querySelector('.contact-label')?.textContent || '';
			if(!qr){ window.open(web, '_blank'); return; }
			openModal(qr, web, label);
		});

		// keyboard support: Enter or Space opens the card
		grid.addEventListener('keydown', function(e){
			if(e.key !== 'Enter' && e.key !== ' ') return;
			const card = e.target.closest && e.target.closest('.contact-card');
			if(!card) return;
			e.preventDefault();
			const qr = card.getAttribute('data-qr');
			const web = card.getAttribute('data-web');
			const label = card.querySelector('.contact-label')?.textContent || '';
			if(!qr){ window.open(web, '_blank'); return; }
			openModal(qr, web, label);
		});
	}
});