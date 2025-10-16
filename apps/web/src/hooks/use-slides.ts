/**
 * React Query hooks for Slides and Content Blocks
 * Provides caching, optimistic updates, and automatic refetching
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { apiClient, ApiError } from '../lib/api-client';
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

import { toast } from './use-toast';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const slidesKeys = {
  all: ['slides'] as const,
  lists: () => [...slidesKeys.all, 'list'] as const,
  list: (lessonId: string) => [...slidesKeys.lists(), lessonId] as const,
  details: () => [...slidesKeys.all, 'detail'] as const,
  detail: (id: string) => [...slidesKeys.details(), id] as const,
  blocks: (slideId: string) => [...slidesKeys.detail(slideId), 'blocks'] as const,
  block: (slideId: string, blockId: string) => [...slidesKeys.blocks(slideId), blockId] as const,
};

// ============================================================================
// Slides Queries
// ============================================================================

/**
 * Fetch all slides for a lesson
 */
export function useSlides(lessonId: string) {
  return useQuery({
    queryKey: slidesKeys.list(lessonId),
    queryFn: () => apiClient.getSlides(lessonId),
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

/**
 * Fetch a single slide
 */
export function useSlide(slideId: string | null) {
  return useQuery({
    queryKey: slidesKeys.detail(slideId || ''),
    queryFn: () => apiClient.getSlide(slideId!),
    enabled: !!slideId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// ============================================================================
// Slides Mutations
// ============================================================================

/**
 * Create a new slide
 */
export function useCreateSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSlideRequest) => apiClient.createSlide(data),

    onMutate: async (newSlide) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: slidesKeys.list(lessonId) });

      // Snapshot previous value
      const previousSlides = queryClient.getQueryData<Slide[]>(slidesKeys.list(lessonId));

      // Optimistically update
      if (previousSlides) {
        const tempId = `temp-${Date.now()}`;
        const optimisticSlide: Slide = {
          id: tempId,
          lesson_id: lessonId,
          layout: newSlide.layout,
          slide_order: previousSlides.length,
          title_en: newSlide.title_en,
          title_fr: newSlide.title_fr,
          content_blocks: [],
          created_at: new Date(),
          updated_at: new Date(),
        };

        queryClient.setQueryData<Slide[]>(slidesKeys.list(lessonId), [
          ...previousSlides,
          optimisticSlide,
        ]);
      }

      return { previousSlides };
    },

    onError: (err, _newSlide, context) => {
      // Rollback on error
      if (context?.previousSlides) {
        queryClient.setQueryData(slidesKeys.list(lessonId), context.previousSlides);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to create slide',
        variant: 'destructive',
      });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Slide created successfully',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Update a slide
 */
export function useUpdateSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ slideId, data }: { slideId: string; data: UpdateSlideRequest }) =>
      apiClient.updateSlide(slideId, data),

    onMutate: async ({ slideId, data }) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.list(lessonId) });
      await queryClient.cancelQueries({ queryKey: slidesKeys.detail(slideId) });

      const previousSlides = queryClient.getQueryData<Slide[]>(slidesKeys.list(lessonId));
      const previousSlide = queryClient.getQueryData<Slide>(slidesKeys.detail(slideId));

      // Optimistically update
      if (previousSlides) {
        queryClient.setQueryData<Slide[]>(
          slidesKeys.list(lessonId),
          previousSlides.map((slide) =>
            slide.id === slideId ? { ...slide, ...data, updated_at: new Date() } : slide,
          ),
        );
      }

      if (previousSlide) {
        queryClient.setQueryData<Slide>(slidesKeys.detail(slideId), {
          ...previousSlide,
          ...data,
          updated_at: new Date(),
        });
      }

      return { previousSlides, previousSlide };
    },

    onError: (err, { slideId }, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(slidesKeys.list(lessonId), context.previousSlides);
      }
      if (context?.previousSlide) {
        queryClient.setQueryData(slidesKeys.detail(slideId), context.previousSlide);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to update slide',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Delete a slide
 */
export function useDeleteSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slideId: string) => apiClient.deleteSlide(slideId),

    onMutate: async (slideId) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.list(lessonId) });

      const previousSlides = queryClient.getQueryData<Slide[]>(slidesKeys.list(lessonId));

      // Optimistically remove
      if (previousSlides) {
        queryClient.setQueryData<Slide[]>(
          slidesKeys.list(lessonId),
          previousSlides.filter((slide) => slide.id !== slideId),
        );
      }

      return { previousSlides };
    },

    onError: (err, _slideId, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(slidesKeys.list(lessonId), context.previousSlides);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to delete slide',
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
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Duplicate a slide
 */
export function useDuplicateSlide(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (slideId: string) => apiClient.duplicateSlide(slideId),

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Slide duplicated successfully',
      });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },

    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to duplicate slide',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reorder slides
 */
