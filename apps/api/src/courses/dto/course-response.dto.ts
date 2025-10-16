import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LessonStatus } from '@prisma/client';

export class CourseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  slug: string;

  @ApiProperty()
  teacher_id: string;

  @ApiProperty()
  title_en: string;

  @ApiPropertyOptional()
  title_fr?: string | null;

  @ApiProperty()
  description_en: string;

  @ApiPropertyOptional()
  description_fr?: string | null;

  @ApiPropertyOptional()
  thumbnail_url?: string | null;

  @ApiPropertyOptional()
  cover_image_url?: string | null;

  @ApiProperty({ enum: LessonStatus })
  status: LessonStatus;

  @ApiPropertyOptional()
  category?: string | null;

  @ApiProperty({ type: [String] })
  tags: string[];

  @ApiPropertyOptional()
  estimated_hours?: number | null;

  @ApiPropertyOptional()
  difficulty?: string | null;

  @ApiProperty()
  created_at: Date;

  @ApiProperty()
  updated_at: Date;

  @ApiPropertyOptional()
  published_at?: Date | null;

  @ApiPropertyOptional({ description: 'Teacher information if included' })
  teacher?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };

  @ApiPropertyOptional({ description: 'Number of lessons in the course' })
  lessonCount?: number;

  @ApiPropertyOptional({ description: 'Number of students enrolled' })
  enrollmentCount?: number;
}

export class CourseListResponseDto {
  @ApiProperty({ type: [CourseResponseDto] })
  data: CourseResponseDto[];

  @ApiProperty()
  total: number;

  @ApiProperty()
  page: number;

  @ApiProperty()
  limit: number;

  @ApiProperty()
  totalPages: number;
}
