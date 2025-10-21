document.addEventListener('DOMContentLoaded', function () {
  const nav = document.querySelector('.docs-nav');
  const navLinks = document.querySelectorAll('.docs-nav a');
  const sections = document.querySelectorAll('.doc-step[id]');
  if (!navLinks.length || !sections.length) return;

  // track user interaction with the nav so automatic centering doesn't fight touch gestures
  let isUserInteractingNav = false;
  let navInteractionTimer = null;
  if (nav) {
    // pointer events for most browsers
    nav.addEventListener('pointerdown', function () { isUserInteractingNav = true; if (navInteractionTimer) clearTimeout(navInteractionTimer); }, { passive: true });
    document.addEventListener('pointerup', function () { if (navInteractionTimer) clearTimeout(navInteractionTimer); navInteractionTimer = setTimeout(function () { isUserInteractingNav = false; }, 250); }, { passive: true });
    // fallback for older touch-only browsers
    nav.addEventListener('touchstart', function () { isUserInteractingNav = true; if (navInteractionTimer) clearTimeout(navInteractionTimer); }, { passive: true });
    nav.addEventListener('touchend', function () { if (navInteractionTimer) clearTimeout(navInteractionTimer); navInteractionTimer = setTimeout(function () { isUserInteractingNav = false; }, 250); }, { passive: true });
  }

  // helper: center a nav item horizontally inside the scroll container
  function centerNavItem(el) {
    if (!el || !nav) return;
    // if the user is currently touching/dragging the nav or actively scrolling,
    // don't auto-center. This prevents scripts from fighting native touch gestures
    // which can cause the page to jump or snap back on some mobile browsers.
    if (isUserInteractingNav || userIsScrolling) return;
    // use scrollIntoView with inline center for smooth UX on mobile
    el.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
  }

  navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const id = this.getAttribute('href').slice(1);
      const target = document.getElementById(id);
      if (target) {
        // Only programmatically scroll when the user is not actively scrolling.
        // If the user was just scrolling/dragging, skip forcing scrollIntoView to
        // avoid fighting native gestures; still update history and active state.
        if (!userIsScrolling) {
          target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
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

  // Global guard: detect user scroll/drag interactions to avoid scripts hijacking scroll
  // When user is actively scrolling/touching, we set a flag for a short time to suppress auto actions
  let userIsScrolling = false;
  let userScrollTimer = null;

  function startUserScrollGuard() {
    userIsScrolling = true;
    if (userScrollTimer) clearTimeout(userScrollTimer);
    userScrollTimer = setTimeout(() => { userIsScrolling = false; }, 350);
  }

  // touch events
  window.addEventListener('touchstart', startUserScrollGuard, { passive: true });
  window.addEventListener('touchmove', startUserScrollGuard, { passive: true });
  window.addEventListener('touchend', startUserScrollGuard, { passive: true });

  // wheel for desktop touchpads / mouse
  window.addEventListener('wheel', startUserScrollGuard, { passive: true });

  // Expose a method other scripts could call if they need to respect the guard
  window.__userIsScrolling = () => userIsScrolling;

  // keyboard support
  navLinks.forEach(a => a.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); a.click(); }
  }));

});
