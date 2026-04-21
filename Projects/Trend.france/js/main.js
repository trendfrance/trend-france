/* ============================================
   TREND.FRANCE — Interactions globales
   - Curseur custom
   - Scroll reveal (Intersection Observer)
   - Counter animation
   - Menu mobile
   - Card spotlight (mouse follow)
   - Audience bars
   ============================================ */

(() => {
  'use strict';

  // ---- Curseur custom ----
  const canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  if (canHover) {
    const dot = document.createElement('div');
    dot.className = 'cursor';
    document.body.appendChild(dot);
    const ring = document.createElement('div');
    ring.className = 'cursor-ring';
    document.body.appendChild(ring);

    let tx = 0, ty = 0, rx = 0, ry = 0;
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      dot.style.transform = `translate(${tx}px, ${ty}px) translate(-50%, -50%)`;
    });
    const anim = () => {
      rx += (tx - rx) * 0.16;
      ry += (ty - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%, -50%)`;
      requestAnimationFrame(anim);
    };
    requestAnimationFrame(anim);

    const hoverables = 'a, button, .card, .case-card, .topic, .platform, .nav__burger';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverables)) dot.classList.add('is-hover');
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverables)) dot.classList.remove('is-hover');
    });
  }

  // ---- Menu mobile ----
  const burger = document.querySelector('.nav__burger');
  const navLinks = document.querySelector('.nav__links');
  if (burger && navLinks) {
    burger.addEventListener('click', () => {
      burger.classList.toggle('is-open');
      navLinks.classList.toggle('is-open');
    });
    navLinks.querySelectorAll('a').forEach((a) => {
      a.addEventListener('click', () => {
        burger.classList.remove('is-open');
        navLinks.classList.remove('is-open');
      });
    });
  }

  // ---- Scroll reveal ----
  const revealEls = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach((el) => io.observe(el));

  // ---- Counter animation ----
  function animateCounter(el) {
    const target = parseFloat(el.dataset.count);
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    const duration = 1800;
    const start = performance.now();
    const ease = (t) => 1 - Math.pow(1 - t, 3);

    function step(now) {
      const p = Math.min((now - start) / duration, 1);
      const val = target * ease(p);
      el.textContent = val.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
      if (p < 1) requestAnimationFrame(step);
      else el.textContent = target.toLocaleString('fr-FR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      });
    }
    requestAnimationFrame(step);
  }

  const counters = document.querySelectorAll('[data-count]');
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        animateCounter(e.target);
        counterIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => counterIO.observe(el));

  // ---- Card spotlight (parallax mouse sur les cards) ----
  document.querySelectorAll('.card, .case-card, .platform').forEach((card) => {
    card.addEventListener('mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--mx', `${e.clientX - r.left}px`);
      card.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // ---- Audience bars (trigger width animation when visible) ----
  const bars = document.querySelectorAll('.bar');
  const barIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        barIO.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  bars.forEach((b) => barIO.observe(b));

  // ---- Active nav link ----
  const path = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav__link').forEach((l) => {
    const href = (l.getAttribute('href') || '').split('/').pop();
    if (href === path || (path === '' && href === 'index.html')) {
      l.classList.add('is-active');
    }
  });
})();
