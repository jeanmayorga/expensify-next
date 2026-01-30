-- amount como double precision para que PostgREST devuelva siempre number en JSON
-- (DECIMAL a veces se serializa como string; real/double siempre como number)
alter table expensify_transactions
  alter column amount type double precision using amount::double precision;
