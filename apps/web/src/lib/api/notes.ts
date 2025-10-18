import apiClient from './client';

export interface StudentNote {
  id: string;
  student_id: string;
  lesson_id: string;
  slide_index: number;
  note_text: string;
  created_at: string;
  updated_at: string;
}

export interface CreateNoteRequest {
  lesson_id: string;
  slide_index: number;
  note_text: string;
}

export interface UpdateNoteRequest {
  note_text: string;
}

/**
 * Notes API endpoints
 */
export const notesApi = {
  /**
   * Get all notes for a lesson
   */
  getLessonNotes: async (lessonId: string): Promise<StudentNote[]> => {
    const response = await apiClient.get<StudentNote[]>(
      `/lessons/${lessonId}/notes`,
    );
    return response.data;
  },

  /**
   * Create a new note
   */
  create: async (data: CreateNoteRequest): Promise<StudentNote> => {
    const response = await apiClient.post<StudentNote>('/notes', data);
    return response.data;
  },

  /**
   * Get a note by ID
   */
  getById: async (noteId: string): Promise<StudentNote> => {
    const response = await apiClient.get<StudentNote>(`/notes/${noteId}`);
    return response.data;
  },

  /**
   * Update a note
   */
  update: async (
    noteId: string,
    data: UpdateNoteRequest,
  ): Promise<StudentNote> => {
    const response = await apiClient.put<StudentNote>(
      `/notes/${noteId}`,
      data,
    );
    return response.data;
  },

  /**
   * Delete a note
   */
  delete: async (noteId: string): Promise<void> => {
    await apiClient.delete(`/notes/${noteId}`);
  },
};

export default notesApi;
