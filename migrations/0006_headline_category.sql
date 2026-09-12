insert into desk_categories (slug, label)
values ('headline', 'हेडलाइन')
on conflict (slug) do nothing;
