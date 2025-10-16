import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AlertCircle, Copy, GripVertical, Settings, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { validateBlock } from '../../lib/block-validation';
import { cn } from '../../lib/utils';
import type { ContentBlock as ContentBlockType } from '../../types/lesson-builder';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

import { CalloutBlock } from './blocks/callout-block';
import { DividerBlock } from './blocks/divider-block';
import { HeadingBlock } from './blocks/heading-block';
import { ImageBlock } from './blocks/image-block';
import { ListBlock } from './blocks/list-block';
import { TextBlock } from './blocks/text-block';
import { VerseBlock } from './blocks/verse-block';
import { VocabularyBlock } from './blocks/vocabulary-block';

interface ContentBlockProps {
  block: ContentBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: string, metadata?: ContentBlockType['metadata']) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  isDragging?: boolean;
}

export function ContentBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  onDuplicate,
  isDragging = false,
}: ContentBlockProps) {
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [currentLanguage, setCurrentLanguage] = useState<'en' | 'fr'>('en');

  // Drag and drop setup
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({
    id: block.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Validate block
  const validation = validateBlock(
    block.type,
    block.content,
    block.metadata as Record<string, unknown>,
  );
  const hasValidationErrors = !validation.isValid;

  // Render the appropriate block component
  const renderBlockContent = () => {
    const commonProps = {
      editable: true,
      language: currentLanguage,
      onLanguageChange: setCurrentLanguage,
    };

    switch (block.type) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'TEXT':
        return (
          <TextBlock
            content={block.content}
            onUpdate={(content) => onUpdate(content, block.metadata)}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'HEADING':
        return (
          <HeadingBlock
            content={block.content}
            onUpdate={onUpdate}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={block.metadata as any}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'IMAGE':
        return (
          <ImageBlock
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={(block.metadata || {}) as any}
            onUpdate={(metadata) => onUpdate(block.content, metadata)}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'VERSE':
        return (
          <VerseBlock
            content={block.content}
            onUpdate={onUpdate}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={block.metadata as any}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'VOCABULARY':
        return (
          <VocabularyBlock
            content={block.content}
            onUpdate={onUpdate}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={block.metadata as any}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'LIST':
        return (
          <ListBlock
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={(block.metadata || {}) as any}
            onUpdate={(metadata) => onUpdate(block.content, metadata)}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'CALLOUT':
        return (
          <CalloutBlock
            content={block.content}
            onUpdate={onUpdate}
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={block.metadata as any}
            {...commonProps}
          />
        );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-enum-comparison
      case 'DIVIDER':
        return (
          <DividerBlock
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-explicit-any
            metadata={(block.metadata || {}) as any}
            onUpdate={(metadata) => onUpdate(block.content, metadata)}
            editable={true}
          />
        );

      default:
        return (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Unknown block type: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group rounded-lg border-2 p-4 transition-all',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800 shadow-lg'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700',
        (isDragging || isSortableDragging) && 'opacity-50',
      )}
      onClick={onSelect}
    >
      {/* Block Type Badge */}
      <div
        className={cn(
          'absolute -top-2 -left-2 z-10 px-2 py-0.5 text-xs font-medium rounded',
          'bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600',
          hasValidationErrors && 'bg-amber-100 dark:bg-amber-900 border-amber-500',
        )}
      >
        <div className="flex items-center gap-1">
          <span>{block.type}</span>
          {hasValidationErrors && (
            <AlertCircle className="h-3 w-3 text-amber-600 dark:text-amber-400" />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        className={cn(
          'absolute -top-2 -right-2 z-10 flex items-center gap-1 transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        {/* Settings */}
        <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
          <PopoverTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-6 w-6 bg-white dark:bg-gray-800 hover:bg-blue-50 hover:text-blue-600 border border-gray-300 dark:border-gray-600 shadow-sm"
              onClick={(e) => {
                e.stopPropagation();
                setSettingsOpen(true);
              }}
              title="Block settings"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64" align="end">
            <div className="space-y-3">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Block Settings</h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">{block.type} Block</p>
              </div>

              {hasValidationErrors && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <p className="font-medium text-amber-800 dark:text-amber-200 mb-1">
                        Validation Errors
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-amber-700 dark:text-amber-300">
                        {validation.errors.map((error, i) => (
                          <li key={i}>{error.message}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Block ID:</span>
                  <span className="font-mono">{block.id.slice(0, 8)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Order:</span>
                  <span>{block.order + 1}</span>
                </div>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        {/* Duplicate */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 bg-white dark:bg-gray-800 hover:bg-green-50 hover:text-green-600 border border-gray-300 dark:border-gray-600 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDuplicate();
          }}
          title="Duplicate block"
        >
          <Copy className="h-3 w-3" />
        </Button>

        {/* Delete */}
        <Button
          size="icon"
          variant="ghost"
          className="h-6 w-6 bg-white dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 border border-gray-300 dark:border-gray-600 shadow-sm"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          title="Delete block"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Drag Handle */}
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute -left-8 top-1/2 -translate-y-1/2 flex h-8 w-6 items-center justify-center rounded-md',
          'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600',
          'cursor-grab active:cursor-grabbing transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>

      {/* Content */}
      <div className="relative">{renderBlockContent()}</div>
    </div>
  );
}
