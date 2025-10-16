# Lesson Builder Architecture

## Component Hierarchy

```
LessonBuilderPage (Main Container)
│
├── Top Bar
│   ├── Back Button → Navigate to course
│   ├── Lesson Title Display
│   ├── Auto-save Status
│   ├── Preview Button
│   ├── Save Button
│   └── Publish Toggle
│
├── Main Layout (3-column)
│   │
│   ├── LEFT PANEL (220px)
│   │   └── SlideThumbnailStrip
│   │       ├── Header (slide count)
│   │       ├── DndContext (drag-and-drop)
│   │       │   └── SortableContext
│   │       │       └── SlideThumbnail (×N)
│   │       │           ├── Slide Preview
│   │       │           ├── Number Badge
│   │       │           ├── Hover Actions
│   │       │           │   ├── Duplicate Button
│   │       │           │   └── Delete Button
│   │       │           └── Drag Handle
│   │       └── Add Slide Button
│   │           └── DropdownMenu (layouts)
│   │
│   ├── CENTER PANEL (flex-1)
│   │   ├── SlideToolbar
│   │   │   ├── Layout Dropdown
│   │   │   ├── Background Color Popover
│   │   │   │   ├── Preset Colors Grid
│   │   │   │   └── Custom Color Input
│   │   │   ├── Background Image Popover
│   │   │   │   ├── URL Input
│   │   │   │   ├── Preview
│   │   │   │   └── Apply/Remove Buttons
│   │   │   └── Current Layout Display
│   │   │
│   │   └── SlideCanvas
│   │       ├── 16:9 Canvas Container
│   │       │   ├── Slide Title (optional)
│   │       │   └── Content Blocks
│   │       │       └── ContentBlock (×N)
│   │       │           ├── Type Badge
│   │       │           ├── Delete Button
│   │       │           ├── Drag Handle
│   │       │           └── Content Renderer
│   │       │               ├── TEXT → TipTap Editor + Toolbar
│   │       │               ├── HEADING → TipTap Editor
│   │       │               ├── IMAGE → URL + Preview
│   │       │               ├── VERSE → Reference + Text
│   │       │               ├── CALLOUT → Type + Content
│   │       │               ├── LIST → Bulleted/Numbered
│   │       │               └── DIVIDER → Horizontal Rule
│   │       │
│   │       └── Floating Add Button
│   │           └── AddContentMenu
│   │               └── DropdownMenu (block types)
│   │
│   └── RIGHT PANEL (320px)
│       └── PropertiesPanel
│           └── Tabs (Slide | Lesson)
│               │
│               ├── Slide Tab
│               │   └── Accordion
│               │       ├── Title Section
│               │       │   ├── Title EN (Input)
│               │       │   └── Title FR (Input)
│               │       ├── Teacher Notes
│               │       │   ├── Notes EN (Textarea)
│               │       │   └── Notes FR (Textarea)
│               │       └── Timing & Transition
│               │           ├── Estimated Time (Number)
│               │           └── Transition Type (Select)
│               │
│               └── Lesson Tab
│                   └── Accordion
│                       ├── Information Section
│                       │   ├── Title EN (Input)
│                       │   ├── Title FR (Input)
│                       │   ├── Description EN (Textarea)
│                       │   └── Description FR (Textarea)
│                       ├── Settings Section
│                       │   ├── Duration (Number)
│                       │   ├── Order (Number)
│                       │   └── Status (Select)
│                       └── Statistics Section
│                           ├── Total Slides
│                           ├── Total Blocks
│                           ├── Created Date
│                           └── Updated Date
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        React Query                           │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                  Query Cache                         │   │
│  │  - lessons/{id}  (5 min stale time)                  │   │
│  │  - Optimistic updates for all mutations              │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
                              │ │
┌─────────────────────────────────────────────────────────────┐
│                    API Client (Axios)                        │
│  - Base URL: /api                                            │
│  - Auth: Cookies (withCredentials: true)                    │
│  - Interceptors: Error handling, logging                    │
└─────────────────────────────────────────────────────────────┘
                              ↑ ↓
                              │ │
┌─────────────────────────────────────────────────────────────┐
│                      Backend API                             │
│  GET    /lessons/{id}           - Fetch lesson + slides     │
│  PUT    /lessons/{id}           - Update lesson             │
│  PATCH  /lessons/{id}/reorder   - Reorder slides            │
│  POST   /slides                 - Create slide              │
│  PUT    /slides/{id}            - Update slide              │
│  DELETE /slides/{id}            - Delete slide              │
│  POST   /slides/{id}/duplicate  - Duplicate slide           │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management

### Component State (useState)

```typescript
LessonBuilderPage {
  currentSlideId: string | null
  isSaving: boolean
  lastSavedAt: Date | null
  isPreviewMode: boolean
  isScreenTooSmall: boolean
}

