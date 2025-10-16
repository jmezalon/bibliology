import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';

import {
  CreateSlideDto,
  UpdateSlideDto,
  SlideResponseDto,
  BulkReorderSlidesDto,
  MoveSlideDto,
} from './dto';
import { SlidesService } from './slides.service';

@ApiTags('slides')
@ApiBearerAuth()
@Controller('slides')
@UseGuards(RolesGuard)
export class SlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single slide with all content blocks' })
  @ApiResponse({
    status: 200,
    description: 'Slide retrieved successfully',
    type: SlideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this slide',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<SlideResponseDto> {
    return this.slidesService.findOne(id, teacherId);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a slide (course owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Slide updated successfully',
    type: SlideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this slide',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateSlideDto: UpdateSlideDto,
  ): Promise<SlideResponseDto> {
    return this.slidesService.update(id, teacherId, updateSlideDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a slide with cascade (course owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Slide deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this slide',
  })
  async remove(@Param('id') id: string, @CurrentUser('id') teacherId: string): Promise<void> {
    return this.slidesService.remove(id, teacherId);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Duplicate a slide (course owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Slide duplicated successfully',
    type: SlideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to duplicate this slide',
  })
  async duplicate(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<SlideResponseDto> {
    return this.slidesService.duplicateSlide(id, teacherId);
  }

  @Put(':id/move')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Move slide to a different lesson (course owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Slide moved successfully',
    type: SlideResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Slide or target lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to move this slide',
  })
  async move(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() moveSlideDto: MoveSlideDto,
  ): Promise<SlideResponseDto> {
    return this.slidesService.moveSlideToLesson(id, teacherId, moveSlideDto);
  }

  @Delete('bulk')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete slides (course owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Slides deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'No slide IDs provided or invalid IDs' })
  @ApiResponse({ status: 404, description: 'Some slides not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete some slides',
  })
  async bulkDelete(
    @Body('slide_ids') slideIds: string[],
    @CurrentUser('id') teacherId: string,
  ): Promise<void> {
    return this.slidesService.bulkDeleteSlides(slideIds, teacherId);
  }
}

// Nested route for lesson slides
@ApiTags('lessons')
@ApiBearerAuth()
@Controller('lessons/:lessonId/slides')
@UseGuards(RolesGuard)
export class LessonSlidesController {
  constructor(private readonly slidesService: SlidesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new slide in a lesson (course owner only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Slide created successfully',
    type: SlideResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this lesson' })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  async create(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @Body() createSlideDto: CreateSlideDto,
  ): Promise<SlideResponseDto> {
    // Ensure lesson_id from URL matches DTO
    const dto = { ...createSlideDto, lesson_id: lessonId };
    return this.slidesService.create(teacherId, dto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all slides for a lesson' })
  @ApiResponse({
    status: 200,
    description: 'List of slides retrieved successfully',
    type: [SlideResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this lesson',
  })
  async findAllForLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<SlideResponseDto[]> {
    return this.slidesService.findAllForLesson(lessonId, teacherId);
  }

  @Put('reorder')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Bulk reorder slides within a lesson (course owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Slides reordered successfully',
    type: [SlideResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Lesson not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to modify this lesson',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid slide IDs or duplicate orders',
  })
  async reorder(
    @Param('lessonId') lessonId: string,
    @CurrentUser('id') teacherId: string,
    @Body() reorderDto: BulkReorderSlidesDto,
  ): Promise<SlideResponseDto[]> {
    return this.slidesService.bulkReorderSlides(lessonId, teacherId, reorderDto);
  }
}
