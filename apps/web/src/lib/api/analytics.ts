import apiClient from './client';

export interface LessonAnalytics {
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

export interface PopularLessonsResponse {
  lessons: LessonAnalytics[];
  total: number;
}

export interface EngagementMetrics {
  total_students: number;
  active_students_last_7_days: number;
  active_students_last_30_days: number;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  dropped_enrollments: number;
  average_course_completion_rate: number;
  total_lessons_completed: number;
  total_time_spent_seconds: number;
  average_session_time_seconds: number;
}

export interface CourseAnalytics {
  course_id: string;
  course_title: string;
  total_enrollments: number;
  active_enrollments: number;
  completed_enrollments: number;
  average_progress_percentage: number;
  lessons: Array<{
    lesson_id: string;
    lesson_title: string;
    total_views: number;
    total_completions: number;
    completion_rate: number;
    average_time_spent: number;
  }>;
}

/**
 * Analytics API endpoints
 */
export const analyticsApi = {
  /**
   * Get most popular lessons
   */
  getPopularLessons: async (limit = 10): Promise<PopularLessonsResponse> => {
    const response = await apiClient.get<PopularLessonsResponse>('/analytics/lessons/popular', {
      params: { limit },
    });
    return response.data;
  },

  /**
   * Get platform engagement metrics
   */
  getEngagementMetrics: async (): Promise<EngagementMetrics> => {
    const response = await apiClient.get<EngagementMetrics>('/analytics/engagement');
    return response.data;
  },

  /**
   * Get analytics for a specific course
   */
  getCourseAnalytics: async (courseId: string): Promise<CourseAnalytics> => {
    const response = await apiClient.get<CourseAnalytics>(`/analytics/courses/${courseId}`);
    return response.data;
  },
};

export default analyticsApi;
