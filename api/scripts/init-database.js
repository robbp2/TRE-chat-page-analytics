// ============================================
// DATABASE INITIALIZATION SCRIPT
// Creates database tables and initial data
// ============================================

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../db/database');

async function initDatabase() {
    try {
        console.log('Initializing database...');
        console.log(`Database type: ${process.env.DB_TYPE || 'sqlite'}`);
        console.log(`Database path: ${process.env.DB_PATH || 'default'}`);
        
        // Read schema file
        const schemaPath = path.join(__dirname, '../db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Execute schema (split by semicolons for SQLite)
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            try {
                await db.query(statement);
            } catch (err) {
                // Ignore "already exists" errors
                if (!err.message.includes('already exists') && !err.message.includes('duplicate')) {
                    console.warn('Schema statement warning:', err.message);
                }
            }
        }
        
        // Insert default order sets from questions.config.js
        const orderSets = [
            {
                id: 'set_1',
                name: 'Standard Flow',
                description: 'Traditional question flow',
                questionOrder: [1, 2, 3, 4, 5, 6, 7, 8]
            },
            {
                id: 'set_2',
                name: 'Debt-First Approach',
                description: 'Focus on debt duration first',
                questionOrder: [2, 1, 3, 5, 6, 4, 7, 8]
            },
            {
                id: 'set_3',
                name: 'Financial-First Approach',
                description: 'Start with IRS notices and financial situation',
                questionOrder: [3, 1, 2, 5, 6, 4, 7, 8]
            },
            {
                id: 'set_4',
                name: 'Asset-First Approach',
                description: 'Prioritize asset and employment questions',
                questionOrder: [6, 4, 7, 2, 1, 5, 3, 8]
            }
        ];
        
        for (const orderSet of orderSets) {
            const questionOrderJson = JSON.stringify(orderSet.questionOrder);
            await db.query(
                `INSERT OR REPLACE INTO order_sets (id, name, description, question_order, active)
                 VALUES (?, ?, ?, ?, ?)`,
                [orderSet.id, orderSet.name, orderSet.description, questionOrderJson, true]
            );
        }
        
        console.log('Database initialized successfully!');
        console.log(`Created ${orderSets.length} order sets`);
        
        await db.close();
        process.exit(0);
    } catch (error) {
        console.error('Database initialization error:', error);
        await db.close();
        process.exit(1);
    }
}

initDatabase();

