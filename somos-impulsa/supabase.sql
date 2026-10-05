-- SOMOS IMPULSA · Supabase
-- Ejecutar en SQL Editor. NO expone service_role.
create extension if not exists pgcrypto;

create table if not exists public.somos_impulsa_postulaciones (
  id uuid primary key default gen_random_uuid(),
  campaign_code text not null default 'SOMOS-IMPULSA-2026',
  status text not null default 'POSTULANTE',
  full_name text not null,
  email text not null,
  phone text not null,
  business_name text not null,
  industry text not null,
  city text not null,
  instagram text,
  facebook text,
  current_website text,
  follows_somos text not null,
  business_description text not null,
  problem text not null,
  goal text not null,
  products_services text not null,
  has_logo text not null,
  has_content text not null,
  content_commitment text not null,
  accept_terms boolean not null,
  accept_external_costs boolean not null,
  portfolio_ok boolean not null default false,
  review_ok boolean not null default false,
  video_ok boolean not null default false,
  promo_ok boolean not null default false,
  source text,
  medium text,
  campaign text,
  content text,
  landing_path text,
  referrer text,
  user_agent text,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

alter table public.somos_impulsa_postulaciones enable row level security;

-- El formulario público solo necesita INSERT.
drop policy if exists "somos_impulsa_public_insert" on public.somos_impulsa_postulaciones;
create policy "somos_impulsa_public_insert"
on public.somos_impulsa_postulaciones
for insert
to anon
with check (
  accept_terms = true
  and accept_external_costs = true
  and status = 'POSTULANTE'
);

-- No crear SELECT público. La lectura debe hacerse desde el CRM/rol autorizado.
-- Recomendación: añadir rate limiting/WAF/Turnstile antes de producción.
