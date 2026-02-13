-- Cupo máximo de la tarjeta (para tarjetas de crédito)
ALTER TABLE expensify_cards
ADD COLUMN credit_limit numeric;
