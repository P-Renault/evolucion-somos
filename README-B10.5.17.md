# SOMOS SOFTWARE CRM · B10.5.17
## WhatsApp Cloud API + recepción inbound + navegación móvil

Base funcional: **B10.5.16 — WhatsApp Inbound FIX FULL**. Esta versión no reemplaza la arquitectura de autenticación de B10.5.16 ni modifica el escritorio.

### WhatsApp
- Mantiene `whatsapp-api` de B10.5.16 para `send_text`, `check_meta`, `check_subscription` y `subscribe_waba`.
- Mantiene `whatsapp-webhook` de B10.5.16 para verificación Meta, recepción inbound, estados outbound y diagnóstico en `whatsapp_webhook_events`.
- El CRM conserva el panel de mensajería y la consulta periódica de `whatsapp_messages`.
- La recepción requiere que Meta tenga el callback verificado y que la WABA esté suscrita a la aplicación/campo `messages`.

### Navegación móvil
- Escritorio: **sin cambios de diseño ni navegación**.
- Móvil: se oculta la fila horizontal de pestañas y se reemplaza por un selector compacto tipo hamburguesa/desplegable.
- Los cinco módulos siguen siendo los mismos: Centro Ejecutivo, Comercial, Inteligencia, Redes & Canales y Atribución.
- Al seleccionar un módulo, el menú se cierra y el contenido se carga con la misma lógica existente.

### Archivos principales
- `crm.html`
- `crm-data.js`
- `supabase-config.js`
- `whatsapp-api/index.ts`
- `whatsapp-webhook/index.ts`
- `whatsapp-messages-schema.sql`
- `meta-posts-index.ts`

### Secrets
No mover secretos al frontend. Mantener los ya configurados en Supabase, incluido `WHATSAPP_WEBHOOK_VERIFY_TOKEN`. Si se usa firma de Meta, configurar `META_APP_SECRET`.

### Webhook
La función `whatsapp-webhook` debe tener `verify_jwt = false` para que Meta pueda llamar al endpoint. La verificación se realiza mediante el token de webhook y, opcionalmente, la firma `X-Hub-Signature-256`.
