import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SlideLayout } from '@prisma/client';

import { ContentBlockResponseDto } from '../content-block/content-block-response.dto';

export class SlideResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  lesson_id: string;

  @ApiProperty({ enum: SlideLayout })
  layout: SlideLayout;

  @ApiProperty()
  slide_order: number;

  @ApiPropertyOptional()
  title_en?: string;

  @ApiPropertyOptional()
  title_fr?: string;

  @ApiPropertyOptional()
  notes_en?: string;

  @ApiPropertyOptional()
  notes_fr?: string;

  @ApiProperty({ type: [ContentBlockResponseDto] })
  content_blocks: ContentBlockResponseDto[];

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
