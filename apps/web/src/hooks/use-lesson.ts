/**
 * React Query hooks for lesson operations
 */
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '../lib/api/client';
import type { UpdateLessonRequest } from '../types/course';
import type {
  LessonWithSlides,
  CreateSlideRequest,
  UpdateSlideRequest,
  ReorderSlidesRequest,
} from '../types/lesson-builder';

import { toast } from './use-toast';

/**
 * Fetch lesson with all slides and content blocks
 */
export function useLesson(lessonId: string | undefined) {
  return useQuery<LessonWithSlides>({
    queryKey: ['lessons', lessonId],
    queryFn: async (): Promise<LessonWithSlides> => {
      if (!lessonId) throw new Error('Lesson ID is required');
      const response = await apiClient.get<LessonWithSlides>(`/lessons/${lessonId}`);
      return response.data;
    },
    enabled: !!lessonId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Update lesson metadata (title, description, etc.)
 */
export function useUpdateLesson(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateLessonRequest): Promise<LessonWithSlides> => {
      const response = await apiClient.put<LessonWithSlides>(`/lessons/${lessonId}`, data);
      return response.data;
    },
    onMutate: async (newData) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['lessons', lessonId] });

      // Snapshot previous value
      const previousLesson = queryClient.getQueryData<LessonWithSlides>(['lessons', lessonId]);

      // Optimistically update
      if (previousLesson) {
        queryClient.setQueryData<LessonWithSlides>(['lessons', lessonId], {
          ...previousLesson,
          ...newData,
          updated_at: new Date(),
        });
      }

      return { previousLesson };
    },
    onError: (_err, _newData, context) => {
      // Rollback on error
      if (context?.previousLesson) {
        queryClient.setQueryData(['lessons', lessonId], context.previousLesson);
      }
      toast({
        title: 'Error',
        description: 'Failed to update lesson. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Lesson updated successfully',
      });
    },
    onSettled: () => {
      // Refetch to ensure consistency
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
    },
  });
}

/**
 * Create a new slide
 */
export function useCreateSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateSlideRequest): Promise<{ id: string }> => {
      const response = await apiClient.post<{ id: string }>(`/lessons/${lessonId}/slides`, data);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
      toast({
        title: 'Success',
        description: 'Slide created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create slide. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Update an existing slide
 */
export function useUpdateSlide(lessonId: string, slideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateSlideRequest): Promise<{ id: string }> => {
      const response = await apiClient.patch<{ id: string }>(`/slides/${slideId}`, data);
      return response.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['lessons', lessonId] });

      const previousLesson = queryClient.getQueryData<LessonWithSlides>(['lessons', lessonId]);

      if (previousLesson) {
        queryClient.setQueryData<LessonWithSlides>(['lessons', lessonId], {
          ...previousLesson,
          slides: previousLesson.slides.map((slide) =>
            slide.id === slideId ? { ...slide, ...newData, updated_at: new Date() } : slide,
          ),
        });
      }

      return { previousLesson };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(['lessons', lessonId], context.previousLesson);
      }
      toast({
        title: 'Error',
        description: 'Failed to update slide. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
    },
  });
}

/**
 * Delete a slide
 */
export function useDeleteSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slideId: string) => {
      await apiClient.delete(`/slides/${slideId}`);
      return slideId;
    },
    onMutate: async (slideId) => {
      await queryClient.cancelQueries({ queryKey: ['lessons', lessonId] });

      const previousLesson = queryClient.getQueryData<LessonWithSlides>(['lessons', lessonId]);

      if (previousLesson) {
        queryClient.setQueryData<LessonWithSlides>(['lessons', lessonId], {
          ...previousLesson,
          slides: previousLesson.slides.filter((slide) => slide.id !== slideId),
        });
      }

      return { previousLesson };
    },
    onError: (_err, _slideId, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(['lessons', lessonId], context.previousLesson);
      }
      toast({
        title: 'Error',
        description: 'Failed to delete slide. Please try again.',
        variant: 'destructive',
      });
    },
    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Slide deleted successfully',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
    },
  });
}

/**
 * Duplicate a slide
 */
export function useDuplicateSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (slideId: string): Promise<{ id: string }> => {
      const response = await apiClient.post<{ id: string }>(`/slides/${slideId}/duplicate`);
      return response.data;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
      toast({
        title: 'Success',
        description: 'Slide duplicated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to duplicate slide. Please try again.',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reorder slides with drag and drop
 */
export function useReorderSlides(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: ReorderSlidesRequest): Promise<{ success: boolean }> => {
      const response = await apiClient.put<{ success: boolean }>(
        `/lessons/${lessonId}/slides/reorder`,
        data,
      );
      return response.data;
    },
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: ['lessons', lessonId] });

      const previousLesson = queryClient.getQueryData<LessonWithSlides>(['lessons', lessonId]);

      if (previousLesson) {
        // Create a map of new orders
        const orderMap = new Map(newData.slide_orders.map((item) => [item.slide_id, item.order]));

        // Update slides with new order
        const updatedSlides = previousLesson.slides
          .map((slide) => ({
            ...slide,
            slide_order: orderMap.get(slide.id) ?? slide.slide_order,
          }))
          .sort((a, b) => a.slide_order - b.slide_order);

        queryClient.setQueryData<LessonWithSlides>(['lessons', lessonId], {
          ...previousLesson,
          slides: updatedSlides,
        });
      }

      return { previousLesson };
    },
    onError: (_err, _newData, context) => {
      if (context?.previousLesson) {
        queryClient.setQueryData(['lessons', lessonId], context.previousLesson);
      }
      toast({
        title: 'Error',
        description: 'Failed to reorder slides. Please try again.',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['lessons', lessonId] });
    },
  });
}
