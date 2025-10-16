import type { Course, CreateCourseRequest, UpdateCourseRequest } from '../../types/course';

import apiClient from './client';

export interface CourseListResponse {
  data: Course[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Courses API endpoints
 */
export const coursesApi = {
  /**
   * Create a new course
   */
  create: async (data: CreateCourseRequest): Promise<Course> => {
    const response = await apiClient.post<Course>('/courses', data);
    return response.data;
  },

  /**
   * Get all courses for the authenticated teacher
   */
  getAll: async (page = 1, limit = 10): Promise<CourseListResponse> => {
    const response = await apiClient.get<CourseListResponse>('/courses', {
      params: { page, limit },
    });
    return response.data;
  },

  /**
   * Get a single course by ID
   */
  getById: async (id: string): Promise<Course> => {
    const response = await apiClient.get<Course>(`/courses/${id}`);
    return response.data;
  },

  /**
   * Update a course
   */
  update: async (id: string, data: UpdateCourseRequest): Promise<Course> => {
    const response = await apiClient.put<Course>(`/courses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a course
   */
  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/courses/${id}`);
  },

  /**
   * Publish or unpublish a course
   */
  togglePublish: async (id: string, publish: boolean): Promise<Course> => {
    const response = await apiClient.patch<Course>(`/courses/${id}/publish`, {
      publish,
    });
    return response.data;
  },
};

export default coursesApi;
