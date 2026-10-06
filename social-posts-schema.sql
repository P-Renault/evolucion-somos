-- SOMOS SOFTWARE CRM B10.5
-- Registro de publicaciones de Facebook e Instagram.

create table if not exists public.social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('facebook','instagram')),
  external_id text not null,
  account_id text not null,
  account_name text,
  published_at timestamptz,
  media_type text,
  message text,
  caption text,
  permalink_url text,
  media_url text,
  thumbnail_url text,
  campaign text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  reach integer,
  impressions integer,
  engagement integer,
  likes integer,
  comments integer,
  shares integer,
  clicks integer,
  leads integer not null default 0,
  revenue numeric(14,2) not null default 0,
  raw jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(platform, external_id)
);

create index if not exists idx_social_posts_published
on public.social_posts(published_at desc);

create index if not exists idx_social_posts_platform
on public.social_posts(platform, published_at desc);

create index if not exists idx_social_posts_campaign
on public.social_posts(campaign);

alter table public.social_posts enable row level security;

drop policy if exists "social_posts_authenticated_select" on public.social_posts;
create policy "social_posts_authenticated_select"
on public.social_posts for select to authenticated using (true);

drop policy if exists "social_posts_authenticated_insert" on public.social_posts;
create policy "social_posts_authenticated_insert"
on public.social_posts for insert to authenticated with check (true);

drop policy if exists "social_posts_authenticated_update" on public.social_posts;
create policy "social_posts_authenticated_update"
on public.social_posts for update to authenticated using (true) with check (true);

grant select, insert, update on public.social_posts to authenticated;

create or replace function public.touch_social_posts_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_social_posts_updated_at on public.social_posts;
create trigger trg_social_posts_updated_at
before update on public.social_posts
for each row execute function public.touch_social_posts_updated_at();
