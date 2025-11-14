#!/usr/bin/env node
// Manual PostgreSQL database initialization script
// Run this if automatic initialization fails

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

async function initializeDatabase() {
    try {
        console.log('Starting manual PostgreSQL database initialization...');
        console.log('DB_TYPE:', process.env.DB_TYPE);
        console.log('DATABASE_URL present:', !!process.env.DATABASE_URL);
        
        const schemaPath = path.join(__dirname, '../db/schema-postgresql.sql');
        console.log('Reading schema from:', schemaPath);
        
        if (!fs.existsSync(schemaPath)) {
            throw new Error(`Schema file not found: ${schemaPath}`);
        }
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        console.log('Schema file read successfully');
        
        // Clean and split statements
        let cleanedSchema = schema
            .split('\n')
            .map(line => {
                const commentIndex = line.indexOf('--');
                if (commentIndex >= 0) {
                    return line.substring(0, commentIndex);
                }
                return line;
            })
            .join('\n');
        
        const statements = cleanedSchema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));
        
        console.log(`Found ${statements.length} SQL statements to execute\n`);
        
        // Execute statements
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement || statement.length < 10) {
                continue;
            }
            
            try {
                await db.query(statement);
                console.log(`✓ [${i + 1}/${statements.length}] Executed successfully`);
                console.log(`  ${statement.substring(0, 80).replace(/\s+/g, ' ')}...`);
            } catch (err) {
                if (err.message.includes('already exists') || 
                    err.message.includes('duplicate key') ||
                    (err.message.includes('relation') && err.message.includes('already exists'))) {
                    console.log(`⚠ [${i + 1}/${statements.length}] Already exists (skipped)`);
                } else {
                    console.error(`✗ [${i + 1}/${statements.length}] ERROR:`, err.message);
                    console.error('Statement:', statement);
                    throw err; // Stop on real errors
                }
            }
        }
        
        // Insert default order set
        console.log('\nInserting default order set...');
        try {
            const existing = await db.query('SELECT COUNT(*) as count FROM order_sets');
            if (existing.rows[0]?.count === 0 || !existing.rows[0]?.count) {
                await db.query(
                    `INSERT INTO order_sets (id, name, description, question_order, active)
                     VALUES ('default', 'Default Order Set', 'Default question order', ARRAY[1,2,3,4,5,6,7,8], TRUE)
                     ON CONFLICT (id) DO NOTHING`
                );
                console.log('✓ Default order set inserted');
            } else {
                console.log('⚠ Default order set already exists');
            }
        } catch (err) {
            console.warn('Could not insert default order set:', err.message);
        }
        
        console.log('\n✅ Database initialization completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Database initialization failed:', error);
        process.exit(1);
    }
}

initializeDatabase();

