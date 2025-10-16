# Vision

Create a bilingual (EN/FR) platform where teachers build rich, PowerPoint‑style Bible study lessons and students learn through a Coursera/Khan Academy‑like experience with quizzes, notes, and completion certificates. Support importing existing PowerPoints and refining them in an intuitive web authoring studio.

---

## Personas & Goals

- **Teacher (PowerPoint‑native author)**: Import/author lessons, reuse slides, embed scripture, add quizzes, publish, track progress.
- **Student (mobile‑first learner)**: Browse lessons, take notes, answer quizzes, resume where they left off, earn certificates.
- **Admin (church staff)**: Moderate content, manage users, analytics.

---

## MVP Scope (8–10 weeks)

1. PowerPoint import → editable lesson. 2) Web authoring studio with slide‑like canvas. 3) Lesson player (web + responsive). 4) Quizzes (MCQ, T/F, short answer). 5) EN/FR localization per lesson & per slide block. 6) Progress tracking + completion certificate (PDF). 7) Basic analytics.

Stretch: Mobile app shell (Expo), offline reading, discussion threads, leaderboards.

---

## High‑Level Architecture

- **Frontend**: Next.js (App Router), TypeScript, Tailwind + shadcn/ui; React Query (TanStack) for data fetching; TipTap (ProseMirror) for rich text; UploadThing or custom S3 uploader.
- **Backend**: NestJS (Node/TypeScript) or Express; Postgres (Supabase or RDS) + Prisma ORM; Redis for queues/caching; BullMQ for background jobs (PPTX import, image processing); Websockets for live collaboration (later).
- **Storage**: S3/Cloudflare R2 for assets; CDN via CloudFront.
- **Auth**: Clerk/Auth0/Supabase Auth with email/OAuth; roles: `teacher`, `student`, `admin`.
- **Docs/Content processing**: `python-pptx` + `pytesseract` (OCR) in a separate worker container; fallback to LibreOffice headless for tricky PPTX; `pdfkit` for certificates.
- **Search**: Postgres full‑text search (MVP), upgradeable to OpenSearch/Algolia.
- **Translations**: i18n fields in DB; optional MT seed (DeepL/Google) then human edit in Studio.
- **CI/CD**: GitHub Actions → Vercel (frontend) + Fly.io/Render/Heroku (backend) + Supabase/RDS (DB) + S3 (assets).

---

## Content Model (block‑based, PowerPoint‑friendly)

**Lesson**

- id, slug, status (draft/published), coverImageUrl, categories[], tags[]
- languageDefault ("en"|"fr")
- metadata: durationMinutes, difficulty, scriptureRefs[]
- i18n: { title["en"|"fr"], description["en"|"fr"] }

**Section** (optional grouping inside lesson)

- id, title i18n, order

**Slide** (logical page)

- id, order, layout (title-only | two-column | image-left | quiz)
- notes (teacher notes, i18n)

**Block** (atomic units within a slide)

- id, type: `heading`, `paragraph`, `verse`, `image`, `list`, `callout`, `vocabulary`, `quiz`, `divider`
- content i18n (rich text JSON via TipTap), mediaUrl, attribution, verseRef
- style: bg, alignment, emphasis (to emulate PowerPoint shapes/callouts)

**Quiz** (attached to block or slide)

- id, type: `mcq` | `true_false` | `short_answer` | `match`
- question i18n, choices[], correctAnswers[], explanation i18n, points

**Attempt**

- userId, lessonId, answers[], score, startedAt, completedAt

**Certificate**

- id, userId, lessonId, pdfUrl, issuedAt

ER hints: Lesson 1‑_ Sections 1‑_ Slides 1‑\* Blocks; Slide can contain many Blocks (ordered); Block optionally references Quiz.

---

## Database Schema (Prisma‑style sketch)

```ts
model User { id String @id @default(cuid()); role Role; name String; email String @unique; ... }

model Lesson { id String @id @default(cuid()); slug String @unique; status LessonStatus; coverImageUrl String?; languageDefault String @default("en"); durationMinutes Int?; difficulty String?; scriptureRefs String[]; title Json; description Json; createdBy String; createdAt DateTime @default(now()); updatedAt DateTime @updatedAt }

model Section { id String @id @default(cuid()); lessonId String; order Int; title Json }

model Slide { id String @id @default(cuid()); lessonId String; sectionId String?; order Int; layout String; notes Json }

model Block { id String @id @default(cuid()); slideId String; order Int; type String; content Json; mediaUrl String?; attribution String?; style Json }

model Quiz { id String @id @default(cuid()); blockId String?; slideId String?; type String; question Json; choices Json?; correctAnswers Json?; explanation Json?; points Int @default(1) }

model Attempt { id String @id @default(cuid()); userId String; lessonId String; answers Json; score Int; startedAt DateTime @default(now()); completedAt DateTime? }

model Certificate { id String @id @default(cuid()); userId String; lessonId String; pdfUrl String; issuedAt DateTime @default(now()) }
```

---

