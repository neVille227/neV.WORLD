'use strict';

const menuToggle = document.querySelector('.menu-toggle');
const primaryNav = document.querySelector('.primary-nav');
const currentYear = document.querySelector('#current-year');

if (currentYear) currentYear.textContent = String(new Date().getFullYear());

if (menuToggle && primaryNav) {
  menuToggle.addEventListener('click', () => {
    const expanded = menuToggle.getAttribute('aria-expanded') === 'true';
    menuToggle.setAttribute('aria-expanded', String(!expanded));
    primaryNav.classList.toggle('open', !expanded);
  });

  primaryNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      primaryNav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

if (document.body.classList.contains('intro-page')) {
  const skip = document.querySelector('.intro-skip');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const enterExplorer = () => {
    document.body.classList.add('intro-leaving');
    window.setTimeout(() => window.location.assign('/explorer'), reducedMotion ? 0 : 520);
  };

  if (skip) {
    skip.addEventListener('click', (event) => {
      event.preventDefault();
      enterExplorer();
    });
  }

  window.setTimeout(enterExplorer, reducedMotion ? 100 : 2850);
}

const revealTargets = document.querySelectorAll('.explorer-hero, .explorer-heading, .project-card, .explorer-note');
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((element) => observer.observe(element));
} else {
  revealTargets.forEach((element) => element.classList.add('is-visible'));
}
