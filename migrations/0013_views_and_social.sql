alter table desk_stories add column if not exists views integer not null default 0;
alter table gallery_posts add column if not exists views integer not null default 0;
alter table dir_entries add column if not exists views integer not null default 0;

create table if not exists friend_links (
  id serial primary key,
  user_id text not null,
  peer_id text not null,
  status text not null default 'pending',
  created_at timestamptz not null default now(),
  unique (user_id, peer_id)
);
create index if not exists friend_links_user_idx on friend_links (user_id);
create index if not exists friend_links_peer_idx on friend_links (peer_id);

create table if not exists chat_messages (
  id serial primary key,
  from_id text not null,
  to_id text not null,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists chat_messages_pair_idx on chat_messages (from_id, to_id, created_at);

create table if not exists pokes (
  id serial primary key,
  from_id text not null,
  to_id text not null,
  created_at timestamptz not null default now()
);
