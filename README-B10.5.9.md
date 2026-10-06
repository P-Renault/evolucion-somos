# SOMOS SOFTWARE CRM B10.5.9
## Corrección de recuperación de publicaciones de Facebook

### Problema observado
El CRM mostraba correctamente las dos publicaciones de Instagram, pero no la publicación creada directamente en Facebook.

### Corrección
`meta-posts/index.ts` ahora intenta Facebook en este orden:
1. `/{page_id}/posts`
2. `/{page_id}/published_posts`
3. `/{page_id}/feed`

En `feed` se filtran las publicaciones para conservar las creadas por la propia Página cuando Meta entrega el campo `from`.

Instagram mantiene el endpoint `/media` sin cambios.

### No modificar
- Supabase SQL
- `whatsapp-api`
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_PHONE_NUMBER_ID`

### Despliegue
Reemplazar únicamente el código de la Edge Function `meta-posts` por `meta-posts/index.ts` y hacer Deploy.
Después, en CRM → REDES & CANALES → Sincronizar publicaciones / Sincronizar Redes.