## PowerPoint Import Pipeline

1. **Upload**: Teacher uploads `.pptx` (and optionally `.pdf`).
2. **Extract** (worker):
   - Use `python-pptx` to iterate slides, shapes.
   - Export images at 2x for retina; save to S3; store alt text if present.
   - For text in images, run Tesseract (HT/FR as needed) to capture embedded text.
   - Convert to **Block JSON** while preserving: headings, paragraphs, bullets, tables (MVP: render tables as images + CSV extract), callouts, verses, and quiz items if recognized (use shape titles/keywords like `QUIZ:`).

3. **Layout mapping**: Guess `layout` (e.g., two‑column if two major text frames >40% width).
4. **Bilingual capture**: Detect language per text run; attach to i18n fields `{en:..., fr:...}` when a duplicate block in another language is found on the same slide; otherwise seed translation via MT for the missing locale with a flag `needsReview=true`.
5. **Review UI**: Present a side‑by‑side **Diff Panel**: Original slide preview vs. reconstructed blocks. Author can approve, edit, or re‑layout.
6. **Publish**: On approval, persist blocks; generate a static preview image per slide for sharing; index content for search.

**Fallbacks**: If parsing fails, store a high‑res slide image and create a single `image` block with optional OCR text for accessibility; author can split it into blocks manually.

---

## Authoring Studio (PowerPoint‑familiar UX)

- **Slide navigator** (left): thumbnails; drag‑reorder.
- **Canvas** (center): block snapping grid, text boxes, callouts, images; keyboard shortcuts (`Ctrl/Cmd+B/I/U`, `Alt+Drag` to duplicate, `Shift` to constrain movements).
- **Properties panel** (right): block type, verse picker (Bible API), style (fill, border, corner radius), language tabs (EN/FR), quiz editor.
- **Block library**: Title, Verse (with ref & translation selector), Quote, Vocabulary (term/definition pair), Image+Caption, Two‑Column, Callout, Quiz.
- **Power features**: Master layouts; reusable components ("Snippets"); version history; undo/redo; autosave.
- **Accessibility**: Alt text required for images; heading order hints; color contrast checker.

---

## Lesson Player (Student UX)

- **Course page**: cover, description, progress, duration, tags, Start/Resume.
- **Player**: focus mode; slide list; prev/next; transcript pane (optional); dual‑language toggle (show EN, FR, or both split‑view).
- **Quiz moments**: inline quizzes pause progress; explanations after submit; configurable retries.
- **Notes & highlights**: personal notes per slide; export notes.
- **Completion**: final assessment + score; certificate generation; shareable completion page.

---

## Quizzes & Assessment

- Question types: MCQ, T/F, short answer, matching.
- Question banks reusable across lessons; randomization; time limits per quiz (optional).
- Scoring & pass thresholds; item analysis (difficulty, discrimination later).

---

## Localization (EN/FR)

- Every user‑visible string in blocks is `{ en?: string; fr?: string; needsReview?: boolean }`.
- UI copy via `next-intl` (or `react-intl`).
- Live toggle; per‑user language preference.

---

## API (REST, MVP)

- `POST /uploads/pptx` – returns `importJobId`.
- `GET /imports/:jobId` – job status & preview JSON.
- `POST /lessons`/`GET /lessons/:id`/`PUT`/`PATCH`/`DELETE`.
- `POST /lessons/:id/slides`/`blocks`.
- `POST /quizzes` & `POST /attempts`.
- `GET /progress/:userId`.

---

## Security & Permissions

- Roles/ownership enforcement at row level.
- Signed upload URLs. Principle of least privilege IAM for S3.
- Rate limiting on public endpoints; audit logs for edits/publish.

---

## Analytics (MVP)

- Basic: starts, completions, time‑on‑slide, quiz performance.
- Teacher dashboard: funnel (started → completed), hardest questions, export CSV.

---

## Example Block JSON (from the provided slide)

```json
{
  "slide": {
    "layout": "two-column",
    "blocks": [
      {
        "type": "heading",
        "content": { "fr": "Le Mot Esprit — Définition", "en": "The Word Spirit — Definition" },
        "order": 1
      },
      {
        "type": "paragraph",
        "content": { "fr": "Le mot \"esprit\"…", "en": "The word 'spirit'…" },
        "order": 2
      },
      {
        "type": "callout",
        "content": { "fr": "La puissance de l'autorité du St‑Esprit…" },
        "style": { "bg": "#FFF9C4" },
        "order": 3
      },
      { "type": "verse", "content": { "fr": "Jean 3:8" }, "order": 4 },
      {
        "type": "quiz",
        "content": { "fr": "Quelles qualités le Saint‑Esprit partage…?" },
        "order": 5,
        "quiz": {
          "type": "mcq",
          "question": { "fr": "Quelles qualités…?" },
          "choices": { "fr": ["Éternel", "Omniscient", "Aucun des deux"] },
          "correctAnswers": [0, 1]
        }
      }
    ]
  }
}
```

---

## Import Worker Pseudocode

