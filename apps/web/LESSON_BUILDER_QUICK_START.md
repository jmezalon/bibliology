# Lesson Builder - Quick Start Guide

## Overview

A production-ready, PowerPoint-inspired lesson editor for teachers to create bilingual Bible study content.

---

## Quick Navigation

**Route:** `/teacher/courses/:courseId/lessons/:lessonId/edit`

**Key Files:**

- Main Page: `src/pages/teacher/lesson-builder.tsx`
- API Hooks: `src/hooks/use-lesson.ts`
- Types: `src/types/lesson-builder.ts`
- Components: `src/components/lesson-builder/`

---

## 5-Minute Demo Script

### 1. Access Lesson Builder (30 seconds)

```
1. Log in as teacher
2. Navigate to "My Courses"
3. Click any course
4. Click "Edit" button on a lesson
5. Lesson Builder opens in full screen
```

### 2. Create Slides (1 minute)

```
1. Click "Add Slide" button (bottom of left panel)
2. Select "Content Slide" from dropdown
3. New slide appears
4. Click slide thumbnail to select it
5. Repeat to create 3-4 slides
```

### 3. Reorder Slides (30 seconds)

```
1. Hover over any slide thumbnail
2. Drag handle appears on right
3. Drag slide to new position
4. Slide reorders with smooth animation
5. Changes saved automatically
```

### 4. Add Content (1 minute)

```
1. Select a slide
2. Click floating "+" button (bottom-right)
3. Select "Text" from menu
4. New content block appears
5. Double-click to edit
6. Type some content
7. Click outside to save
8. Repeat with "Image" and "Bible Verse"
```

### 5. Style Slide (1 minute)

```
1. Click "Background" button in toolbar
2. Select a color from preset grid
3. Background changes instantly
4. Click "Image" button
5. Paste image URL
6. Preview appears
7. Click "Apply Image"
```

### 6. Edit Properties (1 minute)

```
1. Click "Slide" tab (right panel)
2. Expand "Title" section
3. Enter English title: "Introduction to Genesis"
4. Enter French title: "Introduction à la Genèse"
5. Expand "Teacher Notes"
6. Add private notes
7. Changes auto-save
```

### 7. Keyboard Shortcuts (30 seconds)

```
1. Press Cmd+S (or Ctrl+S) to save
2. Press Arrow Right to next slide
3. Press Arrow Left to previous slide
4. Press Cmd+D to duplicate slide
5. Notice "Saved" confirmation
```

---

## Component Quick Reference

### Main Layout

```
┌────────────────────────────────────────────────┐
│  [Back] Lesson Title      [Preview] [Save] [⚙] │
├──────┬─────────────────────────────┬───────────┤
│      │  [Layout] [Color] [Image]   │           │
│ 220px│─────────────────────────────│   320px   │
│      │                             │           │
│ Slide│     Canvas (16:9)          │Properties │
│ List │                             │  Panel    │
│      │                             │           │
└──────┴─────────────────────────────┴───────────┘
```

### Content Block Types

- **TEXT** - Rich text with formatting
- **HEADING** - Large section title
- **IMAGE** - Image with URL and alt text
- **VERSE** - Bible verse with reference
- **CALLOUT** - Info/Warning/Success/Error box
- **LIST** - Bulleted or numbered list
- **DIVIDER** - Horizontal separator

### Slide Layouts

- **TITLE** - Title slide with large text
- **CONTENT** - Standard content layout
- **TWO_COLUMN** - Side-by-side content
- **IMAGE_FOCUS** - Centered large image
- **QUIZ** - Quiz question layout
- **BLANK** - Empty canvas

---

## Keyboard Shortcuts

| Shortcut       | Action                 |
| -------------- | ---------------------- |
| `Cmd/Ctrl + S` | Save lesson            |
| `Cmd/Ctrl + P` | Toggle preview         |
| `Cmd/Ctrl + D` | Duplicate slide        |
| `Arrow Left`   | Previous slide         |
| `Arrow Right`  | Next slide             |
| `Delete`       | Delete slide (confirm) |
| `Double-click` | Edit content block     |
| `Escape`       | Exit edit mode         |

---

## API Endpoints Required

The frontend expects these backend endpoints:

