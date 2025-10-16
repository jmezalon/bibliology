// Lesson-related types for Bibliology LMS

export enum LessonStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

export enum SlideLayout {
  TITLE = 'TITLE',
  CONTENT = 'CONTENT',
  TWO_COLUMN = 'TWO_COLUMN',
  IMAGE_FOCUS = 'IMAGE_FOCUS',
  QUIZ = 'QUIZ',
  BLANK = 'BLANK',
}

export enum ContentBlockType {
  HEADING = 'HEADING',
  TEXT = 'TEXT',
  IMAGE = 'IMAGE',
  VERSE = 'VERSE',
  VOCABULARY = 'VOCABULARY',
  LIST = 'LIST',
  CALLOUT = 'CALLOUT',
  QUIZ = 'QUIZ',
  DIVIDER = 'DIVIDER',
}

export interface Lesson {
  id: string;
  slug: string;
  course_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  lesson_order: number;
  status: LessonStatus;
  estimated_minutes: number | null;
  imported_from_pptx: boolean;
  original_filename: string | null;
  import_date: Date | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
}

export interface LessonDto {
  id: string;
  slug: string;
  course_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string | null;
  description_fr: string | null;
  lesson_order: number;
  status: LessonStatus;
  estimated_minutes: number | null;
  imported_from_pptx: boolean;
  original_filename: string | null;
  import_date: Date | null;
  created_at: Date;
  updated_at: Date;
  published_at: Date | null;
  slide_count?: number;
  quiz_count?: number;
}

export interface CreateLessonInput {
  slug: string;
  course_id: string;
  title_en: string;
  title_fr?: string;
  description_en?: string;
  description_fr?: string;
  lesson_order: number;
  estimated_minutes?: number;
  imported_from_pptx?: boolean;
  original_filename?: string;
}

export interface UpdateLessonInput {
  slug?: string;
  title_en?: string;
  title_fr?: string;
  description_en?: string;
  description_fr?: string;
  lesson_order?: number;
  status?: LessonStatus;
  estimated_minutes?: number;
}

export interface Slide {
  id: string;
  lesson_id: string;
  slide_order: number;
  layout: SlideLayout;
  title_en: string | null;
  title_fr: string | null;
  notes_en: string | null;
  notes_fr: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface SlideDto {
  id: string;
  lesson_id: string;
  slide_order: number;
  layout: SlideLayout;
  title_en: string | null;
  title_fr: string | null;
  notes_en: string | null;
  notes_fr: string | null;
  created_at: Date;
  updated_at: Date;
  content_blocks?: ContentBlock[];
}

export interface CreateSlideInput {
  lesson_id: string;
  slide_order: number;
  layout: SlideLayout;
  title_en?: string;
  title_fr?: string;
  notes_en?: string;
  notes_fr?: string;
}

export interface UpdateSlideInput {
  slide_order?: number;
  layout?: SlideLayout;
  title_en?: string;
  title_fr?: string;
  notes_en?: string;
  notes_fr?: string;
}

export interface ContentBlock {
  id: string;
  slide_id: string;
  block_order: number;
  block_type: ContentBlockType;
  content_en: Record<string, any>; // JSON
  content_fr: Record<string, any> | null; // JSON
  style_config: Record<string, any> | null; // JSON
  created_at: Date;
  updated_at: Date;
}

export interface CreateContentBlockInput {
  slide_id: string;
  block_order: number;
  block_type: ContentBlockType;
  content_en: Record<string, any>;
  content_fr?: Record<string, any>;
  style_config?: Record<string, any>;
}

export interface UpdateContentBlockInput {
  block_order?: number;
  block_type?: ContentBlockType;
  content_en?: Record<string, any>;
  content_fr?: Record<string, any>;
  style_config?: Record<string, any>;
}

export enum LessonProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  current_slide_index: number;
  total_slides_viewed: number;
  time_spent_seconds: number;
  started_at: Date;
  completed_at: Date | null;
  updated_at: Date;
}

export interface LessonProgressDto {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  status: LessonProgressStatus;
  current_slide_index: number;
  total_slides_viewed: number;
  time_spent_seconds: number;
  started_at: Date;
  completed_at: Date | null;
  updated_at: Date;
  lesson?: LessonDto;
}
