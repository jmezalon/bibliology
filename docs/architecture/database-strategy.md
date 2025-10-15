# Database Strategy

**Project:** Bibliology - Bible Study Learning Platform
**Database:** PostgreSQL 15+
**ORM:** Prisma
**Date:** 2025-10-15

---

## Table of Contents

1. [Schema Design Philosophy](#schema-design-philosophy)
2. [Bilingual Content Strategy](#bilingual-content-strategy)
3. [Complete Prisma Schema](#complete-prisma-schema)
4. [Index Strategy](#index-strategy)
5. [Migration Strategy](#migration-strategy)
6. [Query Patterns](#query-patterns)
7. [Performance Optimization](#performance-optimization)
8. [Backup & Recovery](#backup--recovery)

---

## Schema Design Philosophy

### Core Principles

1. **Normalize where it matters** - Avoid data duplication for core entities
2. **Denormalize for performance** - Pre-calculate frequently accessed aggregates
3. **JSONB for flexibility** - Use JSONB for variable content structures
4. **Strong typing** - Leverage enums and constraints
5. **Audit trail** - Track created/updated timestamps
6. **Soft deletes** - Archive instead of hard delete (future consideration)

### Design Decisions

**Separate EN/FR columns vs JSONB language object:**
- ✅ **Decision:** Separate columns (`title_en`, `title_fr`)
- **Rationale:**
  - Simpler queries: `WHERE title_en ILIKE '%search%'`
  - Better indexing: Can index each language separately
  - Type safety: Prisma generates proper types
  - Easier to make one language required, other optional
- **Trade-off:** More columns, but worth it for simplicity

**JSONB for content blocks:**
- ✅ **Decision:** Use JSONB for `content_en` and `content_fr` in content_blocks
- **Rationale:**
  - Content structure varies by block type (text vs image vs verse)
  - Flexibility to add new block types without schema changes
  - Can still query inside JSONB with Postgres JSON operators
- **Trade-off:** Less type safety, but Zod validation handles that

**Denormalized progress fields:**
- ✅ **Decision:** Store `progress_percentage`, `lessons_completed` in enrollments table
- **Rationale:**
  - Dashboard queries are very frequent
  - Calculating from lesson_progress every time is expensive
  - Update via triggers or application logic
- **Trade-off:** Must keep in sync, but performance gain is worth it

---

## Bilingual Content Strategy

### Entity-Level Bilingualism

Fields that have translations:
- `title_en` / `title_fr`
- `description_en` / `description_fr`
- `content_en` / `content_fr`
- `question_text_en` / `question_text_fr`
- etc.

### Rules

1. **English is required** - All `_en` fields are `NOT NULL`
2. **French is optional** - All `_fr` fields are nullable initially
3. **Frontend shows both** - Users can toggle language
4. **Fallback to English** - If `_fr` is null, show `_en`

### Future Enhancement

**Phase 2:** Add a `translations` table for more languages

```sql
CREATE TABLE translations (
  id UUID PRIMARY KEY,
  entity_type VARCHAR(50), -- 'lesson', 'course', etc.
  entity_id UUID,
  field_name VARCHAR(50),  -- 'title', 'description'
  language_code VARCHAR(5), -- 'en', 'fr', 'es'
  translation TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

---

## Complete Prisma Schema

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  STUDENT
  TEACHER
  ADMIN
}

enum LessonStatus {
  DRAFT
  PUBLISHED
  ARCHIVED
}

enum ContentBlockType {
  HEADING
  TEXT
  IMAGE
  VERSE
  VOCABULARY
  LIST
  CALLOUT
  QUIZ
  DIVIDER
}

enum QuestionType {
  MULTIPLE_CHOICE
  TRUE_FALSE
  SHORT_ANSWER
  FILL_BLANK
  MATCHING
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  DROPPED
}

enum LessonProgressStatus {
  NOT_STARTED
  IN_PROGRESS
  COMPLETED
}

enum SlideLayout {
  TITLE
  CONTENT
  TWO_COLUMN
  IMAGE_FOCUS
  QUIZ
  BLANK
}

// ============================================================================
// USER MANAGEMENT
// ============================================================================

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  password_hash String
  name          String
  role          UserRole @default(STUDENT)
  avatar_url    String?
  language_pref String   @default("en") // 'en' or 'fr'

  // Timestamps
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt
  last_login DateTime?

  // Relations
  courses_taught   Course[]           @relation("TeacherCourses")
  enrollments      Enrollment[]
  lesson_progress  LessonProgress[]
  quiz_submissions QuizSubmission[]
  certificates     Certificate[]
  notes            StudentNote[]

  @@index([email])
  @@index([role])
  @@map("users")
}

// ============================================================================
// COURSE & LESSON STRUCTURE
// ============================================================================

model Course {
  id              String        @id @default(cuid())
  slug            String        @unique
  teacher_id      String

  // Bilingual fields
  title_en        String
  title_fr        String?
  description_en  String        @db.Text
  description_fr  String?       @db.Text

  // Media
  thumbnail_url   String?
  cover_image_url String?

  // Metadata
  status          LessonStatus  @default(DRAFT)
  category        String?       // 'Theology', 'Biblical Studies', etc.
  tags            String[]      // ['Pneumatology', 'Holy Spirit']
  estimated_hours Int?
  difficulty      String?       // 'Beginner', 'Intermediate', 'Advanced'

  // Timestamps
  created_at      DateTime      @default(now())
  updated_at      DateTime      @updatedAt
  published_at    DateTime?

  // Relations
  teacher      User         @relation("TeacherCourses", fields: [teacher_id], references: [id], onDelete: Restrict)
  lessons      Lesson[]
  enrollments  Enrollment[]
  certificates Certificate[]

  @@index([teacher_id])
  @@index([status])
  @@index([slug])
  @@map("courses")
}

model Lesson {
  id              String       @id @default(cuid())
  slug            String       @unique
  course_id       String

  // Bilingual fields
  title_en        String
  title_fr        String?
  description_en  String?      @db.Text
  description_fr  String?      @db.Text

  // Ordering & metadata
  lesson_order    Int
  status          LessonStatus @default(DRAFT)
  estimated_minutes Int?

  // PowerPoint import tracking
  imported_from_pptx  Boolean @default(false)
  original_filename   String?
  import_date         DateTime?

  // Timestamps
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt
  published_at    DateTime?

  // Relations
  course           Course            @relation(fields: [course_id], references: [id], onDelete: Cascade)
  slides           Slide[]
  lesson_progress  LessonProgress[]
  certificates     Certificate[]

  @@unique([course_id, lesson_order])
  @@index([course_id])
  @@index([status])
  @@index([slug])
  @@map("lessons")
}

model Slide {
  id          String      @id @default(cuid())
  lesson_id   String

  slide_order Int
  layout      SlideLayout @default(CONTENT)

  // Bilingual fields
  title_en    String?
  title_fr    String?
  notes_en    String?     @db.Text  // Teacher notes
  notes_fr    String?     @db.Text

  // Timestamps
  created_at  DateTime    @default(now())
  updated_at  DateTime    @updatedAt

  // Relations
  lesson         Lesson         @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  content_blocks ContentBlock[]
  quizzes        Quiz[]

  @@unique([lesson_id, slide_order])
  @@index([lesson_id])
  @@map("slides")
}

model ContentBlock {
  id           String           @id @default(cuid())
  slide_id     String

  block_order  Int
  block_type   ContentBlockType

  // Content stored as JSONB (varies by type)
  content_en   Json
  content_fr   Json?

  // Styling configuration (also JSONB)
  style_config Json?  // { fontSize, color, alignment, etc. }

  // Timestamps
  created_at   DateTime         @default(now())
  updated_at   DateTime         @updatedAt

  // Relations
  slide Slide @relation(fields: [slide_id], references: [id], onDelete: Cascade)

  @@unique([slide_id, block_order])
  @@index([slide_id])
  @@index([block_type])
  @@map("content_blocks")
}

// ============================================================================
// QUIZ & ASSESSMENT
// ============================================================================

model Quiz {
  id         String   @id @default(cuid())
  lesson_id  String
  slide_id   String?  // Optional: quiz can be at end of lesson or on slide

  // Bilingual fields
  title_en   String
  title_fr   String?

  // Configuration
  passing_score_percentage Int @default(70)
  time_limit_minutes       Int?
  shuffle_questions        Boolean @default(false)
  shuffle_options          Boolean @default(false)
  allow_review             Boolean @default(true)
  show_correct_answers     Boolean @default(true)
  max_attempts             Int?

  // Timestamps
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  lesson      Lesson           @relation(fields: [lesson_id], references: [id], onDelete: Cascade)
  slide       Slide?           @relation(fields: [slide_id], references: [id], onDelete: Cascade)
  questions   Question[]
  submissions QuizSubmission[]

  @@index([lesson_id])
  @@index([slide_id])
  @@map("quizzes")
}

model Question {
  id              String       @id @default(cuid())
  quiz_id         String

  question_order  Int
  question_type   QuestionType

  // Bilingual fields (stored as JSONB for rich formatting)
  question_text_en Json
  question_text_fr Json?

  // Options (for MCQ, matching, etc.)
  options_en       Json?  // Array of option strings/objects
  options_fr       Json?

  // Correct answer(s)
  correct_answers  Json   // Format varies by question type

  // Explanation
  explanation_en   Json?
  explanation_fr   Json?

  // Scoring
  points           Int    @default(1)

  // Timestamps
  created_at       DateTime @default(now())
  updated_at       DateTime @updatedAt

  // Relations
  quiz     Quiz             @relation(fields: [quiz_id], references: [id], onDelete: Cascade)
  answers  QuestionAnswer[]

  @@unique([quiz_id, question_order])
  @@index([quiz_id])
  @@map("questions")
}

model QuizSubmission {
  id               String   @id @default(cuid())
  quiz_id          String
  student_id       String

  // Scoring
  score_percentage Int
  points_earned    Int
  total_points     Int
  passed           Boolean

  // Timing
  time_spent_seconds Int?

  // Timestamps
  started_at    DateTime  @default(now())
  submitted_at  DateTime?
  updated_at    DateTime  @updatedAt

  // Relations
  quiz     Quiz             @relation(fields: [quiz_id], references: [id], onDelete: Cascade)
  student  User             @relation(fields: [student_id], references: [id], onDelete: Cascade)
  answers  QuestionAnswer[]

  @@index([quiz_id])
  @@index([student_id])
  @@index([submitted_at])
  @@map("quiz_submissions")
}

model QuestionAnswer {
  id            String  @id @default(cuid())
  submission_id String
  question_id   String

  // Answer given by student (format varies by question type)
  answer_given  Json

  // Grading
  is_correct    Boolean
  points_earned Int

  // Timestamps
  answered_at   DateTime @default(now())

  // Relations
  submission QuizSubmission @relation(fields: [submission_id], references: [id], onDelete: Cascade)
  question   Question       @relation(fields: [question_id], references: [id], onDelete: Cascade)

  @@unique([submission_id, question_id])
  @@index([submission_id])
  @@index([question_id])
  @@map("question_answers")
}

// ============================================================================
// PROGRESS TRACKING
// ============================================================================

model Enrollment {
  id                  String           @id @default(cuid())
  student_id          String
  course_id           String

  status              EnrollmentStatus @default(ACTIVE)

  // Denormalized progress (updated by triggers/app logic)
  progress_percentage Int              @default(0)
  lessons_completed   Int              @default(0)
  total_lessons       Int              @default(0)

  // Timestamps
  enrolled_at         DateTime         @default(now())
  last_accessed_at    DateTime         @default(now())
  completed_at        DateTime?

  // Relations
  student         User             @relation(fields: [student_id], references: [id], onDelete: Cascade)
  course          Course           @relation(fields: [course_id], references: [id], onDelete: Cascade)
  lesson_progress LessonProgress[]

  @@unique([student_id, course_id])
  @@index([student_id])
  @@index([course_id])
  @@index([status])
  @@map("enrollments")
}

model LessonProgress {
  id              String               @id @default(cuid())
  enrollment_id   String
  lesson_id       String

  status          LessonProgressStatus @default(NOT_STARTED)

  // Progress tracking
  current_slide_index   Int @default(0)
  total_slides_viewed   Int @default(0)
  time_spent_seconds    Int @default(0)

  // Timestamps
  started_at    DateTime  @default(now())
  completed_at  DateTime?
  updated_at    DateTime  @updatedAt

  // Relations
  enrollment Enrollment @relation(fields: [enrollment_id], references: [id], onDelete: Cascade)
  lesson     Lesson     @relation(fields: [lesson_id], references: [id], onDelete: Cascade)

  @@unique([enrollment_id, lesson_id])
  @@index([enrollment_id])
  @@index([lesson_id])
  @@index([status])
  @@map("lesson_progress")
}

// ============================================================================
// STUDENT FEATURES
// ============================================================================

model StudentNote {
  id         String   @id @default(cuid())
  student_id String
  lesson_id  String
  slide_index Int

  // Note content
  note_text  String   @db.Text

  // Timestamps
  created_at DateTime @default(now())
  updated_at DateTime @updatedAt

  // Relations
  student User   @relation(fields: [student_id], references: [id], onDelete: Cascade)
  // lesson  Lesson @relation(fields: [lesson_id], references: [id], onDelete: Cascade)

  @@index([student_id])
  @@index([lesson_id])
  @@map("student_notes")
}

model Certificate {
  id              String   @id @default(cuid())
  user_id         String
  course_id       String?
  lesson_id       String?  // Can be for course completion or single lesson

  // Certificate data
  certificate_url String   // S3 URL to PDF
  certificate_number String @unique  // Unique certificate number

  // Timestamps
  issued_at       DateTime @default(now())

  // Relations
  user   User    @relation(fields: [user_id], references: [id], onDelete: Cascade)
  course Course? @relation(fields: [course_id], references: [id], onDelete: SetNull)
  lesson Lesson? @relation(fields: [lesson_id], references: [id], onDelete: SetNull)

  @@index([user_id])
  @@index([course_id])
  @@index([issued_at])
  @@map("certificates")
}

// ============================================================================
// SYSTEM TABLES
// ============================================================================

model ActivityLog {
  id         String   @id @default(cuid())
  user_id    String?

  // Activity details
  action     String   // 'LOGIN', 'CREATE_LESSON', 'SUBMIT_QUIZ', etc.
  entity_type String? // 'lesson', 'quiz', 'course'
  entity_id  String?

  // Metadata
  ip_address String?
  user_agent String?
  metadata   Json?    // Additional context

  // Timestamps
  created_at DateTime @default(now())

  @@index([user_id])
  @@index([action])
  @@index([created_at])
  @@map("activity_logs")
}
```

---

## Index Strategy

### Primary Indexes

**Automatically created by Prisma:**
- Primary keys (`@id`)
- Unique constraints (`@unique`)
- Foreign keys (implicit)

### Secondary Indexes

**For common queries:**

```prisma
// User lookups
@@index([email])
@@index([role])

// Course/Lesson filtering
@@index([status])
@@index([course_id])

// Progress tracking
@@index([student_id, course_id])
@@index([enrollment_id, lesson_id])

// Time-based queries
@@index([created_at])
@@index([published_at])
```

### Composite Indexes

For queries that filter on multiple columns:

```prisma
// Find lessons in a specific course with specific status
@@index([course_id, status])

// Find student's progress in active enrollments
@@index([student_id, status, last_accessed_at])
```

### JSONB Indexes (GIN)

For searching inside JSONB fields:

```sql
-- Create GIN index for content search
CREATE INDEX idx_content_blocks_content_en_gin
ON content_blocks USING GIN (content_en jsonb_path_ops);

CREATE INDEX idx_content_blocks_content_fr_gin
ON content_blocks USING GIN (content_fr jsonb_path_ops);
```

### Full-Text Search Indexes

For text search (Phase 2):

```sql
-- Add tsvector column
ALTER TABLE lessons ADD COLUMN search_vector tsvector;

-- Create GIN index
CREATE INDEX idx_lessons_search_vector
ON lessons USING GIN (search_vector);

-- Update trigger to maintain search_vector
CREATE OR REPLACE FUNCTION update_lesson_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('english', COALESCE(NEW.title_en, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW.description_en, '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER lesson_search_vector_update
BEFORE INSERT OR UPDATE ON lessons
FOR EACH ROW EXECUTE FUNCTION update_lesson_search_vector();
```

---

## Migration Strategy

### Migration Workflow

```bash
# 1. Modify schema.prisma
# 2. Create migration
pnpm prisma migrate dev --name descriptive_name

# 3. Review generated SQL
# 4. Test migration on dev database
# 5. Commit migration files
# 6. Apply to other environments
```

### Migration Best Practices

1. **Descriptive names:**
   ```bash
   pnpm prisma migrate dev --name add_user_avatar
   pnpm prisma migrate dev --name add_quiz_time_limit
   pnpm prisma migrate dev --name create_certificates_table
   ```

2. **Small, focused migrations:**
   - One logical change per migration
   - Easier to debug and rollback

3. **Test before committing:**
   ```bash
   # Reset database
   pnpm prisma migrate reset

   # Apply all migrations
   pnpm prisma migrate dev

   # Seed data
   pnpm prisma db seed

   # Verify everything works
   ```

4. **Handle data migrations:**
   For changes that affect existing data, add custom SQL:

   ```sql
   -- migration.sql
   -- AlterTable
   ALTER TABLE "users" ADD COLUMN "avatar_url" TEXT;

   -- DataUpdate
   UPDATE "users" SET "avatar_url" = 'https://example.com/default-avatar.png';
   ```

5. **Document breaking changes:**
   ```sql
   -- WARNING: This migration will delete all existing quiz submissions
   -- Backup data before applying

   DROP TABLE "quiz_submissions";
   ```

### Production Migrations

```bash
# 1. Test thoroughly in staging
# 2. Backup production database
# 3. Apply migration
pnpm prisma migrate deploy

# 4. Verify migration succeeded
# 5. Monitor application for errors
```

---

## Query Patterns

### Common Queries (with Prisma)

**1. Get course with all lessons for student:**
```typescript
const course = await prisma.course.findUnique({
  where: { id: courseId },
  include: {
    lessons: {
      where: { status: 'PUBLISHED' },
      orderBy: { lesson_order: 'asc' },
      include: {
        lesson_progress: {
          where: {
            enrollment: {
              student_id: studentId
            }
          }
        }
      }
    },
    enrollments: {
      where: { student_id: studentId }
    }
  }
});
```

**2. Get lesson with all slides and content blocks:**
```typescript
const lesson = await prisma.lesson.findUnique({
  where: { id: lessonId },
  include: {
    slides: {
      orderBy: { slide_order: 'asc' },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' }
        },
        quizzes: {
          include: {
            questions: {
              orderBy: { question_order: 'asc' }
            }
          }
        }
      }
    }
  }
});
```

**3. Get student dashboard data:**
```typescript
const dashboard = await prisma.user.findUnique({
  where: { id: studentId },
  include: {
    enrollments: {
      where: { status: 'ACTIVE' },
      include: {
        course: {
          select: {
            id: true,
            title_en: true,
            thumbnail_url: true
          }
        },
        lesson_progress: {
          where: { status: 'COMPLETED' }
        }
      },
      orderBy: { last_accessed_at: 'desc' }
    },
    certificates: {
      take: 5,
      orderBy: { issued_at: 'desc' }
    }
  }
});
```

**4. Get quiz results with statistics:**
```typescript
const results = await prisma.quizSubmission.findMany({
  where: {
    student_id: studentId,
    submitted_at: { not: null }
  },
  include: {
    quiz: {
      select: {
        title_en: true,
        passing_score_percentage: true
      }
    },
    answers: {
      include: {
        question: {
          select: {
            question_text_en: true,
            points: true
          }
        }
      }
    }
  },
  orderBy: { submitted_at: 'desc' }
});
```

**5. Search lessons (with JSONB query):**
```typescript
const lessons = await prisma.$queryRaw`
  SELECT l.*, c.title_en as course_title
  FROM lessons l
  JOIN courses c ON l.course_id = c.id
  WHERE l.status = 'PUBLISHED'
    AND (
      l.title_en ILIKE ${`%${searchTerm}%`}
      OR l.description_en ILIKE ${`%${searchTerm}%`}
      OR EXISTS (
        SELECT 1 FROM content_blocks cb
        WHERE cb.lesson_id = l.id
          AND cb.content_en::text ILIKE ${`%${searchTerm}%`}
      )
    )
  LIMIT 20
`;
```

### Performance Optimizations

**1. Select only needed fields:**
```typescript
// Bad: Fetches all fields
const courses = await prisma.course.findMany();

// Good: Only fetch what you need
const courses = await prisma.course.findMany({
  select: {
    id: true,
    title_en: true,
    thumbnail_url: true,
    _count: {
      select: { lessons: true }
    }
  }
});
```

**2. Use pagination:**
```typescript
const lessons = await prisma.lesson.findMany({
  where: { course_id: courseId },
  skip: (page - 1) * pageSize,
  take: pageSize,
  orderBy: { lesson_order: 'asc' }
});
```

**3. Batch queries with dataloader (if needed):**
```typescript
import DataLoader from 'dataloader';

const lessonLoader = new DataLoader(async (lessonIds: string[]) => {
  const lessons = await prisma.lesson.findMany({
    where: { id: { in: lessonIds } }
  });

  const lessonMap = new Map(lessons.map(l => [l.id, l]));
  return lessonIds.map(id => lessonMap.get(id));
});
```

---

## Performance Optimization

### Connection Pooling

**Prisma Client (built-in):**
```typescript
// prisma/client.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

export default prisma;
```

**Recommended connection pool settings for Render:**
```bash
DATABASE_URL="postgresql://user:pass@host:5432/db?connection_limit=10&pool_timeout=20"
```

### Query Optimization

**1. Use `include` wisely:**
```typescript
// Don't over-fetch
const lesson = await prisma.lesson.findUnique({
  where: { id },
  include: {
    slides: {
      include: {
        content_blocks: true,
        // Don't include everything
        // quizzes: { include: { questions: true } }
      }
    }
  }
});
```

**2. Leverage database-level aggregations:**
```typescript
const stats = await prisma.course.findUnique({
  where: { id: courseId },
  select: {
    _count: {
      select: {
        lessons: true,
        enrollments: true
      }
    }
  }
});
```

**3. Use transactions for data integrity:**
```typescript
await prisma.$transaction(async (tx) => {
  // Update enrollment
  await tx.enrollment.update({
    where: { id: enrollmentId },
    data: {
      lessons_completed: { increment: 1 },
      progress_percentage: newPercentage
    }
  });

  // Mark lesson complete
  await tx.lessonProgress.update({
    where: { id: progressId },
    data: {
      status: 'COMPLETED',
      completed_at: new Date()
    }
  });
});
```

### Caching Strategy (with Redis)

```typescript
// Cache frequently accessed data
async function getCourseWithLessons(courseId: string) {
  const cacheKey = `course:${courseId}:lessons`;

  // Check cache
  const cached = await redis.get(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Query database
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: true }
  });

  // Cache for 15 minutes
  await redis.setex(cacheKey, 900, JSON.stringify(course));

  return course;
}

// Invalidate cache on updates
async function updateLesson(lessonId: string, data: any) {
  const lesson = await prisma.lesson.update({
    where: { id: lessonId },
    data
  });

  // Invalidate course cache
  await redis.del(`course:${lesson.course_id}:lessons`);

  return lesson;
}
```

---

## Backup & Recovery

### Backup Strategy

**1. Automated daily backups (Render provides this):**
- Enabled in Render dashboard
- Retention: 7 days (free tier) or 30+ days (paid)

**2. Manual backups before major changes:**
```bash
# Export database
pg_dump $DATABASE_URL > backup-$(date +%Y%m%d).sql

# Compress
gzip backup-$(date +%Y%m%d).sql

# Upload to S3
aws s3 cp backup-$(date +%Y%m%d).sql.gz s3://bibliology-backups/
```

**3. Migration backups:**
```bash
# Before running migration in production
pg_dump $DATABASE_URL > pre-migration-backup.sql
```

### Recovery

**Restore from backup:**
```bash
# Download backup
aws s3 cp s3://bibliology-backups/backup-20250115.sql.gz .

# Decompress
gunzip backup-20250115.sql.gz

# Restore
psql $DATABASE_URL < backup-20250115.sql
```

**Point-in-time recovery (if supported by hosting):**
- Use Render's dashboard to restore to specific timestamp
- Or use PostgreSQL WAL archives (advanced)

---

## Summary

### Key Decisions

1. **Separate EN/FR columns** - Simpler queries, better indexing
2. **JSONB for content** - Flexibility for varied content types
3. **Denormalized progress** - Performance for dashboard queries
4. **Strong enums** - Type safety and data integrity
5. **Proper indexing** - Fast queries on common access patterns

### Next Steps

1. Review and approve this schema
2. Create initial Prisma migration
3. Set up seed data for development
4. Implement repository pattern in backend
5. Create data access layer with caching

This database strategy provides a solid foundation for the MVP and can scale as the platform grows.
