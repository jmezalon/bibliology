import { Palette, Image as ImageIcon, Layout } from 'lucide-react';
import { useState } from 'react';

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
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface SlideToolbarProps {
  slide: Slide | null;
  onLayoutChange: (layout: SlideLayoutType) => void;
  onBackgroundColorChange: (color: string) => void;
  onBackgroundImageChange: (url: string) => void;
}

const PRESET_COLORS = [
  '#FFFFFF',
  '#F3F4F6',
  '#E5E7EB',
  '#DBEAFE',
  '#BFDBFE',
  '#93C5FD',
  '#FEF3C7',
  '#FDE68A',
  '#FCA5A5',
  '#FECACA',
  '#D1FAE5',
  '#A7F3D0',
  '#E9D5FF',
  '#DDD6FE',
];

const LAYOUTS = [
  { value: 'TITLE', label: 'Title Slide' },
  { value: 'CONTENT', label: 'Content' },
  { value: 'TWO_COLUMN', label: 'Two Column' },
  { value: 'IMAGE_FOCUS', label: 'Image Focus' },
  { value: 'QUIZ', label: 'Quiz' },
  { value: 'BLANK', label: 'Blank' },
];

export function SlideToolbar({
  slide,
  onLayoutChange,
  onBackgroundColorChange,
  onBackgroundImageChange,
}: SlideToolbarProps) {
  const [customColor, setCustomColor] = useState(slide?.background_color || '#FFFFFF');
  const [imageUrl, setImageUrl] = useState(slide?.background_image_url || '');

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

      {/* Background Color Picker */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <Palette className="h-4 w-4 mr-2" />
            Background
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-semibold">Preset Colors</Label>
              <div className="grid grid-cols-7 gap-2 mt-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600 hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setCustomColor(color);
                      onBackgroundColorChange(color);
                    }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="custom-color">Custom Color</Label>
              <div className="flex gap-2">
                <Input
                  id="custom-color"
                  type="color"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  className="w-16 h-10 p-1"
                />
                <Input
                  type="text"
                  value={customColor}
                  onChange={(e) => setCustomColor(e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
                <Button size="sm" onClick={() => onBackgroundColorChange(customColor)}>
                  Apply
                </Button>
              </div>
            </div>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => onBackgroundColorChange('')}
            >
              Reset to Default
            </Button>
          </div>
        </PopoverContent>
      </Popover>

      {/* Background Image */}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="outline" size="sm">
            <ImageIcon className="h-4 w-4 mr-2" />
            Image
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bg-image-url">Background Image URL</Label>
              <Input
                id="bg-image-url"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
              />
            </div>

            {imageUrl && (
              <div className="border border-gray-200 dark:border-gray-700 rounded overflow-hidden">
                <img
                  src={imageUrl}
                  alt="Background preview"
                  className="w-full h-32 object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle"%3EError%3C/text%3E%3C/svg%3E';
                  }}
                />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onBackgroundImageChange(imageUrl)}
              >
                Apply Image
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => {
                  setImageUrl('');
                  onBackgroundImageChange('');
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Current Layout Display */}
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {LAYOUTS.find((l) => l.value === (slide.layout as string))?.label || slide.layout}
      </div>
    </div>
  );
}