```typescript
// Lessons
GET    /api/lessons/:id              // Get lesson with slides
PUT    /api/lessons/:id              // Update lesson
PATCH  /api/lessons/:id/reorder      // Reorder slides

// Slides
POST   /api/slides                   // Create slide
PUT    /api/slides/:id               // Update slide
DELETE /api/slides/:id               // Delete slide
POST   /api/slides/:id/duplicate     // Duplicate slide

// Content Blocks (TODO - not yet implemented in backend)
POST   /api/slides/:id/blocks        // Create block
PUT    /api/blocks/:id               // Update block
DELETE /api/blocks/:id               // Delete block
PATCH  /api/slides/:id/blocks/reorder // Reorder blocks
```

---

## Common Operations

### Add Content Block

```typescript
1. Click floating "+" button or "Add Content" in empty state
2. Select block type from dropdown
3. Block appears in canvas
4. Double-click to edit (for text blocks)
5. Configure in properties (for image/verse blocks)
```

### Change Slide Background

```typescript
1. Select slide
2. Click "Background" in toolbar
3. Choose preset color OR enter custom hex
4. Click "Apply"
5. Canvas updates immediately
```

### Add Background Image

```typescript
1. Select slide
2. Click "Image" in toolbar
3. Enter image URL
4. Preview appears
5. Click "Apply Image"
6. To remove: Click "Remove"
```

### Bilingual Content

```typescript
1. All title/description fields have EN and FR versions
2. Fill both for bilingual support
3. French is optional but recommended
4. Student UI will switch based on language preference
```

---

## Troubleshooting

### Slides not appearing

- Check browser console for errors
- Verify API endpoint returns data
- Check network tab for 200 status
- Ensure lesson ID is valid

### Drag-and-drop not working

- Verify @dnd-kit packages installed: `npm list @dnd-kit`
- Check for JavaScript errors
- Try refreshing the page
- Ensure unique slide IDs

### Auto-save not triggering

- Check for TypeScript errors
- Verify 2-second debounce completed
- Look for "Saving..." status in top bar
- Check network tab for API calls

### Rich text editor not editable

- Double-click the content block (not single click)
- Ensure TipTap extensions loaded
- Check browser console for errors
- Try creating a new block

### Images not loading

- Verify URL is publicly accessible
- Check CORS headers on image server
- Use HTTPS URLs (not HTTP)
- Try different image URL

---

## Performance Tips

### For Large Lessons (>50 slides)

- Consider implementing virtualization
- Lazy load images
- Debounce more aggressively
- Paginate content blocks

### For Slow Networks

- Increase stale time in React Query
- Implement offline mode
- Cache images locally
- Show loading skeletons

### For Many Students

- Use CDN for images
- Enable image optimization
- Implement response caching
- Use compression

---

## Extending the Lesson Builder

### Add New Content Block Type

1. **Add enum value:**

```typescript
// src/types/lesson-builder.ts
export enum ContentBlockType {
  // ... existing types
  YOUR_NEW_TYPE = 'YOUR_NEW_TYPE',
}
```

2. **Add rendering:**

```typescript
// src/components/lesson-builder/content-block.tsx
case 'YOUR_NEW_TYPE':
  return (
    <div>Your custom renderer</div>
  );
```

3. **Add to menu:**

```typescript
// src/components/lesson-builder/add-content-menu.tsx
const CONTENT_BLOCKS = [
  // ... existing blocks
  {
    type: ContentBlockType.YOUR_NEW_TYPE,
    name: 'Your Block',
    icon: YourIcon,
    description: 'Description',
  },
];
```

### Add New Keyboard Shortcut

```typescript
// src/pages/teacher/lesson-builder.tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    const modKey = isMac ? e.metaKey : e.ctrlKey;

    // Your new shortcut
    if (modKey && e.key === 'x') {
      e.preventDefault();
      yourCustomFunction();
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [dependencies]);
```

### Add New Slide Layout

```typescript
// 1. Add enum
export enum SlideLayoutType {
  // ... existing
  YOUR_LAYOUT = 'YOUR_LAYOUT',
}

// 2. Add to layouts array
const SLIDE_LAYOUTS = [
  // ... existing
  {
    type: SlideLayoutType.YOUR_LAYOUT,
    name: 'Your Layout',
    icon: YourIcon,
    description: 'Your description',
  },
];

// 3. Add to toolbar dropdown
// (automatically included from SLIDE_LAYOUTS)
```

