# Prisma Database Setup

This directory contains the Prisma schema and database migrations for Bibliology.

## Prerequisites

1. **PostgreSQL 15+** running on `localhost:5432`
2. **Environment variables** configured (see root `.env.example`)

## Quick Start

### 1. Start Database Services

```bash
# From project root
docker-compose up -d postgres redis
```

### 2. Create Database

```bash
# If using Docker Compose, the database is auto-created
# Otherwise, create manually:
createdb bibliology
```

### 3. Set Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Update DATABASE_URL if needed
# Default: postgresql://postgres:postgres@localhost:5432/bibliology
```

### 4. Generate Prisma Client

```bash
# From project root
pnpm db:generate
```

### 5. Run Migrations

```bash
# Development (creates migration if needed)
pnpm --filter @bibliology/api db:migrate:dev

# Production
pnpm --filter @bibliology/api db:migrate
```

### 6. Seed Database

```bash
# From project root
pnpm --filter @bibliology/api db:seed
```

## Database Commands

All commands should be run from the project root:

```bash
# Generate Prisma Client
pnpm db:generate

# Create a new migration
pnpm --filter @bibliology/api db:migrate:dev --name migration_name

# Apply migrations (production)
pnpm --filter @bibliology/api db:migrate

# Open Prisma Studio (GUI)
pnpm --filter @bibliology/api db:studio

# Seed database
pnpm --filter @bibliology/api db:seed

# Reset database (⚠️ DESTRUCTIVE - drops all data)
pnpm --filter @bibliology/api db:reset
```

## Schema Overview

### Core Entities

- **User**: Students, teachers, and admins
- **Course**: Top-level learning containers
- **Lesson**: Individual lessons within courses
- **Slide**: Presentation-style content delivery
- **ContentBlock**: Flexible content units (text, images, verses, etc.)

### Assessment

- **Quiz**: Assessments for lessons
- **Question**: Individual quiz questions (multiple types)
- **QuizSubmission**: Student quiz attempts
- **QuestionAnswer**: Individual answers within submissions

### Progress Tracking

- **Enrollment**: Student enrollment in courses
- **LessonProgress**: Track student progress through lessons
- **StudentNote**: Student-created notes during lessons
- **Certificate**: Completion certificates

### System

- **ActivityLog**: Audit trail of user actions

## Bilingual Content Strategy

This schema uses **separate columns** for English and French content:

```prisma
model Course {
  title_en       String
  title_fr       String?
  description_en String @db.Text
  description_fr String? @db.Text
}
```

**Why not JSONB?**
- Better type safety
- Simpler queries
- Easier to index
- Clear null handling for missing translations

## Content Blocks (JSONB)

Content blocks use JSONB for maximum flexibility:

```typescript
// TEXT block
{
  text: "The Holy Spirit is...",
  formatting: { bold: true }
}

// VERSE block
{
  reference: "John 3:16",
  text: "For God so loved...",
  translation: "NIV"
}

// LIST block
{
  items: ["Item 1", "Item 2"],
  style: "bullet"
}
```

## Seeded Data

After running `db:seed`, you'll have:

### Users (password: `password123`)
- `admin@bibliology.com` (Admin)
- `teacher@bibliology.com` (Teacher)
- `student.en@example.com` (Student - English)
- `student.fr@example.com` (Student - French)

### Content
- 1 course: "Introduction to Pneumatology"
- 3 lessons (2 published, 1 draft)
- Multiple slides with content blocks
- 1 quiz with 3 questions
- Sample student progress and submissions

## Migration Strategy

### Development
```bash
# 1. Modify schema.prisma
# 2. Create migration
pnpm --filter @bibliology/api db:migrate:dev --name add_field_name

# 3. Migration is auto-applied to dev database
```

### Production
```bash
# 1. Migrations are committed to git
# 2. Deploy runs: pnpm db:migrate
# 3. Migrations are applied automatically
```

## Troubleshooting

### Connection Refused
```bash
# Check PostgreSQL is running
docker-compose ps

# Check connection string
echo $DATABASE_URL
```

### Migration Conflicts
```bash
# Reset database (⚠️ DESTRUCTIVE)
pnpm --filter @bibliology/api db:reset

# Or manually resolve in migrations folder
```

### Prisma Client Out of Sync
```bash
# Regenerate client
pnpm db:generate
```

## Best Practices

1. **Never edit migrations manually** after they're applied
2. **Always create migrations in development** before pushing
3. **Test migrations on staging** before production
4. **Backup production database** before running migrations
5. **Use transactions** for complex data migrations
6. **Version control** all migration files

## Schema Conventions

- **Table names**: Lowercase with underscores (`users`, `lesson_progress`)
- **Column names**: Lowercase with underscores (`created_at`, `title_en`)
- **Relations**: Descriptive names (`courses_taught`, not `user_courses`)
- **Indexes**: On foreign keys and frequently queried fields
- **Enums**: SCREAMING_SNAKE_CASE (`STUDENT`, `PUBLISHED`)

## References

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Architecture Decision Records](../../docs/architecture/)
