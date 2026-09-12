alter table about_page add column if not exists org_name text not null default 'KalaiyaOnline';
alter table about_page add column if not exists registration_no text not null default '';
alter table about_page add column if not exists extra_note text not null default '';
