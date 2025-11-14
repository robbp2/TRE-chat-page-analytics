# 🚀 Quick Deploy to DigitalOcean App Platform

## Fastest Method (3 Steps)

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Add analytics API"
git push origin main
```

### Step 2: Deploy via Dashboard
1. Go to: https://cloud.digitalocean.com/apps
2. Click **"Create App"**
3. Connect your GitHub repository
4. Configure:
   - **Source Directory**: `api`
   - **Build Command**: `npm install`
   - **Run Command**: `npm start`
5. Add Environment Variables:
   ```
   NODE_ENV=production
   DB_TYPE=sqlite
   DB_PATH=/tmp/analytics.db
   CORS_ORIGIN=*
   ```
6. Click **"Create Resources"**

### Step 3: Update Frontend
Add to your `index.html`:
```html
<script>
    window.ANALYTICS_ENDPOINT = 'https://YOUR-APP-NAME.ondigitalocean.app/api/analytics/event';
</script>
```

**Done!** ✅ Your API is live in ~3 minutes.

## Alternative: Use App Spec File

If you have the `.do/app.yaml` file in your repo:

1. Go to DigitalOcean Apps → Create App
2. Select **"App Spec"** tab
3. Paste the contents of `api/.do/app.yaml`
4. Click **"Create Resources"**

## Important Notes

- **SQLite on DigitalOcean**: Data persists during app lifetime but resets on redeploy
- **For Production**: Use PostgreSQL (add Database component in App Platform)
- **Health Check**: `/health` endpoint is automatically configured
- **Port**: DigitalOcean sets `PORT=8080` automatically

## Test Your Deployment

```bash
# Health check
curl https://YOUR-APP-NAME.ondigitalocean.app/health

# Test analytics endpoint
curl -X POST https://YOUR-APP-NAME.ondigitalocean.app/api/analytics/event \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "order_set_selected",
    "sessionId": "test_123",
    "timestamp": "2025-01-13T12:00:00.000Z",
    "data": {"orderSetId": "set_1"}
  }'
```

## Need Help?

See `DIGITALOCEAN_DEPLOY.md` for detailed instructions.

