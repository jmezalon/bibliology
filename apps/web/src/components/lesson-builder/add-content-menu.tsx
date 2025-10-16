import { Type, Heading1, Image, BookOpen, List, MessageSquare, Minus } from 'lucide-react';

import { ContentBlockType } from '../../types/lesson-builder';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface AddContentMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onSelectBlockType: (type: ContentBlockType) => void;
}

const CONTENT_BLOCKS = [
  {
    type: ContentBlockType.HEADING,
    name: 'Heading',
    icon: Heading1,
    description: 'Large section heading',
  },
  {
    type: ContentBlockType.TEXT,
    name: 'Text',
    icon: Type,
    description: 'Rich text paragraph',
  },
  {
    type: ContentBlockType.IMAGE,
    name: 'Image',
    icon: Image,
    description: 'Image with caption',
  },
  {
    type: ContentBlockType.VERSE,
    name: 'Bible Verse',
    icon: BookOpen,
    description: 'Scripture reference',
  },
  {
    type: ContentBlockType.LIST,
    name: 'List',
    icon: List,
    description: 'Bulleted or numbered list',
  },
  {
    type: ContentBlockType.CALLOUT,
    name: 'Callout',
    icon: MessageSquare,
    description: 'Highlighted box',
  },
  {
    type: ContentBlockType.DIVIDER,
    name: 'Divider',
    icon: Minus,
    description: 'Visual separator',
  },
];

export function AddContentMenu({
  children,
  open,
  onOpenChange,
  onSelectBlockType,
}: AddContentMenuProps) {
  return (
    <DropdownMenu open={open} onOpenChange={onOpenChange}>
      <DropdownMenuTrigger asChild>{children}</DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Add Content Block</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {CONTENT_BLOCKS.map((block) => {
          const Icon = block.icon;
          return (
            <DropdownMenuItem
              key={block.type}
              onClick={() => onSelectBlockType(block.type)}
              className="cursor-pointer"
            >
              <Icon className="h-4 w-4 mr-2" />
              <div>
                <div className="font-medium">{block.name}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{block.description}</div>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
