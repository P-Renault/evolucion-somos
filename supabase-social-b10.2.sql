-- ============================================================
-- SOMOS SOFTWARE · B10.2 · SOCIAL SYNC HARDENING
-- ============================================================
-- Aditivo sobre B10.0/B10.1. No elimina tablas existentes.
-- ============================================================

create table if not exists public.social_sync_logs (
  id uuid primary key default gen_random_uuid(),
  started_at timestamptz not null default now(),
  finished_at timestamptz,
  status text not null default 'running'
    check (status in ('running','success','partial','error')),
  requested_by uuid references auth.users(id) on delete set null,
  facebook_ok boolean not null default false,
  instagram_ok boolean not null default false,
  facebook_followers integer,
  instagram_followers integer,
  error_message text,
  details jsonb not null default '{}'::jsonb
);

create index if not exists idx_social_sync_logs_started
on public.social_sync_logs(started_at desc);

create index if not exists idx_social_sync_logs_status
on public.social_sync_logs(status);

alter table public.social_sync_logs enable row level security;

drop policy if exists social_sync_logs_authenticated_select
on public.social_sync_logs;

create policy social_sync_logs_authenticated_select
on public.social_sync_logs
for select to authenticated
using (true);

grant select on public.social_sync_logs to authenticated;

-- Vista operativa: último estado conocido por plataforma.
create or replace view public.social_latest_metrics as
select distinct on (platform, account_id)
  platform,
  account_id,
  metric_date,
  followers,
  followers_gained,
  followers_lost,
  reach,
  impressions,
  engagement,
  profile_visits,
  website_clicks,
  whatsapp_clicks,
  messages,
  leads,
  revenue,
  created_at
from public.social_metrics
order by platform, account_id, metric_date desc;

grant select on public.social_latest_metrics to authenticated;

-- ============================================================
-- FIN B10.2
-- ============================================================
