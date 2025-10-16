import { BookOpen } from 'lucide-react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RichTextEditor } from '../rich-text-editor';

type BibleTranslation = 'KJV' | 'NIV' | 'ESV' | 'NKJV' | 'LSG' | 'NBS' | 'BDS';

export interface VerseBlockMetadata {
  verseReference?: string;
  translation?: BibleTranslation;
}

interface VerseBlockProps {
  content: string;
  onUpdate: (content: string, metadata?: VerseBlockMetadata) => void;
  metadata?: VerseBlockMetadata;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

const TRANSLATIONS: Record<BibleTranslation, { name: string; language: 'en' | 'fr' }> = {
  KJV: { name: 'King James Version', language: 'en' },
  NIV: { name: 'New International Version', language: 'en' },
  ESV: { name: 'English Standard Version', language: 'en' },
  NKJV: { name: 'New King James Version', language: 'en' },
  LSG: { name: 'Louis Segond', language: 'fr' },
  NBS: { name: 'Nouvelle Bible Segond', language: 'fr' },
  BDS: { name: 'Bible du Semeur', language: 'fr' },
};

export function VerseBlock({
  content,
  onUpdate,
  metadata,
  language = 'en',
  onLanguageChange,
  editable = true,
}: VerseBlockProps) {
  // Ensure metadata is never null
  const safeMetadata = metadata || {};

  // Parse JSON content from backend
  const parseContent = (
    jsonContent: string,
  ): { html: string; verseReference: string; translation: string } => {
    // Handle null/undefined content
    if (!jsonContent) {
      return {
        html: '',
        verseReference: safeMetadata.verseReference || '',
        translation: safeMetadata.translation || 'NIV',
      };
    }

    try {
      const parsed = JSON.parse(jsonContent) as {
        html?: string;
        text?: string;
        verseReference?: string;
        translation?: string;
      } | null;
      // Handle parsed null
      if (!parsed || typeof parsed !== 'object') {
        return {
          html: '',
          verseReference: safeMetadata.verseReference || '',
          translation: safeMetadata.translation || 'NIV',
        };
      }
      return {
        html: parsed.html || parsed.text || '',
        verseReference: parsed.verseReference || safeMetadata.verseReference || '',
        translation: parsed.translation || safeMetadata.translation || 'NIV',
      };
    } catch {
      // Fallback if content is not JSON - assume it's HTML
      return {
        html: jsonContent || '',
        verseReference: safeMetadata.verseReference || '',
        translation: safeMetadata.translation || 'NIV',
      };
    }
  };

  const parsedContent = parseContent(content);
  const htmlContent = parsedContent.html;
  const verseReference = parsedContent.verseReference;
  const translation = parsedContent.translation as BibleTranslation;

  const handleReferenceChange = (reference: string) => {
    const newContent = JSON.stringify({
      html: htmlContent,
      verseReference: reference,
      translation,
    });
    onUpdate(newContent, metadata);
  };

  const handleTranslationChange = (newTranslation: string) => {
    const newContent = JSON.stringify({
      html: htmlContent,
      verseReference,
      translation: newTranslation,
    });
    onUpdate(newContent, metadata);
  };

  const handleContentChange = (newHtml: string) => {
    const newContent = JSON.stringify({ html: newHtml, verseReference, translation });
    onUpdate(newContent, metadata);
  };

  // Get translations for current language
  const availableTranslations = Object.entries(TRANSLATIONS)
    .filter(([_, data]) => data.language === language)
    .map(([key, data]) => ({ value: key, label: `${key} - ${data.name}` }));

  return (
    <div className="space-y-4">
      {/* Reference and Translation Inputs */}
      {editable && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="verse-reference" className="flex items-center gap-2">
              Verse Reference
              <span className="text-red-500">*</span>
            </Label>
            <Input
              id="verse-reference"
              type="text"
              placeholder="e.g., John 3:16"
              value={verseReference}
              onChange={(e) => handleReferenceChange(e.target.value)}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Examples: John 3:16, Genesis 1:1-3, Psalm 23
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="verse-translation">Translation</Label>
            <Select value={translation} onValueChange={handleTranslationChange}>
              <SelectTrigger id="verse-translation">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableTranslations.map((trans) => (
                  <SelectItem key={trans.value} value={trans.value}>
                    {trans.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Verse Content Editor */}
      <div className="space-y-2">
        {editable && (
          <Label className="flex items-center gap-2">
            Verse Text
            <span className="text-red-500">*</span>
          </Label>
        )}
        <RichTextEditor
          content={htmlContent}
          onUpdate={handleContentChange}
          placeholder="Enter or paste the verse text..."
          editable={editable}
          showToolbar={editable}
          language={language}
          onLanguageChange={onLanguageChange}
          showLanguageToggle={!!onLanguageChange}
          minHeight="100px"
        />
      </div>

      {/* Verse Citation Display */}
      {verseReference && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <BookOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 italic">
            {verseReference} ({translation})
          </p>
        </div>
      )}

      {/* Preview Box (non-editable mode) */}
      {!editable && htmlContent && (
        <div className="p-6 bg-blue-50 dark:bg-blue-950 border-l-4 border-blue-500 rounded-r-lg">
          <div
            className="prose prose-sm dark:prose-invert max-w-none mb-4"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
          {verseReference && (
            <div className="flex items-center justify-end gap-2 text-blue-700 dark:text-blue-300">
              <BookOpen className="h-4 w-4" />
              <p className="text-sm font-medium italic">
                {verseReference} ({translation})
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
