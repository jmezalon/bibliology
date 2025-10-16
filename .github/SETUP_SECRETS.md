# GitHub Secrets Setup Guide

This guide walks you through setting up all required GitHub secrets for CI/CD deployment.

## Prerequisites

- GitHub repository admin access
- Render account (for backend/database)
- Vercel account (for frontend)
- Access to production database

---

## Step-by-Step Setup

### 1. Generate JWT Secrets

These are used for authentication tokens.

```bash
# Generate JWT_SECRET (copy output)
openssl rand -base64 64

# Generate JWT_REFRESH_SECRET (copy output)
openssl rand -base64 64
```

Save these securely - you'll need them for both GitHub secrets and Render environment variables.

---

### 2. Set Up Render

#### Create Render Account
1. Visit https://render.com
2. Sign up / Log in
3. Connect your GitHub repository

#### Create PostgreSQL Database

1. Go to Render Dashboard → New → PostgreSQL
2. Configure:
   - **Name:** bibliology-db
   - **Database:** bibliology
   - **User:** (auto-generated)
   - **Region:** Oregon (or closest to users)
   - **Plan:** Starter ($7/month) or Free (for testing)
3. Click "Create Database"
4. **Wait for database to be ready** (~2 minutes)
5. Copy **Internal Database URL** (starts with `postgresql://`)
   - This is your `DATABASE_URL`
6. Copy **External Database URL** (for local migrations)

#### Create Redis Instance

1. Go to Render Dashboard → New → Redis
2. Configure:
   - **Name:** bibliology-redis
   - **Region:** Same as database
   - **Plan:** Starter ($10/month) or Free
   - **Maxmemory Policy:** allkeys-lru
3. Click "Create Redis"
4. Copy:
   - **Internal Redis URL** (hostname)
   - **Port:** (usually 6379)

#### Create API Service

1. Go to Render Dashboard → New → Web Service
2. Configure:
   - **Name:** bibliology-api
   - **Region:** Same as database
   - **Branch:** main
   - **Runtime:** Docker
   - **Dockerfile Path:** ./apps/api/Dockerfile
   - **Docker Context:** . (root)
   - **Plan:** Starter ($7/month)
