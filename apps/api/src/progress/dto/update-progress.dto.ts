import { LessonProgressStatus } from '@prisma/client';
import { IsInt, IsEnum, IsOptional, Min } from 'class-validator';

export class UpdateProgressDto {
  @IsOptional()
  @IsEnum(LessonProgressStatus)
  status?: LessonProgressStatus;

  @IsOptional()
  @IsInt()
  @Min(0)
  current_slide_index?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  total_slides_viewed?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  time_spent_seconds?: number;
}
