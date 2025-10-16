import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ContentBlockType } from '@prisma/client';

// Mock DOMPurify before any imports that use it
vi.mock('isomorphic-dompurify', () => ({
  default: {
    sanitize: (html: string) =>
      html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/g, '')
        .replace(/javascript:/gi, ''),
  },
}));

import { ContentBlocksService } from '../../src/courses/slides/content-blocks.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CoursesService } from '../../src/courses/courses.service';
import {
  CreateContentBlockDto,
  UpdateContentBlockDto,
  ReorderContentBlocksDto,
} from '../../src/courses/slides/dto';

// Mock Prisma class
class MockPrismaService {
  contentBlock = {
    findUnique: vi.fn(),
    findMany: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    updateMany: vi.fn(),
    aggregate: vi.fn(),
    deleteMany: vi.fn(),
  };
  slide = {
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

describe('ContentBlocksService', () => {
  let contentBlocksService: ContentBlocksService;
  let prismaService: any;
  let coursesService: any;

  const mockTeacherId = 'teacher-1';
  const mockSlideId = 'slide-1';
  const mockLessonId = 'lesson-1';
  const mockCourseId = 'course-1';
  const mockBlockId = 'block-1';

  const mockSlide = {
    id: mockSlideId,
    lesson: {
      id: mockLessonId,
      course_id: mockCourseId,
    },
  };

  const mockContentBlock = {
    id: mockBlockId,
    slide_id: mockSlideId,
    block_type: ContentBlockType.TEXT,
    block_order: 0,
    content_en: { html: '<p>Test content</p>' },
    content_fr: null,
    style_config: null,
    created_at: new Date(),
    updated_at: new Date(),
  };

  const mockContentBlockWithSlide = {
    ...mockContentBlock,
    slide: mockSlide,
  };

  beforeEach(() => {
    prismaService = new MockPrismaService();
    coursesService = new MockCoursesService();
    contentBlocksService = new ContentBlocksService(prismaService as any, coursesService as any);
  });

  describe('create', () => {
    it('should create a content block with auto-calculated order', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>New content</p>' }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 2 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_order: 3,
      });

      const result = await contentBlocksService.create(mockTeacherId, createDto);

      expect(result).toHaveProperty('id');
      expect(result.order).toBe(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalledWith(mockCourseId, mockTeacherId);
    });

    it('should create first block with order 0', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.HEADING,
        content: JSON.stringify({ text: 'Heading', level: 1 }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: null } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      const result = await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            block_order: 0,
          }),
        }),
      );
    });

    it('should insert block at specific order and shift others', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>Content</p>' }),
        order: 1,
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.updateMany.mockResolvedValue({ count: 2 });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_order: 1,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.updateMany).toHaveBeenCalledWith({
        where: {
          slide_id: mockSlideId,
          block_order: { gte: 1 },
        },
        data: {
          block_order: { increment: 1 },
        },
      });
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: 'invalid-slide',
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>Test</p>' }),
      };

      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        NotFoundException,
      );
      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        'Slide not found',
      );
    });

    it('should throw BadRequestException for invalid JSON', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: 'invalid json',
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);

      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        'Content must be a valid JSON string',
      );
    });

    it('should validate content by block type - TEXT', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>Valid text content</p>' }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should validate content by block type - HEADING', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.HEADING,
        content: JSON.stringify({ text: 'Heading Text', level: 2 }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_type: ContentBlockType.HEADING,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should throw BadRequestException for invalid content structure', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ wrongField: 'missing html field' }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);

      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should sanitize HTML content to prevent XSS', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({
          html: '<p>Test</p><script>alert("XSS")</script>',
        }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      await contentBlocksService.create(mockTeacherId, createDto);

      // Verify create was called with sanitized content (no script tag)
      const createCall = prismaService.contentBlock.create.mock.calls[0][0];
      const contentEn = createCall.data.content_en as any;
      expect(contentEn.html).not.toContain('<script>');
    });

    it('should create IMAGE block with validation', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.IMAGE,
        content: JSON.stringify({
          imageUrl: 'https://example.com/image.jpg',
          imageAlt: 'Test image',
          caption: 'Test caption',
        }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_type: ContentBlockType.IMAGE,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should create VERSE block with validation', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.VERSE,
        content: JSON.stringify({
          text: 'For God so loved the world...',
          verseReference: 'John 3:16',
          translation: 'NIV',
        }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_type: ContentBlockType.VERSE,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should create LIST block with items', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.LIST,
        content: JSON.stringify({
          listStyle: 'bullet',
          items: ['Item 1', 'Item 2', 'Item 3'],
        }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_type: ContentBlockType.LIST,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should accept metadata/style_config', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>Test</p>' }),
        metadata: { fontSize: 16, color: '#000000' },
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            style_config: { fontSize: 16, color: '#000000' },
          }),
        }),
      );
    });
  });

  describe('findOne', () => {
    it('should return a content block by ID', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);

      const result = await contentBlocksService.findOne(mockBlockId, mockTeacherId);

      expect(result).toHaveProperty('id', mockBlockId);
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should return block without ownership check if teacherId not provided', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);

      const result = await contentBlocksService.findOne(mockBlockId);

      expect(result).toHaveProperty('id', mockBlockId);
      expect(coursesService.verifyOwnership).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if block does not exist', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(null);

      await expect(contentBlocksService.findOne('invalid-id', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
      await expect(contentBlocksService.findOne('invalid-id', mockTeacherId)).rejects.toThrow(
        'Content block not found',
      );
    });
  });

  describe('findAllForSlide', () => {
    it('should return all blocks for a slide sorted by order', async () => {
      const blocks = [
        { ...mockContentBlock, id: 'block-1', block_order: 0 },
        { ...mockContentBlock, id: 'block-2', block_order: 1 },
        { ...mockContentBlock, id: 'block-3', block_order: 2 },
      ];

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.findMany.mockResolvedValue(blocks);

      const result = await contentBlocksService.findAllForSlide(mockSlideId, mockTeacherId);

      expect(result).toHaveLength(3);
      expect(result[0].order).toBe(0);
      expect(result[1].order).toBe(1);
      expect(result[2].order).toBe(2);
    });

    it('should throw NotFoundException if slide does not exist', async () => {
      prismaService.slide.findUnique.mockResolvedValue(null);

      await expect(
        contentBlocksService.findAllForSlide('invalid-slide', mockTeacherId),
      ).rejects.toThrow(NotFoundException);
    });

    it('should return empty array if slide has no blocks', async () => {
      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.findMany.mockResolvedValue([]);

      const result = await contentBlocksService.findAllForSlide(mockSlideId, mockTeacherId);

      expect(result).toHaveLength(0);
    });
  });

  describe('update', () => {
    it('should update content block successfully', async () => {
      const updateDto: UpdateContentBlockDto = {
        content: JSON.stringify({ html: '<p>Updated content</p>' }),
      };

      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);
      prismaService.contentBlock.update.mockResolvedValue({
        ...mockContentBlock,
        content_en: { html: '<p>Updated content</p>' },
      });

      const result = await contentBlocksService.update(mockBlockId, mockTeacherId, updateDto);

      expect(result.content).toContain('Updated content');
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should throw NotFoundException if block does not exist', async () => {
      const updateDto: UpdateContentBlockDto = {
        content: JSON.stringify({ html: '<p>Updated</p>' }),
      };

      prismaService.contentBlock.findUnique.mockResolvedValue(null);

      await expect(
        contentBlocksService.update('invalid-id', mockTeacherId, updateDto),
      ).rejects.toThrow(NotFoundException);
    });

    it('should validate content against block type on update', async () => {
      const updateDto: UpdateContentBlockDto = {
        content: JSON.stringify({ wrongField: 'invalid' }),
      };

      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);

      await expect(
        contentBlocksService.update(mockBlockId, mockTeacherId, updateDto),
      ).rejects.toThrow(BadRequestException);
    });

    it('should sanitize HTML on update', async () => {
      const updateDto: UpdateContentBlockDto = {
        content: JSON.stringify({
          html: '<p>Safe</p><script>alert("XSS")</script>',
        }),
      };

      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);
      prismaService.contentBlock.update.mockResolvedValue(mockContentBlock);

      await contentBlocksService.update(mockBlockId, mockTeacherId, updateDto);

      const updateCall = prismaService.contentBlock.update.mock.calls[0][0];
      const contentEn = updateCall.data.content_en as any;
      expect(contentEn.html).not.toContain('<script>');
    });

    it('should update metadata only', async () => {
      const updateDto: UpdateContentBlockDto = {
        metadata: { backgroundColor: '#f0f0f0' },
      };

      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);
      prismaService.contentBlock.update.mockResolvedValue({
        ...mockContentBlock,
        style_config: { backgroundColor: '#f0f0f0' },
      });

      await contentBlocksService.update(mockBlockId, mockTeacherId, updateDto);

      expect(prismaService.contentBlock.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            style_config: { backgroundColor: '#f0f0f0' },
          }),
        }),
      );
    });
  });

  describe('remove', () => {
    it('should delete block and reorder remaining blocks', async () => {
      const blockToDelete = { ...mockContentBlockWithSlide, block_order: 1 };

      prismaService.contentBlock.findUnique.mockResolvedValue(blockToDelete);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));

      await contentBlocksService.remove(mockBlockId, mockTeacherId);

      expect(coursesService.verifyOwnership).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw NotFoundException if block does not exist', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(null);

      await expect(contentBlocksService.remove('invalid-id', mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('reorderBlocks', () => {
    it('should reorder multiple blocks in a transaction', async () => {
      const reorderDto: ReorderContentBlocksDto = {
        block_orders: [
          { block_id: 'block-1', order: 2 },
          { block_id: 'block-2', order: 0 },
          { block_id: 'block-3', order: 1 },
        ],
      };

      const blocks = reorderDto.block_orders.map((item) => ({ id: item.block_id }));

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.findMany.mockResolvedValue(blocks);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));
      prismaService.contentBlock.findMany.mockResolvedValueOnce(blocks).mockResolvedValueOnce([
        { ...mockContentBlock, id: 'block-2', block_order: 0 },
        { ...mockContentBlock, id: 'block-3', block_order: 1 },
        { ...mockContentBlock, id: 'block-1', block_order: 2 },
      ]);

      const result = await contentBlocksService.reorderBlocks(
        mockSlideId,
        mockTeacherId,
        reorderDto,
      );

      expect(result).toHaveLength(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should throw BadRequestException if some blocks do not belong to slide', async () => {
      const reorderDto: ReorderContentBlocksDto = {
        block_orders: [
          { block_id: 'block-1', order: 0 },
          { block_id: 'block-2', order: 1 },
        ],
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.findMany.mockResolvedValue([{ id: 'block-1' }]);

      await expect(
        contentBlocksService.reorderBlocks(mockSlideId, mockTeacherId, reorderDto),
      ).rejects.toThrow(BadRequestException);
      await expect(
        contentBlocksService.reorderBlocks(mockSlideId, mockTeacherId, reorderDto),
      ).rejects.toThrow('Some blocks do not belong to this slide');
    });

    it('should throw BadRequestException on duplicate order values', async () => {
      const reorderDto: ReorderContentBlocksDto = {
        block_orders: [
          { block_id: 'block-1', order: 0 },
          { block_id: 'block-2', order: 0 }, // Duplicate
        ],
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.findMany.mockResolvedValue([{ id: 'block-1' }, { id: 'block-2' }]);

      await expect(
        contentBlocksService.reorderBlocks(mockSlideId, mockTeacherId, reorderDto),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('duplicateBlock', () => {
    it('should duplicate content block', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(mockContentBlockWithSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 2 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        id: 'block-2',
        block_order: 3,
      });

      const result = await contentBlocksService.duplicateBlock(mockBlockId, mockTeacherId);

      expect(result.id).toBe('block-2');
      expect(result.order).toBe(3);
      expect(coursesService.verifyOwnership).toHaveBeenCalled();
    });

    it('should throw NotFoundException if block does not exist', async () => {
      prismaService.contentBlock.findUnique.mockResolvedValue(null);

      await expect(
        contentBlocksService.duplicateBlock('invalid-id', mockTeacherId),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('bulkDeleteBlocks', () => {
    it('should delete multiple blocks and reorder', async () => {
      const blockIds = ['block-1', 'block-2'];
      const blocks = [
        { ...mockContentBlockWithSlide, id: 'block-1', block_order: 0 },
        { ...mockContentBlockWithSlide, id: 'block-2', block_order: 2 },
      ];

      prismaService.contentBlock.findMany.mockResolvedValue(blocks);
      prismaService.$transaction.mockImplementation((queries) => Promise.all(queries));

      await contentBlocksService.bulkDeleteBlocks(blockIds, mockTeacherId);

      expect(coursesService.verifyOwnership).toHaveBeenCalled();
      expect(prismaService.$transaction).toHaveBeenCalled();
    });

    it('should throw BadRequestException if no IDs provided', async () => {
      await expect(contentBlocksService.bulkDeleteBlocks([], mockTeacherId)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should throw NotFoundException if some blocks not found', async () => {
      const blockIds = ['block-1', 'block-2'];

      prismaService.contentBlock.findMany.mockResolvedValue([
        { ...mockContentBlockWithSlide, id: 'block-1' },
      ]);

      await expect(contentBlocksService.bulkDeleteBlocks(blockIds, mockTeacherId)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('edge cases', () => {
    it('should handle very long text content (5000 chars)', async () => {
      const longText = '<p>' + 'A'.repeat(4900) + '</p>';
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: longText }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should handle emoji and unicode characters', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: '<p>Test 😀 🎉 中文 العربية</p>' }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should handle LIST with 20 items (max)', async () => {
      const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.LIST,
        content: JSON.stringify({ listStyle: 'numbered', items }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue({
        ...mockContentBlock,
        block_type: ContentBlockType.LIST,
      });

      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should reject LIST with more than 20 items', async () => {
      const items = Array.from({ length: 21 }, (_, i) => `Item ${i + 1}`);
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.LIST,
        content: JSON.stringify({ listStyle: 'numbered', items }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);

      await expect(contentBlocksService.create(mockTeacherId, createDto)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle SQL injection attempts in content', async () => {
      const createDto: CreateContentBlockDto = {
        slide_id: mockSlideId,
        type: ContentBlockType.TEXT,
        content: JSON.stringify({ html: "<p>Test'; DROP TABLE slides; --</p>" }),
      };

      prismaService.slide.findUnique.mockResolvedValue(mockSlide);
      prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
      prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

      // Should not throw - content is properly sanitized and parameterized
      await contentBlocksService.create(mockTeacherId, createDto);

      expect(prismaService.contentBlock.create).toHaveBeenCalled();
    });

    it('should handle XSS with various attack vectors', async () => {
      const xssAttempts = [
        '<img src=x onerror="alert(\'XSS\')">',
        '<svg onload="alert(\'XSS\')">',
        '<iframe src="javascript:alert(\'XSS\')">',
        '<body onload="alert(\'XSS\')">',
      ];

      for (const xss of xssAttempts) {
        const createDto: CreateContentBlockDto = {
          slide_id: mockSlideId,
          type: ContentBlockType.TEXT,
          content: JSON.stringify({ html: `<p>${xss}</p>` }),
        };

        prismaService.slide.findUnique.mockResolvedValue(mockSlide);
        prismaService.contentBlock.aggregate.mockResolvedValue({ _max: { block_order: 0 } });
        prismaService.contentBlock.create.mockResolvedValue(mockContentBlock);

        await contentBlocksService.create(mockTeacherId, createDto);

        const createCall = prismaService.contentBlock.create.mock.calls[0][0];
        const contentEn = createCall.data.content_en as any;
        // Sanitized content should not contain dangerous attributes
        expect(contentEn.html).not.toContain('onerror');
        expect(contentEn.html).not.toContain('onload');
        expect(contentEn.html).not.toContain('javascript:');
      }
    });
  });
});
