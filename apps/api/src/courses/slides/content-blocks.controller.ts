import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Put,
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

import { ContentBlocksService } from './content-blocks.service';
import {
  CreateContentBlockDto,
  UpdateContentBlockDto,
  ContentBlockResponseDto,
  ReorderContentBlocksDto,
} from './dto';

@ApiTags('content-blocks')
@ApiBearerAuth()
@Controller('content-blocks')
@UseGuards(RolesGuard)
export class ContentBlocksController {
  constructor(private readonly contentBlocksService: ContentBlocksService) {}

  @Get(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get a single content block' })
  @ApiResponse({
    status: 200,
    description: 'Content block retrieved successfully',
    type: ContentBlockResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content block not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this content block',
  })
  async findOne(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<ContentBlockResponseDto> {
    return this.contentBlocksService.findOne(id, teacherId);
  }

  @Patch(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Update a content block (course owner only)' })
  @ApiResponse({
    status: 200,
    description: 'Content block updated successfully',
    type: ContentBlockResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content block not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to update this content block',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid content for block type',
  })
  async update(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
    @Body() updateBlockDto: UpdateContentBlockDto,
  ): Promise<ContentBlockResponseDto> {
    return this.contentBlocksService.update(id, teacherId, updateBlockDto);
  }

  @Delete(':id')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a content block (course owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Content block deleted successfully',
  })
  @ApiResponse({ status: 404, description: 'Content block not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete this content block',
  })
  async remove(@Param('id') id: string, @CurrentUser('id') teacherId: string): Promise<void> {
    return this.contentBlocksService.remove(id, teacherId);
  }

  @Post(':id/duplicate')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Duplicate a content block (course owner only)' })
  @ApiResponse({
    status: 201,
    description: 'Content block duplicated successfully',
    type: ContentBlockResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Content block not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to duplicate this content block',
  })
  async duplicate(
    @Param('id') id: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<ContentBlockResponseDto> {
    return this.contentBlocksService.duplicateBlock(id, teacherId);
  }

  @Delete('bulk')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Bulk delete content blocks (course owner only)' })
  @ApiResponse({
    status: 204,
    description: 'Content blocks deleted successfully',
  })
  @ApiResponse({ status: 400, description: 'No block IDs provided or invalid IDs' })
  @ApiResponse({ status: 404, description: 'Some blocks not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to delete some blocks',
  })
  async bulkDelete(
    @Body('block_ids') blockIds: string[],
    @CurrentUser('id') teacherId: string,
  ): Promise<void> {
    return this.contentBlocksService.bulkDeleteBlocks(blockIds, teacherId);
  }
}

// Nested route for slide content blocks
@ApiTags('slides')
@ApiBearerAuth()
@Controller('slides/:slideId/content-blocks')
@UseGuards(RolesGuard)
export class SlideContentBlocksController {
  constructor(private readonly contentBlocksService: ContentBlocksService) {}

  @Post()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Create a new content block for a slide (course owner only)',
  })
  @ApiResponse({
    status: 201,
    description: 'Content block created successfully',
    type: ContentBlockResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data or content validation failed' })
  @ApiResponse({ status: 403, description: 'Not authorized to access this slide' })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  async create(
    @Param('slideId') slideId: string,
    @CurrentUser('id') teacherId: string,
    @Body() createBlockDto: CreateContentBlockDto,
  ): Promise<ContentBlockResponseDto> {
    // Ensure slide_id from URL matches DTO
    const dto = { ...createBlockDto, slide_id: slideId };
    return this.contentBlocksService.create(teacherId, dto);
  }

  @Get()
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all content blocks for a slide' })
  @ApiResponse({
    status: 200,
    description: 'List of content blocks retrieved successfully',
    type: [ContentBlockResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to access this slide',
  })
  async findAllForSlide(
    @Param('slideId') slideId: string,
    @CurrentUser('id') teacherId: string,
  ): Promise<ContentBlockResponseDto[]> {
    return this.contentBlocksService.findAllForSlide(slideId, teacherId);
  }

  @Put('reorder')
  @Roles(UserRole.TEACHER, UserRole.ADMIN)
  @ApiOperation({
    summary: 'Reorder content blocks within a slide (course owner only)',
  })
  @ApiResponse({
    status: 200,
    description: 'Content blocks reordered successfully',
    type: [ContentBlockResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Slide not found' })
  @ApiResponse({
    status: 403,
    description: 'Not authorized to modify this slide',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid block IDs or duplicate orders',
  })
  async reorder(
    @Param('slideId') slideId: string,
    @CurrentUser('id') teacherId: string,
    @Body() reorderDto: ReorderContentBlocksDto,
  ): Promise<ContentBlockResponseDto[]> {
    return this.contentBlocksService.reorderBlocks(slideId, teacherId, reorderDto);
  }
}
