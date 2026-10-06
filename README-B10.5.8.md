# B10.5.8 — CRM Redes & Canales: null.innerHTML fix

## Corrección
Se corrigió un error del frontend:
`Cannot set properties of null (setting 'innerHTML')`.

La causa era que `renderSocial()` intentaba escribir en `#syncRows`, pero el HTML actual no contiene ese elemento.

## Cambios
- `#syncRows` ahora se actualiza solo si existe.
- Los botones opcionales de Redes & Canales se enlazan solo si existen.
- No cambia Supabase.
- No cambia Meta.
- No cambia WhatsApp.
- No cambia `crm-data.js` funcionalmente; se incluye para mantener el paquete autocontenido.

## Deploy
Reemplazar en GitHub:
- `crm.html`
- `crm-data.js`

Luego recargar el CRM y probar `REDES & CANALES -> Sincronizar Redes`.
