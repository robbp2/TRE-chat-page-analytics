// ============================================
// TRE CHATBOT ANALYTICS API SERVER
// Express server for analytics data collection
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');
const db = require('./db/database');

const app = express();
// DigitalOcean App Platform uses PORT 8080, but allow override
const PORT = process.env.PORT || 3000;

// Middleware
const corsOptions = {
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps, curl requests, or file:// protocol)
        if (!origin) return callback(null, true);
        
        // Allow file:// protocol for local development
        if (origin === 'null' || origin.startsWith('file://')) {
            return callback(null, true);
        }
        
        const allowedOrigins = process.env.CORS_ORIGIN === '*' 
            ? '*' 
            : (process.env.CORS_ORIGIN || '*').split(',').map(o => o.trim());
        
        if (allowedOrigins === '*' || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(null, true); // Allow all for now, can restrict later
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
});

// Routes
app.use('/api/analytics', analyticsRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);

// Health check (required for DigitalOcean App Platform)
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        dbType: process.env.DB_TYPE || 'sqlite'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        service: 'TRE Chatbot Analytics API',
        version: '1.0.0',
        endpoints: {
            analytics: '/api/analytics/event',
            dashboard: '/api/dashboard/stats',
            chat: '/api/chat/submit',
            health: '/health'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
});

// Initialize database on startup (creates tables if they don't exist)
async function initializeDatabase() {
    try {
        const fs = require('fs');
        const path = require('path');
        
        // Use PostgreSQL schema for PostgreSQL, SQLite schema for SQLite
        const dbType = process.env.DB_TYPE || 'sqlite';
        const schemaFile = dbType === 'postgresql' ? 'schema-postgresql.sql' : 'schema.sql';
        const schemaPath = path.join(__dirname, './db', schemaFile);
        
        console.log(`Initializing database with schema: ${schemaFile}`);
        
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        // Split by semicolon and filter out comments and empty statements
        // Handle multi-line statements and comments properly
        let cleanedSchema = schema
            .split('\n')
            .map(line => {
                // Remove inline comments
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
        
        console.log(`Found ${statements.length} SQL statements to execute`);
        
        // Execute statements in order
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            if (!statement || statement.length < 10) {
                continue; // Skip very short statements (likely empty)
            }
            
            try {
                await db.query(statement);
                console.log(`✓ Executed statement ${i + 1}/${statements.length}: ${statement.substring(0, 50).replace(/\s+/g, ' ')}...`);
            } catch (err) {
                // Ignore "already exists" errors
                if (err.message.includes('already exists') || 
                    err.message.includes('duplicate key') ||
                    err.message.includes('relation') && err.message.includes('already exists')) {
                    console.log(`⚠ Statement ${i + 1} skipped (already exists): ${statement.substring(0, 50).replace(/\s+/g, ' ')}...`);
                } else {
                    console.error(`✗ Error executing statement ${i + 1}:`, err.message);
                    console.error('Full statement:', statement);
                    // Don't throw - continue with other statements
                }
            }
        }
        
        // Insert default order sets if they don't exist
        try {
            const existingOrderSets = await db.query('SELECT COUNT(*) as count FROM order_sets');
            if (existingOrderSets.rows[0]?.count === 0 || !existingOrderSets.rows[0]?.count) {
                await db.query(
                    `INSERT INTO order_sets (id, name, description, question_order, active)
                     VALUES ('default', 'Default Order Set', 'Default question order', ARRAY[1,2,3,4,5,6,7,8], TRUE)
                     ON CONFLICT (id) DO NOTHING`
                );
                console.log('Default order set inserted');
            }
        } catch (err) {
            console.warn('Could not insert default order set:', err.message);
        }
        
        // Add new columns to existing chat_sessions table if they don't exist
        try {
            if (dbType === 'postgresql') {
                // PostgreSQL: Use IF NOT EXISTS (PostgreSQL 9.6+)
                await db.query(`
                    DO $$ 
                    BEGIN
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='chat_sessions' AND column_name='messages') THEN
                            ALTER TABLE chat_sessions ADD COLUMN messages JSONB;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='chat_sessions' AND column_name='metadata') THEN
                            ALTER TABLE chat_sessions ADD COLUMN metadata JSONB;
                        END IF;
                        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                                      WHERE table_name='chat_sessions' AND column_name='question_answers') THEN
                            ALTER TABLE chat_sessions ADD COLUMN question_answers JSONB;
                        END IF;
                    END $$;
                `);
                console.log('✓ Verified chat_sessions columns (PostgreSQL)');
            } else {
                // SQLite: Try to add columns, ignore if they exist
                try {
                    await db.query('ALTER TABLE chat_sessions ADD COLUMN messages TEXT');
                    console.log('✓ Added messages column');
                } catch (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.warn('Could not add messages column:', err.message);
                    }
                }
                try {
                    await db.query('ALTER TABLE chat_sessions ADD COLUMN metadata TEXT');
                    console.log('✓ Added metadata column');
                } catch (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.warn('Could not add metadata column:', err.message);
                    }
                }
                try {
                    await db.query('ALTER TABLE chat_sessions ADD COLUMN question_answers TEXT');
                    console.log('✓ Added question_answers column');
                } catch (err) {
                    if (!err.message.includes('duplicate column')) {
                        console.warn('Could not add question_answers column:', err.message);
                    }
                }
            }
        } catch (err) {
            console.warn('Could not add new columns to chat_sessions (they may already exist):', err.message);
        }
        
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
        throw error;
    }
}

// Start server
app.listen(PORT, async () => {
    console.log(`Analytics API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Database: ${process.env.DB_TYPE || 'sqlite'}`);
    console.log(`CORS Origin: ${process.env.CORS_ORIGIN || '*'}`);
    
    // Initialize database on startup
    await initializeDatabase();
});

module.exports = app;
