-- ============================================================================
-- USERS & AUTHENTICATION
-- ============================================================================

CREATE TYPE user_role AS ENUM ('teacher', 'student', 'admin');
CREATE TYPE user_status AS ENUM ('active', 'inactive', 'suspended');

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  status user_status NOT NULL DEFAULT 'active',
  preferred_language VARCHAR(2) DEFAULT 'en', -- 'en' or 'fr'
  profile_image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  last_login_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- ============================================================================
-- COURSES
-- ============================================================================

CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title_en VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  description_en TEXT,
  description_fr TEXT,
  thumbnail_url TEXT,
  status course_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT FALSE,
  estimated_duration_minutes INTEGER, -- Total estimated time
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_courses_teacher ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);
CREATE INDEX idx_courses_featured ON courses(is_featured) WHERE is_featured = TRUE;

-- ============================================================================
-- LESSONS
-- ============================================================================

CREATE TYPE lesson_status AS ENUM ('draft', 'published', 'archived');

CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  description_en TEXT,
  description_fr TEXT,
  lesson_order INTEGER NOT NULL, -- Order within course
  status lesson_status NOT NULL DEFAULT 'draft',
  estimated_duration_minutes INTEGER,
  
  -- PowerPoint import metadata
  imported_from_pptx BOOLEAN DEFAULT FALSE,
  original_filename VARCHAR(255),
  import_date TIMESTAMP WITH TIME ZONE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  published_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_lessons_course ON lessons(course_id);
CREATE INDEX idx_lessons_order ON lessons(course_id, lesson_order);
CREATE INDEX idx_lessons_status ON lessons(status);

-- ============================================================================
-- SLIDES
-- ============================================================================

CREATE TYPE slide_layout AS ENUM (
  'title',           -- Title slide
  'content',         -- General content
  'two_column',      -- Two column layout
  'image_focus',     -- Image-focused
  'verse_highlight', -- Bible verse highlight
  'quiz',           -- Quiz slide
  'comparison'      -- Side-by-side comparison
);

CREATE TABLE slides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slide_order INTEGER NOT NULL,
  layout slide_layout NOT NULL DEFAULT 'content',
  
  -- Slide-level content (optional, for simple slides)
  title_en VARCHAR(500),
  title_fr VARCHAR(500),
  notes_en TEXT, -- Teacher notes
  notes_fr TEXT,
  
  -- Styling
  background_color VARCHAR(7), -- Hex color
  background_image_url TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(lesson_id, slide_order)
);

CREATE INDEX idx_slides_lesson ON slides(lesson_id);
CREATE INDEX idx_slides_order ON slides(lesson_id, slide_order);

-- ============================================================================
-- CONTENT BLOCKS (Rich content within slides)
-- ============================================================================

CREATE TYPE content_block_type AS ENUM (
  'text',           -- Rich text content
  'heading',        -- Heading/title
  'image',          -- Image with caption
  'verse',          -- Bible verse reference
  'vocabulary',     -- Vocabulary term + definition
  'callout',        -- Highlighted callout box
  'list',           -- Bullet or numbered list
  'quote',          -- Quotation
  'divider',        -- Visual separator
  'embedded_quiz'   -- Quiz embedded in slide
);

CREATE TABLE content_blocks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  block_type content_block_type NOT NULL,
  block_order INTEGER NOT NULL,
  
  -- Content (bilingual)
  content_en JSONB, -- Flexible JSON structure based on block_type
  content_fr JSONB,
  
  -- Styling
  style_config JSONB, -- Colors, fonts, alignment, etc.
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(slide_id, block_order)
);

CREATE INDEX idx_content_blocks_slide ON content_blocks(slide_id);
CREATE INDEX idx_content_blocks_type ON content_blocks(block_type);
CREATE INDEX idx_content_blocks_order ON content_blocks(slide_id, block_order);

