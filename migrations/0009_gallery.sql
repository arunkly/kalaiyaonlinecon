create table if not exists gallery_categories (
  id serial primary key,
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists gallery_posts (
  id serial primary key,
  slug text not null unique,
  title text not null,
  place text not null default 'कलैया',
  blurb text not null default '',
  category text not null default 'local',
  cover_url text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists gallery_posts_category_idx on gallery_posts (category);

create table if not exists gallery_photos (
  id serial primary key,
  post_id integer not null references gallery_posts(id) on delete cascade,
  image_url text not null,
  caption text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists gallery_photos_post_id_idx on gallery_photos (post_id);
