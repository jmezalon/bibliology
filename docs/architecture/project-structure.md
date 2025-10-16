# Project Structure

**Project:** Bibliology - Bible Study Learning Platform
**Architecture:** Turborepo Monorepo
**Language:** TypeScript (strict mode)
**Date:** 2025-10-15

---

## Overview

This document defines the complete folder structure for the Bibliology monorepo. The structure is designed for:

- Clear separation of concerns
- Easy navigation for developers
- Scalability from MVP to production
- Shared code reusability
- Independent deployment of apps

---

## Root Directory Structure

```
bibliology/
├── apps/                          # Applications (deployable units)
│   ├── api/                       # Backend API (NestJS)
│   ├── web/                       # Frontend SPA (React + Vite)
│   └── worker/                    # Background job processor
├── packages/                      # Shared packages
│   ├── types/                     # Shared TypeScript types
│   ├── validation/                # Zod schemas
│   ├── utils/                     # Shared utilities
│   └── ui/                        # Shared React components (future)
├── docs/                          # Documentation
│   ├── architecture/              # Architecture Decision Records
│   ├── api/                       # API documentation
│   └── guides/                    # Developer guides
├── prisma/                        # Database schema and migrations
│   ├── schema.prisma             # Prisma schema
│   ├── migrations/               # Migration files
│   └── seed.ts                   # Seed data
├── .github/                       # GitHub configuration
│   ├── workflows/                # CI/CD pipelines
│   └── ISSUE_TEMPLATE/           # Issue templates
├── config/                        # Shared configuration
│   ├── eslint/                   # ESLint configs
│   └── typescript/               # TypeScript configs
├── scripts/                       # Utility scripts
│   ├── setup-local.sh            # Local development setup
│   └── seed-dev-data.ts          # Development data seeding
├── .env.example                   # Environment variables template
├── .gitignore                     # Git ignore rules
├── docker-compose.yml             # Local development services
├── package.json                   # Root package.json
├── pnpm-workspace.yaml            # pnpm workspace config
├── turbo.json                     # Turborepo configuration
├── README.md                      # Project documentation
└── LICENSE                        # License file
```

---

## Apps Directory

### apps/api/ - Backend API (NestJS)

**Purpose:** REST API, authentication, business logic, database access

