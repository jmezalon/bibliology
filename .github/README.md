# GitHub Actions Workflows

This directory contains CI/CD workflows for the Bibliology project.

## Workflows

### CI (ci.yml)
Runs on every push and pull request to `main` and `develop` branches.

**Jobs:**
- **lint**: ESLint, TypeScript type checking, Prettier format checking
- **test**: Unit and integration tests with PostgreSQL and Redis services
- **build**: Build all apps and check bundle sizes
- **security**: Security audit and dependency checks

### Deploy (deploy.yml)
Runs on every push to `main` branch (production deployments).

**Jobs:**
- **deploy-api**: Deploy NestJS API to Render
- **deploy-web**: Deploy React frontend to Vercel
- **deploy-worker**: Deploy BullMQ worker to Render
- **notify**: Send deployment status notification

## Required Secrets

Configure these secrets in GitHub repository settings:

### Render Deployment
- `RENDER_DEPLOY_HOOK_API`: Render deploy hook URL for API service
- `RENDER_DEPLOY_HOOK_WORKER`: Render deploy hook URL for worker service
- `API_URL`: Production API URL (e.g., https://bibliology-api.onrender.com)

### Vercel Deployment
- `VERCEL_TOKEN`: Vercel authentication token
- `VERCEL_ORG_ID`: Vercel organization ID (auto-pulled)
- `VERCEL_PROJECT_ID`: Vercel project ID (auto-pulled)

### Testing
- `CODECOV_TOKEN`: Codecov token for coverage reports (optional)

## Environment Variables

The deployment workflow injects these environment variables:

**Frontend (apps/web):**
- `VITE_API_URL`: Backend API URL

**Backend (apps/api):**
- Set via Render dashboard:
  - `DATABASE_URL`
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `JWT_SECRET`
  - `AWS_*` (S3 credentials)

**Worker (apps/worker):**
- Set via Render dashboard:
  - `REDIS_HOST`
  - `REDIS_PORT`
  - `DATABASE_URL`

## Local Testing

Test workflows locally using [act](https://github.com/nektos/act):

```bash
# Install act
brew install act

# Run CI workflow
act pull_request

# Run specific job
act -j lint
```

## Concurrency Controls

Both workflows use concurrency groups to:
- **CI**: Cancel in-progress runs when new commits are pushed
- **Deploy**: Prevent concurrent deployments (queue them instead)
