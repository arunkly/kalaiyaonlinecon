create table if not exists dir_categories (
  id serial primary key,
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

create table if not exists dir_entries (
  id serial primary key,
  name text not null,
  category text not null default 'local',
  place text not null default 'कलैया',
  note text not null default '',
  phone text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists dir_entries_category_idx on dir_entries (category);
