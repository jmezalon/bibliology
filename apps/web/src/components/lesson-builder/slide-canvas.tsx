import { Plus, FileText } from 'lucide-react';
import { useState } from 'react';

import type { Slide, ContentBlockType } from '../../types/lesson-builder';
import { Button } from '../ui/button';

import { AddContentMenu } from './add-content-menu';
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
}

export function SlideCanvas({
  slide,
  onContentBlockUpdate,
  onContentBlockDelete,
  onContentBlockAdd,
}: SlideCanvasProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

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
            backgroundColor: slide.background_color || undefined,
            backgroundImage: slide.background_image_url
              ? `url(${slide.background_image_url})`
              : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
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

            {/* Content Blocks */}
            {slide.content_blocks.length > 0 ? (
              <div className="space-y-6">
                {slide.content_blocks
                  .sort((a, b) => a.order - b.order)
                  .map((block) => (
                    <ContentBlock
                      key={block.id}
                      block={block}
                      isSelected={block.id === selectedBlockId}
                      onSelect={() => setSelectedBlockId(block.id)}
                      onUpdate={(content, metadata) =>
                        onContentBlockUpdate(block.id, content, metadata)
                      }
                      onDelete={() => onContentBlockDelete(block.id)}
                    />
                  ))}
              </div>
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
                  <Button onClick={() => setShowAddMenu(true)} variant="default">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Content
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Floating Add Content Button */}
      {slide.content_blocks.length > 0 && (
        <div className="fixed bottom-8 right-8 z-10">
          <AddContentMenu
            open={showAddMenu}
            onOpenChange={setShowAddMenu}
            onSelectBlockType={(type) => {
              onContentBlockAdd(type);
              setShowAddMenu(false);
            }}
          >
            <Button size="lg" className="rounded-full shadow-lg h-14 w-14 p-0">
              <Plus className="h-6 w-6" />
            </Button>
          </AddContentMenu>
        </div>
      )}
    </div>
  );
}