-- GIN index for JSON queries
CREATE INDEX idx_content_blocks_content_en ON content_blocks USING GIN(content_en);
CREATE INDEX idx_content_blocks_content_fr ON content_blocks USING GIN(content_fr);

-- ============================================================================
-- QUIZZES & ASSESSMENTS
-- ============================================================================

CREATE TYPE quiz_type AS ENUM (
  'practice',        -- Practice quiz (can retake)
  'assessment',      -- Graded assessment
  'completion_test'  -- Final completion test
);

CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID REFERENCES lessons(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title_en VARCHAR(255) NOT NULL,
  title_fr VARCHAR(255),
  description_en TEXT,
  description_fr TEXT,
  quiz_type quiz_type NOT NULL DEFAULT 'practice',
  
  -- Quiz settings
  time_limit_minutes INTEGER, -- NULL = no limit
  passing_score_percentage INTEGER DEFAULT 70,
  max_attempts INTEGER, -- NULL = unlimited
  shuffle_questions BOOLEAN DEFAULT FALSE,
  show_correct_answers BOOLEAN DEFAULT TRUE,
  
  -- Positioning
  display_after_slide_id UUID REFERENCES slides(id), -- NULL = end of lesson
  quiz_order INTEGER,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Either lesson_id or course_id must be set, not both
  CONSTRAINT quiz_parent_check CHECK (
    (lesson_id IS NOT NULL AND course_id IS NULL) OR
    (lesson_id IS NULL AND course_id IS NOT NULL)
  )
);

CREATE INDEX idx_quizzes_lesson ON quizzes(lesson_id);
CREATE INDEX idx_quizzes_course ON quizzes(course_id);
CREATE INDEX idx_quizzes_type ON quizzes(quiz_type);

-- ============================================================================
-- QUESTIONS
-- ============================================================================

CREATE TYPE question_type AS ENUM (
  'multiple_choice',
  'true_false',
  'fill_blank',
  'matching',
  'short_answer',
  'essay'
);

CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  question_type question_type NOT NULL,
  question_order INTEGER NOT NULL,
  
  -- Question content (bilingual)
  question_text_en TEXT NOT NULL,
  question_text_fr TEXT,
  
  -- Question data (structure varies by type)
  question_data JSONB NOT NULL,
  /*
    For multiple_choice:
    {
      "options": [
        {"id": "a", "text_en": "...", "text_fr": "...", "is_correct": true},
        {"id": "b", "text_en": "...", "text_fr": "...", "is_correct": false}
      ]
    }
    
    For fill_blank:
    {
      "correct_answers": ["answer1", "answer2"], // Multiple accepted answers
      "case_sensitive": false
    }
    
    For matching:
    {
      "pairs": [
        {"left_en": "...", "left_fr": "...", "right_en": "...", "right_fr": "..."}
      ]
    }
    
    For short_answer/essay:
    {
      "max_words": 200,
      "rubric_en": "...",
      "rubric_fr": "..."
    }
  */
  
  -- Explanation (shown after answer)
  explanation_en TEXT,
  explanation_fr TEXT,
  
  -- Scoring
  points INTEGER DEFAULT 1,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(quiz_id, question_order)
);

CREATE INDEX idx_questions_quiz ON questions(quiz_id);
CREATE INDEX idx_questions_type ON questions(question_type);
CREATE INDEX idx_questions_order ON questions(quiz_id, question_order);

-- ============================================================================
-- ENROLLMENTS
-- ============================================================================

CREATE TYPE enrollment_status AS ENUM ('active', 'completed', 'dropped');

CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  status enrollment_status NOT NULL DEFAULT 'active',
  
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  -- Progress summary
  lessons_completed INTEGER DEFAULT 0,
  total_lessons INTEGER DEFAULT 0,
  progress_percentage INTEGER DEFAULT 0,
  
  UNIQUE(student_id, course_id)
);

CREATE INDEX idx_enrollments_student ON enrollments(student_id);
CREATE INDEX idx_enrollments_course ON enrollments(course_id);
CREATE INDEX idx_enrollments_status ON enrollments(status);

