# Phase 3: Analytics API & Backend - Setup Guide

## ✅ Completed Implementation

Phase 3 has been successfully implemented with the following components:

### Backend API Structure
- **Express.js Server** (`api/server.js`)
- **Database Layer** (`api/db/database.js`) - Supports both SQLite and PostgreSQL
- **Analytics Routes** (`api/routes/analytics.js`)
- **Dashboard Routes** (`api/routes/dashboard.js`)
- **Analytics Service** (`api/services/analytics.js`)
- **Dashboard Service** (`api/services/dashboard.js`)

### Database Schema
- **SQLite Schema** (`api/db/schema.sql`)
- **PostgreSQL Schema** (`api/db/schema-postgresql.sql`)
- **Database Initialization Script** (`api/scripts/init-database.js`)

### Frontend Integration
- Updated `chat.js` to send analytics events automatically
- Analytics events are sent to `/api/analytics/event` endpoint
- Local storage fallback for offline scenarios

## Quick Start

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Copy `env.example.txt` to `.env`:

```bash
cp env.example.txt .env
```

Edit `.env` with your settings (defaults work for development).

### 3. Initialize Database

```bash
npm run init-db
```

This creates:
- All database tables
- Indexes for performance
- Default order sets (set_1 through set_4)

### 4. Start the Server

**Development:**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

Server will run on `http://localhost:3000` by default.

### 5. Configure Frontend

In your `index.html`, add:

```html
<script>
    // Optional: Set custom analytics endpoint
    window.ANALYTICS_ENDPOINT = 'http://localhost:3000/api/analytics/event';
</script>
<script src="chat.js"></script>
```

If `ANALYTICS_ENDPOINT` is not set, the chat will default to `http://localhost:3000/api/analytics/event`.

## API Endpoints

### Analytics Events

**POST** `/api/analytics/event`
- Tracks individual analytics events
- Event types: `order_set_selected`, `question_started`, `question_answered`, `question_flow_completed`, `question_flow_data`

**POST** `/api/analytics/batch`
- Tracks multiple events at once

### Dashboard Data

**GET** `/api/dashboard/stats?days=30`
- Overall statistics

**GET** `/api/dashboard/order-sets?days=30`
- Order set performance

**GET** `/api/dashboard/dropoffs?days=30`
- Drop-off analysis

**GET** `/api/dashboard/questions?days=30`
- Question performance

**GET** `/api/dashboard/completion-rates?days=30`
- Completion rate breakdown

## Database

### SQLite (Default)
- Database file: `api/data/analytics.db`
- No additional setup required
- Perfect for development and small deployments

### PostgreSQL (Production)
1. Set `DB_TYPE=postgresql` in `.env`
2. Configure PostgreSQL connection settings
3. Run the PostgreSQL schema: `psql -d tre_chatbot -f db/schema-postgresql.sql`
4. Restart the server

## Testing

### Test Analytics Endpoint

```bash
curl -X POST http://localhost:3000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_set_selected",
    "sessionId": "test_session_123",
    "timestamp": "2025-01-13T12:00:00.000Z",
    "data": {
      "orderSetId": "set_1",
      "orderSetName": "Standard Flow",
      "questionOrder": [1,2,3,4,5,6,7,8]
    }
  }'
```

### Test Dashboard Endpoint

```bash
curl http://localhost:3000/api/dashboard/stats?days=30
```

## Next Steps

Phase 3 is complete! The next phase is:

**Phase 4: Analytics Dashboard**
- Create `analytics.html` dashboard page
- Implement Chart.js visualizations
- Display order set performance, drop-off analysis, and question statistics

## Troubleshooting

### Port Already in Use
Change `PORT` in `.env` or stop the process using port 3000.

### Database Errors
- **SQLite**: Ensure `api/data/` directory exists and is writable
- **PostgreSQL**: Verify connection credentials and database exists

### CORS Errors
Update `CORS_ORIGIN` in `.env` to include your frontend domain.

### Analytics Not Sending
1. Check browser console for errors
2. Verify `ANALYTICS_ENDPOINT` is set correctly
3. Ensure API server is running
4. Check network tab for failed requests

## Files Created

```
api/
├── server.js                    # Main Express server
├── package.json                 # Dependencies
├── .gitignore                   # Git ignore rules
├── env.example.txt              # Environment template
├── README.md                    # API documentation
├── routes/
│   ├── analytics.js            # Analytics event routes
│   └── dashboard.js            # Dashboard data routes
├── services/
│   ├── analytics.js            # Analytics event processing
│   └── dashboard.js            # Dashboard data aggregation
├── db/
│   ├── database.js             # Database connection
│   ├── schema.sql              # SQLite schema
│   └── schema-postgresql.sql   # PostgreSQL schema
└── scripts/
    └── init-database.js        # Database initialization
```

## Support

For issues or questions, refer to:
- `api/README.md` - Full API documentation
- `IMPLEMENTATION_PLAN.md` - Complete implementation plan

