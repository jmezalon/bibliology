# Lesson Builder Code Review - Prompts 11-13

## Executive Summary

**Overall Rating**: 7/10

The lesson builder implementation demonstrates solid architecture with good component organization, proper TypeScript typing, and comprehensive backend validation. However, there are several critical areas needing improvement around performance optimization, accessibility, security, and error handling.

---

## 1. Frontend Review

### 1.1 Component Structure & Organization ⭐⭐⭐⭐

**Strengths:**

- ✅ Clear component hierarchy with reusable blocks
- ✅ Good separation of concerns (content-block wrapper vs individual block components)
- ✅ Proper use of compound patterns (BlockPalette, ContentBlock)

**Issues:**

#### Issue #1: Missing Main Page Component

**Severity**: CRITICAL
**File**: N/A - Not found

The main lesson builder page component is missing. There's no integration point connecting the slide canvas and sidebar.

**Recommendation:**

```tsx
// apps/web/src/app/(dashboard)/courses/[courseId]/lessons/[lessonId]/builder/page.tsx
'use client';

import { use } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SlideCanvas } from '@/components/lesson-builder/slide-canvas';
import { SlideSidebar } from '@/components/lesson-builder/slide-sidebar';
import { SaveIndicator } from '@/components/lesson-builder/save-indicator';
import { useAutoSave } from '@/hooks/use-auto-save';
import { apiClient } from '@/lib/api-client';

export default function LessonBuilderPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = use(params);
  const queryClient = useQueryClient();

  // Fetch slides with React Query
  const { data: slides, isLoading } = useQuery({
    queryKey: ['lessons', lessonId, 'slides'],
    queryFn: () => apiClient.getSlides(lessonId),
  });

  const [selectedSlideId, setSelectedSlideId] = useState<string | null>(slides?.[0]?.id ?? null);

  // Auto-save implementation
  const autoSave = useAutoSave({
    onSave: async () => {
      // Save current slide state
      if (selectedSlideId && pendingChanges) {
        await apiClient.updateSlide(selectedSlideId, pendingChanges);
      }
    },
    delay: 2000,
  });

  return (
    <div className="flex h-screen">
      <SlideSidebar
        slides={slides ?? []}
        selectedId={selectedSlideId}
        onSelect={setSelectedSlideId}
        onAdd={handleAddSlide}
        onDelete={handleDeleteSlide}
      />
      <div className="flex-1 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h1>Lesson Builder</h1>
          <SaveIndicator status={autoSave.saveStatus} lastSaved={autoSave.lastSaved} />
        </div>
        <SlideCanvas
          slide={selectedSlide}
          onContentBlockUpdate={handleBlockUpdate}
          onContentBlockDelete={handleBlockDelete}
          onContentBlockAdd={handleBlockAdd}
        />
      </div>
    </div>
  );
}
```

#### Issue #2: Component File Organization

**Severity**: MEDIUM

All block components are in a flat `blocks/` directory. For 8+ block types, this can become difficult to navigate.

**Recommendation:**

```
components/lesson-builder/
├── blocks/
│   ├── text/
│   │   ├── text-block.tsx
│   │   ├── text-block.test.tsx
│   │   └── text-block.stories.tsx
│   ├── heading/
│   │   ├── heading-block.tsx
│   │   └── heading-settings.tsx
│   └── image/
│       ├── image-block.tsx
│       └── image-uploader.tsx
```

---

### 1.2 State Management (React Query) ⭐⭐⭐

**Issues:**

#### Issue #3: No React Query Integration Found

**Severity**: CRITICAL
**Files**: All component files

No React Query hooks are being used for API calls. This means:

- No automatic caching
- No optimistic updates
- Manual loading/error state management
- Potential state synchronization issues

**Recommendation:**

```tsx
// hooks/use-slides.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function useSlides(lessonId: string) {
  return useQuery({
    queryKey: ['lessons', lessonId, 'slides'],
    queryFn: () => apiClient.getSlides(lessonId),
    staleTime: 1000 * 60, // 1 minute
  });
}

export function useCreateContentBlock(slideId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBlockData) => apiClient.createContentBlock(slideId, data),
    onMutate: async (newBlock) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['slides', slideId] });

      // Snapshot previous value
      const previousSlide = queryClient.getQueryData(['slides', slideId]);

      // Optimistically update
      queryClient.setQueryData(['slides', slideId], (old: Slide) => ({
        ...old,
        content_blocks: [
          ...old.content_blocks,
          { ...newBlock, id: 'temp-' + Date.now(), order: old.content_blocks.length },
        ],
      }));

      return { previousSlide };
    },
    onError: (err, newBlock, context) => {
      // Rollback on error
      if (context?.previousSlide) {
        queryClient.setQueryData(['slides', slideId], context.previousSlide);
      }
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: ['slides', slideId] });
    },
  });
}
```

