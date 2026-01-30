-- Add blacklisted_subjects array to expensify_banks
ALTER TABLE expensify_banks 
ADD COLUMN IF NOT EXISTS blacklisted_subjects TEXT[] DEFAULT '{}';

COMMENT ON COLUMN expensify_banks.blacklisted_subjects IS 'Array of email subjects to skip (not process with OpenAI)';

-- Update Banco de Guayaquil with blacklisted subjects
UPDATE expensify_banks 
SET blacklisted_subjects = ARRAY[
  'CODIGO DE SEGURIDAD PARA MATRICULACIÓN DE CUENTA MOBILE',
  'ACCESO CON EXITO'
]
WHERE slug = 'guayaquil';
