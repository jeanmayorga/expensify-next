-- Add icon column to expensify_categories
ALTER TABLE expensify_categories
ADD COLUMN icon TEXT NULL;

-- Add comment
COMMENT ON COLUMN expensify_categories.icon IS 'Lucide icon name for the category';
