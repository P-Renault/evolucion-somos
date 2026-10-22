(() => {
  'use strict';
  const menuButton = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.nav');
  if (menuButton && nav) {
    menuButton.addEventListener('click', () => {
      const open = menuButton.getAttribute('aria-expanded') !== 'true';
      menuButton.setAttribute('aria-expanded', String(open));
      nav.classList.toggle('open', open);
      menuButton.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Abrir menú');
    }));
    document.addEventListener('keydown', event => {
      if (event.key === 'Escape') {
        nav.classList.remove('open');
        menuButton.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.13, rootMargin: '0px 0px -35px 0px' });
    revealItems.forEach(item => revealObserver.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  const counters = document.querySelectorAll('[data-count]');
  const animateCounter = element => {
    const target = Number(element.dataset.count || 0);
    const duration = 1100;
    const start = performance.now();
    const tick = now => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      element.textContent = Math.round(target * eased).toLocaleString('es-CL');
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) {
        animateCounter(entry.target);
        counterObserver.unobserve(entry.target);
      }
    }), { threshold: 0.5 });
    counters.forEach(counter => counterObserver.observe(counter));
  } else counters.forEach(animateCounter);

  const toast = document.querySelector('.toast');
  document.querySelectorAll('.map-zoom button').forEach(button => button.addEventListener('click', () => {
    const map = document.querySelector('.terrain-map');
    if (!map) return;
    const zoomIn = button.textContent.trim() === '+';
    const current = Number(map.dataset.zoom || 1);
    const next = Math.max(.85, Math.min(1.35, current + (zoomIn ? .1 : -.1)));
    map.dataset.zoom = String(next);
    map.querySelectorAll('.contours,.route-svg,.map-grid').forEach(layer => {
      layer.style.transform = `scale(${next})`;
      layer.style.transformOrigin = 'center';
    });
    if (toast) {
      toast.textContent = `Vista del mapa: ${Math.round(next * 100)}% · Interacción de demostración`;
      toast.classList.add('show');
      window.clearTimeout(toast.hideTimer);
      toast.hideTimer = window.setTimeout(() => toast.classList.remove('show'), 1800);
    }
  }));
  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  // El formulario de contacto usa un enlace mailto; no se envían datos a un servidor.
  document.querySelectorAll('a[href="#contacto"]').forEach(link => link.addEventListener('click', () => {
    // Navegación intencional al bloque de contacto; sin captura ni almacenamiento de datos.
  }));
})();
