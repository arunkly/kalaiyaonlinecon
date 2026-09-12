alter table ads add column if not exists freq text not null default 'session';
alter table ads add column if not exists delay_sec integer not null default 2;