#### Issue #4: Missing Query Invalidation Strategy

**Severity**: HIGH

When slides or blocks are updated, related queries need to be invalidated.

**Recommendation:**

```tsx
// Use query keys consistently
const queryKeys = {
  lesson: (id: string) => ['lessons', id] as const,
  slides: (lessonId: string) => ['lessons', lessonId, 'slides'] as const,
  slide: (id: string) => ['slides', id] as const,
  blocks: (slideId: string) => ['slides', slideId, 'blocks'] as const,
};

// In mutation hooks
onSuccess: () => {
  void queryClient.invalidateQueries({ queryKey: queryKeys.slides(lessonId) });
  void queryClient.invalidateQueries({ queryKey: queryKeys.lesson(lessonId) });
};
```

---

### 1.3 Performance (Re-renders) ⭐⭐

**Issues:**

#### Issue #5: Unnecessary Re-renders in SlideCanvas

**Severity**: HIGH
**File**: `components/lesson-builder/slide-canvas.tsx:109`

Every time `slide.content_blocks` changes, the entire array is sorted:

```tsx
const sortedBlocks = [...slide.content_blocks].sort((a, b) => a.order - b.order);
```

This happens on every render, even if the blocks haven't changed.

**Fix:**

```tsx
import { useMemo } from 'react';

export function SlideCanvas({ slide, ...props }: SlideCanvasProps) {
  // Memoize sorted blocks
  const sortedBlocks = useMemo(() => {
    if (!slide) return [];
    return [...slide.content_blocks].sort((a, b) => a.order - b.order);
  }, [slide?.content_blocks]);

  // Rest of component...
}
```

#### Issue #6: Non-Memoized Callbacks

**Severity**: MEDIUM
**File**: `components/lesson-builder/content-block.tsx:157-163`

Inline arrow functions are recreated on every render:

```tsx
onUpdate={(content: string, metadata?: any) =>
  onContentBlockUpdate(block.id, content, metadata)
}
```

**Fix:**

```tsx
import { useCallback } from 'react';

export function ContentBlock({ block, onUpdate, ...props }: ContentBlockProps) {
  const handleUpdate = useCallback(
    (content: string, metadata?: ContentBlockType['metadata']) => {
      onUpdate(content, metadata);
    },
    [onUpdate],
  );

  const handleDelete = useCallback(() => {
    onDelete();
  }, [onDelete]);

  const handleDuplicate = useCallback(() => {
    onDuplicate();
  }, [onDuplicate]);

  // Use these memoized callbacks in renders
}
```

#### Issue #7: Missing React.memo for Block Components

**Severity**: MEDIUM

Block components re-render when parent re-renders, even if props haven't changed.

**Fix:**

```tsx
// blocks/text-block.tsx
import { memo } from 'react';

export const TextBlock = memo(
  function TextBlock({ content, onUpdate, editable }: TextBlockProps) {
    // Component implementation
  },
  (prevProps, nextProps) => {
    // Custom comparison for better performance
    return (
      prevProps.content === nextProps.content &&
      prevProps.editable === nextProps.editable &&
      prevProps.language === nextProps.language
    );
  },
);
```

---

### 1.4 Accessibility (Keyboard & ARIA) ⭐⭐

**Issues:**

#### Issue #8: Missing Keyboard Shortcuts

**Severity**: HIGH

The lesson builder lacks keyboard shortcuts for common operations.

**Recommendation:**

```tsx
// hooks/use-keyboard-shortcuts.ts
import { useEffect } from 'react';

export function useKeyboardShortcuts(handlers: {
  onSave?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMac ? e.metaKey : e.ctrlKey;

      if (modifier) {
        switch (e.key.toLowerCase()) {
          case 's':
            e.preventDefault();
            handlers.onSave?.();
            break;
          case 'z':
            e.preventDefault();
            if (e.shiftKey) {
              handlers.onRedo?.();
            } else {
              handlers.onUndo?.();
            }
            break;
          case 'd':
            e.preventDefault();
            handlers.onDuplicate?.();
            break;
        }
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        // Only if content block is selected and not editing
        handlers.onDelete?.();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handlers]);
}

// Usage in main page
useKeyboardShortcuts({
  onSave: () => autoSave.triggerSave(),
  onDelete: () => selectedBlockId && handleDeleteBlock(selectedBlockId),
  onDuplicate: () => selectedBlockId && handleDuplicateBlock(selectedBlockId),
});
```

#### Issue #9: Missing ARIA Labels

**Severity**: MEDIUM
**File**: `components/lesson-builder/content-block.tsx:178-315`

Drag handles and action buttons lack proper ARIA labels.

