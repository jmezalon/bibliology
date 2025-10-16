import { describe, it, expect } from 'vitest';
import { ContentBlockType } from '@prisma/client';

import {
  validateContentByType,
  sanitizeContentHtml,
  sanitizeJsonContent,
  getDefaultMetadata,
} from '../../src/courses/slides/validators/content-validator';

describe('Content Validator', () => {
  describe('validateContentByType', () => {
    describe('TEXT blocks', () => {
      it('should validate valid TEXT content', () => {
        const content = { html: '<p>Valid text content</p>' };
        const result = validateContentByType(ContentBlockType.TEXT, content);

        expect(result.valid).toBe(true);
        expect(result.errors).toBeUndefined();
      });

      it('should reject TEXT without html field', () => {
        const content = { wrongField: 'test' };
        const result = validateContentByType(ContentBlockType.TEXT, content);

        expect(result.valid).toBe(false);
        expect(result.errors).toBeDefined();
        expect(result.errors?.[0]).toContain('html');
      });

      it('should reject TEXT with empty html', () => {
        const content = { html: '' };
        const result = validateContentByType(ContentBlockType.TEXT, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('required');
      });

      it('should reject TEXT with html exceeding 5000 characters', () => {
        const content = { html: 'A'.repeat(5001) };
        const result = validateContentByType(ContentBlockType.TEXT, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('5000');
      });

      it('should accept TEXT with exactly 5000 characters', () => {
        const content = { html: 'A'.repeat(5000) };
        const result = validateContentByType(ContentBlockType.TEXT, content);

        expect(result.valid).toBe(true);
      });
    });

    describe('HEADING blocks', () => {
      it('should validate valid HEADING content with level 1', () => {
        const content = { text: 'Heading Text', level: 1 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(true);
      });

      it('should validate valid HEADING content with level 2', () => {
        const content = { text: 'Heading Text', level: 2 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(true);
      });

      it('should validate valid HEADING content with level 3', () => {
        const content = { text: 'Heading Text', level: 3 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(true);
      });

      it('should reject HEADING with invalid level', () => {
        const content = { text: 'Test', level: 4 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(false);
      });

      it('should reject HEADING without text', () => {
        const content = { level: 2 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('text');
      });

      it('should reject HEADING with text exceeding 200 characters', () => {
        const content = { text: 'A'.repeat(201), level: 2 };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('200');
      });

      it('should accept optional alignment', () => {
        const content = { text: 'Test', level: 2, alignment: 'center' };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid alignment', () => {
        const content = { text: 'Test', level: 2, alignment: 'invalid' };
        const result = validateContentByType(ContentBlockType.HEADING, content);

        expect(result.valid).toBe(false);
      });
    });

    describe('IMAGE blocks', () => {
      it('should validate valid IMAGE content', () => {
        const content = {
          imageUrl: 'https://example.com/image.jpg',
          imageAlt: 'Test image',
          caption: 'Test caption',
        };
        const result = validateContentByType(ContentBlockType.IMAGE, content);

        expect(result.valid).toBe(true);
      });

      it('should reject IMAGE with invalid URL', () => {
        const content = {
          imageUrl: 'not-a-url',
          imageAlt: 'Test',
        };
        const result = validateContentByType(ContentBlockType.IMAGE, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('URL');
      });

      it('should reject IMAGE without alt text', () => {
        const content = {
          imageUrl: 'https://example.com/image.jpg',
        };
        const result = validateContentByType(ContentBlockType.IMAGE, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('Alt text');
      });

      it('should accept IMAGE without caption (optional)', () => {
        const content = {
          imageUrl: 'https://example.com/image.jpg',
          imageAlt: 'Test',
        };
        const result = validateContentByType(ContentBlockType.IMAGE, content);

        expect(result.valid).toBe(true);
      });
    });

    describe('VERSE blocks', () => {
      it('should validate valid VERSE content', () => {
        const content = {
          text: 'For God so loved the world...',
          verseReference: 'John 3:16',
          translation: 'NIV',
        };
        const result = validateContentByType(ContentBlockType.VERSE, content);

        expect(result.valid).toBe(true);
      });

      it('should reject VERSE without text', () => {
        const content = {
          verseReference: 'John 3:16',
          translation: 'NIV',
        };
        const result = validateContentByType(ContentBlockType.VERSE, content);

        expect(result.valid).toBe(false);
      });

      it('should reject VERSE without reference', () => {
        const content = {
          text: 'Test verse',
          translation: 'NIV',
        };
        const result = validateContentByType(ContentBlockType.VERSE, content);

        expect(result.valid).toBe(false);
      });

      it('should accept all valid Bible translations', () => {
        const translations = ['KJV', 'NIV', 'ESV', 'NKJV', 'LSG', 'NBS', 'BDS'];

        for (const translation of translations) {
          const content = {
            text: 'Test verse',
            verseReference: 'John 3:16',
            translation,
          };
          const result = validateContentByType(ContentBlockType.VERSE, content);

          expect(result.valid).toBe(true);
        }
      });

      it('should reject invalid translation', () => {
        const content = {
          text: 'Test verse',
          verseReference: 'John 3:16',
          translation: 'INVALID',
        };
        const result = validateContentByType(ContentBlockType.VERSE, content);

        expect(result.valid).toBe(false);
      });
    });

    describe('VOCABULARY blocks', () => {
      it('should validate valid VOCABULARY content with English term', () => {
        const content = {
          term_en: 'Grace',
          definition: 'Unmerited favor',
          partOfSpeech: 'noun',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(true);
      });

      it('should validate valid VOCABULARY content with French term', () => {
        const content = {
          term_fr: 'Grâce',
          definition: 'Faveur imméritée',
          partOfSpeech: 'noun',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(true);
      });

      it('should validate VOCABULARY with both terms', () => {
        const content = {
          term_en: 'Grace',
          term_fr: 'Grâce',
          definition: 'Unmerited favor',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(true);
      });

      it('should reject VOCABULARY without any term', () => {
        const content = {
          definition: 'Test definition',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('At least one term');
      });

      it('should reject VOCABULARY without definition', () => {
        const content = {
          term_en: 'Grace',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(false);
      });

      it('should accept optional pronunciation', () => {
        const content = {
          term_en: 'Ephesians',
          definition: 'Book of the Bible',
          pronunciation: 'ih-FEE-zhuhnz',
        };
        const result = validateContentByType(ContentBlockType.VOCABULARY, content);

        expect(result.valid).toBe(true);
      });

      it('should accept all valid parts of speech', () => {
        const partsOfSpeech = [
          'noun',
          'verb',
          'adjective',
          'adverb',
          'pronoun',
          'preposition',
          'conjunction',
          'interjection',
          'other',
        ];

        for (const partOfSpeech of partsOfSpeech) {
          const content = {
            term_en: 'Test',
            definition: 'Test definition',
            partOfSpeech,
          };
          const result = validateContentByType(ContentBlockType.VOCABULARY, content);

          expect(result.valid).toBe(true);
        }
      });
    });

    describe('LIST blocks', () => {
      it('should validate valid bullet LIST', () => {
        const content = {
          listStyle: 'bullet',
          items: ['Item 1', 'Item 2', 'Item 3'],
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(true);
      });

      it('should validate valid numbered LIST', () => {
        const content = {
          listStyle: 'numbered',
          items: ['First', 'Second', 'Third'],
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(true);
      });

      it('should reject LIST with empty items array', () => {
        const content = {
          listStyle: 'bullet',
          items: [],
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('at least one item');
      });

      it('should reject LIST with more than 20 items', () => {
        const items = Array.from({ length: 21 }, (_, i) => `Item ${i + 1}`);
        const content = {
          listStyle: 'bullet',
          items,
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(false);
        expect(result.errors?.[0]).toContain('20 items');
      });

      it('should accept LIST with exactly 20 items', () => {
        const items = Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`);
        const content = {
          listStyle: 'bullet',
          items,
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid list style', () => {
        const content = {
          listStyle: 'invalid',
          items: ['Item 1'],
        };
        const result = validateContentByType(ContentBlockType.LIST, content);

        expect(result.valid).toBe(false);
      });
    });

    describe('CALLOUT blocks', () => {
      it('should validate valid CALLOUT content', () => {
        const content = {
          text: 'Important note',
          calloutType: 'info',
          title: 'Note',
        };
        const result = validateContentByType(ContentBlockType.CALLOUT, content);

        expect(result.valid).toBe(true);
      });

      it('should accept all callout types', () => {
        const types = ['info', 'warning', 'success', 'error'];

        for (const calloutType of types) {
          const content = {
            text: 'Test',
            calloutType,
          };
          const result = validateContentByType(ContentBlockType.CALLOUT, content);

          expect(result.valid).toBe(true);
        }
      });

      it('should reject CALLOUT without text', () => {
        const content = {
          calloutType: 'info',
        };
        const result = validateContentByType(ContentBlockType.CALLOUT, content);

        expect(result.valid).toBe(false);
      });

      it('should accept CALLOUT without title (optional)', () => {
        const content = {
          text: 'Test callout',
          calloutType: 'warning',
        };
        const result = validateContentByType(ContentBlockType.CALLOUT, content);

        expect(result.valid).toBe(true);
      });
    });

    describe('DIVIDER blocks', () => {
      it('should validate valid DIVIDER with defaults', () => {
        const content = {};
        const result = validateContentByType(ContentBlockType.DIVIDER, content);

        expect(result.valid).toBe(true);
      });

      it('should accept all valid styles', () => {
        const styles = ['solid', 'dashed', 'dotted'];

        for (const style of styles) {
          const content = { style };
          const result = validateContentByType(ContentBlockType.DIVIDER, content);

          expect(result.valid).toBe(true);
        }
      });

      it('should accept all valid widths', () => {
        const widths = ['full', 'half', 'quarter'];

        for (const width of widths) {
          const content = { width };
          const result = validateContentByType(ContentBlockType.DIVIDER, content);

          expect(result.valid).toBe(true);
        }
      });

      it('should accept valid hex color', () => {
        const content = { color: '#FF5733' };
        const result = validateContentByType(ContentBlockType.DIVIDER, content);

        expect(result.valid).toBe(true);
      });

      it('should reject invalid hex color', () => {
        const content = { color: 'red' };
        const result = validateContentByType(ContentBlockType.DIVIDER, content);

        expect(result.valid).toBe(false);
      });
    });

    describe('QUIZ blocks', () => {
      it('should validate QUIZ with quiz_id', () => {
        const content = {
          quiz_id: 'quiz-123',
          instructions: 'Complete the quiz',
        };
        const result = validateContentByType(ContentBlockType.QUIZ, content);

        expect(result.valid).toBe(true);
      });

      it('should accept QUIZ with empty content (optional fields)', () => {
        const content = {};
        const result = validateContentByType(ContentBlockType.QUIZ, content);

        expect(result.valid).toBe(true);
      });
    });
  });

  describe('sanitizeContentHtml', () => {
    it('should allow safe HTML tags', () => {
      const html = '<p><strong>Bold</strong> <em>Italic</em></p>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).toContain('<p>');
      expect(sanitized).toContain('<strong>');
      expect(sanitized).toContain('<em>');
    });

    it('should remove script tags', () => {
      const html = '<p>Safe</p><script>alert("XSS")</script>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove dangerous event handlers', () => {
      const html = '<img src="x" onerror="alert(\'XSS\')">';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('onerror');
      expect(sanitized).not.toContain('alert');
    });

    it('should remove iframe tags', () => {
      const html = '<iframe src="malicious.com"></iframe>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('<iframe>');
    });

    it('should remove form and input tags', () => {
      const html = '<form><input type="text"></form>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('<form>');
      expect(sanitized).not.toContain('<input>');
    });

    it('should preserve safe links', () => {
      const html = '<a href="https://example.com">Link</a>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).toContain('<a');
      expect(sanitized).toContain('href');
      expect(sanitized).toContain('example.com');
    });

    it('should preserve headings', () => {
      const html = '<h1>Title</h1><h2>Subtitle</h2><h3>Section</h3>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).toContain('<h1>');
      expect(sanitized).toContain('<h2>');
      expect(sanitized).toContain('<h3>');
    });

    it('should preserve lists', () => {
      const html = '<ul><li>Item 1</li><li>Item 2</li></ul>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).toContain('<ul>');
      expect(sanitized).toContain('<li>');
    });

    it('should handle empty input', () => {
      const sanitized = sanitizeContentHtml('');

      expect(sanitized).toBe('');
    });

    it('should remove javascript: protocol in links', () => {
      const html = '<a href="javascript:alert(\'XSS\')">Click</a>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('javascript:');
    });

    it('should handle nested XSS attempts', () => {
      const html = '<div><p><script>alert("nested")</script></p></div>';
      const sanitized = sanitizeContentHtml(html);

      expect(sanitized).not.toContain('<script>');
      expect(sanitized).not.toContain('alert');
    });
  });

  describe('sanitizeJsonContent', () => {
    it('should sanitize HTML in string values', () => {
      const content = '<p>Test</p><script>alert("XSS")</script>';
      const sanitized = sanitizeJsonContent(content);

      expect(sanitized).not.toContain('<script>');
    });

    it('should recursively sanitize object properties', () => {
      const content = {
        html: '<p>Safe</p><script>alert("XSS")</script>',
        text: 'Plain text',
      };
      const sanitized = sanitizeJsonContent(content) as any;

      expect(sanitized.html).not.toContain('<script>');
      expect(sanitized.text).toBe('Plain text');
    });

    it('should sanitize arrays', () => {
      const content = [
        '<p>Item 1</p><script>XSS</script>',
        '<p>Item 2</p>',
      ];
      const sanitized = sanitizeJsonContent(content) as any;

      expect(sanitized[0]).not.toContain('<script>');
      expect(sanitized[1]).toContain('<p>Item 2</p>');
    });

    it('should handle nested objects', () => {
      const content = {
        level1: {
          level2: {
            html: '<p>Test</p><script>XSS</script>',
          },
        },
      };
      const sanitized = sanitizeJsonContent(content) as any;

      expect(sanitized.level1.level2.html).not.toContain('<script>');
    });

    it('should preserve non-HTML fields', () => {
      const content = {
        title: 'Test Title',
        count: 42,
        isActive: true,
      };
      const sanitized = sanitizeJsonContent(content) as any;

      expect(sanitized.title).toBe('Test Title');
      expect(sanitized.count).toBe(42);
      expect(sanitized.isActive).toBe(true);
    });

    it('should handle null and undefined', () => {
      expect(sanitizeJsonContent(null)).toBe(null);
      expect(sanitizeJsonContent(undefined)).toBe(undefined);
    });
  });

  describe('getDefaultMetadata', () => {
    it('should return default metadata for HEADING', () => {
      const defaults = getDefaultMetadata(ContentBlockType.HEADING);

      expect(defaults).toEqual({ level: 2, alignment: 'left' });
    });

    it('should return default metadata for VERSE', () => {
      const defaults = getDefaultMetadata(ContentBlockType.VERSE);

      expect(defaults).toEqual({ translation: 'NIV' });
    });

    it('should return default metadata for LIST', () => {
      const defaults = getDefaultMetadata(ContentBlockType.LIST);

      expect(defaults).toEqual({ listStyle: 'bullet', items: [] });
    });

    it('should return default metadata for CALLOUT', () => {
      const defaults = getDefaultMetadata(ContentBlockType.CALLOUT);

      expect(defaults).toEqual({ calloutType: 'info' });
    });

    it('should return default metadata for DIVIDER', () => {
      const defaults = getDefaultMetadata(ContentBlockType.DIVIDER);

      expect(defaults).toEqual({ style: 'solid', width: 'full' });
    });

    it('should return empty object for TEXT', () => {
      const defaults = getDefaultMetadata(ContentBlockType.TEXT);

      expect(defaults).toEqual({});
    });

    it('should return empty object for IMAGE', () => {
      const defaults = getDefaultMetadata(ContentBlockType.IMAGE);

      expect(defaults).toEqual({});
    });

    it('should return empty object for VOCABULARY', () => {
      const defaults = getDefaultMetadata(ContentBlockType.VOCABULARY);

      expect(defaults).toEqual({});
    });

    it('should return empty object for QUIZ', () => {
      const defaults = getDefaultMetadata(ContentBlockType.QUIZ);

      expect(defaults).toEqual({});
    });
  });
});
