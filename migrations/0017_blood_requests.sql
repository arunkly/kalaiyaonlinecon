create table if not exists blood_requests (
  id serial primary key,
  patient text not null,
  blood_group text not null,
  hospital text not null default '',
  place text not null default '',
  units integer not null default 1,
  phone text not null default '',
  needed_by text not null default '',
  note text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists blood_requests_active_idx on blood_requests (active, created_at desc);
