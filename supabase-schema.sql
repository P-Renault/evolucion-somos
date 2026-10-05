-- SOMOS SOFTWARE · CRM B9.4
-- Ejecutar en Supabase SQL Editor.
-- Requiere RLS. No utilizar service_role key en el frontend.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'seller' check (role in ('admin','seller','viewer')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  external_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  business text,
  contact text not null,
  need text,
  timeline text,
  budget text,
  message text,
  source text,
  medium text,
  campaign text,
  landing text,
  intent text,
  state text not null default 'Nuevo',
  priority text not null default 'Media',
  next_action text,
  next_date date,
  value numeric(14,2) not null default 0,
  owner_id uuid references public.profiles(id),
  owner text,
  notes text
);

create table if not exists public.lead_activities (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  user_id uuid references auth.users(id),
  activity_type text not null default 'nota',
  note text,
  created_at timestamptz not null default now()
);

create index if not exists leads_state_idx on public.leads(state);
create index if not exists leads_next_date_idx on public.leads(next_date);
create index if not exists leads_created_at_idx on public.leads(created_at desc);
create index if not exists lead_activities_lead_idx on public.lead_activities(lead_id, created_at desc);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at before update on public.leads
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;
alter table public.lead_activities enable row level security;

drop policy if exists "profiles_select_authenticated" on public.profiles;
create policy "profiles_select_authenticated" on public.profiles
for select to authenticated using (active = true);

drop policy if exists "leads_select_authenticated" on public.leads;
create policy "leads_select_authenticated" on public.leads
for select to authenticated using (true);

drop policy if exists "leads_insert_authenticated" on public.leads;
create policy "leads_insert_authenticated" on public.leads
for insert to authenticated with check (true);

drop policy if exists "leads_update_authenticated" on public.leads;
create policy "leads_update_authenticated" on public.leads
for update to authenticated using (true) with check (true);

drop policy if exists "activities_select_authenticated" on public.lead_activities;
create policy "activities_select_authenticated" on public.lead_activities
for select to authenticated using (true);

drop policy if exists "activities_insert_authenticated" on public.lead_activities;
create policy "activities_insert_authenticated" on public.lead_activities
for insert to authenticated with check (auth.uid() = user_id);


-- Captura pública desde la landing: solo INSERT. No se permite SELECT/UPDATE/DELETE a anon.
drop policy if exists "leads_insert_anon_capture" on public.leads;
create policy "leads_insert_anon_capture" on public.leads
for insert to anon with check (true);

-- Crear el perfil después de crear el usuario en Authentication:
-- insert into public.profiles (id, full_name, role)
-- values ('UUID_DEL_USUARIO_AUTH', 'Administrador Somos Software', 'admin');
