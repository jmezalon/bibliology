# Courses & Lessons API

Comprehensive backend API for managing courses and lessons in the Bibliology learning management system.

## Overview

This module provides REST API endpoints for:

- Course creation, retrieval, updating, and deletion
- Lesson management within courses
- Authorization and ownership verification
- Bilingual content support (English/French)
- Cascade operations (deleting courses removes all lessons, slides, and content blocks)

## Architecture

### Modules

- **CoursesModule**: Main module that exports services and controllers
  - `CoursesService`: Business logic for course operations
  - `LessonsService`: Business logic for lesson operations
  - `CoursesController`: Course REST endpoints
  - `LessonsController`: Lesson REST endpoints
  - `CourseLessonsController`: Nested route for course lessons

### Security

- **JWT Authentication**: All endpoints require valid JWT token
- **Role-Based Access**: Only `TEACHER` and `ADMIN` roles can access these endpoints
- **Ownership Verification**: Teachers can only manage their own courses
- **Cascade Delete Protection**: Prevents deletion of courses/lessons with active enrollments/progress

## API Endpoints

### Course Endpoints

#### `POST /api/courses`

Create a new course (teachers only)

**Request Body:**

```json
{
  "slug": "introduction-to-pneumatology",
  "title_en": "Introduction to Pneumatology",
  "title_fr": "Introduction à la Pneumatologie",
  "description_en": "A comprehensive study of the Holy Spirit...",
  "description_fr": "Une étude complète du Saint-Esprit...",
  "category": "Theology",
  "tags": ["Pneumatology", "Holy Spirit"],
  "estimated_hours": 10,
  "difficulty": "Beginner",
  "status": "DRAFT"
}
```

**Response:** `201 Created`

```json
{
  "id": "clxxx...",
  "slug": "introduction-to-pneumatology",
  "teacher_id": "clyyy...",
  "title_en": "Introduction to Pneumatology",
  "title_fr": "Introduction à la Pneumatologie",
  "description_en": "A comprehensive study of the Holy Spirit...",
  "description_fr": "Une étude complète du Saint-Esprit...",
  "thumbnail_url": null,
  "cover_image_url": null,
  "status": "DRAFT",
  "category": "Theology",
  "tags": ["Pneumatology", "Holy Spirit"],
  "estimated_hours": 10,
  "difficulty": "Beginner",
  "created_at": "2025-10-16T12:00:00Z",
  "updated_at": "2025-10-16T12:00:00Z",
  "published_at": null,
  "teacher": {
    "id": "clyyy...",
    "name": "Dr. John Smith",
    "email": "john@example.com",
    "avatar_url": null
  },
  "lessonCount": 0,
  "enrollmentCount": 0
}
```

**Errors:**

- `400`: Invalid input data
- `409`: Course slug already exists

---

#### `GET /api/courses`

