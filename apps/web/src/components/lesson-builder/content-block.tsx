import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import Underline from '@tiptap/extension-underline';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { cn } from '../../lib/utils';
import type { ContentBlock as ContentBlockType } from '../../types/lesson-builder';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

interface ContentBlockProps {
  block: ContentBlockType;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (content: string, metadata?: ContentBlockType['metadata']) => void;
  onDelete: () => void;
}

export function ContentBlock({
  block,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
}: ContentBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [metadata, setMetadata] = useState(block.metadata || {});

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Placeholder.configure({
        placeholder: 'Start typing...',
      }),
    ],
    content: block.content,
    editable: isEditing,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML(), metadata);
    },
  });

  useEffect(() => {
    if (editor) {
      editor.setEditable(isEditing);
    }
  }, [isEditing, editor]);

  const handleDoubleClick = () => {
    setIsEditing(true);
    onSelect();
  };

  const handleBlur = () => {
    setIsEditing(false);
  };

  const renderBlockByType = () => {
    switch (block.type) {
      case 'TEXT' as typeof block.type:
        return (
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none min-h-[60px]',
              !isEditing && 'cursor-pointer',
            )}
            onDoubleClick={handleDoubleClick}
          >
            {isEditing && editor && (
              <div className="border-b border-gray-200 dark:border-gray-700 pb-2 mb-2 flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => editor.chain().focus().toggleBold().run()}
                  title="Bold"
                >
                  <Bold className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => editor.chain().focus().toggleItalic().run()}
                  title="Italic"
                >
                  <Italic className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => editor.chain().focus().toggleUnderline().run()}
                  title="Underline"
                >
                  <UnderlineIcon className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => editor.chain().focus().toggleBulletList().run()}
                  title="Bullet List"
                >
                  <List className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => editor.chain().focus().toggleOrderedList().run()}
                  title="Numbered List"
                >
                  <ListOrdered className="h-4 w-4" />
                </Button>
              </div>
            )}
            <EditorContent editor={editor} onBlur={handleBlur} />
          </div>
        );

      case 'HEADING' as typeof block.type:
        return (
          <div
            className={cn(
              'prose prose-lg dark:prose-invert max-w-none min-h-[60px]',
              !isEditing && 'cursor-pointer',
            )}
            onDoubleClick={handleDoubleClick}
          >
            <EditorContent editor={editor} onBlur={handleBlur} />
          </div>
        );

      case 'IMAGE' as typeof block.type:
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor={`image-url-${block.id}`}>Image URL</Label>
              <Input
                id={`image-url-${block.id}`}
                type="url"
                placeholder="https://example.com/image.jpg"
                value={metadata.imageUrl || ''}
                onChange={(e) => {
                  const newMetadata = { ...metadata, imageUrl: e.target.value };
                  setMetadata(newMetadata);
                  onUpdate(block.content, newMetadata);
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={`image-alt-${block.id}`}>Alt Text</Label>
              <Input
                id={`image-alt-${block.id}`}
                placeholder="Image description"
                value={metadata.imageAlt || ''}
                onChange={(e) => {
                  const newMetadata = { ...metadata, imageAlt: e.target.value };
                  setMetadata(newMetadata);
                  onUpdate(block.content, newMetadata);
                }}
              />
            </div>
            {metadata.imageUrl && (
              <img
                src={metadata.imageUrl}
                alt={metadata.imageAlt || ''}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700"
              />
            )}
          </div>
        );

      case 'VERSE' as typeof block.type:
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor={`verse-ref-${block.id}`}>Verse Reference</Label>
              <Input
                id={`verse-ref-${block.id}`}
                placeholder="e.g., John 3:16"
                value={metadata.verseReference || ''}
                onChange={(e) => {
                  const newMetadata = { ...metadata, verseReference: e.target.value };
                  setMetadata(newMetadata);
                  onUpdate(block.content, newMetadata);
                }}
              />
            </div>
            <div
              className={cn(
                'prose prose-sm dark:prose-invert max-w-none min-h-[60px]',
                !isEditing && 'cursor-pointer',
              )}
              onDoubleClick={handleDoubleClick}
            >
              <EditorContent editor={editor} onBlur={handleBlur} />
            </div>
            {metadata.verseReference && (
              <div className="text-sm text-gray-600 dark:text-gray-400 italic">
                — {metadata.verseReference}
              </div>
            )}
          </div>
        );

      case 'CALLOUT' as typeof block.type:
        return (
          <div className="space-y-2">
            <div className="space-y-2">
              <Label htmlFor={`callout-type-${block.id}`}>Callout Type</Label>
              <select
                id={`callout-type-${block.id}`}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={metadata.calloutType || 'info'}
                onChange={(e) => {
                  const newMetadata = {
                    ...metadata,
                    calloutType: e.target.value as 'info' | 'warning' | 'success' | 'error',
                  };
                  setMetadata(newMetadata);
                  onUpdate(block.content, newMetadata);
                }}
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="success">Success</option>
                <option value="error">Error</option>
              </select>
            </div>
            <div
              className={cn(
                'p-4 rounded-lg border-l-4',
                metadata.calloutType === 'info' && 'bg-blue-50 border-blue-500 dark:bg-blue-950',
                metadata.calloutType === 'warning' &&
                  'bg-yellow-50 border-yellow-500 dark:bg-yellow-950',
                metadata.calloutType === 'success' &&
                  'bg-green-50 border-green-500 dark:bg-green-950',
                metadata.calloutType === 'error' && 'bg-red-50 border-red-500 dark:bg-red-950',
                !isEditing && 'cursor-pointer',
              )}
              onDoubleClick={handleDoubleClick}
            >
              <EditorContent editor={editor} onBlur={handleBlur} />
            </div>
          </div>
        );

      default:
        return (
          <div
            className={cn(
              'prose prose-sm dark:prose-invert max-w-none min-h-[60px]',
              !isEditing && 'cursor-pointer',
            )}
            onDoubleClick={handleDoubleClick}
          >
            <EditorContent editor={editor} onBlur={handleBlur} />
          </div>
        );
    }
  };

  return (
    <div
      className={cn(
        'relative group rounded-lg border-2 p-4 transition-all',
        isSelected
          ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
          : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
      )}
      onClick={onSelect}
    >
      {/* Block Type Badge */}
      <div className="absolute -top-2 -left-2 z-10 px-2 py-0.5 text-xs font-medium bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded">
        {block.type}
      </div>

      {/* Delete Button */}
      <Button
        size="icon"
        variant="ghost"
        className={cn(
          'absolute -top-2 -right-2 z-10 h-6 w-6 bg-white dark:bg-gray-800 hover:bg-red-50 hover:text-red-600 border border-gray-300 dark:border-gray-600 shadow-sm transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
        title="Delete block"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Drag Handle */}
      <div
        className={cn(
          'absolute -left-8 top-1/2 -translate-y-1/2 flex h-8 w-6 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing transition-opacity',
          isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </div>

      {/* Content */}
      {renderBlockByType()}
    </div>
  );
}
