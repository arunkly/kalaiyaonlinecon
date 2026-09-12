create table if not exists privacy_page (
  id integer primary key,
  intro text not null default '',
  extra text not null default '',
  fingerprint text not null default '',
  updated_at timestamptz not null default now()
);
