-- Add icon_color column to existing categories table
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_color VARCHAR(7) DEFAULT '#FEF3C7';

-- Update existing categories to have default color if they don't have one
UPDATE categories SET icon_color = '#FEF3C7' WHERE icon_color IS NULL;
