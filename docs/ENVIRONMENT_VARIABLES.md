# Environment Variables Reference

This document provides a complete reference for all environment variables used in the Bibliology application.

## Quick Start

### Generate Production Secrets

Run the helper script to generate secure JWT secrets:

```bash
./scripts/generate-secrets.sh
```

Copy the output to your Render environment variables.

## API/Worker Environment Variables

These variables should be set identically on both the API and Worker services in Render.

### Server Configuration

| Variable     | Description       | Development   | Production   |
| ------------ | ----------------- | ------------- | ------------ |
| `NODE_ENV`   | Environment mode  | `development` | `production` |
| `PORT`       | Server port       | `3000`        | `3000`       |
| `API_PREFIX` | API route prefix  | `api`         | `api`        |
| `LOG_LEVEL`  | Logging verbosity | `debug`       | `info`       |

### Database

| Variable       | Description                  | Development                                                | Production                                |
| -------------- | ---------------------------- | ---------------------------------------------------------- | ----------------------------------------- |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://postgres:postgres@localhost:5432/bibliology` | Get from Render PostgreSQL (Internal URL) |

**Format**: `postgresql://USER:PASSWORD@HOST:PORT/DATABASE`

**Example Production**:

```
postgresql://bibliology:secretpass@dpg-xyz123.oregon-postgres.render.com:5432/bibliology_db
```

### Redis

| Variable         | Description    | Development | Production                |
| ---------------- | -------------- | ----------- | ------------------------- |
| `REDIS_HOST`     | Redis hostname | `localhost` | Get from Render Redis URL |
| `REDIS_PORT`     | Redis port     | `6379`      | Get from Render Redis URL |
| `REDIS_PASSWORD` | Redis password | `` (empty)  | Get from Render Redis URL |

**Render Redis URL Format**: `redis://user:PASSWORD@HOST:PORT`

**Example**: Extract from `redis://red-xyz123:abc...@oregon-redis.render.com:6379`

- `REDIS_HOST`: `oregon-redis.render.com`
- `REDIS_PORT`: `6379`
- `REDIS_PASSWORD`: `abc...`

### JWT Authentication

| Variable                 | Description            | Development         | Production                                  |
| ------------------------ | ---------------------- | ------------------- | ------------------------------------------- |
| `JWT_SECRET`             | Access token secret    | Dev value in `.env` | **Generate with `openssl rand -base64 32`** |
| `JWT_EXPIRES_IN`         | Access token lifetime  | `15m`               | `15m`                                       |
| `JWT_REFRESH_SECRET`     | Refresh token secret   | Dev value in `.env` | **Generate with `openssl rand -base64 32`** |
| `JWT_REFRESH_EXPIRES_IN` | Refresh token lifetime | `7d`                | `7d`                                        |

⚠️ **CRITICAL**: Never use development secrets in production!

### CORS

| Variable      | Description             | Development             | Production                                              |
| ------------- | ----------------------- | ----------------------- | ------------------------------------------------------- |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` | Your Vercel URL (e.g., `https://bibliology.vercel.app`) |

**Note**: Update this after deploying frontend to Vercel.

### File Upload

| Variable        | Description                | Development       | Production        |
| --------------- | -------------------------- | ----------------- | ----------------- |
| `MAX_FILE_SIZE` | Max upload size in bytes   | `52428800` (50MB) | `52428800` (50MB) |
| `UPLOAD_DEST`   | Temporary upload directory | `./uploads`       | `/tmp/uploads`    |

**Note**: Render uses ephemeral filesystem, so uploads must be moved to S3 quickly.

### S3 / R2 Storage

| Variable               | Description            | Development                     | Production                     |
| ---------------------- | ---------------------- | ------------------------------- | ------------------------------ |
| `S3_ENDPOINT`          | S3-compatible endpoint | `http://localhost:9000` (MinIO) | Your R2/S3 endpoint            |
| `S3_ACCESS_KEY_ID`     | S3 access key          | `minioadmin`                    | Your production access key     |
| `S3_SECRET_ACCESS_KEY` | S3 secret key          | `minioadmin`                    | Your production secret key     |
| `S3_BUCKET`            | S3 bucket name         | `bibliology`                    | `bibliology-prod`              |
| `S3_REGION`            | S3 region              | `us-east-1`                     | Your region (or `auto` for R2) |

#### Cloudflare R2 Example:

```bash
S3_ENDPOINT=https://abc123.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=your_access_key_id
S3_SECRET_ACCESS_KEY=your_secret_access_key
S3_BUCKET=bibliology-prod
S3_REGION=auto
```

#### AWS S3 Example:

```bash
S3_ENDPOINT=https://s3.amazonaws.com
S3_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE
S3_SECRET_ACCESS_KEY=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
S3_BUCKET=bibliology-prod
S3_REGION=us-east-1
```

### Rate Limiting

| Variable         | Description             | Development | Production                    |
| ---------------- | ----------------------- | ----------- | ----------------------------- |
| `THROTTLE_TTL`   | Time window in seconds  | `60`        | `60`                          |
| `THROTTLE_LIMIT` | Max requests per window | `100`       | `100` (adjust based on usage) |

### PowerPoint Import

| Variable              | Description          | Development      | Production       |
| --------------------- | -------------------- | ---------------- | ---------------- |
| `PPTX_IMPORT_TIMEOUT` | Import timeout in ms | `300000` (5 min) | `300000` (5 min) |

## Frontend Environment Variables (Vercel)

Set these in Vercel Project Settings → Environment Variables.