**Fix:**

```tsx
{
  /* Drag Handle */
}
<div
  {...attributes}
  {...listeners}
  role="button"
  tabIndex={0}
  aria-label={`Drag to reorder ${block.type} block`}
  onKeyDown={(e) => {
    // Handle keyboard drag
    if (e.key === 'ArrowUp' && onMoveUp) {
      e.preventDefault();
      onMoveUp();
    } else if (e.key === 'ArrowDown' && onMoveDown) {
      e.preventDefault();
      onMoveDown();
    }
  }}
  className={/* ... */}
>
  <GripVertical className="h-4 w-4" aria-hidden="true" />
</div>;

{
  /* Settings Button */
}
<Button
  aria-label={`Settings for ${block.type} block`}
  aria-expanded={settingsOpen}
  aria-haspopup="dialog"
  // ...
>
  <Settings className="h-3 w-3" aria-hidden="true" />
</Button>;
```

#### Issue #10: No Focus Management

**Severity**: MEDIUM

When adding/deleting blocks, focus is not managed, making keyboard navigation difficult.

**Fix:**

```tsx
import { useRef, useEffect } from 'react';

export function SlideCanvas({ slide, ... }: SlideCanvasProps) {
  const blockRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const lastAddedBlockId = useRef<string | null>(null);

  useEffect(() => {
    // Focus newly added block
    if (lastAddedBlockId.current) {
      const blockElement = blockRefs.current.get(lastAddedBlockId.current);
      if (blockElement) {
        blockElement.focus();
        lastAddedBlockId.current = null;
      }
    }
  }, [slide?.content_blocks]);

  const handleAddBlock = useCallback(async (type: ContentBlockType) => {
    const newBlock = await createBlock(type);
    lastAddedBlockId.current = newBlock.id;
  }, []);

  return (
    <div>
      {sortedBlocks.map((block) => (
        <div
          key={block.id}
          ref={(el) => {
            if (el) blockRefs.current.set(block.id, el);
          }}
          tabIndex={-1}
        >
          <ContentBlock block={block} {...props} />
        </div>
      ))}
    </div>
  );
}
```

---

### 1.5 TypeScript Type Safety ⭐⭐⭐⭐

**Strengths:**

- ✅ Good use of discriminated unions for content block types
- ✅ Proper typing for props interfaces
- ✅ Good use of type imports

**Issues:**

#### Issue #11: Excessive use of `any` and `as any`

**Severity**: MEDIUM
**File**: `components/lesson-builder/content-block.tsx:94,104,117,129,139,152,162`

Multiple instances of `as any` casting bypass type safety:

```tsx
metadata={block.metadata as any}
```

**Fix:**
Create proper type guards and narrow types:

```tsx
// types/lesson-builder.ts
export type HeadingBlockMetadata = {
  level: 1 | 2 | 3;
  alignment?: 'left' | 'center' | 'right';
};

export type ImageBlockMetadata = {
  imageUrl: string;
  imageAlt: string;
  caption?: string;
};

// Type guard function
function isHeadingBlock(
  block: ContentBlock,
): block is ContentBlock & { type: ContentBlockType.HEADING; metadata: HeadingBlockMetadata } {
  return block.type === ContentBlockType.HEADING;
}

// Usage in component
const renderBlockContent = () => {
  if (isHeadingBlock(block)) {
    return (
      <HeadingBlock
        content={block.content}
        onUpdate={onUpdate}
        metadata={block.metadata} // Now properly typed!
        {...commonProps}
      />
    );
  }
  // ... other blocks
};
```

---

## 2. Backend Review

### 2.1 API Endpoint Design ⭐⭐⭐⭐

**Strengths:**

- ✅ RESTful design with nested routes
- ✅ Proper HTTP verbs and status codes
- ✅ Comprehensive Swagger documentation
- ✅ Good separation of concerns (Controllers, Services, DTOs)

**Issues:**

#### Issue #12: Missing Pagination for Slides

**Severity**: MEDIUM
**File**: `api/src/courses/slides/slides.controller.ts:186-201`

The `GET /lessons/:lessonId/slides` endpoint returns all slides without pagination. For lessons with 100+ slides, this could be a performance issue.

**Recommendation:**

