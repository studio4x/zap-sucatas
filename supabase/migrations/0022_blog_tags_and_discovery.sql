alter table public.blog_posts
add column if not exists tags text[] not null default '{}';

update public.blog_posts
set tags = '{}'
where tags is null;

create index if not exists idx_blog_posts_status_published_at
  on public.blog_posts (status, published_at desc);

create index if not exists idx_blog_posts_tags_gin
  on public.blog_posts
  using gin (tags);
