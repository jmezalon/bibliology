import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Copy, GripVertical, Trash2 } from 'lucide-react';
import { useState, memo } from 'react';

import { cn } from '../../lib/utils';
import type { Slide } from '../../types/lesson-builder';
import { Button } from '../ui/button';

interface SlideThumbnailProps {
  slide: Slide;
  index: number;
  isActive: boolean;
  onClick: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export const SlideThumbnail = memo(function SlideThumbnail({
  slide,
  index,
  isActive,
  onClick,
  onDelete,
  onDuplicate,
}: SlideThumbnailProps) {
  const [isHovered, setIsHovered] = useState(false);

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: slide.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('relative group', isDragging && 'opacity-50 z-50')}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Slide Number Badge */}
      <div className="absolute -top-2 -left-2 z-10 flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-md">
        {index + 1}
      </div>

      {/* Thumbnail Container */}
      <div
        className={cn(
          'relative w-[180px] h-[120px] rounded-lg border-2 cursor-pointer transition-all duration-200 overflow-hidden bg-white dark:bg-gray-800 shadow-sm hover:shadow-md',
          isActive
            ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300',
        )}
        onClick={onClick}
      >
        {/* Slide Preview Content */}
        <div className="w-full h-full p-2 text-xs overflow-hidden">
          {/* Show slide title or layout type */}
          <div className="font-semibold truncate text-gray-900 dark:text-gray-100">
            {slide.title_en || slide.layout}
          </div>

          {/* Show content block count */}
          <div className="text-gray-600 dark:text-gray-400 text-xs mt-1">
            {slide.content_blocks.length} block{slide.content_blocks.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Hover Overlay with Actions */}
        {isHovered && !isDragging && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center gap-1 p-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-white/90 hover:bg-white text-gray-900"
              onClick={(e) => {
                e.stopPropagation();
                onDuplicate();
              }}
              title="Duplicate slide"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 bg-white/90 hover:bg-red-50 text-gray-900 hover:text-red-600"
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              title="Delete slide"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Drag Handle */}
      <button
        className={cn(
          'absolute -right-2 top-1/2 -translate-y-1/2 z-10 flex h-8 w-6 items-center justify-center rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 cursor-grab active:cursor-grabbing transition-opacity',
          isHovered ? 'opacity-100' : 'opacity-0',
        )}
        {...attributes}
        {...listeners}
        title="Drag to reorder"
      >
        <GripVertical className="h-4 w-4 text-gray-600 dark:text-gray-400" />
      </button>
    </div>
  );
});
