-- SOMOS SOFTWARE CRM B10.5.1
-- Reparación no destructiva para cuentas sociales.
-- No elimina publicaciones ni métricas.

create index if not exists idx_social_accounts_platform_active
on public.social_accounts(platform, active);

grant select, insert, update on public.social_accounts to authenticated;

-- No inserta cuentas manualmente: meta-sync/meta-posts las registrarán con IDs reales.
