# Despliegue B10.5.2

1. Abrir Supabase > Edge Functions > `meta-sync`.
2. Reemplazar el contenido de `index.ts` por `meta-sync/index.ts`.
3. Confirmar Secrets:
   - META_ACCESS_TOKEN
   - META_PAGE_ID
   - META_INSTAGRAM_ID
   - META_GRAPH_VERSION
   - SUPABASE_SERVICE_ROLE_KEY
4. Deploy.
5. Volver al CRM y pulsar `Sincronizar Meta`.
6. Ejecutar la query de verificación del README.

No cambiar ningún secret de WhatsApp.