ContentBlock {
  isEditing: boolean
  metadata: ContentBlock['metadata']
}

SlideThumbnail {
  isHovered: boolean
}

SlideToolbar {
  customColor: string
  imageUrl: string
}
```

### Server State (React Query)

```typescript
useLesson(lessonId)
  → QueryKey: ['lessons', lessonId]
  → Data: LessonWithSlides
  → Stale Time: 5 minutes

useUpdateLesson(lessonId)
  → Mutation: PUT /lessons/{id}
  → Optimistic: Update cache immediately
  → On Error: Rollback

useCreateSlide(lessonId)
  → Mutation: POST /slides
  → On Success: Invalidate lesson query

useUpdateSlide(lessonId, slideId)
  → Mutation: PUT /slides/{id}
  → Optimistic: Update slide in cache
  → On Error: Rollback

useDeleteSlide(lessonId)
  → Mutation: DELETE /slides/{id}
  → Optimistic: Remove from cache
  → On Error: Rollback

useReorderSlides(lessonId)
  → Mutation: PATCH /lessons/{id}/reorder
  → Optimistic: Reorder slides in cache
  → On Error: Rollback
```

---

## Event Flow Examples

### Creating a New Slide

```
User clicks "Add Slide" button
    ↓
DropdownMenu opens with layout options
    ↓
User selects "Content Slide"
    ↓
onAddSlide('CONTENT') called
    ↓
createSlideMutation.mutateAsync({
  lesson_id: lessonId,
  layout: 'CONTENT',
  order: slides.length
})
    ↓
POST /slides with request body
    ↓
Backend creates slide and returns data
    ↓
React Query invalidates ['lessons', lessonId]
    ↓
Lesson data refetches automatically
    ↓
New slide appears in thumbnail strip
    ↓
New slide automatically selected
    ↓
Canvas updates to show new slide
```

### Reordering Slides (Drag & Drop)

```
User hovers over slide thumbnail
    ↓
Drag handle appears (isHovered = true)
    ↓
User clicks and drags handle
    ↓
@dnd-kit/sortable activates
    ↓
isDragging = true (opacity reduced)
    ↓
User drops slide in new position
    ↓
onDragEnd event fired
    ↓
arrayMove(slides, oldIndex, newIndex)
    ↓
Slides reordered locally (optimistic)
    ↓
reorderSlidesMutation.mutateAsync({
  slide_orders: [{slide_id, order}, ...]
})
    ↓
PATCH /lessons/{id}/reorder
    ↓
Backend updates slide orders
    ↓
On success: Cache already updated
    ↓
On error: Rollback to previous order
```

### Editing Content Block

```
User double-clicks content block
    ↓
isEditing = true
    ↓
TipTap editor becomes editable
    ↓
Formatting toolbar appears
    ↓
User types or applies formatting
    ↓
onUpdate fired on each change
    ↓
Debounced auto-save (2 seconds)
    ↓
User clicks outside block
    ↓
onBlur fired
    ↓
isEditing = false
    ↓
Content saved to state
    ↓
Auto-save timer completes
    ↓
updateContentBlock API call
    ↓
PUT /blocks/{id}
    ↓
Success toast notification
```

### Auto-Save Flow

```
User makes any change
    ↓
Mutation optimistically updates cache
    ↓
debouncedAutoSave() called
    ↓
Wait 2 seconds for more changes
    ↓
No more changes detected
    ↓
isSaving = true
    ↓
"Saving..." appears in top bar
    ↓
Simulate save operation (500ms)
    ↓
isSaving = false
    ↓
lastSavedAt = new Date()
    ↓
"Last saved at 10:30:45 AM" displayed
    ↓
