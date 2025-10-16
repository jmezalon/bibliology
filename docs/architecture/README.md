# Bibliology - Architecture Documentation

**Version:** 1.0.0 (Phase 1 MVP)
**Status:** Approved for Implementation
**Date:** 2025-10-15

---

## Project Overview

**Bibliology** is a bilingual (English/French) Bible study learning management system designed for churches and religious education. It allows teachers to create rich, PowerPoint-style lessons and enables students to learn through an intuitive, Coursera-like interface with quizzes, progress tracking, and completion certificates.

### Core Features (Phase 1 MVP)

**For Teachers:**

- Create lessons from scratch with rich content blocks
- Import existing PowerPoint presentations
- Add quizzes with multiple choice and true/false questions
- Publish lessons and track student progress
- View basic analytics

**For Students:**

- Browse and enroll in courses
- View lessons with smooth navigation
- Take inline quizzes with instant feedback
- Track personal progress
- Resume where left off
- Toggle between English and French content

### Technology Stack

**Frontend:**

- React 18+ with TypeScript
- Vite for fast development
- TailwindCSS + shadcn/ui for UI components
- TipTap for rich text editing
- React Query for server state
- Zustand for client state
- dnd-kit for drag-and-drop

**Backend:**

- NestJS (Node.js + TypeScript)
- Prisma ORM
- PostgreSQL 15+ database
- Redis for caching and queues
- BullMQ for background jobs
- JWT authentication (cookie-based)

**Infrastructure:**

- Turborepo monorepo
- Docker Compose for local development
- Render for backend deployment
- Vercel for frontend deployment
- Cloudflare R2 or AWS S3 for file storage
- GitHub Actions for CI/CD

---

## Documentation Index

This architecture documentation is organized into the following files:

### 1. [ADR-001: Technology Stack Selection](./adr-001-tech-stack.md)

**Purpose:** Detailed rationale for every technology decision

**What you'll find:**

- Complete justification for each technology choice
- Alternatives considered with pros/cons
- Trade-off analysis
- Implementation notes
- Future considerations

**Key decisions:**

- Why Turborepo over Nx
- Why NestJS over Express
- Why Prisma over TypeORM
- Why TipTap over Slate.js
- Why Zod for validation
- And 15+ more architectural decisions

### 2. [Project Structure](./project-structure.md)

**Purpose:** Complete folder hierarchy and file organization

**What you'll find:**

- Monorepo structure (apps/ and packages/)
- Backend API structure with all modules
- Frontend app structure with all pages/components
- Worker app structure for background jobs
- Shared packages organization
- Configuration files
- File naming conventions
- Import aliases
- Environment variables

**Highlights:**

- 3 apps: API, Web, Worker
- 4 shared packages: types, validation, utils, ui
- Clear separation of concerns
- Scalable from MVP to production

### 3. [System Diagrams](./system-diagrams.mmd)

**Purpose:** Visual representation of architecture

**What you'll find:**

- High-level system architecture
- Authentication flow (sequence diagram)
- PowerPoint import flow (sequence diagram)
- Lesson viewer flow (sequence diagram)
- Lesson builder flow (sequence diagram)
- Database entity relationship diagram
- API route structure
- Background job processing flow
- Caching strategy
- Deployment architecture
- Security architecture
- Complete lesson creation data flow

**Total diagrams:** 12 comprehensive Mermaid diagrams

### 4. [Development Workflow](./dev-workflow.md)

**Purpose:** How to develop, test, and deploy

**What you'll find:**

- Local development setup (step-by-step)
- Environment configuration
- Development commands (monorepo)
- Git workflow and branching strategy
- Commit conventions
- Pull request guidelines
- Code quality tools (ESLint, Prettier, TypeScript)
- Testing strategy (unit, integration, E2E)
- Database workflow (migrations, seeding)
- Deployment process
- Troubleshooting guide

**Key sections:**

