alter table blood_donors add column if not exists user_id text;
create index if not exists blood_donors_user_idx on blood_donors (user_id);