| Variable       | Description       | Development             | Production                                                        |
| -------------- | ----------------- | ----------------------- | ----------------------------------------------------------------- |
| `VITE_API_URL` | Backend API URL   | `http://localhost:3000` | Your Render API URL (e.g., `https://bibliology-api.onrender.com`) |
| `NODE_ENV`     | Build environment | `development`           | `production`                                                      |

**Note**: All Vite env vars must be prefixed with `VITE_` to be accessible in browser.

## GitHub Secrets

Set these in GitHub Repository Settings → Secrets and variables → Actions → Repository secrets.

| Secret Name                 | Description                     | Where to Get                                     |
| --------------------------- | ------------------------------- | ------------------------------------------------ |
| `RENDER_DEPLOY_HOOK_API`    | Render API deploy webhook       | Render → API Service → Settings → Deploy Hook    |
| `RENDER_DEPLOY_HOOK_WORKER` | Render Worker deploy webhook    | Render → Worker Service → Settings → Deploy Hook |
| `VERCEL_TOKEN`              | Vercel API token for deployment | Vercel → Account Settings → Tokens               |
| `API_URL`                   | Production API URL              | `https://bibliology-api.onrender.com`            |

## Security Best Practices

### 🔒 Never Commit:

- Production database URLs
- JWT secrets
- S3/R2 credentials
- API keys
- Passwords

### ✅ Always:

- Use different secrets for development and production
- Generate secrets with cryptographic tools (`openssl rand -base64 32`)
- Rotate secrets periodically (every 90 days recommended)
- Store secrets in environment variables, never in code
- Use GitHub Secrets for CI/CD credentials
- Enable two-factor authentication on all platforms

### 🔑 Secret Rotation Process:

1. Generate new secret
2. Add new secret to environment (both API and Worker)
3. Deploy with both old and new secrets accepted (grace period)
4. After all users are migrated, remove old secret
5. Update documentation

## Verification Commands

### Check Environment Variables Locally

```bash
# Source .env file
cd apps/api
cat .env

# Test database connection
DATABASE_URL="your-db-url" pnpm db:studio
```

### Check Production Environment

```bash
# Render CLI
render shell bibliology-api
env | grep -E "JWT_|DATABASE_|REDIS_"

# Or check in Render Dashboard
# Navigate to Service → Environment
```

### Test API Connection

```bash
# Local
curl http://localhost:3000/health

# Production
curl https://bibliology-api.onrender.com/health
```

## Common Issues

### "JWT_SECRET must be set to a secure value"

- Ensure `JWT_SECRET` is not the default value
- Generate new secret: `openssl rand -base64 32`
- Update both API and Worker services

### CORS Errors

- Verify `CORS_ORIGIN` matches your frontend URL exactly
- Include protocol (`https://`) and no trailing slash
- Check browser console for actual origin being sent

### Database Connection Failed

- Verify `DATABASE_URL` format is correct
- Use **Internal Database URL** for Render services
- Check database is running and accessible

### Redis Connection Failed

- Parse Redis URL correctly (host, port, password)
- Use **Internal Redis URL** for Render services
- Verify Redis instance is running

### S3/R2 Upload Failed

- Check endpoint URL format (include `https://`)
- Verify access key and secret key are correct
- Ensure bucket exists and has proper permissions
- Check CORS settings on bucket (if browser upload)

## Environment Checklist

Before deploying, ensure you have:

- [ ] Generated secure JWT secrets
- [ ] Created PostgreSQL database on Render
- [ ] Created Redis instance on Render
- [ ] Set up S3/R2 bucket
- [ ] Configured all API environment variables
- [ ] Configured all Worker environment variables
- [ ] Deployed API and verified health check
- [ ] Updated CORS_ORIGIN with Vercel URL
- [ ] Configured Vercel environment variables
- [ ] Deployed frontend
- [ ] Added all GitHub Secrets
- [ ] Tested registration and login
- [ ] Verified file uploads work
- [ ] Checked all deployments in logs

## Support Resources

- **Render Docs**: https://render.com/docs
- **Vercel Docs**: https://vercel.com/docs
- **Prisma Docs**: https://www.prisma.io/docs
- **NestJS Docs**: https://docs.nestjs.com

## Example Full Production Configuration

### Render API/Worker Environment:

```bash
NODE_ENV=production
PORT=3000
API_PREFIX=api
LOG_LEVEL=info

DATABASE_URL=postgresql://bibliology:abc123@dpg-xyz.oregon-postgres.render.com:5432/bibliology_db

REDIS_HOST=oregon-redis.render.com
REDIS_PORT=6379
REDIS_PASSWORD=def456

JWT_SECRET=ghi789randombase64secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=jkl012randombase64secret
JWT_REFRESH_EXPIRES_IN=7d

CORS_ORIGIN=https://bibliology.vercel.app

MAX_FILE_SIZE=52428800
UPLOAD_DEST=/tmp/uploads

S3_ENDPOINT=https://account.r2.cloudflarestorage.com
S3_ACCESS_KEY_ID=mno345
S3_SECRET_ACCESS_KEY=pqr678
S3_BUCKET=bibliology-prod
S3_REGION=auto

THROTTLE_TTL=60
THROTTLE_LIMIT=100

PPTX_IMPORT_TIMEOUT=300000
```

### Vercel Environment:

```bash
VITE_API_URL=https://bibliology-api.onrender.com
NODE_ENV=production
```

### GitHub Secrets:

```bash
RENDER_DEPLOY_HOOK_API=https://api.render.com/deploy/srv-xyz...
RENDER_DEPLOY_HOOK_WORKER=https://api.render.com/deploy/srv-abc...
VERCEL_TOKEN=token_xyz123...
API_URL=https://bibliology-api.onrender.com
```
