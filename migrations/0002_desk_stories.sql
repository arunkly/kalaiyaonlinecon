create table if not exists desk_stories (
  id serial primary key,
  user_id text not null,
  slug text not null unique,
  title text not null,
  excerpt text not null,
  body text not null,
  category text not null default 'local',
  location text not null default 'Kalaiya, Bara',
  tags text not null default '',
  published boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists desk_stories_user_id_idx on desk_stories (user_id);
create index if not exists desk_stories_published_idx on desk_stories (published);
