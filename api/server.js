// ============================================
// TRE CHATBOT ANALYTICS API SERVER
// Express server for analytics data collection
// ============================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const analyticsRoutes = require('./routes/analytics');
const dashboardRoutes = require('./routes/dashboard');
const db = require('./db/database');

const app = express();
// DigitalOcean App Platform uses PORT 8080, but allow override
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({
    origin: process.env.CORS_ORIGIN === '*' ? '*' : (process.env.CORS_ORIGIN || '*').split(','),
    credentials: true
}));
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
        const schemaPath = path.join(__dirname, './db/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf8');
        
        const statements = schema
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'));
        
        for (const statement of statements) {
            try {
                await db.query(statement);
            } catch (err) {
                // Ignore "already exists" errors and SSL certificate warnings
                if (!err.message.includes('already exists') && 
                    !err.message.includes('duplicate') &&
                    !err.message.includes('self-signed certificate')) {
                    console.warn('Schema initialization warning:', err.message);
                }
            }
        }
        console.log('Database initialized successfully');
    } catch (error) {
        console.error('Database initialization error:', error);
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
