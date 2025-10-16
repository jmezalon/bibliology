# Deployment Checklist

Use this checklist to deploy Bibliology to production. Check off each item as you complete it.

## Pre-Deployment

- [ ] All local tests passing (`pnpm test`)
- [ ] All CI checks passing on GitHub
- [ ] Latest changes committed and pushed to `main`
- [ ] Review DEPLOYMENT_SETUP.md and ENVIRONMENT_VARIABLES.md

## Step 1: Generate Production Secrets

- [ ] Run `./scripts/generate-secrets.sh`
- [ ] Save generated JWT secrets to password manager
- [ ] Keep terminal window open for copy/paste later

## Step 2: Set Up Render Database

- [ ] Create Render account at https://render.com
- [ ] Create PostgreSQL database (`bibliology-db`)
- [ ] **SAVE** Internal Database URL (for API/Worker)
- [ ] **SAVE** External Database URL (for migrations)
- [ ] Verify database is "Available" status

## Step 3: Set Up Render Redis

- [ ] Create Redis instance (`bibliology-redis`)
- [ ] **SAVE** Internal Redis URL
- [ ] Extract host, port, and password from URL
- [ ] Verify Redis is "Available" status

## Step 4: Set Up Storage (Choose One)

### Option A: Cloudflare R2 (Recommended)

- [ ] Create Cloudflare account
- [ ] Create R2 bucket (`bibliology-prod`)
- [ ] Create API token with R2 permissions
- [ ] **SAVE** endpoint, access key, secret key

### Option B: AWS S3

- [ ] Create AWS account
- [ ] Create S3 bucket (`bibliology-prod`)
- [ ] Create IAM user with S3 permissions
- [ ] **SAVE** access key and secret key

## Step 5: Deploy API to Render

- [ ] Create Web Service (`bibliology-api`)
- [ ] Connect GitHub repository: `jmezalon/bibliology`
- [ ] Set root directory: `apps/api`
- [ ] Set build command: `cd ../.. && pnpm install && pnpm --filter @bibliology/api build`
- [ ] Set start command: `cd ../.. && pnpm --filter @bibliology/api start:prod`
- [ ] Add ALL environment variables (see ENVIRONMENT_VARIABLES.md)
  - [ ] NODE_ENV=production
  - [ ] PORT=3000
  - [ ] API_PREFIX=api
  - [ ] DATABASE_URL (from Step 2)
  - [ ] REDIS_HOST (from Step 3)
  - [ ] REDIS_PORT (from Step 3)
  - [ ] REDIS_PASSWORD (from Step 3)
  - [ ] JWT_SECRET (from Step 1)
  - [ ] JWT_EXPIRES_IN=15m
  - [ ] JWT_REFRESH_SECRET (from Step 1)
  - [ ] JWT_REFRESH_EXPIRES_IN=7d
  - [ ] CORS_ORIGIN (temporary: `*`, will update later)
  - [ ] MAX_FILE_SIZE=52428800
  - [ ] UPLOAD_DEST=/tmp/uploads
  - [ ] S3_ENDPOINT (from Step 4)
  - [ ] S3_ACCESS_KEY_ID (from Step 4)
  - [ ] S3_SECRET_ACCESS_KEY (from Step 4)
  - [ ] S3_BUCKET=bibliology-prod
  - [ ] S3_REGION (your region or `auto` for R2)
  - [ ] THROTTLE_TTL=60
  - [ ] THROTTLE_LIMIT=100
  - [ ] PPTX_IMPORT_TIMEOUT=300000
  - [ ] LOG_LEVEL=info
- [ ] Click "Create Web Service"
- [ ] Wait for initial deployment
- [ ] **SAVE** API URL (e.g., `https://bibliology-api.onrender.com`)
- [ ] Go to Settings → Deploy Hook
- [ ] **SAVE** Deploy Hook URL as `RENDER_DEPLOY_HOOK_API`

## Step 6: Run Database Migrations

### Option A: Using External Database URL (Recommended)

