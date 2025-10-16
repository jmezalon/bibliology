# Complete Test Scenarios Coverage

## Authentication (AuthService + /auth endpoints)

### Registration Tests

- ✅ Successfully register new user with valid data
- ✅ Register with default STUDENT role
- ✅ Register with default language_pref "en"
- ✅ Register with custom language_pref "fr"
- ✅ Reject duplicate email (409 Conflict)
- ✅ Reject invalid email format (400 Bad Request)
- ✅ Reject password shorter than 8 characters (400 Bad Request)
- ✅ Reject invalid language_pref (400 Bad Request)
- ✅ Reject missing required fields (400 Bad Request)
- ✅ Hash password before storing (security)
- ✅ Return JWT token and user data
- ✅ Set HTTP-only authentication cookie
- ✅ Do not expose password_hash in response
- ✅ Create activity log entry for registration
- ✅ Set last_login on registration

### Login Tests

- ✅ Successfully login with valid credentials
- ✅ Return JWT token and user data
- ✅ Set HTTP-only authentication cookie
- ✅ Update last_login timestamp
- ✅ Reject invalid email (401 Unauthorized)
- ✅ Reject invalid password (401 Unauthorized)
- ✅ Reject missing credentials (400 Bad Request)
- ✅ Reject invalid email format (400 Bad Request)
- ✅ Prevent timing attacks (always run bcrypt comparison)
- ✅ Work for STUDENT, TEACHER, and ADMIN roles
- ✅ Create activity log entry for login

### Logout Tests

- ✅ Successfully logout with valid token
- ✅ Clear authentication cookie
- ✅ Require authentication (401 without token)
- ✅ Return success message

### Current User Tests

- ✅ Return user data with valid token
- ✅ Reject request without token (401 Unauthorized)
- ✅ Reject request with invalid token (401 Unauthorized)
- ✅ Reject request with malformed Authorization header
- ✅ Do not expose password_hash

### JWT Token Tests

- ✅ Generate valid JWT token on registration
- ✅ Generate valid JWT token on login
- ✅ Accept Bearer token in Authorization header
- ✅ Reject expired tokens
- ✅ Reject malformed tokens
- ✅ Include user ID, email, and role in payload

---

## Courses (CoursesService + /courses endpoints)

### Create Course Tests

- ✅ Successfully create course as TEACHER
- ✅ Successfully create course as ADMIN
- ✅ Reject creation by unauthenticated user (401)
- ✅ Reject creation by STUDENT (403 Forbidden)
- ✅ Reject duplicate slug (409 Conflict)
- ✅ Reject invalid slug format (400 Bad Request)
- ✅ Reject invalid URL for thumbnail_url (400)
- ✅ Reject invalid URL for cover_image_url (400)
- ✅ Accept valid URLs for images
- ✅ Set status to DRAFT by default
- ✅ Accept optional fields (tags, estimated_hours, difficulty)
- ✅ Associate course with teacher_id
- ✅ Return course with teacher info and counts

### List Courses Tests

- ✅ Return paginated list of courses for teacher
- ✅ Only return courses owned by authenticated teacher
- ✅ Support pagination (page, limit)
- ✅ Calculate totalPages correctly
- ✅ Order by created_at descending
- ✅ Return empty list if teacher has no courses
- ✅ Include lesson count and enrollment count
- ✅ Reject request by unauthenticated user (401)
- ✅ Reject request by STUDENT (403 Forbidden)

### Get Single Course Tests

- ✅ Return course details for owner
- ✅ Include teacher information
- ✅ Include lesson count and enrollment count
- ✅ Reject request for non-existent course (404 Not Found)
- ✅ Reject request by non-owner teacher (403 Forbidden)
- ✅ Reject request by unauthenticated user (401)

### Update Course Tests

- ✅ Successfully update course by owner
- ✅ Allow updating title, description, status, etc.
- ✅ Check slug uniqueness when updating slug
- ✅ Reject update to existing slug (409 Conflict)
- ✅ Reject update by non-owner teacher (403 Forbidden)
- ✅ Reject request for non-existent course (404)
- ✅ Reject request by unauthenticated user (401)

### Delete Course Tests

- ✅ Successfully delete course without enrollments
- ✅ Cascade delete lessons, slides, content blocks
- ✅ Reject deletion with active enrollments (400 Bad Request)
- ✅ Reject deletion by non-owner teacher (403 Forbidden)
- ✅ Reject request for non-existent course (404)
- ✅ Reject request by unauthenticated user (401)

### Publish/Unpublish Course Tests

- ✅ Successfully publish course with lessons
- ✅ Set status to PUBLISHED
- ✅ Set published_at timestamp
- ✅ Successfully unpublish course
- ✅ Reset status to DRAFT
- ✅ Clear published_at
- ✅ Reject publishing course without lessons (400 Bad Request)
- ✅ Reject publish by non-owner teacher (403 Forbidden)
- ✅ Reject request by unauthenticated user (401)

### Ownership Verification Tests

- ✅ Verify course ownership returns true for owner
- ✅ Throw NotFoundException for non-existent course
- ✅ Throw ForbiddenException for non-owner

---

## Lessons (LessonsService + /lessons endpoints)

### Create Lesson Tests