- Docker Compose setup for local services
- GitHub Flow branching strategy
- Conventional Commits specification
- Turborepo commands
- Prisma migration workflow

### 5. [Database Strategy](./database-strategy.md)

**Purpose:** Database design philosophy and implementation

**What you'll find:**

- Schema design principles
- Bilingual content strategy (EN/FR columns)
- Complete Prisma schema (600+ lines)
- 15+ database tables with relationships
- Index strategy for performance
- Migration strategy
- Common query patterns with Prisma
- Performance optimization techniques
- Connection pooling configuration
- Backup and recovery procedures

**Key tables:**

- Users, Courses, Lessons, Slides
- ContentBlocks (JSONB for flexibility)
- Quizzes, Questions, QuizSubmissions
- Enrollments, LessonProgress
- Certificates, ActivityLogs

### 6. [OpenAPI Specification](../api/openapi.yml)

**Purpose:** Complete REST API contract

**What you'll find:**

- 50+ API endpoints documented
- Request/response schemas
- Authentication requirements
- Error responses
- Pagination parameters
- Rate limiting information

**Endpoint categories:**

- Authentication (register, login, logout, refresh)
- Courses (CRUD + publish)
- Lessons (CRUD + publish + reorder)
- Slides (CRUD + reorder)
- Content Blocks (CRUD)
- Quizzes (CRUD + submit + results)
- Progress (track, complete)
- Enrollments (enroll, list)
- Uploads (image, PowerPoint)
- Imports (parse, preview, confirm)
- Certificates (list, download)
- Analytics (overview, course stats)
- Health (system status)

### 7. [Phase 1 MVP Timeline](./phase-1-mvp-timeline.md)

**Purpose:** 4-week implementation plan

**What you'll find:**

- Week-by-week breakdown
- Day-by-day tasks with checkboxes
- Deliverables for each week
- Risk management strategy
- Testing strategy per week
- Daily workflow recommendations
- Success metrics
- Post-MVP priorities

**Timeline:**

- **Week 1:** Foundation & Authentication
- **Week 2:** Lesson Management (Teacher)
- **Week 3:** Student Experience & PowerPoint Import
- **Week 4:** Quizzes, Polish & Deployment

---

## Quick Start

### Prerequisites

```bash
# Required software
node >= 18.0.0
pnpm >= 8.0.0
docker >= 20.0.0
git >= 2.30.0
```

### Setup (5 minutes)

```bash
# 1. Clone repository
git clone <repository-url>
cd bibliology

# 2. Install dependencies
pnpm install

# 3. Start local services
docker-compose up -d

# 4. Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 5. Start development
pnpm dev
```

**Access points:**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Prisma Studio: http://localhost:5555 (`pnpm db:studio`)
- MinIO Console: http://localhost:9001

---

## Architecture Principles

### 1. TypeScript Everywhere

- Strict mode enabled
- No `any` types
- Shared types between frontend and backend

### 2. Separation of Concerns

- Clear module boundaries
- Feature-based folder structure
- Repository pattern for data access

### 3. Bilingual from Day One

- Separate EN/FR columns in database
- Fallback to English if French missing
- Language toggle throughout UI

### 4. Developer Experience

- Fast hot reload with Vite/Turbo
- Type-safe API calls
- Comprehensive error messages
- Automated testing

### 5. Security First

- HttpOnly cookies for JWT
- CSRF protection (SameSite cookies)
- Role-based access control
- Input validation (Zod schemas)
- SQL injection prevention (Prisma)
- XSS prevention (sanitization)

### 6. Performance Optimized

- Database indexing strategy
- Redis caching layer
- Code splitting
- Image optimization
- Query optimization

### 7. Scalable Architecture

- Horizontal scaling ready
- Background job processing
- Stateless API servers
- CDN for static assets

---

## Key Architectural Decisions

### Monorepo Strategy

**Decision:** Use Turborepo for monorepo management

