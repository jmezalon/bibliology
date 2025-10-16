import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Slide, ContentBlock, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { CoursesService } from '../courses.service';

import { BulkReorderSlidesDto } from './dto/slide/bulk-reorder-slides.dto';
import { CreateSlideDto } from './dto/slide/create-slide.dto';
import { MoveSlideDto } from './dto/slide/move-slide.dto';
import { SlideResponseDto } from './dto/slide/slide-response.dto';
import { UpdateSlideDto } from './dto/slide/update-slide.dto';

@Injectable()
export class SlidesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Create a new slide for a lesson
   */
  async create(teacherId: string, createSlideDto: CreateSlideDto): Promise<SlideResponseDto> {
    // Verify lesson ownership through course chain
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: createSlideDto.lesson_id },
      select: { id: true, course_id: true, course: { select: { teacher_id: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.coursesService.verifyOwnership(lesson.course_id, teacherId);

    // Determine the next slide order
    let slideOrder = createSlideDto.slide_order;
    if (slideOrder === undefined) {
      const maxOrder = await this.prisma.slide.aggregate({
        where: { lesson_id: createSlideDto.lesson_id },
        _max: { slide_order: true },
      });
      slideOrder = (maxOrder._max.slide_order ?? -1) + 1;
    } else {
      // If order is specified, shift existing slides
      await this.prisma.slide.updateMany({
        where: {
          lesson_id: createSlideDto.lesson_id,
          slide_order: { gte: slideOrder },
        },
        data: {
          slide_order: { increment: 1 },
        },
      });
    }

    // Create the slide
    const slide = await this.prisma.slide.create({
      data: {
        lesson_id: createSlideDto.lesson_id,
        slide_order: slideOrder,
        layout: createSlideDto.layout,
        title_en: createSlideDto.title_en,
        title_fr: createSlideDto.title_fr,
        notes_en: createSlideDto.notes_en,
        notes_fr: createSlideDto.notes_fr,
      },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
      },
    });

    return this.mapToSlideResponse(slide);
  }

  /**
   * Get a single slide by ID
   */
  async findOne(slideId: string, teacherId?: string): Promise<SlideResponseDto> {
    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
        lesson: {
          select: {
            id: true,
            course_id: true,
            course: { select: { teacher_id: true } },
          },
        },
      },
    });

    if (!slide) {
      throw new NotFoundException('Slide not found');
    }

    // Verify ownership if teacherId provided
    if (teacherId) {
      await this.coursesService.verifyOwnership(slide.lesson.course_id, teacherId);
    }

    return this.mapToSlideResponse(slide);
  }

  /**
   * Get all slides for a lesson
   */
  async findAllForLesson(lessonId: string, teacherId?: string): Promise<SlideResponseDto[]> {
    // Verify lesson exists and ownership
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, course_id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    if (teacherId) {
      await this.coursesService.verifyOwnership(lesson.course_id, teacherId);
    }

    const slides = await this.prisma.slide.findMany({
      where: { lesson_id: lessonId },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
      },
      orderBy: { slide_order: 'asc' },
    });

    return slides.map((slide) => this.mapToSlideResponse(slide));
  }

  /**
   * Update a slide
   */
  async update(
    slideId: string,
    teacherId: string,
    updateSlideDto: UpdateSlideDto,
  ): Promise<SlideResponseDto> {
    // Verify slide exists and ownership
    const existingSlide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        lesson_id: true,
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (!existingSlide) {
      throw new NotFoundException('Slide not found');
    }

    await this.coursesService.verifyOwnership(existingSlide.lesson.course_id, teacherId);

    // Update the slide
    const updatedSlide = await this.prisma.slide.update({
      where: { id: slideId },
      data: {
        layout: updateSlideDto.layout,
        title_en: updateSlideDto.title_en,
        title_fr: updateSlideDto.title_fr,
        notes_en: updateSlideDto.notes_en,
        notes_fr: updateSlideDto.notes_fr,
      },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
      },
    });

    return this.mapToSlideResponse(updatedSlide);
  }

  /**
   * Delete a slide
   */
  async remove(slideId: string, teacherId: string): Promise<void> {
    // Verify slide exists and ownership
    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        lesson_id: true,
        slide_order: true,
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

    // Delete slide and reorder remaining slides
    await this.prisma.$transaction([
      this.prisma.slide.delete({
        where: { id: slideId },
      }),
      this.prisma.slide.updateMany({
        where: {
          lesson_id: slide.lesson_id,
          slide_order: { gt: slide.slide_order },
        },
        data: {
          slide_order: { decrement: 1 },
        },
      }),
    ]);
  }

  /**
   * Bulk reorder slides within a lesson
   */
  async bulkReorderSlides(
    lessonId: string,
    teacherId: string,
    reorderDto: BulkReorderSlidesDto,
  ): Promise<SlideResponseDto[]> {
    // Verify lesson exists and ownership
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, course_id: true },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    await this.coursesService.verifyOwnership(lesson.course_id, teacherId);

    // Verify all slides belong to this lesson
    const slideIds = reorderDto.slide_orders.map((item) => item.slide_id);
    const slides = await this.prisma.slide.findMany({
      where: {
        id: { in: slideIds },
        lesson_id: lessonId,
      },
      select: { id: true },
    });

    if (slides.length !== slideIds.length) {
      throw new BadRequestException('Some slides do not belong to this lesson');
    }

    // Validate no duplicate orders
    const orders = reorderDto.slide_orders.map((item) => item.order);
    if (new Set(orders).size !== orders.length) {
      throw new BadRequestException('Duplicate order values are not allowed');
    }

    // Update all slides in a transaction
    await this.prisma.$transaction(
      reorderDto.slide_orders.map((item) =>
        this.prisma.slide.update({
          where: { id: item.slide_id },
          data: { slide_order: item.order },
        }),
      ),
    );

    // Return updated slides
    return this.findAllForLesson(lessonId, teacherId);
  }

  /**
   * Duplicate a slide (including content blocks)
   */
  async duplicateSlide(slideId: string, teacherId: string): Promise<SlideResponseDto> {
    // Verify slide exists and ownership
    const originalSlide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (!originalSlide) {
      throw new NotFoundException('Slide not found');
    }

    await this.coursesService.verifyOwnership(originalSlide.lesson.course_id, teacherId);

    // Get the next slide order
    const maxOrder = await this.prisma.slide.aggregate({
      where: { lesson_id: originalSlide.lesson_id },
      _max: { slide_order: true },
    });
    const newSlideOrder = (maxOrder._max.slide_order ?? -1) + 1;

    // Duplicate slide and content blocks in a transaction
    const duplicatedSlide = await this.prisma.slide.create({
      data: {
        lesson_id: originalSlide.lesson_id,
        slide_order: newSlideOrder,
        layout: originalSlide.layout,
        title_en: originalSlide.title_en ? `${originalSlide.title_en} (Copy)` : null,
        title_fr: originalSlide.title_fr ? `${originalSlide.title_fr} (Copie)` : null,
        notes_en: originalSlide.notes_en,
        notes_fr: originalSlide.notes_fr,
        content_blocks: {
          create: originalSlide.content_blocks.map((block) => ({
            block_order: block.block_order,
            block_type: block.block_type,
            content_en: block.content_en as Prisma.InputJsonObject,
            content_fr: block.content_fr ? (block.content_fr as Prisma.InputJsonObject) : undefined,
            style_config: block.style_config ? (block.style_config as Prisma.InputJsonObject) : undefined,
          })),
        },
      },
      include: {
        content_blocks: {
          orderBy: { block_order: 'asc' },
        },
      },
    });

    return this.mapToSlideResponse(duplicatedSlide);
  }

  /**
   * Move slide to a different lesson
   */
  async moveSlideToLesson(
    slideId: string,
    teacherId: string,
    moveSlideDto: MoveSlideDto,
  ): Promise<SlideResponseDto> {
    // Verify slide exists and ownership
    const slide = await this.prisma.slide.findUnique({
      where: { id: slideId },
      select: {
        id: true,
        lesson_id: true,
        slide_order: true,
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

    // Verify target lesson exists and ownership
    const targetLesson = await this.prisma.lesson.findUnique({
      where: { id: moveSlideDto.target_lesson_id },
      select: { id: true, course_id: true },
    });

    if (!targetLesson) {
      throw new NotFoundException('Target lesson not found');
    }

    await this.coursesService.verifyOwnership(targetLesson.course_id, teacherId);

    // Determine target order
    let targetOrder = moveSlideDto.target_order;
    if (targetOrder === undefined) {
      const maxOrder = await this.prisma.slide.aggregate({
        where: { lesson_id: moveSlideDto.target_lesson_id },
        _max: { slide_order: true },
      });
      targetOrder = (maxOrder._max.slide_order ?? -1) + 1;
    }

    // Move slide in a transaction
    const movedSlide = await this.prisma.$transaction(async (tx) => {
      // Remove slide from old lesson (decrement orders after it)
      await tx.slide.updateMany({
        where: {
          lesson_id: slide.lesson_id,
          slide_order: { gt: slide.slide_order },
        },
        data: {
          slide_order: { decrement: 1 },
        },
      });

      // Make space in target lesson (increment orders at target position)
      await tx.slide.updateMany({
        where: {
          lesson_id: moveSlideDto.target_lesson_id,
          slide_order: { gte: targetOrder },
        },
        data: {
          slide_order: { increment: 1 },
        },
      });

      // Update the slide
      return tx.slide.update({
        where: { id: slideId },
        data: {
          lesson_id: moveSlideDto.target_lesson_id,
          slide_order: targetOrder,
        },
        include: {
          content_blocks: {
            orderBy: { block_order: 'asc' },
          },
        },
      });
    });

    return this.mapToSlideResponse(movedSlide);
  }

  /**
   * Bulk delete slides
   */
  async bulkDeleteSlides(slideIds: string[], teacherId: string): Promise<void> {
    if (slideIds.length === 0) {
      throw new BadRequestException('No slide IDs provided');
    }

    // Verify all slides exist and ownership
    const slides = await this.prisma.slide.findMany({
      where: { id: { in: slideIds } },
      select: {
        id: true,
        lesson_id: true,
        slide_order: true,
        lesson: {
          select: {
            id: true,
            course_id: true,
          },
        },
      },
    });

    if (slides.length !== slideIds.length) {
      throw new NotFoundException('Some slides not found');
    }

    // Verify ownership for all slides
    const courseIds = [...new Set(slides.map((s) => s.lesson.course_id))];
    await Promise.all(
      courseIds.map((courseId) => this.coursesService.verifyOwnership(courseId, teacherId)),
    );

    // Group slides by lesson for reordering
    const slidesByLesson = slides.reduce(
      (acc, slide) => {
        if (!acc[slide.lesson_id]) {
          acc[slide.lesson_id] = [];
        }
        acc[slide.lesson_id].push(slide);
        return acc;
      },
      {} as Record<string, typeof slides>,
    );

    // Delete slides and reorder in a transaction
    await this.prisma.$transaction([
      // Delete all slides
      this.prisma.slide.deleteMany({
        where: { id: { in: slideIds } },
      }),
      // Reorder remaining slides in each affected lesson
      ...Object.entries(slidesByLesson).flatMap(([lessonId, deletedSlides]) => {
        // Sort deleted slides by order
        const sortedDeleted = deletedSlides.sort((a, b) => a.slide_order - b.slide_order);

        // For each deleted slide, decrement orders after it
        return sortedDeleted.map((deletedSlide, index) =>
          this.prisma.slide.updateMany({
            where: {
              lesson_id: lessonId,
              slide_order: { gt: deletedSlide.slide_order - index },
            },
            data: {
              slide_order: { decrement: 1 },
            },
          }),
        );
      }),
    ]);
  }

  /**
   * Map Prisma Slide to SlideResponseDto
   */
  private mapToSlideResponse(
    slide: Slide & { content_blocks: ContentBlock[] },
  ): SlideResponseDto {
    return {
      id: slide.id,
      lesson_id: slide.lesson_id,
      slide_order: slide.slide_order,
      layout: slide.layout,
      title_en: slide.title_en ?? undefined,
      title_fr: slide.title_fr ?? undefined,
      notes_en: slide.notes_en ?? undefined,
      notes_fr: slide.notes_fr ?? undefined,
      content_blocks: slide.content_blocks.map((block) => ({
        id: block.id,
        slide_id: block.slide_id,
        type: block.block_type,
        content: JSON.stringify(block.content_en), // Convert Json to string
        metadata: block.style_config as Record<string, unknown> | undefined,
        order: block.block_order,
        created_at: block.created_at,
        updated_at: block.updated_at,
      })),
      created_at: slide.created_at,
      updated_at: slide.updated_at,
    };
  }
}
