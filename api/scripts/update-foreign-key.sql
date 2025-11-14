-- Update foreign key constraint to allow NULL on delete
-- Run this on your DigitalOcean PostgreSQL database

ALTER TABLE chat_sessions 
DROP CONSTRAINT IF EXISTS chat_sessions_order_set_id_fkey;

ALTER TABLE chat_sessions 
ADD CONSTRAINT chat_sessions_order_set_id_fkey 
FOREIGN KEY (order_set_id) REFERENCES order_sets(id) ON DELETE SET NULL;

-- Verify the constraint was updated
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_sessions'::regclass
AND conname = 'chat_sessions_order_set_id_fkey';

