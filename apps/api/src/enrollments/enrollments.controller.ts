import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserRole, EnrollmentStatus } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../common/types/request-with-user.interface';

import { EnrollmentResponseDto } from './dto';
import { EnrollmentsService } from './enrollments.service';

@Controller('enrollments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * POST /api/enrollments/courses/:courseId
   * Student enrolls in a course
   */
  @Post('courses/:courseId')
  @Roles(UserRole.STUDENT)
  async enrollInCourse(
    @Param('courseId') courseId: string,
    @Request() req: RequestWithUser,
  ): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.enrollInCourse(req.user.id, courseId);
  }

  /**
   * GET /api/enrollments/me
   * Get current student's enrollments
   */
  @Get('me')
  @Roles(UserRole.STUDENT)
  async getMyEnrollments(
    @Request() req: RequestWithUser,
    @Query('status') status?: EnrollmentStatus,
  ): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentsService.getStudentEnrollments(req.user.id, status);
  }

  /**
   * GET /api/enrollments/:id
   * Get enrollment by ID
   */
  @Get(':id')
  async getEnrollmentById(@Param('id') id: string): Promise<EnrollmentResponseDto> {
    return this.enrollmentsService.getEnrollmentById(id);
  }

  /**
   * DELETE /api/enrollments/:id
   * Unenroll from a course
   */
  @Delete(':id')
  @Roles(UserRole.STUDENT)
  @HttpCode(HttpStatus.NO_CONTENT)
  async unenrollFromCourse(
    @Param('id') enrollmentId: string,
    @Request() req: RequestWithUser,
  ): Promise<void> {
    return this.enrollmentsService.unenrollFromCourse(enrollmentId, req.user.id);
  }
}

@Controller('courses/:courseId')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CourseEnrollmentsController {
  constructor(private readonly enrollmentsService: EnrollmentsService) {}

  /**
   * GET /api/courses/:courseId/students
   * Teacher views students enrolled in their course
   */
  @Get('students')
  @Roles(UserRole.TEACHER)
  async getCourseStudents(
    @Param('courseId') courseId: string,
    @Request() req: RequestWithUser,
  ): Promise<EnrollmentResponseDto[]> {
    return this.enrollmentsService.getCourseStudents(courseId, req.user.id);
  }
}
