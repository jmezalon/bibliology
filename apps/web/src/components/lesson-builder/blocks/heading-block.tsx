import { AlignCenter, AlignLeft, AlignRight } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

type HeadingLevel = 1 | 2 | 3;
type TextAlignment = 'left' | 'center' | 'right';

interface HeadingBlockProps {
  content: string;
  onUpdate: (content: string, metadata?: HeadingBlockMetadata) => void;
  metadata?: HeadingBlockMetadata;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

export interface HeadingBlockMetadata {
  level?: HeadingLevel;
  alignment?: TextAlignment;
}

export function HeadingBlock({
  content,
  onUpdate,
  metadata = {},
  language = 'en',
  onLanguageChange,
  editable = true,
}: HeadingBlockProps) {
  const [text, setText] = useState(content);
  const level = metadata.level || 2;
  const alignment = metadata.alignment || 'left';

  const handleTextChange = (value: string) => {
    setText(value);
    onUpdate(value, metadata);
  };

  const handleLevelChange = (newLevel: string) => {
    onUpdate(content, { ...metadata, level: parseInt(newLevel) as HeadingLevel });
  };

  const handleAlignmentChange = (newAlignment: TextAlignment) => {
    onUpdate(content, { ...metadata, alignment: newAlignment });
  };

  const HeadingTag = `h${level}` as keyof JSX.IntrinsicElements;
  const headingClasses = cn(
    'font-bold text-gray-900 dark:text-gray-100',
    level === 1 && 'text-4xl',
    level === 2 && 'text-3xl',
    level === 3 && 'text-2xl',
    alignment === 'center' && 'text-center',
    alignment === 'right' && 'text-right',
    alignment === 'left' && 'text-left',
  );

  const characterCount = text.length;
  const maxLength = 200;

  return (
    <div className="space-y-3">
      {/* Controls */}
      {editable && (
        <div className="flex items-center gap-3 pb-2 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Label htmlFor="heading-level" className="text-xs text-gray-600 dark:text-gray-400">
              Level
            </Label>
            <Select value={level.toString()} onValueChange={handleLevelChange}>
              <SelectTrigger id="heading-level" className="h-8 w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">H1</SelectItem>
                <SelectItem value="2">H2</SelectItem>
                <SelectItem value="3">H3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-1">
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', alignment === 'left' && 'bg-gray-200 dark:bg-gray-700')}
              onClick={() => handleAlignmentChange('left')}
              title="Align left"
            >
              <AlignLeft className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', alignment === 'center' && 'bg-gray-200 dark:bg-gray-700')}
              onClick={() => handleAlignmentChange('center')}
              title="Align center"
            >
              <AlignCenter className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              className={cn('h-8 w-8', alignment === 'right' && 'bg-gray-200 dark:bg-gray-700')}
              onClick={() => handleAlignmentChange('right')}
              title="Align right"
            >
              <AlignRight className="h-4 w-4" />
            </Button>
          </div>

          {onLanguageChange && (
            <>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
              <Select value={language} onValueChange={onLanguageChange}>
                <SelectTrigger className="h-8 w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">EN</SelectItem>
                  <SelectItem value="fr">FR</SelectItem>
                </SelectContent>
              </Select>
            </>
          )}

          <div className="ml-auto text-xs text-gray-600 dark:text-gray-400">
            <span
              className={cn(
                characterCount > maxLength && 'text-red-600 dark:text-red-400 font-semibold',
              )}
            >
              {characterCount} / {maxLength}
            </span>
          </div>
        </div>
      )}

      {/* Heading Input/Display */}
      {editable ? (
        <Input
          type="text"
          value={text}
          onChange={(e) => handleTextChange(e.target.value)}
          placeholder="Enter heading text..."
          className={cn('border-none shadow-none focus-visible:ring-0', headingClasses)}
          maxLength={maxLength}
        />
      ) : (
        <HeadingTag className={headingClasses}>{text}</HeadingTag>
      )}
    </div>
  );
}
