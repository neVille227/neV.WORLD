'use strict';
(() => {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const year = document.querySelector('#current-year');
  if (year) year.textContent = String(new Date().getFullYear());

  // Menu mobile
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  if (toggle && nav) {
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      toggle.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
    });
  }

  // Index d'animation (évite tout style en ligne : compatible CSP stricte)
  document.querySelectorAll('[data-i]').forEach((el) => el.style.setProperty('--i', el.dataset.i));

  // Apparition au défilement
  const targets = document.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    targets.forEach((el) => io.observe(el));
  } else {
    targets.forEach((el) => el.classList.add('is-visible'));
  }

  // Transition de page en fondu flouté
  document.addEventListener('click', (event) => {
    const link = event.target.closest('a[href]');
    if (!link || reduced || event.metaKey || event.ctrlKey || event.shiftKey || link.target === '_blank') return;
    const url = new URL(link.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || url.hash) return;
    event.preventDefault();
    document.body.classList.add('page-leaving');
    setTimeout(() => { location.assign(url.href); }, 380);
  });
  window.addEventListener('pageshow', () => document.body.classList.remove('page-leaving'));

  // Cartes projet : inclinaison 3D et lueur qui suit le curseur
  if (!reduced && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.project-card').forEach((card) => {
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        card.style.setProperty('--ry', ((x - 0.5) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 8).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
      card.addEventListener('pointerleave', () => { card.style.setProperty('--rx', '0deg'); card.style.setProperty('--ry', '0deg'); });
    });
  }

  // Logo 3D : suit le curseur (désactivé si mouvement réduit)
  const logo = document.querySelector('[data-logo3d]');
  if (logo && !reduced && window.matchMedia('(hover: hover)').matches) {
    const tilt = logo.querySelector('.logo3d-tilt');
    window.addEventListener('pointermove', (e) => {
      const x = e.clientX / window.innerWidth - 0.5, y = e.clientY / window.innerHeight - 0.5;
      tilt.style.setProperty('--ry', (x * 26).toFixed(2) + 'deg');
      tilt.style.setProperty('--rx', (-y * 18).toFixed(2) + 'deg');
    }, { passive: true });
  }

  // Parallaxe douce de l'emblème sur la page projet
  const parallax = document.querySelector('[data-parallax]');
  if (parallax && !reduced) {
    const k = Number(parallax.dataset.parallax) || 0.15;
    window.addEventListener('scroll', () => { parallax.style.transform = 'translateY(' + (window.scrollY * k).toFixed(1) + 'px)'; }, { passive: true });
  }

  // Intro : champ d'étoiles
  const canvas = document.getElementById('stars');
  if (canvas) {
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, stars = [];
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round((w * h) / 5500);
      stars = Array.from({ length: count }, () => ({ x: Math.random() * w, y: Math.random() * h, z: Math.random() * 0.9 + 0.1, t: Math.random() * 6.28 }));
    };
    const draw = (time) => {
      ctx.clearRect(0, 0, w, h);
      for (const s of stars) {
        const a = 0.35 + 0.65 * Math.abs(Math.sin(time / 1200 * s.z + s.t));
        ctx.fillStyle = 'rgba(255,' + Math.round(200 + 55 * s.z) + ',' + Math.round(205 + 50 * s.z) + ',' + (a * s.z).toFixed(2) + ')';
        ctx.beginPath(); ctx.arc(s.x, s.y, s.z * 1.4, 0, 6.2832); ctx.fill();
        if (!reduced) { s.y += s.z * 0.12; if (s.y > h) { s.y = 0; s.x = Math.random() * w; } }
      }
      if (!reduced) requestAnimationFrame(draw);
    };
    resize(); window.addEventListener('resize', resize);
    requestAnimationFrame(draw);
  }
})();
