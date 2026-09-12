alter table member_profiles add column if not exists address text not null default '';
alter table member_profiles add column if not exists phone text not null default '';
alter table member_profiles add column if not exists status text not null default '';

create table if not exists password_resets (
  token text primary key,
  email text not null,
  expires_at timestamptz not null
);
create index if not exists password_resets_email_idx on password_resets (email);
