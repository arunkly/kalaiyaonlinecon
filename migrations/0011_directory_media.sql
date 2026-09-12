alter table dir_entries add column if not exists image_url text not null default '';
alter table dir_entries add column if not exists map_url text not null default '';
