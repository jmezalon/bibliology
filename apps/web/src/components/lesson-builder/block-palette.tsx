import {
  Type,
  Heading1,
  Image,
  BookOpen,
  Languages,
  List,
  MessageSquare,
  Minus,
  Plus,
} from 'lucide-react';

import { cn } from '../../lib/utils';
import { ContentBlockType } from '../../types/lesson-builder';
import { Button } from '../ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';

interface BlockPaletteProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectBlockType: (type: ContentBlockType) => void;
}

interface BlockInfo {
  type: ContentBlockType;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  category: 'text' | 'media' | 'interactive' | 'layout';
}

const BLOCK_PALETTE: BlockInfo[] = [
  {
    type: ContentBlockType.TEXT,
    name: 'Text',
    description: 'Rich text paragraph with formatting',
    icon: Type,
    category: 'text',
  },
  {
    type: ContentBlockType.HEADING,
    name: 'Heading',
    description: 'Large section heading',
    icon: Heading1,
    category: 'text',
  },
  {
    type: ContentBlockType.IMAGE,
    name: 'Image',
    description: 'Image with caption and alt text',
    icon: Image,
    category: 'media',
  },
  {
    type: ContentBlockType.VERSE,
    name: 'Bible Verse',
    description: 'Scripture reference with text',
    icon: BookOpen,
    category: 'interactive',
  },
  {
    type: ContentBlockType.VOCABULARY,
    name: 'Vocabulary',
    description: 'Term with definition',
    icon: Languages,
    category: 'interactive',
  },
  {
    type: ContentBlockType.LIST,
    name: 'List',
    description: 'Bulleted or numbered list',
    icon: List,
    category: 'text',
  },
  {
    type: ContentBlockType.CALLOUT,
    name: 'Callout',
    description: 'Highlighted information box',
    icon: MessageSquare,
    category: 'interactive',
  },
  {
    type: ContentBlockType.DIVIDER,
    name: 'Divider',
    description: 'Visual separator line',
    icon: Minus,
    category: 'layout',
  },
];

const CATEGORY_LABELS: Record<string, string> = {
  text: 'Text',
  media: 'Media',
  interactive: 'Interactive',
  layout: 'Layout',
};

export function BlockPalette({ open, onOpenChange, onSelectBlockType }: BlockPaletteProps) {
  const blocksByCategory = BLOCK_PALETTE.reduce(
    (acc, block) => {
      if (!acc[block.category]) {
        acc[block.category] = [];
      }
      acc[block.category].push(block);
      return acc;
    },
    {} as Record<string, BlockInfo[]>,
  );

  return (
    <div className="fixed bottom-8 right-8 z-50">
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-2xl hover:shadow-xl transition-all hover:scale-105"
          >
            <Plus className="h-6 w-6" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" side="top" className="w-80 p-4" sideOffset={8}>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-lg mb-1">Add Content Block</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Choose a block type to add to your slide
              </p>
            </div>

            {Object.entries(blocksByCategory).map(([category, blocks]) => (
              <div key={category} className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  {CATEGORY_LABELS[category]}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  {blocks.map((block) => {
                    const Icon = block.icon;
                    return (
                      <button
                        key={block.type}
                        onClick={() => onSelectBlockType(block.type)}
                        className={cn(
                          'flex flex-col items-start gap-2 p-3 rounded-lg border-2 transition-all',
                          'border-gray-200 dark:border-gray-700',
                          'hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-950',
                          'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                          'text-left',
                        )}
                      >
                        <div className="flex items-center gap-2 w-full">
                          <Icon className="h-5 w-5 text-gray-700 dark:text-gray-300 flex-shrink-0" />
                          <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                            {block.name}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {block.description}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