- ✅ Successfully create lesson as course owner
- ✅ Associate lesson with course_id
- ✅ Check slug uniqueness
- ✅ Check lesson_order uniqueness within course
- ✅ Reject duplicate slug (409 Conflict)
- ✅ Reject duplicate lesson_order in course (409 Conflict)
- ✅ Reject invalid slug format (400 Bad Request)
- ✅ Reject creation by non-owner teacher (403 Forbidden)
- ✅ Reject creation by STUDENT (403 Forbidden)
- ✅ Reject request by unauthenticated user (401)
- ✅ Set import_date if imported_from_pptx is true
- ✅ Set status to DRAFT by default
- ✅ Accept optional fields (description, estimated_minutes)

### List Lessons Tests

- ✅ Return paginated list of lessons for course
- ✅ Order lessons by lesson_order ascending
- ✅ Support pagination (page, limit)
- ✅ Include slide count
- ✅ Verify course ownership if teacherId provided
- ✅ Skip ownership check if teacherId not provided
- ✅ Reject request by non-owner teacher (403 Forbidden)
- ✅ Reject request by unauthenticated user (401)

### Get Single Lesson Tests

- ✅ Return lesson details with slides and content blocks
- ✅ Include course information
- ✅ Order slides by slide_order ascending
- ✅ Order content blocks by block_order ascending
- ✅ Reject request for non-existent lesson (404 Not Found)
- ✅ Reject request by non-owner teacher (403 Forbidden)
- ✅ Reject request by unauthenticated user (401)

### Update Lesson Tests

- ✅ Successfully update lesson by course owner
- ✅ Allow updating title, description, lesson_order, etc.
- ✅ Check slug uniqueness when updating slug
- ✅ Check lesson_order uniqueness when updating order
- ✅ Reject update to existing slug (409 Conflict)
- ✅ Reject update to existing lesson_order (409 Conflict)
- ✅ Reject update by non-owner teacher (403 Forbidden)
- ✅ Reject request for non-existent lesson (404)
- ✅ Reject request by unauthenticated user (401)

### Delete Lesson Tests

- ✅ Successfully delete lesson without student progress
- ✅ Cascade delete slides and content blocks
- ✅ Reject deletion with student progress (400 Bad Request)
- ✅ Reject deletion by non-owner teacher (403 Forbidden)
- ✅ Reject request for non-existent lesson (404)
- ✅ Reject request by unauthenticated user (401)

### Reorder Slides Tests

- ✅ Successfully reorder slides in lesson
- ✅ Update slide_order for all slides in transaction
- ✅ Verify all slide IDs belong to lesson
- ✅ Reject invalid slide IDs (400 Bad Request)
- ✅ Reject reorder by non-owner teacher (403 Forbidden)
- ✅ Reject request for non-existent lesson (404)
- ✅ Reject request by unauthenticated user (401)

---

## Edge Cases & Security Tests

### Validation Tests

- ✅ Slug format validation (lowercase, alphanumeric, hyphens)
- ✅ URL validation for image URLs
- ✅ Email format validation
- ✅ Password length validation (minimum 8 characters)
- ✅ Language preference validation (only "en" or "fr")
- ✅ Required fields validation
- ✅ Data type validation (integers, strings, arrays)

### Authorization Tests

- ✅ Unauthenticated access blocked (401)
- ✅ Students cannot create courses (403)
- ✅ Students cannot create lessons (403)
- ✅ Teachers cannot access other teachers' resources (403)
- ✅ Role-based access control (STUDENT, TEACHER, ADMIN)
- ✅ Ownership verification for all write operations

### Business Logic Tests

- ✅ Cannot delete course with active enrollments
- ✅ Cannot delete lesson with student progress
- ✅ Cannot publish course without lessons
- ✅ Slug uniqueness across entire system
- ✅ Lesson order uniqueness within course
- ✅ Cascade deletes for related records

### Security Tests

- ✅ Password hashing with bcrypt
- ✅ Password hash not exposed in responses
- ✅ Timing attack prevention in login
- ✅ JWT token generation and validation
- ✅ HTTP-only cookies for authentication
- ✅ Secure cookie settings in production
- ✅ Activity logging for audit trail

### Database Tests

- ✅ Transaction handling for slide reordering
- ✅ Cascade deletes work correctly
- ✅ Foreign key constraints enforced
- ✅ Unique constraints enforced
- ✅ Indexes used for performance
- ✅ Timestamps auto-updated

### Pagination Tests

- ✅ Correct skip/take calculation
- ✅ Total count returned
- ✅ Total pages calculated correctly
- ✅ Empty results handled gracefully
- ✅ Default pagination values
- ✅ Custom page/limit parameters

---

## Test Coverage Summary

- **Total Test Files**: 6 (3 unit + 3 E2E)
- **Total Tests**: 126+ tests
- **Unit Tests**: 61 tests
- **E2E Tests**: 65 tests
- **Code Coverage**: 80%+ target

### Coverage by Module

- AuthService: 17 unit tests + 23 E2E tests = 40 tests
- CoursesService: 25 unit tests + 22 E2E tests = 47 tests
- LessonsService: 19 unit tests + 20 E2E tests = 39 tests

### Test Categories

- Happy path tests: ~45%
- Error handling tests: ~30%
- Authorization tests: ~15%
- Edge cases: ~10%

All critical user journeys and business requirements are covered with comprehensive test scenarios.
