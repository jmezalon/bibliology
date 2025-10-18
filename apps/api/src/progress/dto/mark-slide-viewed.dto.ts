import { IsInt, IsNotEmpty, Min } from 'class-validator';

export class MarkSlideViewedDto {
  @IsInt()
  @IsNotEmpty()
  @Min(0)
  slide_index: number;

  @IsInt()
  @IsNotEmpty()
  @Min(0)
  time_spent_seconds: number;
}
