/* ============================================================
   SOMOS SOFTWARE · AGENDA YA POPUP
   Root integration for somossoftware.net
   Images and this JS live in the repository root.
   ============================================================ */
(function () {
  "use strict";

  const CONFIG = {
    targetUrl: "https://www.agenda-ya.cl",
    delay: 1400,
    sessionKey: "somos_net_agenda_ya_popup_seen_v1",
    image1: "agenda-ya-popup-01.png",
    image2: "agenda-ya-popup-02.png",
    mobilePoster: "assets/agenda-ya-mobile-poster.png"
  };

  if (window.__SOMOS_AGENDA_YA_POPUP__) return;
  window.__SOMOS_AGENDA_YA_POPUP__ = true;

  const css = `
    .sya-popover{position:fixed;inset:0;z-index:999999;display:grid;place-items:center;padding:16px;background:rgba(1,7,18,.78);backdrop-filter:blur(9px);opacity:0;visibility:hidden;transition:opacity .35s ease,visibility .35s ease}
    .sya-popover.is-open{opacity:1;visibility:visible}
    .sya-modal{position:relative;width:min(980px,94vw);max-height:min(720px,94vh);overflow:hidden;border:1px solid rgba(0,196,255,.62);border-radius:26px;background:#f5fbff;box-shadow:0 35px 120px rgba(0,0,0,.62),0 0 55px rgba(0,183,255,.2);transform:translateY(28px) scale(.97);transition:transform .48s cubic-bezier(.2,.8,.2,1);display:grid;grid-template-columns:1fr 1fr}
    .sya-popover.is-open .sya-modal{transform:translateY(0) scale(1)}
    .sya-close{position:absolute;right:12px;top:12px;z-index:10;width:40px;height:40px;border-radius:50%;border:1px solid rgba(255,255,255,.45);background:rgba(2,13,28,.78);color:#fff;font-size:24px;line-height:1;cursor:pointer;display:grid;place-items:center;transition:.2s}
    .sya-close:hover{background:#087cf4;transform:scale(1.05)}
    .sya-copy{padding:36px 34px 30px;color:#09224b;position:relative}
    .sya-badge{display:inline-flex;align-items:center;padding:8px 14px;border-radius:999px;background:linear-gradient(135deg,#087cf4,#00cfff);color:#fff;font-size:10px;font-weight:900;letter-spacing:1px;text-transform:uppercase}
    .sya-title{font-size:clamp(40px,5vw,58px);line-height:.92;letter-spacing:-2.5px;margin:18px 0 12px;font-weight:900;color:#061b40}
    .sya-title span{color:#087cf4}
    .sya-sub{font-size:17px;line-height:1.3;margin:0 0 20px;font-weight:800;color:#17345f}
    .sya-sub em{color:#087cf4;font-style:normal}
    .sya-features{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:16px 0 21px}
    .sya-feature{padding:10px 6px;border:1px solid #d7e9fb;border-radius:13px;background:rgba(255,255,255,.8);text-align:center}
    .sya-icon{width:29px;height:29px;margin:0 auto 5px;border-radius:9px;display:grid;place-items:center;background:#087cf4;color:#fff;font-size:14px;font-weight:900}
    .sya-feature b{display:block;font-size:10px;line-height:1.15}
    .sya-cta{display:inline-flex;align-items:center;gap:10px;padding:14px 19px;border-radius:14px;background:linear-gradient(135deg,#087cf4,#00cfff);color:#fff;font-weight:900;text-decoration:none;box-shadow:0 14px 32px rgba(0,134,245,.28);transition:.2s}
    .sya-cta:hover{transform:translateY(-2px)}
    .sya-url{display:block;margin-top:7px;font-size:10px;font-weight:700;color:#48709c}
    .sya-mini{display:flex;align-items:center;gap:8px;margin-top:15px;color:#31577f;font-size:10px;font-weight:700}
    .sya-mini-mark{width:8px;height:8px;border-radius:50%;background:#00cfff;box-shadow:0 0 12px #00cfff}
    .sya-visual{min-height:460px;position:relative;overflow:hidden;background:#06172e}
    .sya-slide{position:absolute;inset:0;background-position:center;background-size:cover;opacity:0;transform:scale(1.035);transition:opacity .8s ease,transform 4.2s ease}
    .sya-slide.is-active{opacity:1;transform:scale(1)}
    .sya-visual:after{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(2,13,29,.25),transparent 48%);pointer-events:none}
    .sya-label{position:absolute;z-index:2;left:18px;bottom:18px;padding:10px 13px;border-radius:12px;background:rgba(2,13,28,.72);border:1px solid rgba(0,203,255,.45);color:#fff;backdrop-filter:blur(9px);font-size:10px;font-weight:800}
    .sya-dots{position:absolute;z-index:3;right:18px;bottom:22px;display:flex;gap:6px}
    .sya-dot{width:7px;height:7px;border-radius:50%;background:rgba(255,255,255,.45);transition:.2s}
    .sya-dot.is-active{width:21px;border-radius:5px;background:#00d9ff}
    @media(max-width:760px){
      .sya-popover{padding:12px}
      .sya-modal{width:min(520px,94vw);max-height:88vh;max-height:88dvh;grid-template-columns:1fr;overflow:hidden;border-radius:18px;display:block;background:#f5fbff}
      .sya-copy,.sya-visual{display:none!important}
      .sya-mobile-poster{display:block;position:relative;width:100%;line-height:0;background:#fff}
      .sya-mobile-poster img{width:100%;height:auto;max-height:calc(88dvh - 4px);object-fit:contain}
      .sya-mobile-web-cta{top:72.5%;}
      .sya-label{left:10px;bottom:9px;padding:6px 8px;font-size:8px;border-radius:8px}
      .sya-dots{right:11px;bottom:13px}
      .sya-close{right:8px;top:8px;width:32px;height:32px;font-size:21px}
      .sya-copy{padding:14px 14px 13px}
      .sya-badge{padding:5px 9px;font-size:8px;letter-spacing:.6px}
      .sya-title{font-size:30px;line-height:1;letter-spacing:-1.2px;margin:9px 0 6px}
      .sya-sub{font-size:12px;line-height:1.25;margin:0 0 10px}
      .sya-features{gap:5px;margin:9px 0 12px}
      .sya-feature{padding:6px 3px;border-radius:9px}
      .sya-icon{width:22px;height:22px;margin-bottom:4px;border-radius:7px;font-size:11px}
      .sya-feature b{font-size:8px;line-height:1.12}
      .sya-cta{padding:10px 13px;border-radius:10px;font-size:12px;gap:7px}
      .sya-url{margin-top:5px;font-size:9px}
      .sya-mini{display:none}
    }
    @media(max-width:430px){
      .sya-modal{width:min(520px,94vw);max-height:88vh;max-height:88dvh}
      .sya-mobile-web-cta{font-size:clamp(7px,2.05vw,10px)}
    }
    .sya-mobile-poster{display:none}
    .sya-mobile-poster img{display:block;width:100%;height:auto}
    .sya-mobile-web-cta{position:absolute;left:55%;top:72.5%;width:41%;min-height:8.2%;box-sizing:border-box;display:flex;align-items:center;justify-content:center;gap:5px;padding:5px 7px;border:1px solid rgba(0,135,255,.28);border-radius:999px;background:linear-gradient(110deg,#fff,#eef8ff);box-shadow:0 4px 12px rgba(0,72,180,.15);color:#0759bd;text-decoration:none;text-align:center;font-size:clamp(7px,2.15vw,11px);font-weight:900;line-height:1.15;z-index:4}
    .sya-mobile-web-cta .sya-web-icon{font-size:1.35em;flex:0 0 auto}
    .sya-mobile-web-cta .sya-web-copy{display:flex;flex-direction:column;align-items:flex-start;min-width:0}
    .sya-mobile-web-cta small{font-size:.72em;font-weight:700;color:#42668c}
    .sya-mobile-web-cta strong{white-space:nowrap}
    @media(prefers-reduced-motion:reduce){
      .sya-popover,.sya-modal,.sya-slide{transition:none!important}
      .sya-slide{transform:none!important}
    }
  `;

  function injectStyles() {
    const style = document.createElement("style");
    style.id = "somos-agenda-ya-popup-styles";
    style.textContent = css;
    document.head.appendChild(style);
  }

  function build() {
    injectStyles();

    const root = document.createElement("div");
    root.className = "sya-popover";
    root.id = "somosAgendaYaPopup";
    root.setAttribute("aria-hidden", "true");

    root.innerHTML = `
      <div class="sya-modal" role="dialog" aria-modal="true" aria-labelledby="sya-title">
        <button class="sya-close" type="button" aria-label="Cerrar anuncio">×</button>

        <section class="sya-copy">
          <div class="sya-badge">✦ NUEVO SISTEMA · SOMOS SOFTWARE</div>
          <h2 class="sya-title" id="sya-title">Agenda<span>Ya</span></h2>
          <p class="sya-sub">Encuentra. Elige. Agenda. <em>Haz crecer tu negocio.</em></p>

          <div class="sya-features">
            <div class="sya-feature"><div class="sya-icon">⌕</div><b>Encuentra servicios</b></div>
            <div class="sya-feature"><div class="sya-icon">▣</div><b>Agenda en segundos</b></div>
            <div class="sya-feature"><div class="sya-icon">★</div><b>Valoraciones reales</b></div>
            <div class="sya-feature"><div class="sya-icon">✓</div><b>Seguro y confiable</b></div>
            <div class="sya-feature"><div class="sya-icon">⌁</div><b>Negocios cerca de ti</b></div>
            <div class="sya-feature"><div class="sya-icon">⚙</div><b>Gestión para negocios</b></div>
          </div>

          <a class="sya-cta" id="syaAgendaLink" href="${CONFIG.targetUrl}" target="_blank" rel="noopener noreferrer">
            Conoce Agenda Ya <span>→</span>
          </a>
          <span class="sya-url">www.agenda-ya.cl</span>

          <div class="sya-mini">
            <span class="sya-mini-mark"></span>
            Plataforma desarrollada por Somos Software · Innovación Digital
          </div>
        </section>

        <section class="sya-visual" aria-label="Promoción Agenda Ya">
          <div class="sya-slide is-active" style="background-image:url('${CONFIG.image1}')"></div>
          <div class="sya-slide" style="background-image:url('${CONFIG.image2}')"></div>
          <div class="sya-label">Tu tiempo en el lugar correcto · En todo Chile</div>
          <div class="sya-dots"><span class="sya-dot is-active"></span><span class="sya-dot"></span></div>
        </section>
        <section class="sya-mobile-poster" aria-label="Promoción Agenda Ya para móviles">
          <img src="${CONFIG.mobilePoster}" alt="Agenda Ya: descubre, reserva y disfruta servicios en todo Chile. Disponible en Google Play." loading="eager">
          <a class="sya-mobile-web-cta" href="${CONFIG.targetUrl}" target="_blank" rel="noopener noreferrer" aria-label="También puedes usar Agenda Ya en la web, www.agenda-ya.cl">
            <span class="sya-web-icon" aria-hidden="true">◎</span><span class="sya-web-copy"><small>También puedes usarlo en la web</small><strong>www.agenda-ya.cl　↗</strong></span>
          </a>
        </section>
      </div>
    `;

    document.body.appendChild(root);

    const close = () => {
      root.classList.remove("is-open");
      root.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    };

    const open = () => {
      root.classList.add("is-open");
      root.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      try { sessionStorage.setItem(CONFIG.sessionKey, "1"); } catch (_) {}
    };

    root.querySelector(".sya-close").addEventListener("click", close);
    root.addEventListener("click", e => { if (e.target === root) close(); });
    document.addEventListener("keydown", e => {
      if (e.key === "Escape" && root.classList.contains("is-open")) close();
    });

    const dispatchAgendaClick = () => window.dispatchEvent(new CustomEvent("somos:agenda-ya-click", { detail: { target: CONFIG.targetUrl } }));
    root.querySelector("#syaAgendaLink").addEventListener("click", dispatchAgendaClick);
    root.querySelector(".sya-mobile-web-cta").addEventListener("click", dispatchAgendaClick);

    const slides = [...root.querySelectorAll(".sya-slide")];
    const dots = [...root.querySelectorAll(".sya-dot")];
    let index = 0;

    setInterval(() => {
      index = (index + 1) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle("is-active", i === index));
      dots.forEach((dot, i) => dot.classList.toggle("is-active", i === index));
    }, 4200);

    let seen = false;
    try { seen = sessionStorage.getItem(CONFIG.sessionKey) === "1"; } catch (_) {}

    if (!seen) setTimeout(open, CONFIG.delay);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", build);
  } else {
    build();
  }
})();
