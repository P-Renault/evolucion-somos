(() => {
  const slides=[...document.querySelectorAll('.hero-slide')]; const dots=[...document.querySelectorAll('.dot')];
  const current=document.querySelector('.hero-progress .current'); let index=0, timer;
  function show(n){index=(n+slides.length)%slides.length;slides.forEach((s,i)=>s.classList.toggle('is-active',i===index));dots.forEach((d,i)=>d.classList.toggle('active',i===index));current.textContent=String(index+1).padStart(2,'0');}
  function restart(){clearInterval(timer);timer=setInterval(()=>show(index+1),6500)}
  document.querySelector('.next').addEventListener('click',()=>{show(index+1);restart()});
  document.querySelector('.prev').addEventListener('click',()=>{show(index-1);restart()});
  dots.forEach((d,i)=>d.addEventListener('click',()=>{show(i);restart()}));
  let startX=0; const hero=document.querySelector('.hero'); hero.addEventListener('touchstart',e=>startX=e.changedTouches[0].clientX,{passive:true}); hero.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-startX;if(Math.abs(dx)>45){show(index+(dx<0?1:-1));restart()}});
  restart();
  const menu=document.querySelector('.mobile-menu'), menuBtn=document.querySelector('.menu-btn'); menuBtn.addEventListener('click',()=>{const open=!menu.classList.contains('open');menu.classList.toggle('open',open);menuBtn.setAttribute('aria-expanded',open)}); menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.classList.remove('open')));
  document.getElementById('contactForm').addEventListener('submit',e=>{e.preventDefault();const data=new FormData(e.currentTarget);const msg=`Hola Somos Software. Soy ${data.get('name')}. Contacto: ${data.get('contact')}. Necesito: ${data.get('message')}`;const url=`https://wa.me/?text=${encodeURIComponent(msg)}`;window.open(url,'_blank','noopener');});
})();