```
apps/api/
├── src/
│   ├── main.ts                       # Application entry point
│   ├── app.module.ts                 # Root application module
│   ├── config/                       # Configuration
│   │   ├── database.config.ts
│   │   ├── redis.config.ts
│   │   ├── storage.config.ts
│   │   └── auth.config.ts
│   ├── common/                       # Shared utilities
│   │   ├── decorators/               # Custom decorators
│   │   │   ├── current-user.decorator.ts
│   │   │   └── roles.decorator.ts
│   │   ├── filters/                  # Exception filters
│   │   │   └── http-exception.filter.ts
│   │   ├── guards/                   # Guards
│   │   │   ├── auth.guard.ts
│   │   │   └── roles.guard.ts
│   │   ├── interceptors/             # Interceptors
│   │   │   ├── logging.interceptor.ts
│   │   │   └── transform.interceptor.ts
│   │   ├── pipes/                    # Validation pipes
│   │   │   └── zod-validation.pipe.ts
│   │   └── middleware/               # Middleware
│   │       ├── cors.middleware.ts
│   │       └── rate-limit.middleware.ts
│   ├── modules/                      # Feature modules
│   │   ├── auth/                     # Authentication module
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   ├── jwt.strategy.ts
│   │   │   │   └── local.strategy.ts
│   │   │   └── dto/
│   │   │       ├── login.dto.ts
│   │   │       └── register.dto.ts
│   │   ├── users/                    # User management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-user.dto.ts
│   │   │       └── update-user.dto.ts
│   │   ├── courses/                  # Course module
│   │   │   ├── courses.module.ts
│   │   │   ├── courses.controller.ts
│   │   │   ├── courses.service.ts
│   │   │   ├── courses.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-course.dto.ts
│   │   │       ├── update-course.dto.ts
│   │   │       └── course-response.dto.ts
│   │   ├── lessons/                  # Lesson module
│   │   │   ├── lessons.module.ts
│   │   │   ├── lessons.controller.ts
│   │   │   ├── lessons.service.ts
│   │   │   ├── lessons.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-lesson.dto.ts
│   │   │       ├── update-lesson.dto.ts
│   │   │       └── lesson-response.dto.ts
│   │   ├── slides/                   # Slide management
│   │   │   ├── slides.module.ts
│   │   │   ├── slides.controller.ts
│   │   │   ├── slides.service.ts
│   │   │   ├── slides.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-slide.dto.ts
│   │   │       └── update-slide.dto.ts
│   │   ├── content-blocks/           # Content block management
│   │   │   ├── content-blocks.module.ts
│   │   │   ├── content-blocks.controller.ts
│   │   │   ├── content-blocks.service.ts
│   │   │   ├── content-blocks.repository.ts
│   │   │   └── dto/
│   │   │       ├── create-block.dto.ts
│   │   │       └── update-block.dto.ts
│   │   ├── quizzes/                  # Quiz module
│   │   │   ├── quizzes.module.ts
│   │   │   ├── quizzes.controller.ts
│   │   │   ├── quizzes.service.ts
│   │   │   ├── quizzes.repository.ts
│   │   │   ├── questions.service.ts
│   │   │   ├── submissions.service.ts
│   │   │   └── dto/
│   │   │       ├── create-quiz.dto.ts
│   │   │       ├── create-question.dto.ts
│   │   │       └── submit-quiz.dto.ts
│   │   ├── progress/                 # Student progress tracking
│   │   │   ├── progress.module.ts
│   │   │   ├── progress.controller.ts
│   │   │   ├── progress.service.ts
│   │   │   └── progress.repository.ts
│   │   ├── uploads/                  # File upload module
│   │   │   ├── uploads.module.ts
│   │   │   ├── uploads.controller.ts
│   │   │   ├── uploads.service.ts
│   │   │   └── storage/
│   │   │       ├── s3.storage.ts
│   │   │       └── local.storage.ts
│   │   ├── imports/                  # PowerPoint import
│   │   │   ├── imports.module.ts
│   │   │   ├── imports.controller.ts
│   │   │   ├── imports.service.ts
│   │   │   ├── parsers/
│   │   │   │   ├── pptx.parser.ts
│   │   │   │   ├── content.analyzer.ts
│   │   │   │   └── transformer.service.ts
│   │   │   └── dto/
│   │   │       └── import-pptx.dto.ts
│   │   ├── enrollments/              # Course enrollments
│   │   │   ├── enrollments.module.ts
│   │   │   ├── enrollments.controller.ts
│   │   │   ├── enrollments.service.ts
│   │   │   └── enrollments.repository.ts
│   │   ├── certificates/             # Certificate generation
│   │   │   ├── certificates.module.ts
│   │   │   ├── certificates.controller.ts
│   │   │   ├── certificates.service.ts
│   │   │   └── templates/
│   │   │       └── certificate.template.ts
│   │   ├── analytics/                # Analytics and reporting
│   │   │   ├── analytics.module.ts
│   │   │   ├── analytics.controller.ts
│   │   │   └── analytics.service.ts
│   │   └── health/                   # Health check
│   │       ├── health.module.ts
│   │       └── health.controller.ts
│   ├── database/                     # Database layer
│   │   ├── prisma.service.ts         # Prisma client wrapper
│   │   └── repositories/             # Base repository classes
│   │       └── base.repository.ts
│   ├── queues/                       # Queue configuration
│   │   ├── queues.module.ts
│   │   ├── producers/                # Job producers
│   │   │   ├── import.producer.ts
│   │   │   └── email.producer.ts
│   │   └── consumers/                # Job consumers (see worker app)
│   └── utils/                        # Utility functions
│       ├── logger.ts
│       ├── hash.ts
│       └── date.ts
├── test/                             # E2E tests
│   ├── app.e2e-spec.ts
│   ├── auth.e2e-spec.ts
│   └── lessons.e2e-spec.ts
├── .env.example                      # Environment variables template
├── .env.test                         # Test environment variables
├── nest-cli.json                     # NestJS CLI configuration
├── package.json                      # Package dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # API documentation
```

