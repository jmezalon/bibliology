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

// Extended metadata interfaces for each block type
export interface HeadingBlockMetadata {
  level?: 1 | 2 | 3;
  alignment?: 'left' | 'center' | 'right';
}

export interface ImageBlockMetadata {
  imageUrl?: string;
  imageAlt?: string;
  caption?: string;
}

export interface VerseBlockMetadata {
  verseReference?: string;
  translation?: 'KJV' | 'NIV' | 'ESV' | 'NKJV' | 'LSG' | 'NBS' | 'BDS';
}

export interface VocabularyBlockMetadata {
  term_en?: string;
  term_fr?: string;
  partOfSpeech?:
    | 'noun'
    | 'verb'
    | 'adjective'
    | 'adverb'
    | 'pronoun'
    | 'preposition'
    | 'conjunction'
    | 'interjection'
    | 'other';
  pronunciation?: string;
}

export interface ListBlockMetadata {
  listStyle?: 'bullet' | 'numbered';
  items?: string[];
}

export interface CalloutBlockMetadata {
  calloutType?: 'info' | 'warning' | 'success' | 'error';
  title?: string;
}

export interface DividerBlockMetadata {
  style?: 'solid' | 'dashed' | 'dotted';
  width?: 'full' | 'half' | 'quarter';
  color?: string;
}

// Union type for all metadata types
export type BlockMetadata =
  | HeadingBlockMetadata
  | ImageBlockMetadata
  | VerseBlockMetadata
  | VocabularyBlockMetadata
  | ListBlockMetadata
  | CalloutBlockMetadata
  | DividerBlockMetadata
  | Record<string, unknown>;

// Bilingual content structure
export interface BilingualContent {
  content_en?: {
    html: string;
    text: string;
  };
  content_fr?: {
    html: string;
    text: string;
  };
}

export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // JSON string for rich content (HTML)
  order: number;
  metadata?: BlockMetadata;
}

export interface Slide {
  id: string;
  lesson_id: string;
  layout: SlideLayoutType;
  slide_order: number; // Renamed from 'order' to match backend
  title_en?: string;
  title_fr?: string;
  notes_en?: string; // Renamed from teacher_notes_en to match backend
  notes_fr?: string; // Renamed from teacher_notes_fr to match backend
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
  notes_en?: string; // Renamed to match backend
  notes_fr?: string; // Renamed to match backend
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
  metadata?: BlockMetadata;
}

export interface UpdateContentBlockRequest extends Partial<CreateContentBlockRequest> {}

export interface ReorderContentBlocksRequest {
  block_orders: {
    block_id: string;
    order: number;
  }[];
}

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

// Block info for palette
export interface BlockInfo {
  type: ContentBlockType;
  name: string;
  description: string;
  icon: string; // Lucide icon name
  category: 'text' | 'media' | 'interactive' | 'layout';
}