export function useReorderSlides(lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderSlidesRequest) => apiClient.reorderSlides(lessonId, data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.list(lessonId) });

      const previousSlides = queryClient.getQueryData<Slide[]>(slidesKeys.list(lessonId));

      // Optimistically reorder
      if (previousSlides) {
        const orderedSlides = [...previousSlides].sort((a, b) => {
          const aOrder = data.slide_orders.find((o) => o.slide_id === a.id)?.order ?? a.slide_order;
          const bOrder = data.slide_orders.find((o) => o.slide_id === b.id)?.order ?? b.slide_order;
          return aOrder - bOrder;
        });

        queryClient.setQueryData<Slide[]>(slidesKeys.list(lessonId), orderedSlides);
      }

      return { previousSlides };
    },

    onError: (err, _data, context) => {
      if (context?.previousSlides) {
        queryClient.setQueryData(slidesKeys.list(lessonId), context.previousSlides);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to reorder slides',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

// ============================================================================
// Content Blocks Mutations
// ============================================================================

/**
 * Create a content block
 */
export function useCreateContentBlock(slideId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateContentBlockRequest) => apiClient.createContentBlock(data),

    onMutate: async (newBlock) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.detail(slideId) });

      const previousSlide = queryClient.getQueryData<Slide>(slidesKeys.detail(slideId));

      // Optimistically add block
      if (previousSlide) {
        const tempId = `temp-${Date.now()}`;
        const optimisticBlock: ContentBlock = {
          id: tempId,
          type: newBlock.type,
          content: newBlock.content,
          order: previousSlide.content_blocks.length,
          metadata: newBlock.metadata,
        };

        queryClient.setQueryData<Slide>(slidesKeys.detail(slideId), {
          ...previousSlide,
          content_blocks: [...previousSlide.content_blocks, optimisticBlock],
        });
      }

      return { previousSlide };
    },

    onError: (err, _newBlock, context) => {
      if (context?.previousSlide) {
        queryClient.setQueryData(slidesKeys.detail(slideId), context.previousSlide);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to create content block',
        variant: 'destructive',
      });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content block added',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.detail(slideId) });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Update a content block
 */
export function useUpdateContentBlock(slideId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ blockId, data }: { blockId: string; data: UpdateContentBlockRequest }) =>
      apiClient.updateContentBlock(blockId, data),

    onMutate: async ({ blockId, data }) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.detail(slideId) });

      const previousSlide = queryClient.getQueryData<Slide>(slidesKeys.detail(slideId));

      // Optimistically update
      if (previousSlide) {
        queryClient.setQueryData<Slide>(slidesKeys.detail(slideId), {
          ...previousSlide,
          content_blocks: previousSlide.content_blocks.map((block) =>
            block.id === blockId ? { ...block, ...data, updated_at: new Date() } : block,
          ),
        });
      }

      return { previousSlide };
    },

    onError: (_err, _params, context) => {
      if (context?.previousSlide) {
        queryClient.setQueryData(slidesKeys.detail(slideId), context.previousSlide);
      }
      // Don't show toast for auto-save updates to avoid spam
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.detail(slideId) });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Delete a content block
 */
export function useDeleteContentBlock(slideId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockId: string) => apiClient.deleteContentBlock(blockId),

    onMutate: async (blockId) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.detail(slideId) });

      const previousSlide = queryClient.getQueryData<Slide>(slidesKeys.detail(slideId));

      // Optimistically remove
      if (previousSlide) {
        queryClient.setQueryData<Slide>(slidesKeys.detail(slideId), {
          ...previousSlide,
          content_blocks: previousSlide.content_blocks.filter((block) => block.id !== blockId),
        });
      }

      return { previousSlide };
    },

    onError: (err, _blockId, context) => {
      if (context?.previousSlide) {
        queryClient.setQueryData(slidesKeys.detail(slideId), context.previousSlide);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to delete content block',
        variant: 'destructive',
      });
    },

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content block deleted',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.detail(slideId) });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}

/**
 * Duplicate a content block
 */
export function useDuplicateContentBlock(slideId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (blockId: string) => apiClient.duplicateContentBlock(blockId),

    onSuccess: () => {
      toast({
        title: 'Success',
        description: 'Content block duplicated',
      });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.detail(slideId) });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },

    onError: (err) => {
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to duplicate content block',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Reorder content blocks
 */
export function useReorderContentBlocks(slideId: string, lessonId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ReorderContentBlocksRequest) => apiClient.reorderContentBlocks(slideId, data),

    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey: slidesKeys.detail(slideId) });

      const previousSlide = queryClient.getQueryData<Slide>(slidesKeys.detail(slideId));

      // Optimistically reorder
      if (previousSlide) {
        const orderedBlocks = [...previousSlide.content_blocks].sort((a, b) => {
          const aOrder = data.block_orders.find((o) => o.block_id === a.id)?.order ?? a.order;
          const bOrder = data.block_orders.find((o) => o.block_id === b.id)?.order ?? b.order;
          return aOrder - bOrder;
        });

        queryClient.setQueryData<Slide>(slidesKeys.detail(slideId), {
          ...previousSlide,
          content_blocks: orderedBlocks,
        });
      }

      return { previousSlide };
    },

    onError: (err, _data, context) => {
      if (context?.previousSlide) {
        queryClient.setQueryData(slidesKeys.detail(slideId), context.previousSlide);
      }
      toast({
        title: 'Error',
        description: err instanceof ApiError ? err.message : 'Failed to reorder content blocks',
        variant: 'destructive',
      });
    },

    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: slidesKeys.detail(slideId) });
      void queryClient.invalidateQueries({ queryKey: slidesKeys.list(lessonId) });
    },
  });
}