**Rationale:**

- Share code between apps easily
- Atomic commits across frontend/backend
- Fast builds with caching
- Simple configuration

### Database Schema

**Decision:** Separate EN/FR columns instead of JSONB language object

**Rationale:**

- Simpler queries: `WHERE title_en ILIKE '%search%'`
- Better indexing for each language
- Type-safe with Prisma
- Easy to make English required, French optional

### Content Block Storage

**Decision:** Use JSONB for content blocks instead of separate tables

**Rationale:**

- Content structure varies by block type
- Flexibility to add new types without migrations
- Can still query inside JSONB with Postgres operators
- Zod validation provides type safety

### Authentication

**Decision:** Cookie-based JWT instead of localStorage

**Rationale:**

- More secure (HttpOnly prevents XSS)
- CSRF protection with SameSite
- Automatic token refresh
- Works with SSR (future)

### State Management

**Decision:** React Query for server state, Zustand for client state

**Rationale:**

- React Query handles caching, refetching, optimistic updates
- Zustand is lightweight (1KB) and simple
- Clear separation between server and client state
- No Redux boilerplate

---

## Scaling Roadmap

### Current (MVP)

- Single API server
- Single database
- Single Redis instance
- Local file storage (dev)

### Phase 2 (100 users)

- Add worker process for background jobs
- Move to Cloudflare R2 for storage
- Enable database connection pooling
- Add Redis caching layer

### Phase 3 (1000 users)

- Horizontal API scaling (multiple instances)
- Read replicas for database
- CDN for static assets
- Background worker pool
- Advanced caching strategy

### Phase 4 (10000+ users)

- Microservices extraction (imports service)
- Multi-region deployment
- Dedicated search service (Meilisearch/Algolia)
- Advanced analytics (separate data warehouse)
- Mobile apps (React Native)

---

## Testing Strategy

### Unit Tests (Vitest)

- All service layer functions
- Utility functions
- Complex business logic
- **Goal:** 80%+ coverage

### Integration Tests

- API endpoints with database
- Authentication flows
- Payment processing
- **Goal:** All critical paths covered

### E2E Tests (Playwright)

- Complete user journeys
- Teacher creates lesson
- Student takes lesson
- PowerPoint import flow
- **Goal:** All main workflows tested

### Manual Testing

- Cross-browser testing (Chrome, Firefox, Safari)
- Mobile responsive testing
- Accessibility testing
- Performance testing

---

## Deployment Strategy

### Environments

1. **Development** (Local)
   - Docker Compose for services
   - Hot reload enabled
   - Seed data populated

2. **Staging** (Render + Vercel)
   - Production-like environment
   - Separate database
   - Manual QA testing

3. **Production** (Render + Vercel)
   - Auto-deploy on merge to `main`
   - Database backups enabled
   - Monitoring enabled

### CI/CD Pipeline

```yaml
On Push:
  - Lint all code
  - Type check TypeScript
  - Run unit tests
  - Run integration tests
  - Build all apps

On Merge to Main:
  - Run full test suite
  - Build production bundles
  - Deploy backend to Render
  - Deploy frontend to Vercel
  - Run smoke tests
  - Notify team
```

---

## Security Measures

### Application Security

- [ ] HTTPS everywhere
- [ ] HttpOnly cookies for JWT
- [ ] CSRF protection (SameSite cookies)
- [ ] XSS prevention (sanitization)
- [ ] SQL injection prevention (Prisma parameterized queries)
- [ ] Rate limiting (10-100 req/min)
- [ ] Input validation (Zod schemas)
- [ ] Password hashing (bcrypt)
- [ ] Environment variables for secrets
- [ ] Role-based access control

### Infrastructure Security

- [ ] Regular security updates
- [ ] Database backups
- [ ] Access logs
- [ ] Secret rotation
- [ ] Firewall configuration
- [ ] DDoS protection (Cloudflare)

---

## Performance Targets

