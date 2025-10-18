export class LessonAnalyticsDto {
  lesson_id: string;
  lesson_title_en: string;
  lesson_title_fr: string | null;
  course_id: string;
  course_title_en: string;
  total_views: number;
  total_completions: number;
  completion_rate: number;
  average_time_spent_seconds: number;
  average_completion_time_seconds: number | null;
}

export class PopularLessonsResponseDto {
  lessons: LessonAnalyticsDto[];
  total: number;
}
