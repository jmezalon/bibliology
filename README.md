# Bibliology

**Bilingual Bible Study Learning Management System**

A platform for teachers to create rich, PowerPoint-style Bible study lessons and for students to learn through an intuitive, Coursera-like interface with quizzes, progress tracking, and completion certificates.

## Features

### For Teachers
- Create lessons from scratch with rich content blocks
- Import existing PowerPoint presentations
- Add quizzes with multiple question types
- Publish lessons and track student progress
- View analytics and insights

### For Students
- Browse and enroll in courses
- View lessons with smooth navigation
- Take inline quizzes with instant feedback
- Track personal progress
- Toggle between English and French content
- Earn completion certificates

## Tech Stack

- **Frontend:** React 18 + Vite + TailwindCSS + shadcn/ui
- **Backend:** NestJS + Prisma + PostgreSQL + Redis + BullMQ
- **Monorepo:** Turborepo
- **Deployment:** Render (backend) + Vercel (frontend)

## Getting Started

### Prerequisites

```bash
node >= 18.0.0
pnpm >= 8.0.0
docker >= 20.0.0
```

### Setup (5 minutes)

```bash
# 1. Install dependencies
pnpm install

# 2. Start local services (Postgres, Redis, MinIO)
pnpm docker:up

# 3. Setup database
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# 4. Start development
pnpm dev
```

### Access Points

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3000
- **Prisma Studio:** http://localhost:5555 (run `pnpm db:studio`)
- **MinIO Console:** http://localhost:9001

## Development

### Available Scripts

```bash
# Development
pnpm dev              # Start all apps in dev mode
pnpm build            # Build all apps
pnpm test             # Run all tests
pnpm test:watch       # Run tests in watch mode
pnpm lint             # Lint all code
pnpm format           # Format all code

# Database
pnpm db:migrate:dev   # Create and run migrations
pnpm db:studio        # Open Prisma Studio
pnpm db:seed          # Seed database
pnpm db:reset         # Reset database

# Docker
pnpm docker:up        # Start services
pnpm docker:down      # Stop services
pnpm docker:logs      # View logs
```

### Project Structure

```
bibliology/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # React frontend
│   └── worker/       # Background job processor
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Zod schemas
│   ├── utils/        # Shared utilities
│   └── ui/           # Shared UI components
└── docs/             # Architecture documentation
```

## Documentation

- [Architecture Overview](./docs/architecture/README.md)
- [Tech Stack Decisions](./docs/architecture/adr-001-tech-stack.md)
- [Project Structure](./docs/architecture/project-structure.md)
- [Database Strategy](./docs/architecture/database-strategy.md)
- [Development Workflow](./docs/architecture/dev-workflow.md)
- [API Documentation](./docs/api/openapi.yml)

## Contributing

1. Create a branch from `main`
2. Make your changes with tests
3. Run `pnpm lint` and `pnpm test`
4. Create a pull request
5. Wait for CI checks and reviews

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add new feature
fix: fix a bug
docs: update documentation
style: formatting changes
refactor: code refactoring
test: add or update tests
chore: maintenance tasks
```

## License

UNLICENSED - Private project

## Support

For questions or issues, please contact the development team.