**Key Directories Explained:**

- **src/config/**: Configuration modules for database, Redis, S3, etc.
- **src/common/**: Shared utilities (guards, filters, decorators)
- **src/modules/**: Feature-based modules (one per domain entity)
- **src/database/**: Database connection and base repositories
- **src/queues/**: Queue producers (consumers are in worker app)
- **test/**: End-to-end integration tests

---

### apps/web/ - Frontend SPA (React + Vite)

**Purpose:** Student and teacher web interface

```
apps/web/
├── public/                           # Static assets
│   ├── favicon.ico
│   ├── logo.svg
│   └── fonts/
├── src/
│   ├── main.tsx                      # Application entry point
│   ├── App.tsx                       # Root component
│   ├── vite-env.d.ts                # Vite type definitions
│   ├── assets/                       # Images, icons, etc.
│   │   ├── images/
│   │   ├── icons/
│   │   └── styles/
│   │       └── index.css             # Global styles
│   ├── components/                   # React components
│   │   ├── ui/                       # shadcn/ui components
│   │   │   ├── button.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── form.tsx
│   │   │   ├── input.tsx
│   │   │   ├── select.tsx
│   │   │   ├── toast.tsx
│   │   │   └── ... (other shadcn components)
│   │   ├── layout/                   # Layout components
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── MainLayout.tsx
│   │   ├── auth/                     # Auth components
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── lesson/                   # Lesson components
│   │   │   ├── LessonCard.tsx
│   │   │   ├── LessonList.tsx
│   │   │   └── LessonViewer/
│   │   │       ├── LessonViewer.tsx
│   │   │       ├── SlideRenderer.tsx
│   │   │       ├── ContentBlock.tsx
│   │   │       ├── ProgressBar.tsx
│   │   │       └── NavigationControls.tsx
│   │   ├── builder/                  # Lesson builder components
│   │   │   ├── LessonBuilder.tsx
│   │   │   ├── SlideEditor.tsx
│   │   │   ├── BlockEditor.tsx
│   │   │   ├── SlideNavigator.tsx
│   │   │   ├── PropertiesPanel.tsx
│   │   │   └── blocks/               # Content block editors
│   │   │       ├── TextBlockEditor.tsx
│   │   │       ├── HeadingBlockEditor.tsx
│   │   │       ├── ImageBlockEditor.tsx
│   │   │       ├── VerseBlockEditor.tsx
│   │   │       ├── VocabBlockEditor.tsx
│   │   │       └── QuizBlockEditor.tsx
│   │   ├── quiz/                     # Quiz components
│   │   │   ├── QuizQuestion.tsx
│   │   │   ├── MultipleChoice.tsx
│   │   │   ├── TrueFalse.tsx
│   │   │   ├── ShortAnswer.tsx
│   │   │   └── QuizResults.tsx
│   │   ├── course/                   # Course components
│   │   │   ├── CourseCard.tsx
│   │   │   ├── CourseList.tsx
│   │   │   └── CourseDetail.tsx
│   │   ├── progress/                 # Progress components
│   │   │   ├── ProgressCard.tsx
│   │   │   ├── ProgressChart.tsx
│   │   │   └── CompletionBadge.tsx
│   │   ├── analytics/                # Analytics components
│   │   │   ├── AnalyticsDashboard.tsx
│   │   │   ├── EnrollmentChart.tsx
│   │   │   └── QuizPerformance.tsx
│   │   └── shared/                   # Shared components
│   │       ├── LoadingSpinner.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ConfirmDialog.tsx
│   │       └── LanguageToggle.tsx
│   ├── pages/                        # Page components (routes)
│   │   ├── auth/
│   │   │   ├── LoginPage.tsx
│   │   │   └── RegisterPage.tsx
│   │   ├── student/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── LessonViewerPage.tsx
│   │   │   └── ProgressPage.tsx
│   │   ├── teacher/
│   │   │   ├── DashboardPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── LessonBuilderPage.tsx
│   │   │   ├── QuizBuilderPage.tsx
│   │   │   ├── AnalyticsPage.tsx
│   │   │   └── ImportPage.tsx
│   │   └── common/
│   │       ├── HomePage.tsx
│   │       ├── NotFoundPage.tsx
│   │       └── UnauthorizedPage.tsx
│   ├── hooks/                        # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useLesson.ts
│   │   ├── useCourse.ts
│   │   ├── useQuiz.ts
│   │   ├── useProgress.ts
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   └── useMediaQuery.ts
│   ├── lib/                          # Library code
│   │   ├── api/                      # API client
│   │   │   ├── client.ts             # Axios instance
│   │   │   ├── auth.api.ts
│   │   │   ├── courses.api.ts
│   │   │   ├── lessons.api.ts
│   │   │   ├── quizzes.api.ts
│   │   │   ├── progress.api.ts
│   │   │   └── uploads.api.ts
│   │   ├── queries/                  # React Query hooks
│   │   │   ├── useAuthQueries.ts
│   │   │   ├── useCourseQueries.ts
│   │   │   ├── useLessonQueries.ts
│   │   │   ├── useQuizQueries.ts
│   │   │   └── useProgressQueries.ts
│   │   ├── store/                    # Zustand stores
│   │   │   ├── authStore.ts
│   │   │   ├── lessonBuilderStore.ts
│   │   │   └── uiStore.ts
│   │   └── utils/                    # Utility functions
│   │       ├── cn.ts                 # className utility
│   │       ├── format.ts             # Formatting functions
│   │       ├── validation.ts         # Client validation
│   │       └── constants.ts          # Constants
│   ├── routes/                       # Routing configuration
│   │   ├── index.tsx                 # Route definitions
│   │   ├── ProtectedRoute.tsx        # Auth wrapper
│   │   └── RoleRoute.tsx             # Role-based routing
│   ├── i18n/                         # Internationalization
│   │   ├── index.ts                  # i18n setup
│   │   ├── en.json                   # English translations
│   │   └── fr.json                   # French translations
│   └── types/                        # Frontend-specific types
│       ├── api.types.ts
│       ├── lesson.types.ts
│       └── quiz.types.ts
├── .env.example                      # Environment variables template
├── .eslintrc.cjs                     # ESLint configuration
├── index.html                        # HTML entry point
├── package.json                      # Package dependencies
├── postcss.config.js                 # PostCSS configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── tsconfig.json                     # TypeScript configuration
├── vite.config.ts                    # Vite configuration
└── README.md                         # Frontend documentation
```

**Key Directories Explained:**

- **src/components/**: All React components (organized by feature)
- **src/pages/**: Page-level components mapped to routes
- **src/hooks/**: Custom React hooks for business logic
- **src/lib/api/**: API client and endpoint functions
- **src/lib/queries/**: React Query hooks for data fetching
- **src/lib/store/**: Zustand stores for client state
- **src/routes/**: Routing configuration and guards

---

### apps/worker/ - Background Job Processor

**Purpose:** Process long-running tasks (PPTX import, emails, certificates)

```
apps/worker/
├── src/
│   ├── main.ts                       # Worker entry point
│   ├── config/                       # Configuration
│   │   ├── redis.config.ts
│   │   └── storage.config.ts
│   ├── processors/                   # Job processors
│   │   ├── import.processor.ts       # PowerPoint import jobs
│   │   ├── email.processor.ts        # Email sending jobs
│   │   ├── certificate.processor.ts  # Certificate generation
│   │   └── image.processor.ts        # Image optimization
│   ├── services/                     # Business logic
│   │   ├── pptx-parser.service.ts
│   │   ├── content-analyzer.service.ts
│   │   ├── email.service.ts
│   │   └── pdf.service.ts
│   └── utils/                        # Utility functions
│       ├── logger.ts
│       └── error-handler.ts
├── package.json                      # Package dependencies
├── tsconfig.json                     # TypeScript configuration
└── README.md                         # Worker documentation
```

**Key Files Explained:**

- **processors/**: BullMQ job processors (one per queue)
- **services/**: Business logic for complex operations
- **main.ts**: Starts worker and registers processors

---

## Packages Directory

### packages/types/ - Shared TypeScript Types

**Purpose:** Type definitions shared across apps

```
packages/types/
├── src/
│   ├── index.ts                      # Barrel export
│   ├── entities/                     # Database entity types
│   │   ├── user.types.ts
│   │   ├── course.types.ts
│   │   ├── lesson.types.ts
│   │   ├── slide.types.ts
│   │   ├── content-block.types.ts
│   │   ├── quiz.types.ts
│   │   └── enrollment.types.ts
│   ├── dto/                          # Data transfer objects
│   │   ├── auth.dto.ts
│   │   ├── lesson.dto.ts
│   │   └── quiz.dto.ts
│   ├── enums/                        # Enumerations
│   │   ├── user-role.enum.ts
│   │   ├── lesson-status.enum.ts
│   │   ├── content-block-type.enum.ts
│   │   └── quiz-question-type.enum.ts
│   └── common/                       # Common types
│       ├── pagination.types.ts
│       ├── response.types.ts
│       └── error.types.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Usage:**

```typescript
import { User, Course, LessonStatus } from '@bibliology/types';
```

---

### packages/validation/ - Zod Validation Schemas

**Purpose:** Validation schemas shared between frontend and backend

```
packages/validation/
├── src/
│   ├── index.ts                      # Barrel export
│   ├── auth/                         # Auth schemas
│   │   ├── login.schema.ts
│   │   └── register.schema.ts
│   ├── course/                       # Course schemas
│   │   ├── create-course.schema.ts
│   │   └── update-course.schema.ts
│   ├── lesson/                       # Lesson schemas
│   │   ├── create-lesson.schema.ts
│   │   ├── update-lesson.schema.ts
│   │   └── create-slide.schema.ts
│   ├── quiz/                         # Quiz schemas
│   │   ├── create-quiz.schema.ts
│   │   ├── create-question.schema.ts
│   │   └── submit-quiz.schema.ts
│   └── common/                       # Common schemas
│       ├── pagination.schema.ts
│       └── id.schema.ts
├── package.json
├── tsconfig.json
└── README.md
```

**Usage:**

```typescript
import { createLessonSchema, CreateLessonDto } from '@bibliology/validation';

// Backend (NestJS)
@UsePipes(new ZodValidationPipe(createLessonSchema))
create(@Body() dto: CreateLessonDto) { ... }

// Frontend (React Hook Form)
const form = useForm<CreateLessonDto>({
  resolver: zodResolver(createLessonSchema),
});
```

---

### packages/utils/ - Shared Utilities

**Purpose:** Utility functions used across multiple apps

```
packages/utils/
├── src/
│   ├── index.ts                      # Barrel export
│   ├── date/                         # Date utilities
│   │   ├── format.ts
│   │   ├── parse.ts
│   │   └── diff.ts
│   ├── string/                       # String utilities
│   │   ├── slugify.ts
│   │   ├── truncate.ts
│   │   └── sanitize.ts
│   ├── array/                        # Array utilities
│   │   ├── chunk.ts
│   │   ├── unique.ts
│   │   └── sort.ts
│   ├── validation/                   # Validation helpers
│   │   ├── email.ts
│   │   └── url.ts
│   └── crypto/                       # Cryptography utilities
│       ├── hash.ts
│       └── random.ts
├── package.json
├── tsconfig.json
└── README.md
```

---

## Prisma Directory

**Purpose:** Database schema, migrations, and seeding

```
prisma/
├── schema.prisma                     # Main Prisma schema
├── migrations/                       # Migration files
│   ├── 20250101000000_init/
│   │   └── migration.sql
│   ├── 20250102000000_add_slides/
│   │   └── migration.sql
│   └── migration_lock.toml
├── seeds/                            # Seed data
│   ├── users.seed.ts
│   ├── courses.seed.ts
│   └── lessons.seed.ts
└── seed.ts                           # Main seed script
```

---

## Configuration Directory

**Purpose:** Shared configuration for linting and TypeScript

```
config/
├── eslint/
│   ├── base.js                       # Base ESLint config
│   ├── react.js                      # React-specific rules
│   └── node.js                       # Node-specific rules
└── typescript/
    ├── base.json                     # Base TypeScript config
    ├── node.json                     # Node-specific config
    └── react.json                    # React-specific config
```

---

## Scripts Directory

**Purpose:** Development and deployment scripts

```
scripts/
├── setup-local.sh                    # Set up local dev environment
├── seed-dev-data.ts                  # Seed development data
├── backup-db.sh                      # Backup database
├── deploy-staging.sh                 # Deploy to staging
└── generate-types.ts                 # Generate types from Prisma
```

---

## GitHub Directory

**Purpose:** CI/CD and GitHub configuration

```
.github/
├── workflows/
│   ├── ci.yml                        # CI pipeline (lint, test, build)
│   ├── deploy-api.yml                # Deploy backend to Render
│   ├── deploy-web.yml                # Deploy frontend to Vercel
│   └── pr-checks.yml                 # PR validation
├── ISSUE_TEMPLATE/
│   ├── bug_report.md
│   ├── feature_request.md
│   └── config.yml
└── pull_request_template.md
```

---

## Root-Level Files

### package.json (Root)

```json
{
  "name": "bibliology",
  "version": "1.0.0",
  "private": true,
  "workspaces": ["apps/*", "packages/*"],
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "test": "turbo run test",
    "lint": "turbo run lint",
    "format": "prettier --write \"**/*.{ts,tsx,md}\"",
    "clean": "turbo run clean && rm -rf node_modules",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "devDependencies": {
    "turbo": "^1.10.0",
    "prettier": "^3.0.0",
    "eslint": "^8.50.0",
    "typescript": "^5.2.0"
  },
  "engines": {
    "node": ">=18.0.0",
    "pnpm": ">=8.0.0"
  }
}
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### turbo.json

