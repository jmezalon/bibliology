# Development Workflow

**Project:** Bibliology - Bible Study Learning Platform
**Purpose:** Define development processes, tools, and best practices
**Date:** 2025-10-15

---

## Table of Contents

1. [Local Development Setup](#local-development-setup)
2. [Environment Configuration](#environment-configuration)
3. [Development Commands](#development-commands)
4. [Git Workflow](#git-workflow)
5. [Code Quality Tools](#code-quality-tools)
6. [Testing Strategy](#testing-strategy)
7. [Database Workflow](#database-workflow)
8. [Deployment Process](#deployment-process)
9. [Troubleshooting](#troubleshooting)

---

## Local Development Setup

### Prerequisites

Ensure you have the following installed:

```bash
# Node.js 18+ (use nvm for version management)
node --version  # Should be >= 18.0.0

# pnpm (faster than npm/yarn)
npm install -g pnpm

# Docker Desktop (for local databases)
docker --version

# Git
git --version
```

### Initial Setup

```bash
# 1. Clone the repository
git clone <repository-url>
cd bibliology

# 2. Install dependencies
pnpm install

# 3. Start local services (Postgres, Redis, MinIO)
docker-compose up -d

# 4. Wait for services to be ready (about 30 seconds)
docker-compose ps  # Check all services are "Up"

# 5. Copy environment files
cp .env.example .env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# 6. Generate Prisma client
pnpm db:generate

# 7. Run database migrations
pnpm db:migrate

# 8. Seed the database with sample data
pnpm db:seed

# 9. Verify setup
pnpm health:check  # Should show all services healthy

# 10. Start development servers
pnpm dev
```

### Verify Installation

Once `pnpm dev` is running, verify these URLs:

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Health: http://localhost:3000/health
- Prisma Studio: http://localhost:5555 (run `pnpm db:studio`)
- MinIO Console: http://localhost:9001 (minioadmin / minioadmin)

---

## Environment Configuration

### Development (.env files)

**Root `.env`**
```bash
# Not typically needed at root, but can store shared vars
NODE_ENV=development
```

**apps/api/.env**
```bash
# App
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:5173

# Database
DATABASE_URL="postgresql://bibliology:dev_password@localhost:5432/bibliology_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="dev-secret-change-in-production"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_SECRET="dev-refresh-secret-change-in-production"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Storage (MinIO for local dev)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="bibliology-assets"
S3_REGION="us-east-1"
S3_FORCE_PATH_STYLE=true

# Upload limits
MAX_FILE_SIZE_MB=50

# Email (optional for dev)
# SMTP_HOST=localhost
# SMTP_PORT=1025
# SMTP_USER=
# SMTP_PASS=
```

**apps/web/.env**
```bash
VITE_API_URL=http://localhost:3000
VITE_APP_NAME=Bibliology
VITE_ENABLE_ANALYTICS=false
VITE_DEFAULT_LANGUAGE=en
```

### Environment Variables Security

- Never commit `.env` files to Git
- Use `.env.example` as templates
- Use different secrets for each environment
- Rotate secrets regularly in production

---

## Development Commands

### Monorepo Commands

```bash
# Start all apps in development mode
pnpm dev

# Start specific app
pnpm dev --filter=@bibliology/api
pnpm dev --filter=@bibliology/web
pnpm dev --filter=@bibliology/worker

# Build all apps
pnpm build

# Build specific app
pnpm build --filter=@bibliology/api

# Run tests
pnpm test                    # All tests
pnpm test --filter=api       # API tests only
pnpm test:watch              # Watch mode
pnpm test:coverage           # With coverage

# Linting
pnpm lint                    # Lint all apps
pnpm lint:fix                # Auto-fix issues

# Type checking
pnpm typecheck               # Check all TypeScript

# Formatting
pnpm format                  # Format with Prettier
pnpm format:check            # Check formatting

# Clean build artifacts
pnpm clean
```

### Database Commands

```bash
# Generate Prisma client
pnpm db:generate

# Create a new migration
pnpm db:migrate:create --name add_user_avatar

# Run pending migrations
pnpm db:migrate

# Reset database (WARNING: destroys data)
pnpm db:reset

# Seed database
pnpm db:seed

# Open Prisma Studio (database GUI)
pnpm db:studio

# Push schema without migration (dev only)
pnpm db:push
```

### Package Management

```bash
# Add dependency to workspace root
pnpm add <package> -w

# Add dependency to specific app
pnpm add <package> --filter=@bibliology/api

# Add dev dependency
pnpm add -D <package> --filter=@bibliology/web

# Remove dependency
pnpm remove <package> --filter=@bibliology/api

# Update dependencies
pnpm update

# Check for outdated packages
pnpm outdated
```

### Docker Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f postgres
docker-compose logs -f redis

# Restart a service
docker-compose restart postgres

# Remove volumes (WARNING: destroys data)
docker-compose down -v

# Rebuild images
docker-compose build
```

---

## Git Workflow

### Branch Strategy

We use **GitHub Flow** (simplified Git Flow):

```
main (production-ready code)
  ↑
  └── feature/lesson-builder
  └── fix/quiz-validation
  └── chore/update-deps
```

**Branch Naming:**
- `feature/` - New features
- `fix/` - Bug fixes
- `chore/` - Maintenance tasks
- `docs/` - Documentation updates
- `refactor/` - Code refactoring
- `test/` - Adding tests

**Examples:**
```bash
feature/lesson-builder
feature/pptx-import
fix/quiz-answer-validation
fix/progress-tracking-bug
chore/update-nestjs
docs/api-endpoints
refactor/auth-service
test/lesson-service-unit-tests
```

### Commit Convention

We follow **Conventional Commits** specification:

**Format:**
```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks
- `ci`: CI/CD changes

**Examples:**
```bash
feat(lessons): add PowerPoint import functionality

- Implemented PPTX parser using JSZip
- Added content analyzer for detecting verses
- Created import preview UI component

Closes #123

fix(auth): prevent token refresh loop

Fixed infinite loop when refresh token expires by properly
handling 401 responses and redirecting to login.

Fixes #456

docs(api): update OpenAPI specification for quiz endpoints

test(progress): add unit tests for progress tracking service

chore(deps): update NestJS to v10.2.0
```

### Development Workflow

1. **Create a branch**
   ```bash
   git checkout main
   git pull origin main
   git checkout -b feature/lesson-builder
   ```

2. **Make changes and commit frequently**
   ```bash
   git add .
   git commit -m "feat(lessons): add slide editor component"
   ```

3. **Keep your branch up to date**
   ```bash
   git fetch origin
   git rebase origin/main
   # or
   git merge origin/main
   ```

4. **Push your branch**
   ```bash
   git push origin feature/lesson-builder
   ```

5. **Create Pull Request on GitHub**
   - Fill out PR template
   - Link related issues
   - Request reviews
   - Wait for CI checks to pass

6. **Address review feedback**
   ```bash
   # Make changes
   git add .
   git commit -m "fix(lessons): address PR feedback"
   git push origin feature/lesson-builder
   ```

7. **Merge after approval**
   - Squash and merge (preferred)
   - Or regular merge (for feature branches)

8. **Delete branch after merge**
   ```bash
   git checkout main
   git pull origin main
   git branch -d feature/lesson-builder
   ```

### Pull Request Guidelines

**PR Title Format:**
```
feat(lessons): add PowerPoint import functionality
fix(auth): resolve token refresh issues
docs(api): update endpoint documentation
```

**PR Description Template:**
```markdown
## Description
Brief description of what this PR does.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Screenshots (if applicable)
Add screenshots here

## Related Issues
Closes #123
Related to #456

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Tests pass locally
- [ ] Dependent changes merged
```

---

## Code Quality Tools

### ESLint

**Configuration:** `config/eslint/base.js`

```bash
# Run linter
pnpm lint

# Auto-fix issues
pnpm lint:fix

# Lint specific app
pnpm lint --filter=@bibliology/api
```

**Key Rules:**
- TypeScript strict mode
- No unused variables
- No console.log (use logger)
- Consistent naming conventions

### Prettier

**Configuration:** `.prettierrc`

```bash
# Format all files
pnpm format

# Check formatting without changing files
pnpm format:check
```

**Settings:**
```json
{
  "semi": true,
  "trailingComma": "all",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "endOfLine": "lf"
}
```

### TypeScript

**Strict Mode Enabled:**
- `strict: true`
- `noImplicitAny: true`
- `strictNullChecks: true`
- `noUnusedLocals: true`
- `noUnusedParameters: true`

```bash
# Type check all apps
pnpm typecheck

# Watch mode
pnpm typecheck:watch
```

### Husky Git Hooks

Pre-commit hooks automatically run before each commit:

```bash
# .husky/pre-commit
pnpm lint-staged
pnpm typecheck
```

**lint-staged** configuration in `package.json`:
```json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md}": ["prettier --write"]
  }
}
```

---

## Testing Strategy

### Test Structure

```
apps/api/
├── src/
│   └── modules/
│       └── lessons/
│           ├── lessons.service.ts
│           ├── lessons.service.spec.ts     # Unit tests
│           └── lessons.controller.spec.ts  # Controller tests
└── test/
    └── lessons.e2e-spec.ts                 # E2E tests
```

### Unit Tests (Vitest)

**Example:**
```typescript
// lessons.service.spec.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { LessonsService } from './lessons.service';
import { LessonsRepository } from './lessons.repository';

describe('LessonsService', () => {
  let service: LessonsService;
  let repository: LessonsRepository;

  beforeEach(() => {
    repository = new LessonsRepository();
    service = new LessonsService(repository);
  });

  it('should create a lesson', async () => {
    const dto = {
      title_en: 'Test Lesson',
      courseId: '123',
      status: 'draft',
    };

    const result = await service.create(dto);

    expect(result).toHaveProperty('id');
    expect(result.title_en).toBe('Test Lesson');
  });
});
```

**Run tests:**
```bash
# All unit tests
pnpm test

# Watch mode
pnpm test:watch

# Coverage report
pnpm test:coverage

# Specific file
pnpm test lessons.service.spec.ts
```

### Integration Tests (E2E)

**Example:**
```typescript
// lessons.e2e-spec.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { app } from '../src/app';

describe('Lessons API (E2E)', () => {
  let authToken: string;

  beforeAll(async () => {
    // Setup: login and get token
    const response = await request(app)
      .post('/auth/login')
      .send({ email: 'teacher@test.com', password: 'password' });

    authToken = response.body.accessToken;
  });

  it('POST /lessons - should create a lesson', async () => {
    const response = await request(app)
      .post('/lessons')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title_en: 'Test Lesson',
        courseId: '123',
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('id');
  });
});
```

### Frontend Testing (Vitest + React Testing Library)

**Example:**
```typescript
// LessonCard.spec.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LessonCard } from './LessonCard';

describe('LessonCard', () => {
  it('renders lesson title', () => {
    render(
      <LessonCard
        lesson={{
          id: '1',
          title_en: 'Test Lesson',
          status: 'published',
        }}
      />
    );

    expect(screen.getByText('Test Lesson')).toBeInTheDocument();
  });
});
```

### E2E Testing (Playwright)

**Example:**
```typescript
// lesson-viewer.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Lesson Viewer', () => {
  test('should navigate through slides', async ({ page }) => {
    await page.goto('/lessons/123');

    // Check first slide is visible
    await expect(page.locator('[data-testid="slide-1"]')).toBeVisible();

    // Click next button
    await page.click('[data-testid="next-slide"]');

    // Check second slide is visible
    await expect(page.locator('[data-testid="slide-2"]')).toBeVisible();
  });
});
```

**Run E2E tests:**
```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e --headed

# Run specific test
pnpm test:e2e lesson-viewer.spec.ts

# Generate test report
pnpm test:e2e --reporter=html
```

### Test Coverage Goals

- Unit tests: > 80% coverage
- Integration tests: Critical paths
- E2E tests: Main user flows

---

## Database Workflow

### Creating Migrations

```bash
# 1. Modify prisma/schema.prisma
# 2. Create migration
pnpm db:migrate:create --name add_user_avatar

# 3. Review generated SQL in prisma/migrations/
# 4. Apply migration
pnpm db:migrate

# 5. Commit migration files
git add prisma/migrations
git commit -m "feat(db): add user avatar field"
```

### Migration Best Practices

1. **Small, focused migrations** - One logical change per migration
2. **Reversible when possible** - Consider rollback scenarios
3. **Test migrations** - Apply to dev database first
4. **Document breaking changes** - Add comments in SQL
5. **Seed after schema changes** - Update seed data as needed

### Seeding Data

**Development Seeds:**
```typescript
// prisma/seeds/dev.seed.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Create test teacher
  const teacher = await prisma.user.create({
    data: {
      email: 'teacher@test.com',
      password_hash: '...', // Hashed password
      name: 'Test Teacher',
      role: 'TEACHER',
    },
  });

  // Create test course
  const course = await prisma.course.create({
    data: {
      title_en: 'Introduction to Pneumatology',
      slug: 'intro-pneumatology',
      teacher_id: teacher.id,
      status: 'PUBLISHED',
    },
  });

  // Create test lessons
  // ... more seed data
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

**Run seeds:**
```bash
# Run all seeds
pnpm db:seed

# Run specific seed
tsx prisma/seeds/dev.seed.ts
```

### Database Inspection

```bash
# Open Prisma Studio (GUI)
pnpm db:studio

# Connect with psql
psql postgresql://bibliology:dev_password@localhost:5432/bibliology_dev

# View tables
\dt

# Describe table
\d users

# Query data
SELECT * FROM users;
```

---

## Deployment Process

### CI/CD Pipeline

**GitHub Actions:**
- Runs on every push
- Checks: Lint, TypeScript, Tests, Build
- Auto-deploys on merge to `main`

### Manual Deployment

**Backend (Render):**
```bash
# 1. Ensure all tests pass
pnpm test

# 2. Build backend
pnpm build --filter=@bibliology/api

# 3. Push to main branch
git push origin main

# 4. Render auto-deploys from main branch
# Monitor deployment in Render dashboard

# 5. Run migrations on production
# (Render can auto-run migrations on deploy)

# 6. Verify deployment
curl https://api.bibliology.com/health
```

**Frontend (Vercel):**
```bash
# 1. Build frontend
pnpm build --filter=@bibliology/web

# 2. Push to main branch
git push origin main

# 3. Vercel auto-deploys from main branch
# Monitor in Vercel dashboard

# 4. Verify deployment
open https://bibliology.com
```

### Environment Promotion

```
Development → Staging → Production
```

1. **Development:** Test locally
2. **Staging:** Deploy to staging environment
3. **Testing:** Manual QA on staging
4. **Production:** Deploy to production after approval

---

## Troubleshooting

### Common Issues

**Issue: Docker services won't start**
```bash
# Check if ports are in use
lsof -i :5432  # PostgreSQL
lsof -i :6379  # Redis

# Kill processes if needed
kill -9 <PID>

# Restart Docker
docker-compose down
docker-compose up -d
```

**Issue: Prisma client out of sync**
```bash
# Regenerate Prisma client
pnpm db:generate

# If that doesn't work, clean and regenerate
rm -rf node_modules/.prisma
pnpm db:generate
```

**Issue: Database connection errors**
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres

# Verify connection string in .env
echo $DATABASE_URL
```

**Issue: Migration conflicts**
```bash
# Reset database (WARNING: destroys data)
pnpm db:reset

# Or resolve conflicts manually
pnpm db:migrate:resolve --applied <migration-name>
```

**Issue: Build errors**
```bash
# Clean everything and rebuild
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

**Issue: Port already in use**
```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Getting Help

1. Check documentation first
2. Search existing issues on GitHub
3. Ask in team chat (Slack/Discord)
4. Create GitHub issue with:
   - Clear description
   - Steps to reproduce
   - Environment details
   - Error logs

---

## Best Practices Summary

### Code
- Write self-documenting code
- Add comments for complex logic
- Follow TypeScript strict mode
- Use meaningful variable names
- Keep functions small and focused

### Git
- Commit frequently
- Write descriptive commit messages
- Keep branches short-lived (< 1 week)
- Rebase/merge main regularly
- Review your own code before PR

### Testing
- Write tests for new features
- Test edge cases
- Mock external services
- Keep tests fast
- Maintain test data fixtures

### Database
- Review migrations before applying
- Never edit committed migrations
- Seed data after schema changes
- Use transactions for data integrity
- Index frequently queried columns

### Documentation
- Update docs with code changes
- Document breaking changes
- Add JSDoc comments for public APIs
- Keep README up to date
- Document deployment steps

---

## Quick Reference

### Daily Workflow

```bash
# Morning setup
git checkout main
git pull origin main
docker-compose up -d
pnpm dev

# Create feature branch
git checkout -b feature/my-feature

# Make changes, commit frequently
git add .
git commit -m "feat(scope): description"

# Push and create PR
git push origin feature/my-feature

# After PR merged
git checkout main
git pull origin main
git branch -d feature/my-feature
```

### Common Commands

```bash
# Development
pnpm dev                 # Start all apps
pnpm build              # Build all apps
pnpm test               # Run tests
pnpm lint:fix           # Fix linting issues

# Database
pnpm db:studio          # Open database GUI
pnpm db:migrate         # Run migrations
pnpm db:seed            # Seed data

# Docker
docker-compose up -d    # Start services
docker-compose down     # Stop services
docker-compose logs -f  # View logs

# Git
git status              # Check status
git add .               # Stage changes
git commit -m "message" # Commit
git push                # Push to remote
```

---

This workflow document should evolve as the team grows and processes mature. Update it regularly based on lessons learned and team feedback.
