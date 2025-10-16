import { z } from 'zod';

// Enums
export const CourseStatusSchema = z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']);
export const DifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);

// Create course schema
export const createCourseSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens only'),
  teacher_id: z.string().cuid('Invalid teacher ID'),
  title_en: z.string().min(1, 'English title is required').max(200),
  title_fr: z.string().max(200).optional().nullable(),
  description_en: z.string().min(1, 'English description is required'),
  description_fr: z.string().optional().nullable(),
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional().nullable(),
  cover_image_url: z.string().url('Invalid cover image URL').optional().nullable(),
  status: CourseStatusSchema.default('DRAFT'),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).default([]),
  estimated_hours: z.number().int().min(0).max(1000).optional().nullable(),
  difficulty: DifficultySchema.optional().nullable(),
});

// Update course schema
export const updateCourseSchema = z.object({
  slug: z
    .string()
    .min(1)
    .max(100)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase, alphanumeric with hyphens only')
    .optional(),
  title_en: z.string().min(1).max(200).optional(),
  title_fr: z.string().max(200).optional().nullable(),
  description_en: z.string().min(1).optional(),
  description_fr: z.string().optional().nullable(),
  thumbnail_url: z.string().url('Invalid thumbnail URL').optional().nullable(),
  cover_image_url: z.string().url('Invalid cover image URL').optional().nullable(),
  status: CourseStatusSchema.optional(),
  category: z.string().max(100).optional().nullable(),
  tags: z.array(z.string().max(50)).optional(),
  estimated_hours: z.number().int().min(0).max(1000).optional().nullable(),
  difficulty: DifficultySchema.optional().nullable(),
});

// Publish course schema
export const publishCourseSchema = z.object({
  status: z.literal('PUBLISHED'),
});

// Course query params schema
export const courseQuerySchema = z.object({
  status: CourseStatusSchema.optional(),
  category: z.string().optional(),
  difficulty: DifficultySchema.optional(),
  teacher_id: z.string().cuid().optional(),
  search: z.string().optional(),
  tags: z.array(z.string()).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort_by: z.enum(['created_at', 'updated_at', 'title_en', 'difficulty']).default('created_at'),
  sort_order: z.enum(['asc', 'desc']).default('desc'),
});

// Course enrollment schema
export const enrollCourseSchema = z.object({
  course_id: z.string().cuid('Invalid course ID'),
  student_id: z.string().cuid('Invalid student ID'),
});

// Type exports
export type CourseStatus = z.infer<typeof CourseStatusSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type CreateCourse = z.infer<typeof createCourseSchema>;
export type UpdateCourse = z.infer<typeof updateCourseSchema>;
export type PublishCourse = z.infer<typeof publishCourseSchema>;
export type CourseQuery = z.infer<typeof courseQuerySchema>;
export type EnrollCourse = z.infer<typeof enrollCourseSchema>;