-- ============================================================================
-- LESSON PROGRESS
-- ============================================================================

CREATE TYPE lesson_progress_status AS ENUM ('not_started', 'in_progress', 'completed');

CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  status lesson_progress_status NOT NULL DEFAULT 'not_started',
  
  -- Slide tracking
  last_slide_viewed_id UUID REFERENCES slides(id),
  slides_viewed INTEGER DEFAULT 0,
  total_slides INTEGER DEFAULT 0,
  
  -- Time tracking
  time_spent_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_accessed_at TIMESTAMP WITH TIME ZONE,
  
  UNIQUE(enrollment_id, lesson_id)
);

CREATE INDEX idx_lesson_progress_enrollment ON lesson_progress(enrollment_id);
CREATE INDEX idx_lesson_progress_lesson ON lesson_progress(lesson_id);
CREATE INDEX idx_lesson_progress_status ON lesson_progress(status);

-- ============================================================================
-- QUIZ SUBMISSIONS
-- ============================================================================

CREATE TYPE submission_status AS ENUM ('in_progress', 'submitted', 'graded');

CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  
  attempt_number INTEGER NOT NULL,
  status submission_status NOT NULL DEFAULT 'in_progress',
  
  -- Timing
  started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  
  -- Scoring
  total_points INTEGER,
  earned_points INTEGER,
  score_percentage INTEGER,
  passed BOOLEAN,
  
  -- Time taken
  time_spent_seconds INTEGER,
  
  UNIQUE(quiz_id, student_id, attempt_number)
);

CREATE INDEX idx_quiz_submissions_quiz ON quiz_submissions(quiz_id);
CREATE INDEX idx_quiz_submissions_student ON quiz_submissions(student_id);
CREATE INDEX idx_quiz_submissions_enrollment ON quiz_submissions(enrollment_id);
CREATE INDEX idx_quiz_submissions_status ON quiz_submissions(status);

-- ============================================================================
-- QUESTION ANSWERS
-- ============================================================================

CREATE TABLE question_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES quiz_submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  
  -- Student's answer (structure varies by question type)
  answer_data JSONB NOT NULL,
  /*
    For multiple_choice: {"selected": "a"}
    For fill_blank: {"answer": "text"}
    For matching: {"pairs": [{"left": 0, "right": 2}, ...]}
    For short_answer/essay: {"text": "..."}
  */
  
  -- Grading
  is_correct BOOLEAN, -- NULL for manually graded questions
  points_earned INTEGER,
  
  -- Manual grading
  teacher_feedback TEXT,
  graded_by_id UUID REFERENCES users(id),
  graded_at TIMESTAMP WITH TIME ZONE,
  
  answered_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(submission_id, question_id)
);

CREATE INDEX idx_question_answers_submission ON question_answers(submission_id);
CREATE INDEX idx_question_answers_question ON question_answers(question_id);
CREATE INDEX idx_question_answers_grading ON question_answers(is_correct) WHERE is_correct IS NULL;

-- ============================================================================
-- CERTIFICATES
-- ============================================================================

CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enrollment_id UUID NOT NULL REFERENCES enrollments(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  certificate_url TEXT, -- PDF or image URL
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Certificate data for generation
  student_name VARCHAR(255) NOT NULL,
  course_title VARCHAR(255) NOT NULL,
  completion_date DATE NOT NULL,
  certificate_number VARCHAR(50) UNIQUE,
  
  UNIQUE(enrollment_id)
);

CREATE INDEX idx_certificates_student ON certificates(student_id);
CREATE INDEX idx_certificates_course ON certificates(course_id);
CREATE INDEX idx_certificates_number ON certificates(certificate_number);

-- ============================================================================
-- MEDIA ASSETS (Images, files uploaded)
-- ============================================================================

