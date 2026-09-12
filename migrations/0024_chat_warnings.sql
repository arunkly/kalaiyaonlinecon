create table if not exists chat_warnings (
  id serial primary key,
  user_id text not null,
  body text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists chat_warnings_user_idx on chat_warnings (user_id, created_at desc);