```json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**", "build/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["build"],
      "outputs": ["coverage/**"]
    },
    "lint": {
      "outputs": []
    },
    "clean": {
      "cache": false
    }
  }
}
```

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: bibliology
      POSTGRES_PASSWORD: dev_password
      POSTGRES_DB: bibliology_dev
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - '6379:6379'
    volumes:
      - redis_data:/data

  minio:
    image: minio/minio
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - '9000:9000'
      - '9001:9001'
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

---

## File Naming Conventions

### General Rules

- **Files:** kebab-case (e.g., `lesson-builder.tsx`)
- **Components:** PascalCase (e.g., `LessonBuilder.tsx`)
- **Types/Interfaces:** PascalCase (e.g., `User`, `LessonDto`)
- **Functions:** camelCase (e.g., `createLesson`)
- **Constants:** SCREAMING_SNAKE_CASE (e.g., `API_BASE_URL`)

### Specific Patterns

- **Components:** `ComponentName.tsx`
- **Hooks:** `useHookName.ts`
- **Services:** `service-name.service.ts`
- **Repositories:** `entity-name.repository.ts`
- **DTOs:** `dto-name.dto.ts`
- **Tests:** `file-name.spec.ts` or `file-name.test.ts`
- **E2E Tests:** `feature.e2e-spec.ts`

