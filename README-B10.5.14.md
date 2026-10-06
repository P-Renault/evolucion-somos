# SOMOS SOFTWARE CRM B10.5.14 — WhatsApp Messaging Panel

Adds a WhatsApp Cloud API messaging panel to the existing Redes & Canales module.

## 1. Supabase SQL

Run `whatsapp-messages-schema.sql` in SQL Editor.

## 2. Edge Function `whatsapp-api`

Replace `index.ts` with `whatsapp-api/index.ts` and deploy.

Existing secrets are reused:
- `WHATSAPP_ACCESS_TOKEN`
- `WHATSAPP_BUSINESS_ACCOUNT_ID`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_PHONE_NUMBER`
- `META_GRAPH_VERSION`

Do not put tokens in GitHub or the frontend.

## 3. Edge Function `whatsapp-webhook`

Create a new Edge Function named exactly `whatsapp-webhook` and deploy `whatsapp-webhook/index.ts`.

Set Secret:
- `WHATSAPP_WEBHOOK_VERIFY_TOKEN` = a private verification string you choose.

The webhook function must be publicly callable by Meta. In Supabase, disable JWT verification for this function (or deploy it with `verify_jwt = false`).

## 4. Meta Developers

Configure the WhatsApp Webhook callback URL as:
`https://<PROJECT-REF>.supabase.co/functions/v1/whatsapp-webhook`

Use the same `WHATSAPP_WEBHOOK_VERIFY_TOKEN` for verification and subscribe to the `messages` field.

The WABA must be subscribed to the app so Meta sends events to the callback.

## 5. GitHub Pages

Replace `crm.html` with this B10.5.14 version.

The panel uses the existing authenticated Supabase session and the existing `whatsapp-api` function. It lets the operator enter a destination number, send text, and load the conversation from `whatsapp_messages`.

## 6. Messaging window

Free-form text sending can be restricted by Meta's customer-service window. If Meta rejects a text because the conversation window is closed, use an approved template flow; this package intentionally does not invent or bypass template requirements.
