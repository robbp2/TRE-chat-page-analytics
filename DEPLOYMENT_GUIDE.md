# TRE Chatbot - Complete Deployment Guide

This guide provides comprehensive instructions for deploying the TRE Chatbot application, including configuration of question order sets, API integration for data storage, and the analytics dashboard with PostgreSQL database setup.

---

## Table of Contents

1. [Overview](#overview)
2. [Question Order Sets Configuration](#question-order-sets-configuration)
3. [API Configuration for Data Storage](#api-configuration-for-data-storage)
4. [Analytics Component Deployment](#analytics-component-deployment)
5. [PostgreSQL Database Setup](#postgresql-database-setup)
6. [Testing and Verification](#testing-and-verification)
7. [Troubleshooting](#troubleshooting)

---

## Overview

The TRE Chatbot consists of three main components:

1. **Frontend Chat Interface** (`index.html`, `index2.html`) - User-facing chat interface
2. **Analytics API Backend** (`api/` directory) - Collects and stores chat data
3. **Analytics Dashboard** (`analytics.html`) - Visualizes collected data and drop-off points

This guide focuses on:
- Configuring question order sets
- Setting up API endpoints for data storage
- Deploying the analytics backend
- Setting up PostgreSQL database
- Deploying the analytics dashboard

---

## Question Order Sets Configuration

### Location

Question order sets are configured in `questions.config.js` in the root directory.

### Understanding the Structure

The file contains two main objects:

1. **`QUESTIONS`** - Defines individual questions with their properties
2. **`ORDER_SETS`** - Defines different question flow sequences

### Modifying Questions

Each question in the `QUESTIONS` object has the following structure:

```javascript
{
    id: 1,                                    // Unique question ID
    text: "Question text here",              // The question displayed to users
    type: "amount",                           // Type: "amount", "text", "yesno", "multiple_choice"
    required: true,                           // Whether the question is required
    validation: {                             // Validation rules (optional)
        type: "number",
        min: 0
    },
    quickResponses: [                         // Quick response buttons (optional)
        "$7,500 or less",
        "$7,500 to $9,999"
    ],
    options: [                                // For multiple_choice type
        "Option 1",
        "Option 2"
    ]
}
```

**Example: Adding a New Question**

```javascript
9: {
    id: 9,
    text: "Have you received any IRS notices?",
    type: "yesno",
    required: true
}
```

### Modifying Order Sets

Order sets define the sequence in which questions are asked. Each order set has:

```javascript
{
    id: "set_1",                              // Unique identifier
    name: "Standard Flow",                    // Display name
    order: [1, 2, 3, 4, 5, 6, 7, 8],        // Array of question IDs in order
    description: "Traditional question flow"  // Description
}
```

**Example: Creating a New Order Set**

```javascript
{
    id: "set_5",
    name: "Contact-First Approach",
    order: [6, 7, 8, 1, 2, 3, 4, 5],        // Contact info first, then questions
    description: "Collect contact info before asking questions"
}
```

### How Order Sets Are Selected

The chatbot randomly selects an order set from the `ORDER_SETS` array when a user starts the question flow. To control which sets are used:

1. **Remove unwanted sets** - Delete the order set object from the array
2. **Add new sets** - Add new order set objects following the structure above
3. **Modify existing sets** - Change the `order` array to reorder questions

**Note:** The order set selection happens automatically in `chat.js` when the question flow initializes.

---

## API Configuration for Data Storage

### Overview

The chatbot can send visitor information and chat responses to a backend API for storage. This is configured in `chat.js` and controlled via global variables.

### Configuration Location

In your HTML files (`index.html` or `index2.html`), add configuration before loading `chat.js`:

```html
<script>
    // API Configuration
    window.API_ENDPOINT = 'https://your-api-domain.com/api/chat/submit';
    window.API_ENABLED = true;  // Set to false to disable API calls
    
    // Optional: Configure when data is sent
    // The API will send data:
    // - On page unload (if sendOnUnload: true)
    // - After each message (if sendAfterEachMessage: true)
    // - After batchSize messages (if batch mode)
</script>
<script src="chat.js"></script>
```

### API Configuration Options

The API configuration in `chat.js` (lines 27-34) supports:

```javascript
{
    endpoint: window.API_ENDPOINT || 'https://api.example.com/chat/submit',
    enabled: window.API_ENABLED !== false,     // Default: true
    sendOnUnload: true,                        // Send when user leaves page
    sendAfterEachMessage: false,               // Send after each message
    batchSize: 5                               // Send after N messages
}
```

### Data Format Sent to API

When data is sent, it includes:

```json
{
    "sessionId": "unique-session-id",
    "startTime": "2025-01-13T12:00:00.000Z",
    "messages": [
        {
            "type": "agent" | "user",
            "content": "Message text",
            "timestamp": "2025-01-13T12:00:00.000Z"
        }
    ],
    "userInfo": {
        "userAgent": "Browser info",
        "language": "en-US",
        "platform": "Win32",
        "referrer": "https://example.com"
    },
    "questionAnswers": {
        "1": "Answer to question 1",
        "2": "Answer to question 2"
    },
    "orderSetId": "set_1",
    "completionPercentage": 100,
    "totalTime": 120000
}
```

### Creating Your API Endpoint

Your API endpoint should:

1. **Accept POST requests** with JSON body
2. **Handle CORS** if serving from a different domain
3. **Store the data** in your database
4. **Return a success response** (200 status)

**Example Express.js Endpoint:**

```javascript
app.post('/api/chat/submit', express.json(), async (req, res) => {
    try {
        const chatData = req.body;
        
        // Store in database
        await db.chatSessions.create({
            sessionId: chatData.sessionId,
            data: JSON.stringify(chatData),
            createdAt: new Date()
        });
        
        res.json({ success: true, sessionId: chatData.sessionId });
    } catch (error) {
        console.error('Error storing chat data:', error);
        res.status(500).json({ error: 'Failed to store data' });
    }
});
```

### Testing API Configuration

1. **Enable browser console** (F12)
2. **Load the chat page**
3. **Complete the chat flow**
4. **Check console** for API call logs:
   - `Conversation data sent successfully` = Success
   - `Failed to send conversation data` = Error (check endpoint URL)

---

## Analytics Component Deployment

### Overview

The analytics component consists of:
- **Backend API** (`api/` directory) - Express.js server
- **Frontend Dashboard** (`analytics.html`) - Visualization interface
- **Database** - PostgreSQL (recommended) or SQLite (development)

### Step 1: Prepare the API Directory

Ensure you have the following structure:

```
api/
├── server.js                 # Main Express server
├── package.json              # Dependencies
├── .env                      # Environment configuration (create from env.example.txt)
├── routes/
│   ├── analytics.js         # Analytics event routes
│   └── dashboard.js         # Dashboard data routes
├── services/
│   ├── analytics.js         # Analytics processing logic
│   └── dashboard.js         # Dashboard data aggregation
├── db/
│   ├── database.js          # Database connection
│   ├── schema.sql           # SQLite schema
│   └── schema-postgresql.sql # PostgreSQL schema
└── scripts/
    └── init-database.js     # Database initialization
```

### Step 2: Install Dependencies

```bash
cd api
npm install
```

This installs:
- `express` - Web server
- `cors` - CORS middleware
- `dotenv` - Environment variables
- `pg` - PostgreSQL client
- `sqlite3` - SQLite client (for development)

### Step 3: Configure Environment Variables

Copy the example environment file:

```bash
cp env.example.txt .env
```

Edit `.env` with your settings:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_TYPE=postgresql

# PostgreSQL Configuration
DB_HOST=your-postgres-host.com
DB_PORT=5432
DB_NAME=tre_chatbot
DB_USER=your_username
DB_PASSWORD=your_password

# CORS Configuration (comma-separated list of allowed origins)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Analytics Configuration
ANALYTICS_RETENTION_DAYS=90
```

### Step 4: Initialize PostgreSQL Database

See [PostgreSQL Database Setup](#postgresql-database-setup) section below.

### Step 5: Start the API Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

The server will run on the port specified in `.env` (default: 3000).

### Step 6: Configure Frontend Analytics Endpoint

In your chat HTML files, configure the analytics endpoint:

```html
<script>
    // Analytics endpoint for tracking events
    window.ANALYTICS_ENDPOINT = 'https://your-api-domain.com/api/analytics/event';
</script>
<script src="chat.js"></script>
```

### Step 7: Deploy Analytics Dashboard

1. **Update dashboard API URL** in `analytics.html`:

```html
<script>
    window.DASHBOARD_API_URL = 'https://your-api-domain.com';
</script>
```

2. **Host `analytics.html`** on your web server (same domain or configure CORS)

3. **Access the dashboard** at `https://yourdomain.com/analytics.html`

### Step 8: Verify Deployment

1. **Health Check:**
   ```bash
   curl https://your-api-domain.com/health
   ```
   Should return: `{"status":"ok",...}`

2. **Test Analytics Endpoint:**
   ```bash
   curl -X POST https://your-api-domain.com/api/analytics/event \
     -H "Content-Type: application/json" \
     -d '{
       "eventType": "order_set_selected",
       "sessionId": "test_123",
       "timestamp": "2025-01-13T12:00:00.000Z",
       "data": {"orderSetId": "set_1"}
     }'
   ```

3. **Test Dashboard Endpoint:**
   ```bash
   curl https://your-api-domain.com/api/dashboard/stats?days=30
   ```

---

## PostgreSQL Database Setup

### Prerequisites

- PostgreSQL 12+ installed and running
- Database user with CREATE privileges
- Access to the database server

### Step 1: Create Database

Connect to PostgreSQL:

```bash
psql -U postgres
```

Create the database:

```sql
CREATE DATABASE tre_chatbot;
```

Create a dedicated user (recommended):

```sql
CREATE USER tre_chatbot_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE tre_chatbot TO tre_chatbot_user;
```

Exit PostgreSQL:
```sql
\q
```

### Step 2: Run Schema Script

Run the PostgreSQL schema script:

```bash
psql -U tre_chatbot_user -d tre_chatbot -f api/db/schema-postgresql.sql
```

Or manually:

```bash
psql -U tre_chatbot_user -d tre_chatbot < api/db/schema-postgresql.sql
```

### Step 3: Verify Tables Created

Connect to the database:

```bash
psql -U tre_chatbot_user -d tre_chatbot
```

List tables:

```sql
\dt
```

You should see:
- `order_sets`
- `questions`
- `chat_sessions`
- `question_events`
- `dropoff_points`

### Step 4: Initialize Order Sets

The API server will automatically create default order sets on first run, or you can use the initialization script:

```bash
cd api
npm run init-postgresql
```

This creates default order sets (`set_1` through `set_4`) matching your `questions.config.js`.

### Step 5: Update Environment Variables

Ensure your `.env` file has correct PostgreSQL credentials:

```env
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tre_chatbot
DB_USER=tre_chatbot_user
DB_PASSWORD=your_secure_password
```

### Step 6: Test Database Connection

Start the API server:

```bash
cd api
npm start
```

Check logs for:
- `Database connected successfully`
- `Database initialized successfully`

If you see errors, verify:
- PostgreSQL is running
- Database exists
- User has correct permissions
- Connection credentials are correct

### Database Schema Overview

**`order_sets`** - Stores order set configurations
- `id` (VARCHAR) - Order set ID (e.g., "set_1")
- `name` (VARCHAR) - Display name
- `question_order` (INTEGER[]) - Array of question IDs
- `active` (BOOLEAN) - Whether set is active

**`chat_sessions`** - Stores chat session metadata
- `id` (VARCHAR) - Session ID
- `order_set_id` (VARCHAR) - Which order set was used
- `user_info` (JSONB) - User browser/device info
- `completion_percentage` (DECIMAL) - How much of flow was completed
- `total_time_ms` (INTEGER) - Total time in milliseconds

**`question_events`** - Individual question interactions
- `session_id` (VARCHAR) - Links to chat_sessions
- `question_id` (INTEGER) - Question ID
- `event_type` (VARCHAR) - "started", "answered", "skipped"
- `answer` (TEXT) - User's answer
- `time_to_answer_ms` (INTEGER) - Time taken to answer

**`dropoff_points`** - Tracks where users abandon the flow
- `session_id` (VARCHAR) - Links to chat_sessions
- `question_id` (INTEGER) - Last question before drop-off
- `completion_at_dropoff` (DECIMAL) - Completion % at drop-off point

### Backup and Maintenance

**Create Backup:**
```bash
pg_dump -U tre_chatbot_user tre_chatbot > backup_$(date +%Y%m%d).sql
```

**Restore Backup:**
```bash
psql -U tre_chatbot_user tre_chatbot < backup_20250113.sql
```

**Clean Old Data (older than 90 days):**
```sql
DELETE FROM question_events 
WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM dropoff_points 
WHERE timestamp < NOW() - INTERVAL '90 days';

DELETE FROM chat_sessions 
WHERE created_at < NOW() - INTERVAL '90 days';
```

---

## Testing and Verification

### 1. Test Question Flow

1. Load `index.html` in a browser
2. Complete the chat flow
3. Check browser console for:
   - `Order set selected: set_X`
   - `Question flow started`
   - `Analytics event sent`

### 2. Test API Data Storage

1. Complete a chat session
2. Check API logs for:
   - `POST /api/analytics/event`
   - `POST /api/chat/submit` (if configured)

3. Query database to verify:

```sql
-- Check recent sessions
SELECT * FROM chat_sessions ORDER BY created_at DESC LIMIT 5;

-- Check question events
SELECT * FROM question_events ORDER BY timestamp DESC LIMIT 10;

-- Check drop-off points
SELECT * FROM dropoff_points ORDER BY timestamp DESC LIMIT 10;
```

### 3. Test Analytics Dashboard

1. Open `analytics.html` in a browser
2. Verify:
   - Dashboard loads without errors
   - Charts display data
   - Metrics show correct values
   - Drop-off analysis is visible

### 4. Test Different Order Sets

1. Complete multiple chat sessions
2. Verify different order sets are being used (check database)
3. Verify analytics tracks each order set separately

---

## Troubleshooting

### API Not Receiving Data

**Symptoms:** No data in database, console shows API errors

**Solutions:**
1. Check `window.API_ENDPOINT` is set correctly
2. Verify API server is running and accessible
3. Check CORS configuration in API server
4. Verify network requests in browser DevTools
5. Check API server logs for errors

### Database Connection Errors

**Symptoms:** API server fails to start, database errors in logs

**Solutions:**
1. Verify PostgreSQL is running: `pg_isready`
2. Check database credentials in `.env`
3. Verify database exists: `psql -l | grep tre_chatbot`
4. Check user permissions
5. Verify network connectivity to database server

### Analytics Dashboard Not Loading Data

**Symptoms:** Dashboard shows "Loading..." or empty charts

**Solutions:**
1. Check `window.DASHBOARD_API_URL` is set correctly
2. Verify API endpoints are accessible (test with curl)
3. Check browser console for CORS errors
4. Verify database has data (run test queries)
5. Check API server logs for errors

### Order Sets Not Working

**Symptoms:** Questions appear in wrong order or not at all

**Solutions:**
1. Verify `questions.config.js` is loaded before `chat.js`
2. Check browser console for JavaScript errors
3. Verify `window.QUESTIONS` and `window.ORDER_SETS` are defined
4. Check that question IDs in order sets match question IDs in QUESTIONS object

### CORS Errors

**Symptoms:** Browser console shows CORS policy errors

**Solutions:**
1. Update `CORS_ORIGIN` in API `.env` file
2. Include your frontend domain(s) in the comma-separated list
3. Restart API server after changing `.env`
4. For development, you can temporarily set `CORS_ORIGIN=*` (not recommended for production)

### Performance Issues

**Symptoms:** Slow dashboard loading, database queries timing out

**Solutions:**
1. Add database indexes (already included in schema)
2. Limit time range queries (use `days` parameter)
3. Consider database connection pooling
4. Monitor database query performance
5. Clean old data regularly (see Backup and Maintenance)

---

## Production Deployment Checklist

- [ ] PostgreSQL database created and configured
- [ ] Database schema applied
- [ ] Environment variables configured (`.env`)
- [ ] API server deployed and running
- [ ] API endpoints accessible (test health check)
- [ ] CORS configured for production domains
- [ ] Frontend analytics endpoint configured
- [ ] Analytics dashboard deployed
- [ ] Dashboard API URL configured
- [ ] Question order sets configured
- [ ] API data storage endpoint configured (if using separate endpoint)
- [ ] SSL/HTTPS enabled for API and dashboard
- [ ] Database backups configured
- [ ] Monitoring/logging set up
- [ ] Test complete chat flow end-to-end
- [ ] Verify analytics data is being collected
- [ ] Verify dashboard displays data correctly

---

## Support and Additional Resources

- **API Documentation:** See `api/README.md`
- **Database Schema:** See `api/db/schema-postgresql.sql`
- **Question Configuration:** See `questions.config.js`
- **Chat Implementation:** See `chat.js`

For issues or questions, check:
- Browser console for JavaScript errors
- API server logs for backend errors
- Database logs for connection issues
- Network tab in browser DevTools for API request/response details

---

**Last Updated:** January 2025
**Version:** 1.0.0

