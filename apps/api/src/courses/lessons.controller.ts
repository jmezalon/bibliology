import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseIntPipe,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

import {
  CreateLessonDto,
  UpdateLessonDto,
  LessonResponseDto,
  LessonListResponseDto,
  ReorderSlidesDto,
} from './dto';
import { LessonsService } from './lessons.service';

@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons')
@UseGuards(RolesGuard)
export class LessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new lesson in a course (course owner only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Lesson created successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this course' })
  @ApiResponse({ status: 409, description: 'Lesson slug or order already exists' })
  async create(
    @CurrentUser('id') teacherId: string,
    @Body() createLessonDto: CreateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.create(teacherId, createLessonDto);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single lesson with all slides and content blocks' })
  @ApiResponse({
    status: 200,
    description: 'Lesson retrieved successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this lesson',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.findOne(id, teacherId);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a lesson (course owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Lesson updated successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this lesson',
  })
  @ApiResponse({ status: 409, description: 'Lesson slug or order already exists' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateLessonDto: UpdateLessonDto,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.update(id, teacherId, updateLessonDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a lesson with cascade (course owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Lesson deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this lesson',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete lesson with student progress',
  })
  async remove(@Param('id') id: string, @CurrentUser('id') teacherId: string): Promise<void> {
    return this.lessonsService.remove(id, teacherId);
  }

  @Patch(':id/reorder')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reorder slides within a lesson (course owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Slides reordered successfully',
    type: LessonResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to modify this lesson',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid slide IDs provided',
  })
  async reorderSlides(
    @Param('id') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @Body() reorderDto: ReorderSlidesDto,
  ): Promise<LessonResponseDto> {
    return this.lessonsService.reorderSlides(lessonId, teacherId, reorderDto);
  }
}

// Nested route for course lessons
@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses/:courseId/lessons')
@UseGuards(RolesGuard)
export class CourseLessonsController {
  constructor(private readonly lessonsService: LessonsService) {}

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all lessons for a course with pagination' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Items per page (default: 10)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of lessons retrieved successfully',
    type: LessonListResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this course',
  })
  async findAllForCourse(
    @Param('courseId') courseId: string,
    @CurrentUser('id') teacherId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<LessonListResponseDto> {
    return this.lessonsService.findAllForCourse(courseId, teacherId, page, limit);
  }
}