```typescript
// slides.controller.ts
@Get()
@Roles(UserRole.TEACHER, UserRole.ADMIN)
@ApiOperation({ summary: 'Get all slides for a lesson with optional pagination' })
@ApiQuery({ name: 'page', required: false, type: Number })
@ApiQuery({ name: 'limit', required: false, type: Number })
@ApiQuery({ name: 'includeBlocks', required: false, type: Boolean, description: 'Include content blocks in response' })
async findAllForLesson(
  @Param('lessonId') lessonId: string,
  @CurrentUser('id') teacherId: string,
  @Query('page', new DefaultValuePipe(1), ParseIntPipe) page?: number,
  @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit?: number,
  @Query('includeBlocks', new DefaultValuePipe(false)) includeBlocks?: boolean,
): Promise<SlideResponseDto[] | PaginatedResponse<SlideResponseDto>> {
  if (page && limit) {
    return this.slidesService.findAllForLessonPaginated(
      lessonId,
      teacherId,
      page,
      limit,
      includeBlocks
    );
  }
  return this.slidesService.findAllForLesson(lessonId, teacherId, includeBlocks);
}
```

#### Issue #13: No Partial Updates for Nested Blocks

**Severity**: LOW

Updating a slide requires sending all content blocks even if only one changed.

**Recommendation:**

```typescript
// Add PATCH endpoint for individual block updates
@Patch(':slideId/blocks/:blockId')
async updateSingleBlock(
  @Param('slideId') slideId: string,
  @Param('blockId') blockId: string,
  @CurrentUser('id') teacherId: string,
  @Body() updateDto: UpdateContentBlockDto,
): Promise<ContentBlockResponseDto> {
  return this.contentBlocksService.update(blockId, teacherId, updateDto);
}
```

---

### 2.2 Database Query Optimization ⭐⭐⭐

**Issues:**

#### Issue #14: N+1 Query Problem

**Severity**: HIGH
**File**: `api/src/courses/slides/slides.service.ts:85-100`

The `findOne` method includes both `content_blocks` AND `lesson.course.teacher_id`, which creates multiple queries.

**Current:**

```typescript
const slide = await this.prisma.slide.findUnique({
  where: { id: slideId },
  include: {
    content_blocks: {
      orderBy: { block_order: 'asc' },
    },
    lesson: {
      select: {
        id: true,
        course_id: true,
        course: { select: { teacher_id: true } },
      },
    },
  },
});
```

This generates multiple queries. Better approach:

**Fix:**

```typescript
// Optimize by selecting only what's needed for ownership check first
async findOne(slideId: string, teacherId?: string): Promise<SlideResponseDto> {
  // First query: Get slide with ownership info (minimal data)
  const slideForAuth = await this.prisma.slide.findUnique({
    where: { id: slideId },
    select: {
      id: true,
      lesson: {
        select: {
          id: true,
          course_id: true,
        },
      },
    },
  });

  if (!slideForAuth) {
    throw new NotFoundException('Slide not found');
  }

  if (teacherId) {
    await this.coursesService.verifyOwnership(slideForAuth.lesson.course_id, teacherId);
  }

  // Second query: Get full slide data (only if authorized)
  const slide = await this.prisma.slide.findUnique({
    where: { id: slideId },
    include: {
      content_blocks: {
        orderBy: { block_order: 'asc' },
      },
    },
  });

  return this.mapToSlideResponse(slide!);
}
```

#### Issue #15: Missing Database Indexes

**Severity**: HIGH
**File**: `prisma/schema.prisma`

The `ContentBlock` model needs an additional composite index for common queries.

**Recommendation:**

```prisma
model ContentBlock {
  id           String           @id @default(cuid())
  slide_id     String
  block_order  Int
  block_type   ContentBlockType

  // ... fields

  @@unique([slide_id, block_order])
  @@index([slide_id])
  @@index([block_type])
  @@index([slide_id, block_order]) // Add composite index for ordered queries
  @@map("content_blocks")
}
```

#### Issue #16: Inefficient Bulk Delete

**Severity**: MEDIUM
**File**: `api/src/courses/slides/slides.service.ts:495-518`

The bulk delete operation generates many UPDATE queries in the transaction.

**Current Approach:**

```typescript
await this.prisma.$transaction([
  this.prisma.slide.deleteMany({ where: { id: { in: slideIds } } }),
  ...Object.entries(slidesByLesson).flatMap(([lessonId, deletedSlides]) => {
    const sortedDeleted = deletedSlides.sort((a, b) => a.slide_order - b.slide_order);
    return sortedDeleted.map((deletedSlide, index) =>
      this.prisma.slide.updateMany({
        where: {
          lesson_id: lessonId,
          slide_order: { gt: deletedSlide.slide_order - index },
        },
        data: { slide_order: { decrement: 1 } },
      }),
    );
  }),
]);
```

**Better Approach:**

```typescript
// Use raw SQL for bulk operations
await this.prisma.$transaction(async (tx) => {
  // Delete slides
  await tx.slide.deleteMany({ where: { id: { in: slideIds } } });

  // Reorder with single raw query per lesson
  for (const [lessonId, deletedSlides] of Object.entries(slidesByLesson)) {
    // Use window function to recalculate all orders
    await tx.$executeRaw`
      UPDATE slides
      SET slide_order = subquery.new_order
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY slide_order) - 1 as new_order
        FROM slides
        WHERE lesson_id = ${lessonId}
        ORDER BY slide_order
      ) AS subquery
      WHERE slides.id = subquery.id
    `;
  }
});
```

