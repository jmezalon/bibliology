import { Languages } from 'lucide-react';

import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RichTextEditor } from '../rich-text-editor';

type PartOfSpeech =
  | 'noun'
  | 'verb'
  | 'adjective'
  | 'adverb'
  | 'pronoun'
  | 'preposition'
  | 'conjunction'
  | 'interjection'
  | 'other';

export interface VocabularyBlockMetadata {
  term_en?: string;
  term_fr?: string;
  partOfSpeech?: PartOfSpeech;
  pronunciation?: string;
}

interface VocabularyBlockProps {
  content: string; // Definition content
  onUpdate: (content: string, metadata?: VocabularyBlockMetadata) => void;
  metadata?: VocabularyBlockMetadata;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

const PARTS_OF_SPEECH: { value: PartOfSpeech; label: string }[] = [
  { value: 'noun', label: 'Noun' },
  { value: 'verb', label: 'Verb' },
  { value: 'adjective', label: 'Adjective' },
  { value: 'adverb', label: 'Adverb' },
  { value: 'pronoun', label: 'Pronoun' },
  { value: 'preposition', label: 'Preposition' },
  { value: 'conjunction', label: 'Conjunction' },
  { value: 'interjection', label: 'Interjection' },
  { value: 'other', label: 'Other' },
];

export function VocabularyBlock({
  content,
  onUpdate,
  metadata,
  language = 'en',
  onLanguageChange,
  editable = true,
}: VocabularyBlockProps) {
  // Ensure metadata is never null
  const safeMetadata = metadata || {};

  // Parse JSON content from backend
  const parseContent = (
    jsonContent: string,
  ): {
    html: string;
    term_en: string;
    term_fr: string;
    partOfSpeech: PartOfSpeech;
    pronunciation: string;
  } => {
    // Handle null/undefined content
    if (!jsonContent) {
      return {
        html: '',
        term_en: safeMetadata.term_en || '',
        term_fr: safeMetadata.term_fr || '',
        partOfSpeech: (safeMetadata.partOfSpeech || 'noun') as PartOfSpeech,
        pronunciation: safeMetadata.pronunciation || '',
      };
    }

    try {
      const parsed = JSON.parse(jsonContent) as {
        html?: string;
        definition?: string;
        term_en?: string;
        term_fr?: string;
        partOfSpeech?: string;
        pronunciation?: string;
      } | null;
      // Handle parsed null
      if (!parsed || typeof parsed !== 'object') {
        return {
          html: '',
          term_en: safeMetadata.term_en || '',
          term_fr: safeMetadata.term_fr || '',
          partOfSpeech: (safeMetadata.partOfSpeech || 'noun') as PartOfSpeech,
          pronunciation: safeMetadata.pronunciation || '',
        };
      }
      return {
        html: parsed.html || parsed.definition || '',
        term_en: parsed.term_en || safeMetadata.term_en || '',
        term_fr: parsed.term_fr || safeMetadata.term_fr || '',
        partOfSpeech: (parsed.partOfSpeech || safeMetadata.partOfSpeech || 'noun') as PartOfSpeech,
        pronunciation: parsed.pronunciation || safeMetadata.pronunciation || '',
      };
    } catch {
      // Fallback if content is not JSON - assume it's HTML definition
      return {
        html: jsonContent || '',
        term_en: safeMetadata.term_en || '',
        term_fr: safeMetadata.term_fr || '',
        partOfSpeech: (safeMetadata.partOfSpeech || 'noun') as PartOfSpeech,
        pronunciation: safeMetadata.pronunciation || '',
      };
    }
  };

  const parsedContent = parseContent(content);
  const htmlContent = parsedContent.html;
  const term_en = parsedContent.term_en;
  const term_fr = parsedContent.term_fr;
  const partOfSpeech = parsedContent.partOfSpeech;
  const pronunciation = parsedContent.pronunciation;

  const currentTerm = language === 'en' ? term_en : term_fr;

  const handleTermChange = (value: string) => {
    const newContent = JSON.stringify({
      html: htmlContent,
      term_en: language === 'en' ? value : term_en,
      term_fr: language === 'fr' ? value : term_fr,
      partOfSpeech,
      pronunciation,
    });
    onUpdate(newContent, metadata);
  };

  const handlePartOfSpeechChange = (value: string) => {
    const newContent = JSON.stringify({
      html: htmlContent,
      term_en,
      term_fr,
      partOfSpeech: value,
      pronunciation,
    });
    onUpdate(newContent, metadata);
  };

  const handlePronunciationChange = (value: string) => {
    const newContent = JSON.stringify({
      html: htmlContent,
      term_en,
      term_fr,
      partOfSpeech,
      pronunciation: value,
    });
    onUpdate(newContent, metadata);
  };

  const handleDefinitionChange = (newHtml: string) => {
    const newContent = JSON.stringify({
      html: newHtml,
      term_en,
      term_fr,
      partOfSpeech,
      pronunciation,
    });
    onUpdate(newContent, metadata);
  };

  return (
    <div className="space-y-4">
      {/* Term and Language Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-2 space-y-2">
          <Label htmlFor="vocab-term" className="flex items-center gap-2">
            Term ({language.toUpperCase()})<span className="text-red-500">*</span>
          </Label>
          <div className="flex gap-2">
            <Input
              id="vocab-term"
              type="text"
              placeholder={
                language === 'en' ? 'Enter term in English' : 'Entrez le terme en français'
              }
              value={currentTerm}
              onChange={(e) => handleTermChange(e.target.value)}
              className="text-lg font-semibold"
            />
            {onLanguageChange && (
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="vocab-pos">Part of Speech</Label>
          <Select value={partOfSpeech} onValueChange={handlePartOfSpeechChange}>
            <SelectTrigger id="vocab-pos">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PARTS_OF_SPEECH.map((pos) => (
                <SelectItem key={pos.value} value={pos.value}>
                  {pos.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Pronunciation (Optional) */}
      {editable && (
        <div className="space-y-2">
          <Label htmlFor="vocab-pronunciation">Pronunciation (Optional)</Label>
          <Input
            id="vocab-pronunciation"
            type="text"
            placeholder="e.g., /prəˌnʌnsiˈeɪʃən/"
            value={pronunciation}
            onChange={(e) => handlePronunciationChange(e.target.value)}
            className="font-mono text-sm"
          />
        </div>
      )}

      {/* Definition Editor */}
      <div className="space-y-2">
        {editable && (
          <Label className="flex items-center gap-2">
            Definition
            <span className="text-red-500">*</span>
          </Label>
        )}
        <RichTextEditor
          content={htmlContent}
          onUpdate={handleDefinitionChange}
          placeholder="Enter the definition and explanation..."
          editable={editable}
          showToolbar={editable}
          minHeight="100px"
        />
      </div>

      {/* Display Card (non-editable or preview) */}
      {!editable && currentTerm && (
        <div className="p-6 bg-purple-50 dark:bg-purple-950 border-2 border-purple-200 dark:border-purple-800 rounded-lg">
          <div className="flex items-start gap-3 mb-4">
            <Languages className="h-6 w-6 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="text-2xl font-bold text-purple-900 dark:text-purple-100 mb-1">
                {currentTerm}
              </h3>
              <div className="flex items-center gap-3 text-sm text-purple-700 dark:text-purple-300">
                <span className="italic">
                  {PARTS_OF_SPEECH.find((pos) => pos.value === partOfSpeech)?.label}
                </span>
                {pronunciation && (
                  <>
                    <span>•</span>
                    <span className="font-mono">{pronunciation}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div
            className="prose prose-sm dark:prose-invert max-w-none text-purple-900 dark:text-purple-100"
            dangerouslySetInnerHTML={{ __html: htmlContent }}
          />
        </div>
      )}

      {/* Bilingual Status */}
      {editable && (term_en || term_fr) && (
        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
          <Languages className="h-3 w-3" />
          <span>
            {term_en && term_fr
              ? 'Available in both languages'
              : term_en
                ? 'English only'
                : 'French only'}
          </span>
        </div>
      )}
    </div>
  );
}
