import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsArray,
  Min,
  MaxLength,
  Matches,
  IsUrl,
} from 'class-validator';

export class CreateCourseDto {
  @ApiProperty({
    description: 'Unique URL-friendly slug for the course (lowercase, alphanumeric, hyphens only)',
    example: 'introduction-to-theology',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Slug must be lowercase alphanumeric with hyphens (no spaces or special characters)',
  })
  slug: string;

  @ApiProperty({ description: 'Course title in English' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title_en: string;

  @ApiPropertyOptional({ description: 'Course title in French' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title_fr?: string;

  @ApiProperty({ description: 'Course description in English' })
  @IsString()
  @IsNotEmpty()
  description_en: string;

  @ApiPropertyOptional({ description: 'Course description in French' })
  @IsString()
  @IsOptional()
  description_fr?: string;

  @ApiPropertyOptional({ description: 'URL to course thumbnail image' })
  @IsOptional()
  @IsUrl({}, { message: 'Thumbnail URL must be a valid URL' })
  thumbnail_url?: string;

  @ApiPropertyOptional({ description: 'URL to course cover image' })
  @IsOptional()
  @IsUrl({}, { message: 'Cover image URL must be a valid URL' })
  cover_image_url?: string;

  @ApiPropertyOptional({ description: 'Course category', example: 'Biblical Studies' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({
    description: 'Course tags for searchability',
    example: ['Pneumatology', 'Holy Spirit'],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ description: 'Estimated hours to complete course' })
  @IsInt()
  @IsOptional()
  @Min(1)
  estimated_hours?: number;

  @ApiPropertyOptional({ description: 'Course difficulty level', example: 'Beginner' })
  @IsString()
  @IsOptional()
  @IsEnum(['Beginner', 'Intermediate', 'Advanced'])
  difficulty?: string;

  @ApiPropertyOptional({
    description: 'Course status',
    enum: LessonStatus,
    default: LessonStatus.DRAFT,
  })
  @IsEnum(LessonStatus)
  @IsOptional()
  status?: LessonStatus;
}
