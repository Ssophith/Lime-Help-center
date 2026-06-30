-- Add Full-Text Search (FTS) support for articles
-- This script adds tsvector columns and GIN indexes for fast full-text search

-- Add tsvector column for searchable text
ALTER TABLE articles 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create function to update search_vector
CREATE OR REPLACE FUNCTION articles_search_vector_update() RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('simple', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(NEW.excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', regexp_replace(COALESCE(NEW.content, ''), '<[^>]+>', '', 'g')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update search_vector
DROP TRIGGER IF EXISTS articles_search_vector_update_trigger ON articles;
CREATE TRIGGER articles_search_vector_update_trigger
  BEFORE INSERT OR UPDATE ON articles
  FOR EACH ROW
  EXECUTE FUNCTION articles_search_vector_update();

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS idx_articles_search_vector ON articles USING GIN(search_vector);

-- Update existing rows
UPDATE articles SET 
  search_vector = 
    setweight(to_tsvector('simple', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('simple', COALESCE(excerpt, '')), 'B') ||
    setweight(to_tsvector('simple', regexp_replace(COALESCE(content, ''), '<[^>]+>', '', 'g')), 'C');
