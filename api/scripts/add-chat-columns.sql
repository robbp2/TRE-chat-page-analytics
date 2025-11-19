-- ============================================
-- MIGRATION: Add messages, metadata, question_answers columns
-- Run this if your database already exists
-- ============================================

-- For PostgreSQL
ALTER TABLE chat_sessions 
ADD COLUMN IF NOT EXISTS messages JSONB,
ADD COLUMN IF NOT EXISTS metadata JSONB,
ADD COLUMN IF NOT EXISTS question_answers JSONB;

-- For SQLite (run these separately if needed)
-- Note: SQLite doesn't support IF NOT EXISTS in ALTER TABLE ADD COLUMN
-- You may need to check if columns exist first or handle errors

-- ALTER TABLE chat_sessions ADD COLUMN messages TEXT;
-- ALTER TABLE chat_sessions ADD COLUMN metadata TEXT;
-- ALTER TABLE chat_sessions ADD COLUMN question_answers TEXT;

