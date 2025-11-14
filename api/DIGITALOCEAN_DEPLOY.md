# DigitalOcean App Platform Deployment Guide

## Quick Setup (5 minutes)

### Option 1: Deploy via DigitalOcean Dashboard (Easiest)

1. **Go to DigitalOcean App Platform**
   - Visit: https://cloud.digitalocean.com/apps
   - Click "Create App"

2. **Connect Your Repository**
   - Connect GitHub/GitLab/Bitbucket
   - Select your repository
   - Select branch (usually `main`)

3. **Configure the App**
   - **Name**: `tre-chatbot-analytics-api`
   - **Type**: Web Service
   - **Source Directory**: `api` (important!)
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
   - **Environment**: Node.js

4. **Set Environment Variables**
   Click "Edit" next to Environment Variables and add:
   ```
   NODE_ENV=production
   PORT=8080
   DB_TYPE=sqlite
   DB_PATH=/tmp/analytics.db
   CORS_ORIGIN=*
   ```

5. **Configure Health Check**
   - HTTP Path: `/health`
   - Initial Delay: 10 seconds

6. **Deploy**
   - Click "Next" → "Create Resources"
   - Wait for deployment (2-3 minutes)

### Option 2: Deploy via App Spec (Recommended)

1. **Create `.do/app.yaml` file** (already created in `api/.do/app.yaml`)

2. **Deploy via CLI**
   ```bash
   # Install doctl (DigitalOcean CLI)
   brew install doctl  # macOS
   # or download from: https://docs.digitalocean.com/reference/doctl/how-to/install/
   
   # Authenticate
   doctl auth init
   
   # Deploy
   doctl apps create --spec .do/app.yaml
   ```

3. **Or use the Dashboard**
   - Go to Apps → Create App
   - Select "App Spec" tab
   - Paste the contents of `.do/app.yaml`
   - Click "Create Resources"

## Important Notes for SQLite on DigitalOcean

⚠️ **SQLite Limitations on App Platform:**
- The file system is **ephemeral** - data is lost on redeployments
- SQLite file is stored in `/tmp/` which persists during the app's lifetime
- For production with persistent data, use PostgreSQL (see below)

### Making SQLite More Persistent

The current setup uses `/tmp/analytics.db` which persists as long as the app instance is running. However, if you need true persistence, consider:

1. **Use DigitalOcean Managed PostgreSQL** (Recommended for Production)
   - Add a PostgreSQL database component in App Platform
   - Set `DB_TYPE=postgresql` in environment variables
   - Database connection will be auto-provided via `DATABASE_URL`

2. **Use DigitalOcean Spaces** (Object Storage)
   - Store SQLite file in Spaces
   - Download on startup, upload periodically
   - More complex but provides persistence

## Environment Variables Reference

```bash
# Required
NODE_ENV=production
PORT=8080                    # DigitalOcean sets this automatically
DB_TYPE=sqlite

# SQLite Configuration
DB_PATH=/tmp/analytics.db    # Use /tmp/ for App Platform

# CORS (adjust to your frontend domain)
CORS_ORIGIN=https://yourdomain.com,https://www.yourdomain.com

# Optional
ANALYTICS_RETENTION_DAYS=90
```

## Updating Your Frontend

After deployment, update your frontend to point to the new API:

```html
<script>
    window.ANALYTICS_ENDPOINT = 'https://your-app-name.ondigitalocean.app/api/analytics/event';
</script>
```

Or set it dynamically:
```javascript
// Get the app URL from DigitalOcean environment
const API_URL = window.ANALYTICS_ENDPOINT || 
    'https://your-app-name.ondigitalocean.app/api/analytics/event';
```

## Database Initialization

The database will be initialized automatically on first request, but you can also trigger it manually:

```bash
# SSH into your app (if enabled)
doctl apps logs <app-id> --type run --follow

# Or trigger via HTTP
curl -X GET https://your-app.ondigitalocean.app/health
```

## Monitoring

1. **View Logs**
   ```bash
   doctl apps logs <app-id> --type run --follow
   ```

2. **Check Health**
   ```bash
   curl https://your-app.ondigitalocean.app/health
   ```

3. **View Metrics**
   - Go to your app in DigitalOcean dashboard
   - Click "Metrics" tab

## Upgrading to PostgreSQL (Production)

1. **Add Database Component**
   - In App Platform dashboard, go to your app
   - Click "Components" → "Add Component" → "Database"
   - Select PostgreSQL
   - Choose plan (Basic $15/month minimum)

2. **Update Environment Variables**
   ```
   DB_TYPE=postgresql
   # Remove DB_PATH (not needed for PostgreSQL)
   ```

3. **Database Connection**
   DigitalOcean automatically provides:
   - `DATABASE_URL` (full connection string)
   - `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`

4. **Update Database Schema**
   ```bash
   # Connect to database
   doctl databases connection <db-id>
   
   # Run PostgreSQL schema
   psql $DATABASE_URL -f db/schema-postgresql.sql
   ```

## Troubleshooting

### App Won't Start
- Check logs: `doctl apps logs <app-id>`
- Verify `PORT=8080` is set (DigitalOcean requirement)
- Ensure `npm start` runs the server correctly

### Database Errors
- Verify `DB_PATH` is writable (`/tmp/` is recommended)
- Check file permissions
- For SQLite: ensure directory exists

### CORS Errors
- Update `CORS_ORIGIN` to include your frontend domain
- Use `*` for development (not recommended for production)

### Health Check Failing
- Verify `/health` endpoint returns 200 OK
- Check that server starts within health check timeout

## Cost Estimate

**Basic Setup (SQLite):**
- App Platform Basic ($5/month) - 512MB RAM, 1GB storage
- Total: ~$5/month

**Production Setup (PostgreSQL):**
- App Platform Basic ($5/month)
- Managed PostgreSQL Basic ($15/month)
- Total: ~$20/month

## Quick Deploy Script

Save this as `deploy.sh`:

```bash
#!/bin/bash
# Quick deploy to DigitalOcean App Platform

echo "🚀 Deploying to DigitalOcean App Platform..."

# Check if doctl is installed
if ! command -v doctl &> /dev/null; then
    echo "❌ doctl not found. Install from: https://docs.digitalocean.com/reference/doctl/how-to/install/"
    exit 1
fi

# Deploy
doctl apps create --spec api/.do/app.yaml

echo "✅ Deployment initiated!"
echo "📊 Check status: https://cloud.digitalocean.com/apps"
```

Make it executable:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Next Steps

1. Deploy the API ✅
2. Update frontend with API URL
3. Test analytics collection
4. (Optional) Set up PostgreSQL for production
5. Build Phase 4 Dashboard to visualize the data

