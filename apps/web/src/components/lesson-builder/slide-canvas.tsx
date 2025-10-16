import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus, FileText } from 'lucide-react';
import { useState } from 'react';

import type { Slide, ContentBlockType } from '../../types/lesson-builder';
import { Button } from '../ui/button';

import { BlockPalette } from './block-palette';
import { ContentBlock } from './content-block';

interface SlideCanvasProps {
  slide: Slide | null;
  onContentBlockUpdate: (
    blockId: string,
    content: string,
    metadata?: Record<string, unknown>,
  ) => void;
  onContentBlockDelete: (blockId: string) => void;
  onContentBlockAdd: (type: ContentBlockType) => void;
  onContentBlockDuplicate?: (blockId: string) => void;
  onContentBlockReorder?: (blockOrders: { block_id: string; order: number }[]) => void;
}

export function SlideCanvas({
  slide,
  onContentBlockUpdate,
  onContentBlockDelete,
  onContentBlockAdd,
  onContentBlockDuplicate,
  onContentBlockReorder,
}: SlideCanvasProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showPalette, setShowPalette] = useState(false);

  // Configure drag and drop sensors
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

    if (!over || !slide) return;

    if (active.id !== over.id) {
      const oldIndex = slide.content_blocks.findIndex((block) => block.id === active.id);
      const newIndex = slide.content_blocks.findIndex((block) => block.id === over.id);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reorderedBlocks = arrayMove(slide.content_blocks, oldIndex, newIndex);

        // Update order values
        const blockOrders = reorderedBlocks.map((block, index) => ({
          block_id: block.id,
          order: index,
        }));

        // Call reorder callback
        if (onContentBlockReorder) {
          onContentBlockReorder(blockOrders);
        }
      }
    }
  };

  const handleDuplicate = (blockId: string) => {
    if (onContentBlockDuplicate) {
      onContentBlockDuplicate(blockId);
    }
  };

  if (!slide) {
    return (
      <div className="flex h-full items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-400 dark:text-gray-600 mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            No Slide Selected
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Select a slide from the left panel or create a new one
          </p>
        </div>
      </div>
    );
  }

  const sortedBlocks = [...slide.content_blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="relative h-full overflow-y-auto bg-white dark:bg-gray-800">
      {/* Canvas Container - Simulates slide aspect ratio */}
      <div className="min-h-full p-8">
        <div
          className="mx-auto bg-white dark:bg-gray-900 shadow-2xl rounded-lg overflow-hidden"
          style={{
            width: '100%',
            maxWidth: '960px',
            minHeight: '540px',
            aspectRatio: '16 / 9',
          }}
        >
          {/* Slide Content Area */}
          <div className="h-full p-12 overflow-y-auto">
            {/* Slide Title */}
            {slide.title_en && (
              <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">
                {slide.title_en}
              </h1>
            )}

            {/* Content Blocks with Drag and Drop */}
            {sortedBlocks.length > 0 ? (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={sortedBlocks.map((block) => block.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-6 pl-10">
                    {sortedBlocks.map((block) => (
                      <ContentBlock
                        key={block.id}
                        block={block}
                        isSelected={block.id === selectedBlockId}
                        onSelect={() => setSelectedBlockId(block.id)}
                        onUpdate={(
                          content: string,
                          // eslint-disable-next-line @typescript-eslint/no-explicit-any
                          metadata?: any,
                        ) =>
                          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                          onContentBlockUpdate(block.id, content, metadata)
                        }
                        onDelete={() => onContentBlockDelete(block.id)}
                        onDuplicate={() => handleDuplicate(block.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            ) : (
              /* Empty State */
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <Plus className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    No Content Yet
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Click the button below to add your first content block
                  </p>
                  <Button onClick={() => setShowPalette(true)} variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Block Palette */}
      {sortedBlocks.length > 0 && (
        <BlockPalette
          open={showPalette}
          onOpenChange={setShowPalette}
          onSelectBlockType={(type) => {
            onContentBlockAdd(type);
            setShowPalette(false);
          }}
        />
      )}
    </div>
  );
}
