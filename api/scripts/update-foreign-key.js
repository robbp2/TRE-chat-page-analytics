#!/usr/bin/env node
// Script to update foreign key constraint on DigitalOcean PostgreSQL
// Run: node scripts/update-foreign-key.js

require('dotenv').config();
const db = require('../db/database');

async function updateForeignKey() {
    try {
        console.log('Updating foreign key constraint...');
        
        // Drop existing constraint
        await db.query(`
            ALTER TABLE chat_sessions 
            DROP CONSTRAINT IF EXISTS chat_sessions_order_set_id_fkey
        `);
        console.log('✓ Dropped existing constraint');
        
        // Add new constraint with ON DELETE SET NULL
        await db.query(`
            ALTER TABLE chat_sessions 
            ADD CONSTRAINT chat_sessions_order_set_id_fkey 
            FOREIGN KEY (order_set_id) REFERENCES order_sets(id) ON DELETE SET NULL
        `);
        console.log('✓ Added new constraint with ON DELETE SET NULL');
        
        // Verify
        const result = await db.query(`
            SELECT 
                conname AS constraint_name,
                contype AS constraint_type,
                pg_get_constraintdef(oid) AS constraint_definition
            FROM pg_constraint
            WHERE conrelid = 'chat_sessions'::regclass
            AND conname = 'chat_sessions_order_set_id_fkey'
        `);
        
        if (result.rows.length > 0) {
            console.log('\n✓ Constraint updated successfully:');
            console.log(result.rows[0].constraint_definition);
        } else {
            console.log('\n⚠ Constraint not found (may have been dropped)');
        }
        
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error updating constraint:', error.message);
        console.error(error.stack);
        process.exit(1);
    }
}

updateForeignKey();

