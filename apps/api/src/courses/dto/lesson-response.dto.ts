import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus, SlideLayout, ContentBlockType, Prisma } from '@prisma/client';
import { IsArray, IsUUID, ArrayMinSize, ArrayMaxSize } from 'class-validator';

export class ContentBlockDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  block_order: number;

  @ApiProperty({ enum: ContentBlockType })
  block_type: ContentBlockType;

  @ApiProperty({ description: 'Content in English (JSONB)' })
  content_en: Prisma.JsonValue;

  @ApiPropertyOptional({ description: 'Content in French (JSONB)' })
  content_fr?: Prisma.JsonValue | null;

  @ApiPropertyOptional({ description: 'Style configuration (JSONB)' })
  style_config?: Prisma.JsonValue | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}

export class SlideDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slide_order: number;

  @ApiProperty({ enum: SlideLayout })
  layout: SlideLayout;

  @ApiPropertyOptional()
  title_en?: string | null;

  @ApiPropertyOptional()
  title_fr?: string | null;

  @ApiPropertyOptional()
  notes_en?: string | null;

  @ApiPropertyOptional()
  notes_fr?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiProperty({ type: [ContentBlockDto] })
  content_blocks: ContentBlockDto[];
}

export class LessonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  course_id: string;

  @ApiProperty()
  title_en: string;

  @ApiPropertyOptional()
  title_fr?: string | null;

  @ApiPropertyOptional()
  description_en?: string | null;

  @ApiPropertyOptional()
  description_fr?: string | null;

  @ApiProperty()
  lesson_order: number;

  @ApiProperty({ enum: LessonStatus })
  status: LessonStatus;

  @ApiPropertyOptional()
  estimated_minutes?: number | null;

  @ApiProperty()
  imported_from_pptx: boolean;

  @ApiPropertyOptional()
  original_filename?: string | null;

  @ApiPropertyOptional()
  import_date?: Date | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  published_at?: Date | null;

  @ApiPropertyOptional({ type: [SlideDto], description: 'Slides with content blocks' })
  slides?: SlideDto[];

  @ApiPropertyOptional({ description: 'Course information if included' })
  course?: {
    id: string;
    title_en: string;
    title_fr: string | null;
    slug: string;
  };
}

export class LessonListResponseDto {
  @ApiProperty({ type: [LessonResponseDto] })
  data: LessonResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}

export class ReorderSlidesDto {
  @ApiProperty({
    description: 'Array of slide IDs in the new order',
    type: [String],
    example: ['uuid1', 'uuid2', 'uuid3']
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one slide ID is required' })
  @ArrayMaxSize(100, { message: 'Cannot reorder more than 100 slides at once' })
  @IsUUID('4', { each: true, message: 'Each slide ID must be a valid UUID' })
  slide_ids: string[];
}
