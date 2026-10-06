# Somos Software CRM · B10.5.15

Restauración de REDES & CANALES + integración premium de WhatsApp.

## Correcciones
- Restaura `CRMStore.listSocialPosts()` para eliminar `listSocialPosts is not a function`.
- Restaura `CRMStore.syncSocialPosts()` para la Edge Function `meta-posts`.
- Conserva tarjetas Facebook, Instagram y WhatsApp, estados de conexión, origen, histórico y publicaciones registradas.
- Integra panel premium responsive de conversaciones WhatsApp.
- El envío devuelve y muestra código/mensaje exactos de Meta ante un rechazo.
- Historial desde `public.whatsapp_messages`.
- Webhook registra mensajes entrantes y estados `sent`, `delivered`, `read`, `failed`.

## Despliegue web
Reemplazar en GitHub Pages:
- `crm.html`
- `crm-data.js`
- `supabase-config.js`

## Edge Functions
- `whatsapp-api/index.ts` → función `whatsapp-api`
- `whatsapp-webhook/index.ts` → función `whatsapp-webhook`
- `meta-posts-index.ts` → código para la función `meta-posts`

## SQL
Ejecutar `whatsapp-messages-schema.sql` solamente si `public.whatsapp_messages` todavía no existe.

## Webhook
Callback: `https://<PROJECT-REF>.supabase.co/functions/v1/whatsapp-webhook`
Secret: `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
La función webhook debe estar disponible públicamente para la verificación/eventos de Meta.

## Envío WhatsApp
La Cloud API utiliza `POST /{PHONE_NUMBER_ID}/messages`. Una aceptación devuelve un `wamid`; la entrega real y sus estados posteriores llegan por webhook. Si Meta exige una plantilla por la política de mensajería, el panel muestra el error devuelto.

## Prueba
1. Iniciar sesión.
2. REDES & CANALES → `Actualizar datos guardados`: comprobar tarjetas y publicaciones.
3. `Probar WhatsApp`: comprobar API.
4. Introducir número internacional y enviar.
5. Verificar `wamid` y recepción en el teléfono.
6. Responder desde el teléfono y verificar entrada por webhook.
