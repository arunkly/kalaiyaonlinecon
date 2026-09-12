create table if not exists about_page (
  id integer primary key,
  title text not null default 'हाम्रोबारे',
  body text not null default '',
  phone text not null default '',
  email text not null default '',
  address text not null default '',
  facebook text not null default '',
  website text not null default 'https://kalaiyaonline.com'
);

insert into about_page (id, title, body, phone, email, address, facebook, website)
values (
  1,
  'हाम्रोबारे',
  'कलैयाअनलाइनले कलैया, बारा, पर्सा र तराई मधेशका स्थानीय समाचार समेट्छ।',
  '',
  '',
  'कलैया, बारा, मधेश',
  'https://www.facebook.com/kalaiyalive/',
  'https://kalaiyaonline.com'
)
on conflict (id) do nothing;
