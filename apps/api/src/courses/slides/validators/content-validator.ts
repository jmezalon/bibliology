import { ContentBlockType } from '@prisma/client';
import DOMPurify from 'isomorphic-dompurify';
import { z } from 'zod';

// Heading content schema
const HeadingContentSchema = z.object({
  text: z.string().min(1, 'Heading text is required').max(200, 'Heading must not exceed 200 characters'),
  level: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  alignment: z.enum(['left', 'center', 'right']).optional(),
});

// Text content schema
const TextContentSchema = z.object({
  html: z.string().min(1, 'Text content is required').max(5000, 'Text must not exceed 5000 characters'),
});

// Image content schema
const ImageContentSchema = z.object({
  imageUrl: z.string().url('Invalid image URL'),
  imageAlt: z.string().min(1, 'Alt text is required for accessibility'),
  caption: z.string().optional(),
});

// Verse content schema
const VerseContentSchema = z.object({
  text: z.string().min(1, 'Verse text is required'),
  verseReference: z.string().min(1, 'Verse reference is required'),
  translation: z.enum(['KJV', 'NIV', 'ESV', 'NKJV', 'LSG', 'NBS', 'BDS']),
});

// Vocabulary content schema
const VocabularyContentSchema = z.object({
  term_en: z.string().optional(),
  term_fr: z.string().optional(),
  definition: z.string().min(1, 'Definition is required'),
  partOfSpeech: z
    .enum([
      'noun',
      'verb',
      'adjective',
      'adverb',
      'pronoun',
      'preposition',
      'conjunction',
      'interjection',
      'other',
    ])
    .optional(),
  pronunciation: z.string().optional(),
}).refine((data) => data.term_en || data.term_fr, {
  message: 'At least one term (English or French) is required',
});

// List content schema
const ListContentSchema = z.object({
  listStyle: z.enum(['bullet', 'numbered']),
  items: z.array(z.string()).min(1, 'List must have at least one item').max(20, 'List must not exceed 20 items'),
});

// Callout content schema
const CalloutContentSchema = z.object({
  text: z.string().min(1, 'Callout content is required'),
  calloutType: z.enum(['info', 'warning', 'success', 'error']),
  title: z.string().optional(),
});

// Divider content schema (no required fields, but validate structure)
const DividerContentSchema = z.object({
  style: z.enum(['solid', 'dashed', 'dotted']).default('solid'),
  width: z.enum(['full', 'half', 'quarter']).default('full'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

// Quiz content schema (quiz blocks reference Quiz model via quiz_id)
const QuizContentSchema = z.object({
  quiz_id: z.string().optional(),
  instructions: z.string().optional(),
});

// Schema map by block type
export const ContentSchemaMap: Record<ContentBlockType, z.ZodSchema> = {
  HEADING: HeadingContentSchema,
  TEXT: TextContentSchema,
  IMAGE: ImageContentSchema,
  VERSE: VerseContentSchema,
  VOCABULARY: VocabularyContentSchema,
  LIST: ListContentSchema,
  CALLOUT: CalloutContentSchema,
  DIVIDER: DividerContentSchema,
  QUIZ: QuizContentSchema,
};

// Validation function
export function validateContentByType(
  blockType: ContentBlockType,
  content: unknown,
): { valid: boolean; errors?: string[] } {
  const schema = ContentSchemaMap[blockType];

  if (!schema) {
    return { valid: false, errors: ['Invalid block type'] };
  }

  const result = schema.safeParse(content);

  if (result.success) {
    return { valid: true };
  }

  return {
    valid: false,
    errors: result.error.errors.map((err) => `${err.path.join('.')}: ${err.message}`),
  };
}

/**
 * Sanitize HTML to prevent XSS attacks
 * Uses DOMPurify with strict configuration for lesson content
 */
export function sanitizeContentHtml(html: string): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      // Text formatting
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'mark',
      'span',
      // Headings
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      // Lists
      'ul',
      'ol',
      'li',
      // Links
      'a',
      // Quotes and code
      'blockquote',
      'code',
      'pre',
    ],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class', 'style'],
    ALLOW_DATA_ATTR: true,
    // Forbid dangerous attributes and tags
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover'],
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
  });
}

/**
 * Sanitize a JSON content object that may contain HTML
 */
export function sanitizeJsonContent(content: unknown): unknown {
  if (typeof content === 'string') {
    return sanitizeContentHtml(content);
  }

  if (typeof content === 'object' && content !== null) {
    if (Array.isArray(content)) {
      return content.map((item) => sanitizeJsonContent(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(content)) {
      // Sanitize HTML fields
      if (key === 'html' || key === 'text' || key === 'content') {
        sanitized[key] = typeof value === 'string' ? sanitizeContentHtml(value) : value;
      } else {
        sanitized[key] = sanitizeJsonContent(value);
      }
    }
    return sanitized;
  }

  return content;
}

// Get metadata schema for a block type (returns the default empty object)
export function getDefaultMetadata(blockType: ContentBlockType): Record<string, unknown> {
  const defaults: Record<ContentBlockType, Record<string, unknown>> = {
    HEADING: { level: 2, alignment: 'left' },
    TEXT: {},
    IMAGE: {},
    VERSE: { translation: 'NIV' },
    VOCABULARY: {},
    LIST: { listStyle: 'bullet', items: [] },
    CALLOUT: { calloutType: 'info' },
    DIVIDER: { style: 'solid', width: 'full' },
    QUIZ: {},
  };

  return defaults[blockType] || {};
}