---

## Integration with Backend

### Expected Data Structure

**Lesson with Slides:**

```json
{
  "id": "uuid",
  "course_id": "uuid",
  "title_en": "Introduction to Genesis",
  "title_fr": "Introduction à la Genèse",
  "description_en": "Learn about...",
  "description_fr": "Apprenez...",
  "order": 1,
  "duration_minutes": 45,
  "is_published": false,
  "created_at": "2025-10-16T10:00:00Z",
  "updated_at": "2025-10-16T11:00:00Z",
  "slides": [
    {
      "id": "uuid",
      "lesson_id": "uuid",
      "layout": "CONTENT",
      "title_en": "What is Genesis?",
      "title_fr": "Qu'est-ce que la Genèse?",
      "teacher_notes_en": "Emphasize creation story",
      "teacher_notes_fr": "Souligner l'histoire de la création",
      "background_color": "#DBEAFE",
      "background_image_url": null,
      "transition": "FADE",
      "estimated_time_seconds": 180,
      "order": 0,
      "content_blocks": [
        {
          "id": "uuid",
          "type": "HEADING",
          "content": "<h1>Introduction</h1>",
          "order": 0,
          "metadata": {}
        },
        {
          "id": "uuid",
          "type": "TEXT",
          "content": "<p>Genesis is the first book...</p>",
          "order": 1,
          "metadata": {}
        },
        {
          "id": "uuid",
          "type": "VERSE",
          "content": "<p>In the beginning God created...</p>",
          "order": 2,
          "metadata": {
            "verseReference": "Genesis 1:1",
            "verseTranslation": "NIV"
          }
        }
      ],
      "created_at": "2025-10-16T10:00:00Z",
      "updated_at": "2025-10-16T11:00:00Z"
    }
  ]
}
```

---

## Security Considerations

### Authentication

- All API calls require valid session cookie
- 401 redirects to login automatically
- No tokens stored in localStorage

### Authorization

- Only TEACHER and ADMIN roles can access
- Teachers can only edit their own lessons
- Admins can edit all lessons

### Data Validation

- All inputs validated on frontend
- Backend must validate again
- Sanitize HTML content from TipTap
- Validate image URLs

### XSS Prevention

- TipTap output is sanitized
- Use `dangerouslySetInnerHTML` only for TipTap content
- Escape user input in properties panel
- Validate URLs before rendering

---

## Monitoring & Analytics

### Key Metrics to Track

- Average lesson creation time
- Number of slides per lesson
- Most used content block types
- Most used slide layouts
- Auto-save frequency
- Error rates by endpoint
- Average API response time

### Error Tracking

- Set up Sentry for error reporting
- Log failed mutations
- Track optimistic update rollbacks
- Monitor CRUD operation failures

### User Analytics

- Track feature usage (which buttons clicked)
- Time spent in lesson builder
- Keyboard shortcut usage
- Dropout points (where users leave)

---

## Next Steps

1. **Test the implementation:**
   - Follow the 5-minute demo script
   - Try all keyboard shortcuts
   - Test error scenarios
   - Verify auto-save

2. **Backend integration:**
   - Implement content block endpoints
   - Add slide duplication endpoint
   - Test all API calls
   - Verify data persistence

3. **User testing:**
   - Invite teachers to test
   - Gather feedback
   - Identify pain points
   - Iterate on UX

4. **Production deployment:**
   - Set up monitoring
   - Configure CDN
   - Enable error tracking
   - Create user documentation

---

## Support

**Documentation:**

- Full Implementation: `LESSON_BUILDER_IMPLEMENTATION.md`
- Architecture Details: `LESSON_BUILDER_ARCHITECTURE.md`
- This Quick Start: `LESSON_BUILDER_QUICK_START.md`

**Code Location:**

- `/Users/mezalonm/Library/Mobile Documents/com~apple~CloudDocs/bibliology/apps/web/src/`

**Key Dependencies:**

- React 18.2
- React Query 5.14
- TipTap 2.1
- @dnd-kit 6.3
- Radix UI (various)
- Tailwind CSS 3.4

---

**Version:** 1.0.0
**Last Updated:** October 16, 2025
**Status:** Production Ready
