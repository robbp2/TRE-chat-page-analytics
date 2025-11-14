# Database Migration Guide

## Update Foreign Key Constraint

To update the foreign key constraint on your DigitalOcean PostgreSQL database, you have several options:

### Option 1: Using DigitalOcean Database Console (Easiest)

1. **Go to DigitalOcean Dashboard**
   - Navigate to your database: Databases → Your Database

2. **Open Database Console**
   - Click on "Console" tab or "Query" tab
   - This opens a web-based SQL editor

3. **Run the SQL Command**
   ```sql
   ALTER TABLE chat_sessions 
   DROP CONSTRAINT IF EXISTS chat_sessions_order_set_id_fkey;

   ALTER TABLE chat_sessions 
   ADD CONSTRAINT chat_sessions_order_set_id_fkey 
   FOREIGN KEY (order_set_id) REFERENCES order_sets(id) ON DELETE SET NULL;
   ```

4. **Click "Execute" or "Run"**

### Option 2: Using psql from Your Local Machine

1. **Get Connection Details**
   - Go to DigitalOcean → Your Database → "Connection Details"
   - Copy the connection string or individual values

2. **Connect via psql**
   ```bash
   # Using connection string
   psql "postgresql://user:password@host:port/database?sslmode=require"
   
   # Or using individual values
   psql -h your-host.db.ondigitalocean.com \
        -p 25060 \
        -U doadmin \
        -d defaultdb \
        --set=sslmode=require
   ```

3. **Run the SQL**
   ```sql
   ALTER TABLE chat_sessions 
   DROP CONSTRAINT IF EXISTS chat_sessions_order_set_id_fkey;

   ALTER TABLE chat_sessions 
   ADD CONSTRAINT chat_sessions_order_set_id_fkey 
   FOREIGN KEY (order_set_id) REFERENCES order_sets(id) ON DELETE SET NULL;
   ```

4. **Exit psql**
   ```sql
   \q
   ```

### Option 3: Using Node.js Script (Recommended)

1. **Set Environment Variables**
   - Make sure your `.env` file has:
     ```
     DB_TYPE=postgresql
     DATABASE_URL=your-connection-string
     ```

2. **Run the Script**
   ```bash
   cd api
   npm run update-fk
   ```

   Or directly:
   ```bash
   node api/scripts/update-foreign-key.js
   ```

### Option 4: Using DigitalOcean App Platform Console

1. **Go to Your App**
   - DigitalOcean → Apps → Your App

2. **Open Console**
   - Go to "Runtime" tab
   - Click "Open Console" or use the terminal

3. **Run the Script**
   ```bash
   cd /workspace/api
   node scripts/update-foreign-key.js
   ```

### Verify the Change

After running the migration, verify it worked:

```sql
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'chat_sessions'::regclass
AND conname = 'chat_sessions_order_set_id_fkey';
```

You should see `ON DELETE SET NULL` in the constraint definition.

## Notes

- **No Data Loss**: This migration doesn't delete any data
- **Safe to Run**: The `DROP CONSTRAINT IF EXISTS` ensures it won't fail if the constraint doesn't exist
- **Backward Compatible**: Existing data remains intact

## Troubleshooting

### "Permission Denied"
- Make sure you're using the correct database user credentials
- Check that your user has ALTER TABLE permissions

### "Constraint Does Not Exist"
- This is fine - the `IF EXISTS` clause handles this
- The new constraint will still be created

### "Relation Does Not Exist"
- Make sure the tables have been created
- Run `npm run init-postgresql` first if needed

