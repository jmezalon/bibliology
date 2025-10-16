# Test Suite Quick Start Guide

## Prerequisites

1. Install dependencies:

```bash
npm install
```

2. Set up test database:

```bash
# Create test database
createdb bibliology_test

# Set environment variable
export DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/bibliology_test"

# Or add to .env.test file
echo 'DATABASE_URL_TEST=postgresql://postgres:postgres@localhost:5432/bibliology_test' > .env.test
```

3. Run migrations:

```bash
npm run db:migrate
```

## Running Tests

### Quick Commands

```bash
# Run all unit tests (fast, recommended for development)
npm run test:unit

# Run all E2E tests (slower, requires test database)
npm run test:e2e

# Run all tests
npm run test:all

# Run with coverage report
npm run test:cov

# Run tests in watch mode (auto-rerun on file changes)
npm run test:watch
```

## Test Files Overview

### Unit Tests (test/unit/)

- `auth.service.spec.ts` - 17 tests for authentication service
- `courses.service.spec.ts` - 25 tests for courses service
- `lessons.service.spec.ts` - 19 tests for lessons service

**Total Unit Tests: 61 tests**

### E2E Tests (test/e2e/)

- `auth.e2e-spec.ts` - 23 tests for auth endpoints
- `courses.e2e-spec.ts` - 22 tests for course endpoints
- `lessons.e2e-spec.ts` - 20 tests for lesson endpoints

**Total E2E Tests: 65 tests**

### Test Helpers (test/helpers/)

- `factories.ts` - Test data creation functions
- `auth-helper.ts` - Authentication utilities
- `test-utils.ts` - General test utilities

## Expected Output

### Successful Test Run

```
✓ test/unit/auth.service.spec.ts (17 tests) 234ms
✓ test/unit/courses.service.spec.ts (25 tests) 312ms
✓ test/unit/lessons.service.spec.ts (19 tests) 289ms

Test Files  3 passed (3)
Tests       61 passed (61)
Duration    835ms
```

### Coverage Report

```
Coverage report
----------------
File                          | % Stmts | % Branch | % Funcs | % Lines
------------------------------|---------|----------|---------|--------
All files                     |   85.23 |    81.45 |   87.12 |   85.67
 src/auth/auth.service.ts     |   92.45 |    88.23 |   94.12 |   92.89
 src/courses/courses.service  |   88.12 |    82.45 |   89.34 |   88.45
 src/courses/lessons.service  |   86.78 |    79.23 |   85.67 |   87.12
```

## Debugging Failed Tests

### View detailed error messages

```bash
npm run test:unit -- --reporter=verbose
```

### Run specific test file

```bash
npm run test:unit auth.service.spec
```

### Run single test

```bash
npm run test:unit -- -t "should successfully register"
```

### Check database state during E2E tests

```bash
# In another terminal while tests are running
psql bibliology_test

# List all tables
\dt

# Check users table
SELECT * FROM users;
```

## Common Issues & Solutions

### Issue: "DATABASE_URL_TEST is not set"

**Solution:**

```bash
export DATABASE_URL_TEST="postgresql://postgres:postgres@localhost:5432/bibliology_test"
```

### Issue: "Connection refused"

**Solution:** Start PostgreSQL

```bash
# macOS
brew services start postgresql

# Linux
sudo systemctl start postgresql
```

### Issue: "Database does not exist"

**Solution:**

```bash
createdb bibliology_test
npm run db:migrate
```

### Issue: "Port 3000 already in use"

**Solution:**

```bash
lsof -ti:3000 | xargs kill -9
```

### Issue: Tests timeout

**Solution:** Increase timeout

```bash
npm run test:e2e -- --testTimeout=60000
```

## Test Coverage Goals

- Unit tests: 80%+ coverage
- All API endpoints tested
- All critical user journeys covered
- Error scenarios tested

## Next Steps

1. Run tests: `npm run test:all`
2. Check coverage: `npm run test:cov`
3. Review coverage report: `open coverage/index.html`
4. Add new tests as you build features

## Getting Help

- Read full documentation: `test/README.md`
- Check test examples in existing test files
- Review test helpers in `test/helpers/`

## Test Statistics

- Total test files: 6
- Total tests: 126
- Unit tests: 61
- E2E tests: 65
- Test helpers: 3 files with 15+ utility functions
- Coverage target: 80%+
