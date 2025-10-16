import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LessonStatus } from '@prisma/client';

import { LessonsService } from '../../src/courses/lessons.service';
import { CoursesService } from '../../src/courses/courses.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateLessonDto, UpdateLessonDto, ReorderSlidesDto } from '../../src/courses/dto';

// Create mock classes
class MockCoursesService {
  verifyOwnership = vi.fn();
}

class MockPrismaService {
  lesson = {
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
  };
  lessonProgress = {
    count: vi.fn(),
  };
  slide = {
    findMany: vi.fn(),
    update: vi.fn(),
  };
  $transaction = vi.fn();
  $connect = vi.fn();
  $disconnect = vi.fn();
  onModuleInit = vi.fn();
  onModuleDestroy = vi.fn();
}

describe('LessonsService', () => {
  let lessonsService: LessonsService;
  let coursesService: any;
  let prismaService: any;

  const mockLesson = {
    id: 'lesson-1',
    slug: 'test-lesson',
    course_id: 'course-1',
    title_en: 'Test Lesson',
    title_fr: 'Leçon de Test',
    description_en: 'Test description',
    description_fr: 'Description de test',
    lesson_order: 1,
    status: LessonStatus.DRAFT,
    estimated_minutes: 30,
    imported_from_pptx: false,
    original_filename: null,
    import_date: null,
    created_at: new Date(),
    updated_at: new Date(),
    published_at: null,
    course: {
      id: 'course-1',
      title_en: 'Test Course',
      title_fr: 'Cours de Test',
      slug: 'test-course',
      teacher_id: 'teacher-1',
    },
  };

  beforeEach(() => {
    // Create fresh mock instances
    coursesService = new MockCoursesService();
    prismaService = new MockPrismaService();

    // Directly instantiate the service with mocks
    lessonsService = new LessonsService(prismaService as any, coursesService as any);
  });

  describe('create', () => {
    it('should successfully create a lesson', async () => {
      const createDto: CreateLessonDto = {
        course_id: 'course-1',
        slug: 'new-lesson',
        title_en: 'New Lesson',
        lesson_order: 1,
      };

      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findUnique.mockResolvedValue(null);
      prismaService.lesson.findFirst.mockResolvedValue(null);
      prismaService.lesson.create.mockResolvedValue(mockLesson);

      const result = await lessonsService.create('teacher-1', createDto);

      expect(result).toHaveProperty('id');
      expect(result.slug).toBe(mockLesson.slug);
      expect(result.course_id).toBe('course-1');

      // Verify ownership was checked
      expect(coursesService.verifyOwnership).toHaveBeenCalledWith('course-1', 'teacher-1');

      // Verify slug uniqueness was checked
      expect(prismaService.lesson.findUnique).toHaveBeenCalledWith({
        where: { slug: createDto.slug },
      });

      // Verify lesson order uniqueness was checked
      expect(prismaService.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          course_id: createDto.course_id,
          lesson_order: createDto.lesson_order,
        },
      });
    });

    it('should throw ConflictException if slug already exists', async () => {
      const createDto: CreateLessonDto = {
        course_id: 'course-1',
        slug: 'existing-slug',
        title_en: 'New Lesson',
        lesson_order: 1,
      };

      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(lessonsService.create('teacher-1', createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(lessonsService.create('teacher-1', createDto)).rejects.toThrow(
        "Lesson with slug 'existing-slug' already exists",
      );

      expect(prismaService.lesson.create).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if lesson order already exists', async () => {
      const createDto: CreateLessonDto = {
        course_id: 'course-1',
        slug: 'new-lesson',
        title_en: 'New Lesson',
        lesson_order: 1,
      };

      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findUnique.mockResolvedValue(null);
      prismaService.lesson.findFirst.mockResolvedValue(mockLesson);

      await expect(lessonsService.create('teacher-1', createDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(lessonsService.create('teacher-1', createDto)).rejects.toThrow(
        'Lesson order 1 is already taken in this course',
      );

      expect(prismaService.lesson.create).not.toHaveBeenCalled();
    });

    it('should set import_date if imported_from_pptx is true', async () => {
      const createDto: CreateLessonDto = {
        course_id: 'course-1',
        slug: 'imported-lesson',
        title_en: 'Imported Lesson',
        lesson_order: 1,
        imported_from_pptx: true,
        original_filename: 'presentation.pptx',
      };

      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findUnique.mockResolvedValue(null);
      prismaService.lesson.findFirst.mockResolvedValue(null);
      prismaService.lesson.create.mockResolvedValue({
        ...mockLesson,
        imported_from_pptx: true,
        import_date: new Date(),
      });

      const result = await lessonsService.create('teacher-1', createDto);

      expect(result.imported_from_pptx).toBe(true);
      expect(result.import_date).toBeDefined();
    });
  });

  describe('findAllForCourse', () => {
    it('should return paginated list of lessons for course', async () => {
      const lessons = [mockLesson];

      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findMany.mockResolvedValue(lessons);
      prismaService.lesson.count.mockResolvedValue(1);

      const result = await lessonsService.findAllForCourse('course-1', 'teacher-1', 1, 10);

      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('total');
      expect(result).toHaveProperty('page');
      expect(result).toHaveProperty('totalPages');
      expect(result.data).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(result.page).toBe(1);
      expect(result.totalPages).toBe(1);

      // Verify ownership was checked
      expect(coursesService.verifyOwnership).toHaveBeenCalledWith('course-1', 'teacher-1');
    });

    it('should order lessons by lesson_order ascending', async () => {
      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lesson.findMany.mockResolvedValue([]);
      prismaService.lesson.count.mockResolvedValue(0);

      await lessonsService.findAllForCourse('course-1', 'teacher-1', 1, 10);

      expect(prismaService.lesson.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { lesson_order: 'asc' },
        }),
      );
    });

    it('should not verify ownership if teacherId is not provided', async () => {
      prismaService.lesson.findMany.mockResolvedValue([]);
      prismaService.lesson.count.mockResolvedValue(0);

      await lessonsService.findAllForCourse('course-1', undefined, 1, 10);

      expect(coursesService.verifyOwnership).not.toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should return lesson by ID with slides and content blocks', async () => {
      const lessonWithSlides = {
        ...mockLesson,
        slides: [
          {
            id: 'slide-1',
            slide_order: 1,
            layout: 'CONTENT',
            title_en: 'Slide 1',
            title_fr: 'Diapositive 1',
            notes_en: 'Notes',
            notes_fr: 'Notes',
            created_at: new Date(),
            updated_at: new Date(),
            content_blocks: [],
          },
        ],
      };

      prismaService.lesson.findUnique.mockResolvedValue(lessonWithSlides);

      const result = await lessonsService.findOne('lesson-1');

      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('slides');
      expect(result.slides).toHaveLength(1);
      expect(result.id).toBe('lesson-1');
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(lessonsService.findOne('invalid-id')).rejects.toThrow(NotFoundException);
      await expect(lessonsService.findOne('invalid-id')).rejects.toThrow(
        "Lesson with ID 'invalid-id' not found",
      );
    });

    it('should throw ForbiddenException if teacher does not own lesson', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);

      await expect(lessonsService.findOne('lesson-1', 'other-teacher')).rejects.toThrow(
        ForbiddenException,
      );
      await expect(lessonsService.findOne('lesson-1', 'other-teacher')).rejects.toThrow(
        'You do not have permission to access this lesson',
      );
    });
  });

  describe('update', () => {
    it('should successfully update a lesson', async () => {
      const updateDto: UpdateLessonDto = {
        title_en: 'Updated Lesson Title',
        description_en: 'Updated description',
      };

      const updatedLesson = {
        ...mockLesson,
        ...updateDto,
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.lesson.update.mockResolvedValue(updatedLesson);

      const result = await lessonsService.update('lesson-1', 'teacher-1', updateDto);

      expect(result.title_en).toBe('Updated Lesson Title');

      expect(prismaService.lesson.update).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
        data: updateDto,
        include: expect.any(Object),
      });
    });

    it('should check slug uniqueness when updating slug', async () => {
      const updateDto: UpdateLessonDto = {
        slug: 'new-unique-slug',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.lesson.findFirst.mockResolvedValue(null);
      prismaService.lesson.update.mockResolvedValue({
        ...mockLesson,
        ...updateDto,
      });

      await lessonsService.update('lesson-1', 'teacher-1', updateDto);

      // Verify slug uniqueness was checked
      expect(prismaService.lesson.findFirst).toHaveBeenCalledWith({
        where: {
          slug: 'new-unique-slug',
          NOT: { id: 'lesson-1' },
        },
      });
    });

    it('should throw ConflictException if new slug is already taken', async () => {
      const updateDto: UpdateLessonDto = {
        slug: 'existing-slug',
      };

      const otherLesson = {
        ...mockLesson,
        id: 'other-lesson',
        slug: 'existing-slug',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.lesson.findFirst.mockResolvedValue(otherLesson);

      await expect(lessonsService.update('lesson-1', 'teacher-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(lessonsService.update('lesson-1', 'teacher-1', updateDto)).rejects.toThrow(
        "Lesson with slug 'existing-slug' already exists",
      );

      expect(prismaService.lesson.update).not.toHaveBeenCalled();
    });

    it('should throw ConflictException if new lesson_order is already taken', async () => {
      const updateDto: UpdateLessonDto = {
        lesson_order: 2,
      };

      const otherLesson = {
        ...mockLesson,
        id: 'other-lesson',
        lesson_order: 2,
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.lesson.findFirst.mockResolvedValue(otherLesson);

      await expect(lessonsService.update('lesson-1', 'teacher-1', updateDto)).rejects.toThrow(
        ConflictException,
      );
      await expect(lessonsService.update('lesson-1', 'teacher-1', updateDto)).rejects.toThrow(
        'Lesson order 2 is already taken in this course',
      );

      expect(prismaService.lesson.update).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should successfully delete a lesson with no student progress', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lessonProgress.count.mockResolvedValue(0);
      prismaService.lesson.delete.mockResolvedValue(mockLesson);

      await lessonsService.remove('lesson-1', 'teacher-1');

      expect(prismaService.lesson.delete).toHaveBeenCalledWith({
        where: { id: 'lesson-1' },
      });
    });

    it('should throw BadRequestException if lesson has student progress', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.lessonProgress.count.mockResolvedValue(3);

      await expect(lessonsService.remove('lesson-1', 'teacher-1')).rejects.toThrow(
        BadRequestException,
      );
      await expect(lessonsService.remove('lesson-1', 'teacher-1')).rejects.toThrow(
        'Cannot delete lesson with 3 student progress record(s). Archive the lesson instead.',
      );

      expect(prismaService.lesson.delete).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if teacher does not own course', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockRejectedValue(new ForbiddenException());

      await expect(lessonsService.remove('lesson-1', 'other-teacher')).rejects.toThrow(
        ForbiddenException,
      );

      expect(prismaService.lesson.delete).not.toHaveBeenCalled();
    });
  });

  describe('reorderSlides', () => {
    it('should successfully reorder slides', async () => {
      const reorderDto: ReorderSlidesDto = {
        slide_ids: ['slide-1', 'slide-2', 'slide-3'],
      };

      const slides = [{ id: 'slide-1' }, { id: 'slide-2' }, { id: 'slide-3' }];

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.slide.findMany.mockResolvedValue(slides as any);
      prismaService.$transaction.mockImplementation(async (operations: any[]) => {
        return Promise.all(operations.map((op: any) => op));
      });

      await lessonsService.reorderSlides('lesson-1', 'teacher-1', reorderDto);

      // Verify all slide IDs were verified
      expect(prismaService.slide.findMany).toHaveBeenCalledWith({
        where: {
          lesson_id: 'lesson-1',
          id: { in: reorderDto.slide_ids },
        },
        select: { id: true },
      });

      // Verify transaction was called
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if slide IDs do not belong to lesson', async () => {
      const reorderDto: ReorderSlidesDto = {
        slide_ids: ['slide-1', 'slide-2', 'invalid-slide'],
      };

      const slides = [{ id: 'slide-1' }, { id: 'slide-2' }];

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockResolvedValue(true);
      prismaService.slide.findMany.mockResolvedValue(slides as any);

      await expect(
        lessonsService.reorderSlides('lesson-1', 'teacher-1', reorderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        lessonsService.reorderSlides('lesson-1', 'teacher-1', reorderDto),
      ).rejects.toThrow('Some slide IDs do not belong to this lesson');

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw ForbiddenException if teacher does not own lesson', async () => {
      const reorderDto: ReorderSlidesDto = {
        slide_ids: ['slide-1', 'slide-2'],
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockRejectedValue(new ForbiddenException());

      await expect(
        lessonsService.reorderSlides('lesson-1', 'other-teacher', reorderDto),
      ).rejects.toThrow(ForbiddenException);

      expect(prismaService.$transaction).not.toHaveBeenCalled();
    });
  });
});
