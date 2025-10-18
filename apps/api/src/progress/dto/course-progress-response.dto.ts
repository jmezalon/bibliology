export class CourseProgressResponseDto {
  course_id: string;
  total_lessons: number;
  lessons_completed: number;
  lessons_in_progress: number;
  lessons_not_started: number;
  overall_completion_percentage: number;
  total_time_spent_seconds: number;
  estimated_time_remaining_seconds: number | null;
  last_accessed_at: Date;

  lesson_progress: Array<{
    lesson_id: string;
    lesson_title_en: string;
    lesson_title_fr: string | null;
    lesson_order: number;
    status: string;
    completion_percentage: number;
    time_spent_seconds: number;
    started_at: Date | null;
    completed_at: Date | null;
  }>;
}
