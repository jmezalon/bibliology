import { z } from 'zod';

// Enums
export const LessonStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const SlideLayoutSchema = z.enum(['TITLE', 'CONTENT', 'TWO_COLUMN', 'IMAGE_FOCUS', 'QUIZ', 'BLANK']);
export const ContentBlockTypeSchema = z.enum([
  'HEADING',
  'TEXT',
  'IMAGE',
  'VERSE',
  'VOCABULARY',
  'LIST',
  'CALLOUT',
  'QUIZ',
  'DIVIDER',
]);

// Create lesson schema
export const createLessonSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens only'),
  course_id: z.string().cuid('Invalid course ID'),
  title_en: z.string().min(1, 'English title is required').max(200),
  title_fr: z.string().max(200).optional().nullable(),
  description_en: z.string().optional().nullable(),
  description_fr: z.string().optional().nullable(),
  lesson_order: z.number().int().min(1, 'Lesson order must be at least 1'),
  status: LessonStatusSchema.default('DRAFT'),
  estimated_minutes: z.number().int().min(0).max(500).optional().nullable(),
  imported_from_pptx: z.boolean().default(false),
  original_filename: z.string().max(255).optional().nullable(),
});

// Update lesson schema
export const updateLessonSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens only')
    .optional(),
  title_en: z.string().min(1).max(200).optional(),
  title_fr: z.string().max(200).optional().nullable(),
  description_en: z.string().optional().nullable(),
  description_fr: z.string().optional().nullable(),
  lesson_order: z.number().int().min(1).optional(),
  status: LessonStatusSchema.optional(),
  estimated_minutes: z.number().int().min(0).max(500).optional().nullable(),
});

// Reorder lessons schema
export const reorderLessonsSchema = z.object({
  lessons: z.array(
    z.object({
      id: z.string().cuid(),
      lesson_order: z.number().int().min(1),
    })
  ),
});

// Lesson query params schema
export const lessonQuerySchema = z.object({
  course_id: z.string().cuid().optional(),
  status: LessonStatusSchema.optional(),
  search: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['lesson_order', 'created_at', 'updated_at', 'title_en']).default('lesson_order'),
  sort_order: z.enum(['asc', 'desc']).default('asc'),
});

// Slide schemas
export const createSlideSchema = z.object({
  lesson_id: z.string().cuid('Invalid lesson ID'),
  slide_order: z.number().int().min(1),
  layout: SlideLayoutSchema.default('CONTENT'),
  title_en: z.string().max(200).optional().nullable(),
  title_fr: z.string().max(200).optional().nullable(),
  notes_en: z.string().optional().nullable(),
  notes_fr: z.string().optional().nullable(),
});

export const updateSlideSchema = z.object({
  slide_order: z.number().int().min(1).optional(),
  layout: SlideLayoutSchema.optional(),
  title_en: z.string().max(200).optional().nullable(),
  title_fr: z.string().max(200).optional().nullable(),
  notes_en: z.string().optional().nullable(),
  notes_fr: z.string().optional().nullable(),
});

// Content block schemas
export const createContentBlockSchema = z.object({
  slide_id: z.string().cuid('Invalid slide ID'),
  block_order: z.number().int().min(1),
  block_type: ContentBlockTypeSchema,
  content_en: z.record(z.any()), // JSONB - varies by type
  content_fr: z.record(z.any()).optional().nullable(),
  style_config: z.record(z.any()).optional().nullable(),
});

export const updateContentBlockSchema = z.object({
  block_order: z.number().int().min(1).optional(),
  block_type: ContentBlockTypeSchema.optional(),
  content_en: z.record(z.any()).optional(),
  content_fr: z.record(z.any()).optional().nullable(),
  style_config: z.record(z.any()).optional().nullable(),
});

// Lesson progress schemas
export const updateLessonProgressSchema = z.object({
  enrollment_id: z.string().cuid('Invalid enrollment ID'),
  lesson_id: z.string().cuid('Invalid lesson ID'),
  current_slide_index: z.number().int().min(0).optional(),
  total_slides_viewed: z.number().int().min(0).optional(),
  time_spent_seconds: z.number().int().min(0).optional(),
  status: z.enum(['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED']).optional(),
});

export const completeLessonSchema = z.object({
  enrollment_id: z.string().cuid('Invalid enrollment ID'),
  lesson_id: z.string().cuid('Invalid lesson ID'),
  time_spent_seconds: z.number().int().min(0),
});

// Type exports
export type LessonStatus = z.infer<typeof LessonStatusSchema>;
export type SlideLayout = z.infer<typeof SlideLayoutSchema>;
export type ContentBlockType = z.infer<typeof ContentBlockTypeSchema>;
export type CreateLesson = z.infer<typeof createLessonSchema>;
export type UpdateLesson = z.infer<typeof updateLessonSchema>;
export type ReorderLessons = z.infer<typeof reorderLessonsSchema>;
export type LessonQuery = z.infer<typeof lessonQuerySchema>;
export type CreateSlide = z.infer<typeof createSlideSchema>;
export type UpdateSlide = z.infer<typeof updateSlideSchema>;
export type CreateContentBlock = z.infer<typeof createContentBlockSchema>;
export type UpdateContentBlock = z.infer<typeof updateContentBlockSchema>;
export type UpdateLessonProgress = z.infer<typeof updateLessonProgressSchema>;
export type CompleteLesson = z.infer<typeof completeLessonSchema>;
