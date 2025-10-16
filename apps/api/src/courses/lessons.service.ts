import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CoursesService } from './courses.service';
import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
  LessonListResponseDto,
  ReorderSlidesDto,
} from './dto';

@Injectable()
export class LessonsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly coursesService: CoursesService,
  ) {}

  /**
   * Create a new lesson
   * @param teacherId - ID of the teacher creating the lesson
   * @param createLessonDto - Lesson creation data
   * @returns Created lesson
   */
  async create(teacherId: string, createLessonDto: CreateLessonDto): Promise<LessonResponseDto> {
    // Verify teacher owns the course
    await this.coursesService.verifyOwnership(createLessonDto.course_id, teacherId);

    // Check if slug is already taken
    const existingLesson = await this.prisma.lesson.findUnique({
      where: { slug: createLessonDto.slug },
    });

    if (existingLesson) {
      throw new ConflictException(`Lesson with slug '${createLessonDto.slug}' already exists`);
    }

    // Check if lesson_order is already taken in this course
    const existingOrder = await this.prisma.lesson.findFirst({
      where: {
        course_id: createLessonDto.course_id,
        lesson_order: createLessonDto.lesson_order,
      },
    });

    if (existingOrder) {
      throw new ConflictException(
        `Lesson order ${createLessonDto.lesson_order} is already taken in this course`,
      );
    }

    // Create lesson
    const lesson = await this.prisma.lesson.create({
      data: {
        ...createLessonDto,
        import_date: createLessonDto.imported_from_pptx ? new Date() : null,
      },
      include: {
        course: {
          select: {
            id: true,
            title_en: true,
            title_fr: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToLessonResponse(lesson);
  }

  /**
   * Find all lessons for a course with pagination
   * @param courseId - Course ID
   * @param teacherId - Optional teacher ID for ownership verification
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated list of lessons
   */
  async findAllForCourse(
    courseId: string,
    teacherId?: string,
    page = 1,
    limit = 10,
  ): Promise<LessonListResponseDto> {
    // Verify course exists and teacher owns it (if teacherId provided)
    if (teacherId) {
      await this.coursesService.verifyOwnership(courseId, teacherId);
    }

    const skip = (page - 1) * limit;

    const [lessons, total] = await Promise.all([
      this.prisma.lesson.findMany({
        where: { course_id: courseId },
        include: {
          course: {
            select: {
              id: true,
              title_en: true,
              title_fr: true,
              slug: true,
            },
          },
          _count: {
            select: {
              slides: true,
            },
          },
        },
        orderBy: { lesson_order: 'asc' },
        skip,
        take: limit,
      }),
      this.prisma.lesson.count({
        where: { course_id: courseId },
      }),
    ]);

    return {
      data: lessons.map(this.mapToLessonResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single lesson by ID with all slides and content blocks
   * @param id - Lesson ID
   * @param teacherId - Optional teacher ID for ownership verification
   * @returns Lesson details with slides
   */
  async findOne(id: string, teacherId?: string): Promise<LessonResponseDto> {
    const lesson = await this.prisma.lesson.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title_en: true,
            title_fr: true,
            slug: true,
            teacher_id: true,
          },
        },
        slides: {
          include: {
            content_blocks: {
              orderBy: { block_order: 'asc' },
            },
          },
          orderBy: { slide_order: 'asc' },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException(`Lesson with ID '${id}' not found`);
    }

    // Verify ownership if teacherId is provided
    if (teacherId && lesson.course.teacher_id !== teacherId) {
      throw new ForbiddenException('You do not have permission to access this lesson');
    }

    return this.mapToLessonResponse(lesson);
  }

  /**
   * Update a lesson
   * @param id - Lesson ID
   * @param teacherId - ID of the teacher (for ownership verification)
   * @param updateLessonDto - Update data
   * @returns Updated lesson
   */
  async update(
    id: string,
    teacherId: string,
    updateLessonDto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    // Get lesson and verify ownership
    const existingLesson = await this.findOne(id, teacherId);

    // If updating slug, check for conflicts
    if (updateLessonDto.slug && updateLessonDto.slug !== existingLesson.slug) {
      const existingSlug = await this.prisma.lesson.findFirst({
        where: {
          slug: updateLessonDto.slug,
          NOT: { id },
        },
      });

      if (existingSlug) {
        throw new ConflictException(`Lesson with slug '${updateLessonDto.slug}' already exists`);
      }
    }

    // If updating lesson_order, check for conflicts
    if (
      updateLessonDto.lesson_order &&
      updateLessonDto.lesson_order !== existingLesson.lesson_order
    ) {
      const existingOrder = await this.prisma.lesson.findFirst({
        where: {
          course_id: existingLesson.course_id,
          lesson_order: updateLessonDto.lesson_order,
          NOT: { id },
        },
      });

      if (existingOrder) {
        throw new ConflictException(
          `Lesson order ${updateLessonDto.lesson_order} is already taken in this course`,
        );
      }
    }

    const lesson = await this.prisma.lesson.update({
      where: { id },
      data: updateLessonDto,
      include: {
        course: {
          select: {
            id: true,
            title_en: true,
            title_fr: true,
            slug: true,
          },
        },
      },
    });

    return this.mapToLessonResponse(lesson);
  }

  /**
   * Delete a lesson with cascade (slides, content blocks)
   * @param id - Lesson ID
   * @param teacherId - ID of the teacher (for ownership verification)
   */
  async remove(id: string, teacherId: string): Promise<void> {
    // Get lesson and verify ownership
    const lesson = await this.findOne(id, teacherId);

    // Verify teacher owns the course
    await this.coursesService.verifyOwnership(lesson.course_id, teacherId);

    // Check if there are any student progress records
    const progressCount = await this.prisma.lessonProgress.count({
      where: { lesson_id: id },
    });

    if (progressCount > 0) {
      throw new BadRequestException(
        `Cannot delete lesson with ${progressCount} student progress record(s). Archive the lesson instead.`,
      );
    }

    // Delete lesson (cascade will handle related records)
    await this.prisma.lesson.delete({
      where: { id },
    });
  }

  /**
   * Reorder slides within a lesson
   * @param lessonId - Lesson ID
   * @param teacherId - ID of the teacher (for ownership verification)
   * @param reorderDto - Array of slide IDs in new order
   */
  async reorderSlides(
    lessonId: string,
    teacherId: string,
    reorderDto: ReorderSlidesDto,
  ): Promise<LessonResponseDto> {
    // Get lesson and verify ownership
    const lesson = await this.findOne(lessonId, teacherId);

    // Verify teacher owns the course
    await this.coursesService.verifyOwnership(lesson.course_id, teacherId);

    // Verify all slide IDs belong to this lesson
    const slides = await this.prisma.slide.findMany({
      where: {
        lesson_id: lessonId,
        id: { in: reorderDto.slide_ids },
      },
      select: { id: true },
    });

    if (slides.length !== reorderDto.slide_ids.length) {
      throw new BadRequestException('Some slide IDs do not belong to this lesson');
    }

    // Update slide orders in transaction
    await this.prisma.$transaction(
      reorderDto.slide_ids.map((slideId, index) =>
        this.prisma.slide.update({
          where: { id: slideId },
          data: { slide_order: index + 1 },
        }),
      ),
    );

    // Return updated lesson
    return this.findOne(lessonId, teacherId);
  }

  /**
   * Map Prisma lesson object to LessonResponseDto
   * Note: Using 'any' type here due to complex Prisma query result type variations.
   * Different queries return different shapes (with/without slides, different course fields, etc.)
   * which makes creating a unified type very complex. The runtime behavior is safe.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLessonResponse = (lesson: any): LessonResponseDto => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const response: LessonResponseDto = {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      id: lesson.id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      slug: lesson.slug,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      course_id: lesson.course_id,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      title_en: lesson.title_en,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      title_fr: lesson.title_fr,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      description_en: lesson.description_en,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      description_fr: lesson.description_fr,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      lesson_order: lesson.lesson_order,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      status: lesson.status,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      estimated_minutes: lesson.estimated_minutes,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      imported_from_pptx: lesson.imported_from_pptx,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      original_filename: lesson.original_filename,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      import_date: lesson.import_date,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      created_at: lesson.created_at,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      updated_at: lesson.updated_at,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      published_at: lesson.published_at,
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (lesson.course) {
      response.course = {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        id: lesson.course.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        title_en: lesson.course.title_en,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        title_fr: lesson.course.title_fr,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        slug: lesson.course.slug,
      };
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    if (lesson.slides) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      response.slides = lesson.slides.map(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
        (slide: any) => ({
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          id: slide.id,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          slide_order: slide.slide_order,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          layout: slide.layout,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          title_en: slide.title_en,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          title_fr: slide.title_fr,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          notes_en: slide.notes_en,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          notes_fr: slide.notes_fr,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          created_at: slide.created_at,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          updated_at: slide.updated_at,
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
          content_blocks: slide.content_blocks.map(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
            (block: any) => ({
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              id: block.id,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              block_order: block.block_order,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              block_type: block.block_type,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              content_en: block.content_en,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              content_fr: block.content_fr,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              style_config: block.style_config,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              created_at: block.created_at,
              // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
              updated_at: block.updated_at,
            }),
          ),
        }),
      );
    }

    return response;
  };
}
