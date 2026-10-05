(() => {
  const $ = (s, r=document) => r.querySelector(s);
  const $$ = (s, r=document) => [...r.querySelectorAll(s)];
  const year = $('#year'); if (year) year.textContent = new Date().getFullYear();

  const menu = $('#menu'), nav = $('#nav');
  if (menu && nav) {
    menu.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
    $$('a', nav).forEach(a => a.addEventListener('click', () => { nav.classList.remove('open'); menu.setAttribute('aria-expanded','false'); }));
  }

  const progress = $('#progress'), header = $('#header');
  const scrollUI = () => { const max = document.documentElement.scrollHeight - innerHeight; if(progress) progress.style.width = `${Math.max(0,Math.min(100,scrollY/Math.max(1,max)*100))}%`; if(header) header.classList.toggle('scrolled', scrollY > 20); };
  addEventListener('scroll', scrollUI, {passive:true}); scrollUI();

  // Content is visible even if JS fails. JS only adds animation.
  $$('.animate').forEach(el => el.classList.add('ready'));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if(e.isIntersecting){e.target.classList.add('show');io.unobserve(e.target);} }), {threshold:.12});
    $$('.animate').forEach(el => io.observe(el));
  } else $$('.animate').forEach(el => el.classList.add('show'));

  const states = {};
  function carousel(name, root, track, items, dots, visibleFn, interval) {
    if(!root || !track || !items.length) return;
    let index=0, timer=null, startX=0;
    const visible=()=>Math.max(1,Math.min(items.length,visibleFn()));
    const max=()=>Math.max(0,items.length-visible());
    const renderDots=()=>{ if(!dots) return; dots.innerHTML=''; for(let i=0;i<=max();i++){const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Ir a ${i+1}`);b.className=i===index?'active':'';b.onclick=()=>go(i,true);dots.appendChild(b);} };
    const go=(i,manual=false)=>{
      index=Math.max(0,Math.min(i,max()));
      const gap=parseFloat(getComputedStyle(track).gap)||0;
      const w=items[0].getBoundingClientRect().width;
      track.style.transform=`translate3d(${-index*(w+gap)}px,0,0)`;
      items.forEach((item,j)=>item.classList.toggle('is-active',j===index));
      if(dots) $$('button',dots).forEach((b,j)=>b.classList.toggle('active',j===index));
      if(name==='hero'){
        const n=$('#heroNumber'); if(n)n.textContent=String(index+1).padStart(2,'0');
        root.style.setProperty('--hero-progress','0%');
        root.classList.remove('hero-cycle'); void root.offsetWidth; root.classList.add('hero-cycle');
      }
      if(manual) restart();
    };
    const restart=()=>{
      if(timer)clearInterval(timer);
      if(name==='hero'){
        root.style.setProperty('--hero-progress','0%');
        root.classList.remove('hero-cycle'); void root.offsetWidth; root.classList.add('hero-cycle');
      }
      timer=setInterval(()=>go(index>=max()?0:index+1),interval);
    };
    const stop=()=>{if(timer)clearInterval(timer);};
    $('.prev',root)?.addEventListener('click',()=>go(index-1,true)); $('.next',root)?.addEventListener('click',()=>go(index+1,true));
    root.addEventListener('mouseenter',stop); root.addEventListener('mouseleave',restart);
    root.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true}); root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);},{passive:true});
    addEventListener('resize',()=>{index=Math.min(index,max());renderDots();go(index);});
    renderDots();go(0);restart(); states[name]={go};
  }
  // B8.0 HERO — assets finales suministrados para el carrusel Premium.
  // Los tres visuales comparten exactamente 1536x576 (8:3) para evitar recortes distintos entre dispositivos.
  (() => {
    const heroAssets = ['assets/hero-01.webp','assets/hero-02.webp','assets/hero-03.webp'];
    $$('#heroSlides .slide .slide-image img').forEach((img,i) => {
      if (!heroAssets[i]) return;
      img.src = heroAssets[i];
      img.removeAttribute('srcset');
      img.loading = 'eager';
      img.decoding = 'async';
    });
  })();
  carousel('hero',$('[data-carousel="hero"]'),$('#heroSlides'),$$('.slide'),$('#heroDots'),()=>1,6000);
  carousel('offers',$('[data-carousel="offers"]'),$('#offerTrack'),$$('.offer'),$('#offerDots'),()=>innerWidth<=780?1:innerWidth<=1100?2:3,6500);
  // INTERACTION LAYER — conserva el HTML y la arquitectura B8.0; añade profundidad, luz y movimiento.
  (() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const hero = $('[data-carousel="hero"]');
    if (!hero || reduce) return;

    // Parallax muy sutil en escritorio: responde al puntero sin mover la estructura.
    if (matchMedia('(pointer:fine)').matches) {
      const visual = $('.slides-window', hero);
      hero.addEventListener('pointermove', e => {
        const r = hero.getBoundingClientRect();
        const x = ((e.clientX-r.left)/r.width-.5)*2;
        const y = ((e.clientY-r.top)/r.height-.5)*2;
        visual?.style.setProperty('--mx', `${(x*8).toFixed(2)}px`);
        visual?.style.setProperty('--my', `${(y*6).toFixed(2)}px`);
        hero.style.setProperty('--glow-x', `${50+x*22}%`);
        hero.style.setProperty('--glow-y', `${50+y*18}%`);
      });
      hero.addEventListener('pointerleave', () => {
        hero.style.setProperty('--glow-x','50%'); hero.style.setProperty('--glow-y','50%');
        $('.slides-window', hero)?.style.setProperty('--mx','0px');
        $('.slides-window', hero)?.style.setProperty('--my','0px');
      });
    }
  })();

  // Revelado progresivo de tarjetas sin modificar su contenido.
  if ('IntersectionObserver' in window && !matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const reveal = new IntersectionObserver(es => es.forEach(e => {
      if(e.isIntersecting){ e.target.classList.add('is-revealed'); reveal.unobserve(e.target); }
    }), {threshold:.12, rootMargin:'0px 0px -8% 0px'});
    $$('.service-grid article, .offer, .process article, .tags span, .product-media').forEach((el,i)=>{
      el.style.setProperty('--reveal-delay', `${Math.min(i%4,3)*70}ms`);
      el.classList.add('reveal-item'); reveal.observe(el);
    });
  }

  carousel('product',$('[data-carousel="product"]'),$('#productTrack'),$$('#productTrack figure'),$('#productDots'),()=>1,5500);

  // NARRATIVE TECHNOLOGY — scroll intelligence, active navigation and tactile card light.
  (() => {
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const sections = $$('main section[id]');
    const navLinks = $$('#nav a[href^="#"]');
    const updateNarrative = () => {
      const vh = innerHeight || 1;
      sections.forEach(section => {
        const r = section.getBoundingClientRect();
        const visible = Math.max(0, Math.min(vh, vh - Math.max(0, r.top)) - Math.max(0, r.bottom - vh));
        const progress = Math.max(.08, Math.min(1, visible / Math.max(1, Math.min(vh, r.height))));
        section.style.setProperty('--section-progress', progress.toFixed(3));
      });
      navLinks.forEach(a => {
        const id = a.getAttribute('href').slice(1);
        const sec = document.getElementById(id);
        if (!sec) return;
        const r = sec.getBoundingClientRect();
        const active = r.top < vh * .42 && r.bottom > vh * .42;
        a.classList.toggle('active', active);
      });
      document.documentElement.style.setProperty('--cursor-x', `${(scrollY % Math.max(1,innerHeight))/Math.max(1,innerHeight)*100}%`);
    };
    addEventListener('scroll', updateNarrative, {passive:true});
    addEventListener('resize', updateNarrative);
    updateNarrative();
    if (!reduce && matchMedia('(pointer:fine)').matches) {
      $$('.service-grid article,.offer,.process article,.product-media,.tags span').forEach(card => {
        card.addEventListener('pointermove', e => {
          const r=card.getBoundingClientRect();
          card.style.setProperty('--card-x', `${((e.clientX-r.left)/r.width)*100}%`);
          card.style.setProperty('--card-y', `${((e.clientY-r.top)/r.height)*100}%`);
        });
        card.addEventListener('pointerleave', () => { card.style.setProperty('--card-x','50%'); card.style.setProperty('--card-y','50%'); });
      });
      addEventListener('pointermove', e => {
        document.documentElement.style.setProperty('--cursor-x', `${(e.clientX/innerWidth)*100}%`);
        document.documentElement.style.setProperty('--cursor-y', `${(e.clientY/innerHeight)*100}%`);
      }, {passive:true});
    }
  })();

  // B9.1 — VIDEO AUTOPLAY RESPONSIVE
  (() => {
    const video = $('.demo-video');
    if (!video || !('IntersectionObserver' in window)) return;

    const SOMOS_VIDEO_CONFIG = {
      autoplay: true,
      muted: true,
      playsInline: true,
      threshold: 0.35,
      pauseOutsideViewport: true,
      resumeOnReentry: true
    };

    video.autoplay = SOMOS_VIDEO_CONFIG.autoplay;
    video.muted = SOMOS_VIDEO_CONFIG.muted;
    video.defaultMuted = SOMOS_VIDEO_CONFIG.muted;
    video.playsInline = SOMOS_VIDEO_CONFIG.playsInline;
    video.setAttribute('autoplay', '');
    video.setAttribute('muted', '');
    video.setAttribute('playsinline', '');

    let hasEntered = false;

    const startVideo = () => {
      if (!SOMOS_VIDEO_CONFIG.autoplay) return;
      video.muted = true;
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    };

    const observer = new IntersectionObserver(entries => {
      const entry = entries[0];
      if (!entry) return;

      if (entry.isIntersecting && entry.intersectionRatio >= SOMOS_VIDEO_CONFIG.threshold) {
        if (!hasEntered || SOMOS_VIDEO_CONFIG.resumeOnReentry) startVideo();
        hasEntered = true;
      } else if (SOMOS_VIDEO_CONFIG.pauseOutsideViewport) {
        video.pause();
      }
    }, { threshold: [0, SOMOS_VIDEO_CONFIG.threshold] });

    observer.observe(video);
  })();

  const WHATSAPP_NUMBER='56941239698';
  const wa=$('#whatsapp');
  const waUrl=m=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(m)}`;
  if(wa && WHATSAPP_NUMBER) wa.href=waUrl('Hola, Somos Software. Me interesa conocer sus soluciones digitales.');
  $$('[data-offer]').forEach(a=>a.addEventListener('click',e=>{if(!WHATSAPP_NUMBER)return;e.preventDefault();wa.href=waUrl(`Hola, Somos Software. Me interesa la oferta ${a.dataset.offer}.`);location.href=wa.href;}));
  $$('[data-service]').forEach(a=>a.addEventListener('click',e=>{if(!WHATSAPP_NUMBER)return;e.preventDefault();window.open(waUrl(`Hola, Somos Software. Me interesa el servicio de ${a.dataset.service}.`),'_blank','noopener');}));
})();
