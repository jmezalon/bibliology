import { ContentBlockType } from '../types/lesson-builder';

export interface ValidationRule {
  field: string;
  rule: 'required' | 'maxLength' | 'minLength' | 'format' | 'url';
  value?: number | RegExp;
  message: string;
}

export interface BlockValidation {
  isValid: boolean;
  errors: { field: string; message: string }[];
}

/**
 * Validation rules for each block type
 */
const BLOCK_VALIDATION_RULES: Record<ContentBlockType, ValidationRule[]> = {
  [ContentBlockType.TEXT]: [
    {
      field: 'content',
      rule: 'required',
      message: 'Text content is required',
    },
    {
      field: 'content',
      rule: 'maxLength',
      value: 5000,
      message: 'Text content must not exceed 5000 characters',
    },
  ],
  [ContentBlockType.HEADING]: [
    {
      field: 'content',
      rule: 'required',
      message: 'Heading text is required',
    },
    {
      field: 'content',
      rule: 'maxLength',
      value: 200,
      message: 'Heading must not exceed 200 characters',
    },
  ],
  [ContentBlockType.IMAGE]: [
    {
      field: 'imageUrl',
      rule: 'required',
      message: 'Image URL is required',
    },
    {
      field: 'imageUrl',
      rule: 'url',
      message: 'Image URL must be a valid URL',
    },
    {
      field: 'imageAlt',
      rule: 'required',
      message: 'Alt text is required for accessibility',
    },
  ],
  [ContentBlockType.VERSE]: [
    {
      field: 'verseReference',
      rule: 'required',
      message: 'Verse reference is required',
    },
    {
      field: 'content',
      rule: 'required',
      message: 'Verse content is required',
    },
  ],
  [ContentBlockType.VOCABULARY]: [
    {
      field: 'term',
      rule: 'required',
      message: 'Term is required',
    },
    {
      field: 'definition',
      rule: 'required',
      message: 'Definition is required',
    },
  ],
  [ContentBlockType.LIST]: [
    {
      field: 'items',
      rule: 'minLength',
      value: 1,
      message: 'List must have at least 1 item',
    },
    {
      field: 'items',
      rule: 'maxLength',
      value: 20,
      message: 'List must not exceed 20 items',
    },
  ],
  [ContentBlockType.CALLOUT]: [
    {
      field: 'content',
      rule: 'required',
      message: 'Callout content is required',
    },
  ],
  [ContentBlockType.DIVIDER]: [],
};

/**
 * Strip HTML tags from content to get plain text length
 */
function stripHtml(html: string): string {
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
}

/**
 * Validate URL format
 */
function isValidUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);
    return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Validate a single field based on a rule
 */
function validateField(value: unknown, rule: ValidationRule): { isValid: boolean; error?: string } {
  switch (rule.rule) {
    case 'required': {
      if (typeof value === 'string') {
        const stripped = stripHtml(value).trim();
        if (!stripped || stripped.length === 0) {
          return { isValid: false, error: rule.message };
        }
      } else if (value === null || value === undefined || value === '') {
        return { isValid: false, error: rule.message };
      }
      break;
    }

    case 'maxLength': {
      if (typeof value === 'string' && rule.value && typeof rule.value === 'number') {
        const length = stripHtml(value).length;
        if (length > rule.value) {
          return { isValid: false, error: rule.message };
        }
      } else if (Array.isArray(value) && rule.value && typeof rule.value === 'number') {
        if (value.length > rule.value) {
          return { isValid: false, error: rule.message };
        }
      }
      break;
    }

    case 'minLength': {
      if (typeof value === 'string' && rule.value && typeof rule.value === 'number') {
        const length = stripHtml(value).length;
        if (length < rule.value) {
          return { isValid: false, error: rule.message };
        }
      } else if (Array.isArray(value) && rule.value && typeof rule.value === 'number') {
        if (value.length < rule.value) {
          return { isValid: false, error: rule.message };
        }
      }
      break;
    }

    case 'format': {
      if (typeof value === 'string' && rule.value instanceof RegExp) {
        if (!rule.value.test(value)) {
          return { isValid: false, error: rule.message };
        }
      }
      break;
    }

    case 'url': {
      if (typeof value === 'string') {
        if (!isValidUrl(value)) {
          return { isValid: false, error: rule.message };
        }
      }
      break;
    }
  }

  return { isValid: true };
}

/**
 * Validate a content block based on its type
 */
export function validateBlock(
  blockType: ContentBlockType,
  content: string,
  metadata?: Record<string, unknown>,
): BlockValidation {
  const rules = BLOCK_VALIDATION_RULES[blockType];
  const errors: { field: string; message: string }[] = [];

  for (const rule of rules) {
    let value: unknown;

    // Determine where to find the value
    if (rule.field === 'content') {
      value = content;
    } else if (metadata && rule.field in metadata) {
      value = metadata[rule.field];
    } else {
      value = undefined;
    }

    const result = validateField(value, rule);
    if (!result.isValid && result.error) {
      errors.push({
        field: rule.field,
        message: result.error,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get all validation rules for a specific block type
 */
export function getBlockValidationRules(blockType: ContentBlockType): ValidationRule[] {
  return BLOCK_VALIDATION_RULES[blockType];
}

/**
 * Check if a block has required fields
 */
export function blockHasRequiredFields(blockType: ContentBlockType): boolean {
  const rules = BLOCK_VALIDATION_RULES[blockType];
  return rules.some((rule) => rule.rule === 'required');
}

/**
 * Get character limit for a block type (if any)
 */
export function getBlockCharacterLimit(blockType: ContentBlockType): number | null {
  const rules = BLOCK_VALIDATION_RULES[blockType];
  const maxLengthRule = rules.find((rule) => rule.field === 'content' && rule.rule === 'maxLength');
  return maxLengthRule && typeof maxLengthRule.value === 'number' ? maxLengthRule.value : null;
}