Success toast notification
```

---

## Keyboard Navigation Map

```
Global Shortcuts (anywhere in page):
  Cmd/Ctrl + S    → Manual save
  Cmd/Ctrl + P    → Toggle preview
  Cmd/Ctrl + D    → Duplicate slide
  Arrow Left      → Previous slide
  Arrow Right     → Next slide
  Delete          → Delete slide (with confirm)

When thumbnail focused:
  Arrow Up/Down   → Navigate slides
  Space/Enter     → Select slide
  Tab             → Next thumbnail

When canvas focused:
  Tab             → Navigate content blocks
  Enter           → Edit selected block
  Escape          → Exit edit mode

When editing content:
  Cmd/Ctrl + B    → Bold
  Cmd/Ctrl + I    → Italic
  Cmd/Ctrl + U    → Underline
  Escape          → Exit edit mode
  Tab             → Next block
  Shift + Tab     → Previous block

When dropdown open:
  Arrow Up/Down   → Navigate options
  Enter           → Select option
  Escape          → Close dropdown
```

---

## Performance Optimizations

### Component Level

```typescript
// Memoized callbacks
const handleSave = useCallback(() => { ... }, []);
const handleSlideUpdate = useCallback((data) => { ... }, [currentSlideId]);

// Debounced operations
const debouncedAutoSave = useCallback(
  debounce(() => { ... }, 2000),
  []
);

// Conditional rendering
{isScreenTooSmall && <WarningScreen />}
{!isScreenTooSmall && <LessonBuilder />}
```

### Query Level

```typescript
// Stale time prevents unnecessary refetches
staleTime: 5 * 60 * 1000; // 5 minutes

// Optimistic updates = instant UI
onMutate: async (newData) => {
  await queryClient.cancelQueries();
  const previous = queryClient.getQueryData();
  queryClient.setQueryData(newData); // Update immediately
  return { previous };
};

// Selective refetching
onSettled: () => {
  queryClient.invalidateQueries(['lessons', lessonId]);
  // Only this lesson refetches, not all lessons
};
```

### Rendering Optimizations

```typescript
// Virtual scrolling (future)
// For >50 slides, implement react-window or react-virtualized

// Image lazy loading
<img loading="lazy" ... />

// Code splitting (future)
const LessonBuilder = lazy(() => import('./lesson-builder'));
```

---

## Error Handling Strategy

### Network Errors

```typescript
if (!error.response) {
  toast({
    title: 'Network Error',
    description: 'Check your connection',
    variant: 'destructive',
  });
  // Optimistic update automatically rolled back
}
```

### API Errors

```typescript
switch (error.response.status) {
  case 401:
  // Redirect to login (handled by interceptor)
  case 403:
    toast({ title: 'Permission Denied' });
  case 404:
    toast({ title: 'Lesson Not Found' });
  case 422:
    // Validation errors
    toast({ title: 'Invalid Data' });
  case 500:
    toast({ title: 'Server Error' });
}
```

### User Errors

```typescript
// Prevent deleting last slide
if (slides.length <= 1) {
  toast({
    title: 'Cannot Delete',
    description: 'Lesson must have at least one slide',
  });
  return;
}

