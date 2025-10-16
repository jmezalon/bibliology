import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { ContentBlockType } from '@prisma/client';

import { SlidesService } from '../../src/courses/slides/slides.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CoursesService } from '../../src/courses/courses.service';
import { CreateSlideDto, UpdateSlideDto, BulkReorderSlidesDto, MoveSlideDto } from '../../src/courses/slides/dto';

// Mock Prisma class
class MockPrismaService {
  slide = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    aggregate: vi.fn(),
  };
  lesson = {
    findUnique: vi.fn(),
  };
  $transaction = vi.fn((queries) => {
    if (Array.isArray(queries)) {
      return Promise.all(queries);
    }
    return queries(this);
  });
}

// Mock CoursesService
class MockCoursesService {
  verifyOwnership = vi.fn().mockResolvedValue(true);
}

describe('SlidesService', () => {
  let slidesService: SlidesService;
  let prismaService: any;
  let coursesService: any;

  const mockTeacherId = 'teacher-1';
  const mockLessonId = 'lesson-1';
  const mockCourseId = 'course-1';
  const mockSlideId = 'slide-1';

  const mockLesson = {
    id: mockLessonId,
    course_id: mockCourseId,
    course: { teacher_id: mockTeacherId },
  };

  const mockSlide = {
    id: mockSlideId,
    lesson_id: mockLessonId,
    slide_order: 0,
    layout: 'SINGLE_COLUMN',
    title_en: 'Test Slide',
    title_fr: null,
    notes_en: null,
    notes_fr: null,
    created_at: new Date(),
    updated_at: new Date(),
    content_blocks: [],
    lesson: mockLesson,
  };

  const mockContentBlock = {
    id: 'block-1',
    slide_id: mockSlideId,
    block_type: ContentBlockType.TEXT,
    block_order: 0,
    content_en: { html: 'Test content' },
    content_fr: null,
    style_config: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  beforeEach(() => {
    prismaService = new MockPrismaService();
    coursesService = new MockCoursesService();
    slidesService = new SlidesService(prismaService as any, coursesService as any);
  });

  describe('create', () => {
    it('should create a slide with auto-calculated order', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'SINGLE_COLUMN',
        title_en: 'New Slide',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: 2 } });
      prismaService.slide.create.mockResolvedValue({ ...mockSlide, slide_order: 3 });

      const result = await slidesService.create(mockTeacherId, createDto);

      expect(result).toHaveProperty('id');
      expect(result.slide_order).toBe(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalledWith(mockCourseId, mockTeacherId);
      expect(prismaService.slide.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            lesson_id: mockLessonId,
            slide_order: 3,
            layout: 'SINGLE_COLUMN',
          }),
        }),
      );
    });

    it('should create first slide with order 0', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'SINGLE_COLUMN',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: null } });
      prismaService.slide.create.mockResolvedValue(mockSlide);

      const result = await slidesService.create(mockTeacherId, createDto);

      expect(prismaService.slide.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            slide_order: 0,
          }),
        }),
      );
    });

    it('should insert slide at specific order and shift others', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'SINGLE_COLUMN',
        slide_order: 1,
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.updateMany.mockResolvedValue({ count: 2 });
      prismaService.slide.create.mockResolvedValue({ ...mockSlide, slide_order: 1 });

      await slidesService.create(mockTeacherId, createDto);

      expect(prismaService.slide.updateMany).toHaveBeenCalledWith({
        where: {
          lesson_id: mockLessonId,
          slide_order: { gte: 1 },
        },
        data: {
          slide_order: { increment: 1 },
        },
      });
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: 'invalid-lesson',
        layout: 'SINGLE_COLUMN',
      };

      prismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(slidesService.create(mockTeacherId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(slidesService.create(mockTeacherId, createDto)).rejects.toThrow(
        'Lesson not found',
      );
    });

    it('should throw error if teacher does not own course', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'SINGLE_COLUMN',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      coursesService.verifyOwnership.mockRejectedValue(new Error('Unauthorized'));

      await expect(slidesService.create(mockTeacherId, createDto)).rejects.toThrow();
    });

    it('should create bilingual slide with FR content', async () => {
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'TWO_COLUMN',
        title_en: 'English Title',
        title_fr: 'Titre Français',
        notes_en: 'English notes',
        notes_fr: 'Notes françaises',
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: 0 } });
      prismaService.slide.create.mockResolvedValue({
        ...mockSlide,
        ...createDto,
        slide_order: 1,
      });

      const result = await slidesService.create(mockTeacherId, createDto);

      expect(result.title_en).toBe('English Title');
      expect(result.title_fr).toBe('Titre Français');
    });
  });

  describe('findOne', () => {
    it('should return a slide by ID', async () => {
      prismaService.slide.findUnique.mockResolvedValue(mockSlide);

      const result = await slidesService.findOne(mockSlideId, mockTeacherId);

      expect(result).toHaveProperty('id', mockSlideId);
      expect(coursesService.verifyOwnership).toHaveBeenCalledWith(mockCourseId, mockTeacherId);
    });

    it('should return slide without ownership check if teacherId not provided', async () => {
      prismaService.slide.findUnique.mockResolvedValue(mockSlide);

      const result = await slidesService.findOne(mockSlideId);

      expect(result).toHaveProperty('id', mockSlideId);
      expect(coursesService.verifyOwnership).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(slidesService.findOne('invalid-id', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(slidesService.findOne('invalid-id', mockTeacherId)).rejects.toThrow(
        'Slide not found',
      );
    });

    it('should include content blocks sorted by order', async () => {
      const slideWithBlocks = {
        ...mockSlide,
        content_blocks: [
          { ...mockContentBlock, id: 'block-2', block_order: 1 },
          { ...mockContentBlock, id: 'block-1', block_order: 0 },
        ],
      };

      prismaService.slide.findUnique.mockResolvedValue(slideWithBlocks);

      await slidesService.findOne(mockSlideId, mockTeacherId);

      expect(prismaService.slide.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          include: expect.objectContaining({
            content_blocks: { orderBy: { block_order: 'asc' } },
          }),
        }),
      );
    });
  });

  describe('findAllForLesson', () => {
    it('should return all slides for a lesson sorted by order', async () => {
      const slides = [
        { ...mockSlide, id: 'slide-1', slide_order: 0 },
        { ...mockSlide, id: 'slide-2', slide_order: 1 },
        { ...mockSlide, id: 'slide-3', slide_order: 2 },
      ];

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue(slides);

      const result = await slidesService.findAllForLesson(mockLessonId, mockTeacherId);

      expect(result).toHaveLength(3);
      expect(result[0].slide_order).toBe(0);
      expect(result[1].slide_order).toBe(1);
      expect(result[2].slide_order).toBe(2);
      expect(prismaService.slide.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { slide_order: 'asc' },
        }),
      );
    });

    it('should throw NotFoundException if lesson does not exist', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(slidesService.findAllForLesson('invalid-lesson', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should return empty array if lesson has no slides', async () => {
      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue([]);

      const result = await slidesService.findAllForLesson(mockLessonId, mockTeacherId);

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update a slide successfully', async () => {
      const updateDto: UpdateSlideDto = {
        layout: 'THREE_COLUMN',
        title_en: 'Updated Title',
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.slide.update.mockResolvedValue({
        ...mockSlide,
        ...updateDto,
      });

      const result = await slidesService.update(mockSlideId, mockTeacherId, updateDto);

      expect(result.layout).toBe('THREE_COLUMN');
      expect(result.title_en).toBe('Updated Title');
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      const updateDto: UpdateSlideDto = {
        title_en: 'Updated',
      };

      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(slidesService.update('invalid-id', mockTeacherId, updateDto)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should allow clearing optional fields', async () => {
      const updateDto: UpdateSlideDto = {
        title_fr: null,
        notes_en: null,
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.slide.update.mockResolvedValue({
        ...mockSlide,
        title_fr: null,
        notes_en: null,
      });

      const result = await slidesService.update(mockSlideId, mockTeacherId, updateDto);

      expect(result.title_fr).toBeUndefined();
      expect(result.notes_en).toBeUndefined();
    });
  });

  describe('remove', () => {
    it('should delete slide and reorder remaining slides', async () => {
      const slideToDelete = { ...mockSlide, slide_order: 1 };

      prismaService.slide.findUnique.mockResolvedValue(slideToDelete);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));

      await slidesService.remove(mockSlideId, mockTeacherId);

      expect(coursesService.verifyOwnership).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(slidesService.remove('invalid-id', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should cascade delete content blocks', async () => {
      const slideWithBlocks = {
        ...mockSlide,
        content_blocks: [mockContentBlock],
      };

      prismaService.slide.findUnique.mockResolvedValue(slideWithBlocks);

      await slidesService.remove(mockSlideId, mockTeacherId);

      // Deletion happens in transaction, content blocks cascade via Prisma
      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });

  describe('bulkReorderSlides', () => {
    it('should reorder multiple slides in a transaction', async () => {
      const reorderDto: BulkReorderSlidesDto = {
        slide_orders: [
          { slide_id: 'slide-1', order: 2 },
          { slide_id: 'slide-2', order: 0 },
          { slide_id: 'slide-3', order: 1 },
        ],
      };

      const slides = reorderDto.slide_orders.map((item) => ({ id: item.slide_id }));

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue(slides);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));
      prismaService.slide.findMany.mockResolvedValueOnce(slides).mockResolvedValueOnce([
        { ...mockSlide, id: 'slide-2', slide_order: 0 },
        { ...mockSlide, id: 'slide-3', slide_order: 1 },
        { ...mockSlide, id: 'slide-1', slide_order: 2 },
      ]);

      const result = await slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto);

      expect(result).toHaveLength(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if some slides do not belong to lesson', async () => {
      const reorderDto: BulkReorderSlidesDto = {
        slide_orders: [
          { slide_id: 'slide-1', order: 0 },
          { slide_id: 'slide-2', order: 1 },
        ],
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue([{ id: 'slide-1' }]);

      await expect(
        slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto),
      ).rejects.toThrow('Some slides do not belong to this lesson');
    });

    it('should throw BadRequestException on duplicate order values', async () => {
      const reorderDto: BulkReorderSlidesDto = {
        slide_orders: [
          { slide_id: 'slide-1', order: 0 },
          { slide_id: 'slide-2', order: 0 }, // Duplicate
        ],
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue([
        { id: 'slide-1' },
        { id: 'slide-2' },
      ]);

      await expect(
        slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto),
      ).rejects.toThrow('Duplicate order values are not allowed');
    });
  });

  describe('duplicateSlide', () => {
    it('should duplicate slide with all content blocks', async () => {
      const originalSlide = {
        ...mockSlide,
        title_en: 'Original Slide',
        content_blocks: [
          { ...mockContentBlock, id: 'block-1', block_order: 0 },
          { ...mockContentBlock, id: 'block-2', block_order: 1 },
        ],
      };

      prismaService.slide.findUnique.mockResolvedValue(originalSlide);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: 2 } });
      prismaService.slide.create.mockResolvedValue({
        ...originalSlide,
        id: 'slide-2',
        title_en: 'Original Slide (Copy)',
        slide_order: 3,
      });

      const result = await slidesService.duplicateSlide(mockSlideId, mockTeacherId);

      expect(result.title_en).toBe('Original Slide (Copy)');
      expect(result.slide_order).toBe(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should append (Copie) for French titles', async () => {
      const originalSlide = {
        ...mockSlide,
        title_en: 'English',
        title_fr: 'Français',
        content_blocks: [],
      };

      prismaService.slide.findUnique.mockResolvedValue(originalSlide);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: 0 } });
      prismaService.slide.create.mockResolvedValue({
        ...originalSlide,
        id: 'slide-2',
        title_en: 'English (Copy)',
        title_fr: 'Français (Copie)',
        slide_order: 1,
      });

      const result = await slidesService.duplicateSlide(mockSlideId, mockTeacherId);

      expect(result.title_fr).toBe('Français (Copie)');
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(slidesService.duplicateSlide('invalid-id', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('moveSlideToLesson', () => {
    it('should move slide to different lesson', async () => {
      const moveDto: MoveSlideDto = {
        target_lesson_id: 'lesson-2',
        target_order: 0,
      };

      const targetLesson = {
        id: 'lesson-2',
        course_id: mockCourseId,
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.lesson.findUnique.mockResolvedValue(targetLesson);
      prismaService.$transaction.mockImplementation((callback) =>
        callback({
          slide: {
            updateMany: vi.fn().mockResolvedValue({}),
            update: vi.fn().mockResolvedValue({
              ...mockSlide,
              lesson_id: 'lesson-2',
              slide_order: 0,
            }),
          },
        }),
      );

      const result = await slidesService.moveSlideToLesson(mockSlideId, mockTeacherId, moveDto);

      expect(result.lesson_id).toBe('lesson-2');
      expect(coursesService.verifyOwnership).toHaveBeenCalledTimes(2);
    });

    it('should throw NotFoundException if target lesson does not exist', async () => {
      const moveDto: MoveSlideDto = {
        target_lesson_id: 'invalid-lesson',
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.lesson.findUnique.mockResolvedValue(null);

      await expect(
        slidesService.moveSlideToLesson(mockSlideId, mockTeacherId, moveDto),
      ).rejects.toThrow(NotFoundException);
      await expect(
        slidesService.moveSlideToLesson(mockSlideId, mockTeacherId, moveDto),
      ).rejects.toThrow('Target lesson not found');
    });
  });

  describe('bulkDeleteSlides', () => {
    it('should delete multiple slides and reorder', async () => {
      const slideIds = ['slide-1', 'slide-2'];
      const slides = [
        { ...mockSlide, id: 'slide-1', slide_order: 0, lesson: mockLesson },
        { ...mockSlide, id: 'slide-2', slide_order: 2, lesson: mockLesson },
      ];

      prismaService.slide.findMany.mockResolvedValue(slides);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));

      await slidesService.bulkDeleteSlides(slideIds, mockTeacherId);

      expect(coursesService.verifyOwnership).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no IDs provided', async () => {
      await expect(slidesService.bulkDeleteSlides([], mockTeacherId)).rejects.toThrow(
        BadRequestException,
      );
      await expect(slidesService.bulkDeleteSlides([], mockTeacherId)).rejects.toThrow(
        'No slide IDs provided',
      );
    });

    it('should throw NotFoundException if some slides not found', async () => {
      const slideIds = ['slide-1', 'slide-2'];

      prismaService.slide.findMany.mockResolvedValue([
        { ...mockSlide, id: 'slide-1', lesson: mockLesson },
      ]);

      await expect(slidesService.bulkDeleteSlides(slideIds, mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long slide titles', async () => {
      const longTitle = 'A'.repeat(500);
      const createDto: CreateSlideDto = {
        lesson_id: mockLessonId,
        layout: 'SINGLE_COLUMN',
        title_en: longTitle,
      };

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.aggregate.mockResolvedValue({ _max: { slide_order: 0 } });
      prismaService.slide.create.mockResolvedValue({
        ...mockSlide,
        title_en: longTitle,
      });

      const result = await slidesService.create(mockTeacherId, createDto);

      expect(result.title_en).toBe(longTitle);
    });

    it('should handle slide with 50+ content blocks', async () => {
      const manyBlocks = Array.from({ length: 60 }, (_, i) => ({
        ...mockContentBlock,
        id: `block-${i}`,
        block_order: i,
      }));

      const slideWithManyBlocks = {
        ...mockSlide,
        content_blocks: manyBlocks,
      };

      prismaService.slide.findUnique.mockResolvedValue(slideWithManyBlocks);

      const result = await slidesService.findOne(mockSlideId, mockTeacherId);

      expect(result.content_blocks).toHaveLength(60);
    });

    it('should handle reordering 100 slides', async () => {
      const manySlides = Array.from({ length: 100 }, (_, i) => ({
        slide_id: `slide-${i}`,
        order: 99 - i, // Reverse order
      }));

      const reorderDto: BulkReorderSlidesDto = {
        slide_orders: manySlides,
      };

      const slideIds = manySlides.map((s) => ({ id: s.slide_id }));

      prismaService.lesson.findUnique.mockResolvedValue(mockLesson);
      prismaService.slide.findMany.mockResolvedValue(slideIds);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));
      prismaService.slide.findMany.mockResolvedValueOnce(slideIds).mockResolvedValueOnce([]);

      await slidesService.bulkReorderSlides(mockLessonId, mockTeacherId, reorderDto);

      expect(prismaService.$transaction).toHaveBeenCalled();
    });
  });
});
