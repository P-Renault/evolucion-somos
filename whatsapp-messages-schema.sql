-- B10.5.15 · WhatsApp Messaging
-- SOMOS SOFTWARE CRM B10.5.14
-- Mensajería WhatsApp Cloud API

create table if not exists public.whatsapp_messages (
  id uuid primary key default gen_random_uuid(),
  phone_number text not null,
  direction text not null check (direction in ('inbound','outbound')),
  message_type text not null default 'text',
  body text,
  wamid text,
  status text,
  contact_name text,
  message_timestamp timestamptz not null default now(),
  raw jsonb,
  created_at timestamptz not null default now(),
  unique(wamid)
);

create index if not exists idx_whatsapp_messages_phone_time
on public.whatsapp_messages(phone_number, message_timestamp desc);

create index if not exists idx_whatsapp_messages_wamid
on public.whatsapp_messages(wamid);

create index if not exists idx_whatsapp_messages_direction
on public.whatsapp_messages(direction, message_timestamp desc);

alter table public.whatsapp_messages enable row level security;

drop policy if exists "whatsapp_messages_authenticated_select" on public.whatsapp_messages;
create policy "whatsapp_messages_authenticated_select"
on public.whatsapp_messages for select
to authenticated using (true);

drop policy if exists "whatsapp_messages_authenticated_insert" on public.whatsapp_messages;
create policy "whatsapp_messages_authenticated_insert"
on public.whatsapp_messages for insert
to authenticated with check (true);

drop policy if exists "whatsapp_messages_authenticated_update" on public.whatsapp_messages;
create policy "whatsapp_messages_authenticated_update"
on public.whatsapp_messages for update
to authenticated using (true) with check (true);

grant select, insert, update on public.whatsapp_messages to authenticated;
