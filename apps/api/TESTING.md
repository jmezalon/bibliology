# Backend Testing Guide

## Overview

This document describes the test suite for the Bibliology API, focusing on student enrollment, progress tracking, notes, and analytics features.

## Test Structure

### Integration Tests (E2E)

All integration tests are located in `apps/api/test/integration/` and follow the pattern `*.e2e-spec.ts`.

#### Test Files

1. **enrollments.e2e-spec.ts** - Student enrollment flow
2. **progress.e2e-spec.ts** - Progress tracking and completion
3. **notes.e2e-spec.ts** - Student notes CRUD operations
4. **student-journey.e2e-spec.ts** - Complete student workflow integration test

### Test Coverage

#### Enrollments (enrollments.e2e-spec.ts)

**Covered Scenarios:**

- ✅ Student can enroll in a published course
- ✅ Cannot enroll twice in the same course (409 Conflict)
- ✅ Cannot enroll in non-existent course (404)
- ✅ Cannot enroll in unpublished/draft courses (403)
- ✅ Can reactivate dropped enrollments
- ✅ Can view all personal enrollments with filtering by status
- ✅ Can unenroll from course (soft delete - status becomes DROPPED)
- ✅ Cannot unenroll another student's enrollment (403)
- ✅ Authorization: Requires auth token
- ✅ Authorization: Teachers cannot enroll as students

**Endpoints Tested:**

- `POST /api/enrollments/courses/:courseId` - Enroll in course
- `GET /api/enrollments/me` - Get my enrollments
- `GET /api/enrollments/me?status=ACTIVE` - Filter enrollments by status
- `DELETE /api/enrollments/:id` - Unenroll from course

#### Progress Tracking (progress.e2e-spec.ts)

**Covered Scenarios:**

- ✅ Creates initial progress when first accessed
- ✅ Returns existing progress
- ✅ Updates progress manually
- ✅ Auto-completes when all slides viewed
- ✅ Updates enrollment progress when lesson completed
- ✅ Marks individual slides as viewed
- ✅ Handles viewing slides out of order
- ✅ Completes lesson via markSlideViewed endpoint
- ✅ Returns course-level progress with all lesson details
- ✅ Calculates estimated time remaining
- ✅ Handles concurrent progress updates
- ✅ Requires enrollment to access lesson progress (403)

**Endpoints Tested:**

- `GET /api/lessons/:lessonId/progress` - Get lesson progress
- `POST /api/lessons/:lessonId/progress` - Update lesson progress
- `POST /api/lessons/:lessonId/slides/view` - Mark slide as viewed
- `GET /api/courses/:courseId/progress` - Get course progress

**Auto-Completion Logic:**

- Lesson status transitions: NOT_STARTED → IN_PROGRESS → COMPLETED
- Completion happens when `total_slides_viewed >= total_slides_in_lesson`
- Enrollment progress updates automatically when lessons complete
- Enrollment becomes COMPLETED when all lessons are complete

#### Student Notes (notes.e2e-spec.ts)

**Covered Scenarios:**

- ✅ Create notes on any slide
- ✅ Handle very long notes (10,000 characters)
- ✅ Validate required fields (400 error)
- ✅ Prevent notes on non-existent lessons (404)
- ✅ Retrieve notes ordered by slide index
- ✅ Data isolation - students only see their own notes
- ✅ Update own notes
- ✅ Cannot update another student's note (403)
- ✅ Delete own notes
- ✅ Cannot delete another student's note (403)
- ✅ Authorization required for all operations

**Endpoints Tested:**

- `POST /api/notes` - Create note
- `GET /api/lessons/:lessonId/notes` - Get all notes for a lesson
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

#### Student Journey Integration (student-journey.e2e-spec.ts)

**Complete Workflow Test:**

1. Student enrolls in course
2. Views lesson progress (initially NOT_STARTED)
3. Views first slide with time tracking
4. Takes note on slide
5. Continues through all slides in lesson
6. Takes additional notes
7. Lesson auto-completes when all slides viewed
8. Course progress updates to 50% (1/2 lessons)
9. Notes are saved and retrievable
10. Completes second lesson
11. Course progress becomes 100%
12. Enrollment status becomes COMPLETED
13. Total time tracked accurately

**Additional Test Cases:**

- ✅ Navigate slides out of order
- ✅ Multiple notes on same slide
- ✅ Edit and delete notes during lesson
- ✅ Data isolation between multiple students

**Verification Points:**

- Progress percentages calculated correctly
- Time tracking accumulates properly
- Completion timestamps set when appropriate
- Enrollment denormalized fields stay in sync
- Student data properly isolated

## Running Tests

### Run All Integration Tests

```bash
# From the apps/api directory
pnpm test

# Run specific test file
pnpm test -- test/integration/enrollments.e2e-spec.ts

# Run with verbose output
pnpm test -- test/integration/student-journey.e2e-spec.ts --reporter=verbose

# Run in watch mode
pnpm test -- --watch
```

### Prerequisites

Before running tests, ensure:

1. PostgreSQL database is running (via docker-compose)
2. Database schema is up to date (`pnpm db:migrate:deploy`)
3. Environment variables are set correctly

### Test Database

Tests use the same database as development. Each test:

- Cleans all relevant tables in `beforeEach` hooks
- Creates fresh test data
- Runs isolated from other tests
- Cleans up after itself

**Note:** Tests will delete data from these tables:

