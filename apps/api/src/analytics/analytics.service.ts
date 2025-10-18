import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { LessonAnalyticsDto, PopularLessonsResponseDto, EngagementMetricsDto } from './dto';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Get most popular lessons based on views and completions
   */
  async getPopularLessons(limit = 10): Promise<PopularLessonsResponseDto> {
    const lessonProgress = await this.prisma.lessonProgress.groupBy({
      by: ['lesson_id'],
      _count: {
        lesson_id: true,
      },
      _sum: {
        time_spent_seconds: true,
      },
      where: {
        status: {
          in: ['IN_PROGRESS', 'COMPLETED'],
        },
      },
      orderBy: {
        _count: {
          lesson_id: 'desc',
        },
      },
      take: limit,
    });

    const lessonIds = lessonProgress.map((p) => p.lesson_id);

    // Get lesson details
    const lessons = await this.prisma.lesson.findMany({
      where: {
        id: {
          in: lessonIds,
        },
      },
      include: {
        course: {
          select: {
            id: true,
            title_en: true,
          },
        },
      },
    });

    // Get completion counts
    const completions = await this.prisma.lessonProgress.groupBy({
      by: ['lesson_id'],
      _count: {
        lesson_id: true,
      },
      where: {
        lesson_id: {
          in: lessonIds,
        },
        status: 'COMPLETED',
      },
    });

    // Calculate average completion time
    const completionTimes = await this.prisma.lessonProgress.groupBy({
      by: ['lesson_id'],
      _avg: {
        time_spent_seconds: true,
      },
      where: {
        lesson_id: {
          in: lessonIds,
        },
        status: 'COMPLETED',
      },
    });

    // Map to analytics DTO
    const analyticsData: LessonAnalyticsDto[] = lessonProgress.map((progress) => {
      const lesson = lessons.find((l) => l.id === progress.lesson_id);
      const completion = completions.find((c) => c.lesson_id === progress.lesson_id);
      const avgCompletionTime = completionTimes.find((t) => t.lesson_id === progress.lesson_id);

      const totalViews = progress._count.lesson_id;
      const totalCompletions = completion?._count.lesson_id || 0;
      const completionRate = totalViews > 0 ? (totalCompletions / totalViews) * 100 : 0;

      return {
        lesson_id: progress.lesson_id,
        lesson_title_en: lesson?.title_en || 'Unknown',
        lesson_title_fr: lesson?.title_fr || null,
        course_id: lesson?.course_id || '',
        course_title_en: lesson?.course.title_en || 'Unknown',
        total_views: totalViews,
        total_completions: totalCompletions,
        completion_rate: Math.round(completionRate),
        average_time_spent_seconds: Math.round(progress._sum.time_spent_seconds! / totalViews),
        average_completion_time_seconds: avgCompletionTime?._avg.time_spent_seconds
          ? Math.round(avgCompletionTime._avg.time_spent_seconds)
          : null,
      };
    });

    return {
      lessons: analyticsData,
      total: analyticsData.length,
    };
  }

  /**
   * Get engagement metrics for the platform
   */
  async getEngagementMetrics(): Promise<EngagementMetricsDto> {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Total students
    const totalStudents = await this.prisma.user.count({
      where: { role: 'STUDENT' },
    });

    // Active students (last 7 days)
    const activeStudents7Days = await this.prisma.enrollment.findMany({
      where: {
        last_accessed_at: {
          gte: sevenDaysAgo,
        },
      },
      distinct: ['student_id'],
    });

    // Active students (last 30 days)
    const activeStudents30Days = await this.prisma.enrollment.findMany({
      where: {
        last_accessed_at: {
          gte: thirtyDaysAgo,
        },
      },
      distinct: ['student_id'],
    });

    // Enrollment statistics
    const [totalEnrollments, activeEnrollments, completedEnrollments, droppedEnrollments] =
      await Promise.all([
        this.prisma.enrollment.count(),
        this.prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        this.prisma.enrollment.count({ where: { status: 'COMPLETED' } }),
        this.prisma.enrollment.count({ where: { status: 'DROPPED' } }),
      ]);

    // Average completion rate
    const enrollments = await this.prisma.enrollment.findMany({
      select: {
        progress_percentage: true,
      },
    });

    const avgCompletionRate =
      enrollments.length > 0
        ? enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / enrollments.length
        : 0;

    // Total lessons completed
    const totalLessonsCompleted = await this.prisma.lessonProgress.count({
      where: { status: 'COMPLETED' },
    });

    // Total time spent
    const timeStats = await this.prisma.lessonProgress.aggregate({
      _sum: {
        time_spent_seconds: true,
      },
      _avg: {
        time_spent_seconds: true,
      },
    });

    return {
      total_students: totalStudents,
      active_students_last_7_days: activeStudents7Days.length,
      active_students_last_30_days: activeStudents30Days.length,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      completed_enrollments: completedEnrollments,
      dropped_enrollments: droppedEnrollments,
      average_course_completion_rate: Math.round(avgCompletionRate),
      total_lessons_completed: totalLessonsCompleted,
      total_time_spent_seconds: timeStats._sum.time_spent_seconds || 0,
      average_session_time_seconds: Math.round(timeStats._avg.time_spent_seconds || 0),
    };
  }

  /**
   * Get analytics for a specific course (teacher view)
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async getCourseAnalytics(courseId: string): Promise<any> {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        enrollments: {
          include: {
            lesson_progress: true,
          },
        },
        lessons: {
          include: {
            lesson_progress: true,
          },
        },
      },
    });

    if (!course) {
      return null;
    }

    // Calculate metrics
    const totalEnrollments = course.enrollments.length;
    const activeEnrollments = course.enrollments.filter((e) => e.status === 'ACTIVE').length;
    const completedEnrollments = course.enrollments.filter((e) => e.status === 'COMPLETED').length;

    const avgProgress =
      totalEnrollments > 0
        ? course.enrollments.reduce((sum, e) => sum + e.progress_percentage, 0) / totalEnrollments
        : 0;

    // Lesson-level analytics
    const lessonAnalytics = course.lessons.map((lesson) => {
      const progressRecords = lesson.lesson_progress;
      const completions = progressRecords.filter((p) => p.status === 'COMPLETED');

      return {
        lesson_id: lesson.id,
        lesson_title: lesson.title_en,
        total_views: progressRecords.length,
        total_completions: completions.length,
        completion_rate:
          progressRecords.length > 0 ? (completions.length / progressRecords.length) * 100 : 0,
        average_time_spent:
          progressRecords.length > 0
            ? progressRecords.reduce((sum, p) => sum + p.time_spent_seconds, 0) /
              progressRecords.length
            : 0,
      };
    });

    return {
      course_id: courseId,
      course_title: course.title_en,
      total_enrollments: totalEnrollments,
      active_enrollments: activeEnrollments,
      completed_enrollments: completedEnrollments,
      average_progress_percentage: Math.round(avgProgress),
      lessons: lessonAnalytics,
    };
  }
}
