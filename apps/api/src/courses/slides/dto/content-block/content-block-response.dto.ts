import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ContentBlockType } from '@prisma/client';

export class ContentBlockResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slide_id: string;

  @ApiProperty({ enum: ContentBlockType })
  type: ContentBlockType;

  @ApiProperty({ description: 'Block content (JSON string)' })
  content: string;

  @ApiPropertyOptional({ description: 'Block metadata (JSON)' })
  metadata?: Record<string, unknown>;

  @ApiProperty()
  order: number;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;
}
