/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { LessonProgressStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import {
  LessonProgressResponseDto,
  UpdateProgressDto,
  CourseProgressResponseDto,
  MarkSlideViewedDto,
} from './dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get student's progress for a specific lesson
   */
  async getLessonProgress(lessonId: string, studentId: string): Promise<LessonProgressResponseDto> {
    // Get the enrollment for this lesson's course
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        course: true,
        slides: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: lesson.course_id,
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Get or create lesson progress
    let progress = await this.prisma.lessonProgress.findUnique({
      where: {
        enrollment_id_lesson_id: {
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
        },
      },
      include: {
        lesson: {
          select: {
            id: true,
            slug: true,
            title_en: true,
            title_fr: true,
            estimated_minutes: true,
            lesson_order: true,
          },
        },
      },
    });

    if (!progress) {
      progress = await this.prisma.lessonProgress.create({
        data: {
          enrollment_id: enrollment.id,
          lesson_id: lessonId,
          status: LessonProgressStatus.NOT_STARTED,
          current_slide_index: 0,
          total_slides_viewed: 0,
          time_spent_seconds: 0,
        },
        include: {
          lesson: {
            select: {
              id: true,
              slug: true,
              title_en: true,
              title_fr: true,
              estimated_minutes: true,
              lesson_order: true,
            },
          },
        },
      });
    }

    return this.mapToLessonProgressDto(progress, lesson.slides.length);
  }

  /**
   * Update lesson progress
   */
  async updateLessonProgress(
    lessonId: string,
    studentId: string,
    updateDto: UpdateProgressDto,
  ): Promise<LessonProgressResponseDto> {
    // Get existing progress
    const existingProgress = await this.getLessonProgress(lessonId, studentId);

    // Get lesson for validation
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        slides: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Update progress
    const updatedProgress = await this.prisma.lessonProgress.update({
      where: { id: existingProgress.id },
      data: {
        ...updateDto,
        // Auto-complete if all slides viewed
        ...(updateDto.total_slides_viewed &&
          updateDto.total_slides_viewed >= lesson.slides.length && {
            status: LessonProgressStatus.COMPLETED,
            completed_at: new Date(),
          }),
        // Set to in progress if not already completed
        ...(updateDto.current_slide_index !== undefined &&
          existingProgress.status === LessonProgressStatus.NOT_STARTED && {
            status: LessonProgressStatus.IN_PROGRESS,
          }),
      },
      include: {
        lesson: {
          select: {
            id: true,
            slug: true,
            title_en: true,
            title_fr: true,
            estimated_minutes: true,
            lesson_order: true,
          },
        },
        enrollment: true,
      },
    });

    // Update enrollment progress if lesson was completed
    if (
      updatedProgress.status === LessonProgressStatus.COMPLETED &&
      existingProgress.status !== LessonProgressStatus.COMPLETED
    ) {
      await this.updateEnrollmentProgress(updatedProgress.enrollment_id);
    }

    return this.mapToLessonProgressDto(updatedProgress, lesson.slides.length);
  }

  /**
   * Mark a slide as viewed
   */
  async markSlideViewed(
    lessonId: string,
    studentId: string,
    markSlideDto: MarkSlideViewedDto,
  ): Promise<LessonProgressResponseDto> {
    // Get current progress
    const progress = await this.getLessonProgress(lessonId, studentId);

    // Get lesson to check total slides
    const lesson = await this.prisma.lesson.findUnique({
      where: { id: lessonId },
      include: {
        slides: true,
      },
    });

    if (!lesson) {
      throw new NotFoundException('Lesson not found');
    }

    // Calculate new total slides viewed
    const totalSlidesViewed = Math.max(progress.total_slides_viewed, markSlideDto.slide_index + 1);

    // Update progress
    return this.updateLessonProgress(lessonId, studentId, {
      current_slide_index: markSlideDto.slide_index,
      total_slides_viewed: totalSlidesViewed,
      time_spent_seconds: progress.time_spent_seconds + markSlideDto.time_spent_seconds,
      status:
        totalSlidesViewed >= lesson.slides.length
          ? LessonProgressStatus.COMPLETED
          : LessonProgressStatus.IN_PROGRESS,
    });
  }

  /**
   * Get overall course progress for a student
   */
  async getCourseProgress(courseId: string, studentId: string): Promise<CourseProgressResponseDto> {
    // Get enrollment
    const enrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
      include: {
        lesson_progress: {
          include: {
            lesson: {
              select: {
                id: true,
                slug: true,
                title_en: true,
                title_fr: true,
                lesson_order: true,
                estimated_minutes: true,
              },
            },
          },
        },
        course: {
          include: {
            lessons: {
              where: { status: 'PUBLISHED' },
              include: {
                slides: true,
              },
            },
          },
        },
      },
    });

    if (!enrollment) {
      throw new ForbiddenException('Not enrolled in this course');
    }

    // Calculate statistics
    const lessonsCompleted = enrollment.lesson_progress.filter(
      (p) => p.status === LessonProgressStatus.COMPLETED,
    ).length;

    const lessonsInProgress = enrollment.lesson_progress.filter(
      (p) => p.status === LessonProgressStatus.IN_PROGRESS,
    ).length;

    const lessonsNotStarted =
      enrollment.course.lessons.length - lessonsCompleted - lessonsInProgress;

    const totalTimeSpent = enrollment.lesson_progress.reduce(
      (sum, p) => sum + p.time_spent_seconds,
      0,
    );

    // Calculate estimated time remaining
    const totalEstimatedMinutes = enrollment.course.lessons.reduce(
      (sum, lesson) => sum + (lesson.estimated_minutes || 0),
      0,
    );
    const estimatedTimeRemainingSeconds =
      totalEstimatedMinutes > 0
        ? (totalEstimatedMinutes * 60 * (enrollment.total_lessons - lessonsCompleted)) /
          enrollment.total_lessons
        : null;

    // Map lesson progress
    const lessonProgress = enrollment.course.lessons.map((lesson) => {
      const progress = enrollment.lesson_progress.find((p) => p.lesson_id === lesson.id);

      const completionPercentage = progress
        ? lesson.slides.length > 0
          ? Math.round((progress.total_slides_viewed / lesson.slides.length) * 100)
          : 0
        : 0;

      return {
        lesson_id: lesson.id,
        lesson_title_en: lesson.title_en,
        lesson_title_fr: lesson.title_fr,
        lesson_order: lesson.lesson_order,
        status: progress?.status || LessonProgressStatus.NOT_STARTED,
        completion_percentage: completionPercentage,
        time_spent_seconds: progress?.time_spent_seconds || 0,
        started_at: progress?.started_at || null,
        completed_at: progress?.completed_at || null,
      };
    });

    return {
      course_id: courseId,
      total_lessons: enrollment.total_lessons,
      lessons_completed: lessonsCompleted,
      lessons_in_progress: lessonsInProgress,
      lessons_not_started: lessonsNotStarted,
      overall_completion_percentage: enrollment.progress_percentage,
      total_time_spent_seconds: totalTimeSpent,
      estimated_time_remaining_seconds: estimatedTimeRemainingSeconds,
      last_accessed_at: enrollment.last_accessed_at,
      lesson_progress: lessonProgress.sort((a, b) => a.lesson_order - b.lesson_order),
    };
  }

  /**
   * Update enrollment progress (denormalized counts)
   */
  private async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lesson_progress: {
          where: { status: LessonProgressStatus.COMPLETED },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    const lessonsCompleted = enrollment.lesson_progress.length;
    const progressPercentage =
      enrollment.total_lessons > 0
        ? Math.round((lessonsCompleted / enrollment.total_lessons) * 100)
        : 0;

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        lessons_completed: lessonsCompleted,
        progress_percentage: progressPercentage,
        last_accessed_at: new Date(),
        ...(progressPercentage === 100 && {
          status: 'COMPLETED',
          completed_at: new Date(),
        }),
      },
    });
  }

  /**
   * Map lesson progress to DTO
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToLessonProgressDto(progress: any, totalSlides: number): LessonProgressResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const completionPercentage =
      totalSlides > 0 ? Math.round((progress.total_slides_viewed / totalSlides) * 100) : 0;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return {
      id: progress.id,
      enrollment_id: progress.enrollment_id,
      lesson_id: progress.lesson_id,
      status: progress.status,
      current_slide_index: progress.current_slide_index,
      total_slides_viewed: progress.total_slides_viewed,
      time_spent_seconds: progress.time_spent_seconds,
      started_at: progress.started_at,
      completed_at: progress.completed_at,
      updated_at: progress.updated_at,
      ...(progress.lesson && {
        lesson: progress.lesson,
      }),
      completion_percentage: completionPercentage,
    };
  }
}
