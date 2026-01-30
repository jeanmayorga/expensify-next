-- expensify_cards: remove bank (text), use only bank_id (FK to expensify_banks)
alter table expensify_cards
  drop column if exists bank;
