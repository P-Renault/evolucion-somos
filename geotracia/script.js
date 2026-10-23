// Navegación móvil
const menuButton = document.querySelector('.hamburger');
const nav = document.querySelector('.nav');
menuButton?.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Cerrar navegación' : 'Abrir navegación');
});
nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
  nav.classList.remove('open');
  menuButton?.setAttribute('aria-expanded', 'false');
  menuButton?.setAttribute('aria-label', 'Abrir navegación');
}));

// Movimiento editorial y progresivo: una sola entrada por elemento, sin dependencias externas.
(() => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const header = document.querySelector('.header');
  const setScrolledHeader = () => header?.classList.toggle('is-scrolled', window.scrollY > 8);
  setScrolledHeader();
  window.addEventListener('scroll', setScrolledHeader, { passive: true });

  if (reduceMotion || !('IntersectionObserver' in window)) return;
  document.body.classList.add('motion-ready');

  const addReveal = (elements, baseDelay = 0, stepDelay = 95) => {
    elements.forEach((element, index) => {
      element.classList.add('js-reveal');
      element.style.setProperty('--reveal-delay', `${baseDelay + index * stepDelay}ms`);
    });
  };

  addReveal([...document.querySelectorAll('.desktop-highlights article')], 0, 100);
  addReveal([...document.querySelectorAll('.feature-card')], 0, 115);
  addReveal([...document.querySelectorAll('.workflow-copy > .kicker, .workflow-copy h2, .workflow-copy > p, .workflow-copy li')], 0, 80);
  addReveal([...document.querySelectorAll('.step')], 0, 105);
  addReveal([...document.querySelectorAll('.trust-inner > div, .trust-list article')], 0, 95);
  addReveal([...document.querySelectorAll('.contact-copy > *')], 0, 100);
  addReveal([...document.querySelectorAll('.sectors > .kicker, .sectors > h2, .sectors > .sectors-intro, .sector-list article')], 0, 90);
  addReveal([...document.querySelectorAll('.footer > *')], 0, 70);

  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('is-in-view');
      observer.unobserve(entry.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -5% 0px' });

  document.querySelectorAll('.js-reveal').forEach(element => observer.observe(element));
  const steps = document.querySelector('.steps');
  if (steps) {
    const processObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          steps.classList.add('is-in-view');
          processObserver.disconnect();
        }
      });
    }, { threshold: 0.2 });
    processObserver.observe(steps);
  }
})();