```bash
cd /Users/mezalonm/Library/Mobile\ Documents/com~apple~CloudDocs/bibliology
DATABASE_URL="<External PostgreSQL URL>" pnpm --filter @bibliology/api db:migrate:deploy
DATABASE_URL="<External PostgreSQL URL>" pnpm --filter @bibliology/api db:seed
```

- [ ] Run migration command above
- [ ] Run seed command above
- [ ] Verify no errors

### Option B: Using Render Shell

```bash
render services link
render shell bibliology-api
cd ../..
DATABASE_URL="<Internal PostgreSQL URL>" pnpm --filter @bibliology/api db:migrate:deploy
```

- [ ] Install Render CLI if needed
- [ ] Run commands above
- [ ] Verify migrations completed

## Step 7: Verify API Deployment

- [ ] Visit `https://bibliology-api.onrender.com/health`
- [ ] Should return `{"status":"ok"}`
- [ ] Visit `https://bibliology-api.onrender.com/api/docs`
- [ ] Should show Swagger API documentation
- [ ] Check Render logs for any errors

## Step 8: Deploy Worker to Render

- [ ] Create Background Worker (`bibliology-worker`)
- [ ] Connect GitHub repository: `jmezalon/bibliology`
- [ ] Set root directory: `apps/worker`
- [ ] Set build command: `cd ../.. && pnpm install && pnpm --filter @bibliology/worker build`
- [ ] Set start command: `cd ../.. && pnpm --filter @bibliology/worker start:prod`
- [ ] Add ALL environment variables (same as API from Step 5)
- [ ] Click "Create Background Worker"
- [ ] Wait for initial deployment
- [ ] Go to Settings → Deploy Hook
- [ ] **SAVE** Deploy Hook URL as `RENDER_DEPLOY_HOOK_WORKER`

## Step 9: Deploy Frontend to Vercel

- [ ] Create Vercel account at https://vercel.com
- [ ] Import GitHub repository: `jmezalon/bibliology`
- [ ] Set framework: Vite
- [ ] Set root directory: `apps/web`
- [ ] Set build command: `cd ../.. && pnpm install && pnpm --filter @bibliology/web build`
- [ ] Set output directory: `dist`
- [ ] Add environment variables:
  - [ ] VITE_API_URL=`https://bibliology-api.onrender.com`
  - [ ] NODE_ENV=production
- [ ] Click "Deploy"
- [ ] Wait for deployment to complete
- [ ] **SAVE** Vercel production URL (e.g., `https://bibliology-xyz123.vercel.app`)

## Step 10: Get Vercel Token

- [ ] Go to https://vercel.com/account/tokens
- [ ] Click "Create Token"
- [ ] Name: `bibliology-github-actions`
- [ ] **SAVE** token as `VERCEL_TOKEN`

## Step 11: Update CORS Settings

- [ ] Go to Render → API Service → Environment
- [ ] Update `CORS_ORIGIN` to your Vercel URL
- [ ] Example: `CORS_ORIGIN=https://bibliology-xyz123.vercel.app`
- [ ] **IMPORTANT**: No trailing slash!
- [ ] Click "Save Changes" (will trigger redeploy)

## Step 12: Configure GitHub Secrets

Go to https://github.com/jmezalon/bibliology/settings/secrets/actions

- [ ] Add `RENDER_DEPLOY_HOOK_API` (from Step 5)
- [ ] Add `RENDER_DEPLOY_HOOK_WORKER` (from Step 8)
- [ ] Add `VERCEL_TOKEN` (from Step 10)
- [ ] Add `API_URL` = `https://bibliology-api.onrender.com`

## Step 13: Test Production Deployment

### Frontend Tests

- [ ] Visit your Vercel URL
- [ ] Homepage loads correctly
- [ ] CSS styles are applied
- [ ] Navigation works
- [ ] Click "Login" - should show login page
- [ ] Click "Register" - should show registration page

### Authentication Tests

- [ ] Register a new account (use real email)
- [ ] Should redirect to dashboard after registration
- [ ] Logout
- [ ] Login with registered account
- [ ] Should see dashboard

### API Tests

```bash
# Health check
curl https://bibliology-api.onrender.com/health

# Register (replace with your data)
curl -X POST https://bibliology-api.onrender.com/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123!","firstName":"Test","lastName":"User","role":"STUDENT"}'
```

