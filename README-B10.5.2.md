# SOMOS SOFTWARE CRM — B10.5.2 · Meta Sync real

Corrección de `meta-sync` para Facebook e Instagram.

## Qué corrige

- Usa exclusivamente `META_ACCESS_TOKEN` para Meta Social.
- Mantiene `WHATSAPP_ACCESS_TOKEN` intacto.
- Valida la sesión autenticada del CRM antes de sincronizar.
- Consulta Facebook e Instagram con Graph API configurable.
- Guarda la respuesta original de Meta en `social_metrics.raw`.
- No convierte silenciosamente un dato ausente en `0`: si Meta no entrega seguidores, `followers` queda `NULL`.
- Actualiza `social_accounts` con los IDs reales.
- Actualiza `social_metrics` por plataforma/cuenta/fecha.
- Registra la ejecución en `social_sync_logs`.
- Devuelve errores de Meta de forma visible para diagnosticar permisos/token/endpoint.

## Secrets requeridos en Supabase Edge Functions

- `META_ACCESS_TOKEN`
- `META_PAGE_ID=116915307953086`
- `META_INSTAGRAM_ID=17841459991902663`
- `META_GRAPH_VERSION=v26.0`
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SUPABASE_ANON_KEY` (si está disponible en el proyecto; si no, la función usa service role para validar la sesión)

No pegar tokens en GitHub, HTML ni en el chat.

## Despliegue

Reemplazar únicamente el código de la Edge Function existente:

`meta-sync`

Archivo:

`meta-sync/index.ts`

No modificar `whatsapp-api`.

## Prueba

1. Iniciar sesión en el CRM.
2. REDES & CANALES.
3. Pulsar `Sincronizar Meta`.
4. Consultar:

```sql
select
  platform,
  account_id,
  metric_date,
  followers,
  raw
from public.social_metrics
where account_id in ('116915307953086','17841459991902663')
order by platform;
```

## Interpretación

- `followers` con valor > 0: Meta entregó el dato.
- `followers` NULL + `raw` con error/campos limitados: revisar permisos/token de Meta.
- `social_accounts` con Facebook e Instagram: la identidad de las cuentas quedó sincronizada.
- La respuesta del botón ahora debe mostrar qué plataforma falló y por qué.
