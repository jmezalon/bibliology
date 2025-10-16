# Deployment Guide

This comprehensive guide covers the complete deployment process for the Bibliology project, including setup, deployment procedures, monitoring, and rollback strategies.

## Table of Contents

- [Overview](#overview)
- [Hosting Recommendations](#hosting-recommendations)
- [Environment Setup](#environment-setup)
- [GitHub Secrets Configuration](#github-secrets-configuration)
- [Deployment Process](#deployment-process)
- [Database Migrations](#database-migrations)
- [Monitoring](#monitoring)
- [Rollback Procedures](#rollback-procedures)
- [Troubleshooting](#troubleshooting)

---

## Overview

### Architecture

- **Frontend:** React + Vite (deployed to Vercel)
- **Backend:** NestJS API (deployed to Render)
- **Database:** PostgreSQL (hosted on Render)
- **Cache:** Redis (hosted on Render)
- **Worker:** Background job processor (deployed to Render)
- **CI/CD:** GitHub Actions

### Environments

1. **Development** - Local development environment
2. **Staging** - Pre-production testing (deploys from `develop` branch)
3. **Production** - Live environment (deploys from `main` branch)

---

## Hosting Recommendations

### Frontend Hosting

**Recommended: Vercel**

**Pros:**

- Automatic preview deployments for PRs
- Instant rollbacks
- Global CDN with edge caching
- Zero-config deployment for Vite/React
- Excellent DX with GitHub integration
- Free tier suitable for small projects
- Built-in analytics

**Cons:**

- Can get expensive with high bandwidth
- Limited control over infrastructure

**Alternatives:**

- **Netlify:** Similar to Vercel, good alternative
- **Cloudflare Pages:** Great performance, generous free tier
- **AWS Amplify:** Good if already on AWS

**Cost:** Free tier includes:

- 100 GB bandwidth/month
- Unlimited deployments
- Automatic SSL

---

### Backend Hosting

**Recommended: Render**

**Pros:**

- Simple deployment (Docker or native builds)
- Managed PostgreSQL and Redis
- Auto-scaling
- Preview environments
- Health checks and auto-restart
- Fair pricing for small projects
- Zero DevOps overhead

**Cons:**

- Can be slower than VPS
- Limited customization
- Cold starts on free tier

**Cost:**

- **Starter Plan:** $7/month per service
- **Database:** $7/month (1 GB storage)
- **Redis:** $10/month
- **Total:** ~$30-40/month for production

**Alternatives:**

1. **Railway** ($5-20/month)
   - Pros: Simple, good DX, usage-based pricing
   - Cons: Can get expensive with scale

2. **Fly.io** ($0-20/month)
   - Pros: Edge computing, great for global deployment
   - Cons: Steeper learning curve

3. **DigitalOcean App Platform** ($5-12/month)
   - Pros: Predictable pricing, good performance
   - Cons: Less automated than Render

4. **AWS Elastic Beanstalk/ECS** (Variable)
   - Pros: Scalable, full control
   - Cons: Complex setup, expensive

---

## Environment Setup

### Local Development

1. **Copy environment files:**

```bash
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
```

2. **Configure local environment:**

```env
# apps/api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/bibliology
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=local-dev-secret-change-me
JWT_REFRESH_SECRET=local-dev-refresh-secret-change-me
CORS_ORIGIN=http://localhost:5173
```

```env
# apps/web/.env
VITE_API_URL=http://localhost:3000/api
VITE_ENV=development
```

3. **Start local services:**

```bash
# Start PostgreSQL and Redis
docker-compose up -d

# Install dependencies
pnpm install

# Generate Prisma Client
pnpm db:generate

# Run migrations
pnpm db:migrate:dev

# Seed database (optional)
pnpm db:seed

# Start development servers
pnpm dev
```

---

### Staging Environment

Staging automatically deploys from the `develop` branch.

**Required Environment Variables:**

```env
# Backend (Render)
NODE_ENV=production
DATABASE_URL=<staging-db-url>
REDIS_HOST=<staging-redis-host>
REDIS_PORT=6379
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
CORS_ORIGIN=https://staging.bibliology.com
API_PREFIX=api
MAX_FILE_SIZE=52428800
THROTTLE_TTL=60
THROTTLE_LIMIT=100
```

```env
# Frontend (Vercel)
VITE_API_URL=https://staging-api.bibliology.com/api
VITE_ENV=staging
VITE_APP_NAME=Bibliology
VITE_ENABLE_ANALYTICS=false
VITE_ENABLE_ERROR_REPORTING=true
```

---

### Production Environment

Production deploys from the `main` branch with manual approval.

**Required Environment Variables:**

```env
# Backend (Render)
NODE_ENV=production
DATABASE_URL=<production-db-url>
REDIS_HOST=<production-redis-host>
REDIS_PORT=6379
JWT_SECRET=<strong-random-secret>
JWT_REFRESH_SECRET=<strong-random-secret>
CORS_ORIGIN=https://bibliology.com
API_PREFIX=api
MAX_FILE_SIZE=52428800
THROTTLE_TTL=60
THROTTLE_LIMIT=100

# Optional: S3/R2 for file storage
S3_ENDPOINT=<s3-endpoint>
S3_ACCESS_KEY_ID=<access-key>
S3_SECRET_ACCESS_KEY=<secret-key>
S3_BUCKET=bibliology-prod
S3_REGION=us-east-1

# Optional: Error tracking
SENTRY_DSN=<sentry-dsn>
```

```env
# Frontend (Vercel)
VITE_API_URL=https://api.bibliology.com/api
VITE_ENV=production
VITE_APP_NAME=Bibliology
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_ERROR_REPORTING=true

# Optional: Analytics
VITE_GA_TRACKING_ID=<google-analytics-id>
```

---

## GitHub Secrets Configuration

### Required Secrets

Navigate to GitHub repository → Settings → Secrets and variables → Actions

#### Database & Infrastructure

```
DATABASE_URL                    # Production PostgreSQL connection string
STAGING_DATABASE_URL            # Staging PostgreSQL connection string
```

#### API Keys & Auth

```
JWT_SECRET                      # Production JWT secret (256-bit random)
JWT_REFRESH_SECRET              # Production JWT refresh secret (256-bit random)
```

#### Render Deployment

```
RENDER_DEPLOY_HOOK_API          # Production API deploy webhook
RENDER_DEPLOY_HOOK_API_STAGING  # Staging API deploy webhook
RENDER_DEPLOY_HOOK_WORKER       # Production worker deploy webhook
API_URL                         # Production API URL (e.g., https://api.bibliology.com)
STAGING_API_URL                 # Staging API URL
```

#### Vercel Deployment

```
VERCEL_TOKEN                    # Vercel authentication token
VERCEL_ORG_ID                   # Vercel organization ID
VERCEL_PROJECT_ID_WEB           # Vercel project ID for frontend
PRODUCTION_WEB_URL              # Production web URL (e.g., https://bibliology.com)
STAGING_WEB_URL                 # Staging web URL
```

#### Optional (Monitoring & Analytics)

```
CODECOV_TOKEN                   # Code coverage reporting
SENTRY_DSN                      # Error tracking
SLACK_WEBHOOK_URL               # Deployment notifications
```

### Generating Secrets

**JWT Secrets:**

```bash
# Generate secure random secrets
openssl rand -base64 64
```

**Vercel Token:**

1. Visit https://vercel.com/account/tokens
2. Create new token with deployment permissions
3. Copy token to GitHub secrets

**Render Deploy Hooks:**

1. Visit Render dashboard → Service → Settings
2. Scroll to "Deploy Hooks"
3. Create hook and copy URL

**Vercel Project IDs:**

```bash
cd apps/web
vercel link
# Check .vercel/project.json for IDs
```

---

## Deployment Process

### Automatic Deployments

#### Pull Request (Preview)

1. Open PR → Automatic checks run
2. Preview deployment created (Vercel)
3. Status posted in PR comments
4. Updates on each commit

#### Staging (develop branch)

1. Merge PR to `develop`
2. CI/CD runs all tests
3. Auto-deploy to staging
4. Health checks verify deployment
5. Notification sent

#### Production (main branch)

1. Merge PR to `main`
2. Full CI/CD pipeline runs
3. **Manual approval required** (GitHub environment)
4. Database backup triggered
5. Migrations run
6. API deployed to Render
7. Frontend deployed to Vercel
8. Worker deployed
9. Post-deployment health checks
10. 30-minute monitoring window
11. Deployment tag created
12. Success notification

### Manual Deployment

**Deploy to Production (Manual):**

```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select "production" environment
5. Confirm and run
```

**Deploy to Staging (Manual):**

```bash
# Via GitHub UI
1. Go to Actions tab
2. Select "CI/CD Pipeline"
3. Click "Run workflow"
4. Select "staging" environment
5. Run
```

---

## Database Migrations

### Migration Safety Rules

1. Always test migrations in staging first
2. Migrations should be reversible
3. Never delete columns without deprecation period
4. Backup before running migrations
5. Use transactions where possible

### Creating a Migration

```bash
# Create new migration
cd apps/api
pnpm db:migrate:dev --name add_lesson_builder_tables

# Review generated migration
ls prisma/migrations

# Test migration
pnpm db:migrate:dev

# Test rollback (if supported)
# Check migration can be safely reversed
```

### Running Migrations in CI/CD

Migrations run automatically during deployment:

```yaml
# In GitHub Actions
- name: Run database migrations
  run: |
    cd apps/api
    pnpm db:generate
    pnpm db:migrate  # Runs prisma migrate deploy
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
```

### Manual Migration Deployment

**Production (with caution):**

```bash
# Connect to production database
export DATABASE_URL="<production-db-url>"

# Check migration status
cd apps/api
npx prisma migrate status

# Deploy pending migrations
pnpm db:migrate

# Verify
npx prisma migrate status
```

### Migration Rollback

If a migration fails:

```bash
# Mark migration as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Or restore from backup
# See rollback procedures below
```

---

## Monitoring

### Health Check Endpoints

**API Health Check:**

```bash
curl https://api.bibliology.com/health
```

Expected response:

```json
{
  "status": "ok",
  "timestamp": "2025-10-16T10:30:00.000Z",
  "database": "connected"
}
```

**Frontend Health:**

```bash
curl https://bibliology.com
# Should return 200 OK
```

### Key Metrics to Monitor

1. **API Response Times**
   - p50 (median): < 200ms
   - p95: < 500ms
   - p99: < 1000ms

2. **Error Rates**
   - 4xx errors: < 5%
   - 5xx errors: < 1%

3. **Database**
   - Connection pool usage
   - Query performance
   - Disk space

4. **System Resources**
   - CPU usage < 80%
   - Memory usage < 85%
   - Disk usage < 80%

### Setting Up Monitoring

**Render (Built-in):**

- Navigate to service → Metrics
- Monitor CPU, memory, and response times
- Set up alerts for critical thresholds

**Recommended Tools:**

1. **Sentry (Error Tracking)** - Free tier available

   ```bash
   # Install
   pnpm add @sentry/node @sentry/react

   # Configure in apps/api/src/main.ts and apps/web/src/main.tsx
   ```

2. **BetterStack/LogTail (Logging)** - $5/month
   - Centralized log aggregation
   - Search and filtering
   - Alerts

3. **Render Metrics (Basic)** - Included
   - Response times
   - Error rates
   - Resource usage

### Alerts Configuration

**Critical Alerts (immediate):**

- API health check fails
- Database connection lost
- 5xx error rate > 5%
- Deployment failure

**Warning Alerts (business hours):**

- 4xx error rate > 10%
- API response time > 2s
- High CPU/memory usage
- Disk space < 20%

---

## Rollback Procedures

### Frontend Rollback (Vercel)

**Method 1: Vercel Dashboard (Instant)**

1. Visit Vercel dashboard
2. Select project
3. Go to Deployments
4. Find previous working deployment
5. Click "..." → "Promote to Production"
6. Confirm

**Method 2: Vercel CLI**

```bash
# List recent deployments
vercel ls

# Rollback to specific deployment
vercel rollback <deployment-url>
```

**Time to rollback:** < 1 minute

---

### Backend Rollback (Render)

**Method 1: Render Dashboard**

1. Visit Render dashboard
2. Select service
3. Go to "Events" tab
4. Find previous successful deploy
5. Click "Rollback to this deploy"
6. Confirm

**Method 2: Redeploy Previous Commit**

```bash
# Find working commit
git log --oneline

# Create rollback branch
git checkout -b rollback-to-<commit>
git reset --hard <working-commit-hash>
git push origin rollback-to-<commit> --force

# Trigger deployment from Render dashboard
```

**Time to rollback:** 3-5 minutes

---

### Database Rollback

**Scenario 1: Migration Failed**

```bash
cd apps/api

# Mark as rolled back
npx prisma migrate resolve --rolled-back <migration-name>

# Deploy previous working state
npx prisma migrate deploy
```

**Scenario 2: Need to Restore Data**

**From Render Backup:**

1. Go to Render → Database → Backups
2. Select backup point
3. Click "Restore"
4. Confirm (creates new database)
5. Update DATABASE_URL in services

**From Manual Backup:**

```bash
# Restore from pg_dump
pg_restore -d <database-url> backup.sql

# Or from SQL dump
psql <database-url> < backup.sql
```

**Time to rollback:** 10-30 minutes (depending on database size)

---

### Worker Rollback

Same process as backend rollback (Render dashboard or redeploy).

---

### Complete System Rollback

If deployment is completely broken:

```bash
# 1. Rollback frontend (Vercel) - 1 min
vercel rollback <previous-deployment>

# 2. Rollback backend (Render) - 5 min
# Use Render dashboard to rollback

# 3. Rollback database migrations (if needed) - 10 min
npx prisma migrate resolve --rolled-back <migration>

# 4. Rollback worker (Render) - 5 min
# Use Render dashboard

# Total time: 15-20 minutes
```

---

## Troubleshooting

### Common Issues

#### 1. Build Failures

**Symptom:** CI/CD build fails

**Causes:**

- TypeScript errors
- Missing dependencies
- Prisma schema issues

**Solution:**

```bash
# Test locally first
pnpm install
pnpm typecheck
pnpm build

# Check Prisma
pnpm db:generate
```

---

#### 2. Database Connection Errors

**Symptom:** API returns 500 errors, health check shows "disconnected"

**Causes:**

- Wrong DATABASE_URL
- Database down
- Connection pool exhausted
- Firewall/network issues

**Solution:**

```bash
# Test connection
psql $DATABASE_URL -c "SELECT 1"

# Check Render database status
# Dashboard → Database → Status

# Restart API service
# Dashboard → Service → Manual Deploy
```

---

#### 3. Migration Failures

**Symptom:** Migration fails during deployment

**Causes:**

- Schema conflicts
- Data integrity issues
- Syntax errors

**Solution:**

```bash
# Check migration status
npx prisma migrate status

# Mark as failed and fix
npx prisma migrate resolve --rolled-back <migration>

# Create corrective migration
pnpm db:migrate:dev --name fix_previous_migration
```

---

#### 4. Frontend Not Loading

**Symptom:** White screen or 404 errors

**Causes:**

- API_URL misconfigured
- CORS issues
- JavaScript errors

**Solution:**

```bash
# Check environment variables in Vercel
vercel env ls

# Check browser console for errors

# Verify API is accessible
curl https://api.bibliology.com/health

# Check CORS_ORIGIN on backend
```

---

#### 5. High API Response Times

**Symptom:** Slow API responses, timeouts

**Causes:**

- Unoptimized queries
- Missing indexes
- High load

**Solution:**

```bash
# Check slow queries in Render logs
# Dashboard → Service → Logs

# Add indexes if needed (create migration)
# Check database performance in Render
# Dashboard → Database → Metrics

# Scale up service if needed
# Dashboard → Service → Settings → Instance Type
```

---

#### 6. Authentication Issues

**Symptom:** JWT errors, unable to login

**Causes:**

- JWT secrets mismatch
- Token expiration
- Cookie issues

**Solution:**

```bash
# Verify JWT secrets are set
# GitHub → Settings → Secrets

# Check API logs for JWT errors
# Render → Service → Logs

# Clear browser cookies and retry
```

---

## Pre-Deployment Checklist

Before deploying to production:

- [ ] All tests passing locally
- [ ] Migrations tested in staging
- [ ] Environment variables updated
- [ ] Database backup confirmed
- [ ] Changelog/release notes prepared
- [ ] Stakeholders notified
- [ ] Rollback plan ready
- [ ] Monitoring alerts active
- [ ] Documentation updated

---

## Post-Deployment Checklist

After deploying to production:

- [ ] Health checks passing
- [ ] Critical user flows tested
- [ ] No spike in errors (Sentry)
- [ ] API response times normal
- [ ] Database queries performing well
- [ ] Frontend loading correctly
- [ ] Monitor for 30 minutes
- [ ] Create deployment tag
- [ ] Notify team of success
- [ ] Update status page (if applicable)

---

## Getting Help

**Critical Production Issues:**

1. Check #incidents Slack channel
2. Review recent deployments
3. Check Render/Vercel status pages
4. Contact on-call engineer

**Non-Critical Issues:**

1. Check this documentation
2. Review logs in Render/Vercel
3. Ask in #engineering Slack channel
4. Create GitHub issue if needed

---

## Additional Resources

- [Render Documentation](https://render.com/docs)
- [Vercel Documentation](https://vercel.com/docs)
- [Prisma Migrations Guide](https://www.prisma.io/docs/concepts/components/prisma-migrate)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [NestJS Deployment](https://docs.nestjs.com/faq/deployment)

---

Last Updated: 2025-10-16
