
/* =========================================================
   SOMOS SOFTWARE — B9.2 COMMERCIAL CONVERSION ENGINE
   Additive only. No replacement of existing carousel/motion engine.
   ========================================================= */
(() => {
  const $ = (s,r=document) => r.querySelector(s);
  const $$ = (s,r=document) => [...r.querySelectorAll(s)];
  const modal = $('#leadModal');
  const form = $('#leadForm');
  if (!modal || !form) return;

  const WA = '56941239698';
  const params = new URLSearchParams(location.search);
  const getStored = (k) => { try{return sessionStorage.getItem(k)||localStorage.getItem(k)||''}catch(e){return ''} };
  const source = params.get('utm_source') || getStored('ss_utm_source') || (document.referrer ? new URL(document.referrer).hostname : 'direct');
  const medium = params.get('utm_medium') || getStored('ss_utm_medium') || 'none';
  const campaign = params.get('utm_campaign') || getStored('ss_utm_campaign') || '';
  const landing = location.pathname + location.search;

  [['ss_utm_source',source],['ss_utm_medium',medium],['ss_utm_campaign',campaign]].forEach(([k,v])=>{try{sessionStorage.setItem(k,v)}catch(e){}});

  window.dataLayer = window.dataLayer || [];
  const track = (event, data={}) => {
    const payload = {event, timestamp:new Date().toISOString(), source, medium, campaign, landing, ...data};
    window.dataLayer.push(payload);
    try {
      const key='somos_anon_events';
      const arr=JSON.parse(localStorage.getItem(key)||'[]');
      arr.push(payload);
      localStorage.setItem(key, JSON.stringify(arr.slice(-100)));
    } catch(e){}
  };

  track('commercial_page_view',{page:'somossoftware.net'});

  const intentMap = {
    servicio:'Servicio',
    oferta:'Oferta',
    producto:'Producto',
    diagnostico:'Diagnóstico digital',
    contacto:'Contacto'
  };

  let currentIntent='contacto';

  function openLead(intent='contacto', preset='') {
    currentIntent=intent;
    $('#leadIntent').value=intentMap[intent]||intent;
    const need=$('#leadNeed');
    if (preset) {
      const opts=[...need.options];
      const found=opts.find(o=>o.textContent.trim().toLowerCase()===preset.trim().toLowerCase());
      if(found) need.value=found.value;
    }
    $('#leadSource').value=source;
    $('#leadMedium').value=medium;
    $('#leadCampaign').value=campaign;
    $('#leadLanding').value=landing;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden','false');
    document.body.classList.add('lead-modal-open');
    setTimeout(()=>form.querySelector('input[name="name"]')?.focus(),80);
    track('lead_form_open',{intent:currentIntent,preset});
  }

  function closeLead(){
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden','true');
    document.body.classList.remove('lead-modal-open');
  }

  $$('[data-lead-intent]').forEach(el=>{
    el.addEventListener('click',e=>{
      e.preventDefault();
      const intent=el.dataset.leadIntent||'contacto';
      const preset=el.dataset.service||el.dataset.offer||'';
      openLead(intent,preset);
    });
  });

  $$('[data-offer]').forEach(el=>{
    el.addEventListener('click',e=>{
      e.preventDefault();
      openLead('oferta',el.dataset.offer||'');
    });
  });

  $('[data-lead-close]')?.addEventListener('click',closeLead);
  $$('.lead-modal [data-lead-close]').forEach(el=>el.addEventListener('click',closeLead));
  document.addEventListener('keydown',e=>{if(e.key==='Escape' && modal.classList.contains('is-open'))closeLead()});

  // Track important outbound actions while preserving the existing premium UI.
  $$('a[href*="instagram.com"]').forEach(a=>a.addEventListener('click',()=>track('social_click',{network:'instagram'})));
  $$('a[href*="facebook.com"]').forEach(a=>a.addEventListener('click',()=>track('social_click',{network:'facebook'})));
  $$('a[href*="controlfinanciero.cl"]').forEach(a=>a.addEventListener('click',()=>track('product_demo_click',{product:'Control Financiero'})));
  $$('a[href^="mailto:"]').forEach(a=>a.addEventListener('click',()=>track('email_click',{email:'teayudo@somossoftware.net'})));

  // Form -> classification -> measurable WhatsApp handoff.
  form.addEventListener('submit',e=>{
    e.preventDefault();
    if(!form.reportValidity()) return;
    const data=Object.fromEntries(new FormData(form).entries());
    const msg=[
      'Hola, Somos Software.',
      '',
      `Nombre: ${data.name}`,
      `Empresa/actividad: ${data.business||'No indicado'}`,
      `Contacto: ${data.contact}`,
      `Necesidad: ${data.need}`,
      `Plazo: ${data.timeline||'No indicado'}`,
      `Presupuesto: ${data.budget||'No indicado'}`,
      `Mensaje: ${data.message}`,
      data.preferred_date ? `Fecha preferida: ${data.preferred_date}` : '',
      data.preferred_time ? `Hora preferida: ${data.preferred_time}` : '',
      '',
      `Origen: ${data.source||source}`,
      `Campaña: ${data.campaign||campaign||'No indicada'}`,
      'Solicitud generada desde SomosSoftware.net'
    ].filter(Boolean).join('\n');

    const leadRecord={...data, created_at:new Date().toISOString(), source, medium, campaign, landing, intent:currentIntent};
    try{
      const leads=JSON.parse(localStorage.getItem('somos_leads_pending')||'[]');
      leads.push(leadRecord);
      localStorage.setItem('somos_leads_pending',JSON.stringify(leads.slice(-50)));
    }catch(err){}

    track('lead_created',{
      intent:currentIntent,
      need:data.need,
      timeline:data.timeline||'',
      budget:data.budget||''
    });
    track('whatsapp_handoff',{intent:currentIntent,need:data.need});

    window.open(`https://wa.me/${WA}?text=${encodeURIComponent(msg)}`,'_blank','noopener');
    closeLead();
    form.reset();
  });

  // Hero/offer/service CTA interactions not caught above.
  $$('a[href="#ofertas"],a[href="#producto"],a[href="#demostracion"],a[href="#contacto"]').forEach(a=>{
    a.addEventListener('click',()=>{
      const target=(a.getAttribute('href')||'').slice(1);
      if(target) track('navigation_intent',{target});
    });
  });
})();
