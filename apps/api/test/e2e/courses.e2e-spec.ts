import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { UserRole, LessonStatus } from '@prisma/client';

import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';
import {
  createTestUser,
  createTestTeacher,
  createTestCourse,
  createTestLesson,
  createTestEnrollment,
  clearDatabase,
} from '../helpers/factories';
import { randomSlug } from '../helpers/test-utils';

describe('Courses E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

  // Helper to get auth token
  const getAuthToken = async (email: string, password: string): Promise<string> => {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password });
    return response.body.access_token;
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
    prismaService = app.get<PrismaService>(PrismaService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    await clearDatabase();
  });

  describe('POST /courses', () => {
    it('should successfully create a course as a teacher', async () => {
      const teacher = await createTestTeacher({
        email: 'teacher@test.com',
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const courseData = {
        slug: randomSlug(),
        title_en: 'Introduction to Theology',
        title_fr: 'Introduction à la Théologie',
        description_en: 'A comprehensive introduction to theology',
        description_fr: 'Une introduction complète à la théologie',
        category: 'Theology',
        tags: ['theology', 'introduction'],
        estimated_hours: 10,
        difficulty: 'Beginner',
      };

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send(courseData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.slug).toBe(courseData.slug);
      expect(response.body.title_en).toBe(courseData.title_en);
      expect(response.body.teacher_id).toBe(teacher.id);
      expect(response.body.status).toBe(LessonStatus.DRAFT);
      expect(response.body).toHaveProperty('teacher');
      expect(response.body).toHaveProperty('lessonCount');
      expect(response.body).toHaveProperty('enrollmentCount');

      // Verify in database
      const course = await prismaService.course.findUnique({
        where: { slug: courseData.slug },
      });
      expect(course).toBeDefined();
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer())
        .post('/courses')
        .send({
          slug: randomSlug(),
          title_en: 'Test Course',
          description_en: 'Description',
        })
        .expect(401);
    });

    it('should return 403 when authenticated as student', async () => {
      const student = await createTestUser({
        email: 'student@test.com',
        password: 'Password123!',
        role: UserRole.STUDENT,
      });
      const token = await getAuthToken(student.email, student.plainPassword);

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: randomSlug(),
          title_en: 'Test Course',
          description_en: 'Description',
        })
        .expect(403);
    });

    it('should return 409 if slug already exists', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const existingCourse = await createTestCourse(teacher.id, {
        slug: 'existing-slug',
      });

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: 'existing-slug',
          title_en: 'Duplicate Course',
          description_en: 'Description',
        })
        .expect(409);
    });

    it('should return 400 for invalid slug format', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: 'Invalid Slug!',
          title_en: 'Test Course',
          description_en: 'Description',
        })
        .expect(400);
    });

    it('should return 400 for invalid URL in thumbnail_url', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: randomSlug(),
          title_en: 'Test Course',
          description_en: 'Description',
          thumbnail_url: 'not-a-valid-url',
        })
        .expect(400);
    });

    it('should accept valid URL for thumbnail_url', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const response = await request(app.getHttpServer())
        .post('/courses')
        .set('Authorization', `Bearer ${token}`)
        .send({
          slug: randomSlug(),
          title_en: 'Test Course',
          description_en: 'Description',
          thumbnail_url: 'https://example.com/image.jpg',
        })
        .expect(201);

      expect(response.body.thumbnail_url).toBe('https://example.com/image.jpg');
    });
  });

  describe('GET /courses', () => {
    it('should return paginated list of courses for teacher', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      // Create multiple courses
      await createTestCourse(teacher.id, { slug: 'course-1' });
      await createTestCourse(teacher.id, { slug: 'course-2' });
      await createTestCourse(teacher.id, { slug: 'course-3' });

      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('limit');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should support pagination', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      // Create 15 courses
      for (let i = 1; i <= 15; i++) {
        await createTestCourse(teacher.id, { slug: `course-${i}` });
      }

      const response = await request(app.getHttpServer())
        .get('/courses?page=2&limit=5')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(5);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(5);
      expect(response.body.total).toBe(15);
      expect(response.body.totalPages).toBe(3);
    });

    it('should only return courses owned by teacher', async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });

      await createTestCourse(teacher1.id, { slug: 'teacher1-course' });
      await createTestCourse(teacher2.id, { slug: 'teacher2-course' });

      const token = await getAuthToken(teacher1.email, teacher1.plainPassword);

      const response = await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].slug).toBe('teacher1-course');
    });

    it('should return 401 when not authenticated', async () => {
      await request(app.getHttpServer()).get('/courses').expect(401);
    });

    it('should return 403 when authenticated as student', async () => {
      const student = await createTestUser({
        password: 'Password123!',
        role: UserRole.STUDENT,
      });
      const token = await getAuthToken(student.email, student.plainPassword);

      await request(app.getHttpServer())
        .get('/courses')
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /courses/:id', () => {
    it('should return course details for owner', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);

      const response = await request(app.getHttpServer())
        .get(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(course.id);
      expect(response.body.slug).toBe(course.slug);
      expect(response.body).toHaveProperty('teacher');
      expect(response.body).toHaveProperty('lessonCount');
    });

    it('should return 404 for non-existent course', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      await request(app.getHttpServer())
        .get('/courses/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it("should return 403 when accessing another teacher's course", async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });

      const course = await createTestCourse(teacher1.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .get(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /courses/:id', () => {
    it('should successfully update course', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);

      const updateData = {
        title_en: 'Updated Course Title',
        description_en: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title_en).toBe(updateData.title_en);
      expect(response.body.description_en).toBe(updateData.description_en);
    });

    it("should return 403 when updating another teacher's course", async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });

      const course = await createTestCourse(teacher1.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .put(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title_en: 'Unauthorized Update' })
        .expect(403);
    });

    it('should return 409 when updating to existing slug', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course1 = await createTestCourse(teacher.id, { slug: 'course-1' });
      const course2 = await createTestCourse(teacher.id, { slug: 'course-2' });

      await request(app.getHttpServer())
        .put(`/courses/${course1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ slug: 'course-2' })
        .expect(409);
    });
  });

  describe('DELETE /courses/:id', () => {
    it('should successfully delete course without enrollments', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);

      await request(app.getHttpServer())
        .delete(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Verify deletion
      const deletedCourse = await prismaService.course.findUnique({
        where: { id: course.id },
      });
      expect(deletedCourse).toBeNull();
    });

    it('should return 400 when deleting course with active enrollments', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const student = await createTestUser({
        role: UserRole.STUDENT,
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);
      await createTestEnrollment(student.id, course.id);

      const response = await request(app.getHttpServer())
        .delete(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toContain('active enrollment');
    });

    it("should return 403 when deleting another teacher's course", async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });

      const course = await createTestCourse(teacher1.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .delete(`/courses/${course.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PATCH /courses/:id/publish', () => {
    it('should successfully publish course with lessons', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);
      await createTestLesson(course.id, { lesson_order: 1 });

      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ publish: true })
        .expect(200);

      expect(response.body.status).toBe(LessonStatus.PUBLISHED);
      expect(response.body.published_at).toBeDefined();
    });

    it('should return 400 when publishing course without lessons', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id);

      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ publish: true })
        .expect(400);

      expect(response.body.message).toContain('without any lessons');
    });

    it('should successfully unpublish course', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      const course = await createTestCourse(teacher.id, {
        status: LessonStatus.PUBLISHED,
      });

      const response = await request(app.getHttpServer())
        .patch(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ publish: false })
        .expect(200);

      expect(response.body.status).toBe(LessonStatus.DRAFT);
      expect(response.body.published_at).toBeNull();
    });

    it("should return 403 when publishing another teacher's course", async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });

      const course = await createTestCourse(teacher1.id);
      await createTestLesson(course.id, { lesson_order: 1 });

      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .patch(`/courses/${course.id}/publish`)
        .set('Authorization', `Bearer ${token}`)
        .send({ publish: true })
        .expect(403);
    });
  });
});
