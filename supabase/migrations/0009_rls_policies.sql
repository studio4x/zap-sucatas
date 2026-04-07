alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.listing_images enable row level security;
alter table public.listing_attributes enable row level security;
alter table public.listing_questions enable row level security;
alter table public.listing_answers enable row level security;
alter table public.blog_posts enable row level security;
alter table public.system_settings enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.integration_logs enable row level security;

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_or_admin"
on public.profiles
for select
using (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "profiles_update_own_or_admin" on public.profiles;
create policy "profiles_update_own_or_admin"
on public.profiles
for update
to authenticated
using (auth_user_id = auth.uid() or public.is_admin())
with check (auth_user_id = auth.uid() or public.is_admin());

drop policy if exists "listings_select_public_owner_or_admin" on public.listings;
create policy "listings_select_public_owner_or_admin"
on public.listings
for select
using (
  status = 'approved'
  or user_id = public.current_profile_id()
  or public.is_admin()
);

drop policy if exists "listings_insert_own" on public.listings;
create policy "listings_insert_own"
on public.listings
for insert
to authenticated
with check (user_id = public.current_profile_id());

drop policy if exists "listings_update_own_or_admin" on public.listings;
create policy "listings_update_own_or_admin"
on public.listings
for update
to authenticated
using (user_id = public.current_profile_id() or public.is_admin())
with check (
  public.is_admin()
  or (user_id = public.current_profile_id() and status <> 'archived')
);

drop policy if exists "listing_images_select_public_owner_or_admin" on public.listing_images;
create policy "listing_images_select_public_owner_or_admin"
on public.listing_images
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.status = 'approved' or l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "listing_images_manage_owner_or_admin" on public.listing_images;
create policy "listing_images_manage_owner_or_admin"
on public.listing_images
for all
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "listing_attributes_select_public_owner_or_admin" on public.listing_attributes;
create policy "listing_attributes_select_public_owner_or_admin"
on public.listing_attributes
for select
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.status = 'approved' or l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "listing_attributes_manage_owner_or_admin" on public.listing_attributes;
create policy "listing_attributes_manage_owner_or_admin"
on public.listing_attributes
for all
to authenticated
using (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "listing_questions_select_public_owner_or_admin" on public.listing_questions;
create policy "listing_questions_select_public_owner_or_admin"
on public.listing_questions
for select
using (
  (
    status = 'published'
    and exists (
      select 1
      from public.listings l
      where l.id = listing_id
        and l.status = 'approved'
    )
  )
  or exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "listing_questions_insert_public_or_authenticated" on public.listing_questions;
create policy "listing_questions_insert_public_or_authenticated"
on public.listing_questions
for insert
to anon, authenticated
with check (
  exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.status = 'approved'
  )
  and (
    auth.uid() is not null
    or exists (
      select 1
      from public.system_settings s
      where s.allow_guest_questions = true
    )
  )
);

drop policy if exists "listing_questions_admin_update" on public.listing_questions;
create policy "listing_questions_admin_update"
on public.listing_questions
for update
to authenticated
using (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.user_id = public.current_profile_id()
  )
)
with check (
  public.is_admin()
  or exists (
    select 1
    from public.listings l
    where l.id = listing_id
      and l.user_id = public.current_profile_id()
  )
);

drop policy if exists "listing_answers_select_public_owner_or_admin" on public.listing_answers;
create policy "listing_answers_select_public_owner_or_admin"
on public.listing_answers
for select
using (
  exists (
    select 1
    from public.listing_questions q
    join public.listings l on l.id = q.listing_id
    where q.id = question_id
      and (
        (q.status = 'published' and l.status = 'approved')
        or l.user_id = public.current_profile_id()
        or public.is_admin()
      )
  )
);

drop policy if exists "listing_answers_manage_owner_or_admin" on public.listing_answers;
create policy "listing_answers_manage_owner_or_admin"
on public.listing_answers
for all
to authenticated
using (
  exists (
    select 1
    from public.listing_questions q
    join public.listings l on l.id = q.listing_id
    where q.id = question_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
)
with check (
  exists (
    select 1
    from public.listing_questions q
    join public.listings l on l.id = q.listing_id
    where q.id = question_id
      and (l.user_id = public.current_profile_id() or public.is_admin())
  )
);

drop policy if exists "blog_posts_select_published_or_admin" on public.blog_posts;
create policy "blog_posts_select_published_or_admin"
on public.blog_posts
for select
using (status = 'published' or public.is_admin());

drop policy if exists "blog_posts_admin_manage" on public.blog_posts;
create policy "blog_posts_admin_manage"
on public.blog_posts
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "system_settings_public_select" on public.system_settings;
create policy "system_settings_public_select"
on public.system_settings
for select
using (true);

drop policy if exists "system_settings_admin_manage" on public.system_settings;
create policy "system_settings_admin_manage"
on public.system_settings
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists "admin_audit_logs_admin_select" on public.admin_audit_logs;
create policy "admin_audit_logs_admin_select"
on public.admin_audit_logs
for select
to authenticated
using (public.is_admin());

drop policy if exists "integration_logs_admin_select" on public.integration_logs;
create policy "integration_logs_admin_select"
on public.integration_logs
for select
to authenticated
using (public.is_admin());

insert into storage.buckets (id, name, public)
values
  ('listing-media', 'listing-media', true),
  ('blog-media', 'blog-media', true),
  ('site-assets', 'site-assets', true)
on conflict (id) do nothing;

drop policy if exists "storage_public_read" on storage.objects;
create policy "storage_public_read"
on storage.objects
for select
using (bucket_id in ('listing-media', 'blog-media', 'site-assets'));

drop policy if exists "storage_listing_media_insert_own_folder" on storage.objects;
create policy "storage_listing_media_insert_own_folder"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "storage_listing_media_update_own_folder" on storage.objects;
create policy "storage_listing_media_update_own_folder"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
)
with check (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "storage_listing_media_delete_own_folder" on storage.objects;
create policy "storage_listing_media_delete_own_folder"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'listing-media'
  and (storage.foldername(name))[1] = 'users'
  and (storage.foldername(name))[2] = auth.uid()::text
);

drop policy if exists "storage_admin_manage_editorial_assets" on storage.objects;
create policy "storage_admin_manage_editorial_assets"
on storage.objects
for all
to authenticated
using (bucket_id in ('blog-media', 'site-assets') and public.is_admin())
with check (bucket_id in ('blog-media', 'site-assets') and public.is_admin());
