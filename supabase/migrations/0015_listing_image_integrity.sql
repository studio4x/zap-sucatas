with normalized_images as (
  select
    id,
    listing_id,
    row_number() over (
      partition by listing_id
      order by is_cover desc, sort_order asc, created_at asc, id asc
    ) - 1 as next_sort_order,
    row_number() over (
      partition by listing_id
      order by is_cover desc, sort_order asc, created_at asc, id asc
    ) = 1 as next_is_cover
  from public.listing_images
)
update public.listing_images as target
set
  sort_order = normalized_images.next_sort_order,
  is_cover = normalized_images.next_is_cover
from normalized_images
where normalized_images.id = target.id;

alter table public.listing_images
  drop constraint if exists listing_images_sort_order_non_negative;

alter table public.listing_images
  add constraint listing_images_sort_order_non_negative
  check (sort_order >= 0);

create unique index if not exists listing_images_single_cover_idx
  on public.listing_images (listing_id)
  where is_cover = true;

create unique index if not exists listing_images_listing_id_sort_order_unique_idx
  on public.listing_images (listing_id, sort_order);

create index if not exists listings_status_updated_at_idx
  on public.listings (status, updated_at desc);
