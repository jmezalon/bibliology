# Wireframe

## Design System Foundation

```

### Color Palette
```

Primary Colors:
  --primary-600: #3B82F6    (Main actions, links)
  --primary-700: #2563EB    (Hover states)
  --primary-50:  #EFF6FF    (Light backgrounds)

Secondary Colors:
  --secondary-600: #7C3AED  (Accents, highlights)
  --secondary-700: #6D28D9  (Hover)
  --secondary-50:  #F5F3FF  (Light backgrounds)

Semantic Colors:
  --success-600: #10B981    (Completed, correct)
  --warning-600: #F59E0B    (In progress, warning)
  --error-600:   #EF4444    (Failed, incorrect)
  --info-600:    #3B82F6    (Info messages)

Neutral Grays:
  --gray-900: #111827       (Primary text)
  --gray-700: #374151       (Secondary text)
  --gray-500: #6B7280       (Tertiary text, placeholders)
  --gray-300: #D1D5DB       (Borders)
  --gray-100: #F3F4F6       (Backgrounds)
  --gray-50:  #F9FAFB       (Page background)

Spiritual/Biblical Accent:
  --gold-500:  #F59E0B      (Certificates, achievements)
  --purple-600: #7C3AED     (Wisdom, spirituality)
```

### Typography Scale
```
Font Family:
  --font-sans: 'Inter', system-ui, -apple-system, sans-serif
  --font-serif: 'Merriweather', Georgia, serif (for verse content)
  --font-mono: 'JetBrains Mono', monospace (for references)

Sizes:
  --text-xs:   0.75rem   (12px) - Captions, metadata
  --text-sm:   0.875rem  (14px) - Secondary text
  --text-base: 1rem      (16px) - Body text
  --text-lg:   1.125rem  (18px) - Emphasized text
  --text-xl:   1.25rem   (20px) - Card titles
  --text-2xl:  1.5rem    (24px) - Section headings
  --text-3xl:  1.875rem  (30px) - Page titles
  --text-4xl:  2.25rem   (36px) - Hero titles
```

### Spacing System (8px base)
```
--space-1:  0.25rem  (4px)
--space-2:  0.5rem   (8px)
--space-3:  0.75rem  (12px)
--space-4:  1rem     (16px)
--space-6:  1.5rem   (24px)
--space-8:  2rem     (32px)
--space-12: 3rem     (48px)
--space-16: 4rem     (64px)
```

---

## 1. Teacher's Lesson Builder Interface

### Main Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [≡ Menu]  Bible Study Platform - Lesson Builder         [👤 Teacher Name ▾] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ ┌─────────────────┐                                                          │
│ │  📚 Courses     │  📝 Creating: "The Holy Spirit - Lesson 1"              │
│ │  📝 Lessons     │  Course: Introduction to Pneumatology                    │
│ │  ❓ Quizzes     │  Status: Draft  [💾 Save] [👁 Preview] [📤 Publish]      │
│ │  📊 Analytics   │                                                          │
│ │  ⚙️  Settings   │  ┌──────────────────────────────────────────────────┐   │
│ └─────────────────┘  │  Lesson Settings                                 │   │
│                       │  Title (EN): [The Holy Spirit - Definition      ]│   │
│                       │  Title (FR): [Le Saint Esprit - Définition      ]│   │
│                       │  Duration: [45] minutes                          │   │
│                       │  Description (EN): [Expanding...]               │   │
│                       └──────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ SLIDES (12)                                          [+ Add Slide]     │ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │                                                                        │ │
│  │ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐                               │ │
│  │ │  1   │  │  2   │  │  3   │  │  4   │  ... (horizontally scrolling) │ │
│  │ │[IMG] │  │      │  │      │  │      │                               │ │
│  │ │Title │  │ Text │  │Verse │  │ Quiz │                               │ │
│  │ └──────┘  └──────┘  └──────┘  └──────┘                               │ │
│  │    ▲ Currently editing                                                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────────────┐ │
│  │ SLIDE 1 - Title Slide                           [⋮] [🗑] [⎘ Duplicate]│ │
│  ├────────────────────────────────────────────────────────────────────────┤ │
│  │ Layout: [Title Slide ▾]                    [🎨 Background] [⚙️ Style] │ │
│  │                                                                        │ │
│  │ ┌──────────────────────────────────────────────────────────────────┐ │ │
│  │ │ CONTENT BLOCKS                      [+ Text] [+ Image] [+ More ▾]│ │ │
│  │ ├──────────────────────────────────────────────────────────────────┤ │ │
│  │ │                                                                  │ │ │
│  │ │ ┌─────────────────────────────────────────────────────────┐ [≡] │ │ │
│  │ │ │ [H1] Heading Block                                      │ [×] │ │ │
│  │ │ │ EN: Le Mot Esprit - DEFINITION en Hébreux et Grec      │     │ │ │
│  │ │ │ FR: [The Word Spirit - DEFINITION in Hebrew & Greek   ]│     │ │ │
│  │ │ │ Style: Bold, 32px, Center aligned                       │     │ │ │
│  │ │ └─────────────────────────────────────────────────────────┘     │ │ │
│  │ │                                                                  │ │ │
│  │ │ ┌─────────────────────────────────────────────────────────┐ [≡] │ │ │
│  │ │ │ [IMG] Image Block                                       │ [×] │ │ │
│  │ │ │ [   📷 Upload Image   ] or [🔗 Image URL]              │     │ │ │
│  │ │ │ Size: Full width | Half width | Custom                  │     │ │ │
│  │ │ │ Alt text: [Description for accessibility]               │     │ │ │
│  │ │ └─────────────────────────────────────────────────────────┘     │ │ │
│  │ │                                                                  │ │ │
│  │ │ ┌─────────────────────────────────────────────────────────┐ [≡] │ │ │
│  │ │ │ [T] Text Block (Rich Text Editor)                       │ [×] │ │ │
│  │ │ │ [B I U] [Color ▾] [Align ▾] [Bullet] [Number] [Link]   │     │ │ │
│  │ │ │ ─────────────────────────────────────────────────────── │     │ │ │
│  │ │ │ EN: L'image du souffle évoque ce qui est invisible... │     │ │ │
│  │ │ │                                                         │     │ │ │
│  │ │ │ FR: [The breath imagery evokes what is invisible...   ]│     │ │ │
│  │ │ └─────────────────────────────────────────────────────────┘     │ │ │
│  │ │                                                                  │ │ │
│  │ │ [+ Add Content Block]                                            │ │ │
│  │ └──────────────────────────────────────────────────────────────────┘ │ │
│  │                                                                        │ │
│  │ Teacher Notes (not visible to students):                              │ │
│  │ [Emphasize the connection between ruach and pneuma...]                │ │
│  └────────────────────────────────────────────────────────────────────────┘ │
│                                                                               │
│  [◀ Previous Slide]              [Preview]              [Next Slide ▶]      │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### **Component: Content Block Palette**
```
Purpose: PowerPoint-like toolbar for adding content to slides
Location: Above content area