---

## Import Aliases

Configure path aliases in `tsconfig.json`:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"],
      "@components/*": ["src/components/*"],
      "@pages/*": ["src/pages/*"],
      "@hooks/*": ["src/hooks/*"],
      "@lib/*": ["src/lib/*"],
      "@bibliology/types": ["packages/types/src"],
      "@bibliology/validation": ["packages/validation/src"],
      "@bibliology/utils": ["packages/utils/src"]
    }
  }
}
```

**Usage:**

```typescript
// Instead of: import { Button } from '../../../components/ui/button'
import { Button } from '@components/ui/button';

// Instead of: import { User } from '../../packages/types/src/user'
import { User } from '@bibliology/types';
```

---

## Environment Variables

### Backend (.env)

```bash
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/bibliology_dev"

# Redis
REDIS_URL="redis://localhost:6379"

# JWT
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="15m"
REFRESH_TOKEN_EXPIRES_IN="7d"

# Storage (S3)
S3_ENDPOINT="http://localhost:9000"
S3_ACCESS_KEY="minioadmin"
S3_SECRET_KEY="minioadmin"
S3_BUCKET="bibliology-assets"

# App
NODE_ENV="development"
PORT=3000
FRONTEND_URL="http://localhost:5173"

# Email (future)
# SMTP_HOST=
# SMTP_PORT=
# SMTP_USER=
# SMTP_PASS=
```

### Frontend (.env)

```bash
VITE_API_URL="http://localhost:3000"
VITE_APP_NAME="Bibliology"
VITE_ENABLE_ANALYTICS=false
```

---

## Development Workflow

### Initial Setup

```bash
# Clone repository
git clone <repo-url>
cd bibliology

