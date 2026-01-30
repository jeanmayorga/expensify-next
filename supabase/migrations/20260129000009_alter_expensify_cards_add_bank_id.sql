-- Add bank_id to expensify_cards (FK to expensify_banks)
alter table expensify_cards
  add column if not exists bank_id uuid null;

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'expensify_cards_bank_id_fkey'
  ) then
    alter table expensify_cards
      add constraint expensify_cards_bank_id_fkey
      foreign key (bank_id)
      references expensify_banks(id)
      on delete set null;
  end if;
end $$;

create index if not exists idx_expensify_cards_bank_id
  on expensify_cards(bank_id);

-- Backfill: set bank_id from bank name where possible
update expensify_cards c
set bank_id = b.id
from expensify_banks b
where c.bank = b.name and c.bank_id is null;
