alter table desk_stories add column if not exists deleted_at timestamptz;
alter table desk_stories add column if not exists updated_at timestamptz not null default now();
create index if not exists desk_stories_deleted_at_idx on desk_stories (deleted_at);

create table if not exists desk_categories (
  id serial primary key,
  slug text not null unique,
  label text not null,
  created_at timestamptz not null default now()
);

insert into desk_categories (slug, label)
values
  ('local', 'स्थानीय'),
  ('politics', 'राजनीति'),
  ('crime', 'अपराध'),
  ('business', 'व्यापार'),
  ('health', 'स्वास्थ्य'),
  ('sports', 'खेलकुद'),
  ('community', 'समुदाय'),
  ('development', 'विकास')
on conflict (slug) do nothing;
