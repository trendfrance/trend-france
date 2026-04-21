/* =========================================================
   TREND.FRANCE — Y2K SKYBLOG
   Interactions : sparkle cursor, scroll reveal, counters, age bars,
   active nav highlight
   ========================================================= */

(() => {
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- 0) Starfield parallax (souris + scroll) ----------
  // Décale les 2 couches ::before/::after du <body> via les CSS vars --sx / --sy.
  if (!prefersReduced) {
    const MAX = 22;          // amplitude max en px
    let tx = 0, ty = 0;      // cible (mouse + scroll)
    let cx = 0, cy = 0;      // position lissée
    let mouseX = 0, mouseY = 0, scrollY = 0;

    function computeTarget() {
      // mouse : -1..1 -> -MAX..+MAX (inversé pour effet de "nage")
      const w = window.innerWidth || 1;
      const h = window.innerHeight || 1;
      const mx = (mouseX / w - 0.5) * -2 * MAX;
      const my = (mouseY / h - 0.5) * -2 * MAX;
      // scroll : -0.05 * scrollY (léger drift vers le haut quand on descend)
      const sy = -scrollY * 0.05;
      tx = mx;
      ty = my + sy;
    }

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      computeTarget();
    }, { passive: true });

    window.addEventListener('scroll', () => {
      scrollY = window.scrollY || window.pageYOffset || 0;
      computeTarget();
    }, { passive: true });

    (function tick() {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      document.body.style.setProperty('--sx', cx.toFixed(2) + 'px');
      document.body.style.setProperty('--sy', cy.toFixed(2) + 'px');
      requestAnimationFrame(tick);
    })();
  }

  // ---------- 1) Sparkle cursor trail ----------
  if (!prefersReduced && window.matchMedia('(pointer: fine)').matches) {
    const glyphs = ['★', '✦', '✧', '♥', '✩'];
    const colors = ['#FF2EA6', '#B45CFF', '#23D3FF', '#FFE23C', '#FF7AD9'];
    let last = 0;
    document.addEventListener('mousemove', (e) => {
      const now = performance.now();
      if (now - last < 55) return; // throttle
      last = now;

      const spark = document.createElement('span');
      spark.className = 'spark-trail';
      spark.textContent = glyphs[Math.floor(Math.random() * glyphs.length)];
      spark.style.left = e.clientX + 'px';
      spark.style.top = e.clientY + 'px';
      spark.style.color = colors[Math.floor(Math.random() * colors.length)];
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 820);
    }, { passive: true });
  }

  // ---------- 2) Scroll reveal ----------
  const revealTargets = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add('is-in'));
  }

  // ---------- 3) Counter animation ----------
  function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    if (Number.isNaN(target)) return;
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1400;
    const start = performance.now();
    function step(now) {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      const value = target * eased;
      el.textContent = value.toFixed(decimals);
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toFixed(decimals);
    }
    requestAnimationFrame(step);
  }
  const counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animateCount(entry.target);
          co.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach((el) => co.observe(el));
  } else {
    counters.forEach(animateCount);
  }

  // ---------- 4) Age bars width ----------
  const bars = document.querySelectorAll('.age-row__fill');
  if ('IntersectionObserver' in window) {
    const bo = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const fill = parseFloat(el.dataset.fill);
          if (!Number.isNaN(fill)) el.style.width = fill + '%';
          bo.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    bars.forEach((el) => bo.observe(el));
  } else {
    bars.forEach((el) => {
      const fill = parseFloat(el.dataset.fill);
      if (!Number.isNaN(fill)) el.style.width = fill + '%';
    });
  }

  // ---------- 5) Active nav link highlight (by current path) ----------
  try {
    const path = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav__link').forEach((a) => {
      const href = a.getAttribute('href');
      if (!href) return;
      if (href === path || (path === '' && href === 'index.html')) {
        a.classList.add('is-active');
      }
    });
  } catch (_) { /* noop */ }

  // ---------- 6) Win title button clicks (for fun) ----------
  document.querySelectorAll('.win__title-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const win = btn.closest('.win');
      if (!win) return;
      if (btn.textContent === 'x') {
        win.animate([
          { transform: 'scale(1)', opacity: 1 },
          { transform: 'scale(1.03) rotate(-1deg)', opacity: .7, offset: .4 },
          { transform: 'scale(0.92) rotate(2deg)', opacity: 0 }
        ], { duration: 380, easing: 'cubic-bezier(.7,.05,.3,1.2)' });
        setTimeout(() => {
          win.animate([
            { transform: 'scale(0.92)', opacity: 0 },
            { transform: 'scale(1)', opacity: 1 }
          ], { duration: 320, easing: 'ease-out' });
        }, 700);
      } else if (btn.textContent === '_') {
        const body = win.querySelector('.win__body');
        if (body) body.animate([
          { maxHeight: body.scrollHeight + 'px' },
          { maxHeight: '8px', opacity: 0, offset: 1 }
        ], { duration: 280, easing: 'ease-in' });
        setTimeout(() => {
          if (body) body.animate([
            { maxHeight: '8px', opacity: 0 },
            { maxHeight: body.scrollHeight + 'px', opacity: 1 }
          ], { duration: 300, easing: 'ease-out' });
        }, 600);
      }
    });
  });

})();