---

### 2.3 JSONB Validation ⭐⭐⭐⭐⭐

**Strengths:**

- ✅ Excellent use of Zod schemas
- ✅ Type-specific validation
- ✅ Clear error messages
- ✅ Matching frontend/backend validation

**Minor Issue:**

#### Issue #17: Missing Bilingual Content Validation

**Severity**: LOW
**File**: `api/src/courses/slides/content-blocks.service.ts:52-64`

Only validates `content_en`, but schema has `content_fr` field.

**Recommendation:**

```typescript
async create(teacherId: string, createBlockDto: CreateContentBlockDto) {
  // ... ownership checks

  // Parse and validate content for both languages
  let contentEnJson: unknown;
  let contentFrJson: unknown | undefined;

  try {
    contentEnJson = JSON.parse(createBlockDto.content_en);
    if (createBlockDto.content_fr) {
      contentFrJson = JSON.parse(createBlockDto.content_fr);
    }
  } catch (error) {
    throw new BadRequestException('Content must be valid JSON');
  }

  // Validate English content (required)
  const validationEn = validateContentByType(createBlockDto.type, contentEnJson);
  if (!validationEn.valid) {
    throw new BadRequestException(
      `Invalid English content: ${validationEn.errors?.join(', ')}`
    );
  }

  // Validate French content if provided
  if (contentFrJson) {
    const validationFr = validateContentByType(createBlockDto.type, contentFrJson);
    if (!validationFr.valid) {
      throw new BadRequestException(
        `Invalid French content: ${validationFr.errors?.join(', ')}`
      );
    }
  }

  // Create block...
}
```

---

### 2.4 Transaction Usage ⭐⭐⭐⭐

**Strengths:**

- ✅ Proper use of transactions for complex operations
- ✅ Good understanding of atomicity requirements

**Issues:**

#### Issue #18: Missing Transaction Isolation Levels

**Severity**: MEDIUM

For operations like reordering, serializable isolation might be needed to prevent race conditions.

**Recommendation:**

```typescript
async bulkReorderSlides(
  lessonId: string,
  teacherId: string,
  reorderDto: BulkReorderSlidesDto,
): Promise<SlideResponseDto[]> {
  // ... validation

  // Use serializable isolation to prevent concurrent reorder conflicts
  await this.prisma.$transaction(
    reorderDto.slide_orders.map((item) =>
      this.prisma.slide.update({
        where: { id: item.slide_id },
        data: { slide_order: item.order },
      }),
    ),
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
    }
  );

  return this.findAllForLesson(lessonId, teacherId);
}
```

---

### 2.5 Error Handling ⭐⭐⭐

**Issues:**

#### Issue #19: Generic Error Messages

**Severity**: MEDIUM
**File**: Various service files

Error messages don't provide context about which resource failed.

**Fix:**

```typescript
// Before
throw new NotFoundException('Slide not found');

// After - Include identifiers for debugging
throw new NotFoundException(`Slide with ID '${slideId}' not found`);

// For batch operations
if (slides.length !== slideIds.length) {
  const foundIds = slides.map((s) => s.id);
  const missingIds = slideIds.filter((id) => !foundIds.includes(id));
  throw new NotFoundException(`Slides not found: ${missingIds.join(', ')}`);
}
```

#### Issue #20: No Error Logging

**Severity**: HIGH

Errors are thrown but not logged, making debugging difficult.

**Recommendation:**

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class SlidesService {
  private readonly logger = new Logger(SlidesService.name);

  async create(teacherId: string, createSlideDto: CreateSlideDto) {
    try {
      // ... operation
      this.logger.log(`Slide created: ${slide.id} for lesson: ${createSlideDto.lesson_id}`);
      return slide;
    } catch (error) {
      this.logger.error(
        `Failed to create slide for lesson: ${createSlideDto.lesson_id}`,
        error.stack,
      );
      throw error;
    }
  }
}
```

---

## 3. Integration Review

### 3.1 API Contract Frontend/Backend ⭐⭐

**Issues:**

#### Issue #21: Type Mismatch - Content Storage

**Severity**: HIGH

**Backend**: Stores content as JSONB with separate `content_en` and `content_fr` fields.
**Frontend**: Expects single `content` string field.

**Current Backend Schema:**

```typescript
// Prisma
model ContentBlock {
  content_en   Json
  content_fr   Json?
}
```

**Current Frontend Type:**

```typescript
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content: string; // ❌ Mismatch!
  metadata?: Record<string, unknown>;
}
```

**Fix - Align Frontend Types:**

```typescript
export interface ContentBlock {
  id: string;
  type: ContentBlockType;
  content_en: string; // JSON string
  content_fr?: string; // JSON string
  metadata?: Record<string, unknown>;
  order: number;
}