- [ ] Health check returns `{"status":"ok"}`
- [ ] Can register via API
- [ ] Check Render logs for request logs

### Teacher Dashboard Tests (if applicable)

- [ ] Login as teacher account
- [ ] Can access `/teacher/dashboard`
- [ ] Can see "My Courses" page
- [ ] Coming Soon pages show for unimplemented features

## Step 14: Monitor Logs

- [ ] Check Render API logs for errors
- [ ] Check Render Worker logs for errors
- [ ] Check Vercel deployment logs
- [ ] No critical errors present

## Step 15: Enable Automatic Deployments

- [ ] Push a small change to `main` branch
- [ ] Verify GitHub Actions workflow runs
- [ ] Verify CI checks pass
- [ ] Verify deployment workflow runs
- [ ] Verify all services update automatically

## Post-Deployment (Optional)

### Custom Domain

- [ ] Purchase domain (if needed)
- [ ] Add domain to Vercel project
- [ ] Update DNS records
- [ ] Update `CORS_ORIGIN` in Render API
- [ ] Add GitHub Secret for custom domain

### Monitoring & Alerts

- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Configure email notifications in Render
- [ ] Set up uptime monitoring (UptimeRobot, etc.)
- [ ] Create status page (optional)

### Database Backups

- [ ] Enable automatic backups in Render PostgreSQL
- [ ] Test restore procedure
- [ ] Document backup schedule

### Security Hardening

- [ ] Review CORS settings (tighten if needed)
- [ ] Review rate limiting settings
- [ ] Enable 2FA on all accounts (GitHub, Render, Vercel)
- [ ] Audit environment variables for leaks
- [ ] Schedule secret rotation (90 days)

### Performance Optimization

- [ ] Configure CDN for static assets
- [ ] Enable Redis caching
- [ ] Review database query performance
- [ ] Set up performance monitoring

## Troubleshooting

### API Won't Start

1. Check Render logs for error messages
2. Verify all environment variables are set
3. Verify DATABASE_URL is correct (Internal URL)
4. Verify JWT secrets are not default values
5. Check PostgreSQL database is "Available"

### Frontend Can't Connect to API

1. Check VITE_API_URL in Vercel
2. Check CORS_ORIGIN in Render API
3. Verify API health check works
4. Check browser console for CORS errors
5. Ensure no trailing slashes in URLs

### Database Migration Errors

1. Use External Database URL for migrations
2. Check Render logs for specific error
3. Verify database connection works
4. Try running migrations manually via Render Shell

### Worker Not Processing Jobs

1. Check Worker logs in Render
2. Verify Redis connection settings
3. Ensure Worker has same environment as API
4. Check queue visibility in Redis

## Success Criteria

All of the following should be true:

- ✅ API health check returns 200 OK
- ✅ API docs page loads
- ✅ Frontend loads without errors
- ✅ Can register new account
- ✅ Can login successfully
- ✅ Can access protected routes
- ✅ CSS styles are applied correctly
- ✅ No errors in Render logs
- ✅ No errors in Vercel logs
- ✅ GitHub Actions workflows passing
- ✅ Coming Soon pages work for unimplemented features

## Rollback Plan

If deployment fails:

1. Check GitHub Actions logs for errors
2. Review Render deployment logs
3. Review Vercel deployment logs
4. If needed, revert to previous commit:
   ```bash
   git revert HEAD
   git push origin main
   ```
5. Wait for automatic redeploy
6. Verify rollback successful

## Next Steps After Successful Deployment

1. Share production URL with stakeholders
2. Begin user acceptance testing
3. Gather feedback
4. Plan next feature sprint
5. Monitor performance and errors
6. Scale resources as needed

## Support

If you encounter issues:

- Check the logs first (Render, Vercel, GitHub Actions)
- Review DEPLOYMENT_SETUP.md for detailed instructions
- Review ENVIRONMENT_VARIABLES.md for configuration reference
- Check Render docs: https://render.com/docs
- Check Vercel docs: https://vercel.com/docs

---

**Remember**: Never commit secrets to git, and always test thoroughly before going to production!
