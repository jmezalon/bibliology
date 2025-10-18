import type {
  CalloutBlockMetadata,
  ContentBlock,
  DividerBlockMetadata,
  HeadingBlockMetadata,
  ImageBlockMetadata,
  ListBlockMetadata,
  VerseBlockMetadata,
  VocabularyBlockMetadata,
} from '../../types/lesson-builder';
import { ContentBlockType } from '../../types/lesson-builder';
import { CalloutBlock } from '../lesson-builder/blocks/callout-block';
import { DividerBlock } from '../lesson-builder/blocks/divider-block';
import { HeadingBlock } from '../lesson-builder/blocks/heading-block';
import { ImageBlock } from '../lesson-builder/blocks/image-block';
import { ListBlock } from '../lesson-builder/blocks/list-block';
import { TextBlock } from '../lesson-builder/blocks/text-block';
import { VerseBlock } from '../lesson-builder/blocks/verse-block';
import { VocabularyBlock } from '../lesson-builder/blocks/vocabulary-block';

interface SlideContentRendererProps {
  blocks: ContentBlock[];
  language: 'en' | 'fr';
}

/**
 * SlideContentRenderer
 * Renders content blocks in read-only mode for students
 */
export function SlideContentRenderer({ blocks, language }: SlideContentRendererProps) {
  if (!blocks || blocks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 dark:text-gray-600">
        <p className="text-lg">No content available for this slide</p>
      </div>
    );
  }

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  const renderBlock = (block: ContentBlock) => {
    const commonProps = {
      editable: false,
      language,
    };

    switch (block.type) {
      case ContentBlockType.TEXT:
        return (
          <TextBlock
            key={block.id}
            content={block.content}
            onUpdate={() => {}}
            {...commonProps}
          />
        );

      case ContentBlockType.HEADING:
        return (
          <HeadingBlock
            key={block.id}
            content={block.content}
            onUpdate={() => {}}
            metadata={(block.metadata as HeadingBlockMetadata) || {}}
            {...commonProps}
          />
        );

      case ContentBlockType.IMAGE:
        return (
          <ImageBlock
            key={block.id}
            metadata={(block.metadata as ImageBlockMetadata) || {}}
            onUpdate={() => {}}
            {...commonProps}
          />
        );

      case ContentBlockType.VERSE:
        return (
          <VerseBlock
            key={block.id}
            content={block.content}
            onUpdate={() => {}}
            metadata={(block.metadata as VerseBlockMetadata) || {}}
            {...commonProps}
          />
        );

      case ContentBlockType.VOCABULARY:
        return (
          <VocabularyBlock
            key={block.id}
            content={block.content}
            onUpdate={() => {}}
            metadata={(block.metadata as VocabularyBlockMetadata) || {}}
            {...commonProps}
          />
        );

      case ContentBlockType.LIST:
        return (
          <ListBlock
            key={block.id}
            metadata={(block.metadata as ListBlockMetadata) || {}}
            onUpdate={() => {}}
            {...commonProps}
          />
        );

      case ContentBlockType.CALLOUT:
        return (
          <CalloutBlock
            key={block.id}
            content={block.content}
            onUpdate={() => {}}
            metadata={(block.metadata as CalloutBlockMetadata) || {}}
            {...commonProps}
          />
        );

      case ContentBlockType.DIVIDER:
        return (
          <DividerBlock
            key={block.id}
            metadata={(block.metadata as DividerBlockMetadata) || {}}
            onUpdate={() => {}}
            {...commonProps}
          />
        );

      default:
        return (
          <div key={block.id} className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Unknown block type: {block.type}
            </p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
      {sortedBlocks.map((block) => renderBlock(block))}
    </div>
  );
}
