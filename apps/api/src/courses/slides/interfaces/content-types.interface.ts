/**
 * Content type interfaces for JSONB content in content blocks
 * These match the frontend types in apps/web/src/types/lesson-builder.ts
 */

// Base content structure for rich text
export interface BaseContent {
  html: string; // Rich text HTML from Tiptap
  text: string; // Plain text for search/indexing
}

// Block-specific content structures
export interface HeadingContent {
  text: string;
  level: 1 | 2 | 3;
  alignment?: 'left' | 'center' | 'right';
}

export interface TextContent {
  html: string; // Rich text HTML
}

export interface ImageContent {
  imageUrl: string;
  imageAlt: string;
  caption?: string;
}

export interface VerseContent {
  text: string;
  verseReference: string;
  translation: 'KJV' | 'NIV' | 'ESV' | 'NKJV' | 'LSG' | 'NBS' | 'BDS';
}

export interface VocabularyContent {
  term_en?: string;
  term_fr?: string;
  definition: string;
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

export interface ListContent {
  listStyle: 'bullet' | 'numbered';
  items: string[];
}

export interface CalloutContent {
  text: string;
  calloutType: 'info' | 'warning' | 'success' | 'error';
  title?: string;
}

export interface DividerContent {
  style: 'solid' | 'dashed' | 'dotted';
  width: 'full' | 'half' | 'quarter';
  color?: string;
}

// Discriminated union for type safety
export type ContentBlockContent =
  | { type: 'HEADING'; data: HeadingContent }
  | { type: 'TEXT'; data: TextContent }
  | { type: 'IMAGE'; data: ImageContent }
  | { type: 'VERSE'; data: VerseContent }
  | { type: 'VOCABULARY'; data: VocabularyContent }
  | { type: 'LIST'; data: ListContent }
  | { type: 'CALLOUT'; data: CalloutContent }
  | { type: 'DIVIDER'; data: DividerContent };