CREATE TYPE asset_type AS ENUM ('image', 'document', 'audio', 'video', 'other');

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  uploaded_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  
  asset_type asset_type NOT NULL,
  filename VARCHAR(255) NOT NULL,
  original_filename VARCHAR(255) NOT NULL,
  file_size_bytes BIGINT NOT NULL,
  mime_type VARCHAR(100) NOT NULL,
  
  -- Storage location
  storage_url TEXT NOT NULL,
  thumbnail_url TEXT, -- For images/videos
  
  -- Metadata
  width INTEGER, -- For images
  height INTEGER,
  duration_seconds INTEGER, -- For audio/video
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  -- Usage tracking (optional)
  used_in_content BOOLEAN DEFAULT FALSE
);

CREATE INDEX idx_media_assets_uploader ON media_assets(uploaded_by_id);
CREATE INDEX idx_media_assets_type ON media_assets(asset_type);
CREATE INDEX idx_media_assets_created ON media_assets(created_at DESC);

-- ============================================================================
-- BOOKMARKS (Student saves specific slides)
-- ============================================================================

CREATE TABLE bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  slide_id UUID NOT NULL REFERENCES slides(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  
  note TEXT, -- Optional student note
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(student_id, slide_id)
);

CREATE INDEX idx_bookmarks_student ON bookmarks(student_id);
CREATE INDEX idx_bookmarks_lesson ON bookmarks(lesson_id);

-- ============================================================================
-- NOTES (Student notes on lessons)
-- ============================================================================

CREATE TABLE student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  slide_id UUID REFERENCES slides(id) ON DELETE CASCADE, -- NULL = general lesson note
  
  note_text TEXT NOT NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_student_notes_student ON student_notes(student_id);
CREATE INDEX idx_student_notes_lesson ON student_notes(lesson_id);
CREATE INDEX idx_student_notes_slide ON student_notes(slide_id);

-- ============================================================================
-- VOCABULARY GLOSSARY (Auto-generated from vocabulary blocks)
-- ============================================================================

CREATE TABLE vocabulary_terms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  
  term_en VARCHAR(255) NOT NULL,
  term_fr VARCHAR(255),
  definition_en TEXT NOT NULL,
  definition_fr TEXT,
  
  -- First appearance
  first_lesson_id UUID REFERENCES lessons(id),
  first_slide_id UUID REFERENCES slides(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  
  UNIQUE(course_id, term_en)
);

CREATE INDEX idx_vocabulary_course ON vocabulary_terms(course_id);
CREATE INDEX idx_vocabulary_term_en ON vocabulary_terms(term_en);

-- ============================================================================
-- ACTIVITY LOG (Audit trail)
-- ============================================================================

CREATE TYPE activity_type AS ENUM (
  'lesson_created',
  'lesson_published',
  'lesson_viewed',
  'quiz_started',
  'quiz_completed',
  'course_enrolled',
  'course_completed',
  'certificate_issued'
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type activity_type NOT NULL,
  
  -- Related entities
  course_id UUID REFERENCES courses(id),
  lesson_id UUID REFERENCES lessons(id),
  quiz_id UUID REFERENCES quizzes(id),
  
  -- Additional data
  metadata JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_activity_log_user ON activity_log(user_id, created_at DESC);
CREATE INDEX idx_activity_log_type ON activity_log(activity_type);
CREATE INDEX idx_activity_log_created ON activity_log(created_at DESC);

-- ============================================================================
-- FUNCTIONS & TRIGGERS
-- ============================================================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lessons_updated_at BEFORE UPDATE ON lessons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_slides_updated_at BEFORE UPDATE ON slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_blocks_updated_at BEFORE UPDATE ON content_blocks
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON questions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON student_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- INITIAL DATA / SEED
-- ============================================================================

-- Create default admin user (change password after first login!)
INSERT INTO users (email, password_hash, first_name, last_name, role, status)
VALUES (
  'admin@biblestudyplatform.com',
  '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'password'
  'Admin',
  'User',
  'admin',
  'active'
);