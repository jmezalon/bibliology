import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { PrismaService } from '../../src/prisma/prisma.service';

/**
 * Student Journey Integration Tests
 *
 * Tests the complete student workflow:
 * 1. Student enrolls in a course
 * 2. Views lessons and progresses through slides
 * 3. Progress is tracked accurately
 * 4. Takes notes while studying
 * 5. Completes the course
 */
describe('Student Journey (Integration)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let authToken: string;
  let studentId: string;
  let courseId: string;
  let lesson1Id: string;
  let lesson2Id: string;

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
    // Clean database
    await prisma.studentNote.deleteMany();
    await prisma.lessonProgress.deleteMany();
    await prisma.enrollment.deleteMany();
    await prisma.slide.deleteMany();
    await prisma.lesson.deleteMany();
    await prisma.course.deleteMany();
    await prisma.user.deleteMany();

    // Setup test data
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
        slug: 'intro-theology',
        title_en: 'Introduction to Theology',
        description_en: 'Learn the basics of systematic theology',
        teacher_id: teacher.id,
        status: 'PUBLISHED',
        estimated_hours: 2,
      },
    });
    courseId = course.id;

    // Create Lesson 1 with slides
    const lesson1 = await prisma.lesson.create({
      data: {
        slug: 'lesson-1-doctrine-god',
        title_en: 'The Doctrine of God',
        course_id: courseId,
        lesson_order: 1,
        status: 'PUBLISHED',
        estimated_minutes: 30,
      },
    });
    lesson1Id = lesson1.id;

    await prisma.slide.createMany({
      data: [
        { lesson_id: lesson1Id, slide_order: 1, layout: 'TITLE' },
        { lesson_id: lesson1Id, slide_order: 2, layout: 'CONTENT' },
        { lesson_id: lesson1Id, slide_order: 3, layout: 'CONTENT' },
      ],
    });

    // Create Lesson 2 with slides
    const lesson2 = await prisma.lesson.create({
      data: {
        slug: 'lesson-2-trinity',
        title_en: 'The Trinity',
        course_id: courseId,
        lesson_order: 2,
        status: 'PUBLISHED',
        estimated_minutes: 45,
      },
    });
    lesson2Id = lesson2.id;

    await prisma.slide.createMany({
      data: [
        { lesson_id: lesson2Id, slide_order: 1, layout: 'TITLE' },
        { lesson_id: lesson2Id, slide_order: 2, layout: 'CONTENT' },
      ],
    });

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'student@test.com',
        password: 'password123',
      });

    authToken = loginResponse.body.access_token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete the full student journey successfully', async () => {
    // STEP 1: Student enrolls in course
    const enrollResponse = await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    expect(enrollResponse.body).toMatchObject({
      course_id: courseId,
      student_id: studentId,
      status: 'ACTIVE',
      progress_percentage: 0,
      lessons_completed: 0,
      total_lessons: 2,
    });

    const enrollmentId = enrollResponse.body.id;

    // STEP 2: Student starts Lesson 1
    const lesson1ProgressStart = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/progress`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(lesson1ProgressStart.body.status).toBe('NOT_STARTED');

    // STEP 3: Student views first slide
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        slide_index: 0,
        time_spent_seconds: 45,
      })
      .expect(201);

    // STEP 4: Student takes a note on slide 1
    const note1Response = await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 0,
        note_text: 'Important: God is eternal and unchanging',
      })
      .expect(201);

    expect(note1Response.body.note_text).toContain('eternal');

    // STEP 5: Student continues through all slides in Lesson 1
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 1, time_spent_seconds: 120 })
      .expect(201);

    const note2Response = await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 1,
        note_text: 'The attributes of God: omnipotent, omniscient, omnipresent',
      })
      .expect(201);

    // Complete lesson 1
    const lesson1Complete = await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 2, time_spent_seconds: 90 })
      .expect(201);

    // STEP 6: Verify Lesson 1 is completed
    expect(lesson1Complete.body).toMatchObject({
      status: 'COMPLETED',
      completion_percentage: 100,
      total_slides_viewed: 3,
    });
    expect(lesson1Complete.body.completed_at).toBeTruthy();
    expect(lesson1Complete.body.time_spent_seconds).toBe(255); // 45 + 120 + 90

    // STEP 7: Check course progress - should be 50% (1/2 lessons)
    const courseProgress1 = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(courseProgress1.body).toMatchObject({
      lessons_completed: 1,
      lessons_in_progress: 0,
      lessons_not_started: 1,
      overall_completion_percentage: 50,
    });

    // STEP 8: Verify notes are saved correctly
    const notesResponse = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(notesResponse.body).toHaveLength(2);
    expect(notesResponse.body[0].slide_index).toBe(0);
    expect(notesResponse.body[1].slide_index).toBe(1);

    // STEP 9: Start and complete Lesson 2
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson2Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 0, time_spent_seconds: 60 })
      .expect(201);

    const lesson2Complete = await request(app.getHttpServer())
      .post(`/api/lessons/${lesson2Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 1, time_spent_seconds: 180 })
      .expect(201);

    expect(lesson2Complete.body.status).toBe('COMPLETED');

    // STEP 10: Verify course is 100% complete
    const courseProgressFinal = await request(app.getHttpServer())
      .get(`/api/courses/${courseId}/progress`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(courseProgressFinal.body).toMatchObject({
      lessons_completed: 2,
      lessons_in_progress: 0,
      lessons_not_started: 0,
      overall_completion_percentage: 100,
    });

    // STEP 11: Verify enrollment status is COMPLETED
    const enrollmentFinal = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    expect(enrollmentFinal).toMatchObject({
      status: 'COMPLETED',
      progress_percentage: 100,
      lessons_completed: 2,
    });
    expect(enrollmentFinal?.completed_at).toBeTruthy();

    // STEP 12: Verify total time tracked
    expect(courseProgressFinal.body.total_time_spent_seconds).toBe(495); // 255 + 240
  });

  it('should handle navigating slides out of order', async () => {
    // Enroll
    await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    // View slide 2 first
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 2, time_spent_seconds: 30 })
      .expect(201);

    // Then view slide 0
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 0, time_spent_seconds: 20 })
      .expect(201);

    // Then view slide 1
    const finalProgress = await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 1, time_spent_seconds: 25 })
      .expect(201);

    // All slides should be marked as viewed
    expect(finalProgress.body.total_slides_viewed).toBe(3);
    expect(finalProgress.body.status).toBe('COMPLETED');
  });

  it('should handle multiple notes on the same slide', async () => {
    // Enroll
    await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    // Create multiple notes on slide 0
    await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 0,
        note_text: 'First note',
      })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 0,
        note_text: 'Second note on same slide',
      })
      .expect(201);

    // Verify both notes exist
    const notes = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    const slide0Notes = notes.body.filter((n: any) => n.slide_index === 0);
    expect(slide0Notes).toHaveLength(2);
  });

  it('should handle editing and deleting notes during lesson', async () => {
    // Enroll
    await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    // Create a note
    const createResponse = await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 1,
        note_text: 'Original note text',
      })
      .expect(201);

    const noteId = createResponse.body.id;

    // Edit the note
    await request(app.getHttpServer())
      .put(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        note_text: 'Updated note text with more details',
      })
      .expect(200);

    // Verify update
    let notes = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(notes.body[0].note_text).toContain('Updated');

    // Delete the note
    await request(app.getHttpServer())
      .delete(`/api/notes/${noteId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(204);

    // Verify deletion
    notes = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/notes`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(notes.body).toHaveLength(0);
  });

  it('should isolate student data correctly', async () => {
    // Create another student
    const student2 = await prisma.user.create({
      data: {
        email: 'student2@test.com',
        password_hash: 'hashed',
        name: 'Student 2',
        role: 'STUDENT',
      },
    });

    const login2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({
        email: 'student2@test.com',
        password: 'password123',
      });

    const authToken2 = login2.body.access_token;

    // Both students enroll
    await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(201);

    await request(app.getHttpServer())
      .post(`/api/enrollments/courses/${courseId}`)
      .set('Authorization', `Bearer ${authToken2}`)
      .expect(201);

    // Student 1 makes progress and takes notes
    await request(app.getHttpServer())
      .post(`/api/lessons/${lesson1Id}/slides/view`)
      .set('Authorization', `Bearer ${authToken}`)
      .send({ slide_index: 0, time_spent_seconds: 50 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/notes')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        lesson_id: lesson1Id,
        slide_index: 0,
        note_text: 'Student 1 note',
      })
      .expect(201);

    // Student 2 should see their own fresh progress
    const student2Progress = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/progress`)
      .set('Authorization', `Bearer ${authToken2}`)
      .expect(200);

    expect(student2Progress.body.status).toBe('NOT_STARTED');
    expect(student2Progress.body.total_slides_viewed).toBe(0);

    // Student 2 should not see Student 1's notes
    const student2Notes = await request(app.getHttpServer())
      .get(`/api/lessons/${lesson1Id}/notes`)
      .set('Authorization', `Bearer ${authToken2}`)
      .expect(200);

    expect(student2Notes.body).toHaveLength(0);
  });
});
