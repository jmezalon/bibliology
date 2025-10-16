import { Check } from 'lucide-react';
import { useState } from 'react';

import { cn } from '../../lib/utils';

import { Button } from './button';
import { Popover, PopoverContent, PopoverTrigger } from './popover';

const DEFAULT_COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'Dark Gray', value: '#4B5563' },
  { label: 'Gray', value: '#9CA3AF' },
  { label: 'Light Gray', value: '#D1D5DB' },
  { label: 'Red', value: '#EF4444' },
  { label: 'Orange', value: '#F97316' },
  { label: 'Amber', value: '#F59E0B' },
  { label: 'Yellow', value: '#EAB308' },
  { label: 'Lime', value: '#84CC16' },
  { label: 'Green', value: '#22C55E' },
  { label: 'Emerald', value: '#10B981' },
  { label: 'Teal', value: '#14B8A6' },
  { label: 'Cyan', value: '#06B6D4' },
  { label: 'Sky', value: '#0EA5E9' },
  { label: 'Blue', value: '#3B82F6' },
  { label: 'Indigo', value: '#6366F1' },
  { label: 'Violet', value: '#8B5CF6' },
  { label: 'Purple', value: '#A855F7' },
  { label: 'Fuchsia', value: '#D946EF' },
  { label: 'Pink', value: '#EC4899' },
  { label: 'Rose', value: '#F43F5E' },
];

interface ColorPickerProps {
  value?: string;
  onChange: (color: string) => void;
  colors?: { label: string; value: string }[];
  className?: string;
}

export function ColorPicker({
  value,
  onChange,
  colors = DEFAULT_COLORS,
  className,
}: ColorPickerProps) {
  const [open, setOpen] = useState(false);
  const [customColor, setCustomColor] = useState(value || '#000000');

  const handleColorSelect = (color: string) => {
    onChange(color);
    setOpen(false);
  };

  const handleCustomColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value;
    setCustomColor(newColor);
    onChange(newColor);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn('w-full justify-start gap-2', className)}
          role="combobox"
          aria-expanded={open}
        >
          <div
            className="h-5 w-5 rounded border border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: value || '#000000' }}
          />
          <span className="flex-1 text-left truncate">{value || 'Select color'}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-3" align="start">
        <div className="space-y-3">
          {/* Custom Color Input */}
          <div className="space-y-2">
            <label
              htmlFor="custom-color"
              className="text-xs font-medium text-gray-700 dark:text-gray-300"
            >
              Custom Color
            </label>
            <div className="flex gap-2">
              <input
                id="custom-color"
                type="color"
                value={customColor}
                onChange={handleCustomColorChange}
                className="h-9 w-16 rounded border border-gray-300 dark:border-gray-600 cursor-pointer"
              />
              <input
                type="text"
                value={customColor.toUpperCase()}
                onChange={(e) => {
                  const newColor = e.target.value;
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(newColor)) {
                    setCustomColor(newColor);
                    if (newColor.length === 7) {
                      onChange(newColor);
                    }
                  }
                }}
                placeholder="#000000"
                className="flex-1 h-9 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm font-mono"
              />
            </div>
          </div>

          {/* Preset Colors */}
          <div className="space-y-2">
            <label className="text-xs font-medium text-gray-700 dark:text-gray-300">
              Preset Colors
            </label>
            <div className="grid grid-cols-7 gap-2">
              {colors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  onClick={() => handleColorSelect(color.value)}
                  className={cn(
                    'h-8 w-8 rounded border-2 transition-all hover:scale-110',
                    value === color.value
                      ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800'
                      : 'border-gray-300 dark:border-gray-600',
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.label}
                  aria-label={color.label}
                >
                  {value === color.value && (
                    <Check className="h-4 w-4 mx-auto text-white drop-shadow-md" strokeWidth={3} />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
