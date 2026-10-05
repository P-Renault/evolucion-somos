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
    const go=(i,manual=false)=>{index=Math.max(0,Math.min(i,max())); const gap=parseFloat(getComputedStyle(track).gap)||0; const w=items[0].getBoundingClientRect().width; track.style.transform=`translate3d(${-index*(w+gap)}px,0,0)`; if(dots) $$('button',dots).forEach((b,j)=>b.classList.toggle('active',j===index)); if(manual) restart(); if(name==='hero'){const n=$('#heroNumber');if(n)n.textContent=String(index+1).padStart(2,'0');} };
    const restart=()=>{if(timer)clearInterval(timer);timer=setInterval(()=>go(index>=max()?0:index+1),interval);};
    const stop=()=>{if(timer)clearInterval(timer);};
    $('.prev',root)?.addEventListener('click',()=>go(index-1,true)); $('.next',root)?.addEventListener('click',()=>go(index+1,true));
    root.addEventListener('mouseenter',stop); root.addEventListener('mouseleave',restart);
    root.addEventListener('touchstart',e=>startX=e.touches[0].clientX,{passive:true}); root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45)go(index+(dx<0?1:-1),true);},{passive:true});
    addEventListener('resize',()=>{index=Math.min(index,max());renderDots();go(index);});
    renderDots();go(0);restart(); states[name]={go};
  }
  // Hero carousel: class-based switching, robust on mobile/GitHub Pages.
  (() => {
    const root=$('[data-carousel="hero"]'); const items=$$('.slide',root); const dots=$('#heroDots'); const num=$('#heroNumber');
    if(!root||!items.length) return; let index=0, timer;
    const render=()=>{ items.forEach((s,i)=>s.classList.toggle('active',i===index)); if(num) num.textContent=String(index+1).padStart(2,'0'); if(dots){dots.innerHTML='';items.forEach((_,i)=>{const b=document.createElement('button');b.type='button';b.setAttribute('aria-label',`Ir a ${i+1}`);b.className=i===index?'active':'';b.onclick=()=>{index=i;render();restart()};dots.appendChild(b)})}};
    const next=()=>{index=(index+1)%items.length;render()};
    const restart=()=>{clearInterval(timer);timer=setInterval(next,6000)};
    $('.prev',root)?.addEventListener('click',()=>{index=(index-1+items.length)%items.length;render();restart()});
    $('.next',root)?.addEventListener('click',()=>{next();restart()});
    root.addEventListener('touchstart',e=>root._sx=e.touches[0].clientX,{passive:true});
    root.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-root._sx;if(Math.abs(dx)>45){index=(index+(dx<0?1:-1)+items.length)%items.length;render();restart()}},{passive:true});
    root.addEventListener('mouseenter',()=>clearInterval(timer)); root.addEventListener('mouseleave',restart);
    render();restart();
  })();
  carousel('offers',$('[data-carousel="offers"]'),$('#offerTrack'),$$('.offer'),$('#offerDots'),()=>innerWidth<=780?1:innerWidth<=1100?2:3,6500);
  carousel('product',$('[data-carousel="product"]'),$('#productTrack'),$$('#productTrack figure'),$('#productDots'),()=>1,5500);

  const WHATSAPP_NUMBER='';
  const wa=$('#whatsapp');
  const waUrl=m=>`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(m)}`;
  if(wa && WHATSAPP_NUMBER) wa.href=waUrl('Hola, Somos Software. Me interesa conocer sus soluciones digitales.');
  $$('[data-offer]').forEach(a=>a.addEventListener('click',e=>{if(!WHATSAPP_NUMBER)return;e.preventDefault();wa.href=waUrl(`Hola, Somos Software. Me interesa la oferta ${a.dataset.offer}.`);location.href=wa.href;}));
})();
