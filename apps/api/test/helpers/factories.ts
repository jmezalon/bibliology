import { PrismaClient, UserRole, LessonStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

/**
 * Factory function to create a test user
 */
export async function createTestUser(
  overrides: {
    email?: string;
    password?: string;
    name?: string;
    role?: UserRole;
    language_pref?: string;
  } = {},
) {
  const defaultPassword = 'Password123!';
  const password_hash = await bcrypt.hash(overrides.password || defaultPassword, 10);

  const user = await prisma.user.create({
    data: {
      email: overrides.email || `test-${Date.now()}@example.com`,
      password_hash,
      name: overrides.name || 'Test User',
      role: overrides.role || UserRole.STUDENT,
      language_pref: overrides.language_pref || 'en',
      last_login: new Date(),
    },
  });

  return {
    ...user,
    plainPassword: overrides.password || defaultPassword,
  };
}

/**
 * Factory function to create a test teacher
 */
export async function createTestTeacher(
  overrides: {
    email?: string;
    password?: string;
    name?: string;
  } = {},
) {
  return createTestUser({
    ...overrides,
    role: UserRole.TEACHER,
  });
}

/**
 * Factory function to create a test course
 */
export async function createTestCourse(
  teacherId: string,
  overrides: {
    slug?: string;
    title_en?: string;
    title_fr?: string;
    description_en?: string;
    description_fr?: string;
    status?: LessonStatus;
    category?: string;
    tags?: string[];
    estimated_hours?: number;
    difficulty?: string;
    thumbnail_url?: string;
    cover_image_url?: string;
  } = {},
) {
  const timestamp = Date.now();
  const course = await prisma.course.create({
    data: {
      slug: overrides.slug || `test-course-${timestamp}`,
      teacher_id: teacherId,
      title_en: overrides.title_en || 'Test Course',
      title_fr: overrides.title_fr || 'Cours de Test',
      description_en: overrides.description_en || 'This is a test course description',
      description_fr: overrides.description_fr || 'Ceci est une description de cours de test',
      status: overrides.status || LessonStatus.DRAFT,
      category: overrides.category || 'Biblical Studies',
      tags: overrides.tags || ['test', 'theology'],
      estimated_hours: overrides.estimated_hours || 10,
      difficulty: overrides.difficulty || 'Beginner',
      thumbnail_url: overrides.thumbnail_url,
      cover_image_url: overrides.cover_image_url,
    },
    include: {
      teacher: {
        select: {
          id: true,
          name: true,
          email: true,
          avatar_url: true,
        },
      },
      _count: {
        select: {
          lessons: true,
          enrollments: true,
        },
      },
    },
  });

  return course;
}

/**
 * Factory function to create a test lesson
 */
export async function createTestLesson(
  courseId: string,
  overrides: {
    slug?: string;
    title_en?: string;
    title_fr?: string;
    description_en?: string;
    description_fr?: string;
    lesson_order?: number;
    status?: LessonStatus;
    estimated_minutes?: number;
    imported_from_pptx?: boolean;
    original_filename?: string;
  } = {},
) {
  const timestamp = Date.now();
  const lesson = await prisma.lesson.create({
    data: {
      slug: overrides.slug || `test-lesson-${timestamp}`,
      course_id: courseId,
      title_en: overrides.title_en || 'Test Lesson',
      title_fr: overrides.title_fr || 'Leçon de Test',
      description_en: overrides.description_en || 'This is a test lesson description',
      description_fr: overrides.description_fr || 'Ceci est une description de leçon de test',
      lesson_order: overrides.lesson_order ?? 1,
      status: overrides.status || LessonStatus.DRAFT,
      estimated_minutes: overrides.estimated_minutes || 30,
      imported_from_pptx: overrides.imported_from_pptx || false,
      original_filename: overrides.original_filename,
    },
    include: {
      course: {
        select: {
          id: true,
          title_en: true,
          title_fr: true,
          slug: true,
        },
      },
    },
  });

  return lesson;
}

/**
 * Factory function to create a test slide
 */
export async function createTestSlide(
  lessonId: string,
  overrides: {
    slide_order?: number;
    layout?: string;
    title_en?: string;
    title_fr?: string;
    notes_en?: string;
    notes_fr?: string;
  } = {},
) {
  const slide = await prisma.slide.create({
    data: {
      lesson_id: lessonId,
      slide_order: overrides.slide_order ?? 1,
      layout: overrides.layout || 'CONTENT',
      title_en: overrides.title_en || 'Test Slide',
      title_fr: overrides.title_fr || 'Diapositive de Test',
      notes_en: overrides.notes_en || 'Teacher notes',
      notes_fr: overrides.notes_fr || "Notes de l'enseignant",
    },
  });

  return slide;
}

/**
 * Factory function to create an enrollment
 */
export async function createTestEnrollment(
  studentId: string,
  courseId: string,
  overrides: {
    status?: string;
    progress_percentage?: number;
    lessons_completed?: number;
    total_lessons?: number;
  } = {},
) {
  const enrollment = await prisma.enrollment.create({
    data: {
      student_id: studentId,
      course_id: courseId,
      status: (overrides.status as any) || 'ACTIVE',
      progress_percentage: overrides.progress_percentage || 0,
      lessons_completed: overrides.lessons_completed || 0,
      total_lessons: overrides.total_lessons || 0,
    },
  });

  return enrollment;
}

/**
 * Factory function to create lesson progress
 */
export async function createTestLessonProgress(
  enrollmentId: string,
  lessonId: string,
  overrides: {
    status?: string;
    current_slide_index?: number;
    total_slides_viewed?: number;
    time_spent_seconds?: number;
  } = {},
) {
  const progress = await prisma.lessonProgress.create({
    data: {
      enrollment_id: enrollmentId,
      lesson_id: lessonId,
      status: (overrides.status as any) || 'NOT_STARTED',
      current_slide_index: overrides.current_slide_index || 0,
      total_slides_viewed: overrides.total_slides_viewed || 0,
      time_spent_seconds: overrides.time_spent_seconds || 0,
    },
  });

  return progress;
}

/**
 * Clear all test data from database
 */
export async function clearDatabase() {
  await prisma.questionAnswer.deleteMany({});
  await prisma.quizSubmission.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.studentNote.deleteMany({});
  await prisma.lessonProgress.deleteMany({});
  await prisma.certificate.deleteMany({});
  await prisma.enrollment.deleteMany({});
  await prisma.contentBlock.deleteMany({});
  await prisma.slide.deleteMany({});
  await prisma.lesson.deleteMany({});
  await prisma.course.deleteMany({});
  await prisma.activityLog.deleteMany({});
  await prisma.user.deleteMany({});
}

/**
 * Seed common test data
 */
export async function seedTestData() {
  const teacher = await createTestTeacher({
    email: 'teacher@test.com',
    name: 'Test Teacher',
  });

  const student = await createTestUser({
    email: 'student@test.com',
    name: 'Test Student',
    role: UserRole.STUDENT,
  });

  const course = await createTestCourse(teacher.id, {
    slug: 'test-course',
    title_en: 'Seeded Test Course',
  });

  const lesson = await createTestLesson(course.id, {
    slug: 'test-lesson',
    title_en: 'Seeded Test Lesson',
    lesson_order: 1,
  });

  return { teacher, student, course, lesson };
}
