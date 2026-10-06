# Somos Software CRM B10.5.12 — Diagnóstico de métricas reales

## Objetivo
Diagnosticar por qué Facebook e Instagram aparecen conectados pero el CRM muestra 0 seguidores.

## Archivos
- `index.ts` → desplegar en Supabase Edge Function `meta-sync`.
- `crm.html` → reemplazar en GitHub Pages para mostrar el diagnóstico de métricas al pulsar `Sincronizar Meta`.

## Secrets utilizados
- `WHATSAPP_ACCESS_TOKEN` (token Meta System User ya existente)
- `META_PAGE_ID`
- `META_INSTAGRAM_ID`
- `META_GRAPH_VERSION`

No crea ni requiere `META_ACCESS_TOKEN`.

## Resultado
La respuesta de `meta-sync` ahora incluye:
- estado REAL / UNAVAILABLE / INVALID_VALUE
- valor de seguidores
- campos de Meta realmente recibidos
- diagnóstico completo de Facebook e Instagram
- respuesta `raw` conservada en `social_metrics`

El CRM muestra ese diagnóstico en pantalla.

## No modificar
- `whatsapp-api`
- `WHATSAPP_ACCESS_TOKEN`
- SQL
- `meta-posts`
