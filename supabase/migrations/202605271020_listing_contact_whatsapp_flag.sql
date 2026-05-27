alter table public.listings
add column if not exists contact_phone_is_whatsapp boolean not null default false;
