-- Update Banco Pichincha
UPDATE expensify_banks 
SET 
  image = '/banco-pichincha.jpeg',
  emails = ARRAY['xperta@pichincha.com', 'banco@pichincha.com', 'servicios@tarjetasbancopichincha.com'],
  extraction_prompt = 'You are extracting a transaction from a Banco Pichincha email.
- The bank name is always "Banco Pichincha"
- Look for patterns like "Valor: $XX.XX" or "Monto: $XX.XX" for the amount
- Look for "Comercio:" or "Establecimiento:" for the description
- The date format is usually DD/MM/YYYY HH:MM'
WHERE slug = 'pichincha';

-- Update Produbanco
UPDATE expensify_banks 
SET 
  image = '/produbanco.jpeg',
  emails = ARRAY['bancaenlinea@produbanco.com'],
  extraction_prompt = 'You are extracting a transaction from a Produbanco email.
- The bank name is always "Produbanco"
- The description MUST come from the pattern "Establecimiento: <description>"
- Look for "Valor: $XX.XX" for the amount'
WHERE slug = 'produbanco';

-- Update Banco de Guayaquil
UPDATE expensify_banks 
SET 
  image = '/banco-de-guayaquil.png',
  emails = ARRAY['bancavirtual@bancoguayaquil.com'],
  extraction_prompt = 'You are extracting a transaction from a Banco de Guayaquil email.
- The bank name is always "Banco de Guayaquil"
- Look for the transaction amount
- The description is usually the merchant or transaction type'
WHERE slug = 'guayaquil';

-- Update Banco del Pacifico
UPDATE expensify_banks 
SET 
  image = '/banco-del-pacifico.jpeg',
  emails = ARRAY['notificaciones@infopacificard.com.ec'],
  extraction_prompt = 'You are extracting a transaction from a Banco del Pacifico / PacifiCard email.
- The bank name is always "Banco del Pacifico"
- Look for the transaction amount in USD
- The description is usually the merchant name'
WHERE slug = 'pacifico';
