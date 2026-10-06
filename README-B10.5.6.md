# Somos Software CRM B10.5.6 — Sincronización Integral Redes & Canales

## Objetivo
Unificar desde el CRM la sincronización de métricas Meta y publicaciones Facebook/Instagram en una sola acción, sin modificar WhatsApp ni la base de datos.

## Cambios
- `crm-data.js`: nuevo `CRMStore.syncSocialAll()` ejecuta `meta-sync` y `meta-posts` en paralelo, con los timeouts ya existentes.
- `crm.html`: el botón `Sincronizar publicaciones` pasa a `Sincronizar Redes` y ejecuta la sincronización integral.
- El CRM refresca `renderSocial()` una sola vez al finalizar ambos procesos.
- El resultado diferencia éxito total, éxito parcial y error total.
- Se mantienen independientes las funciones de WhatsApp.

## Instalación
Reemplazar en GitHub:
- `crm.html`
- `crm-data.js`

No ejecutar SQL nuevo.
No modificar `whatsapp-api` ni sus Secrets.
