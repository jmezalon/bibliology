import { RichTextEditor } from '../rich-text-editor';

interface TextBlockProps {
  content: string;
  onUpdate: (content: string) => void;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

export function TextBlock({
  content,
  onUpdate,
  language = 'en',
  onLanguageChange,
  editable = true,
}: TextBlockProps) {
  return (
    <div className="w-full">
      <RichTextEditor
        content={content}
        onUpdate={onUpdate}
        placeholder="Start typing your text content..."
        maxLength={5000}
        editable={editable}
        showToolbar={editable}
        language={language}
        onLanguageChange={onLanguageChange}
        showLanguageToggle={!!onLanguageChange}
        minHeight="120px"
      />
    </div>
  );
}
