# SOMOS SOFTWARE · B10.2 — Inteligencia Social Operativa

Base: B10.1, manteniendo B9.4.9/B10.0 como núcleo.

## Qué agrega
- Registro de cada sincronización Meta en `social_sync_logs`.
- Estado `success`, `partial` o `error`.
- Identificación del usuario autenticado que lanzó la sincronización.
- Últimos seguidores Facebook/Instagram y detalle del resultado.
- Vista `social_latest_metrics` para consultar rápidamente el último dato por cuenta.
- Edge Function endurecida: exige sesión CRM válida y mantiene secretos únicamente en Supabase.

## SQL
1. B9.4.x debe existir.
2. B10.0 debe estar ejecutado.
3. Ejecutar `supabase-social-b10.2.sql`.

## Secrets de Supabase
Configurar en Edge Functions → Secrets:

- `META_ACCESS_TOKEN`
- `META_PAGE_ID` (opcional si solo se conecta Instagram)
- `META_INSTAGRAM_ID` (opcional si solo se conecta Facebook)
- `META_GRAPH_VERSION`

`SUPABASE_URL` y la clave secreta/administrativa deben permanecer en el entorno de Edge Functions. No poner ninguna clave secreta en GitHub Pages ni en `crm.html`.

## Despliegue
Desplegar:
`supabase/functions/meta-sync/index.ts`

Nombre de función:
`meta-sync`

Luego iniciar sesión en el CRM → REDES & CANALES → Sincronizar Meta.

## Estado esperado
Facebook e Instagram mostrarán seguidores reales únicamente después de que Meta valide el token, IDs y permisos de la aplicación.

La versión de Graph API se deja como secret configurable para no acoplar el CRM a una versión concreta.
