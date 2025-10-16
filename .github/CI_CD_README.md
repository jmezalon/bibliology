# CI/CD Documentation

Welcome to the Bibliology CI/CD system. This directory contains all GitHub Actions workflows for automated testing, building, and deployment.

## Quick Links

- [Deployment Guide](../DEPLOYMENT.md) - Complete deployment procedures
- [Setup Secrets](./SETUP_SECRETS.md) - Configure GitHub secrets
- [Monitoring Guide](../MONITORING.md) - Monitoring and alerting

---

## Workflows Overview

### 1. CI/CD Pipeline (`.github/workflows/ci-cd.yml`)

**Main deployment workflow** - Handles testing, building, and deployment to staging/production.

**Triggers:**

- Push to `main` or `develop`
- Pull requests to `main` or `develop`
- Manual workflow dispatch

**Jobs:**

```
quality → Linting, type checking, formatting
security → Security audit, secret scanning
test-unit → Unit tests on Node 18 & 20
build → Build all packages, verify artifacts
test-e2e → E2E tests (on main only)
migration-check → Validate migrations (PRs only)
deploy-staging → Deploy to staging (develop branch)
deploy-production → Deploy to production (main branch, manual approval)
```

**Usage:**

```bash
# Automatic on PR
git checkout -b feature/new-feature
git push origin feature/new-feature
# Opens PR → CI runs automatically

# Deploy to staging
git push origin develop

# Deploy to production
git push origin main
# Requires manual approval in GitHub Actions UI
```

---

### 2. Preview Deployment (`.github/workflows/preview-deploy.yml`)

**PR preview deployments** - Creates preview deployment for every PR.

**Triggers:**

- Pull request opened/updated

**Features:**

- Automatic preview URL in PR comments
- Uses staging API endpoint
- Updates on each commit
- Auto-cleaned up when PR closes

---

### 3. Cleanup (`.github/workflows/cleanup.yml`)

**Maintenance workflow** - Cleans up old artifacts and branches.

**Triggers:**

- PR closed (branch cleanup)
- Weekly schedule (Sunday 2 AM UTC)
- Manual dispatch

---

## Environment Configuration

### Development (Local)

- Database: Local PostgreSQL
- API: localhost:3000
- Web: localhost:5173

### Staging

- Deploys from: `develop` branch
- Database: Render PostgreSQL (staging)
- API: Render (staging service)
- Web: Vercel (preview)
- Approval: Automatic

### Production

- Deploys from: `main` branch
- Database: Render PostgreSQL (production)
- API: Render (production service)
- Web: Vercel (production)
- Approval: **Manual required**

---

## Required GitHub Secrets

See [SETUP_SECRETS.md](./SETUP_SECRETS.md) for detailed setup.

**Essential:**

- `DATABASE_URL` - Production database
- `JWT_SECRET` - JWT signing key
- `RENDER_DEPLOY_HOOK_API` - API deployment
- `VERCEL_TOKEN` - Vercel auth
- `VERCEL_ORG_ID` - Vercel organization
- `VERCEL_PROJECT_ID_WEB` - Frontend project
- `API_URL` - Production API URL

---

## Quick Commands

**Deploy to Staging:**

```bash
git push origin develop
```

**Deploy to Production:**

```bash
git push origin main
# Then approve in GitHub Actions UI
```

**Manual Deployment:**

1. GitHub → Actions → CI/CD Pipeline
2. Run workflow → Select environment
3. Approve if production

---

## Rollback

**Frontend:** Vercel Dashboard → Deployments → Promote previous

**Backend:** Render Dashboard → Events → Rollback

**Detailed:** See [DEPLOYMENT.md](../DEPLOYMENT.md#rollback-procedures)

---

## Health Checks

**API:** `curl https://api.bibliology.com/health`

**Expected:** `{"status":"ok","database":"connected"}`

---

## Support

1. Check documentation (this file, DEPLOYMENT.md, MONITORING.md)
2. Review logs (GitHub Actions, Render, Vercel)
3. Ask in #engineering Slack
4. Create GitHub issue

---

**Status:** ✅ Production Ready | **Last Updated:** 2025-10-16
