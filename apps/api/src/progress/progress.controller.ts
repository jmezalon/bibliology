import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RequestWithUser } from '../common/types/request-with-user.interface';

import {
  LessonProgressResponseDto,
  UpdateProgressDto,
  CourseProgressResponseDto,
  MarkSlideViewedDto,
} from './dto';
import { ProgressService } from './progress.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  /**
   * GET /api/lessons/:lessonId/progress
   * Get student's progress for a lesson
   */
  @Get('lessons/:lessonId/progress')
  @Roles(UserRole.STUDENT)
  async getLessonProgress(
    @Param('lessonId') lessonId: string,
    @Request() req: RequestWithUser,
  ): Promise<LessonProgressResponseDto> {
    return this.progressService.getLessonProgress(lessonId, req.user.id);
  }

  /**
   * POST /api/lessons/:lessonId/progress
   * Update student's progress for a lesson
   */
  @Post('lessons/:lessonId/progress')
  @Roles(UserRole.STUDENT)
  async updateLessonProgress(
    @Param('lessonId') lessonId: string,
    @Body() updateDto: UpdateProgressDto,
    @Request() req: RequestWithUser,
  ): Promise<LessonProgressResponseDto> {
    return this.progressService.updateLessonProgress(
      lessonId,
      req.user.id,
      updateDto,
    );
  }

  /**
   * POST /api/lessons/:lessonId/slides/:slideIndex/view
   * Mark a slide as viewed
   */
  @Post('lessons/:lessonId/slides/view')
  @Roles(UserRole.STUDENT)
  async markSlideViewed(
    @Param('lessonId') lessonId: string,
    @Body() markSlideDto: MarkSlideViewedDto,
    @Request() req: RequestWithUser,
  ): Promise<LessonProgressResponseDto> {
    return this.progressService.markSlideViewed(
      lessonId,
      req.user.id,
      markSlideDto,
    );
  }

  /**
   * GET /api/courses/:courseId/progress
   * Get overall course progress for a student
   */
  @Get('courses/:courseId/progress')
  @Roles(UserRole.STUDENT)
  async getCourseProgress(
    @Param('courseId') courseId: string,
    @Request() req: RequestWithUser,
  ): Promise<CourseProgressResponseDto> {
    return this.progressService.getCourseProgress(courseId, req.user.id);
  }
}
