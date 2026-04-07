create table if not exists public.listing_questions (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  author_user_id uuid references public.profiles(id),
  guest_name text,
  guest_email text,
  question_text text not null,
  status text not null default 'published',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint listing_questions_status_check check (status in ('published', 'hidden', 'blocked'))
);

create table if not exists public.listing_answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null unique references public.listing_questions(id) on delete cascade,
  responder_user_id uuid not null references public.profiles(id),
  answer_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists listing_questions_listing_id_status_idx on public.listing_questions(listing_id, status);

drop trigger if exists set_listing_questions_updated_at on public.listing_questions;
create trigger set_listing_questions_updated_at
before update on public.listing_questions
for each row
execute function public.set_updated_at();

drop trigger if exists set_listing_answers_updated_at on public.listing_answers;
create trigger set_listing_answers_updated_at
before update on public.listing_answers
for each row
execute function public.set_updated_at();
