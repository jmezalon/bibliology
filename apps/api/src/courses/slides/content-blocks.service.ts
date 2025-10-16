import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ContentBlock, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses.service';

import { ContentBlockResponseDto } from './dto/content-block/content-block-response.dto';
import { CreateContentBlockDto } from './dto/content-block/create-content-block.dto';
import { ReorderContentBlocksDto } from './dto/content-block/reorder-content-blocks.dto';
import { UpdateContentBlockDto } from './dto/content-block/update-content-block.dto';
import { validateContentByType, sanitizeJsonContent } from './validators/content-validator';

@Injectable()
export class ContentBlocksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Create a new content block for a slide
   */
  async create(
    teacherId: string,
    createBlockDto: CreateContentBlockDto,
  ): Promise<ContentBlockResponseDto> {
    // Verify slide ownership through lesson -> course chain
    const slide = await this.prisma.slide.findUnique({
      where: { id: createBlockDto.slide_id },
      select: {
        id: true,
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (!slide) {
      throw new NotFoundException('Slide not found');
    }

    await this.coursesService.verifyOwnership(slide.lesson.course_id, teacherId);

    // Parse and validate content
    let contentJson: unknown;
    try {
      contentJson = JSON.parse(createBlockDto.content);
    } catch (error) {
      throw new BadRequestException('Content must be a valid JSON string');
    }

    // Sanitize HTML content to prevent XSS
    contentJson = sanitizeJsonContent(contentJson);

    const validation = validateContentByType(createBlockDto.type, contentJson);
    if (!validation.valid) {
      throw new BadRequestException(
        `Invalid content for block type ${createBlockDto.type}: ${validation.errors?.join(', ')}`,
      );
    }

    // Determine the next block order
    let blockOrder = createBlockDto.order;
    if (blockOrder === undefined) {
      const maxOrder = await this.prisma.contentBlock.aggregate({
        where: { slide_id: createBlockDto.slide_id },
        _max: { block_order: true },
      });
      blockOrder = (maxOrder._max.block_order ?? -1) + 1;
    } else {
      // If order is specified, shift existing blocks
      await this.prisma.contentBlock.updateMany({
        where: {
          slide_id: createBlockDto.slide_id,
          block_order: { gte: blockOrder },
        },
        data: {
          block_order: { increment: 1 },
        },
      });
    }

    // Create the content block
    const block = await this.prisma.contentBlock.create({
      data: {
        slide_id: createBlockDto.slide_id,
        block_type: createBlockDto.type,
        block_order: blockOrder,
        content_en: contentJson as Prisma.InputJsonObject,
        style_config: createBlockDto.metadata
          ? (createBlockDto.metadata as Prisma.InputJsonObject)
          : undefined,
      },
    });

    return this.mapToBlockResponse(block);
  }

  /**
   * Get a single content block by ID
   */
  async findOne(blockId: string, teacherId?: string): Promise<ContentBlockResponseDto> {
    const block = await this.prisma.contentBlock.findUnique({
      where: { id: blockId },
      include: {
        slide: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                course_id: true,
              },
            },
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Content block not found');
    }

    // Verify ownership if teacherId provided
    if (teacherId) {
      await this.coursesService.verifyOwnership(block.slide.lesson.course_id, teacherId);
    }

    return this.mapToBlockResponse(block);
  }

  /**
   * Get all content blocks for a slide
   */
  async findAllForSlide(slideId: string, teacherId?: string): Promise<ContentBlockResponseDto[]> {
    // Verify slide exists and ownership
    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (!slide) {
      throw new NotFoundException('Slide not found');
    }

    if (teacherId) {
      await this.coursesService.verifyOwnership(slide.lesson.course_id, teacherId);
    }

    const blocks = await this.prisma.contentBlock.findMany({
      where: { slide_id: slideId },
      orderBy: { block_order: 'asc' },
    });

    return blocks.map((block) => this.mapToBlockResponse(block));
  }

  /**
   * Update a content block
   */
  async update(
    blockId: string,
    teacherId: string,
    updateBlockDto: UpdateContentBlockDto,
  ): Promise<ContentBlockResponseDto> {
    // Verify block exists and ownership
    const existingBlock = await this.prisma.contentBlock.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        slide_id: true,
        block_type: true,
        slide: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                course_id: true,
              },
            },
          },
        },
      },
    });

    if (!existingBlock) {
      throw new NotFoundException('Content block not found');
    }

    await this.coursesService.verifyOwnership(existingBlock.slide.lesson.course_id, teacherId);

    // Parse and validate content if provided
    let contentJson: unknown;
    if (updateBlockDto.content !== undefined) {
      try {
        contentJson = JSON.parse(updateBlockDto.content);
      } catch (error) {
        throw new BadRequestException('Content must be a valid JSON string');
      }

      // Sanitize HTML content to prevent XSS
      contentJson = sanitizeJsonContent(contentJson);

      // Validate against the block's type
      const validation = validateContentByType(existingBlock.block_type, contentJson);
      if (!validation.valid) {
        throw new BadRequestException(
          `Invalid content for block type ${existingBlock.block_type}: ${validation.errors?.join(', ')}`,
        );
      }
    }

    // Update the content block
    const updatedBlock = await this.prisma.contentBlock.update({
      where: { id: blockId },
      data: {
        content_en: contentJson !== undefined ? (contentJson as Prisma.InputJsonObject) : undefined,
        style_config: updateBlockDto.metadata
          ? (updateBlockDto.metadata as Prisma.InputJsonObject)
          : undefined,
      },
    });

    return this.mapToBlockResponse(updatedBlock);
  }

  /**
   * Delete a content block
   */
  async remove(blockId: string, teacherId: string): Promise<void> {
    // Verify block exists and ownership
    const block = await this.prisma.contentBlock.findUnique({
      where: { id: blockId },
      select: {
        id: true,
        slide_id: true,
        block_order: true,
        slide: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                course_id: true,
              },
            },
          },
        },
      },
    });

    if (!block) {
      throw new NotFoundException('Content block not found');
    }

    await this.coursesService.verifyOwnership(block.slide.lesson.course_id, teacherId);

    // Delete block and reorder remaining blocks
    await this.prisma.$transaction([
      this.prisma.contentBlock.delete({
        where: { id: blockId },
      }),
      this.prisma.contentBlock.updateMany({
        where: {
          slide_id: block.slide_id,
          block_order: { gt: block.block_order },
        },
        data: {
          block_order: { decrement: 1 },
        },
      }),
    ]);
  }

  /**
   * Reorder content blocks within a slide
   */
  async reorderBlocks(
    slideId: string,
    teacherId: string,
    reorderDto: ReorderContentBlocksDto,
  ): Promise<ContentBlockResponseDto[]> {
    // Verify slide exists and ownership
    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (!slide) {
      throw new NotFoundException('Slide not found');
    }

    await this.coursesService.verifyOwnership(slide.lesson.course_id, teacherId);

    // Verify all blocks belong to this slide
    const blockIds = reorderDto.block_orders.map((item) => item.block_id);
    const blocks = await this.prisma.contentBlock.findMany({
      where: {
        id: { in: blockIds },
        slide_id: slideId,
      },
      select: { id: true },
    });

    if (blocks.length !== blockIds.length) {
      throw new BadRequestException('Some blocks do not belong to this slide');
    }

    // Validate no duplicate orders
    const orders = reorderDto.block_orders.map((item) => item.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException('Duplicate order values are not allowed');
    }

    // Update all blocks in a transaction
    await this.prisma.$transaction(
      reorderDto.block_orders.map((item) =>
        this.prisma.contentBlock.update({
          where: { id: item.block_id },
          data: { block_order: item.order },
        }),
      ),
    );

    // Return updated blocks
    return this.findAllForSlide(slideId, teacherId);
  }

  /**
   * Duplicate a content block
   */
  async duplicateBlock(blockId: string, teacherId: string): Promise<ContentBlockResponseDto> {
    // Verify block exists and ownership
    const originalBlock = await this.prisma.contentBlock.findUnique({
      where: { id: blockId },
      include: {
        slide: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                course_id: true,
              },
            },
          },
        },
      },
    });

    if (!originalBlock) {
      throw new NotFoundException('Content block not found');
    }

    await this.coursesService.verifyOwnership(originalBlock.slide.lesson.course_id, teacherId);

    // Get the next block order
    const maxOrder = await this.prisma.contentBlock.aggregate({
      where: { slide_id: originalBlock.slide_id },
      _max: { block_order: true },
    });
    const newBlockOrder = (maxOrder._max.block_order ?? -1) + 1;

    // Duplicate the block
    const duplicatedBlock = await this.prisma.contentBlock.create({
      data: {
        slide_id: originalBlock.slide_id,
        block_order: newBlockOrder,
        block_type: originalBlock.block_type,
        content_en: originalBlock.content_en as Prisma.InputJsonObject,
        content_fr: originalBlock.content_fr
          ? (originalBlock.content_fr as Prisma.InputJsonObject)
          : undefined,
        style_config: originalBlock.style_config
          ? (originalBlock.style_config as Prisma.InputJsonObject)
          : undefined,
      },
    });

    return this.mapToBlockResponse(duplicatedBlock);
  }

  /**
   * Bulk delete content blocks
   */
  async bulkDeleteBlocks(blockIds: string[], teacherId: string): Promise<void> {
    if (blockIds.length === 0) {
      throw new BadRequestException('No block IDs provided');
    }

    // Verify all blocks exist and ownership
    const blocks = await this.prisma.contentBlock.findMany({
      where: { id: { in: blockIds } },
      select: {
        id: true,
        slide_id: true,
        block_order: true,
        slide: {
          select: {
            id: true,
            lesson: {
              select: {
                id: true,
                course_id: true,
              },
            },
          },
        },
      },
    });

    if (blocks.length !== blockIds.length) {
      throw new NotFoundException('Some blocks not found');
    }

    // Verify ownership for all blocks
    const courseIds = [...new Set(blocks.map((b) => b.slide.lesson.course_id))];
    await Promise.all(
      courseIds.map((courseId) => this.coursesService.verifyOwnership(courseId, teacherId)),
    );

    // Group blocks by slide for reordering
    const blocksBySlide = blocks.reduce(
      (acc, block) => {
        if (!acc[block.slide_id]) {
          acc[block.slide_id] = [];
        }
        acc[block.slide_id].push(block);
        return acc;
      },
      {} as Record<string, typeof blocks>,
    );

    // Delete blocks and reorder in a transaction
    await this.prisma.$transaction([
      // Delete all blocks
      this.prisma.contentBlock.deleteMany({
        where: { id: { in: blockIds } },
      }),
      // Reorder remaining blocks in each affected slide
      ...Object.entries(blocksBySlide).flatMap(([slideId, deletedBlocks]) => {
        // Sort deleted blocks by order
        const sortedDeleted = deletedBlocks.sort((a, b) => a.block_order - b.block_order);

        // For each deleted block, decrement orders after it
        return sortedDeleted.map((deletedBlock, index) =>
          this.prisma.contentBlock.updateMany({
            where: {
              slide_id: slideId,
              block_order: { gt: deletedBlock.block_order - index },
            },
            data: {
              block_order: { decrement: 1 },
            },
          }),
        );
      }),
    ]);
  }

  /**
   * Map Prisma ContentBlock to ContentBlockResponseDto
   */
  private mapToBlockResponse(block: ContentBlock): ContentBlockResponseDto {
    return {
      id: block.id,
      slide_id: block.slide_id,
      type: block.block_type,
      content: JSON.stringify(block.content_en), // Convert Json to string
      metadata: block.style_config ? (block.style_config as Record<string, unknown>) : undefined,
      order: block.block_order,
      created_at: block.created_at,
      updated_at: block.updated_at,
    };
  }
}
