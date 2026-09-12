create table if not exists user_roles (
  user_id text primary key,
  role text not null default 'member',
  updated_at timestamptz not null default now()
);

create table if not exists ads (
  id serial primary key,
  slot text not null,
  kind text not null default 'text',
  title text not null default '',
  body text not null default '',
  image_url text not null default '',
  html text not null default '',
  href text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists ads_slot_idx on ads (slot);

create table if not exists mail_settings (
  id integer primary key,
  from_email text not null default 'noreply@kalaiyaonline.com',
  from_name text not null default 'KalaiyaOnline',
  resend_key text not null default ''
);

insert into mail_settings (id, from_email, from_name, resend_key)
values (1, 'noreply@kalaiyaonline.com', 'KalaiyaOnline', '')
on conflict (id) do nothing;