- studentNote
- lessonProgress
- enrollment
- slide
- lesson
- course
- user (filtered by test emails)

## Adding New Tests

### Test File Structure

```typescript
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Feature Name (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
    await app.init();

    prisma = app.get<PrismaService>(PrismaService);
  });

  beforeEach(async () => {
    // Clean database
    await prisma.tableName.deleteMany();

    // Create test data
    // ...

    // Login and get auth token
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'test@test.com', password: 'password123' });
    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should do something', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/endpoint')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ data: 'value' })
      .expect(201);

    expect(response.body).toMatchObject({
      expectedField: 'expectedValue',
    });
  });
});
```

### Best Practices

1. **Use Descriptive Test Names**: Clearly state what is being tested
   - ✅ `should return 403 if trying to update another student's note`
   - ❌ `should fail`

2. **Test One Thing Per Test**: Each test should verify a single behavior
   - Makes failures easier to diagnose
   - Keeps tests focused and readable

3. **Clean State**: Always clean database in `beforeEach`
   - Ensures tests don't depend on execution order
   - Prevents flaky tests

4. **Use Appropriate HTTP Status Codes**:
   - 200 - Success (GET, PUT)
   - 201 - Created (POST)
   - 204 - No Content (DELETE)
   - 400 - Bad Request (validation errors)
   - 401 - Unauthorized (missing/invalid auth)
   - 403 - Forbidden (insufficient permissions)
   - 404 - Not Found
   - 409 - Conflict (duplicate resource)

5. **Test Authorization**: Always include tests for:
   - Missing auth token (401)
   - Unauthorized access to other users' data (403)
   - Role-based restrictions

6. **Test Edge Cases**:
   - Empty/null values
   - Very large values (10,000 character strings)
   - Concurrent operations
   - Out-of-order operations

## Pending Frontend Tests

The following frontend component tests still need to be created:

### Lesson Viewer Component Tests

**File:** `apps/web/src/components/lesson-viewer/lesson-viewer.test.tsx`

**Required Tests:**

- [ ] Renders lesson content correctly
- [ ] Navigate between slides (forward/backward)
- [ ] Updates progress on slide change
- [ ] Creates, edits, and deletes notes
- [ ] Toggles between English/Greek
- [ ] Responsive behavior on mobile
- [ ] Displays progress indicators
- [ ] Auto-saves notes on typing (debounced)
- [ ] Handles loading states
- [ ] Handles error states

### Performance Tests

**Required Tests:**

- [ ] Lesson with 50+ slides loads within 2 seconds
- [ ] Progress updates don't block UI interactions
- [ ] Notes auto-save efficiently (debounced, max 1 request/second)
- [ ] Large notes (10,000 characters) render without lag

### Integration Tests (Frontend)

**Required Tests:**

- [ ] Complete lesson viewing flow
- [ ] Progress syncs across browser tabs
- [ ] Offline mode (if implemented)
- [ ] Resume from last viewed slide on return

## Test Data Patterns

### Creating Test Users

```typescript
const teacher = await prisma.user.create({
  data: {
    email: 'teacher@test.com',
    password_hash: 'hashed',
    name: 'Teacher',
    role: 'TEACHER',
  },
});

const student = await prisma.user.create({
  data: {
    email: 'student@test.com',
    password_hash: 'hashed',
    name: 'Student',
    role: 'STUDENT',
  },
});
```

### Creating Test Course with Lessons

```typescript
const course = await prisma.course.create({
  data: {
    slug: 'test-course',
    title_en: 'Test Course',
    description_en: 'Description',
    teacher_id: teacherId,
    status: 'PUBLISHED',
    estimated_hours: 2,
  },
});

const lesson = await prisma.lesson.create({
  data: {
    slug: 'test-lesson',
    title_en: 'Test Lesson',
    course_id: courseId,
    lesson_order: 1,
    status: 'PUBLISHED',
    estimated_minutes: 30,
  },
});

await prisma.slide.createMany({
  data: [
    { lesson_id: lessonId, slide_order: 1, layout: 'TITLE' },
    { lesson_id: lessonId, slide_order: 2, layout: 'CONTENT' },
    { lesson_id: lessonId, slide_order: 3, layout: 'CONTENT' },
  ],
});
```

## Continuous Integration

Tests run automatically on:

- Every pull request
- Every push to main branch
- Before deployment

**CI Command:** `pnpm --filter @bibliology/api test`

## Troubleshooting

### Tests Failing Locally

1. **Database Connection Issues**

   ```bash
   # Ensure database is running
   docker-compose up -d postgres

   # Check database schema is up to date
   pnpm db:migrate:deploy
   ```

2. **Port Already in Use**

   ```bash
   # Kill process on port 3000
   lsof -ti:3000 | xargs kill -9
   ```

3. **Auth Token Expired**
   - Check that login endpoint returns valid access_token
   - Ensure test user exists in database

### Slow Tests

- Tests should complete in < 30 seconds total
- If slower, check:
  - Database connection pooling
  - Excessive database queries
  - Missing indexes on queried fields

## Code Coverage

Current coverage targets:

- Statements: > 80%
- Branches: > 75%
- Functions: > 80%
- Lines: > 80%

Run coverage report:

```bash
pnpm test -- --coverage
```

## Related Documentation

- [API Documentation](./README.md)
- [Database Schema](../../prisma/schema.prisma)
- [Frontend API Client](../web/src/lib/api/README.md)