// Or use discriminated union for parsed content
export type ParsedContentBlock<T extends ContentBlockType> = {
  id: string;
  type: T;
  content_en: ContentTypeMap[T]; // Parsed JSON
  content_fr?: ContentTypeMap[T];
  metadata?: BlockMetadataMap[T];
  order: number;
};
```

#### Issue #22: Missing API Client

**Severity**: CRITICAL

No centralized API client for type-safe backend calls.

**Recommendation:**

```typescript
// lib/api-client.ts
import { z } from 'zod';

const SlideResponseSchema = z.object({
  id: z.string(),
  lesson_id: z.string(),
  slide_order: z.number(),
  layout: z.enum(['TITLE', 'CONTENT', 'TWO_COLUMN', 'IMAGE_FOCUS', 'QUIZ', 'BLANK']),
  title_en: z.string().optional(),
  title_fr: z.string().optional(),
  content_blocks: z.array(ContentBlockResponseSchema),
  created_at: z.coerce.date(),
  updated_at: z.coerce.date(),
});

export class ApiClient {
  constructor(private readonly baseUrl: string) {}

  async getSlides(lessonId: string): Promise<Slide[]> {
    const response = await fetch(`${this.baseUrl}/lessons/${lessonId}/slides`, {
      headers: { Authorization: `Bearer ${getToken()}` },
    });

    if (!response.ok) {
      throw new ApiError(response.status, await response.text());
    }

    const data = await response.json();
    return z.array(SlideResponseSchema).parse(data);
  }

