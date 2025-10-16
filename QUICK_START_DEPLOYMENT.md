# Quick Start: Deploy Bibliology in 60 Minutes

This is a streamlined guide to get your CI/CD pipeline up and running. For detailed information, see [DEPLOYMENT.md](./DEPLOYMENT.md).

## Prerequisites

- [x] GitHub repository with admin access
- [x] Credit card for Render (first month free with promo codes)
- [ ] 60 minutes of uninterrupted time

---

## Step 1: Create Render Account (10 min)

1. **Sign up:** https://render.com
2. **Connect GitHub:** Authorize Render to access your repository
3. **Apply promo code** (if available): Gets you $100 credit

---

## Step 2: Create Database & Cache (10 min)

### PostgreSQL Database

1. Dashboard → **New** → **PostgreSQL**
2. Settings:
   - Name: `bibliology-db`
   - Database: `bibliology`
   - Region: **Oregon** (or closest to users)
   - Plan: **Starter** ($7/month, first month free)
3. Click **Create Database**
4. **Save these values:**
   ```
   Internal Database URL: postgresql://...
   (This is your DATABASE_URL)
   ```

### Redis Cache

1. Dashboard → **New** → **Redis**
2. Settings:
   - Name: `bibliology-redis`
   - Region: **Oregon** (same as database)
   - Plan: **Starter** ($10/month)
3. Click **Create Redis**
4. **Save Redis hostname**

---

## Step 3: Create API Service (10 min)

1. Dashboard → **New** → **Web Service**
2. Select your GitHub repository
3. Settings:
   - Name: `bibliology-api`
   - Region: **Oregon**
   - Branch: `main`
   - Root Directory: *(leave empty)*
   - Runtime: **Docker**
   - Dockerfile Path: `./apps/api/Dockerfile`
   - Docker Context: `.`
   - Plan: **Starter** ($7/month)
   - **Auto-Deploy: OFF** (we'll use GitHub Actions)

4. **Environment Variables** (click "Advanced"):
   ```bash
   NODE_ENV=production
   PORT=3000
   API_PREFIX=api

   # Link database (use dropdown)
   DATABASE_URL=${bibliology-db.DATABASE_URL}

   # Link Redis (use dropdown)
   REDIS_HOST=${bibliology-redis.REDIS_INTERNAL_HOST}
   REDIS_PORT=6379

   # Generate these (see below)
   JWT_SECRET=<paste-here>
   JWT_REFRESH_SECRET=<paste-here>
   JWT_EXPIRES_IN=15m
   JWT_REFRESH_EXPIRES_IN=7d

   # Update after Vercel setup
   CORS_ORIGIN=https://bibliology.vercel.app

   # Defaults
   MAX_FILE_SIZE=52428800
   THROTTLE_TTL=60
   THROTTLE_LIMIT=100
   ```

5. Click **Create Web Service**
6. **Get Deploy Hook:**
   - Service Settings → Deploy Hook → Create
   - **Save URL** (for GitHub secrets)

### Generate JWT Secrets

In your terminal:
```bash
# JWT_SECRET
openssl rand -base64 64

# JWT_REFRESH_SECRET
openssl rand -base64 64
```

Copy these values to Render environment variables.

---

## Step 4: Create Vercel Account (10 min)

1. **Sign up:** https://vercel.com (use GitHub login)
2. **Import Project:**
   - Dashboard → **Add New...** → **Project**
   - Select your repository
   - Framework: **Vite**
   - Root Directory: `apps/web`
   - Build Command: `cd ../.. && pnpm install && pnpm --filter @bibliology/web build`
   - Output Directory: `dist`
   - Install Command: `cd ../.. && pnpm install`

3. **Environment Variables:**
   ```bash
   VITE_API_URL=https://bibliology-api.onrender.com/api
   VITE_APP_NAME=Bibliology
   VITE_ENV=production
   ```
   (Update API URL with your Render URL)

4. Click **Deploy**

5. **Get Vercel Token:**
   - Account Settings → Tokens → Create
   - Name: "GitHub Actions"
   - **Save token** (shown only once)

6. **Get Project IDs:**
   ```bash
   cd apps/web
   vercel link
   # Follow prompts
   cat .vercel/project.json
   # Copy orgId and projectId
   ```

---

## Step 5: Configure GitHub Secrets (15 min)

GitHub → Repository → **Settings** → **Secrets and variables** → **Actions**

Click **New repository secret** for each:

```bash
# Database
DATABASE_URL=<from Render PostgreSQL>

# Authentication (same as Render)
JWT_SECRET=<your-generated-secret>
JWT_REFRESH_SECRET=<your-generated-secret>

# Render Deployment
RENDER_DEPLOY_HOOK_API=<from Render API service>
API_URL=https://bibliology-api.onrender.com

# Vercel Deployment
VERCEL_TOKEN=<from Vercel account settings>
VERCEL_ORG_ID=<from .vercel/project.json>
VERCEL_PROJECT_ID_WEB=<from .vercel/project.json>
PRODUCTION_WEB_URL=https://bibliology.vercel.app

# Optional (set later)
RENDER_DEPLOY_HOOK_WORKER=<if using worker>
STAGING_DATABASE_URL=<if using staging>
STAGING_API_URL=<if using staging>
```

### Secret Checklist

- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] JWT_REFRESH_SECRET
- [ ] RENDER_DEPLOY_HOOK_API
- [ ] API_URL
- [ ] VERCEL_TOKEN
- [ ] VERCEL_ORG_ID
- [ ] VERCEL_PROJECT_ID_WEB
- [ ] PRODUCTION_WEB_URL