// Confirm destructive actions
const confirmed = window.confirm('Are you sure?');
if (!confirmed) return;
```

---

## Accessibility Tree

```
LessonBuilderPage [role="main"]
│
├── Navigation [role="navigation"]
│   └── Back Button [role="button"] [aria-label="Back to course"]
│
├── Article [role="article"] [aria-label="Lesson Editor"]
│   │
│   ├── Aside [role="complementary"] [aria-label="Slide thumbnails"]
│   │   ├── List [role="list"]
│   │   │   └── ListItem [role="listitem"] [aria-label="Slide {n}"]
│   │   │       ├── Button [aria-label="Select slide"]
│   │   │       ├── Button [aria-label="Duplicate slide"]
│   │   │       ├── Button [aria-label="Delete slide"]
│   │   │       └── Button [aria-label="Drag to reorder"] [aria-grabbed="false"]
│   │   │
│   │   └── Button [aria-label="Add new slide"] [aria-haspopup="menu"]
│   │
│   ├── Main [role="main"] [aria-label="Slide editor"]
│   │   ├── Toolbar [role="toolbar"]
│   │   │   ├── Button [aria-label="Change layout"] [aria-haspopup="menu"]
│   │   │   ├── Button [aria-label="Change background color"] [aria-haspopup="dialog"]
│   │   │   └── Button [aria-label="Set background image"] [aria-haspopup="dialog"]
│   │   │
│   │   └── Region [role="region"] [aria-label="Slide canvas"]
│   │       └── Article [role="article"] [aria-label="Content blocks"]
│   │           └── Section [role="group"] [aria-label="Content block"]
│   │               ├── Button [aria-label="Delete block"]
│   │               └── TextBox [role="textbox"] [aria-label="Edit content"]
│   │
│   └── Aside [role="complementary"] [aria-label="Properties"]
│       └── TabList [role="tablist"]
│           ├── Tab [role="tab"] [aria-selected="true"] "Slide"
│           ├── Tab [role="tab"] [aria-selected="false"] "Lesson"
│           │
│           ├── TabPanel [role="tabpanel"] [aria-labelledby="slide-tab"]
│           │   └── Form [role="form"]
│           │       ├── Label + Input [aria-label="Slide title English"]
│           │       └── Label + Textarea [aria-label="Teacher notes English"]
│           │
│           └── TabPanel [role="tabpanel"] [aria-labelledby="lesson-tab"]
│               └── Form [role="form"]
│                   └── Label + Input [aria-label="Lesson duration"]
│
└── Region [role="status"] [aria-live="polite"] [aria-atomic="true"]
    └── Toast Notifications
```

---

## Testing Strategy

### Unit Tests (Vitest)

```typescript
// Component tests
describe('SlideThumbnail', () => {
  it('renders slide preview', () => { ... });
  it('shows actions on hover', () => { ... });
  it('calls onDelete when delete clicked', () => { ... });
});

// Hook tests
describe('useLesson', () => {
  it('fetches lesson data', () => { ... });
  it('handles loading state', () => { ... });
  it('handles error state', () => { ... });
});

// Utility tests
describe('debounce', () => {
  it('delays function execution', () => { ... });
  it('cancels previous calls', () => { ... });
});
```

### Integration Tests (React Testing Library)

```typescript
describe('Lesson Builder Workflow', () => {
  it('creates and edits slide', async () => {
    render(<LessonBuilderPage />);
    await userEvent.click(screen.getByText('Add Slide'));
    await userEvent.click(screen.getByText('Content Slide'));
    expect(screen.getByText('Slide 1')).toBeInTheDocument();
  });

  it('reorders slides', async () => { ... });
  it('saves changes', async () => { ... });
});
```

### E2E Tests (Playwright)

```typescript
test('complete lesson creation flow', async ({ page }) => {
  await page.goto('/teacher/courses/123');
  await page.click('text=New Lesson');
  await page.fill('[name="title"]', 'Test Lesson');
  await page.click('text=Add Slide');
  await page.click('text=Content Slide');
  await page.fill('[name="slide-title"]', 'Introduction');
  await page.keyboard.press('Control+S');
  await expect(page.locator('text=Saved')).toBeVisible();
});
```

---

## Deployment Checklist

### Pre-Deployment

- [ ] All TypeScript errors resolved
- [ ] All tests passing
- [ ] Bundle size analyzed
- [ ] Performance profiling complete
- [ ] Accessibility audit passed
- [ ] Cross-browser testing done
- [ ] Mobile responsiveness verified
- [ ] Dark mode tested

### Environment Setup

- [ ] VITE_API_URL configured
- [ ] Error tracking enabled (Sentry)
- [ ] Analytics configured
- [ ] CDN configured for images
- [ ] Rate limiting configured

### Post-Deployment

- [ ] Smoke tests on production
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify API latency
- [ ] User feedback collected

---

## Maintenance Guide

### Weekly Tasks

- Review error logs
- Check performance metrics
- Update dependencies (security patches)
- Review user feedback

### Monthly Tasks

- Dependency updates (minor versions)
- Performance optimization review
- Accessibility audit
- Code quality review

### Quarterly Tasks

- Major dependency updates
- Feature prioritization
- Technical debt assessment
- Security audit

---

This architecture document provides a comprehensive overview of the Lesson Builder's structure, data flow, and operational patterns. It serves as a reference for developers working on the codebase and for planning future enhancements.