Get all courses for the authenticated teacher (with pagination)

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "clxxx...",
      "slug": "introduction-to-pneumatology",
      "teacher_id": "clyyy...",
      "title_en": "Introduction to Pneumatology",
      ...
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "totalPages": 3
}
```

---

#### `GET /api/courses/:id`

Get a single course by ID

**Response:** `200 OK`

```json
{
  "id": "clxxx...",
  "slug": "introduction-to-pneumatology",
  "teacher_id": "clyyy...",
  ...
}
```

**Errors:**

- `404`: Course not found
- `403`: Not authorized to access this course

---

#### `PUT /api/courses/:id`

Update a course (owner only)

**Request Body:** Same as create, all fields optional

**Response:** `200 OK` - Updated course object

**Errors:**

- `404`: Course not found
- `403`: Not authorized to update this course
- `409`: Course slug already exists

---

#### `DELETE /api/courses/:id`

Delete a course with cascade (owner only)

**Response:** `204 No Content`

**Errors:**

- `404`: Course not found
- `403`: Not authorized to delete this course
- `400`: Cannot delete course with active enrollments

**Note:** This operation cascades to:

- All lessons in the course
- All slides in those lessons
- All content blocks in those slides
- All quizzes and questions

---

#### `PATCH /api/courses/:id/publish`

Publish or unpublish a course (owner only)

**Request Body:**

```json
{
  "publish": true
}
```

**Response:** `200 OK` - Updated course object

**Errors:**

- `404`: Course not found
- `403`: Not authorized to publish this course
- `400`: Cannot publish course without lessons

---

### Lesson Endpoints

#### `POST /api/lessons`

Create a new lesson in a course (course owner only)

**Request Body:**

```json
{
  "course_id": "clxxx...",
  "slug": "the-holy-spirit-in-the-old-testament",
  "title_en": "The Holy Spirit in the Old Testament",
  "title_fr": "Le Saint-Esprit dans l'Ancien Testament",
  "description_en": "Exploring the presence of the Holy Spirit...",
  "description_fr": "Explorer la présence du Saint-Esprit...",
  "lesson_order": 1,
  "estimated_minutes": 45,
  "status": "DRAFT",
  "imported_from_pptx": false
}
```

**Response:** `201 Created`

```json
{
  "id": "clzzz...",
  "slug": "the-holy-spirit-in-the-old-testament",
  "course_id": "clxxx...",
  "title_en": "The Holy Spirit in the Old Testament",
  "title_fr": "Le Saint-Esprit dans l'Ancien Testament",
  "description_en": "Exploring the presence of the Holy Spirit...",
  "description_fr": "Explorer la présence du Saint-Esprit...",
  "lesson_order": 1,
  "status": "DRAFT",
  "estimated_minutes": 45,
  "imported_from_pptx": false,
  "original_filename": null,
  "import_date": null,
  "created_at": "2025-10-16T12:00:00Z",
  "updated_at": "2025-10-16T12:00:00Z",
  "published_at": null,
  "course": {
    "id": "clxxx...",
    "title_en": "Introduction to Pneumatology",
    "title_fr": "Introduction à la Pneumatologie",
    "slug": "introduction-to-pneumatology"
  }
}
```

**Errors:**

- `400`: Invalid input data
- `403`: Not authorized to access this course
- `409`: Lesson slug or order already exists

---

#### `GET /api/courses/:courseId/lessons`

Get all lessons for a course

**Response:** `200 OK`

```json
{
  "data": [
    {
      "id": "clzzz...",
      "slug": "the-holy-spirit-in-the-old-testament",
      "course_id": "clxxx...",
      "title_en": "The Holy Spirit in the Old Testament",
      ...
    }
  ],
  "total": 12
}
```

**Errors:**

- `404`: Course not found
- `403`: Not authorized to access this course

---

#### `GET /api/lessons/:id`

Get a single lesson with all slides and content blocks

**Response:** `200 OK`

```json
{
  "id": "clzzz...",
  "slug": "the-holy-spirit-in-the-old-testament",
  "course_id": "clxxx...",
  "title_en": "The Holy Spirit in the Old Testament",
  ...,
  "slides": [
    {
      "id": "claaa...",
      "slide_order": 1,
      "layout": "TITLE",
      "title_en": "Introduction",
      "title_fr": "Introduction",
      "notes_en": "Teacher notes here...",
      "notes_fr": null,
      "created_at": "2025-10-16T12:00:00Z",
      "updated_at": "2025-10-16T12:00:00Z",
      "content_blocks": [
        {
          "id": "clbbb...",
          "block_order": 1,
          "block_type": "HEADING",
          "content_en": { "text": "The Holy Spirit in Genesis" },
          "content_fr": { "text": "Le Saint-Esprit dans la Genèse" },
          "style_config": { "fontSize": "large", "color": "primary" },
          "created_at": "2025-10-16T12:00:00Z",
          "updated_at": "2025-10-16T12:00:00Z"
        }
      ]
    }
  ]
}
```

**Errors:**

- `404`: Lesson not found
- `403`: Not authorized to access this lesson

---

#### `PUT /api/lessons/:id`

Update a lesson (course owner only)

**Request Body:** Same as create (except course_id), all fields optional

**Response:** `200 OK` - Updated lesson object

**Errors:**

- `404`: Lesson not found
- `403`: Not authorized to update this lesson
- `409`: Lesson slug or order already exists

---

#### `DELETE /api/lessons/:id`

Delete a lesson with cascade (course owner only)

**Response:** `204 No Content`

**Errors:**

- `404`: Lesson not found
- `403`: Not authorized to delete this lesson
- `400`: Cannot delete lesson with student progress

**Note:** This operation cascades to:

- All slides in the lesson
- All content blocks in those slides
- All quizzes and questions

---

#### `PATCH /api/lessons/:id/reorder`

Reorder slides within a lesson (course owner only)

**Request Body:**

```json
{
  "slide_ids": ["claaa...", "clbbb...", "clccc..."]
}
```

**Response:** `200 OK` - Updated lesson object with reordered slides

**Errors:**

- `404`: Lesson not found
- `403`: Not authorized to modify this lesson
- `400`: Invalid slide IDs provided (must all belong to this lesson)

---

## Data Models

### Course

```typescript
{
  id: string;
  slug: string;
  teacher_id: string;
  title_en: string;
  title_fr?: string | null;
  description_en: string;
  description_fr?: string | null;
  thumbnail_url?: string | null;
  cover_image_url?: string | null;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  category?: string | null;
  tags: string[];
  estimated_hours?: number | null;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced' | null;
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
}
```

### Lesson

```typescript
{
  id: string;
  slug: string;
  course_id: string;
  title_en: string;
  title_fr?: string | null;
  description_en?: string | null;
  description_fr?: string | null;
  lesson_order: number;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  estimated_minutes?: number | null;
  imported_from_pptx: boolean;
  original_filename?: string | null;
  import_date?: Date | null;
  created_at: Date;
  updated_at: Date;
  published_at?: Date | null;
}
```

### Slide

```typescript
{
  id: string;
  slide_order: number;
  layout: 'TITLE' | 'CONTENT' | 'TWO_COLUMN' | 'IMAGE_FOCUS' | 'QUIZ' | 'BLANK';
  title_en?: string | null;
  title_fr?: string | null;
  notes_en?: string | null;
  notes_fr?: string | null;
  created_at: Date;
  updated_at: Date;
}
```

### ContentBlock

```typescript
{
  id: string;
  block_order: number;
  block_type: 'HEADING' | 'TEXT' | 'IMAGE' | 'VERSE' | 'VOCABULARY' | 'LIST' | 'CALLOUT' | 'QUIZ' | 'DIVIDER';
  content_en: any; // JSONB - structure varies by block_type
  content_fr?: any; // JSONB - structure varies by block_type
  style_config?: any; // JSONB - styling configuration
  created_at: Date;
  updated_at: Date;
}
```

---

## Business Logic

### Authorization Rules

1. **Course Access**: Teachers can only view/edit/delete their own courses
2. **Lesson Access**: Teachers can only manage lessons in courses they own
3. **Role Requirement**: All endpoints require `TEACHER` or `ADMIN` role

### Validation Rules

1. **Unique Slugs**: Course and lesson slugs must be globally unique
2. **Lesson Ordering**: Lesson orders must be unique within a course
3. **Publishing**: Courses must have at least one lesson to be published
4. **Deletion**: Cannot delete courses with active enrollments or lessons with student progress

### Transactions

Complex operations use database transactions to ensure data integrity:

- Course deletion (cascades to lessons, slides, content blocks)
- Lesson deletion (cascades to slides, content blocks)
- Slide reordering (updates multiple records atomically)

---

## Error Handling

All endpoints return standard HTTP status codes:

- `200`: Success
- `201`: Created
- `204`: No Content (successful deletion)
- `400`: Bad Request (validation error, business rule violation)
- `401`: Unauthorized (no valid JWT token)
- `403`: Forbidden (insufficient permissions or not owner)
- `404`: Not Found
- `409`: Conflict (duplicate slug/order)
- `500`: Internal Server Error

Error response format:

```json
{
  "statusCode": 400,
  "message": "Cannot publish a course without any lessons",
  "error": "Bad Request"
}
```

---

## Testing

### Manual Testing with cURL

**Create a course:**

```bash
curl -X POST http://localhost:3000/api/courses \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "test-course",
    "title_en": "Test Course",
    "description_en": "A test course"
  }'
```

**Get all courses:**

```bash
curl -X GET http://localhost:3000/api/courses?page=1&limit=10 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Create a lesson:**

```bash
curl -X POST http://localhost:3000/api/lessons \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "course_id": "COURSE_ID",
    "slug": "test-lesson",
    "title_en": "Test Lesson",
    "lesson_order": 1
  }'
```

---

## Future Enhancements

1. **Bulk Operations**: Batch create/update/delete for lessons
2. **Course Duplication**: Clone an entire course with all lessons
3. **Versioning**: Track changes to courses and lessons
4. **Search**: Full-text search across courses and lessons
5. **Analytics**: Track course views, completion rates
6. **Templates**: Predefined course and lesson templates
7. **Collaborative Editing**: Multiple teachers can co-author courses

---

## Database Schema

See `/apps/api/prisma/schema.prisma` for the complete database schema.

Key relationships:

- `Course` → `Lesson` (one-to-many, cascade delete)
- `Lesson` → `Slide` (one-to-many, cascade delete)
- `Slide` → `ContentBlock` (one-to-many, cascade delete)
- `User` → `Course` (one-to-many via teacher_id, restrict delete)
