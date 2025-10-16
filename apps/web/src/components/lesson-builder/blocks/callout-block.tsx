import { AlertCircle, AlertTriangle, CheckCircle, Info } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { RichTextEditor } from '../rich-text-editor';

type CalloutType = 'info' | 'warning' | 'success' | 'error';

export interface CalloutBlockMetadata {
  calloutType?: CalloutType;
  title?: string;
}

interface CalloutBlockProps {
  content: string;
  onUpdate: (content: string, metadata?: CalloutBlockMetadata) => void;
  metadata?: CalloutBlockMetadata;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

const CALLOUT_CONFIGS: Record<
  CalloutType,
  {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    bgColor: string;
    borderColor: string;
    textColor: string;
    iconColor: string;
  }
> = {
  info: {
    label: 'Info',
    icon: Info,
    bgColor: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-900 dark:text-blue-100',
    iconColor: 'text-blue-600 dark:text-blue-400',
  },
  warning: {
    label: 'Warning',
    icon: AlertTriangle,
    bgColor: 'bg-yellow-50 dark:bg-yellow-950',
    borderColor: 'border-yellow-500',
    textColor: 'text-yellow-900 dark:text-yellow-100',
    iconColor: 'text-yellow-600 dark:text-yellow-400',
  },
  success: {
    label: 'Success',
    icon: CheckCircle,
    bgColor: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-500',
    textColor: 'text-green-900 dark:text-green-100',
    iconColor: 'text-green-600 dark:text-green-400',
  },
  error: {
    label: 'Error',
    icon: AlertCircle,
    bgColor: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-500',
    textColor: 'text-red-900 dark:text-red-100',
    iconColor: 'text-red-600 dark:text-red-400',
  },
};

export function CalloutBlock({
  content,
  onUpdate,
  metadata = {},
  language = 'en',
  onLanguageChange,
  editable = true,
}: CalloutBlockProps) {
  const calloutType = metadata.calloutType || 'info';
  const title = metadata.title || '';

  const config = CALLOUT_CONFIGS[calloutType];
  const Icon = config.icon;

  const handleTypeChange = (type: string) => {
    onUpdate(content, { ...metadata, calloutType: type as CalloutType });
  };

  const handleTitleChange = (newTitle: string) => {
    onUpdate(content, { ...metadata, title: newTitle });
  };

  const handleContentChange = (newContent: string) => {
    onUpdate(newContent, metadata);
  };

  return (
    <div className="space-y-4">
      {/* Callout Controls */}
      {editable && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="callout-type">Callout Type</Label>
            <Select value={calloutType} onValueChange={handleTypeChange}>
              <SelectTrigger id="callout-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CALLOUT_CONFIGS).map(([key, config]) => {
                  const TypeIcon = config.icon;
                  return (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <TypeIcon className="h-4 w-4" />
                        {config.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="callout-title">Title (Optional)</Label>
            <Input
              id="callout-title"
              type="text"
              placeholder="Add a title..."
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
            />
          </div>
        </div>
      )}

      {/* Callout Content */}
      {editable ? (
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            Content
            <span className="text-red-500">*</span>
          </Label>
          <RichTextEditor
            content={content}
            onUpdate={handleContentChange}
            placeholder="Enter callout content..."
            editable={editable}
            showToolbar={editable}
            language={language}
            onLanguageChange={onLanguageChange}
            showLanguageToggle={!!onLanguageChange}
            minHeight="100px"
          />
        </div>
      ) : (
        /* Display Mode */
        <div
          className={cn(
            'p-6 border-l-4 rounded-r-lg',
            config.bgColor,
            config.borderColor,
            config.textColor,
          )}
        >
          <div className="flex items-start gap-3">
            <Icon className={cn('h-6 w-6 flex-shrink-0 mt-1', config.iconColor)} />
            <div className="flex-1 min-w-0">
              {title && <h4 className="text-lg font-semibold mb-2">{title}</h4>}
              <div
                className="prose prose-sm dark:prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: content }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preview in Edit Mode */}
      {editable && content && (
        <div className="space-y-2">
          <Label>Preview</Label>
          <div
            className={cn(
              'p-6 border-l-4 rounded-r-lg',
              config.bgColor,
              config.borderColor,
              config.textColor,
            )}
          >
            <div className="flex items-start gap-3">
              <Icon className={cn('h-6 w-6 flex-shrink-0 mt-1', config.iconColor)} />
              <div className="flex-1 min-w-0">
                {title && <h4 className="text-lg font-semibold mb-2">{title}</h4>}
                <div
                  className="prose prose-sm dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: content }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
