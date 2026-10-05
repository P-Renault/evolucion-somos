-- SOMOS SOFTWARE · B10.0 · INTELIGENCIA COMERCIAL
-- Ejecutar DESPUÉS del esquema B9.4.x. No modifica ni elimina tablas existentes.

create table if not exists public.lead_intelligence (
  lead_id uuid primary key references public.leads(id) on delete cascade,
  score numeric(5,2) not null default 0,
  grade text not null default 'C',
  probability numeric(5,4) not null default 0,
  estimated_value numeric(14,2) not null default 0,
  stagnation_days integer not null default 0,
  risk_level text not null default 'normal',
  rationale jsonb not null default '[]'::jsonb,
  next_best_action text,
  calculated_at timestamptz not null default now()
);

create table if not exists public.social_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook','instagram','whatsapp')),
  account_id text not null,
  account_name text,
  account_url text,
  active boolean not null default true,
  last_sync_at timestamptz,
  sync_status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique(platform, account_id)
);

create table if not exists public.social_metrics (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook','instagram','whatsapp')),
  account_id text not null,
  metric_date date not null,
  followers integer,
  followers_gained integer,
  followers_lost integer,
  reach integer,
  impressions integer,
  engagement integer,
  profile_visits integer,
  website_clicks integer,
  whatsapp_clicks integer,
  messages integer,
  leads integer,
  revenue numeric(14,2) not null default 0,
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(platform, account_id, metric_date)
);

create table if not exists public.commercial_events (
  id uuid primary key default gen_random_uuid(),
  event_name text not null,
  event_type text not null default 'web',
  source text,
  medium text,
  campaign text,
  landing text,
  session_id text,
  lead_id uuid references public.leads(id) on delete set null,
  value numeric(14,2) not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.commercial_targets (
  id uuid primary key default gen_random_uuid(),
  period_start date not null,
  period_end date not null,
  revenue_target numeric(14,2) not null default 0,
  leads_target integer not null default 0,
  won_target integer not null default 0,
  created_at timestamptz not null default now(),
  unique(period_start, period_end)
);

create index if not exists idx_lead_intelligence_score on public.lead_intelligence(score desc);
create index if not exists idx_social_metrics_date on public.social_metrics(metric_date desc);
create index if not exists idx_social_metrics_platform_date on public.social_metrics(platform, metric_date desc);
create index if not exists idx_commercial_events_created on public.commercial_events(created_at desc);
create index if not exists idx_commercial_events_campaign on public.commercial_events(campaign);

alter table public.lead_intelligence enable row level security;
alter table public.social_accounts enable row level security;
alter table public.social_metrics enable row level security;
alter table public.commercial_events enable row level security;
alter table public.commercial_targets enable row level security;

drop policy if exists lead_intelligence_authenticated_select on public.lead_intelligence;
create policy lead_intelligence_authenticated_select on public.lead_intelligence for select to authenticated using (true);
drop policy if exists lead_intelligence_authenticated_write on public.lead_intelligence;
create policy lead_intelligence_authenticated_write on public.lead_intelligence for all to authenticated using (true) with check (true);

drop policy if exists social_accounts_authenticated_select on public.social_accounts;
create policy social_accounts_authenticated_select on public.social_accounts for select to authenticated using (true);
drop policy if exists social_accounts_authenticated_write on public.social_accounts;
create policy social_accounts_authenticated_write on public.social_accounts for all to authenticated using (true) with check (true);

drop policy if exists social_metrics_authenticated_select on public.social_metrics;
create policy social_metrics_authenticated_select on public.social_metrics for select to authenticated using (true);
drop policy if exists social_metrics_authenticated_write on public.social_metrics;
create policy social_metrics_authenticated_write on public.social_metrics for all to authenticated using (true) with check (true);

drop policy if exists commercial_events_authenticated_select on public.commercial_events;
create policy commercial_events_authenticated_select on public.commercial_events for select to authenticated using (true);
drop policy if exists commercial_events_authenticated_write on public.commercial_events;
create policy commercial_events_authenticated_write on public.commercial_events for all to authenticated using (true) with check (true);

drop policy if exists commercial_targets_authenticated_select on public.commercial_targets;
create policy commercial_targets_authenticated_select on public.commercial_targets for select to authenticated using (true);
drop policy if exists commercial_targets_authenticated_write on public.commercial_targets;
create policy commercial_targets_authenticated_write on public.commercial_targets for all to authenticated using (true) with check (true);

grant select,insert,update,delete on public.lead_intelligence to authenticated;
grant select,insert,update,delete on public.social_accounts to authenticated;
grant select,insert,update,delete on public.social_metrics to authenticated;
grant select,insert,update,delete on public.commercial_events to authenticated;
grant select,insert,update,delete on public.commercial_targets to authenticated;
