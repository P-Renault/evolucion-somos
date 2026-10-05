# SOMOS IMPULSA — paquete desplegable

## Incluye
- index.html: landing pública independiente.
- styles.css: identidad visual responsive.
- app.js: captura UTM + validación + registro Supabase.
- config.js: URL/ANON KEY pública de Supabase.
- supabase.sql: tabla + RLS.
- assets/logo-somos-software.png
- assets/somos-impulsa-hero.png

## Instalación
1. Crear/usar el proyecto Supabase de Somos Software.
2. Ejecutar `supabase.sql`.
3. Editar `config.js` con SUPABASE_URL y la ANON KEY pública.
4. Sustituir el enlace Facebook en `app.js` por la URL oficial de Somos Software.
5. Publicar esta carpeta en la ruta independiente elegida, por ejemplo:
   https://www.somossoftware.net/somos-impulsa/
6. Probar en móvil y escritorio.
7. Hacer una postulación de prueba y verificar que aparece en `somos_impulsa_postulaciones`.
8. Antes de abrir Meta Ads, activar analítica/Meta Pixel o Conversions API según la arquitectura ya existente.

## Seguridad
- Nunca colocar `service_role` key en frontend.
- No habilitar SELECT público sobre postulaciones.
- En producción añadir protección anti-spam/rate limiting/Turnstile y política de privacidad visible.


## Versión visual
La landing fue adaptada al diseño premium oscuro aprobado: fondo navy/negro, paneles glassmorphism, bordes luminosos cyan/azules, CTA rojo/azul, tipografía de alto contraste y estructura visual inspirada en el sitio premium de Somos Software.
La imagen `assets/SOMOS-IMPULSA-DISENO-APROBADO-REFERENCIA.png` se incluye solo como referencia visual aprobada; no es necesaria para el funcionamiento.
