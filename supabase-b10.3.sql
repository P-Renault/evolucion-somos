-- SOMOS SOFTWARE · B10.3 · CENTRO EJECUTIVO + ATRIBUCIÓN
-- Aditivo sobre B10.0/B10.2. No elimina ni modifica tablas existentes.

create index if not exists idx_leads_source_campaign on public.leads(source, campaign);
create index if not exists idx_commercial_events_source_medium_campaign on public.commercial_events(source, medium, campaign);

-- Vista agregada para explotación futura desde reportes.
create or replace view public.v_commercial_attribution as
select
  coalesce(nullif(trim(source), ''), 'direct') as source,
  count(*)::int as leads,
  count(*) filter (where state='Ganado')::int as won,
  coalesce(sum(value) filter (where state='Ganado'),0)::numeric(14,2) as revenue,
  coalesce(sum(value) filter (where state not in ('Ganado','Perdido')),0)::numeric(14,2) as open_pipeline
from public.leads
group by coalesce(nullif(trim(source), ''), 'direct');

grant select on public.v_commercial_attribution to authenticated;

-- Vista de campañas para reportes y futuras Edge Functions.
create or replace view public.v_campaign_attribution as
select
  coalesce(nullif(trim(campaign), ''), 'Sin campaña') as campaign,
  coalesce(nullif(trim(source), ''), 'direct') as source,
  coalesce(nullif(trim(medium), ''), '—') as medium,
  count(*)::int as leads,
  count(*) filter (where state='Ganado')::int as won,
  coalesce(sum(value) filter (where state='Ganado'),0)::numeric(14,2) as revenue,
  coalesce(sum(value) filter (where state not in ('Ganado','Perdido')),0)::numeric(14,2) as open_pipeline
from public.leads
group by 1,2,3;

grant select on public.v_campaign_attribution to authenticated;

-- Índices de sincronización para historial operativo.
create index if not exists idx_social_sync_logs_finished on public.social_sync_logs(finished_at desc);
