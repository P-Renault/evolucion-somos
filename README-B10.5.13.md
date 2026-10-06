# B10.5.13 — WhatsApp Status Fix

Corrige una regresión del CRM: el estado de WhatsApp vuelve a consultarse directamente contra la Edge Function `whatsapp-api` usando la sesión autenticada.

No modifica secretos, Supabase, `whatsapp-api`, `meta-posts` ni `meta-sync`.
Solo reemplazar `crm.html` en GitHub Pages. Incluye botón `Probar WhatsApp`.
