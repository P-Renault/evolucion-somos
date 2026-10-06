# SOMOS SOFTWARE CRM · B10.5.16
## WhatsApp Cloud API — recepción inbound corregida

Esta versión mantiene la vista REDES & CANALES de B10.5.15 y corrige el flujo de recepción de mensajes entrantes.

### Diagnóstico de la evidencia
La prueba del video demuestra que Meta/WhatsApp entregó los mensajes enviados desde el CRM al teléfono destinatario. El teléfono respondió, pero el CRM permaneció en `0 mensajes`. Por lo tanto el envío saliente funciona y el problema está en el camino **Meta → Webhook → Supabase → whatsapp_messages → CRM**.

Meta exige que el WABA esté explícitamente suscrito a la aplicación para que sus eventos lleguen al webhook: `POST /{WABA-ID}/subscribed_apps`.

### Cambios B10.5.16
- `whatsapp-api` añade `check_subscription` y `subscribe_waba`.
- CRM añade **Verificar recepción** y **Activar recepción Meta**.
- `whatsapp-webhook` registra cada payload en `whatsapp_webhook_events` antes de procesarlo.
- El webhook guarda mensajes inbound en `whatsapp_messages` y estados outbound.
- El webhook verifica `X-Hub-Signature-256` si existe `META_APP_SECRET`.
- Se registran errores de persistencia para no fallar silenciosamente.
- El panel consulta la conversación cada 3 segundos.
- Se conserva el diseño premium y las tarjetas Facebook/Instagram/WhatsApp/publicaciones.

### SQL
Ejecutar `whatsapp-messages-schema.sql` en Supabase.

### Secrets
Mantener los actuales:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_PHONE_NUMBER` (si ya existe)
- `META_GRAPH_VERSION`
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN`

Recomendado:
- `META_APP_SECRET`

No pegar tokens en GitHub ni en el chat.

### Edge Functions
Reemplazar/desplegar:
- `whatsapp-api`
- `whatsapp-webhook`

`whatsapp-webhook` debe ser accesible públicamente para Meta (sin JWT obligatorio en el gateway). La verificación se hace mediante `WHATSAPP_WEBHOOK_VERIFY_TOKEN` y, si se configura, `META_APP_SECRET`.

### Meta Webhooks
Callback:
`https://<PROJECT-REF>.supabase.co/functions/v1/whatsapp-webhook`

Verify token: exactamente el valor de `WHATSAPP_WEBHOOK_VERIFY_TOKEN`.

Suscribirse al campo:
`messages`

### Paso crítico nuevo
En el CRM, con sesión iniciada:
1. Abrir REDES & CANALES.
2. Pulsar **Verificar recepción**.
3. Si dice `WABA no suscrito`, pulsar **Activar recepción Meta**.
4. Volver a pulsar **Verificar recepción**.
5. Enviar un mensaje desde el teléfono destinatario al número de WhatsApp Business.
6. En menos de unos segundos, el mensaje debe aparecer como `CLIENTE` en la conversación.

### Verificación técnica
La tabla `whatsapp_webhook_events` permite saber si Meta realmente llegó a Supabase, incluso cuando el procesamiento posterior falla.

Si `whatsapp_webhook_events` queda vacío después de enviar un mensaje al número API, el problema todavía está en Meta Webhooks / suscripción del WABA / callback público.

Si aparece un evento pero `whatsapp_messages` no recibe la fila, el problema está dentro del procesamiento/persistencia y el evento tendrá `processing_status=error` y `error_message`.
