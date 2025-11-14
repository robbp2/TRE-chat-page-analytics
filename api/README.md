# TRE Chatbot Analytics API

Backend API server for collecting and analyzing chatbot analytics data.

## Features

- **Event Tracking**: Track order set selections, question starts, answers, and flow completions
- **Dashboard Data**: Aggregated statistics for analytics dashboard
- **Database Support**: Works with both SQLite (default) and PostgreSQL
- **RESTful API**: Clean REST endpoints for analytics operations

## Setup

### 1. Install Dependencies

```bash
cd api
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

Edit `.env` with your settings:
- `PORT`: Server port (default: 3000)
- `DB_TYPE`: Database type - `sqlite` or `postgresql` (default: `sqlite`)
- `DB_PATH`: SQLite database path (default: `./data/analytics.db`)

For PostgreSQL:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

### 3. Initialize Database

```bash
npm run init-db
```

This will:
- Create all necessary tables
- Insert default order sets
- Set up indexes

### 4. Start Server

**Development (with auto-reload):**
```bash
npm run dev
```

**Production:**
```bash
npm start
```

## API Endpoints

### Analytics Events

#### POST `/api/analytics/event`

Track a single analytics event.

**Request Body:**
```json
{
  "eventType": "question_answered",
  "sessionId": "session_1234567890_abc123",
  "timestamp": "2025-01-13T12:00:00.000Z",
  "data": {
    "orderSetId": "set_1",
    "questionId": 1,
    "questionIndex": 0,
    "answer": "yes",
    "timeToAnswer": 2500
  }
}
```

**Event Types:**
- `order_set_selected`: When a question flow starts
- `question_started`: When a question is displayed
- `question_answered`: When a question is answered
- `question_flow_completed`: When the flow completes
- `question_flow_data`: Complete flow data submission

#### POST `/api/analytics/batch`

Track multiple events at once.

**Request Body:**
```json
{
  "events": [
    {
      "eventType": "question_started",
      "sessionId": "session_123",
      "timestamp": "2025-01-13T12:00:00.000Z",
      "data": { ... }
    },
    ...
  ]
}
```

### Dashboard Data

#### GET `/api/dashboard/stats?days=30`

Get overall dashboard statistics.

**Response:**
```json
{
  "totalSessions": 150,
  "avgCompletion": 75.5,
  "avgTime": 120000,
  "totalEvents": 1200,
  "totalDropoffs": 25
}
```

#### GET `/api/dashboard/order-sets?days=30`

Get order set performance statistics.

**Response:**
```json
[
  {
    "id": "set_1",
    "name": "Standard Flow",
    "totalSessions": 50,
    "avgCompletion": 80.5,
    "highCompletionCount": 30,
    "mediumCompletionCount": 15,
    "lowCompletionCount": 5,
    "avgTimeMs": 125000
  },
  ...
]
```

#### GET `/api/dashboard/dropoffs?days=30`

Get drop-off point analysis.

**Response:**
```json
[
  {
    "orderSetId": "set_1",
    "questionId": 3,
    "questionIndex": 2,
    "dropoffCount": 10,
    "avgCompletionAtDropoff": 25.0
  },
  ...
]
```

#### GET `/api/dashboard/questions?days=30`

Get question performance statistics.

**Response:**
```json
[
  {
    "orderSetId": "set_1",
    "questionId": 1,
    "questionIndex": 0,
    "startedCount": 50,
    "answeredCount": 45,
    "avgTimeToAnswer": 5000,
    "answerRate": "90.00"
  },
  ...
]
```

#### GET `/api/dashboard/completion-rates?days=30`

Get completion rate breakdown.

**Response:**
```json
{
  "high": 30,
  "medium": 15,
  "low": 5
}
```

## Frontend Integration

In your `index.html`, configure the analytics endpoint:

```html
<script>
    window.ANALYTICS_ENDPOINT = 'http://localhost:3000/api/analytics/event';
</script>
<script src="chat.js"></script>
```

The chat.js file will automatically send analytics events to this endpoint.

## Database Schema

See `db/schema.sql` for the complete database schema. Key tables:

- **order_sets**: Question order configurations
- **chat_sessions**: User session data
- **question_events**: Individual question events
- **dropoff_points**: Drop-off analysis data

## Development

### Project Structure

```
api/
├── server.js              # Main Express server
├── routes/
│   ├── analytics.js      # Analytics event routes
│   └── dashboard.js      # Dashboard data routes
├── services/
│   ├── analytics.js      # Analytics event processing
│   └── dashboard.js      # Dashboard data aggregation
├── db/
│   ├── database.js       # Database connection
│   ├── schema.sql        # SQLite schema
│   └── schema-postgresql.sql  # PostgreSQL schema
├── scripts/
│   └── init-database.js # Database initialization
└── package.json
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use PostgreSQL for production (set `DB_TYPE=postgresql`)
3. Configure proper CORS origins
4. Use a process manager like PM2:
   ```bash
   pm2 start server.js --name tre-analytics-api
   ```

## Troubleshooting

### Database Connection Issues

- **SQLite**: Ensure the `data/` directory exists and is writable
- **PostgreSQL**: Verify connection credentials and database exists

### CORS Errors

Update `CORS_ORIGIN` in `.env` to include your frontend domain.

### Port Already in Use

Change `PORT` in `.env` or stop the process using port 3000.

