document.addEventListener('DOMContentLoaded', function () {
  const nav = document.querySelector('.docs-nav');
  const navLinks = document.querySelectorAll('.docs-nav a');
  const sections = document.querySelectorAll('.doc-step[id]');
  if (!navLinks.length || !sections.length) return;

  // helper: center a nav item horizontally inside the scroll container
  function centerNavItem(el) {
    if (!el || !nav) return;
    // use scrollIntoView with inline center for smooth UX on mobile
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        history.replaceState(null, '', '#' + id);
        navLinks.forEach(a => a.classList.remove('active'));
        this.classList.add('active');
      }
    });
  });

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      const id = entry.target.id;
      const link = document.querySelector('.docs-nav a[href="#' + id + '"]');
      if (entry.isIntersecting) {
        navLinks.forEach(a => a.classList.remove('active'));
        if (link) {
          link.classList.add('active');
          // center the active link in the nav bar on narrow screens
          if (window.matchMedia('(max-width: 900px)').matches) {
            centerNavItem(link);
          }
        }
      }
    });
  }, { root: null, rootMargin: '0px 0px -40% 0px', threshold: 0.15 });

  sections.forEach(s => observer.observe(s));

  // activate hash on load
  if (location.hash) {
    const link = document.querySelector('.docs-nav a[href="' + location.hash + '"]');
    if (link) {
      navLinks.forEach(a => a.classList.remove('active'));
      link.classList.add('active');
      if (window.matchMedia('(max-width: 900px)').matches) centerNavItem(link);
    }
  }

  // ensure current active stays centered on resize/orientation change
  window.addEventListener('resize', () => {
    const active = document.querySelector('.docs-nav a.active');
    if (active && window.matchMedia('(max-width: 900px)').matches) centerNavItem(active);
  });

  // keyboard support
  navLinks.forEach(a => a.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); }
  }));

});
