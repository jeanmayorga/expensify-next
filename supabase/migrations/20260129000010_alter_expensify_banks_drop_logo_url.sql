-- Remove logo_url from expensify_banks
alter table expensify_banks
  drop column if exists logo_url;