  async createContentBlock(slideId: string, data: CreateContentBlockData): Promise<ContentBlock> {
    const response = await fetch(`${this.baseUrl}/slides/${slideId}/content-blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new ApiError(response.status, error.message);
    }

    return ContentBlockResponseSchema.parse(await response.json());
  }
}

export const apiClient = new ApiClient(process.env.NEXT_PUBLIC_API_URL!);
```

---

### 3.2 Data Synchronization ⭐⭐

**Issues:**

#### Issue #23: No Websocket/SSE for Real-time Updates

**Severity**: MEDIUM

If multiple teachers edit the same lesson, changes aren't reflected in real-time.

**Recommendation:**

```typescript
// Backend - Add WebSocket gateway
@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL },
  namespace: '/lesson-builder',
})
export class LessonBuilderGateway {
  @WebSocketServer()
  server: Server;

  @SubscribeMessage('subscribe-lesson')
  handleSubscribe(@MessageBody() lessonId: string, @ConnectedSocket() client: Socket) {
    client.join(`lesson:${lessonId}`);
  }

  notifySlideUpdated(lessonId: string, slide: SlideResponseDto) {
    this.server.to(`lesson:${lessonId}`).emit('slide-updated', slide);
  }

  notifyBlockUpdated(lessonId: string, slideId: string, block: ContentBlockResponseDto) {
    this.server.to(`lesson:${lessonId}`).emit('block-updated', { slideId, block });
  }
}

// Frontend - Subscribe to updates
import { io } from 'socket.io-client';

export function useLessonSync(lessonId: string) {
  const queryClient = useQueryClient();

  useEffect(() => {
    const socket = io(`${API_URL}/lesson-builder`, {
      auth: { token: getToken() },
    });

    socket.emit('subscribe-lesson', lessonId);

    socket.on('slide-updated', (slide: Slide) => {
      queryClient.setQueryData(['slides', slide.id], slide);
      queryClient.invalidateQueries({ queryKey: ['lessons', lessonId, 'slides'] });
    });

    socket.on('block-updated', ({ slideId, block }) => {
      queryClient.setQueryData(['slides', slideId], (old: Slide) => ({
        ...old,
        content_blocks: old.content_blocks.map((b) => (b.id === block.id ? block : b)),
      }));
    });

    return () => {
      socket.disconnect();
    };
  }, [lessonId, queryClient]);
}
```

---

### 3.3 Optimistic Updates ⭐⭐

#### Issue #24: No Optimistic UI Updates

**Severity**: MEDIUM

When adding/updating blocks, UI waits for server response before updating.

**Fix:** (Already shown in Issue #3)

---

### 3.4 Conflict Resolution ⭐

#### Issue #25: No Conflict Resolution Strategy

**Severity**: HIGH

If two users edit the same block simultaneously, last write wins (data loss).

**Recommendation:**

```typescript
// Add version field to ContentBlock
model ContentBlock {
  // ... existing fields
  version Int @default(1)
}

// Backend - Optimistic locking
async update(
  blockId: string,
  teacherId: string,
  updateDto: UpdateContentBlockDto & { version: number },
) {
  const updated = await this.prisma.contentBlock.updateMany({
    where: {
      id: blockId,
      version: updateDto.version, // Only update if version matches
    },
    data: {
      content_en: contentJson,
      version: { increment: 1 },
    },
  });

  if (updated.count === 0) {
    // Version mismatch - conflict detected
    throw new ConflictException(
      'Content block was modified by another user. Please refresh and try again.'
    );
  }
}

// Frontend - Handle conflicts
const updateBlock = useMutation({
  mutationFn: ({ id, data, version }) => api.updateBlock(id, data, version),
  onError: (error) => {
    if (error.status === 409) {
      // Conflict - show merge dialog
      showConflictDialog({
        local: localChanges,
        remote: await refetch(),
        onResolve: (resolved) => updateBlock.mutate(resolved),
      });
    }
  },
});
```

---

### 3.5 Auto-save Implementation ⭐⭐⭐

**Strengths:**

- ✅ Good debounce logic
- ✅ Queue handling for rapid changes

**Issues:**

#### Issue #26: Missing Dependencies in useCallback

**Severity**: MEDIUM
**File**: `hooks/use-auto-save.ts:59-88`

The `onSave` function is not in the dependency array:

```typescript
const executeSave = useCallback(async () => {
  // ... uses onSave
}, [onSave]); // ✅ Should include onSave
```

**Current code is correct!** But beware of:

#### Issue #27: No Retry Logic for Failed Saves

**Severity**: MEDIUM

If save fails due to network error, it's lost.

**Fix:**

```typescript
export function useAutoSave({ onSave, delay = 2000, maxRetries = 3 }: UseAutoSaveOptions) {
  const [retryCount, setRetryCount] = useState(0);

  const executeSave = useCallback(async () => {
    // ... existing logic

    try {
      await onSave();
      setSaveStatus('saved');
      setRetryCount(0); // Reset on success
    } catch (error) {
      console.error('Auto-save failed:', error);

      if (retryCount < maxRetries) {
        // Retry with exponential backoff
        const backoffDelay = Math.min(1000 * Math.pow(2, retryCount), 10000);
        setTimeout(() => {
          setRetryCount((prev) => prev + 1);
          void executeSave();
        }, backoffDelay);
      } else {
        setSaveStatus('error');
        // Show user notification
        toast.error('Failed to save changes after multiple attempts');
      }
    }
  }, [onSave, retryCount, maxRetries]);

  // ...
}
```

---

## 4. UX Review

### 4.1 Loading States ⭐⭐

**Issues:**

#### Issue #28: No Loading Skeletons

**Severity**: MEDIUM

While slides load, users see blank screen.

**Recommendation:**

```tsx
// components/lesson-builder/slide-skeleton.tsx
export function SlideSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-4" />
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-100 rounded" />
        ))}
      </div>
    </div>
  );
}

// Usage
{
  isLoading ? <SlideSkeleton /> : <SlideCanvas slide={slide} />;
}
```

---

### 4.2 Error Messages ⭐⭐⭐

**Issues:**

#### Issue #29: No User-Friendly Error Display

**Severity**: MEDIUM

Errors are logged to console but not shown to user.

**Recommendation:**

```tsx
// components/lesson-builder/error-boundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="p-8 text-center">
      <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
      <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
      <p className="text-gray-600 mb-4">{error.message}</p>
      <Button onClick={resetErrorBoundary}>Try again</Button>
    </div>
  );
}

// Wrap lesson builder
<ErrorBoundary FallbackComponent={ErrorFallback} onReset={() => queryClient.resetQueries()}>
  <LessonBuilder />
</ErrorBoundary>;
```

---

### 4.3 Empty States ⭐⭐⭐⭐

**Strengths:**

- ✅ Good empty states in SlideCanvas (line 94-106, 174-188)

---

### 4.4 Keyboard Shortcuts ⭐

(See Issue #8 above)

---

### 4.5 Drag and Drop ⭐⭐⭐⭐

**Strengths:**

- ✅ Good implementation with dnd-kit
- ✅ Proper keyboard support

**Minor Issue:**

#### Issue #30: No Visual Feedback During Drag

**Severity**: LOW

Could add overlay to show drop target.

**Enhancement:**

```tsx
import { DragOverlay } from '@dnd-kit/core';

<DndContext /* ... */>
  <SortableContext /* ... */>{/* ... blocks */}</SortableContext>

  <DragOverlay>
    {activeId ? (
      <div className="opacity-50 rotate-3 shadow-2xl">
        <ContentBlock block={getBlockById(activeId)} />
      </div>
    ) : null}
  </DragOverlay>
</DndContext>;
```

---

## 5. Security Review

### 5.1 Authorization Checks ⭐⭐⭐⭐⭐

**Strengths:**

- ✅ Excellent ownership verification chain
- ✅ Consistent authorization across all endpoints
- ✅ Proper use of guards and decorators

---

### 5.2 Input Sanitization ⭐⭐⭐⭐

**Strengths:**

- ✅ Good validation with class-validator
- ✅ Zod validation for JSONB

**Issues:**

#### Issue #31: Missing File Upload Validation

**Severity**: HIGH

Image blocks accept any URL but don't validate file uploads.

**Recommendation:**

```typescript
// Add file upload endpoint with validation
@Post('upload-image')
@UseInterceptors(
  FileInterceptor('image', {
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
      const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimes.includes(file.mimetype)) {
        cb(new BadRequestException('Invalid file type'), false);
      } else {
        cb(null, true);
      }
    },
  })
)
async uploadImage(@UploadedFile() file: Express.Multer.File) {
  // Scan for malware
  await this.virusScanner.scan(file.buffer);

  // Upload to S3 with secure settings
  const url = await this.s3.upload(file, {
    bucket: 'lesson-images',
    acl: 'public-read',
    contentType: file.mimetype,
  });

  return { url };
}
```

---

### 5.3 XSS Prevention in Rich Text ⭐⭐⭐

**Issues:**

#### Issue #32: No HTML Sanitization on Backend

**Severity**: HIGH
**File**: `api/src/courses/slides/validators/content-validator.ts:108-118`

The `sanitizeContentHtml` function exists but is NOT CALLED anywhere!

**Fix:**

```typescript
// content-blocks.service.ts
async create(teacherId: string, createBlockDto: CreateContentBlockDto) {
  // ... existing code

  // Sanitize HTML content before saving
  if (createBlockDto.type === 'TEXT' || createBlockDto.type === 'HEADING') {
    const content = JSON.parse(createBlockDto.content);
    if (content.html) {
      content.html = sanitizeContentHtml(content.html);
      createBlockDto.content = JSON.stringify(content);
    }
  }

  // ... rest of method
}
```

**Better:** Use a library like `DOMPurify`:

```typescript
import DOMPurify from 'isomorphic-dompurify';

export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      's',
      'a',
      'ul',
      'ol',
      'li',
      'h1',
      'h2',
      'h3',
      'span',
    ],
    ALLOWED_ATTR: ['href', 'class', 'style'],
    ALLOWED_STYLES: {
      '*': {
        color: [/^#[0-9A-Fa-f]{6}$/],
        'text-align': [/^(left|center|right|justify)$/],
      },
    },
  });
}
```

---

### 5.4 File Upload Security ⭐

(See Issue #31)

---

## Priority Recommendations

### CRITICAL (Fix Immediately)

1. **Issue #1**: Create main lesson builder page with React Query integration
2. **Issue #3**: Add React Query for data fetching and caching
3. **Issue #21**: Fix type mismatch between frontend and backend
4. **Issue #22**: Create centralized API client
5. **Issue #32**: Implement HTML sanitization on backend

### HIGH (Fix Soon)

1. **Issue #5**: Add memoization to prevent unnecessary re-renders
2. **Issue #8**: Implement keyboard shortcuts
3. **Issue #14**: Optimize N+1 queries
4. **Issue #25**: Add conflict resolution for concurrent edits
5. **Issue #31**: Add file upload validation

### MEDIUM (Fix When Possible)

1. **Issue #6-7**: Memoize callbacks and add React.memo
2. **Issue #12**: Add pagination to slides endpoint
3. **Issue #15**: Add database indexes
4. **Issue #19-20**: Improve error handling and logging
5. **Issue #23**: Add real-time synchronization

### LOW (Nice to Have)

1. **Issue #2**: Reorganize block components
2. **Issue #13**: Add partial update endpoints
3. **Issue #17**: Validate bilingual content
4. **Issue #30**: Add drag overlay

---

## Summary

**What's Working Well:**

- Solid component architecture
- Good TypeScript usage
- Excellent backend authorization
- Comprehensive validation with Zod
- Proper transaction handling

**Critical Gaps:**

- Missing main page component and React Query integration
- Type mismatches between frontend/backend
- No HTML sanitization despite function existing
- Missing optimistic updates and conflict resolution
- Performance issues with re-renders and queries

**Next Steps:**

1. Create main lesson builder page
2. Integrate React Query
3. Fix type contracts
4. Add HTML sanitization
5. Optimize performance

The implementation shows good foundational architecture but needs critical integration work to be production-ready.
