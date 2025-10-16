import { GripVertical, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';

type ListStyle = 'bullet' | 'numbered';

export interface ListBlockMetadata {
  listStyle?: ListStyle;
  items?: string[];
}

interface ListBlockProps {
  metadata: ListBlockMetadata;
  onUpdate: (metadata: ListBlockMetadata) => void;
  language?: 'en' | 'fr';
  onLanguageChange?: (language: 'en' | 'fr') => void;
  editable?: boolean;
}

export function ListBlock({
  metadata,
  onUpdate,
  language = 'en',
  onLanguageChange,
  editable = true,
}: ListBlockProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const listStyle = metadata.listStyle || 'bullet';
  const items = metadata.items || [''];

  const handleStyleChange = (style: string) => {
    onUpdate({ ...metadata, listStyle: style as ListStyle });
  };

  const handleItemChange = (index: number, value: string) => {
    const newItems = [...items];
    newItems[index] = value;
    onUpdate({ ...metadata, items: newItems });
  };

  const handleAddItem = () => {
    if (items.length >= 20) return;
    const newItems = [...items, ''];
    onUpdate({ ...metadata, items: newItems });
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    const newItems = items.filter((_, i) => i !== index);
    onUpdate({ ...metadata, items: newItems });
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newItems = [...items];
    const draggedItem = newItems[draggedIndex];
    newItems.splice(draggedIndex, 1);
    newItems.splice(index, 0, draggedItem);

    setDraggedIndex(index);
    onUpdate({ ...metadata, items: newItems });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const ListTag = listStyle === 'bullet' ? 'ul' : 'ol';
  const listClasses = cn(
    'space-y-2',
    listStyle === 'bullet' ? 'list-disc list-inside' : 'list-decimal list-inside',
  );

  return (
    <div className="space-y-4">
      {/* List Controls */}
      {editable && (
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Label htmlFor="list-style" className="text-xs text-gray-600 dark:text-gray-400">
              List Style
            </Label>
            <Select value={listStyle} onValueChange={handleStyleChange}>
              <SelectTrigger id="list-style" className="h-8 w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bullet">Bullet</SelectItem>
                <SelectItem value="numbered">Numbered</SelectItem>
              </SelectContent>
            </Select>

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
          </div>

          <div className="text-xs text-gray-600 dark:text-gray-400">{items.length} / 20 items</div>
        </div>
      )}

      {/* List Items */}
      {editable ? (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div
              key={index}
              className={cn(
                'group flex items-center gap-2 p-2 rounded-lg border-2 transition-colors',
                draggedIndex === index
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600',
              )}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              {/* Drag Handle */}
              <div
                className="flex-shrink-0 cursor-grab active:cursor-grabbing text-gray-400 dark:text-gray-600"
                title="Drag to reorder"
              >
                <GripVertical className="h-5 w-5" />
              </div>

              {/* Item Number/Bullet */}
              <div className="flex-shrink-0 w-6 text-sm font-medium text-gray-600 dark:text-gray-400">
                {listStyle === 'numbered' ? `${index + 1}.` : '•'}
              </div>

              {/* Item Input */}
              <Input
                type="text"
                value={item}
                onChange={(e) => handleItemChange(index, e.target.value)}
                placeholder={`Item ${index + 1}`}
                className="flex-1 border-none shadow-none focus-visible:ring-0"
              />

              {/* Remove Button */}
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className={cn(
                  'h-8 w-8 flex-shrink-0 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950',
                  items.length <= 1 && 'opacity-0 pointer-events-none',
                )}
                onClick={() => handleRemoveItem(index)}
                title="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {/* Add Item Button */}
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={handleAddItem}
            disabled={items.length >= 20}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Item {items.length >= 20 && '(Max 20)'}
          </Button>
        </div>
      ) : (
        /* Display Mode */
        <ListTag className={listClasses}>
          {items.map((item, index) => (
            <li key={index} className="text-gray-900 dark:text-gray-100">
              {item}
            </li>
          ))}
        </ListTag>
      )}
    </div>
  );
}
