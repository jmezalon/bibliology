import type { PaginationParams } from '../../types/api';
import type { User, UpdateUserRequest } from '../../types/auth';

import apiClient from './client';

export interface UsersListResponse {
  users: User[];
  total: number;
}

export interface UserStatsResponse {
  totalUsers: number;
  totalStudents: number;
  totalTeachers: number;
  totalAdmins: number;
}

/**
 * Users API endpoints
 */
export const usersApi = {
  /**
   * Get all users (Admin only)
   */
  getAll: async (params?: PaginationParams & { role?: string }): Promise<UsersListResponse> => {
    const response = await apiClient.get<UsersListResponse>('/users', { params });
    return response.data;
  },

  /**
   * Get user by ID
   */
  getById: async (id: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${id}`);
    return response.data;
  },

  /**
   * Update user
   */
  update: async (id: string, data: UpdateUserRequest): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user (Admin only)
   */
  delete: async (id: string): Promise<{ message: string }> => {
    const response = await apiClient.delete<{ message: string }>(`/users/${id}`);
    return response.data;
  },

  /**
   * Get user statistics (Admin only)
   */
  getStats: async (): Promise<UserStatsResponse> => {
    const response = await apiClient.get<UserStatsResponse>('/users/stats');
    return response.data;
  },
};

export default usersApi;
