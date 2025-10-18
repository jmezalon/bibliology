import apiClient from './client';

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  current_slide_index: number;
  total_slides_viewed: number;
  time_spent_seconds: number;
  started_at: string;
  completed_at: string | null;
  updated_at: string;
  lesson?: {
    id: string;
    slug: string;
    title_en: string;
    title_fr: string | null;
    estimated_minutes: number | null;
    lesson_order: number;
  };
  completion_percentage?: number;
}

export interface CourseProgress {
  course_id: string;
  total_lessons: number;
  lessons_completed: number;
  lessons_in_progress: number;
  lessons_not_started: number;
  overall_completion_percentage: number;
  total_time_spent_seconds: number;
  estimated_time_remaining_seconds: number | null;
  last_accessed_at: string;
  lesson_progress: Array<{
    lesson_id: string;
    lesson_title_en: string;
    lesson_title_fr: string | null;
    lesson_order: number;
    status: string;
    completion_percentage: number;
    time_spent_seconds: number;
    started_at: string | null;
    completed_at: string | null;
  }>;
}

export interface UpdateProgressRequest {
  status?: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';
  current_slide_index?: number;
  total_slides_viewed?: number;
  time_spent_seconds?: number;
}

export interface MarkSlideViewedRequest {
  slide_index: number;
  time_spent_seconds: number;
}

/**
 * Progress API endpoints
 */
export const progressApi = {
  /**
   * Get lesson progress for current student
   */
  getLessonProgress: async (lessonId: string): Promise<LessonProgress> => {
    const response = await apiClient.get<LessonProgress>(`/lessons/${lessonId}/progress`);
    return response.data;
  },

  /**
   * Update lesson progress
   */
  updateLessonProgress: async (
    lessonId: string,
    data: UpdateProgressRequest,
  ): Promise<LessonProgress> => {
    const response = await apiClient.post<LessonProgress>(`/lessons/${lessonId}/progress`, data);
    return response.data;
  },

  /**
   * Mark a slide as viewed
   */
  markSlideViewed: async (
    lessonId: string,
    data: MarkSlideViewedRequest,
  ): Promise<LessonProgress> => {
    const response = await apiClient.post<LessonProgress>(`/lessons/${lessonId}/slides/view`, data);
    return response.data;
  },

  /**
   * Get overall course progress
   */
  getCourseProgress: async (courseId: string): Promise<CourseProgress> => {
    const response = await apiClient.get<CourseProgress>(`/courses/${courseId}/progress`);
    return response.data;
  },
};

export default progressApi;
