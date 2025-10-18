import { LessonProgressStatus } from '@prisma/client';

export class LessonProgressResponseDto {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  current_slide_index: number;
  total_slides_viewed: number;
  time_spent_seconds: number;
  started_at: Date;
  completed_at: Date | null;
  updated_at: Date;

  // Optional lesson details
  lesson?: {
    id: string;
    slug: string;
    title_en: string;
    title_fr: string | null;
    estimated_minutes: number | null;
    lesson_order: number;
  };

  // Calculated fields
  completion_percentage?: number;
}
