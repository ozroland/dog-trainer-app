-- Add Hungarian translation columns to lessons table
ALTER TABLE lessons 
ADD COLUMN title_hu TEXT,
ADD COLUMN description_hu TEXT,
ADD COLUMN content_markdown_hu TEXT;

-- Optional: Add a comment to explain the columns
COMMENT ON COLUMN lessons.title_hu IS 'Hungarian translation of the lesson title';
COMMENT ON COLUMN lessons.description_hu IS 'Hungarian translation of the lesson description';
COMMENT ON COLUMN lessons.content_markdown_hu IS 'Hungarian translation of the lesson content';