```python
for slide in ppt.slides:
  img_paths = export_images(slide)
  blocks = []
  for shape in slide.shapes:
    if shape.has_text_frame:
      blocks.append(to_block(shape.text_frame))
    elif shape.shape_type == PICTURE:
      path = save_image(shape)
      ocr_text = ocr(path, langs=["eng","fra"]) if low_text_density(slide) else None
      blocks.append({"type":"image","mediaUrl":path,"content":{"en":ocr_text}})
# infer layout, write JSON, upload assets
```

---

## Teacher Onboarding Flow

1. Create account → choose **Teacher** role. 2) Import `.pptx` or **Start from template**. 3) Review & fix blocks (dual‑pane). 4) Add quizzes. 5) Preview as student. 6) Publish → share link/QR.

---

## Roadmap

**Week 1–2**: Data model, auth, asset upload, basic lesson CRUD.
**Week 3–4**: PPTX import worker + Review UI.
**Week 5**: Lesson player + quizzes.
**Week 6**: Progress, certificates, analytics.
**Week 7–8**: Polish (i18n, accessibility, caching, QA), deployment.

---

# Sub‑Agent Prompts (Claude CLI‑ready)

Copy/paste and replace variables like `<REPO_URL>` / `<TICKET>`.

## 1) Architect Agent

**Goal**: Solidify system design, data model, and import pipeline.

```
You are the Architect. Produce a concise architecture decision record (ADR) for the Bible Study Lessons platform.
Include: component diagram, DB schema tables, API surface (OpenAPI sketch), PPTX import sequence diagram, and scaling considerations.
Constraints: Next.js + NestJS + Postgres + S3 + Redis + BullMQ; EN/FR i18n at block level. Output: /docs/adr-0001-architecture.md + /docs/openapi.yml + /docs/sequence-import.mmd.
```

## 2) Design Agent

**Goal**: PowerPoint‑familiar authoring studio + Coursera‑like learner UI.

```
You are the Product Designer. Deliver wireframes and a UI kit.
Outputs: Figma description JSON or image exports placed in /design, plus a tokens.json (colors, spacing, type scale) interoperable with Tailwind.
Include: Authoring Studio (slide navigator, canvas, properties), Lesson Player, Course List, Quiz screens, Analytics dashboard.
Accessibility: AA contrast, keyboard shortcuts, focus order. EN/FR toggles everywhere.
```

## 3) Code Review Agent

```
You are the Code Review Agent. For any PR, enforce: TypeScript strict mode, ESLint, unit tests for services/selectors, API contracts vs openapi.yml, accessibility checks in components.
Respond with a checklist and concrete diff suggestions. Label architecture risks and performance smells.
```

## 4) Testing Agent

```
You are the Testing Agent. Generate a test plan and implement tests.
Outputs: Playwright E2E for authoring + player; Vitest unit tests for utils; Pact tests for API contracts.
Seed fixtures to simulate a small PPTX import with 3 slides and 2 quizzes. Include EN/FR assertions.
```

## 5) CI/CD Agent

```
You are the CI/CD Agent. Create GitHub Actions:
- app-ci: lint, typecheck, unit tests, build Next.js; cache pnpm; preview on Vercel.
- api-ci: lint, test, prisma migrate check, build; deploy to Fly.io on main.
- worker-ci: build Docker, push to registry, run migrations/queues; secrets from GitHub OIDC.
Add PR checks for openapi diff and Lighthouse CI (PWA performance).
```

---

## Initial Tickets (Week 1)

- T1: Bootstrap monorepo (pnpm, Turbo) with `apps/web`, `apps/api`, `apps/worker`, `packages/ui`, `packages/types`.
- T2: Auth + roles scaffold (Clerk/Auth0) and RBAC middleware.
- T3: Prisma schema + migrations for Lesson/Slide/Block/Quiz/Attempt.
- T4: S3 upload service; signed URL endpoints; object lifecycle policy.
- T5: Lesson CRUD pages (web): list/create/edit with i18n fields.

---

## Example OpenAPI Sketch (excerpt)

```yaml
paths:
  /lessons:
    post: { summary: Create lesson }
    get: { summary: List lessons }
  /lessons/{id}:
    get: { summary: Get lesson }
    patch: { summary: Update lesson }
  /uploads/pptx:
    post: { summary: Upload PPTX and start import }
  /imports/{jobId}:
    get: { summary: Import job status }
  /attempts:
    post: { summary: Submit quiz attempt }
```

---

## Developer Experience

- Storybook for block components.
- Zod schemas shared across web/api.
- Feature flags for experimental import heuristics.

---

## Success Criteria (MVP)

- Teacher imports a 20‑slide PPTX → approves → publishes in < 15 minutes.
- Student completes lesson with quizzes on mobile in < 30 minutes.
- Analytics show per‑slide drop‑off and hardest questions.

---

## Next Step

Start with **T1–T3** and the Architect Agent prompt to produce ADRs and the OpenAPI. Then implement the PPTX import worker (stub) and the Review UI skeleton.
