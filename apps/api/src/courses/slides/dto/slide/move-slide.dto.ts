import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsInt, Min } from 'class-validator';

export class MoveSlideDto {
  @ApiProperty({ description: 'Target lesson ID to move the slide to' })
  @IsString()
  @IsNotEmpty()
  target_lesson_id: string;

  @ApiPropertyOptional({
    description: 'New order position in target lesson (auto-calculated if omitted)',
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  target_order?: number;
}
