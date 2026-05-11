create table if not exists public.listing_featured_payments (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(12,2) not null,
  currency text not null default 'BRL',
  billing_type text not null default 'PIX',
  status text not null default 'pending',
  asaas_customer_id text,
  asaas_payment_id text not null unique,
  asaas_invoice_url text,
  asaas_bank_slip_url text,
  asaas_pix_qr_code text,
  asaas_pix_copy_paste text,
  due_date date,
  paid_at timestamptz,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_featured_payments_status_check check (
    status in ('pending', 'paid', 'expired', 'canceled', 'failed')
  ),
  constraint listing_featured_payments_amount_check check (amount > 0)
);

create index if not exists listing_featured_payments_listing_created_idx
  on public.listing_featured_payments(listing_id, created_at desc);

create index if not exists listing_featured_payments_user_created_idx
  on public.listing_featured_payments(user_id, created_at desc);

create index if not exists listing_featured_payments_status_created_idx
  on public.listing_featured_payments(status, created_at desc);

drop trigger if exists set_listing_featured_payments_updated_at on public.listing_featured_payments;
create trigger set_listing_featured_payments_updated_at
before update on public.listing_featured_payments
for each row
execute function public.set_updated_at();

alter table public.listing_featured_payments enable row level security;

drop policy if exists "listing_featured_payments_select_owner_or_admin" on public.listing_featured_payments;
create policy "listing_featured_payments_select_owner_or_admin"
on public.listing_featured_payments
for select
to authenticated
using (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "listing_featured_payments_insert_owner_or_admin" on public.listing_featured_payments;
create policy "listing_featured_payments_insert_owner_or_admin"
on public.listing_featured_payments
for insert
to authenticated
with check (user_id = public.current_profile_id() or public.is_admin());

drop policy if exists "listing_featured_payments_update_admin_only" on public.listing_featured_payments;
create policy "listing_featured_payments_update_admin_only"
on public.listing_featured_payments
for update
to authenticated
using (public.is_admin())
with check (public.is_admin());
