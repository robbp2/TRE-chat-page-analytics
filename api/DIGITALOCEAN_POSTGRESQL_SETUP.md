# DigitalOcean PostgreSQL Setup Guide

## After Adding PostgreSQL Database Component

When you add a PostgreSQL database component to your DigitalOcean App Platform app, you need to update your environment variables.

## Required Environment Variable Changes

### 1. Update Database Type

**Change:**
```
DB_TYPE=sqlite
```

**To:**
```
DB_TYPE=postgresql
```

### 2. Remove SQLite-Specific Variable

**Remove:**
```
DB_PATH=/tmp/analytics.db
```
(This is not needed for PostgreSQL)

### 3. Database Connection Variables

DigitalOcean **automatically provides** these environment variables when you attach a database:

- `DATABASE_URL` - Full connection string (preferred)
- `DB_HOST` - Database hostname
- `DB_PORT` - Database port (usually 25060)
- `DB_NAME` - Database name
- `DB_USER` - Database user
- `DB_PASSWORD` - Database password

**You don't need to manually set these** - DigitalOcean does it automatically!

## Steps to Update

1. **Go to your App Settings**
   - Navigate to your app in DigitalOcean
   - Click on the "api" component
   - Go to "Settings" tab

2. **Edit Environment Variables**
   - Click "Edit" next to Environment Variables
   - **Change** `DB_TYPE` from `sqlite` to `postgresql`
   - **Remove** `DB_PATH` variable (click the X next to it)
   - **Keep** all other variables:
     - `NODE_ENV=production`
     - `PORT=8080` (auto-set by DO)
     - `CORS_ORIGIN=*` (or your specific domain)

3. **Save Changes**
   - Click "Save" or "Update"
   - The app will automatically redeploy

## Verify Database Connection

After the app redeploys, check the logs:

1. Go to "Runtime Logs" tab
2. Look for:
   - `Database: postgresql` (should show PostgreSQL, not sqlite)
   - `Database initialized successfully` (should appear on startup)

## Initialize PostgreSQL Schema

The app will automatically create tables on first startup, but if you want to manually initialize:

1. **Get Database Connection Info**
   - Go to your Database component in DigitalOcean
   - Click "Connection Details"
   - Copy the connection string or individual values

2. **Connect and Run Schema**
   ```bash
   # Using psql with connection string
   psql $DATABASE_URL -f db/schema-postgresql.sql
   
   # Or using individual values
   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f db/schema-postgresql.sql
   ```

   **Note:** The app automatically runs the schema on startup, so manual initialization is usually not needed.

## Final Environment Variables

Your environment variables should look like this:

```
NODE_ENV=production
PORT=8080
DB_TYPE=postgresql
CORS_ORIGIN=*
```

Plus these (automatically added by DigitalOcean):
```
DATABASE_URL=postgresql://user:password@host:port/dbname
DB_HOST=your-db-host.db.ondigitalocean.com
DB_PORT=25060
DB_NAME=defaultdb
DB_USER=doadmin
DB_PASSWORD=your-password
```

## Troubleshooting

### Database Connection Errors

If you see connection errors in logs:

1. **Verify database is attached**
   - Go to your app → Components
   - Ensure PostgreSQL database component is listed

2. **Check environment variables**
   - Ensure `DB_TYPE=postgresql` is set
   - Verify `DATABASE_URL` or individual DB variables exist

3. **Check database status**
   - Go to Database component
   - Ensure it's "Healthy" and running

### Schema Not Creating

If tables aren't being created:

1. Check runtime logs for initialization errors
2. The app tries to create tables automatically on startup
3. If it fails, you can manually run `db/schema-postgresql.sql`

## Benefits of PostgreSQL

- ✅ **Persistent data** - Survives app redeployments
- ✅ **Better performance** - Optimized for production workloads
- ✅ **Scalability** - Can handle more concurrent connections
- ✅ **Backups** - Automatic backups by DigitalOcean
- ✅ **High availability** - Better reliability than SQLite

## Cost

- PostgreSQL Basic: ~$15/month (minimum)
- App Platform Basic: ~$5/month
- **Total: ~$20/month**

---

**After updating environment variables, your app will automatically redeploy and connect to PostgreSQL!**

