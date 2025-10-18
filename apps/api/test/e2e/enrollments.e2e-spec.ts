import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Enrollments (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let studentId: string;
  let teacherId: string;
  let courseId: string;

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
    await prisma.enrollment.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Create test teacher
    const teacher = await prisma.user.create({
      data: {
        email: 'teacher@test.com',
        password_hash: 'hashed_password',
        name: 'Test Teacher',
        role: 'TEACHER',
      },
    });
    teacherId = teacher.id;

    // Create test student
    const student = await prisma.user.create({
      data: {
        email: 'student@test.com',
        password_hash: 'hashed_password',
        name: 'Test Student',
        role: 'STUDENT',
      },
    });
    studentId = student.id;

    // Create test course
    const course = await prisma.course.create({
      data: {
        slug: 'test-course',
        title_en: 'Test Course',
        description_en: 'Test course description',
        teacher_id: teacherId,
        status: 'PUBLISHED',
      },
    });
    courseId = course.id;

    // Create lessons for the course
    await prisma.lesson.createMany({
      data: [
        {
          slug: 'lesson-1',
          title_en: 'Lesson 1',
          course_id: courseId,
          lesson_order: 1,
          status: 'PUBLISHED',
        },
        {
          slug: 'lesson-2',
          title_en: 'Lesson 2',
          course_id: courseId,
          lesson_order: 2,
          status: 'PUBLISHED',
        },
      ],
    });

    // Login as student to get auth token
    const loginResponse = await request(app.getHttpServer()).post('/api/auth/login').send({
      email: 'student@test.com',
      password: 'password123',
    });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /api/enrollments/courses/:courseId', () => {
    it('should enroll a student in a course', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body).toMatchObject({
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE',
        progress_percentage: 0,
        lessons_completed: 0,
        total_lessons: 2,
      });
    });

    it('should return 409 if already enrolled', async () => {
      // First enrollment
      await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      // Second enrollment should fail
      await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(409);
    });

    it('should return 404 if course does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/enrollments/courses/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 if course is not published', async () => {
      const draftCourse = await prisma.course.create({
        data: {
          slug: 'draft-course',
          title_en: 'Draft Course',
          description_en: 'Draft course description',
          teacher_id: teacherId,
          status: 'DRAFT',
        },
      });

      await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${draftCourse.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('should reactivate dropped enrollment', async () => {
      // Create a dropped enrollment
      const enrollment = await prisma.enrollment.create({
        data: {
          student_id: studentId,
          course_id: courseId,
          status: 'DROPPED',
          total_lessons: 2,
        },
      });

      // Re-enroll
      const response = await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(response.body.id).toBe(enrollment.id);
      expect(response.body.status).toBe('ACTIVE');
    });
  });

  describe('GET /api/enrollments/me', () => {
    beforeEach(async () => {
      // Create enrollments
      await prisma.enrollment.createMany({
        data: [
          {
            student_id: studentId,
            course_id: courseId,
            status: 'ACTIVE',
            total_lessons: 2,
          },
        ],
      });
    });

    it('should return all enrollments for the student', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/enrollments/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0]).toMatchObject({
        student_id: studentId,
        course_id: courseId,
        status: 'ACTIVE',
      });
      expect(response.body[0].course).toBeDefined();
      expect(response.body[0].course.title_en).toBe('Test Course');
    });

    it('should filter by status', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/enrollments/me?status=ACTIVE')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].status).toBe('ACTIVE');
    });
  });

  describe('DELETE /api/enrollments/:id', () => {
    let enrollmentId: string;

    beforeEach(async () => {
      const enrollment = await prisma.enrollment.create({
        data: {
          student_id: studentId,
          course_id: courseId,
          status: 'ACTIVE',
          total_lessons: 2,
        },
      });
      enrollmentId = enrollment.id;
    });

    it('should unenroll from a course', async () => {
      await request(app.getHttpServer())
        .delete(`/api/enrollments/${enrollmentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const enrollment = await prisma.enrollment.findUnique({
        where: { id: enrollmentId },
      });

      expect(enrollment?.status).toBe('DROPPED');
    });

    it('should return 404 if enrollment does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/api/enrollments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 if trying to unenroll another student', async () => {
      const otherStudent = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password_hash: 'hashed',
          name: 'Other Student',
          role: 'STUDENT',
        },
      });

      const otherEnrollment = await prisma.enrollment.create({
        data: {
          student_id: otherStudent.id,
          course_id: courseId,
          status: 'ACTIVE',
          total_lessons: 2,
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/enrollments/${otherEnrollment.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Authorization', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get('/api/enrollments/me').expect(401);
    });

    it('should deny teacher access to student enrollments', async () => {
      // Login as teacher
      const teacherLogin = await request(app.getHttpServer()).post('/api/auth/login').send({
        email: 'teacher@test.com',
        password: 'password123',
      });

      await request(app.getHttpServer())
        .post(`/api/enrollments/courses/${courseId}`)
        .set('Authorization', `Bearer ${teacherLogin.body.access_token}`)
        .expect(403);
    });
  });
});
