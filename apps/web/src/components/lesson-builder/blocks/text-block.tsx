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
  // Parse JSON content from backend
  const parseContent = (jsonContent: string): string => {
    // Handle null/undefined content
    if (!jsonContent) {
      return '';
    }

    try {
      const parsed = JSON.parse(jsonContent) as { html?: string } | null;
      // Handle parsed null
      if (!parsed || typeof parsed !== 'object') {
        return '';
      }
      // Extract HTML from the parsed object
      return parsed.html || '';
    } catch {
      // Fallback if content is not JSON - assume it's already HTML
      return jsonContent || '';
    }
  };

  const htmlContent = parseContent(content);

  const handleUpdate = (newHtml: string) => {
    // Serialize back to JSON format for backend
    const jsonContent = JSON.stringify({ html: newHtml });
    onUpdate(jsonContent);
  };

  return (
    <div className="w-full">
      <RichTextEditor
        content={htmlContent}
        onUpdate={handleUpdate}
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
