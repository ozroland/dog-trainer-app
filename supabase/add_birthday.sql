-- Add new columns to the dogs table
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS birthday DATE;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE dogs ADD COLUMN IF NOT EXISTS favorite_treat TEXT;
