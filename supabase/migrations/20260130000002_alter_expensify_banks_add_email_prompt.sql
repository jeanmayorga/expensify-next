-- Add image, emails array, and extraction_prompt to expensify_banks
ALTER TABLE expensify_banks 
ADD COLUMN IF NOT EXISTS image TEXT,
ADD COLUMN IF NOT EXISTS emails TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS extraction_prompt TEXT;

-- Add comment for clarity
COMMENT ON COLUMN expensify_banks.emails IS 'Array of whitelisted email addresses for this bank';
COMMENT ON COLUMN expensify_banks.extraction_prompt IS 'Custom prompt for OpenAI to extract transactions from this bank emails';
