/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-explicit-any */
import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';

import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';

import { AnalyticsService } from './analytics.service';
import {
  PopularLessonsResponseDto,
  EngagementMetricsDto,
} from './dto';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /**
   * GET /api/analytics/lessons/popular
   * Get most popular lessons
   */
  @Get('lessons/popular')
  @Roles(UserRole.ADMIN, UserRole.TEACHER)
  async getPopularLessons(
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
  ): Promise<PopularLessonsResponseDto> {
    return this.analyticsService.getPopularLessons(limit || 10);
  }

  /**
   * GET /api/analytics/engagement
   * Get platform engagement metrics
   */
  @Get('engagement')
  @Roles(UserRole.ADMIN)
  async getEngagementMetrics(): Promise<EngagementMetricsDto> {
    return this.analyticsService.getEngagementMetrics();
  }

  /**
   * GET /api/analytics/courses/:courseId
   * Get analytics for a specific course
   */
  @Get('courses/:courseId')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  async getCourseAnalytics(@Param('courseId') courseId: string): Promise<any> {
    return this.analyticsService.getCourseAnalytics(courseId);
  }
}
