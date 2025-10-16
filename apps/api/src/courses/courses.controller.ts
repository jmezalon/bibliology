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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CoursesService } from './courses.service';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CourseResponseDto,
  CourseListResponseDto,
  TogglePublishDto,
} from './dto';

@ApiTags('courses')
@ApiBearerAuth()
@Controller('courses')
@UseGuards(RolesGuard)
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Create a new course (teachers only)' })
  @ApiResponse({
    status: 201,
    description: 'Course created successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @ApiResponse({ status: 409, description: 'Course slug already exists' })
  async create(
    @CurrentUser('id') teacherId: string,
    @Body() createCourseDto: CreateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.create(teacherId, createCourseDto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all courses for the authenticated teacher',
  })
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
    description: 'List of courses retrieved successfully',
    type: CourseListResponseDto,
  })
  async findAll(
    @CurrentUser('id') teacherId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ): Promise<CourseListResponseDto> {
    return this.coursesService.findAllForTeacher(teacherId, page, limit);
  }

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single course by ID' })
  @ApiResponse({
    status: 200,
    description: 'Course retrieved successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this course',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<CourseResponseDto> {
    return this.coursesService.findOne(id, teacherId);
  }

  @Put(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a course (owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Course updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this course',
  })
  @ApiResponse({ status: 409, description: 'Course slug already exists' })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateCourseDto: UpdateCourseDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.update(id, teacherId, updateCourseDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a course with cascade (owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Course deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this course',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot delete course with active enrollments',
  })
  async remove(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<void> {
    return this.coursesService.remove(id, teacherId);
  }

  @Patch(':id/publish')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Publish or unpublish a course (owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Course publish status updated successfully',
    type: CourseResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Course not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to publish this course',
  })
  @ApiResponse({
    status: 400,
    description: 'Cannot publish course without lessons',
  })
  async togglePublish(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() togglePublishDto: TogglePublishDto,
  ): Promise<CourseResponseDto> {
    return this.coursesService.togglePublish(id, teacherId, togglePublishDto.publish);
  }
}