States:
- Default: Shows primary block types
- Expanded: Shows all block types when "More ▾" clicked

Block Types (with icons):
┌──────────────────────────────────────────────────────────┐
│ Primary (always visible):                                │
│ [📝 Text]  [🖼 Image]  [📖 Verse]  [📚 Vocabulary]       │
│                                                          │
│ More ▾ (dropdown):                                       │
│ [💡 Callout]  [📋 List]  [💬 Quote]  [➖ Divider]       │
│ [❓ Quiz]  [🎯 Comparison]  [📊 Chart]                   │
└──────────────────────────────────────────────────────────┘

Interaction:
- Click block type → adds to bottom of content blocks
- Drag block type → insert at specific position
- Keyboard: Cmd/Ctrl + K → opens quick add menu
```

#### **Component: Slide Thumbnail Strip**
```
Purpose: Navigate between slides, reorder slides
Layout: Horizontal scrolling strip

Thumbnail Card:
┌──────────┐
│  [#]     │ ← Slide number
│          │
│ [Preview]│ ← Mini preview of slide content
│          │
│ Title    │ ← Slide title/type
└──────────┘

States:
- Default: Gray border, white background
- Selected: Blue border, blue accent
- Hover: Show [×] delete and [⎘] duplicate icons
- Drag: Show drag cursor, insertion indicator

Features:
- Drag and drop to reorder
- Click to edit that slide
- Right-click for context menu (duplicate, delete, insert before/after)
```

#### **Component: Content Block**
```
Purpose: Individual editable content unit within a slide

Structure:
┌─────────────────────────────────────────────────────┐
│ [Icon] Block Type Name                 [≡] [⚙] [×] │
│ ─────────────────────────────────────────────────── │
│                                                     │
│  [Content editing area based on block type]        │
│                                                     │
│ [English/French toggle] if bilingual               │
└─────────────────────────────────────────────────────┘

Controls:
- [≡] Drag handle (reorder blocks)
- [⚙] Settings (open block-specific options)
- [×] Delete block

States:
- Default: Light border, collapsed
- Focused: Blue border, expanded options
- Dragging: Shadow effect, insertion indicator between blocks
```

#### **Component: Verse Block (Special)**
```
Because Bible verses are core to the platform

┌─────────────────────────────────────────────────────┐
│ [📖] Bible Verse Block                  [≡] [⚙] [×] │
│ ─────────────────────────────────────────────────── │
│ Reference: [John 3:16          ] [🔍 Lookup]        │
│ Translation: [NIV ▾]                                │
│                                                     │
│ "For God so loved the world that he gave his one   │
│  and only Son, that whoever believes in him shall  │
│  not perish but have eternal life."                │
│                                                     │
│ ☑ Show reference  ☑ Highlight  ☑ Add commentary   │
│                                                     │
│ Commentary (optional):                              │
│ EN: [This verse encapsulates the gospel...]        │
│ FR: [Ce verset résume l'évangile...]               │
└─────────────────────────────────────────────────────┘

Features:
- Auto-lookup verse text from Bible API
- Support multiple translations
- Visual styling options (highlight color, font size)
- Optional commentary/explanation
```

#### **Component: Quiz Block Inline**
```
Allows embedding quiz questions directly in slides

┌─────────────────────────────────────────────────────┐
│ [❓] Quiz Question Block                [≡] [⚙] [×] │
│ ─────────────────────────────────────────────────── │
│ Question Type: [Multiple Choice ▾]                  │
│                                                     │
│ Question (EN):                                      │
│ [What does "Pneuma" mean in Greek?]                │
│                                                     │
│ Question (FR):                                      │
│ [Que signifie "Pneuma" en grec?]                   │
│                                                     │
│ Options:                                            │
│ ○ [Spirit/breath] ✓ Correct                        │
│ ○ [Water]                                           │
│ ○ [Fire]                                            │
│ ○ [Earth]                                           │
│                                                     │
│ [+ Add Option]                                      │
│                                                     │
│ Explanation (shown after answer):                   │
│ EN: [Pneuma (πνεῦμα) means spirit or breath...]    │
│ FR: [Pneuma (πνεῦμα) signifie esprit ou souffle...]│
│                                                     │
│ Points: [1] ☑ Required to continue                 │
└─────────────────────────────────────────────────────┘
```

---

## 2. Student's Lesson Viewer

### Layout (Desktop)
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Bible Study Platform              [EN/FR]      [🔖 Bookmark] [👤 User] │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ← Back to Course                                                            │
│                                                                               │
│  The Holy Spirit - Definition                            [Progress: 15%]    │
│  Introduction to Pneumatology                            Slide 2 of 15      │
│                                                                               │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │                                                                       │   │
│ │                    SLIDE CONTENT AREA                                 │   │
│ │                                                                       │   │
│ │  ╔═══════════════════════════════════════════════════════════════╗   │   │
│ │  ║                                                               ║   │   │
│ │  ║        Le Mot Esprit - DEFINITION en Hébreux et Grec         ║   │   │
│ │  ║                                                               ║   │   │
│ │  ╚═══════════════════════════════════════════════════════════════╝   │   │
│ │                                                                       │   │
│ │  ┌─────────────────────────────────────────────────────────────┐     │   │
│ │  │ [Image: Diagram showing Ruach and Pneuma]                   │     │   │
│ │  │                                                              │     │   │
│ │  └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ │  L'image du souffle évoque ce qui est invisible, tout en             │   │
│ │  restant réel et actif. La pensée du souffle est liée aussi à        │   │
│ │  celle de la vie, car le signe qu'une personne vit, c'est            │   │
│ │  qu'elle respire.                                                     │   │
│ │                                                                       │   │
│ │  ┌────────────────────────────────────────────────────────────┐      │   │
│ │  │ 📖 John 3:8                                                 │      │   │
│ │  │                                                             │      │   │
│ │  │ "The wind blows wherever it pleases. You hear its sound,   │      │   │
│ │  │  but you cannot tell where it comes from or where it is    │      │   │
│ │  │  going. So it is with everyone born of the Spirit."        │      │   │
│ │  └────────────────────────────────────────────────────────────┘      │   │
│ │                                                                       │   │
│ │  ┌────────────────────────────────────────────────────────────┐      │   │
│ │  │ 📚 Vocabulary                                               │      │   │
│ │  │ Ruach (רוּחַ): Hebrew word meaning wind, breath, or spirit │      │   │
│ │  │ Pneuma (πνεῦμα): Greek equivalent, also spirit or breath   │      │   │
│ │  └────────────────────────────────────────────────────────────┘      │   │
│ │                                                                       │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │ 📝 My Notes                                              [Save]      │   │
│  │ [Type your notes here...]                                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│  ┌────────────────────────────────────────────────────────────────┐         │
│  │ [◀ Previous Slide]     [Pause] [Play ▶]     [Next Slide ▶]    │         │
│  └────────────────────────────────────────────────────────────────┘         │
│                                                                               │
│  Slide Navigation:                                                           │
│  [●][●][○][○][○][○][○][○][○][○][○][○][○][○][○]                             │
│   1  2  3  4  5  6  7  8  9  10 11 12 13 14 15                              │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Mobile Layout
```
┌─────────────────────────────┐
│ [☰]  Lesson    [🔖] [👤]   │
├─────────────────────────────┤
│                             │
│ ← The Holy Spirit           │
│   Slide 2/15  [EN/FR]       │
│                             │
│ ┌─────────────────────────┐ │
│ │                         │ │
│ │   Le Mot Esprit         │ │
│ │   DEFINITION            │ │
│ │                         │ │
│ │ [Swipe for next →]      │ │
│ │                         │ │
│ │   [Image]               │ │
│ │                         │ │
│ │ L'image du souffle      │ │
│ │ évoque ce qui est       │ │
│ │ invisible...            │ │
│ │                         │ │
│ │ [Expand to read more]   │ │
│ │                         │ │
│ └─────────────────────────┘ │
│                             │
│ [Progress: ▓▓░░░░░░░░ 15%] │
│                             │
│ [◀]  [Notes]  [Quiz]  [▶]  │
│                             │
└─────────────────────────────┘
```

### Component Specifications

#### **Component: Slide Content Renderer**
```
Purpose: Display slide content responsively with proper styling

Content Types Rendering:

1. Heading:
   ┌──────────────────────────┐
   │ Large, bold, centered    │
   │ 32-40px font size        │
   └──────────────────────────┘

2. Text Block:
   ┌────────────────────────────────┐
   │ Regular paragraph text         │
   │ 16-18px, line-height 1.6       │
   │ Max width 65ch for readability │
   └────────────────────────────────┘

3. Bible Verse:
   ┌─────────────────────────────────┐
   │ 📖 John 3:16                    │
   │ ─────────────────────────────── │
   │ "For God so loved the world..." │
   │                                 │
   │ Serif font, slightly larger     │
   │ Light purple background         │
   │ Left border accent              │
   └─────────────────────────────────┘

4. Vocabulary:
   ┌─────────────────────────────────┐
   │ 📚 Term                         │
   │ ─────────────────────────────── │
   │ Definition text here            │
   │                                 │
   │ Light blue background           │
   │ Collapsible on mobile           │
   └─────────────────────────────────┘

5. Callout:
   ┌─────────────────────────────────┐
   │ ⚠️  Important Note              │
   │ ─────────────────────────────── │
   │ Highlighted content here        │
   │                                 │
   │ Yellow/orange background        │
   │ Stands out from main content    │
   └─────────────────────────────────┘

6. Quiz Question (Inline):
   ┌─────────────────────────────────┐
   │ ❓ Check Your Understanding     │
   │ ─────────────────────────────── │
   │ What does "Pneuma" mean?        │
   │                                 │
   │ ○ Spirit/breath                 │
   │ ○ Water                         │
   │ ○ Fire                          │
   │ ○ Earth                         │
   │                                 │
   │ [Submit Answer]                 │
   └─────────────────────────────────┘

   After answer:
   ┌─────────────────────────────────┐
   │ ✓ Correct!                      │
   │ ─────────────────────────────── │
   │ Pneuma (πνεῦμα) means spirit    │
   │ or breath in Greek.             │
   │                                 │
   │ [Continue to Next Slide]        │
   └─────────────────────────────────┘
```

#### **Component: Progress Indicator**
```
Purpose: Show student's progress through lesson

Desktop:
┌──────────────────────────────────────┐
│ Progress: 15%                        │
│ [▓▓▓░░░░░░░░░░░░░░░░░] Slide 2/15  │
└──────────────────────────────────────┘

Mobile (Compact):
┌──────────────────────┐
│ [▓▓░░░░░░░░] 2/15    │
└──────────────────────┘

Features:
- Visual progress bar (blue fill)
- Current slide / total slides
- Percentage completion
- Updates in real-time as student progresses
```

#### **Component: Navigation Controls**
```
Purpose: Navigate between slides, control presentation flow

Desktop:
┌─────────────────────────────────────────────────┐
│ [◀ Previous]  [⏸ Pause]  [▶ Play]  [Next ▶]   │
└─────────────────────────────────────────────────┘

Features:
- Previous/Next buttons (keyboard: ←/→)
- Auto-advance toggle (Play/Pause)
- Disabled states (Previous on first slide, Next on last)
- Keyboard shortcuts displayed on hover

Mobile (Swipe + Buttons):
┌──────────────────────────┐
│  [◀]  [Notes]  [Quiz] [▶]│
└──────────────────────────┘

- Swipe left/right for navigation
- Buttons for accessibility
```

#### **Component: Slide Dots Navigation**
```
Purpose: Quick navigation, visual overview of lesson length

┌────────────────────────────────────────────────────┐
│ [●][●][○][○][○][○][○][○][○][○][○][○][○][○][○]    │
│  1  2  3  4  5  6  7  8  9  10 11 12 13 14 15     │
└────────────────────────────────────────────────────┘

States:
- ● Completed (blue, filled)
- ◉ Current (blue, ring)
- ○ Not started (gray, outline)
- ◐ Quiz slide (special indicator)

Interaction:
- Click dot → jump to that slide
- Hover → show slide title tooltip
- Mobile: Scrollable horizontally
```

#### **Component: Notes Panel**
```
Purpose: Allow students to take personal notes

┌──────────────────────────────────────────────────┐
│ 📝 My Notes                        [Expand] [×]  │
│ ────────────────────────────────────────────────│
│ [Type your notes here...]                        │
│                                                  │
│                                                  │
│                                [Save]  [Cancel]  │
└──────────────────────────────────────────────────┘

Features:
- Autosave every 5 seconds
- Associated with specific slide
- Can expand to full screen
- Markdown support (optional)
- Search across all notes
- Export notes at end of course

Mobile:
- Bottom sheet that slides up
- Full screen mode
- Voice-to-text option
```

---

## 3. Quiz Builder Interface

### Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Bible Study Platform - Quiz Builder                  [👤 Teacher Name ▾]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│ ← Back to Lesson: "The Holy Spirit - Definition"                            │
│                                                                               │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ Quiz Settings                                                         │   │
│ │                                                                       │   │
│ │ Quiz Title (EN): [Understanding the Holy Spirit - Quiz 1        ]    │   │
│ │ Quiz Title (FR): [Comprendre le Saint-Esprit - Quiz 1           ]    │   │
│ │                                                                       │   │
│ │ Quiz Type: ◉ Practice  ○ Graded Assessment  ○ Completion Test       │   │
│ │                                                                       │   │
│ │ Settings:                                                             │   │
│ │   Time Limit: [○ No limit  ● Set limit: [30] minutes]               │   │
│ │   Passing Score: [70]%                                               │   │
│ │   Max Attempts: [○ Unlimited  ● Limit to: [3] attempts]             │   │
│ │   ☑ Shuffle questions                                                │   │
│ │   ☑ Show correct answers after submission                            │   │
│ │   ☐ Allow review before submission                                   │   │
│ │                                                                       │   │
│ │ Position: ● End of lesson  ○ After slide: [Slide 8 ▾]               │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│ ┌───────────────────────────────────────────────────────────────────────┐   │
│ │ QUESTIONS (5)                                   [+ Add Question ▾]    │   │
│ │                                                                       │   │
│ │ ┌─────────────────────────────────────────────────────────────┐ [≡] │   │
│ │ │ Question 1 - Multiple Choice                    [⚙] [⎘] [🗑] │ [×] │   │
│ │ ├─────────────────────────────────────────────────────────────┤     │   │
│ │ │                                                             │     │   │
│ │ │ Question Text (EN):                                         │     │   │
│ │ │ [What does the Hebrew word "Ruach" mean?              ]    │     │   │
│ │ │                                                             │     │   │
│ │ │ Question Text (FR):                                         │     │   │
│ │ │ [Que signifie le mot hébreu "Ruach" ?                ]    │     │   │
│ │ │                                                             │     │   │
│ │ │ Answer Options:                                             │     │   │
│ │ │ ┌────────────────────────────────────────────────────┐     │     │   │
│ │ │ │ ☑ A. Wind, breath, or spirit                       │ [≡] │     │   │
│ │ │ │    EN: [Wind, breath, or spirit              ]     │ [×] │     │   │
│ │ │ │    FR: [Vent, souffle ou esprit              ]     │     │     │   │
│ │ │ │    ✓ Correct Answer                                │     │     │   │
│ │ │ └────────────────────────────────────────────────────┘     │     │   │
│ │ │                                                             │     │   │
│ │ │ ┌────────────────────────────────────────────────────┐     │     │   │
│ │ │ │ ☐ B. Water                                         │ [≡] │     │   │
│ │ │ │    EN: [Water                                ]     │ [×] │     │   │
│ │ │ │    FR: [Eau                                  ]     │     │     │   │
│ │ │ └────────────────────────────────────────────────────┘     │     │   │
│ │ │                                                             │     │   │
│ │ │ ┌────────────────────────────────────────────────────┐     │     │   │
│ │ │ │ ☐ C. Fire                                          │ [≡] │     │   │
│ │ │ │    EN: [Fire                                 ]     │ [×] │     │   │
│ │ │ │    FR: [Feu                                  ]     │     │     │   │
│ │ │ └────────────────────────────────────────────────────┘     │     │   │
│ │ │                                                             │     │   │
│ │ │ [+ Add Option]                                              │     │   │
│ │ │                                                             │     │   │
│ │ │ Explanation (shown after answer):                           │     │   │
│ │ │ EN: [Ruach (רוּחַ) is the Hebrew word for wind, breath...]│     │   │
│ │ │ FR: [Ruach (רוּחַ) est le mot hébreu pour vent, souffle...]│    │   │
│ │ │                                                             │     │   │
│ │ │ Points: [1]  ☑ Required                                    │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ │ ┌─────────────────────────────────────────────────────────────┐ [≡] │   │
│ │ │ Question 2 - True/False                         [⚙] [⎘] [🗑] │ [×] │   │
│ │ ├─────────────────────────────────────────────────────────────┤     │   │
│ │ │ Question: The Holy Spirit is omnipresent.                   │     │   │
│ │ │ Answer: ◉ True  ○ False                                     │     │   │
│ │ │ [Collapsed - Click to edit]                                 │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ │ ┌─────────────────────────────────────────────────────────────┐ [≡] │   │
│ │ │ Question 3 - Fill in the Blank                  [⚙] [⎘] [🗑] │ [×] │   │
│ │ ├─────────────────────────────────────────────────────────────┤     │   │
│ │ │ Question: The Greek word for spirit is _________.           │     │   │
│ │ │ Accepted Answers: Pneuma, πνεῦμα                            │     │   │
│ │ │ [Collapsed - Click to edit]                                 │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ │ ┌─────────────────────────────────────────────────────────────┐ [≡] │   │
│ │ │ Question 4 - Matching                           [⚙] [⎘] [🗑] │ [×] │   │
│ │ ├─────────────────────────────────────────────────────────────┤     │   │
│ │ │ Match the terms with their meanings:                        │     │   │
│ │ │ Ruach ⟷ Hebrew for spirit                                  │     │   │
│ │ │ Pneuma ⟷ Greek for spirit                                  │     │   │
│ │ │ [Collapsed - Click to edit]                                 │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ │ ┌─────────────────────────────────────────────────────────────┐ [≡] │   │
│ │ │ Question 5 - Short Answer                       [⚙] [⎘] [🗑] │ [×] │   │
│ │ ├─────────────────────────────────────────────────────────────┤     │   │
│ │ │ Question: Explain the significance of breath imagery...     │     │   │
│ │ │ ⚠️  Requires manual grading                                 │     │   │
│ │ │ [Collapsed - Click to edit]                                 │     │   │
│ │ └─────────────────────────────────────────────────────────────┘     │   │
│ │                                                                       │   │
│ └───────────────────────────────────────────────────────────────────────┘   │
│                                                                               │
│ Total Points: 5                                                              │
│ Auto-graded: 4 questions | Manual grading: 1 question                        │
│                                                                               │
│ [💾 Save as Draft]  [👁 Preview Quiz]  [📤 Publish]                          │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### **Component: Question Type Selector**
```
Purpose: Choose question type when adding new question

┌──────────────────────────────────────────────────┐
│ Add Question                                     │
│                                                  │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │     📝     │  │     ✓/✗    │  │    ____    │ │
│ │  Multiple  │  │    True/   │  │   Fill in  │ │
│ │   Choice   │  │   False    │  │   Blank    │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│                                                  │
│ ┌────────────┐  ┌────────────┐  ┌────────────┐ │
│ │    A→B     │  │     📄     │  │     ✍️     │ │
│ │  Matching  │  │   Short    │  │    Essay   │ │
│ │            │  │   Answer   │  │            │ │
│ └────────────┘  └────────────┘  └────────────┘ │
│                                                  │
│ [Cancel]                                         │
└──────────────────────────────────────────────────┘

Each type shows:
- Icon representation
- Type name
- Brief description on hover
```

#### **Component: Question Card (Collapsed)**
```
Purpose: Compact view of question in list

┌───────────────────────────────────────────────────┐
│ Question 2 - True/False          [⚙] [⎘] [🗑] [≡]│
│ The Holy Spirit is omnipresent.                  │
│ Answer: True | Points: 1                         │
│                                                  │
│ [Click to expand and edit]                       │
└───────────────────────────────────────────────────┘

States:
- Collapsed: Shows summary only
- Expanded: Full editing interface
- Dragging: Can reorder questions
```

---

## 4. Student Dashboard

### Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Bible Study Platform                            [🔔3] [👤 Jean Dupont ▾]│
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Welcome back, Jean! 👋                                              │    │
│  │ You're making great progress. Keep going!                           │    │
│  │                                                                     │    │
│  │ 🔥 3 day streak    |    📚 2 courses in progress    |    ⭐ 145 pts │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Continue Learning                                                   │    │
│  │                                                                     │    │
│  │ ┌──────────────────────────────────────────────────────────────┐   │    │
│  │ │ [Thumbnail]          Introduction to Pneumatology            │   │    │
│  │ │                      Lesson 3: Gifts of the Spirit           │   │    │
│  │ │                      [▓▓▓▓▓▓▓░░░░░░░] 45% Complete          │   │    │
│  │ │                      Last accessed: 2 hours ago              │   │    │
│  │ │                      [Continue Lesson →]                     │   │    │
│  │ └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ My Courses                           [View All] [🔍 Search] [Filter▾] │  │
│  │                                                                       │  │
│  │ ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │  │
│  │ │ [Image]      │  │ [Image]      │  │ [Image]      │                │  │
│  │ │              │  │              │  │              │                │  │
│  │ │ Introduction │  │ The Fruit of │  │ Prayer and   │                │  │
│  │ │ to           │  │ the Spirit   │  │ the Spirit   │                │  │
│  │ │ Pneumatology │  │              │  │              │                │  │
│  │ │              │  │              │  │              │                │  │
│  │ │ ▓▓▓▓▓░░░ 45% │  │ ▓▓▓░░░░░ 25% │  │ ░░░░░░░░  0% │                │  │
│  │ │ 6/15 lessons │  │ 3/12 lessons │  │ 0/8 lessons  │                │  │
│  │ │              │  │              │  │              │                │  │
│  │ │ [Continue →] │  │ [Continue →] │  │ [Start →]    │                │  │
│  │ └──────────────┘  └──────────────┘  └──────────────┘                │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Recent Achievements 🏆                                       [View All]│  │
│  │                                                                       │  │
│  │ ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │ │     🎓      │  │     ⚡      │  │     📖      │                   │  │
│  │ │ Completed   │  │  3-Day      │  │  Bookworm   │                   │  │
│  │ │ First Quiz  │  │  Streak     │  │  10 Lessons │                   │  │
│  │ │ Oct 10      │  │  Oct 12     │  │  Oct 14     │                   │  │
│  │ └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Upcoming                                                              │  │
│  │                                                                       │  │
│  │ ⏰ Quiz: "Understanding Pneuma" due in 2 days                        │  │
│  │ 📅 New lesson available: "The Spirit in the Old Testament"           │  │
│  │ 🎯 Achievement unlock: Complete 15 lessons (3 more to go!)           │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

### Component Specifications

#### **Component: Course Card**
```
Purpose: Display course with progress info

┌────────────────────────────────┐
│ [Thumbnail Image]              │
│                                │
│ Course Title                   │
│ Brief description...           │
│                                │
│ [▓▓▓▓░░░░░░] 45%              │
│ 6/15 lessons completed         │
│                                │
│ ⏱ 2h 30m spent                │
│                                │
│ [Continue Learning →]          │
└────────────────────────────────┘

States:
- Not Started: Gray progress bar, "Start" button
- In Progress: Blue progress bar, "Continue" button
- Completed: Green checkmark, "Review" button
- Hover: Slight elevation, show last accessed date

Card Badge (optional):
- 🆕 New course
- 🔥 Popular
- ⭐ Featured
```

#### **Component: Stats Summary**
```
Purpose: Gamification and engagement metrics

┌──────────────────────────────────────────────────┐
│ 🔥 3 day streak                                  │
│ Keep it going! Study today to maintain streak.   │
│                                                  │
│ 📚 2 courses in progress                         │
│ 6 lessons completed this week                   │
│                                                  │
│ ⭐ 145 points earned                             │
│ 55 more to reach next level!                    │
└──────────────────────────────────────────────────┘

Metrics:
- Study streak (consecutive days)
- Total courses enrolled
- Lessons completed
- Points/XP earned
- Certificates earned
- Quiz scores average
```

---

## 5. Teacher Analytics Dashboard

### Layout
```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Bible Study Platform - Analytics                     [👤 Teacher Name ▾]    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                               │
│  ┌────────────────────────────────────────────────────────────┐             │
│  │ Overview - Last 30 Days                    [Date Range ▾]  │             │
│  │                                                             │             │
│  │ ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │             │
│  │ │   👥     │  │    📚    │  │    ✅    │  │    ⭐    │   │             │
│  │ │   245    │  │    12    │  │    156   │  │   4.7    │   │             │
│  │ │ Students │  │ Courses  │  │ Completed│  │ Avg Score│   │             │
│  │ │  +12%    │  │   +2     │  │  +23%    │  │   +0.2   │   │             │
│  │ └──────────┘  └──────────┘  └──────────┘  └──────────┘   │             │
│  └────────────────────────────────────────────────────────────┘             │
│                                                                               │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Enrollment Trends                                           [Export]  │  │
│  │                                                                       │  │
│  │     │                                             ╱╲                  │  │
│  │ 300 │                                       ╱────╯  ╲                │  │
│  │     │                                 ╱────╯         ╲──╮            │  │
│  │ 200 │                         ╱──────╯                  ╲            │  │
│  │     │                 ╱──────╯                           ╲           │  │
│  │ 100 │         ╱──────╯                                    ╲──        │  │
│  │     │  ──────╯                                               ╲       │  │
│  │   0 ├────────┬────────┬────────┬────────┬────────┬────────┬──────   │  │
│  │     Jan    Feb    Mar    Apr    May    Jun    Jul    Aug            │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Course Performance                              [Sort by ▾] [View]  │    │
│  │                                                                     │    │
│  │ ┌──────────────────────────────────────────────────────────────┐   │    │
│  │ │ Course                  │ Students │ Completion │ Avg Score  │   │    │
│  │ ├──────────────────────────────────────────────────────────────┤   │    │
│  │ │ Intro to Pneumatology   │   124    │    78%     │   4.6/5   │   │    │
│  │ │ The Fruit of the Spirit │    98    │    65%     │   4.8/5   │   │    │
│  │ │ Prayer and the Spirit   │    67    │    45%     │   4.5/5   │   │    │
│  │ │ Gifts of the Spirit     │    89    │    82%     │   4.7/5   │   │    │
│  │ └──────────────────────────────────────────────────────────────┘   │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Quiz Performance Analysis                                           │    │
│  │                                                                     │    │
│  │ Lesson: Introduction to Pneumatology - Quiz 1                      │    │
│  │                                                                     │    │
│  │ Question Analysis:                                                  │    │
│  │ ┌──────────────────────────────────────────────────────────────┐   │    │
│  │ │ Q1: What does "Pneuma" mean?                   ✓ 94% correct │   │    │
│  │ │ Q2: The Holy Spirit is omnipresent             ✓ 89% correct │   │    │
│  │ │ Q3: Fill in the blank: The Greek word...       ✓ 72% correct │   │    │
│  │ │ Q4: Match the terms with meanings              ⚠️ 58% correct │   │    │
│  │ │ Q5: Explain the breath imagery                 ⏳ Manual grading│   │    │
│  │ └──────────────────────────────────────────────────────────────┘   │    │
│  │                                                                     │    │
│  │ ⚠️ Question 4 has low success rate. Consider:                      │    │
│  │    • Reviewing the lesson content                                   │    │
│  │    • Simplifying the matching options                               │    │
│  │    • Adding more examples in the lesson                             │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │ Student Engagement                                                  │    │
│  │                                                                     │    │
│  │ Average time per lesson: 28 minutes                                 │    │
│  │ Most accessed lesson: "Gifts of the Spirit - Lesson 2"             │    │
│  │ Peak study times: Tuesday 7-9 PM, Saturday 10 AM-12 PM             │    │
│  │                                                                     │    │
│  │ Students needing attention: 12                                      │    │
│  │ • 8 students with low quiz scores (< 60%)                          │    │
│  │ • 4 students inactive for 14+ days                                  │    │
│  │                                                                     │    │
│  │ [View Detailed Report]                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
└───────────────────────────────────────────────────────────────────────────────┘
```

---

## User Flows

### Flow 1: Teacher Creates New Lesson
```
1. Login → Dashboard
   ↓
2. Click "Create New Lesson" or go to existing course
   ↓
3. Choose: "Start from scratch" or "Import PowerPoint"
   ↓
   ├─→ If Import PowerPoint:
   │   ├─→ Upload .pptx file
   │   ├─→ System parses and converts
   │   ├─→ Preview converted slides
   │   ├─→ Make adjustments
   │   └─→ Confirm import
   │
   └─→ If Start from scratch:
       ├─→ Enter lesson details (title, description)
       ├─→ Add slides one by one
       ├─→ For each slide:
       │   ├─→ Choose layout
       │   ├─→ Add content blocks
       │   ├─→ Style and format
       │   └─→ Add teacher notes
       │
       ├─→ Add quizzes (inline or end)
       │   ├─→ Create questions
       │   ├─→ Set correct answers
       │   └─→ Add explanations
       │
       ├─→ Preview lesson (student view)
       ├─→ Save as draft
       └─→ Publish when ready
```

### Flow 2: Student Takes Lesson
```
1. Login → Dashboard
   ↓
2. See "Continue Learning" or browse courses
   ↓
3. Click course/lesson
   ↓
4. Lesson viewer opens
   ↓
5. Navigate through slides
   │ (Next/Previous, keyboard arrows, or swipe on mobile)
   ↓
6. Interact with content:
   ├─→ Read text
   ├─→ View images
   ├─→ Read Bible verses
   ├─→ Take notes
   ├─→ Bookmark important slides
   └─→ Answer inline quiz questions
       ├─→ Submit answer
       ├─→ See if correct/incorrect
       └─→ Read explanation
   ↓
7. Complete lesson
   ↓
8. Take end-of-lesson quiz (if applicable)
   ├─→ Answer all questions
   ├─→ Review answers (if allowed)
   ├─→ Submit quiz
   └─→ See results and score
   ↓
9. Return to dashboard (progress updated)
   ↓
10. If course complete → Receive certificate
```

---

## Responsive Design Strategy

### Breakpoints
```
Mobile:     320px - 767px
Tablet:     768px - 1023px
Desktop:    1024px - 1439px
Large:      1440px+
```

### Mobile Adaptations

**Lesson Builder (Teacher):**
- Vertical stacking of all elements
- Bottom navigation for primary actions
- Slide thumbnails as vertical list
- Simplified content block editor (one at a time)
- Floating action button for adding content

**Lesson Viewer (Student):**
- Full-screen slides
- Swipe for navigation
- Collapsible notes panel
- Bottom navigation bar
- Progressive content loading

**Dashboard:**
- Single column layout
- Cards stack vertically
- Simplified stats (show fewer metrics)
- Hamburger menu for navigation

---

## Accessibility Features

### Keyboard Navigation
```
Lesson Viewer:
- Arrow keys (←/→): Previous/Next slide
- Space: Play/Pause auto-advance
- B: Toggle bookmark
- N: Open notes panel
- Escape: Exit lesson

Lesson Builder:
- Tab: Navigate between fields
- Cmd/Ctrl + S: Save
- Cmd/Ctrl + P: Preview
- Cmd/Ctrl + Enter: Publish
- Cmd/Ctrl + K: Quick add content block
```

### Screen Reader Support
- All images have descriptive alt text
- ARIA labels on all interactive elements
- Landmarks for page regions
- Skip links to main content
- Descriptive link text (no "click here")
- Live regions for dynamic updates

### Visual Accessibility
- Minimum contrast ratio: 4.5:1 (WCAG AA)
- Focus indicators on all interactive elements
- No information conveyed by color alone
- Resizable text (up to 200%)
- Reduced motion option

---

## Animation & Microinteractions

### Slide Transitions
```
Default: Fade (300ms ease-in-out)
Optional: Slide, Zoom, None

Configurable by teacher per lesson
```

### Button Interactions
```
Hover: 
- Scale: 1.02
- Shadow: elevation increase
- Color: slight darkening

Active/Click:
- Scale: 0.98
- Immediate visual feedback

Loading:
- Spinner or progress indicator
- Disabled state
```

### Progress Animations
```
Progress bar:
- Smooth fill animation (500ms)
- Pulse effect on completion
- Confetti animation for course completion



