# TRE Chat Page + Analytics

A comprehensive chatbot system with analytics backend for Tax Relief Experts. Features a beautiful, responsive chat interface and a complete analytics API for tracking user interactions and question flow performance.

## 🚀 Features

### Chat Interface
- **Realistic Chat Experience**: Beautiful, modern chat UI matching Tax Relief Experts brand
- **Question Flow System**: Modular question system with multiple order sets
- **Smart Input Types**: Yes/No buttons, multiple choice, text input, amount input
- **State Selection**: Scrollable, filterable state list with search
- **Responsive Design**: Works perfectly on mobile, tablet, and desktop
- **Typing Indicators**: Realistic agent typing animations
- **Message History**: Complete conversation tracking

### Analytics Backend
- **Event Tracking**: Comprehensive analytics for all user interactions
- **Dashboard API**: RESTful endpoints for analytics data
- **Database Support**: SQLite (default) and PostgreSQL support
- **Order Set Analysis**: Track performance of different question flows
- **Drop-off Analysis**: Identify where users abandon the flow
- **Question Performance**: Track answer rates and response times

## 📁 Project Structure

```
TRE Chatbot/
├── index.html              # Main chat page
├── chat.js                 # Chat functionality and question flow
├── styles.css              # Complete styling
├── questions.config.js     # Question definitions and order sets
├── config.example.js       # API configuration examples
│
├── api/                    # Analytics API Backend
│   ├── server.js          # Express server
│   ├── routes/            # API routes
│   ├── services/           # Business logic
│   ├── db/                 # Database schemas
│   └── scripts/            # Utility scripts
│
├── libs/                   # Third-party libraries
│   ├── fonts/             # Poppins font family
│   └── fontawesome/        # Font Awesome icons
│
└── img/                    # Images and assets
    └── brands/
        └── taxreliefexperts/
            └── logo.svg
```

## 🛠️ Quick Start

### Frontend (Chat Page)

1. **Open the chat page**
   ```bash
   # Simply open index.html in a browser
   # Or use a local server:
   python -m http.server 8000
   # Then visit http://localhost:8000
   ```

2. **Configure API endpoint** (optional)
   ```html
   <script>
       window.ANALYTICS_ENDPOINT = 'http://localhost:3000/api/analytics/event';
   </script>
   ```

### Backend (Analytics API)

1. **Install dependencies**
   ```bash
   cd api
   npm install
   ```

2. **Configure environment**
   ```bash
   cp env.example.txt .env
   # Edit .env with your settings
   ```

3. **Start server**
   ```bash
   npm start
   # Server runs on http://localhost:3000
   ```

## 📊 Analytics API

### Endpoints

**Analytics Events:**
- `POST /api/analytics/event` - Track single event
- `POST /api/analytics/batch` - Track multiple events

**Dashboard Data:**
- `GET /api/dashboard/stats` - Overall statistics
- `GET /api/dashboard/order-sets` - Order set performance
- `GET /api/dashboard/dropoffs` - Drop-off analysis
- `GET /api/dashboard/questions` - Question performance
- `GET /api/dashboard/completion-rates` - Completion breakdown

See [api/README.md](api/README.md) for complete API documentation.

## 🌐 Deployment

### DigitalOcean App Platform (Recommended)

See [api/QUICK_DEPLOY.md](api/QUICK_DEPLOY.md) for fastest deployment method.

**Quick Deploy:**
1. Push code to GitHub
2. Connect to DigitalOcean App Platform
3. Set source directory to `api`
4. Add environment variables
5. Deploy!

### Other Platforms

The API can be deployed to any Node.js hosting platform:
- Heroku
- Railway
- Render
- AWS Elastic Beanstalk
- Google Cloud Run

## 📝 Configuration

### Question Configuration

Edit `questions.config.js` to modify questions and order sets:

```javascript
const QUESTIONS = {
    1: {
        id: 1,
        text: "What is your approximate tax debt amount?",
        type: "amount",
        // ... configuration
    }
};

const ORDER_SETS = [
    {
        id: "set_1",
        name: "Standard Flow",
        order: [1, 2, 3, 4, 5, 6, 7, 8]
    }
];
```

### API Configuration

Set environment variables or configure in `index.html`:

```javascript
window.ANALYTICS_ENDPOINT = 'https://your-api.com/api/analytics/event';
window.API_ENABLED = true;
window.QUESTION_MODE_ENABLED = true;
```

## 🗄️ Database

### SQLite (Default)
- No setup required
- Database file: `api/data/analytics.db`
- Perfect for development and small deployments

### PostgreSQL (Production)
- Set `DB_TYPE=postgresql` in environment
- Configure connection in `.env`
- Use `db/schema-postgresql.sql` for schema

## 📈 Analytics Tracking

The chat automatically tracks:
- Order set selection
- Question starts
- Question answers
- Response times
- Flow completion
- Drop-off points

All data is stored locally (localStorage) and sent to the API if configured.

## 🎨 Customization

### Styling
- Edit `styles.css` for visual changes
- CSS variables at the top control colors and spacing
- Fully responsive with mobile breakpoints

### Chat Behavior
- Edit `chat.js` for chat logic
- Modify `agentResponses` object for agent messages
- Customize question flow in `questions.config.js`

## 📚 Documentation

- [API Documentation](api/README.md) - Complete API reference
- [Phase 3 Setup Guide](PHASE3_SETUP.md) - Analytics backend setup
- [DigitalOcean Deployment](api/DIGITALOCEAN_DEPLOY.md) - Deployment guide
- [Implementation Plan](IMPLEMENTATION_PLAN.md) - Full project plan

## 🧪 Testing

### Test Chat Locally
1. Open `index.html` in browser
2. Start chatting - questions will appear automatically
3. Check browser console for analytics events

### Test API
```bash
# Health check
curl http://localhost:3000/health

# Test analytics event
curl -X POST http://localhost:3000/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_set_selected",
    "sessionId": "test_123",
    "timestamp": "2025-01-13T12:00:00.000Z",
    "data": {"orderSetId": "set_1"}
  }'
```

## 🚧 Roadmap

- [x] Phase 1: Question Configuration System
- [x] Phase 2: Chat Flow Engine
- [x] Phase 3: Analytics API & Backend
- [ ] Phase 4: Analytics Dashboard (Next)
- [ ] Phase 5: Admin Interface
- [ ] Phase 6: Advanced Analytics

## 📄 License

This project is proprietary software for Tax Relief Experts.

## 👥 Support

For issues or questions:
- Check documentation in `/api/README.md`
- Review `IMPLEMENTATION_PLAN.md` for architecture details
- See deployment guides for platform-specific help

## 🎯 Key Metrics Tracked

- **Order Set Performance**: Completion rates, session counts
- **Question Performance**: Answer rates, response times
- **Drop-off Analysis**: Where users abandon the flow
- **User Behavior**: Session duration, question paths
- **Completion Rates**: High/Medium/Low completion breakdowns

---

Built with ❤️ for Tax Relief Experts
