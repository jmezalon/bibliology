import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlideLayout } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, MaxLength } from 'class-validator';

export class CreateSlideDto {
  @ApiProperty({ description: 'Lesson ID this slide belongs to' })
  @IsString()
  @IsNotEmpty()
  lesson_id: string;

  @ApiProperty({
    description: 'Slide layout type',
    enum: SlideLayout,
    default: SlideLayout.CONTENT,
  })
  @IsEnum(SlideLayout)
  @IsOptional()
  layout?: SlideLayout;

  @ApiPropertyOptional({ description: 'Slide title in English', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title_en?: string;

  @ApiPropertyOptional({ description: 'Slide title in French', maxLength: 200 })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  title_fr?: string;

  @ApiPropertyOptional({ description: 'Teacher notes in English' })
  @IsString()
  @IsOptional()
  notes_en?: string;

  @ApiPropertyOptional({ description: 'Teacher notes in French' })
  @IsString()
  @IsOptional()
  notes_fr?: string;

  @ApiPropertyOptional({ description: 'Slide order (auto-calculated if omitted)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  slide_order?: number;
}
