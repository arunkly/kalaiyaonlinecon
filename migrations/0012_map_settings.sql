alter table dir_entries add column if not exists lat double precision;
alter table dir_entries add column if not exists lng double precision;

create table if not exists map_settings (
  id integer primary key,
  provider text not null default 'osm',
  lat double precision not null default 27.0336,
  lng double precision not null default 85.0026,
  zoom integer not null default 15,
  height integer not null default 240
);

insert into map_settings (id, provider, lat, lng, zoom, height)
values (1, 'osm', 27.0336, 85.0026, 15, 240)
on conflict (id) do nothing;
