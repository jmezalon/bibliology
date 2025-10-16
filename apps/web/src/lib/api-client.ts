/**
 * Centralized API Client with Runtime Type Validation
 * Provides type-safe methods for all backend API calls
 */

import { z } from 'zod';

import type {
  Slide,
  ContentBlock,
  CreateSlideRequest,
  UpdateSlideRequest,
  CreateContentBlockRequest,
  UpdateContentBlockRequest,
  ReorderSlidesRequest,
  ReorderContentBlocksRequest,
} from '../types/lesson-builder';

// ============================================================================
// Zod Schemas for Runtime Validation
// ============================================================================

const ContentBlockSchema: z.ZodType<ContentBlock> = z.object({
  id: z.string(),
  type: z.string() as z.ZodType<ContentBlock['type']>,
  content: z.string(),
  order: z.number(),
  metadata: z.record(z.unknown()).optional(),
}) as z.ZodType<ContentBlock>;

const SlideSchema: z.ZodType<Slide> = z.object({
  id: z.string(),
  lesson_id: z.string(),
  layout: z.string() as z.ZodType<Slide['layout']>,
  slide_order: z.number(),
  title_en: z.string().optional(),
  title_fr: z.string().optional(),
  notes_en: z.string().optional(),
  notes_fr: z.string().optional(),
  content_blocks: z.array(ContentBlockSchema),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
}) as z.ZodType<Slide>;

// ============================================================================
// Error Classes
// ============================================================================

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public data?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public errors: z.ZodError,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// ============================================================================
// API Client Class
// ============================================================================

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
  }

  /**
   * Get authentication token from storage
   */
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }

  /**
   * Make an authenticated request
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    schema?: z.ZodSchema<T>,
  ): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorMessage = response.statusText;
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const errorData = await response.json();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If JSON parsing fails, use status text
      }
      throw new ApiError(response.status, errorMessage);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const data = await response.json();

    // Validate response if schema provided
    if (schema) {
      try {
        return schema.parse(data);
      } catch (error) {
        if (error instanceof z.ZodError) {
          throw new ValidationError('Response validation failed', error);
        }
        throw error;
      }
    }

    return data as T;
  }

  // ============================================================================
  // Slides API
  // ============================================================================

  /**
   * Get all slides for a lesson
   */
  async getSlides(lessonId: string): Promise<Slide[]> {
    return this.request(`/lessons/${lessonId}/slides`, {}, z.array(SlideSchema));
  }

  /**
   * Get a single slide by ID
   */
  async getSlide(slideId: string): Promise<Slide> {
    return this.request(`/slides/${slideId}`, {}, SlideSchema);
  }

  /**
   * Create a new slide
   */
  async createSlide(data: CreateSlideRequest): Promise<Slide> {
    return this.request(
      `/lessons/${data.lesson_id}/slides`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      SlideSchema,
    );
  }

  /**
   * Update a slide
   */
  async updateSlide(slideId: string, data: UpdateSlideRequest): Promise<Slide> {
    return this.request(
      `/slides/${slideId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      SlideSchema,
    );
  }

  /**
   * Delete a slide
   */
  async deleteSlide(slideId: string): Promise<void> {
    await this.request(`/slides/${slideId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a slide
   */
  async duplicateSlide(slideId: string): Promise<Slide> {
    return this.request(
      `/slides/${slideId}/duplicate`,
      {
        method: 'POST',
      },
      SlideSchema,
    );
  }

  /**
   * Reorder slides within a lesson
   */
  async reorderSlides(lessonId: string, data: ReorderSlidesRequest): Promise<Slide[]> {
    return this.request(
      `/lessons/${lessonId}/slides/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      z.array(SlideSchema),
    );
  }

  /**
   * Move slide to different lesson
   */
  async moveSlide(slideId: string, targetLessonId: string, targetOrder?: number): Promise<Slide> {
    return this.request(
      `/slides/${slideId}/move`,
      {
        method: 'PUT',
        body: JSON.stringify({ target_lesson_id: targetLessonId, target_order: targetOrder }),
      },
      SlideSchema,
    );
  }

  // ============================================================================
  // Content Blocks API
  // ============================================================================

  /**
   * Get all content blocks for a slide
   */
  async getContentBlocks(slideId: string): Promise<ContentBlock[]> {
    return this.request(`/slides/${slideId}/content-blocks`, {}, z.array(ContentBlockSchema));
  }

  /**
   * Get a single content block
   */
  async getContentBlock(blockId: string): Promise<ContentBlock> {
    return this.request(`/content-blocks/${blockId}`, {}, ContentBlockSchema);
  }

  /**
   * Create a new content block
   */
  async createContentBlock(data: CreateContentBlockRequest): Promise<ContentBlock> {
    return this.request(
      `/slides/${data.slide_id}/content-blocks`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      },
      ContentBlockSchema,
    );
  }

  /**
   * Update a content block
   */
  async updateContentBlock(
    blockId: string,
    data: UpdateContentBlockRequest,
  ): Promise<ContentBlock> {
    return this.request(
      `/content-blocks/${blockId}`,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      ContentBlockSchema,
    );
  }

  /**
   * Delete a content block
   */
  async deleteContentBlock(blockId: string): Promise<void> {
    await this.request(`/content-blocks/${blockId}`, {
      method: 'DELETE',
    });
  }

  /**
   * Duplicate a content block
   */
  async duplicateContentBlock(blockId: string): Promise<ContentBlock> {
    return this.request(
      `/content-blocks/${blockId}/duplicate`,
      {
        method: 'POST',
      },
      ContentBlockSchema,
    );
  }

  /**
   * Reorder content blocks within a slide
   */
  async reorderContentBlocks(
    slideId: string,
    data: ReorderContentBlocksRequest,
  ): Promise<ContentBlock[]> {
    return this.request(
      `/slides/${slideId}/content-blocks/reorder`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      z.array(ContentBlockSchema),
    );
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

export const apiClient = new ApiClient();

// Export for testing with custom base URL
export { ApiClient };
