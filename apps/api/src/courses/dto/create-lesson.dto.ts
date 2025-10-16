import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsBoolean,
  Min,
  MaxLength,
  Matches,
} from 'class-validator';

export class CreateLessonDto {
  @ApiProperty({ description: 'Course ID this lesson belongs to' })
  @IsString()
  @IsNotEmpty()
  course_id: string;

  @ApiProperty({
    description: 'Unique URL-friendly slug for the lesson (lowercase, alphanumeric, hyphens only)',
    example: 'lesson-1-introduction',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens (no spaces or special characters)',
  })
  slug: string;

  @ApiProperty({ description: 'Lesson title in English' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title_en: string;

  @ApiPropertyOptional({ description: 'Lesson title in French' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title_fr?: string;

  @ApiPropertyOptional({ description: 'Lesson description in English' })
  @IsString()
  @IsOptional()
  description_en?: string;

  @ApiPropertyOptional({ description: 'Lesson description in French' })
  @IsString()
  @IsOptional()
  description_fr?: string;

  @ApiProperty({ description: 'Order of lesson in the course (1-based)' })
  @IsInt()
  @Min(1)
  lesson_order: number;

  @ApiPropertyOptional({ description: 'Estimated minutes to complete lesson' })
  @IsInt()
  @IsOptional()
  @Min(1)
  estimated_minutes?: number;

  @ApiPropertyOptional({
    description: 'Lesson status',
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;

  @ApiPropertyOptional({ description: 'Whether this lesson was imported from PowerPoint' })
  @IsBoolean()
  @IsOptional()
  imported_from_pptx?: boolean;

  @ApiPropertyOptional({ description: 'Original PowerPoint filename' })
  @IsString()
  @IsOptional()
  original_filename?: string;
}