# Install dependencies
pnpm install

# Start local services (Postgres, Redis, MinIO)
docker-compose up -d

# Generate Prisma client
pnpm db:generate

# Run migrations
pnpm db:migrate

# Seed database
pnpm db:seed

# Start all apps in development mode
pnpm dev
```

### Development Commands

```bash
# Run everything in dev mode
pnpm dev

# Run specific app
pnpm dev --filter=@bibliology/api
pnpm dev --filter=@bibliology/web

# Build everything
pnpm build

# Run tests
pnpm test

# Lint
pnpm lint

# Format code
pnpm format

# Clean build artifacts
pnpm clean
```

---

## Scalability Considerations

### Current Structure (MVP)

- All apps in single monorepo
- Shared packages for code reuse
- Single database instance
- Single Redis instance

### Future Growth (Post-MVP)

**Phase 2:**

- Add mobile app (React Native) to `apps/mobile/`
- Add admin dashboard to `apps/admin/`
- Extract UI library to `packages/ui/`

**Phase 3:**

- Microservices: Extract imports service to separate repo
- Multiple databases: Read replicas for lessons
- Caching layer: Add CDN for static content

**Phase 4:**

- Multi-region deployment
- Separate storage per region
- GraphQL API alongside REST

The current structure supports all these evolutions without major refactoring.

---

## Summary

This project structure is designed to:

1. **Minimize bugs** through clear separation of concerns
2. **Enable rapid development** with shared packages
3. **Support multiple developers** with clear module boundaries
4. **Scale easily** from MVP to production
5. **Maintain consistency** with strict conventions
6. **Simplify testing** with isolated modules
7. **Enable independent deployment** of apps

**Next Steps:**

1. Review and approve this structure
2. Initialize the monorepo with this structure
3. Set up base configuration files
4. Implement authentication module
5. Create database schema
