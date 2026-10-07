-- CMCRM B10.10 · Cierre Comercial / Ventas
-- Ejecutar una sola vez en Supabase SQL Editor.
-- No modifica ni reemplaza las Edge Functions de WhatsApp.

create extension if not exists pgcrypto;

create table if not exists public.crm_sales (
  id uuid primary key default gen_random_uuid(),
  sale_number text not null unique,
  quote_id uuid null references public.crm_quotes(id) on delete set null,
  lead_id uuid null,
  customer_name text not null,
  customer_business text,
  customer_email text,
  customer_phone text,
  sale_date date not null default current_date,
  due_date date,
  status text not null default 'Confirmada'
    check (status in ('Confirmada','En proceso','Entregada','Pagada','Anulada')),
  payment_status text not null default 'Pendiente'
    check (payment_status in ('Pendiente','Parcial','Pagada')),
  payment_method text,
  subtotal numeric(14,2) not null default 0,
  discount numeric(14,2) not null default 0,
  tax numeric(14,2) not null default 0,
  total numeric(14,2) not null default 0,
  paid_amount numeric(14,2) not null default 0,
  notes text,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists crm_sales_created_by_idx on public.crm_sales(created_by);
create index if not exists crm_sales_quote_idx on public.crm_sales(quote_id);
create index if not exists crm_sales_lead_idx on public.crm_sales(lead_id);
create index if not exists crm_sales_status_idx on public.crm_sales(status);
create index if not exists crm_sales_sale_date_idx on public.crm_sales(sale_date desc);

alter table public.crm_sales enable row level security;

drop policy if exists "crm_sales_select_own" on public.crm_sales;
drop policy if exists "crm_sales_insert_own" on public.crm_sales;
drop policy if exists "crm_sales_update_own" on public.crm_sales;

create policy "crm_sales_select_own"
on public.crm_sales for select
using (auth.uid()=created_by);

create policy "crm_sales_insert_own"
on public.crm_sales for insert
with check (auth.uid()=created_by);

create policy "crm_sales_update_own"
on public.crm_sales for update
using (auth.uid()=created_by)
with check (auth.uid()=created_by);

-- Realtime para actualización automática del módulo VENTAS.
alter publication supabase_realtime add table public.crm_sales;
