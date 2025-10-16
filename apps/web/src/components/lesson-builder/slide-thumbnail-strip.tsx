import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import {
  FileText,
  Columns2,
  Image as ImageIcon,
  HelpCircle,
  FileQuestion,
  LayoutTemplate,
} from 'lucide-react';

import type { Slide } from '../../types/lesson-builder';
import { SlideLayoutType } from '../../types/lesson-builder';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

import { SlideThumbnail } from './slide-thumbnail';

interface SlideThumbnailStripProps {
  slides: Slide[];
  currentSlideId: string | null;
  onSlideClick: (slideId: string) => void;
  onSlideDelete: (slideId: string) => void;
  onSlideDuplicate: (slideId: string) => void;
  onSlideReorder: (slides: Slide[]) => void;
  onAddSlide: (layout: SlideLayoutType) => void;
}

const SLIDE_LAYOUTS = [
  {
    type: SlideLayoutType.TITLE,
    name: 'Title Slide',
    icon: FileText,
    description: 'Large title with optional subtitle',
  },
  {
    type: SlideLayoutType.CONTENT,
    name: 'Content Slide',
    icon: FileQuestion,
    description: 'Standard content layout',
  },
  {
    type: SlideLayoutType.TWO_COLUMN,
    name: 'Two Column',
    icon: Columns2,
    description: 'Split content into two columns',
  },
  {
    type: SlideLayoutType.IMAGE_FOCUS,
    name: 'Image Focus',
    icon: ImageIcon,
    description: 'Large image with caption',
  },
  {
    type: SlideLayoutType.QUIZ,
    name: 'Quiz Slide',
    icon: HelpCircle,
    description: 'Interactive quiz question',
  },
  {
    type: SlideLayoutType.BLANK,
    name: 'Blank',
    icon: LayoutTemplate,
    description: 'Start from scratch',
  },
];

export function SlideThumbnailStrip({
  slides,
  currentSlideId,
  onSlideClick,
  onSlideDelete,
  onSlideDuplicate,
  onSlideReorder,
  onAddSlide,
}: SlideThumbnailStripProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = slides.findIndex((s) => s.id === active.id);
      const newIndex = slides.findIndex((s) => s.id === over.id);

      const reorderedSlides = arrayMove(slides, oldIndex, newIndex).map((slide, index) => ({
        ...slide,
        order: index,
      }));

      onSlideReorder(reorderedSlides);
    }
  };

  return (
    <div className="flex h-full flex-col bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Slides</h2>
        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
          {slides.length} slide{slides.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Scrollable Thumbnail List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={slides.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            {slides.map((slide, index) => (
              <SlideThumbnail
                key={slide.id}
                slide={slide}
                index={index}
                isActive={slide.id === currentSlideId}
                onClick={() => onSlideClick(slide.id)}
                onDelete={() => onSlideDelete(slide.id)}
                onDuplicate={() => onSlideDuplicate(slide.id)}
              />
            ))}
          </SortableContext>
        </DndContext>

        {/* Empty State */}
        {slides.length === 0 && (
          <div className="text-center py-8">
            <div className="text-gray-400 dark:text-gray-600 mb-2">
              <LayoutTemplate className="h-12 w-12 mx-auto" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">No slides yet</p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              Create your first slide below
            </p>
          </div>
        )}
      </div>

      {/* Add Slide Button */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="w-full" variant="default">
              <Plus className="h-4 w-4 mr-2" />
              Add Slide
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Choose Layout</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {SLIDE_LAYOUTS.map((layout) => {
              const Icon = layout.icon;
              return (
                <DropdownMenuItem
                  key={layout.type}
                  onClick={() => onAddSlide(layout.type)}
                  className="cursor-pointer"
                >
                  <Icon className="h-4 w-4 mr-2" />
                  <div>
                    <div className="font-medium">{layout.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      {layout.description}
                    </div>
                  </div>
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
