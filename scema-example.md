Schema Design Rationale

1. Bilingual Support Strategy

Approach: Separate columns for English (\_en) and French (\_fr)
Why: Simpler queries, better performance, easier to manage than JSONB language objects
Alternative considered: Single JSONB column with language keys → rejected due to query complexity

2. Content Blocks JSONB Structure

Why JSONB: Content structure varies dramatically by block type (text vs image vs verse)
Benefits: Flexibility for different content types without schema changes
Trade-off: Slightly harder to query, but huge flexibility gain

Example content_en JSONB structures:
json// TEXT block
{
"html": "<p>This is <strong>rich</strong> text content</p>",
"plainText": "This is rich text content"
}

// IMAGE block
{
"url": "https://...",
"alt": "Description",
"caption": "Figure 1: ...",
"width": 800,
"height": 600
}

// VERSE block
{
"reference": "John 3:16",
"text": "For God so loved the world...",
"translation": "NIV"
}

// VOCABULARY block
{
"term": "Pneuma",
"definition": "Greek word for spirit or breath",
"etymology": "From πνεῦμα"
}

// LIST block
{
"listType": "bullet",
"items": [
"First point",
"Second point"
]
} 3. Quiz Flexibility

Can be attached to lesson (inline) or course (final assessment)
Supports unlimited question types through JSONB
Easy to add new question types without schema changes

4. Progress Tracking

Denormalized counts for performance (lessons_completed, progress_percentage)
Updated via triggers or application logic
Enables fast dashboard queries without complex JOINs

5. Performance Optimizations

Composite indexes on frequently queried combinations
GIN indexes on JSONB columns for content search
Partial indexes on boolean flags (e.g., is_featured)
Proper foreign key constraints with appropriate ON DELETE actions

6. Security Considerations

ON DELETE RESTRICT for users prevents accidental data loss
ON DELETE CASCADE for child records (slides, questions, etc.)
Activity log for audit trail
Password stored as bcrypt hash

Migration Strategy
Initial Migration (v1)
bash# Create all tables
npm run migrate:up

# Seed with admin user

npm run seed:admin
Future Migrations (Example)
sql-- v2: Add discussion forum feature
CREATE TABLE discussions (
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
lesson_id UUID NOT NULL REFERENCES lessons(id),
student_id UUID NOT NULL REFERENCES users(id),
message TEXT NOT NULL,
created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- v3: Add video support
ALTER TABLE content_blocks
ADD COLUMN video_metadata JSONB;

Sample Queries

1. Get Course with Progress for Student
   sqlSELECT
   c.\*,
   e.progress_percentage,
   e.lessons_completed,
   e.total_lessons,
   COUNT(DISTINCT lp.id) FILTER (WHERE lp.status = 'completed') as actual_completed
   FROM courses c
   JOIN enrollments e ON e.course_id = c.id
   LEFT JOIN lessons l ON l.course_id = c.id
   LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
   WHERE e.student_id = $1
   AND c.status = 'published'
   GROUP BY c.id, e.id;
2. Get Lesson with All Content (for viewer)
   sqlSELECT
   l.\*,
   json_agg(
   json_build_object(
   'id', s.id,
   'order', s.slide_order,
   'layout', s.layout,
   'title_en', s.title_en,
   'title_fr', s.title_fr,
   'content_blocks', (
   SELECT json_agg(
   json_build_object(
   'id', cb.id,
   'type', cb.block_type,
   'order', cb.block_order,
   'content_en', cb.content_en,
   'content_fr', cb.content_fr
   ) ORDER BY cb.block_order
   )
   FROM content_blocks cb
   WHERE cb.slide_id = s.id
   )
   ) ORDER BY s.slide_order
   ) as slides
   FROM lessons l
   JOIN slides s ON s.lesson_id = l.id
   WHERE l.id = $1
   GROUP BY l.id;
3. Get Student Dashboard Data
   sqlSELECT
   c.id,
   c.title_en,
   c.thumbnail_url,
   e.progress_percentage,
   e.last_accessed_at,
   COUNT(l.id) as total_lessons,
   COUNT(lp.id) FILTER (WHERE lp.status = 'completed') as completed_lessons
   FROM enrollments e
   JOIN courses c ON c.id = e.course_id
   LEFT JOIN lessons l ON l.course_id = c.id
   LEFT JOIN lesson_progress lp ON lp.lesson_id = l.id AND lp.enrollment_id = e.id
   WHERE e.student_id = $1
   AND e.status = 'active'
   GROUP BY c.id, e.id
   ORDER BY e.last_accessed_at DESC;
4. Get Quiz Results with Statistics
   sqlSELECT
   qs.id,
   qs.score_percentage,
   qs.passed,
   qs.submitted_at,
   q.title_en,
   q.passing_score_percentage,
   COUNT(qa.id) as total_questions,
   COUNT(qa.id) FILTER (WHERE qa.is_correct = true) as correct_answers
   FROM quiz_submissions qs
   JOIN quizzes q ON q.id = qs.quiz_id
   LEFT JOIN question_answers qa ON qa.submission_id = qs.id
   WHERE qs.student_id = $1
   GROUP BY qs.id, q.id
   ORDER BY qs.submitted_at DESC;

Database Performance Recommendations

1. Connection Pooling
   javascript// Use pg-pool with these settings
   const pool = new Pool({
   max: 20,
   idleTimeoutMillis: 30000,
   connectionTimeoutMillis: 2000,
   });
2. Query Optimization

Always use parameterized queries (prevent SQL injection)
Use EXPLAIN ANALYZE for slow queries
Add indexes based on actual usage patterns
Avoid SELECT \* - select only needed columns

3. Caching Strategy (with Redis)

Cache course lists (5 min TTL)
Cache lesson content (15 min TTL)
Cache user permissions (10 min TTL)
Invalidate on updates

4. Pagination
   sql-- Use cursor-based pagination for better performance
   SELECT \* FROM courses
   WHERE id > $1 -- cursor
   ORDER BY id
   LIMIT 20;
