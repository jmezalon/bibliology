import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

describe('Notes (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let studentId: string;
  let lessonId: string;

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
    // Clean up
    await prisma.studentNote.deleteMany();
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

    const lesson = await prisma.lesson.create({
      data: {
        slug: 'test-lesson',
        title_en: 'Test Lesson',
        course_id: course.id,
        lesson_order: 1,
        status: 'PUBLISHED',
      },
    });
    lessonId = lesson.id;

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

  describe('POST /api/notes', () => {
    it('should create a new note', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lesson_id: lessonId,
          slide_index: 0,
          note_text: 'This is my first note',
        })
        .expect(201);

      expect(response.body).toMatchObject({
        student_id: studentId,
        lesson_id: lessonId,
        slide_index: 0,
        note_text: 'This is my first note',
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.created_at).toBeDefined();
    });

    it('should handle very long notes (10,000 characters)', async () => {
      const longNote = 'A'.repeat(10000);

      const response = await request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lesson_id: lessonId,
          slide_index: 5,
          note_text: longNote,
        })
        .expect(201);

      expect(response.body.note_text).toHaveLength(10000);
    });

    it('should return 400 for invalid data', async () => {
      await request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lesson_id: lessonId,
          // Missing slide_index
          note_text: 'Note without slide index',
        })
        .expect(400);
    });

    it('should return 404 if lesson does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/notes')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lesson_id: 'non-existent-id',
          slide_index: 0,
          note_text: 'Note for non-existent lesson',
        })
        .expect(404);
    });
  });

  describe('GET /api/lessons/:lessonId/notes', () => {
    beforeEach(async () => {
      // Create multiple notes
      await prisma.studentNote.createMany({
        data: [
          {
            student_id: studentId,
            lesson_id: lessonId,
            slide_index: 0,
            note_text: 'Note on slide 0',
          },
          {
            student_id: studentId,
            lesson_id: lessonId,
            slide_index: 2,
            note_text: 'Note on slide 2',
          },
          {
            student_id: studentId,
            lesson_id: lessonId,
            slide_index: 1,
            note_text: 'Note on slide 1',
          },
        ],
      });
    });

    it('should return all notes for a lesson ordered by slide index', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/lessons/${lessonId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0].slide_index).toBe(0);
      expect(response.body[1].slide_index).toBe(1);
      expect(response.body[2].slide_index).toBe(2);
    });

    it('should only return notes for the current student', async () => {
      // Create another student with notes
      const otherStudent = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password_hash: 'hashed',
          name: 'Other',
          role: 'STUDENT',
        },
      });

      await prisma.studentNote.create({
        data: {
          student_id: otherStudent.id,
          lesson_id: lessonId,
          slide_index: 5,
          note_text: 'Other student note',
        },
      });

      const response = await request(app.getHttpServer())
        .get(`/api/lessons/${lessonId}/notes`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toHaveLength(3); // Only current student's notes
      expect(response.body.every((note: any) => note.student_id === studentId)).toBe(true);
    });
  });

  describe('PUT /api/notes/:id', () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await prisma.studentNote.create({
        data: {
          student_id: studentId,
          lesson_id: lessonId,
          slide_index: 0,
          note_text: 'Original note',
        },
      });
      noteId = note.id;
    });

    it('should update a note', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note_text: 'Updated note text',
        })
        .expect(200);

      expect(response.body.note_text).toBe('Updated note text');
      expect(response.body.id).toBe(noteId);
    });

    it('should return 404 if note does not exist', async () => {
      await request(app.getHttpServer())
        .put('/api/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note_text: 'Updated text',
        })
        .expect(404);
    });

    it('should return 403 if trying to update another student note', async () => {
      const otherStudent = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password_hash: 'hashed',
          name: 'Other',
          role: 'STUDENT',
        },
      });

      const otherNote = await prisma.studentNote.create({
        data: {
          student_id: otherStudent.id,
          lesson_id: lessonId,
          slide_index: 0,
          note_text: 'Other student note',
        },
      });

      await request(app.getHttpServer())
        .put(`/api/notes/${otherNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          note_text: 'Trying to update other student note',
        })
        .expect(403);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    let noteId: string;

    beforeEach(async () => {
      const note = await prisma.studentNote.create({
        data: {
          student_id: studentId,
          lesson_id: lessonId,
          slide_index: 0,
          note_text: 'Note to delete',
        },
      });
      noteId = note.id;
    });

    it('should delete a note', async () => {
      await request(app.getHttpServer())
        .delete(`/api/notes/${noteId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(204);

      const deletedNote = await prisma.studentNote.findUnique({
        where: { id: noteId },
      });

      expect(deletedNote).toBeNull();
    });

    it('should return 404 if note does not exist', async () => {
      await request(app.getHttpServer())
        .delete('/api/notes/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should return 403 if trying to delete another student note', async () => {
      const otherStudent = await prisma.user.create({
        data: {
          email: 'other@test.com',
          password_hash: 'hashed',
          name: 'Other',
          role: 'STUDENT',
        },
      });

      const otherNote = await prisma.studentNote.create({
        data: {
          student_id: otherStudent.id,
          lesson_id: lessonId,
          slide_index: 0,
          note_text: 'Other student note',
        },
      });

      await request(app.getHttpServer())
        .delete(`/api/notes/${otherNote.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });
  });

  describe('Authorization', () => {
    it('should return 401 without auth token', async () => {
      await request(app.getHttpServer()).get(`/api/lessons/${lessonId}/notes`).expect(401);
    });
  });
});
