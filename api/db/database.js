// ============================================
// DATABASE CONNECTION MODULE
// Supports both SQLite and PostgreSQL
// ============================================

const dbType = process.env.DB_TYPE || 'sqlite';

let db;

if (dbType === 'postgresql') {
    // PostgreSQL connection
    const { Pool } = require('pg');
    
    // DigitalOcean managed databases require SSL with self-signed certificates
    // We need to accept self-signed certificates for DigitalOcean
    const sslConfig = {
        rejectUnauthorized: false  // Accept self-signed certificates (required for DigitalOcean)
    };
    
    // DigitalOcean provides DATABASE_URL, but we can also use individual variables
    if (process.env.DATABASE_URL) {
        // Use DATABASE_URL if provided (DigitalOcean standard)
        // Check if it's a DigitalOcean database (requires SSL)
        const isDigitalOcean = process.env.DATABASE_URL.includes('ondigitalocean.com') || 
                              process.env.DATABASE_URL.includes('db.ondigitalocean.com');
        
        db = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: isDigitalOcean ? sslConfig : false
        });
    } else {
        // Fall back to individual connection parameters
        const isDigitalOcean = process.env.DB_HOST && 
                              (process.env.DB_HOST.includes('ondigitalocean.com') || 
                               process.env.DB_HOST.includes('db.ondigitalocean.com'));
        
        db = new Pool({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 5432,
            database: process.env.DB_NAME || 'tre_chatbot',
            user: process.env.DB_USER,
            password: process.env.DB_PASSWORD,
            ssl: isDigitalOcean ? sslConfig : false
        });
    }
    
    db.on('error', (err) => {
        console.error('PostgreSQL connection error:', err);
    });
    
    console.log('PostgreSQL connection configured with SSL:', process.env.DATABASE_URL ? 'using DATABASE_URL' : 'using individual params');
} else {
    // SQLite connection (default)
    const sqlite3 = require('sqlite3').verbose();
    const path = require('path');
    const fs = require('fs');
    
    // Use DB_PATH from env, or default location
    // For DigitalOcean App Platform, use /tmp/ for persistence during app lifetime
    const dbPath = process.env.DB_PATH || path.join(__dirname, '../data/analytics.db');
    
    // Ensure data directory exists (skip for /tmp/)
    if (!dbPath.startsWith('/tmp')) {
        const dataDir = path.dirname(dbPath);
        if (!fs.existsSync(dataDir)) {
            fs.mkdirSync(dataDir, { recursive: true });
        }
    }
    
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('SQLite connection error:', err);
        } else {
            console.log('Connected to SQLite database:', dbPath);
        }
    });
}

// Database query wrapper for both SQLite and PostgreSQL
class Database {
    constructor(dbConnection) {
        this.db = dbConnection;
        this.type = dbType;
    }
    
    async query(sql, params = []) {
        if (this.type === 'postgresql') {
            try {
                // Convert SQLite-style ? placeholders to PostgreSQL $1, $2, etc.
                let pgSql = sql;
                if (params.length > 0 && sql.includes('?')) {
                    let paramIndex = 1;
                    pgSql = sql.replace(/\?/g, () => `$${paramIndex++}`);
                }
                
                const result = await this.db.query(pgSql, params);
                return { rows: result.rows, rowCount: result.rowCount };
            } catch (error) {
                console.error('PostgreSQL query error:', error);
                console.error('SQL:', sql);
                console.error('Params:', params);
                throw error;
            }
        } else {
            // SQLite
            return new Promise((resolve, reject) => {
                if (sql.trim().toUpperCase().startsWith('SELECT')) {
                    this.db.all(sql, params, (err, rows) => {
                        if (err) reject(err);
                        else resolve({ rows: rows || [], rowCount: rows ? rows.length : 0 });
                    });
                } else {
                    this.db.run(sql, params, function(err) {
                        if (err) reject(err);
                        else resolve({ 
                            rows: [], 
                            rowCount: this.changes,
                            lastID: this.lastID 
                        });
                    });
                }
            });
        }
    }
    
    async close() {
        if (this.type === 'postgresql') {
            await this.db.end();
        } else {
            return new Promise((resolve, reject) => {
                this.db.close((err) => {
                    if (err) reject(err);
                    else resolve();
                });
            });
        }
    }
}

const database = new Database(db);

module.exports = database;