3. **Important:** Set Auto-Deploy to **Manual** (we'll use GitHub Actions)
4. Add environment variables (see section below)
5. Create service

#### Create Worker Service

1. Go to Render Dashboard → New → Background Worker
2. Configure:
   - **Name:** bibliology-worker
   - **Region:** Same as database
   - **Branch:** main
   - **Runtime:** Docker
   - **Dockerfile Path:** ./apps/worker/Dockerfile
3. Set Auto-Deploy to **Manual**
4. Add environment variables
5. Create worker

#### Get Deploy Hooks

For each service (API and Worker):
1. Go to Service → Settings
2. Scroll to "Deploy Hook"
3. Click "Create Deploy Hook"
4. Copy the webhook URL
5. Save as:
   - API: `RENDER_DEPLOY_HOOK_API`
   - API Staging: `RENDER_DEPLOY_HOOK_API_STAGING`
   - Worker: `RENDER_DEPLOY_HOOK_WORKER`

---

### 3. Set Up Vercel

#### Create Vercel Account
1. Visit https://vercel.com
2. Sign up / Log in with GitHub
3. Import your repository

#### Import Frontend Project

1. Click "Add New..." → Project
2. Select your repository
3. Configure:
   - **Framework Preset:** Vite
   - **Root Directory:** apps/web
   - **Build Command:** `cd ../.. && pnpm install && pnpm --filter @bibliology/web build`
   - **Output Directory:** dist
   - **Install Command:** `cd ../.. && pnpm install`
4. Add environment variables:
   ```
   VITE_API_URL=https://your-api-url.onrender.com/api
   VITE_APP_NAME=Bibliology
   VITE_ENV=production
   ```
5. Click "Deploy"

#### Get Vercel Token

1. Visit https://vercel.com/account/tokens
2. Click "Create Token"
3. Name: "GitHub Actions CI/CD"
4. Scope: Full Account
5. Expiration: No expiration (or 1 year)
6. Click "Create"
7. **Copy token immediately** (shown only once)
8. Save as `VERCEL_TOKEN`

#### Get Vercel Project IDs

```bash
cd apps/web
vercel link
# Follow prompts to link to your Vercel project

# Check project config
cat .vercel/project.json
```

Copy from the JSON:
- `orgId` → Save as `VERCEL_ORG_ID`
- `projectId` → Save as `VERCEL_PROJECT_ID_WEB`

Or get from Vercel dashboard:
1. Project Settings → General
2. Copy "Project ID"
3. Copy "Team ID" (if team project) or "User ID"

---

### 4. Configure GitHub Secrets

Go to: **GitHub Repository → Settings → Secrets and variables → Actions**

Click **"New repository secret"** for each:

#### Database & Cache
```
DATABASE_URL
Value: postgresql://user:pass@host:5432/bibliology
(from Render PostgreSQL Internal URL)

STAGING_DATABASE_URL
Value: postgresql://user:pass@staging-host:5432/bibliology_staging
(create separate database for staging)
```

#### Authentication
```
JWT_SECRET
Value: <64-char random string from step 1>

JWT_REFRESH_SECRET
Value: <64-char random string from step 1>
```

#### Render Deployment
```
RENDER_DEPLOY_HOOK_API
Value: https://api.render.com/deploy/srv-xxxxx?key=xxxxx
(from Render API service deploy hook)

RENDER_DEPLOY_HOOK_API_STAGING
Value: https://api.render.com/deploy/srv-yyyyy?key=yyyyy
(create separate staging service)

RENDER_DEPLOY_HOOK_WORKER
Value: https://api.render.com/deploy/srv-zzzzz?key=zzzzz
(from Render worker deploy hook)

API_URL
Value: https://bibliology-api.onrender.com
(your production API URL)

STAGING_API_URL
Value: https://bibliology-api-staging.onrender.com
(your staging API URL)
```

#### Vercel Deployment
```
VERCEL_TOKEN
Value: <token from Vercel account>

VERCEL_ORG_ID
Value: <orgId from .vercel/project.json>

VERCEL_PROJECT_ID_WEB
Value: <projectId from .vercel/project.json>

PRODUCTION_WEB_URL
Value: https://bibliology.com
(or your Vercel production URL)

STAGING_WEB_URL
Value: https://staging-bibliology.vercel.app
(your Vercel preview URL)
```

#### Optional (but recommended)
```
CODECOV_TOKEN
Value: <from codecov.io after connecting repo>

SENTRY_DSN
Value: <from Sentry project settings>
(for error tracking)

SLACK_WEBHOOK_URL
Value: <from Slack app incoming webhooks>
(for deployment notifications)
```

---

### 5. Configure Render Environment Variables

For **API Service**, add these environment variables:

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api

# Database (linked from Render)
DATABASE_URL=${bibliology-db.DATABASE_URL}

# Redis (linked from Render)
REDIS_HOST=${bibliology-redis.REDIS_INTERNAL_HOST}
REDIS_PORT=${bibliology-redis.REDIS_PORT}

# JWT (copy from GitHub secrets)
JWT_SECRET=<same as GitHub secret>
JWT_REFRESH_SECRET=<same as GitHub secret>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS (update with your domain)
CORS_ORIGIN=https://bibliology.vercel.app

# File Upload
MAX_FILE_SIZE=52428800
UPLOAD_DEST=/tmp/uploads

# Rate Limiting
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Optional: S3 for file storage
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=<your-key>
S3_SECRET_ACCESS_KEY=<your-secret>
S3_BUCKET=bibliology-prod
S3_REGION=us-east-1
```

For **Worker Service**, add:
```bash
NODE_ENV=production
DATABASE_URL=${bibliology-db.DATABASE_URL}
REDIS_HOST=${bibliology-redis.REDIS_INTERNAL_HOST}
REDIS_PORT=${bibliology-redis.REDIS_PORT}
```

---

### 6. Verify Setup

#### Test GitHub Secrets
```bash
# Push a commit to trigger CI
git commit --allow-empty -m "Test CI/CD setup"
git push origin develop

# Check GitHub Actions tab for results
```

#### Test API Health
```bash
# After deployment
curl https://your-api-url.onrender.com/health

# Expected response:
# {"status":"ok","timestamp":"...","database":"connected"}
```

#### Test Frontend
```bash
# Visit your Vercel URL
open https://your-app.vercel.app

# Check browser console for errors
# Verify API connection works
```

---

## Environment Variable Reference

### API Service (Render)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `NODE_ENV` | Yes | Environment | `production` |
| `PORT` | Yes | Server port | `3000` |
| `DATABASE_URL` | Yes | PostgreSQL connection | `postgresql://...` |
| `REDIS_HOST` | Yes | Redis hostname | `redis-internal` |
| `REDIS_PORT` | Yes | Redis port | `6379` |
| `JWT_SECRET` | Yes | JWT signing key | `<64-char random>` |
| `JWT_REFRESH_SECRET` | Yes | Refresh token key | `<64-char random>` |
| `CORS_ORIGIN` | Yes | Allowed origin | `https://app.com` |
| `API_PREFIX` | No | API route prefix | `api` |
| `MAX_FILE_SIZE` | No | Max upload size | `52428800` (50MB) |
| `THROTTLE_TTL` | No | Rate limit window | `60` (seconds) |
| `THROTTLE_LIMIT` | No | Max requests | `100` |

### Frontend (Vercel)

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_API_URL` | Yes | Backend API URL | `https://api.app.com/api` |
| `VITE_ENV` | Yes | Environment | `production` |
| `VITE_APP_NAME` | No | App name | `Bibliology` |
| `VITE_ENABLE_ANALYTICS` | No | Enable analytics | `true` |
| `VITE_ENABLE_ERROR_REPORTING` | No | Enable Sentry | `true` |

### GitHub Secrets

| Secret | Required | Description |
|--------|----------|-------------|
| `DATABASE_URL` | Yes | Production database |
| `STAGING_DATABASE_URL` | For staging | Staging database |
| `JWT_SECRET` | Yes | Production JWT secret |
| `JWT_REFRESH_SECRET` | Yes | Production refresh secret |
| `RENDER_DEPLOY_HOOK_API` | Yes | API deploy webhook |
| `RENDER_DEPLOY_HOOK_API_STAGING` | For staging | Staging API webhook |
| `RENDER_DEPLOY_HOOK_WORKER` | Yes | Worker deploy webhook |
| `API_URL` | Yes | Production API URL |
| `STAGING_API_URL` | For staging | Staging API URL |
| `VERCEL_TOKEN` | Yes | Vercel auth token |
| `VERCEL_ORG_ID` | Yes | Vercel org/team ID |
| `VERCEL_PROJECT_ID_WEB` | Yes | Frontend project ID |
| `PRODUCTION_WEB_URL` | Yes | Production web URL |
| `STAGING_WEB_URL` | For staging | Staging web URL |
| `CODECOV_TOKEN` | Optional | Code coverage |
| `SENTRY_DSN` | Optional | Error tracking |

---

## Troubleshooting

### "Secret not found" error
- Check secret name matches exactly (case-sensitive)
- Verify secret is set at repository level (not environment)

### Database connection fails
- Check DATABASE_URL format: `postgresql://user:pass@host:5432/db`
- Verify database is running in Render
- Check firewall rules

### Deployment webhook fails
- Verify webhook URL is complete and correct
- Check Render service is not already deploying
- Ensure service has manual deploy enabled

### Vercel deployment fails
- Verify VERCEL_TOKEN is valid
- Check project IDs are correct
- Ensure build command is correct for monorepo

---

## Security Best Practices

1. **Never commit secrets** - Always use environment variables
2. **Rotate secrets regularly** - Change JWT secrets every 90 days
3. **Use strong secrets** - Minimum 32 characters, random
4. **Limit access** - Only give secrets to necessary services
5. **Audit regularly** - Review who has access to secrets
6. **Use separate secrets** - Different for dev/staging/production
7. **Monitor usage** - Set up alerts for unauthorized access

---

## Next Steps

After setup:
1. Test staging deployment: Push to `develop` branch
2. Test production deployment: Push to `main` branch (with approval)
3. Set up monitoring and alerts
4. Configure custom domains
5. Enable database backups
6. Set up error tracking (Sentry)

---

## Support

If you encounter issues:
1. Check [DEPLOYMENT.md](../DEPLOYMENT.md) for troubleshooting
2. Review Render/Vercel logs
3. Verify all secrets are set correctly
4. Ask in #engineering Slack channel
5. Create GitHub issue with logs
