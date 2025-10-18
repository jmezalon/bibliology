/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */
import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { EnrollmentStatus } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';

import { EnrollmentResponseDto } from './dto';

@Injectable()
export class EnrollmentsService {
  constructor(private prisma: PrismaService) {}

  /**
   * Enroll a student in a course
   */
  async enrollInCourse(studentId: string, courseId: string): Promise<EnrollmentResponseDto> {
    // Check if course exists and is published
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        lessons: {
          where: { status: 'PUBLISHED' },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== 'PUBLISHED') {
      throw new ForbiddenException('Course is not published');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.enrollment.findUnique({
      where: {
        student_id_course_id: {
          student_id: studentId,
          course_id: courseId,
        },
      },
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === EnrollmentStatus.ACTIVE) {
        throw new ConflictException('Already enrolled in this course');
      }

      // Reactivate dropped enrollment
      if (existingEnrollment.status === EnrollmentStatus.DROPPED) {
        return this.prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: {
            status: EnrollmentStatus.ACTIVE,
            last_accessed_at: new Date(),
          },
        });
      }
    }

    // Create new enrollment
    const enrollment = await this.prisma.enrollment.create({
      data: {
        student_id: studentId,
        course_id: courseId,
        status: EnrollmentStatus.ACTIVE,
        total_lessons: course.lessons.length,
        progress_percentage: 0,
        lessons_completed: 0,
      },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
    });

    return this.mapToResponseDto(enrollment);
  }

  /**
   * Get all enrollments for a student
   */
  async getStudentEnrollments(
    studentId: string,
    status?: EnrollmentStatus,
  ): Promise<EnrollmentResponseDto[]> {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        student_id: studentId,
        ...(status && { status }),
      },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
      },
      orderBy: {
        last_accessed_at: 'desc',
      },
    });

    return enrollments.map((e) => this.mapToResponseDto(e));
  }

  /**
   * Get all students enrolled in a course (for teachers)
   */
  async getCourseStudents(courseId: string, teacherId: string): Promise<EnrollmentResponseDto[]> {
    // Verify teacher owns the course
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        teacher_id: teacherId,
      },
    });

    if (!course) {
      throw new ForbiddenException('You do not have permission to view this course');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        course_id: courseId,
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
      orderBy: {
        enrolled_at: 'desc',
      },
    });

    return enrollments.map((e) => this.mapToResponseDto(e));
  }

  /**
   * Unenroll from a course
   */
  async unenrollFromCourse(enrollmentId: string, studentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    if (enrollment.student_id !== studentId) {
      throw new ForbiddenException('You do not have permission to unenroll from this course');
    }

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.DROPPED,
      },
    });
  }

  /**
   * Get enrollment by ID
   */
  async getEnrollmentById(enrollmentId: string): Promise<EnrollmentResponseDto> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        course: {
          include: {
            teacher: {
              select: {
                id: true,
                name: true,
                avatar_url: true,
              },
            },
          },
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar_url: true,
          },
        },
      },
    });

    if (!enrollment) {
      throw new NotFoundException('Enrollment not found');
    }

    return this.mapToResponseDto(enrollment);
  }

  /**
   * Update enrollment progress (denormalized counts)
   */
  async updateEnrollmentProgress(enrollmentId: string): Promise<void> {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        lesson_progress: {
          where: { status: 'COMPLETED' },
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
          status: EnrollmentStatus.COMPLETED,
          completed_at: new Date(),
        }),
      },
    });
  }

  /**
   * Map enrollment to response DTO
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private mapToResponseDto(enrollment: any): EnrollmentResponseDto {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return
    return {
      id: enrollment.id,
      student_id: enrollment.student_id,
      course_id: enrollment.course_id,
      status: enrollment.status,
      progress_percentage: enrollment.progress_percentage,
      lessons_completed: enrollment.lessons_completed,
      total_lessons: enrollment.total_lessons,
      enrolled_at: enrollment.enrolled_at,
      last_accessed_at: enrollment.last_accessed_at,
      completed_at: enrollment.completed_at,
      ...(enrollment.course && {
        course: {
          id: enrollment.course.id,
          slug: enrollment.course.slug,
          title_en: enrollment.course.title_en,
          title_fr: enrollment.course.title_fr,
          thumbnail_url: enrollment.course.thumbnail_url,
          status: enrollment.course.status,
          estimated_hours: enrollment.course.estimated_hours,
          teacher: enrollment.course.teacher,
        },
      }),
      ...(enrollment.student && {
        student: enrollment.student,
      }),
    };
  }
}
