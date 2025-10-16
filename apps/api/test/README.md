# Backend API Test Suite

Comprehensive test suite for the Bibliology backend API covering Auth, Courses, and Lessons.

## Test Structure

```
test/
├── setup.ts                    # Global test setup (database cleanup)
├── helpers/
│   ├── factories.ts            # Test data factories
│   ├── auth-helper.ts          # Authentication utilities
│   └── test-utils.ts           # General test utilities
├── unit/                       # Unit tests (services with mocked dependencies)
│   ├── auth.service.spec.ts
│   ├── courses.service.spec.ts
│   └── lessons.service.spec.ts
└── e2e/                        # End-to-end tests (full HTTP request/response)
    ├── auth.e2e-spec.ts
    ├── courses.e2e-spec.ts
    └── lessons.e2e-spec.ts
```

## Running Tests

### Unit Tests (Fast, with mocked dependencies)
```bash
npm run test:unit              # Run all unit tests
npm run test:watch             # Run tests in watch mode
npm run test:cov:unit          # Run with coverage report
```

### E2E Tests (Slower, with real database)
```bash
npm run test:e2e               # Run all E2E tests
```

### All Tests
```bash
npm run test:all               # Run both unit and E2E tests
npm run test:cov               # Run all tests with coverage
```

## Test Database Setup

E2E tests require a test database. Set up your test database connection:

```bash
# Create a test database
createdb bibliology_test

# Set environment variable (or use .env.test file)
export DATABASE_URL_TEST="postgresql://user:password@localhost:5432/bibliology_test"

# Run migrations on test database
npm run db:migrate
```

## Coverage Thresholds

The test suite enforces minimum coverage requirements:
- Lines: 80%
- Functions: 80%
- Branches: 75%
- Statements: 80%

View coverage reports in `/coverage/index.html` after running `npm run test:cov`.

## Test Categories

### Unit Tests
Tests individual service methods with mocked dependencies:
- ✅ AuthService: register, login, validation, password hashing
- ✅ CoursesService: CRUD operations, ownership verification, pagination
- ✅ LessonsService: CRUD operations, slide reordering, cascade deletes

### E2E Tests
Tests full API endpoints with real HTTP requests:
- ✅ Auth endpoints: POST /auth/register, POST /auth/login, GET /auth/me, POST /auth/logout
- ✅ Course endpoints: CRUD + publish/unpublish
- ✅ Lesson endpoints: CRUD + slide reordering

## Test Helpers

### Factories (`test/helpers/factories.ts`)
- `createTestUser(overrides?)` - Create test user
- `createTestTeacher(overrides?)` - Create test teacher
- `createTestCourse(teacherId, overrides?)` - Create test course
- `createTestLesson(courseId, overrides?)` - Create test lesson
- `createTestSlide(lessonId, overrides?)` - Create test slide
- `createTestEnrollment(studentId, courseId, overrides?)` - Create enrollment
- `clearDatabase()` - Clear all test data
- `seedTestData()` - Seed common test fixtures

### Auth Helpers (`test/helpers/auth-helper.ts`)
- `generateAuthToken(jwtService, userId, email, role)` - Generate JWT token
- `authenticatedRequest(app, options)` - Make authenticated HTTP request
- `getTestJwtSecret()` - Get JWT secret for testing

### Utilities (`test/helpers/test-utils.ts`)
- `createTestApp(module)` - Create NestJS test application
- `randomEmail()` - Generate random email
- `randomSlug()` - Generate random slug
- `extractCookie(response, name)` - Extract cookie from response
- `waitFor(condition, timeout)` - Wait for async condition

## Writing New Tests

### Unit Test Example
```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';

describe('MyService', () => {
  let service: MyService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MyService,
        {
          provide: PrismaService,
          useValue: {
            myModel: {
              findUnique: vi.fn(),
              create: vi.fn(),
            },
          },
        },
      ],
    }).compile();

    service = module.get<MyService>(MyService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should do something', async () => {
    vi.spyOn(prisma.myModel, 'findUnique').mockResolvedValue({});
    const result = await service.doSomething();
    expect(result).toBeDefined();
  });
});
```

### E2E Test Example
```typescript
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';

describe('My E2E Tests', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  it('should do something', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send({ data: 'value' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

## Test Scenarios Covered

### Authentication
- ✅ Successful registration
- ✅ Duplicate email rejection
- ✅ Password validation
- ✅ Successful login
- ✅ Invalid credentials
- ✅ JWT token generation
- ✅ Token validation
- ✅ Role-based access

### Courses
- ✅ Create course as teacher
- ✅ Student cannot create course (403)
- ✅ Slug uniqueness validation
- ✅ URL validation (thumbnail_url, cover_image_url)
- ✅ Paginated course listing
- ✅ Ownership verification
- ✅ Update course
- ✅ Delete course (only without active enrollments)
- ✅ Publish/unpublish course
- ✅ Cannot publish without lessons

### Lessons
- ✅ Create lesson in course
- ✅ Only course owner can create lesson
- ✅ Lesson order uniqueness in course
- ✅ Slug uniqueness validation
- ✅ Paginated lesson listing
- ✅ Lessons ordered by lesson_order
- ✅ Update lesson
- ✅ Delete lesson (only without student progress)
- ✅ Reorder slides
- ✅ Slide ID validation

## Best Practices

1. **Test Isolation**: Each test is independent and can run in any order
2. **Database Cleanup**: `beforeEach` hook clears database for fresh state
3. **Meaningful Names**: Use descriptive test names with "should..."
4. **Arrange-Act-Assert**: Structure tests clearly
5. **Mock External Dependencies**: Unit tests mock PrismaService
6. **Test Error Cases**: Cover both success and failure scenarios
7. **Verify Side Effects**: Check database state after operations
8. **Use Factories**: Leverage test data factories for consistency

## Debugging Tests

```bash
# Run specific test file
npm run test:unit auth.service.spec

# Run tests matching pattern
npm run test:watch -- auth

# Run single test
npm run test:watch -- -t "should successfully register"

# See detailed output
npm run test:unit -- --reporter=verbose
```

## CI/CD Integration

Tests are designed to run in CI environments:
- Fast unit tests run on every commit
- E2E tests run on pull requests
- Coverage reports uploaded to coverage services
- Failing tests block merges

## Troubleshooting

### Database Connection Issues
```bash
# Check database is running
pg_isready

# Verify connection string
echo $DATABASE_URL_TEST

# Reset test database
npm run db:reset
```

### Test Timeouts
```bash
# Increase timeout for slow tests
npm run test:e2e -- --testTimeout=60000
```

### Port Already in Use
```bash
# Kill process on port
lsof -ti:3000 | xargs kill -9
```

## Contributing

When adding new features:
1. Write unit tests for services
2. Write E2E tests for endpoints
3. Update test data factories if needed
4. Maintain 80%+ coverage
5. Follow existing test patterns