---

## Step 6: First Deployment (5 min)

### Update CORS in Render

1. Go to Render → API Service → Environment
2. Update `CORS_ORIGIN` to your Vercel URL
3. **Manual Deploy** → Deploy latest commit

### Test Deployment

1. **Push to main branch:**
   ```bash
   git add .
   git commit -m "ci: Configure CI/CD pipeline"
   git push origin main
   ```

2. **Monitor GitHub Actions:**
   - GitHub → Actions tab
   - Watch CI/CD pipeline run
   - **Approve production deployment** when prompted

3. **Verify Deployment:**
   ```bash
   # Test API health
   curl https://your-api-url.onrender.com/health

   # Should return:
   # {"status":"ok","database":"connected"}

   # Visit your Vercel URL
   open https://your-app.vercel.app
   ```

---

## Step 7: Enable Branch Protection (5 min)

1. GitHub → **Settings** → **Branches**
2. **Add rule** for `main`:
   - Branch name pattern: `main`
   - ✅ Require pull request reviews before merging
   - ✅ Require status checks to pass:
     - `quality`
     - `test-unit`
     - `build`
   - ✅ Require branches to be up to date
3. **Save changes**

---

## Verification Checklist

Your deployment is successful when:

- [ ] API health check returns `{"status":"ok"}`
- [ ] Frontend loads at Vercel URL
- [ ] Frontend can connect to API
- [ ] GitHub Actions CI/CD workflow passes
- [ ] Branch protection is enabled
- [ ] Deploy hook triggers work

---

## Next Steps

### Set Up Staging (Optional but Recommended)

1. Create staging database on Render
2. Create staging API service
3. Add staging secrets to GitHub
4. Create `develop` branch

### Set Up Monitoring

1. **BetterUptime** (free tier):
   - https://betteruptime.com
   - Add health check monitor
   - Configure email alerts

2. **Sentry** (free tier):
   - https://sentry.io
   - Create project
   - Add DSN to environment variables

### Configure Custom Domain (Optional)

**Vercel:**
1. Dashboard → Project → Settings → Domains
2. Add your domain (e.g., bibliology.com)
3. Configure DNS (automatic)

**Render:**
1. Service → Settings → Custom Domain
2. Add your API domain (e.g., api.bibliology.com)
3. Configure DNS records

---

## Common Issues

### "Health check failed"

**Cause:** Database connection issue

**Fix:**
1. Verify `DATABASE_URL` is correct in Render
2. Check database is running
3. Restart API service

---

### "Build failed: Prisma error"

**Cause:** Missing Prisma Client

**Fix:**
```bash
cd apps/api
pnpm db:generate
git add prisma/
git commit -m "chore: Update Prisma client"
git push
```

---

### "Vercel deployment failed"

**Cause:** Token or project ID mismatch

**Fix:**
1. Regenerate Vercel token
2. Run `vercel link` to get correct IDs
3. Update GitHub secrets

---

### "CORS error in browser"

**Cause:** Wrong CORS_ORIGIN in Render

**Fix:**
1. Render → Service → Environment
2. Update `CORS_ORIGIN` to match Vercel URL
3. Manual Deploy

---

## Testing Your Deployment

### Test CI Pipeline

```bash
# Create test branch
git checkout -b test/ci-pipeline

# Make change
echo "# Test" >> TEST.md
git add TEST.md
git commit -m "test: Verify CI works"

# Push and create PR
git push origin test/ci-pipeline

# On GitHub:
# - Open PR
# - Verify CI runs
# - Check preview deployment
# - Merge to main
# - Approve production deployment
```

### Test Rollback

1. Deploy a change to production
2. In Vercel dashboard:
   - Deployments → Previous → Promote to Production
3. Verify rollback works (< 1 minute)

---

## Cost Summary

**Monthly Costs:**
- Render API: $7
- Render Database: $7
- Render Redis: $10
- Vercel: $0 (free tier)
- **Total: ~$24/month**

**First month:** ~$10 with promo credits

---

## Support

**Issues?**
1. Check [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed troubleshooting
2. Review logs in Render/Vercel dashboards
3. Check GitHub Actions logs
4. Create GitHub issue with logs

---

## Success! 🎉

You now have:
- ✅ Automated CI/CD pipeline
- ✅ Production-ready deployment
- ✅ Health monitoring
- ✅ Rollback capability
- ✅ Preview deployments for PRs

**Time to deploy with confidence!**

---

**For detailed documentation:**
- [Complete Deployment Guide](./DEPLOYMENT.md)
- [Secrets Setup Guide](./.github/SETUP_SECRETS.md)
- [Monitoring Guide](./MONITORING.md)
- [CI/CD Overview](./.github/CI_CD_README.md)