### Backend API

- Response time: < 200ms (p95)
- Throughput: 100+ req/sec
- Database connections: Pooled (max 10)
- Cache hit rate: > 80%

### Frontend

- First Contentful Paint: < 1.5s
- Time to Interactive: < 3s
- Bundle size: < 500KB (gzipped)
- Lighthouse score: > 90

### Background Jobs

- PowerPoint import: < 60s (10-slide deck)
- Image optimization: < 5s per image
- Certificate generation: < 10s

---

## Monitoring & Observability

### Metrics (Phase 2)

- API response times
- Error rates
- Database query performance
- Cache hit rates
- Background job success rates
- User engagement metrics

### Logging

- Structured JSON logs
- Log levels (error, warn, info, debug)
- Request/response logging
- Error stack traces
- User action tracking

### Alerting (Phase 2)

- API downtime
- High error rates
- Database connection issues
- Slow queries (> 1s)
- Failed background jobs

---

## Documentation Standards

### Code Documentation

- JSDoc comments for public APIs
- README in each package
- Architecture Decision Records (ADRs)
- Inline comments for complex logic

### API Documentation

- OpenAPI specification (openapi.yml)
- Generated API docs (Swagger UI)
- Postman collection
- Example requests/responses

### User Documentation (Phase 2)

- Teacher guide
- Student guide
- FAQ
- Video tutorials

---

## Team Workflow

### Daily Routine

1. Pull latest code (`git pull origin main`)
2. Check project board for assigned tasks
3. Create feature branch (`feature/task-name`)
4. Write code with tests
5. Commit with conventional commits
6. Create pull request
7. Address review feedback
8. Merge after approval

### Weekly Routine

1. Sprint planning (Monday)
2. Daily standups (async or sync)
3. Code reviews throughout week
4. Demo completed features (Friday)
5. Retrospective (Friday)

### Code Review Checklist

- [ ] Code follows style guidelines
- [ ] Tests pass locally
- [ ] New tests added for new features
- [ ] Documentation updated
- [ ] No console.log statements
- [ ] Type-safe (no `any`)
- [ ] Error handling implemented
- [ ] Accessibility considered

---

## Troubleshooting

### Common Issues

**Docker services won't start:**

```bash
docker-compose down -v
docker-compose up -d
```

**Database out of sync:**

```bash
pnpm db:reset
```

**Build errors:**

```bash
pnpm clean
rm -rf node_modules
pnpm install
pnpm build
```

**Port already in use:**

```bash
lsof -i :3000
kill -9 <PID>
```

For more troubleshooting, see [Development Workflow](./dev-workflow.md#troubleshooting).

---

## Contributing

### Before You Start

1. Read all architecture docs
2. Set up local development environment
3. Run tests to ensure everything works
4. Pick a task from the project board

### Code Standards

- TypeScript strict mode
- ESLint + Prettier configured
- Conventional Commits
- 80%+ test coverage
- Accessibility (WCAG AA)

### Pull Request Process

1. Create branch from `main`
2. Make changes with tests
3. Push and create PR
4. Wait for CI checks
5. Address review feedback
6. Squash and merge

---

## Support & Contact

**Project Repository:** [GitHub Link]
**Documentation:** [Docs Link]
**Issue Tracker:** [Issues Link]
**Team Chat:** [Slack/Discord Link]

---

## License

[To be determined]

---

## Conclusion

This architecture is designed to support rapid MVP development while maintaining code quality and scalability. The key principles are:

1. **Type safety everywhere** - Catch bugs at compile time
2. **Clear separation of concerns** - Easy to understand and modify
3. **Test-driven development** - Confidence in changes
4. **Developer experience** - Fast feedback loops
5. **Production-ready from day one** - Deploy with confidence

**Next Step:** Begin implementation following the [Phase 1 MVP Timeline](./phase-1-mvp-timeline.md).

Good luck building Bibliology!
