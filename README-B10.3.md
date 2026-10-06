# Somos Software CRM · B10.3

B10.3 es una capa aditiva sobre B10.2. Mantiene autenticación, Supabase y módulos existentes.

## Incluye
- Centro Ejecutivo: KPIs, ranking de canales, señales de negocio y campañas.
- Atribución: origen → lead → venta; campañas/UTM detectadas.
- Inteligencia Social operativa: historial de sincronizaciones Meta.
- Persistencia del historial `social_sync_logs`.
- Preparación para datos reales de Meta sin almacenar tokens en frontend.

## Archivos
- `crm.html`
- `crm-data.js`
- `supabase-b10.3.sql`
- archivos B10.2 de soporte

## SQL
Ejecutar `supabase-b10.3.sql` después de B10.2. Es aditivo y usa `if not exists`/vistas reemplazables.

## Meta
La integración real sigue dependiendo de `meta-sync` y de los secrets de Supabase. Los secretos deben permanecer en Edge Functions, nunca en GitHub Pages.
