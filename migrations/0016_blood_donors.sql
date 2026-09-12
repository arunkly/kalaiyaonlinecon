create table if not exists blood_donors (
  id serial primary key,
  name text not null,
  blood_group text not null,
  phone text not null default '',
  place text not null default '',
  age integer,
  gender text not null default '',
  last_donated text not null default '',
  available boolean not null default true,
  note text not null default '',
  photo_url text not null default '',
  created_at timestamptz not null default now()
);
create index if not exists blood_donors_group_idx on blood_donors (blood_group);
