import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Progress Tracking (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let studentId: string;
  let courseId: string;
  let lessonId: string;
  let enrollmentId: string;

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
    // Clean up database
    await prisma.lessonProgress.deleteMany();
    await prisma.slide.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Create test data
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
    studentId = student.id;

    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        title_en: 'Test Course',
        description_en: 'Description',
        teacher_id: teacher.id,
        status: 'PUBLISHED',
      },
    });
    courseId = course.id;

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
    lessonId = lesson.id;

    // Create slides for the lesson
    await prisma.slide.createMany({
      data: [
        {
          lesson_id: lessonId,
          slide_order: 1,
          layout: 'TITLE',
        },
        {
          lesson_id: lessonId,
          slide_order: 2,
          layout: 'CONTENT',
        },
        {
          lesson_id: lessonId,
          slide_order: 3,
          layout: 'CONTENT',
        },
      ],
    });

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE',
        total_lessons: 1,
      },
    });
    enrollmentId = enrollment.id;

    // Login
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'student@test.com',
      password: 'password123',
    });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('GET /api/lessons/:lessonId/progress', () => {
    it('should create and return initial progress if not exists', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        lesson_id: lessonId,
        enrollment_id: enrollmentId,
        status: 'NOT_STARTED',
        current_slide_index: 0,
        total_slides_viewed: 0,
        time_spent_seconds: 0,
        completion_percentage: 0,
      });
    });

    it('should return existing progress', async () => {
      // Create progress
      await prisma.lessonProgress.create({
        data: {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          status: 'IN_PROGRESS',
          current_slide_index: 1,
          total_slides_viewed: 2,
          time_spent_seconds: 120,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        status: 'IN_PROGRESS',
        current_slide_index: 1,
        total_slides_viewed: 2,
        time_spent_seconds: 120,
        completion_percentage: 66, // 2/3 slides viewed
      });
    });

    it('should return 403 if not enrolled in course', async () => {
      await prisma.enrollment.deleteMany();

      await request(app.getHttpServer())
        .get(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('POST /api/lessons/:lessonId/progress', () => {
    it('should update lesson progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          current_slide_index: 1,
          total_slides_viewed: 2,
          time_spent_seconds: 60,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        status: 'IN_PROGRESS',
        current_slide_index: 1,
        total_slides_viewed: 2,
        time_spent_seconds: 60,
      });
    });

    it('should auto-complete when all slides viewed', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          current_slide_index: 2,
          total_slides_viewed: 3,
          time_spent_seconds: 300,
        })
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completed_at).toBeTruthy();
      expect(response.body.completion_percentage).toBe(100);
    });

    it('should update enrollment progress when lesson completed', async () => {
      await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          total_slides_viewed: 3,
        })
        .expect(201);

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
      });

      expect(enrollment?.lessons_completed).toBe(1);
      expect(enrollment?.progress_percentage).toBe(100);
      expect(enrollment?.status).toBe('COMPLETED');
    });
  });

  describe('POST /api/lessons/:lessonId/slides/view', () => {
    it('should mark slide as viewed and update progress', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slide_index: 0,
          time_spent_seconds: 30,
        })
        .expect(201);

      expect(response.body).toMatchObject({
        current_slide_index: 0,
        total_slides_viewed: 1,
        time_spent_seconds: 30,
        status: 'IN_PROGRESS',
        completion_percentage: 33, // 1/3 slides
      });
    });

    it('should handle viewing slides out of order', async () => {
      // View slide 2 first
      await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slide_index: 2,
          time_spent_seconds: 20,
        });

      // View slide 0
      const response = await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          slide_index: 0,
          time_spent_seconds: 15,
        })
        .expect(201);

      expect(response.body.total_slides_viewed).toBe(3); // Max of current and previous
      expect(response.body.time_spent_seconds).toBe(35);
    });

    it('should complete lesson when all slides viewed via markSlideViewed', async () => {
      // View all slides
      await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ slide_index: 0, time_spent_seconds: 10 });

      await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ slide_index: 1, time_spent_seconds: 10 });

      const response = await request(app.getHttpServer())
        .post(`/api/lessons/${lessonId}/slides/view`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ slide_index: 2, time_spent_seconds: 10 })
        .expect(201);

      expect(response.body.status).toBe('COMPLETED');
      expect(response.body.completion_percentage).toBe(100);
    });
  });

  describe('GET /api/courses/:courseId/progress', () => {
    beforeEach(async () => {
      // Create another lesson
      const lesson2 = await prisma.lesson.create({
        data: {
          slug: 'test-lesson-2',
          title_en: 'Test Lesson 2',
          course_id: courseId,
          lesson_order: 2,
          status: 'PUBLISHED',
          estimated_minutes: 45,
        },
      });

      await prisma.slide.create({
        data: {
          lesson_id: lesson2.id,
          slide_order: 1,
          layout: 'CONTENT',
        },
      });

      // Update enrollment total lessons
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { total_lessons: 2 },
      });
    });

    it('should return overall course progress', async () => {
      // Complete first lesson
      await prisma.lessonProgress.create({
        data: {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
          status: 'COMPLETED',
          total_slides_viewed: 3,
          time_spent_seconds: 300,
        },
      });

      // Update enrollment
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          lessons_completed: 1,
          progress_percentage: 50,
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        course_id: courseId,
        total_lessons: 2,
        lessons_completed: 1,
        lessons_in_progress: 0,
        lessons_not_started: 1,
        overall_completion_percentage: 50,
        total_time_spent_seconds: 300,
      });

      expect(response.body.lesson_progress).toHaveLength(2);
    });

    it('should calculate estimated time remaining', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/courses/${courseId}/progress`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      // Total estimated: 30 + 45 = 75 minutes
      expect(response.body.estimated_time_remaining_seconds).toBeGreaterThan(0);
    });
  });

  describe('Concurrent Updates', () => {
    it('should handle concurrent progress updates', async () => {
      const updates = [
        request(app.getHttpServer())
          .post(`/api/lessons/${lessonId}/slides/view`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ slide_index: 0, time_spent_seconds: 10 }),
        request(app.getHttpServer())
          .post(`/api/lessons/${lessonId}/slides/view`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ slide_index: 1, time_spent_seconds: 15 }),
        request(app.getHttpServer())
          .post(`/api/lessons/${lessonId}/slides/view`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ slide_index: 2, time_spent_seconds: 20 }),
      ];

      await Promise.all(updates);

      const progress = await prisma.lessonProgress.findFirst({
        where: {
          enrollment_id: enrollmentId,
          lesson_id: lessonId,
        },
      });

      expect(progress?.total_slides_viewed).toBeGreaterThanOrEqual(1);
      expect(progress?.time_spent_seconds).toBeGreaterThan(0);
    });
  });
});
