create table if not exists member_profiles (
  user_id text primary key,
  display_name text not null default '',
  photo_url text not null default '',
  updated_at timestamptz not null default now()
);
