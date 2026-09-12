create table if not exists market_snapshots (
  day date primary key,
  payload jsonb not null,
  created_at timestamptz not null default now()
);
