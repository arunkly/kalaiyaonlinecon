create table if not exists desk_votes (
  id serial primary key,
  slug text not null,
  user_id text not null,
  value smallint not null,
  created_at timestamptz not null default now(),
  unique (slug, user_id)
);
create index if not exists desk_votes_slug_idx on desk_votes (slug);

create table if not exists desk_comments (
  id serial primary key,
  slug text not null,
  user_id text not null,
  author text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists desk_comments_slug_idx on desk_comments (slug);
