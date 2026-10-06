# Somos Software CRM B10.5.3 — Meta Sync diagnóstico

Esta revisión corrige el estado de carga infinito de la sincronización Meta.

## Cambios
- `meta-sync/index.ts`: timeout de 12 s por consulta a Meta Graph API.
- `crm-data.js`: timeout de 25 s para la llamada a la Edge Function.
- Los errores ahora regresan al CRM en vez de dejar la interfaz indefinidamente en “Consultando”.

## Archivos
- `meta-sync/index.ts` → reemplazar la Edge Function `meta-sync`.
- `crm-data.js` → reemplazar el archivo del GitHub Pages.

No modifica `whatsapp-api`, WhatsApp Secrets ni las tablas.
