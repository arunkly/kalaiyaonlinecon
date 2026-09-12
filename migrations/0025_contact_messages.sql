create table if not exists contact_messages (
  id serial primary key,
  name text not null,
  address text not null default '',
  email text not null,
  phone text not null default '',
  message text not null,
  created_at timestamptz not null default now()
);
