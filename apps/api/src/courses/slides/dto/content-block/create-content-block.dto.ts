import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '@prisma/client';
import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsObject } from 'class-validator';

export class CreateContentBlockDto {
  @ApiProperty({ description: 'Slide ID this block belongs to' })
  @IsString()
  @IsNotEmpty()
  slide_id: string;

  @ApiProperty({
    description: 'Content block type',
    enum: ContentBlockType,
  })
  @IsEnum(ContentBlockType)
  type: ContentBlockType;

  @ApiProperty({
    description: 'Block content (JSON structure varies by type)',
    example: { html: '<p>Content</p>' },
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'Block metadata (JSON structure varies by type)',
    example: { level: 2, alignment: 'left' },
  })
  @IsOptional()
  @IsObject()
  metadata?: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Block order (auto-calculated if omitted)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}
