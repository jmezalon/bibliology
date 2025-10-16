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
  createTestSlide,
  createTestEnrollment,
  createTestLessonProgress,
  clearDatabase,
} from '../helpers/factories';
import { randomSlug } from '../helpers/test-utils';

describe('Lessons E2E Tests', () => {
  let app: INestApplication;
  let prismaService: PrismaService;

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

  describe('POST /lessons', () => {
    it('should successfully create a lesson', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);

      const lessonData = {
        course_id: course.id,
        slug: randomSlug(),
        title_en: 'Introduction to the Holy Spirit',
        title_fr: 'Introduction au Saint-Esprit',
        description_en: 'Understanding the person and work of the Holy Spirit',
        description_fr: 'Comprendre la personne et l\'œuvre du Saint-Esprit',
        lesson_order: 1,
        estimated_minutes: 45,
      };

      const response = await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send(lessonData)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.slug).toBe(lessonData.slug);
      expect(response.body.title_en).toBe(lessonData.title_en);
      expect(response.body.course_id).toBe(course.id);
      expect(response.body.lesson_order).toBe(1);
      expect(response.body.status).toBe(LessonStatus.DRAFT);
    });

    it('should return 401 when not authenticated', async () => {
      const teacher = await createTestTeacher();
      const course = await createTestCourse(teacher.id);

      await request(app.getHttpServer())
        .post('/lessons')
        .send({
          course_id: course.id,
          slug: randomSlug(),
          title_en: 'Test Lesson',
          lesson_order: 1,
        })
        .expect(401);
    });

    it('should return 403 when authenticated as student', async () => {
      const teacher = await createTestTeacher();
      const student = await createTestUser({
        password: 'Password123!',
        role: UserRole.STUDENT,
      });
      const token = await getAuthToken(student.email, student.plainPassword);
      const course = await createTestCourse(teacher.id);

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: course.id,
          slug: randomSlug(),
          title_en: 'Test Lesson',
          lesson_order: 1,
        })
        .expect(403);
    });

    it('should return 403 when creating lesson in another teacher\'s course', async () => {
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
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: course.id,
          slug: randomSlug(),
          title_en: 'Test Lesson',
          lesson_order: 1,
        })
        .expect(403);
    });

    it('should return 409 if lesson slug already exists', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      await createTestLesson(course.id, { slug: 'existing-lesson' });

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: course.id,
          slug: 'existing-lesson',
          title_en: 'Duplicate Lesson',
          lesson_order: 2,
        })
        .expect(409);
    });

    it('should return 409 if lesson order already exists in course', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      await createTestLesson(course.id, { lesson_order: 1 });

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: course.id,
          slug: randomSlug(),
          title_en: 'Duplicate Order Lesson',
          lesson_order: 1,
        })
        .expect(409);
    });

    it('should return 400 for invalid slug format', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);

      await request(app.getHttpServer())
        .post('/lessons')
        .set('Authorization', `Bearer ${token}`)
        .send({
          course_id: course.id,
          slug: 'Invalid Slug!',
          title_en: 'Test Lesson',
          lesson_order: 1,
        })
        .expect(400);
    });
  });

  describe('GET /courses/:courseId/lessons', () => {
    it('should return paginated list of lessons for course', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);

      await createTestLesson(course.id, { lesson_order: 1 });
      await createTestLesson(course.id, { lesson_order: 2 });
      await createTestLesson(course.id, { lesson_order: 3 });

      const response = await request(app.getHttpServer())
        .get(`/courses/${course.id}/lessons`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(response.body).toHaveProperty('page');
      expect(response.body).toHaveProperty('totalPages');
      expect(response.body.data).toHaveLength(3);
      expect(response.body.total).toBe(3);
    });

    it('should return lessons ordered by lesson_order ascending', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);

      await createTestLesson(course.id, { slug: 'lesson-3', lesson_order: 3 });
      await createTestLesson(course.id, { slug: 'lesson-1', lesson_order: 1 });
      await createTestLesson(course.id, { slug: 'lesson-2', lesson_order: 2 });

      const response = await request(app.getHttpServer())
        .get(`/courses/${course.id}/lessons`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data[0].lesson_order).toBe(1);
      expect(response.body.data[1].lesson_order).toBe(2);
      expect(response.body.data[2].lesson_order).toBe(3);
    });

    it('should support pagination', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);

      for (let i = 1; i <= 10; i++) {
        await createTestLesson(course.id, { lesson_order: i });
      }

      const response = await request(app.getHttpServer())
        .get(`/courses/${course.id}/lessons?page=2&limit=3`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.page).toBe(2);
      expect(response.body.limit).toBe(3);
      expect(response.body.total).toBe(10);
      expect(response.body.totalPages).toBe(4);
    });

    it('should return 403 when accessing another teacher\'s course', async () => {
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
        .get(`/courses/${course.id}/lessons`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('GET /lessons/:id', () => {
    it('should return lesson with slides and content blocks', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);
      await createTestSlide(lesson.id, { slide_order: 1 });
      await createTestSlide(lesson.id, { slide_order: 2 });

      const response = await request(app.getHttpServer())
        .get(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.id).toBe(lesson.id);
      expect(response.body).toHaveProperty('slides');
      expect(response.body.slides).toHaveLength(2);
    });

    it('should return 404 for non-existent lesson', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);

      await request(app.getHttpServer())
        .get('/lessons/non-existent-id')
        .set('Authorization', `Bearer ${token}`)
        .expect(404);
    });

    it('should return 403 when accessing another teacher\'s lesson', async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });
      const course = await createTestCourse(teacher1.id);
      const lesson = await createTestLesson(course.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .get(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PUT /lessons/:id', () => {
    it('should successfully update lesson', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);

      const updateData = {
        title_en: 'Updated Lesson Title',
        description_en: 'Updated description',
      };

      const response = await request(app.getHttpServer())
        .put(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.title_en).toBe(updateData.title_en);
      expect(response.body.description_en).toBe(updateData.description_en);
    });

    it('should return 403 when updating another teacher\'s lesson', async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });
      const course = await createTestCourse(teacher1.id);
      const lesson = await createTestLesson(course.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .put(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ title_en: 'Unauthorized Update' })
        .expect(403);
    });

    it('should return 409 when updating to existing slug', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson1 = await createTestLesson(course.id, { slug: 'lesson-1' });
      const lesson2 = await createTestLesson(course.id, { slug: 'lesson-2', lesson_order: 2 });

      await request(app.getHttpServer())
        .put(`/lessons/${lesson1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ slug: 'lesson-2' })
        .expect(409);
    });
  });

  describe('DELETE /lessons/:id', () => {
    it('should successfully delete lesson without student progress', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);

      await request(app.getHttpServer())
        .delete(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(204);

      // Verify deletion
      const deletedLesson = await prismaService.lesson.findUnique({
        where: { id: lesson.id },
      });
      expect(deletedLesson).toBeNull();
    });

    it('should return 400 when deleting lesson with student progress', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const student = await createTestUser({
        role: UserRole.STUDENT,
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);
      const enrollment = await createTestEnrollment(student.id, course.id);
      await createTestLessonProgress(enrollment.id, lesson.id);

      const response = await request(app.getHttpServer())
        .delete(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(400);

      expect(response.body.message).toContain('student progress');
    });

    it('should return 403 when deleting another teacher\'s lesson', async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });
      const course = await createTestCourse(teacher1.id);
      const lesson = await createTestLesson(course.id);
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .delete(`/lessons/${lesson.id}`)
        .set('Authorization', `Bearer ${token}`)
        .expect(403);
    });
  });

  describe('PATCH /lessons/:id/reorder', () => {
    it('should successfully reorder slides', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);
      const slide1 = await createTestSlide(lesson.id, { slide_order: 1 });
      const slide2 = await createTestSlide(lesson.id, { slide_order: 2 });
      const slide3 = await createTestSlide(lesson.id, { slide_order: 3 });

      // Reorder: 3, 1, 2
      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lesson.id}/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          slide_ids: [slide3.id, slide1.id, slide2.id],
        })
        .expect(200);

      // Verify new order
      const updatedSlides = await prismaService.slide.findMany({
        where: { lesson_id: lesson.id },
        orderBy: { slide_order: 'asc' },
      });

      expect(updatedSlides[0].id).toBe(slide3.id);
      expect(updatedSlides[1].id).toBe(slide1.id);
      expect(updatedSlides[2].id).toBe(slide2.id);
    });

    it('should return 400 if slide IDs do not belong to lesson', async () => {
      const teacher = await createTestTeacher({
        password: 'Password123!',
      });
      const token = await getAuthToken(teacher.email, teacher.plainPassword);
      const course = await createTestCourse(teacher.id);
      const lesson = await createTestLesson(course.id);
      const slide1 = await createTestSlide(lesson.id, { slide_order: 1 });

      const response = await request(app.getHttpServer())
        .patch(`/lessons/${lesson.id}/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          slide_ids: [slide1.id, 'invalid-slide-id'],
        })
        .expect(400);

      expect(response.body.message).toContain('do not belong to this lesson');
    });

    it('should return 403 when reordering another teacher\'s lesson', async () => {
      const teacher1 = await createTestTeacher({
        email: 'teacher1@test.com',
        password: 'Password123!',
      });
      const teacher2 = await createTestTeacher({
        email: 'teacher2@test.com',
        password: 'Password123!',
      });
      const course = await createTestCourse(teacher1.id);
      const lesson = await createTestLesson(course.id);
      const slide1 = await createTestSlide(lesson.id, { slide_order: 1 });
      const token = await getAuthToken(teacher2.email, teacher2.plainPassword);

      await request(app.getHttpServer())
        .patch(`/lessons/${lesson.id}/reorder`)
        .set('Authorization', `Bearer ${token}`)
        .send({
          slide_ids: [slide1.id],
        })
        .expect(403);
    });
  });
});
