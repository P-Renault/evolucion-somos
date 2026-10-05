# Somos Software CRM B10.0 — Inteligencia Comercial

Base: B9.4.9 funcional, autenticación Supabase y pipeline existente.

## Qué incorpora
- Dashboard Comercial conservando el pipeline B9.4.9.
- Dashboard de Inteligencia: score de lead, valor ponderado, forecast, conversión y alertas.
- Recomendaciones operativas: seguimientos vencidos, leads calientes, cotizaciones sin acción y oportunidades estancadas.
- Inteligencia Social: Facebook / Instagram / WhatsApp como fuentes de métricas históricas.
- Tablas Supabase para métricas sociales, eventos comerciales, score de leads y metas.
- Base para sincronización Meta Graph API mediante Edge Function, sin exponer tokens en frontend.

## Instalación
1. Mantener `supabase-config.js` de B9.4.9 sin cambios.
2. Ejecutar `supabase-intelligence.sql` en Supabase SQL Editor.
3. Sustituir en el sitio únicamente `crm.html` y `crm-data.js` por las versiones B10.0.
4. Mantener el resto del sitio premium sin modificaciones.
5. Para Meta/Instagram, desplegar una Edge Function y guardar tokens en Supabase Secrets. Nunca poner tokens de Meta en GitHub Pages.

## Estado
La capa de inteligencia funciona con los leads existentes aunque todavía no se configure Meta. La sección social muestra datos históricos si existen y queda preparada para la sincronización API.
