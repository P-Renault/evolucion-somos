(function(){
  const cfg=window.SOMOS_IMPULSA_CONFIG||{};
  const form=document.getElementById("applicationForm");
  const status=document.getElementById("formStatus");
  const btn=document.getElementById("submitBtn");
  const params=new URLSearchParams(location.search);
  const val=(k)=>params.get(k)||"";
  document.getElementById("campaign_code").value=cfg.CAMPAIGN_CODE||"SOMOS-IMPULSA-2026";
  document.getElementById("source").value=val("utm_source")||"direct";
  document.getElementById("medium").value=val("utm_medium");
  document.getElementById("campaign").value=val("utm_campaign");
  document.getElementById("content").value=val("utm_content");
  document.getElementById("landing_path").value=location.pathname;
  const fb=document.getElementById("facebookLink");
  // Reemplazar por la URL oficial de la página Facebook de Somos Software.
  fb.href="https://www.facebook.com/";
  form.addEventListener("submit", async (e)=>{
    e.preventDefault();
    status.textContent="Enviando postulación…"; status.style.color="#087cf4"; btn.disabled=true;
    if(document.getElementById("website").value){status.textContent="No fue posible enviar la postulación.";btn.disabled=false;return;}
    const data=Object.fromEntries(new FormData(form).entries());
    delete data.website;
    data.accept_terms=data.accept_terms==="on";
    data.accept_external_costs=data.accept_external_costs==="on";
    data.portfolio_ok=data.portfolio_ok==="on";
    data.review_ok=data.review_ok==="on";
    data.video_ok=data.video_ok==="on";
    data.promo_ok=data.promo_ok==="on";
    data.user_agent=navigator.userAgent;
    data.referrer=document.referrer||"";
    data.submitted_at=new Date().toISOString();
    try{
      if(!cfg.SUPABASE_URL||cfg.SUPABASE_URL.includes("TU-PROYECTO")||!cfg.SUPABASE_ANON_KEY||cfg.SUPABASE_ANON_KEY.includes("TU_ANON")){
        throw new Error("Supabase no está configurado.");
      }
      const client=window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY);
      const {error}=await client.from("somos_impulsa_postulaciones").insert(data);
      if(error) throw error;
      form.reset();
      document.getElementById("campaign_code").value=cfg.CAMPAIGN_CODE||"SOMOS-IMPULSA-2026";
      document.getElementById("source").value=val("utm_source")||"direct";
      document.getElementById("medium").value=val("utm_medium");
      document.getElementById("campaign").value=val("utm_campaign");
      document.getElementById("content").value=val("utm_content");
      document.getElementById("landing_path").value=location.pathname;
      status.textContent="¡Postulación recibida! Te contactaremos si tu proyecto avanza a la siguiente etapa.";
      status.style.color="#087c5a";
      form.scrollIntoView({behavior:"smooth",block:"start"});
    }catch(err){
      console.error(err);
      status.textContent="La postulación no pudo registrarse todavía. Si estás probando el sitio, verifica la configuración de Supabase y la política RLS de la tabla.";
      status.style.color="#d92d45";
    }finally{btn.disabled=false;}
  });
})();