import { Minus } from 'lucide-react';

import { cn } from '../../../lib/utils';
import { ColorPicker } from '../../ui/color-picker';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';

type DividerStyle = 'solid' | 'dashed' | 'dotted';
type DividerWidth = 'full' | 'half' | 'quarter';

export interface DividerBlockMetadata {
  style?: DividerStyle;
  width?: DividerWidth;
  color?: string;
}

interface DividerBlockProps {
  metadata: DividerBlockMetadata;
  onUpdate: (metadata: DividerBlockMetadata) => void;
  editable?: boolean;
}

const DIVIDER_STYLES: { value: DividerStyle; label: string }[] = [
  { value: 'solid', label: 'Solid' },
  { value: 'dashed', label: 'Dashed' },
  { value: 'dotted', label: 'Dotted' },
];

const DIVIDER_WIDTHS: { value: DividerWidth; label: string; percent: string }[] = [
  { value: 'full', label: '100%', percent: '100%' },
  { value: 'half', label: '50%', percent: '50%' },
  { value: 'quarter', label: '25%', percent: '25%' },
];

export function DividerBlock({
  metadata,
  onUpdate,
  editable = true,
}: DividerBlockProps) {
  const style = metadata.style || 'solid';
  const width = metadata.width || 'full';
  const color = metadata.color || '#D1D5DB'; // Default gray-300

  const handleStyleChange = (newStyle: string) => {
    onUpdate({ ...metadata, style: newStyle as DividerStyle });
  };

  const handleWidthChange = (newWidth: string) => {
    onUpdate({ ...metadata, width: newWidth as DividerWidth });
  };

  const handleColorChange = (newColor: string) => {
    onUpdate({ ...metadata, color: newColor });
  };

  const widthPercent = DIVIDER_WIDTHS.find((w) => w.value === width)?.percent || '100%';

  const dividerClasses = cn(
    'border-t-2',
    style === 'dashed' && 'border-dashed',
    style === 'dotted' && 'border-dotted',
  );

  return (
    <div className="space-y-4">
      {/* Divider Controls */}
      {editable && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-2">
            <Label htmlFor="divider-style">Style</Label>
            <Select value={style} onValueChange={handleStyleChange}>
              <SelectTrigger id="divider-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIVIDER_STYLES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="divider-width">Width</Label>
            <Select value={width} onValueChange={handleWidthChange}>
              <SelectTrigger id="divider-width">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DIVIDER_WIDTHS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="divider-color">Color</Label>
            <ColorPicker
              value={color}
              onChange={handleColorChange}
            />
          </div>
        </div>
      )}

      {/* Divider Preview/Display */}
      <div className="py-6">
        <div className="flex justify-center items-center">
          <div
            className={dividerClasses}
            style={{
              width: widthPercent,
              borderColor: color,
            }}
          />
        </div>
      </div>

      {/* Settings Summary */}
      {editable && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
          <Minus className="h-3 w-3" />
          <span>
            {DIVIDER_STYLES.find((s) => s.value === style)?.label} •{' '}
            {DIVIDER_WIDTHS.find((w) => w.value === width)?.label} •{' '}
            {color.toUpperCase()}
          </span>
        </div>
      )}
    </div>
  );
}
