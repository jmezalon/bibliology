# Deployment Setup Guide

This guide walks you through setting up production deployment for Bibliology on Render and Vercel.

## Prerequisites

- GitHub account with repository access
- Render account (https://render.com)
- Vercel account (https://vercel.com)
- Production database (PostgreSQL)
- Production Redis instance
- Production S3-compatible storage (AWS S3, Cloudflare R2, or similar)

## Step 1: Set Up Render Services

### 1.1 Create PostgreSQL Database

1. Go to https://dashboard.render.com
2. Click "New +" → "PostgreSQL"
3. Configure:
   - **Name**: `bibliology-db`
   - **Database**: `bibliology`
   - **User**: `bibliology`
   - **Region**: Choose closest to your users
   - **PostgreSQL Version**: 15
   - **Plan**: Start with Free tier (can upgrade later)
4. Click "Create Database"
5. **SAVE THE FOLLOWING** (you'll need these):
   - Internal Database URL (for API/Worker)
   - External Database URL (for local migrations)
   - Host, Port, Database name, Username, Password

### 1.2 Create Redis Instance

1. Click "New +" → "Redis"
2. Configure:
   - **Name**: `bibliology-redis`
   - **Region**: Same as PostgreSQL
   - **Plan**: Start with Free tier
   - **Maxmemory Policy**: `allkeys-lru` (recommended)
3. Click "Create Redis"
4. **SAVE**: Redis connection string (Internal Redis URL)

### 1.3 Create API Service

1. Click "New +" → "Web Service"
2. Connect your GitHub repository: `jmezalon/bibliology`
3. Configure:
   - **Name**: `bibliology-api`
   - **Region**: Same as PostgreSQL/Redis
   - **Branch**: `main`
   - **Root Directory**: `apps/api`
   - **Runtime**: `Node`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @bibliology/api build
     ```
   - **Start Command**:
     ```bash
     cd ../.. && pnpm --filter @bibliology/api start:prod
     ```
   - **Plan**: Start with Free tier (will spin down after inactivity)
4. Click "Advanced" and add environment variables (see section below)
5. Click "Create Web Service"
6. After creation, go to **Settings** → **Deploy Hook**
7. Copy the Deploy Hook URL
8. **SAVE AS**: `RENDER_DEPLOY_HOOK_API` (for GitHub Secrets)

### 1.4 Create Worker Service

1. Click "New +" → "Background Worker"
2. Connect repository: `jmezalon/bibliology`
3. Configure:
   - **Name**: `bibliology-worker`
   - **Region**: Same as other services
   - **Branch**: `main`
   - **Root Directory**: `apps/worker`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @bibliology/worker build
     ```
   - **Start Command**:
     ```bash
     cd ../.. && pnpm --filter @bibliology/worker start:prod
     ```
   - **Plan**: Start with Free tier
4. Add same environment variables as API (see below)
5. Click "Create Background Worker"
6. Get Deploy Hook URL from Settings
7. **SAVE AS**: `RENDER_DEPLOY_HOOK_WORKER` (for GitHub Secrets)

### 1.5 API Environment Variables (Render)

Add these to both API and Worker services:

```bash
# Node
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database (use Internal Database URL from step 1.1)
DATABASE_URL=<Your Internal PostgreSQL URL>

# Redis (use Internal Redis URL from step 1.2)
REDIS_HOST=<Redis host from connection string>
REDIS_PORT=<Redis port from connection string>
REDIS_PASSWORD=<Redis password from connection string>

# JWT - GENERATE NEW SECURE SECRETS!
JWT_SECRET=<Generate with: openssl rand -base64 32>
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=<Generate with: openssl rand -base64 32>
JWT_REFRESH_EXPIRES_IN=7d

# CORS - Will update after Vercel deployment
CORS_ORIGIN=https://your-vercel-domain.vercel.app

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DEST=/tmp/uploads

# S3 / R2 - Configure your production storage
S3_ENDPOINT=<Your S3/R2 endpoint>
S3_ACCESS_KEY_ID=<Your access key>
S3_SECRET_ACCESS_KEY=<Your secret key>
S3_BUCKET=bibliology-prod
S3_REGION=<Your region>

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# PowerPoint Import
PPTX_IMPORT_TIMEOUT=300000

# Logging
LOG_LEVEL=info
```

### 1.6 Run Database Migrations

Once your API service is deployed:

1. Install Render CLI: `brew install render` (Mac) or download from https://render.com/docs/cli
2. Link to your service: `render services link`
3. Run migrations:
   ```bash
   render shell bibliology-api
   cd ../.. && DATABASE_URL="<production-db-url>" pnpm --filter @bibliology/api db:migrate:deploy
   ```

Alternatively, run migrations locally using the External Database URL:
```bash
cd /Users/mezalonm/Library/Mobile\ Documents/com~apple~CloudDocs/bibliology
DATABASE_URL="<External PostgreSQL URL>" pnpm --filter @bibliology/api db:migrate:deploy
DATABASE_URL="<External PostgreSQL URL>" pnpm --filter @bibliology/api db:seed
```

## Step 2: Set Up Vercel Project

### 2.1 Create Vercel Project

1. Go to https://vercel.com/dashboard
2. Click "Add New..." → "Project"
3. Import `jmezalon/bibliology` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `apps/web`
   - **Build Command**:
     ```bash
     cd ../.. && pnpm install && pnpm --filter @bibliology/web build
     ```
   - **Output Directory**: `dist`
   - **Install Command**: `pnpm install`

### 2.2 Environment Variables (Vercel)

Add in Vercel Project Settings → Environment Variables:

```bash
# API URL - Use your Render API URL
VITE_API_URL=https://bibliology-api.onrender.com

# Environment
NODE_ENV=production
```

### 2.3 Get Vercel Token

1. Go to https://vercel.com/account/tokens
2. Click "Create Token"
3. Name it: `bibliology-github-actions`
4. **SAVE AS**: `VERCEL_TOKEN` (for GitHub Secrets)

### 2.4 Get API Production URL

Once deployed, Vercel will give you a production URL like:
- `https://bibliology-xyz123.vercel.app`

**SAVE AS**: `API_URL` value for GitHub Secrets should be your Render API URL:
- `https://bibliology-api.onrender.com`

### 2.5 Update CORS_ORIGIN

Go back to Render → API Service → Environment Variables:
- Update `CORS_ORIGIN` to your Vercel production URL
- Click "Save Changes" (will redeploy)

## Step 3: Configure S3/R2 Storage

You have several options for production file storage:

### Option A: Cloudflare R2 (Recommended - Free tier available)

1. Go to https://dash.cloudflare.com
2. Navigate to R2 → Create bucket → `bibliology-prod`
3. Get credentials from R2 → Manage R2 API Tokens
4. Use values:
   ```
   S3_ENDPOINT=https://<account-id>.r2.cloudflarestorage.com
   S3_ACCESS_KEY_ID=<your-access-key>
   S3_SECRET_ACCESS_KEY=<your-secret-key>
   S3_BUCKET=bibliology-prod
   S3_REGION=auto
   ```

### Option B: AWS S3

1. Create S3 bucket in AWS Console
2. Create IAM user with S3 permissions
3. Get access key and secret key
4. Use values:
   ```
   S3_ENDPOINT=https://s3.amazonaws.com
   S3_ACCESS_KEY_ID=<your-access-key>
   S3_SECRET_ACCESS_KEY=<your-secret-key>
   S3_BUCKET=bibliology-prod
   S3_REGION=us-east-1
   ```

## Step 4: Configure GitHub Secrets

1. Go to https://github.com/jmezalon/bibliology/settings/secrets/actions
2. Click "New repository secret" for each:

| Secret Name | Value | Where to Get It |
|------------|-------|-----------------|
| `RENDER_DEPLOY_HOOK_API` | Deploy hook URL | Render → API Service → Settings → Deploy Hook |
| `RENDER_DEPLOY_HOOK_WORKER` | Deploy hook URL | Render → Worker Service → Settings → Deploy Hook |
| `VERCEL_TOKEN` | Vercel API token | Vercel → Account Settings → Tokens |
| `API_URL` | Production API URL | `https://bibliology-api.onrender.com` |

## Step 5: Deploy

### Automatic Deployment (Recommended)

Push to main branch:
```bash
git push origin main
```

This will trigger:
1. CI workflow (lint, test, build, security)
2. Deploy workflow (API → Frontend → Worker)

### Manual Deployment

Trigger from GitHub Actions:
1. Go to https://github.com/jmezalon/bibliology/actions/workflows/deploy.yml
2. Click "Run workflow"
3. Select branch: `main`
4. Click "Run workflow"

## Verification Checklist

After deployment, verify:

- [ ] API Health Check: https://bibliology-api.onrender.com/health
- [ ] API Docs: https://bibliology-api.onrender.com/api/docs
- [ ] Frontend loads: https://your-vercel-domain.vercel.app
- [ ] Can register new account
- [ ] Can login
- [ ] Can access teacher dashboard
- [ ] File uploads work (if testing media features)
- [ ] Worker is processing jobs (check Render logs)

## Monitoring

### Render Logs
- API: https://dashboard.render.com → bibliology-api → Logs
- Worker: https://dashboard.render.com → bibliology-worker → Logs

### Vercel Logs
- https://vercel.com/dashboard → Your Project → Deployments → [Latest] → Logs

### GitHub Actions
- https://github.com/jmezalon/bibliology/actions

## Troubleshooting

### API Won't Start
- Check Render logs for errors
- Verify DATABASE_URL is correct
- Verify JWT secrets are set
- Ensure migrations have run

### Frontend Can't Connect to API
- Check VITE_API_URL in Vercel
- Check CORS_ORIGIN in Render API
- Verify API is running and healthy

### Worker Not Processing Jobs
- Check Redis connection
- Verify worker logs in Render
- Ensure environment variables match API

### Database Migration Errors
- Use External Database URL for local migrations
- Check PostgreSQL version compatibility
- Verify database user has proper permissions

## Cost Estimates (Free Tiers)

- **Render**:
  - PostgreSQL: Free (1GB storage)
  - Redis: Free (25MB)
  - API Web Service: Free (spins down after 15min inactivity)
  - Worker: Free (limited hours)
- **Vercel**: Free tier (100GB bandwidth/month)
- **Cloudflare R2**: Free (10GB storage, 1M Class A operations)

**Total**: $0/month on free tiers (suitable for development/testing)

For production scale, expect ~$20-50/month for:
- Render: $7/month (always-on API)
- PostgreSQL: $7/month (shared)
- Redis: Free
- Vercel: Free (or $20/month Pro for teams)
- R2: Free up to limits

## Next Steps

1. Set up custom domain (optional)
2. Configure SSL certificates (automatic on Render/Vercel)
3. Set up error monitoring (Sentry, LogRocket, etc.)
4. Configure email service for notifications
5. Set up backups for PostgreSQL
6. Configure CDN for static assets
