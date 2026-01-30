-- Seed: insert default banks (idempotent)
insert into expensify_banks (name, slug)
values
  ('Banco Pichincha', 'pichincha'),
  ('Produbanco', 'produbanco'),
  ('Banco de Guayaquil', 'guayaquil'),
  ('Banco del Pacifico', 'pacifico')
on conflict (name) do nothing;
