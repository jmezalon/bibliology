/**
 * Lesson Builder Types
 * Extended types for the lesson builder interface
 */

export enum SlideLayoutType {
  TITLE = 'TITLE',
  CONTENT = 'CONTENT',
  TWO_COLUMN = 'TWO_COLUMN',
  IMAGE_FOCUS = 'IMAGE_FOCUS',
  QUIZ = 'QUIZ',
  BLANK = 'BLANK',
}

export enum ContentBlockType {
  TEXT = 'TEXT',
  HEADING = 'HEADING',
  IMAGE = 'IMAGE',
  VERSE = 'VERSE',
  VOCABULARY = 'VOCABULARY',
  LIST = 'LIST',
  CALLOUT = 'CALLOUT',
  DIVIDER = 'DIVIDER',
}

export enum TransitionType {
  NONE = 'NONE',
  FADE = 'FADE',
  SLIDE = 'SLIDE',
  ZOOM = 'ZOOM',
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // JSON string for rich content
  order: number;
  metadata?: {
    imageUrl?: string;
    imageAlt?: string;
    verseReference?: string;
    verseTranslation?: string;
    calloutType?: 'info' | 'warning' | 'success' | 'error';
    listStyle?: 'bullet' | 'numbered';
  };
}

export interface Slide {
  id: string;
  lesson_id: string;
  layout: SlideLayoutType;
  title_en?: string;
  title_fr?: string;
  teacher_notes_en?: string;
  teacher_notes_fr?: string;
  background_color?: string;
  background_image_url?: string;
  transition: TransitionType;
  estimated_time_seconds?: number;
  order: number;
  content_blocks: ContentBlock[];
  created_at: Date;
  updated_at: Date;
}

export interface LessonWithSlides {
  id: string;
  course_id: string;
  title_en: string;
  title_fr: string | null;
  description_en: string;
  description_fr: string | null;
  order: number;
  duration_minutes: number;
  is_published: boolean;
  created_at: Date;
  updated_at: Date;
  slides: Slide[];
}

export interface CreateSlideRequest {
  lesson_id: string;
  layout: SlideLayoutType;
  order?: number;
  title_en?: string;
  title_fr?: string;
}

export interface UpdateSlideRequest extends Partial<CreateSlideRequest> {
  teacher_notes_en?: string;
  teacher_notes_fr?: string;
  background_color?: string;
  background_image_url?: string;
  transition?: TransitionType;
  estimated_time_seconds?: number;
}

export interface ReorderSlidesRequest {
  slide_orders: {
    slide_id: string;
    order: number;
  }[];
}

export interface CreateContentBlockRequest {
  slide_id: string;
  type: ContentBlockType;
  content: string;
  order?: number;
  metadata?: ContentBlock['metadata'];
}

export interface UpdateContentBlockRequest extends Partial<CreateContentBlockRequest> {}

// UI State types
export interface LessonBuilderState {
  currentSlideId: string | null;
  selectedContentBlockId: string | null;
  isPreviewMode: boolean;
  isSaving: boolean;
  lastSavedAt: Date | null;
  isDirty: boolean;
}

// Layout templates for quick slide creation
export interface SlideTemplate {
  layout: SlideLayoutType;
  name_en: string;
  name_fr: string;
  description_en: string;
  description_fr: string;
  icon: string; // Lucide icon name
  defaultBlocks: Omit<ContentBlock, 'id' | 'order'>[];
}
