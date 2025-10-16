import { Layout } from 'lucide-react';

import type { Slide, SlideLayoutType } from '../../types/lesson-builder';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface SlideToolbarProps {
  slide: Slide | null;
  onLayoutChange: (layout: SlideLayoutType) => void;
}

const LAYOUTS = [
  { value: 'TITLE', label: 'Title Slide' },
  { value: 'CONTENT', label: 'Content' },
  { value: 'TWO_COLUMN', label: 'Two Column' },
  { value: 'IMAGE_FOCUS', label: 'Image Focus' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'BLANK', label: 'Blank' },
];

export function SlideToolbar({ slide, onLayoutChange }: SlideToolbarProps) {
  if (!slide) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      {/* Layout Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Layout className="h-4 w-4 mr-2" />
            Layout
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>Choose Layout</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {LAYOUTS.map((layout) => (
            <DropdownMenuItem
              key={layout.value}
              onClick={() => onLayoutChange(layout.value as SlideLayoutType)}
              className="cursor-pointer"
            >
              {layout.label}
              {slide.layout === (layout.value as SlideLayoutType) && (
                <span className="ml-auto text-blue-600">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Current Layout Display */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {LAYOUTS.find((l) => l.value === (slide.layout as string))?.label || slide.layout}
      </div>
    </div>
  );
}
