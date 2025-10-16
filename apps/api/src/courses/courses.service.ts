import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { LessonStatus, Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseListResponseDto,
} from './dto';

// Type for course with teacher and counts
type CourseWithRelations = Prisma.CourseGetPayload<{
  include: {
    teacher: {
      select: {
        id: true;
        name: true;
        email: true;
        avatar_url: true;
      };
    };
    _count: {
      select: {
        lessons: true;
        enrollments: true;
      };
    };
  };
}>;

@Injectable()
export class CoursesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a new course
   * @param teacherId - ID of the teacher creating the course
   * @param createCourseDto - Course creation data
   * @returns Created course
   */
  async create(
    teacherId: string,
    createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    // Check if slug is already taken
    const existingCourse = await this.prisma.course.findUnique({
      where: { slug: createCourseDto.slug },
    });

    if (existingCourse) {
      throw new ConflictException(
        `Course with slug '${createCourseDto.slug}' already exists`,
      );
    }

    // Create course
    const course = await this.prisma.course.create({
      data: {
        ...createCourseDto,
        teacher_id: teacherId,
        tags: createCourseDto.tags || [],
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return this.mapToCourseResponse(course);
  }

  /**
   * Find all courses for a teacher with pagination
   * @param teacherId - ID of the teacher
   * @param page - Page number (1-based)
   * @param limit - Items per page
   * @returns Paginated list of courses
   */
  async findAllForTeacher(
    teacherId: string,
    page = 1,
    limit = 10,
  ): Promise<CourseListResponseDto> {
    const skip = (page - 1) * limit;

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where: { teacher_id: teacherId },
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              avatar_url: true,
            },
          },
          _count: {
            select: {
              lessons: true,
              enrollments: true,
            },
          },
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.course.count({
        where: { teacher_id: teacherId },
      }),
    ]);

    return {
      data: courses.map(this.mapToCourseResponse),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Find a single course by ID
   * @param id - Course ID
   * @param teacherId - Optional teacher ID for ownership verification
   * @returns Course details
   */
  async findOne(
    id: string,
    teacherId?: string,
  ): Promise<CourseResponseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID '${id}' not found`);
    }

    // Verify ownership if teacherId is provided
    if (teacherId && course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You do not have permission to access this course',
      );
    }

    return this.mapToCourseResponse(course);
  }

  /**
   * Update a course
   * @param id - Course ID
   * @param teacherId - ID of the teacher (for ownership verification)
   * @param updateCourseDto - Update data
   * @returns Updated course
   */
  async update(
    id: string,
    teacherId: string,
    updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    // Verify course exists and teacher owns it
    await this.findOne(id, teacherId);

    // If updating slug, check for conflicts
    if (updateCourseDto.slug) {
      const existingCourse = await this.prisma.course.findFirst({
        where: {
          slug: updateCourseDto.slug,
          NOT: { id },
        },
      });

      if (existingCourse) {
        throw new ConflictException(
          `Course with slug '${updateCourseDto.slug}' already exists`,
        );
      }
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: updateCourseDto,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return this.mapToCourseResponse(course);
  }

  /**
   * Delete a course with cascade (lessons, slides, content blocks)
   * @param id - Course ID
   * @param teacherId - ID of the teacher (for ownership verification)
   */
  async remove(id: string, teacherId: string): Promise<void> {
    // Verify course exists and teacher owns it
    await this.findOne(id, teacherId);

    // Check if there are active enrollments
    const enrollmentCount = await this.prisma.enrollment.count({
      where: {
        course_id: id,
        status: 'ACTIVE',
      },
    });

    if (enrollmentCount > 0) {
      throw new BadRequestException(
        `Cannot delete course with ${enrollmentCount} active enrollment(s). Archive the course instead.`,
      );
    }

    // Delete course (cascade will handle related records)
    // Note: Cascade deletes will handle lessons, slides, content blocks, quizzes, etc.
    await this.prisma.course.delete({
      where: { id },
    });
  }

  /**
   * Publish or unpublish a course
   * @param id - Course ID
   * @param teacherId - ID of the teacher (for ownership verification)
   * @param publish - true to publish, false to unpublish
   * @returns Updated course
   */
  async togglePublish(
    id: string,
    teacherId: string,
    publish: boolean,
  ): Promise<CourseResponseDto> {
    // Verify course exists and teacher owns it
    await this.findOne(id, teacherId);

    // If publishing, verify course has at least one lesson
    if (publish) {
      const lessonCount = await this.prisma.lesson.count({
        where: { course_id: id },
      });

      if (lessonCount === 0) {
        throw new BadRequestException(
          'Cannot publish a course without any lessons',
        );
      }
    }

    const updatedCourse = await this.prisma.course.update({
      where: { id },
      data: {
        status: publish ? LessonStatus.PUBLISHED : LessonStatus.DRAFT,
        published_at: publish ? new Date() : null,
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
        _count: {
          select: {
            lessons: true,
            enrollments: true,
          },
        },
      },
    });

    return this.mapToCourseResponse(updatedCourse);
  }

  /**
   * Verify course ownership
   * @param courseId - Course ID
   * @param teacherId - Teacher ID
   * @returns true if teacher owns the course
   * @throws NotFoundException if course doesn't exist
   * @throws ForbiddenException if teacher doesn't own the course
   */
  async verifyOwnership(courseId: string, teacherId: string): Promise<boolean> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, teacher_id: true },
    });

    if (!course) {
      throw new NotFoundException(`Course with ID '${courseId}' not found`);
    }

    if (course.teacher_id !== teacherId) {
      throw new ForbiddenException(
        'You do not have permission to access this course',
      );
    }

    return true;
  }

  /**
   * Map Prisma course object to CourseResponseDto
   */
  private mapToCourseResponse = (
    course: CourseWithRelations,
  ): CourseResponseDto => {
    return {
      id: course.id,
      slug: course.slug,
      teacher_id: course.teacher_id,
      title_en: course.title_en,
      title_fr: course.title_fr,
      description_en: course.description_en,
      description_fr: course.description_fr,
      thumbnail_url: course.thumbnail_url,
      cover_image_url: course.cover_image_url,
      status: course.status,
      category: course.category,
      tags: course.tags,
      estimated_hours: course.estimated_hours,
      difficulty: course.difficulty,
      created_at: course.created_at,
      updated_at: course.updated_at,
      published_at: course.published_at,
      teacher: course.teacher,
      lessonCount: course._count?.lessons,
      enrollmentCount: course._count?.enrollments,
    };
  };
}
