-- Somos Software CRM B10.6.0
-- Contactos + calendario editorial + soporte de WhatsApp/CRM

create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  business text,
  contact_type text not null default 'Prospecto' check (contact_type in ('Prospecto','Cliente','Proveedor','Otro')),
  lead_id uuid references public.leads(id) on delete set null,
  source text,
  notes text,
  tags text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(phone)
);
create index if not exists idx_contacts_name on public.contacts(name);
create index if not exists idx_contacts_email on public.contacts(email);
create index if not exists idx_contacts_business on public.contacts(business);
create index if not exists idx_contacts_lead on public.contacts(lead_id);
alter table public.contacts enable row level security;
drop policy if exists "contacts_authenticated_select" on public.contacts;
create policy "contacts_authenticated_select" on public.contacts for select to authenticated using (true);
drop policy if exists "contacts_authenticated_insert" on public.contacts;
create policy "contacts_authenticated_insert" on public.contacts for insert to authenticated with check (true);
drop policy if exists "contacts_authenticated_update" on public.contacts;
create policy "contacts_authenticated_update" on public.contacts for update to authenticated using (true) with check (true);
drop policy if exists "contacts_authenticated_delete" on public.contacts;
create policy "contacts_authenticated_delete" on public.contacts for delete to authenticated using (true);
grant select, insert, update, delete on public.contacts to authenticated;

create or replace function public.touch_contacts_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists trg_contacts_updated_at on public.contacts;
create trigger trg_contacts_updated_at before update on public.contacts for each row execute function public.touch_contacts_updated_at();

create table if not exists public.social_publication_calendar (
  id uuid primary key default gen_random_uuid(),
  scheduled_at timestamptz not null,
  platform text not null check (platform in ('facebook','instagram','facebook+instagram')),
  status text not null default 'Planificada' check (status in ('Borrador','Planificada','Publicada','Cancelada')),
  content_type text not null default 'Post',
  title text,
  caption text,
  media_url text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  external_post_id text,
  permalink_url text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_social_calendar_date on public.social_publication_calendar(scheduled_at);
create index if not exists idx_social_calendar_platform on public.social_publication_calendar(platform);
create index if not exists idx_social_calendar_status on public.social_publication_calendar(status);
alter table public.social_publication_calendar enable row level security;
drop policy if exists "social_calendar_authenticated_select" on public.social_publication_calendar;
create policy "social_calendar_authenticated_select" on public.social_publication_calendar for select to authenticated using (true);
drop policy if exists "social_calendar_authenticated_insert" on public.social_publication_calendar;
create policy "social_calendar_authenticated_insert" on public.social_publication_calendar for insert to authenticated with check (true);
drop policy if exists "social_calendar_authenticated_update" on public.social_publication_calendar;
create policy "social_calendar_authenticated_update" on public.social_publication_calendar for update to authenticated using (true) with check (true);
drop policy if exists "social_calendar_authenticated_delete" on public.social_publication_calendar;
create policy "social_calendar_authenticated_delete" on public.social_publication_calendar for delete to authenticated using (true);
grant select, insert, update, delete on public.social_publication_calendar to authenticated;

create or replace function public.touch_social_calendar_updated_at() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end; $$;
drop trigger if exists trg_social_calendar_updated_at on public.social_publication_calendar;
create trigger trg_social_calendar_updated_at before update on public.social_publication_calendar for each row execute function public.touch_social_calendar_updated_at();


-- B10.6.2 — Contacto 360 + actividad + Realtime editorial/comercial
create table if not exists public.contact_activities (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  activity_type text not null default 'Nota' check (activity_type in ('Nota','Llamada','WhatsApp','Correo','Reunión','Seguimiento','Cotización','Otro')),
  subject text,
  body text,
  activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists idx_contact_activities_contact_time on public.contact_activities(contact_id, activity_at desc);
alter table public.contact_activities enable row level security;
drop policy if exists "contact_activities_authenticated_select" on public.contact_activities;
create policy "contact_activities_authenticated_select" on public.contact_activities for select to authenticated using (true);
drop policy if exists "contact_activities_authenticated_insert" on public.contact_activities;
create policy "contact_activities_authenticated_insert" on public.contact_activities for insert to authenticated with check (true);
drop policy if exists "contact_activities_authenticated_update" on public.contact_activities;
create policy "contact_activities_authenticated_update" on public.contact_activities for update to authenticated using (true) with check (true);
drop policy if exists "contact_activities_authenticated_delete" on public.contact_activities;
create policy "contact_activities_authenticated_delete" on public.contact_activities for delete to authenticated using (true);
grant select, insert, update, delete on public.contact_activities to authenticated;

-- Realtime: solo las tablas necesarias para la experiencia editorial/comercial.
do $$
begin
  begin alter publication supabase_realtime add table public.contacts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.contact_activities; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.social_publication_calendar; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.social_posts; exception when duplicate_object then null; end;
  begin alter publication supabase_realtime add table public.social_metrics; exception when duplicate_object then null; end;
end $$;
