import type {
  Lesson,
  CreateLessonRequest,
  UpdateLessonRequest,
} from '../../types/course';

import apiClient from './client';

export interface LessonListResponse {
  data: Lesson[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ReorderSlidesRequest {
  slideIds: string[];
}

/**
 * Lessons API endpoints
 */
export const lessonsApi = {
  /**
   * Create a new lesson
   */
  create: async (data: CreateLessonRequest): Promise<Lesson> => {
    const response = await apiClient.post<Lesson>('/lessons', data);
    return response.data;
  },

  /**
   * Get all lessons for a course
   */
  getAllForCourse: async (
    courseId: string,
    page = 1,
    limit = 10,
  ): Promise<LessonListResponse> => {
    const response = await apiClient.get<LessonListResponse>(
      `/courses/${courseId}/lessons`,
      {
        params: { page, limit },
      },
    );
    return response.data;
  },

  /**
   * Get a single lesson by ID
   */
  getById: async (id: string): Promise<Lesson> => {
    const response = await apiClient.get<Lesson>(`/lessons/${id}`);
    return response.data;
  },

  /**
   * Update a lesson
   */
  update: async (id: string, data: UpdateLessonRequest): Promise<Lesson> => {
    const response = await apiClient.put<Lesson>(`/lessons/${id}`, data);
    return response.data;
  },

  /**
   * Delete a lesson
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/lessons/${id}`);
  },

  /**
   * Reorder slides within a lesson
   */
  reorderSlides: async (
    lessonId: string,
    slideIds: string[],
  ): Promise<Lesson> => {
    const response = await apiClient.patch<Lesson>(
      `/lessons/${lessonId}/reorder`,
      { slideIds },
    );
    return response.data;
  },
};

export default lessonsApi;
