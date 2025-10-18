import apiClient from './client';

export interface Enrollment {
  id: string;
  student_id: string;
  course_id: string;
  status: 'ACTIVE' | 'COMPLETED' | 'DROPPED';
  progress_percentage: number;
  lessons_completed: number;
  total_lessons: number;
  enrolled_at: string;
  last_accessed_at: string;
  completed_at: string | null;
  course?: {
    id: string;
    slug: string;
    title_en: string;
    title_fr: string | null;
    thumbnail_url: string | null;
    status: string;
    estimated_hours: number | null;
    teacher: {
      id: string;
      name: string;
      avatar_url: string | null;
    };
  };
  student?: {
    id: string;
    name: string;
    email: string;
    avatar_url: string | null;
  };
}

/**
 * Enrollments API endpoints
 */
export const enrollmentsApi = {
  /**
   * Enroll in a course
   */
  enroll: async (courseId: string): Promise<Enrollment> => {
    const response = await apiClient.post<Enrollment>(`/enrollments/courses/${courseId}`);
    return response.data;
  },

  /**
   * Get current student's enrollments
   */
  getMyEnrollments: async (status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED'): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>('/enrollments/me', {
      params: status ? { status } : {},
    });
    return response.data;
  },

  /**
   * Get enrollment by ID
   */
  getById: async (id: string): Promise<Enrollment> => {
    const response = await apiClient.get<Enrollment>(`/enrollments/${id}`);
    return response.data;
  },

  /**
   * Unenroll from a course
   */
  unenroll: async (enrollmentId: string): Promise<void> => {
    await apiClient.delete(`/enrollments/${enrollmentId}`);
  },

  /**
   * Get students enrolled in a course (for teachers)
   */
  getCourseStudents: async (courseId: string): Promise<Enrollment[]> => {
    const response = await apiClient.get<Enrollment[]>(`/courses/${courseId}/students`);
    return response.data;
  },
};

export default enrollmentsApi;
