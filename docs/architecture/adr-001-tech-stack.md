# ADR-001: Technology Stack Selection

**Status:** Accepted
**Date:** 2025-10-15
**Deciders:** Architecture Team
**Context:** Phase 1 MVP for bilingual Bible study LMS platform

---

## Decision Summary

We will use a **TypeScript-first monorepo** architecture with the following stack:

- **Monorepo:** Turborepo
- **Backend:** NestJS + Prisma ORM + PostgreSQL
- **Frontend:** React + Vite + React Query + Zustand
- **UI Components:** shadcn/ui + Tailwind CSS
- **Rich Text:** TipTap (ProseMirror)
- **Validation:** Zod (shared across backend/frontend)
- **File Upload:** Multer + S3-compatible storage
- **Background Jobs:** BullMQ + Redis
- **Testing:** Vitest + Playwright
- **Deployment:** Render (backend + database) + Vercel (frontend)

---

## Context & Requirements

### Business Requirements
- Bilingual (EN/FR) Bible study learning platform
- Support for PowerPoint import with complex content parsing
- Rich lesson authoring with multiple content block types
- Quiz system with auto-grading
- Student progress tracking
- Mobile-responsive design
- Must be maintainable by 1-2 developers
- Church setting: reliability over cutting-edge features

### Technical Constraints
- Must deploy on Render platform
- Budget-conscious infrastructure
- Fast time-to-market (8-10 week MVP)
- TypeScript strict mode required
- No localStorage for auth (cookie-based)
- Support for complex JSONB content structures

---

## Technology Decisions

### 1. Monorepo: Turborepo

**Decision:** Use Turborepo over Nx, pnpm workspaces, or Lerna

**Rationale:**
- **Build Caching:** Turborepo's automatic caching significantly speeds up builds
- **Simple Configuration:** Less complex than Nx for small teams
- **Great DX:** Excellent developer experience with minimal setup
- **Task Orchestration:** Built-in pipeline management for interdependent tasks
- **Growing Ecosystem:** Maintained by Vercel with strong community

**Alternatives Considered:**
- **Nx:** Too complex for 1-2 developers; steep learning curve
- **pnpm workspaces:** Lacks build orchestration and caching
- **Lerna:** Essentially deprecated; limited modern features

**Trade-offs:**
- Pro: Fast builds, easy to learn, good for small teams
- Con: Less feature-rich than Nx (but we don't need those features)

**Implementation Notes:**
```bash
# Monorepo structure
bibliology/
├── apps/
│   ├── api/          # NestJS backend
│   ├── web/          # React frontend
│   └── worker/       # Background job processor
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── validation/   # Zod schemas
│   └── utils/        # Shared utilities
└── turbo.json        # Pipeline configuration
```

---

### 2. Backend Framework: NestJS

**Decision:** Use NestJS over Express

**Rationale:**
- **TypeScript-First:** Built for TypeScript with decorators and strong typing
- **Scalable Architecture:** Opinionated structure prevents "wild west" code
- **Dependency Injection:** Built-in DI container for testability
- **Module System:** Clear separation of concerns
- **Rich Ecosystem:** Built-in support for validation, ORM, WebSockets, queues
- **Documentation:** Excellent official documentation
- **Similar to Angular:** Familiar patterns for many developers

**Alternatives Considered:**
- **Express:** Too bare-bones; requires many architectural decisions
- **Fastify:** Faster but less ecosystem support
- **tRPC:** Overkill for REST API; adds complexity

**Trade-offs:**
- Pro: Enterprise-ready, testable, maintainable, great for REST APIs
- Con: Slightly steeper learning curve than Express
- Pro: Built-in OpenAPI/Swagger generation
- Con: More boilerplate code

**Key Features Used:**
- Modules for domain separation (auth, lessons, quizzes, uploads)
- Guards for authentication/authorization
- Pipes for validation (using Zod)
- Interceptors for logging and transformation
- Decorators for clean controller code

---

### 3. ORM: Prisma

**Decision:** Use Prisma over TypeORM or raw SQL

**Rationale:**
- **Type Safety:** Best-in-class TypeScript integration
- **Developer Experience:** Intuitive schema language, great CLI
- **Migrations:** Simple, reliable migration system
- **Query Performance:** Optimized queries with minimal overhead
- **Prisma Studio:** Built-in database GUI for development
- **JSONB Support:** Excellent support for complex JSON fields
- **Connection Pooling:** Built-in connection management

**Alternatives Considered:**
- **TypeORM:** More bugs, less type-safe, decorators feel outdated
- **Raw SQL (node-postgres):** Too much boilerplate, no type safety
- **Drizzle:** Too new, smaller ecosystem

**Trade-offs:**
- Pro: Amazing DX, type-safe queries, great migrations
- Con: Slightly larger bundle size (not relevant for backend)
- Pro: Handles complex relations easily
- Con: Learning curve for raw SQL experts

**Example Schema:**
```prisma
model Lesson {
  id              String   @id @default(cuid())
  title_en        String
  title_fr        String?
  status          LessonStatus
  coverImageUrl   String?
  slides          Slide[]
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([status, createdAt])
}
```

---

### 4. Validation: Zod

**Decision:** Use Zod over Joi or class-validator

**Rationale:**
- **TypeScript-Native:** Infers types automatically
- **Composable:** Easy to create complex validation schemas
- **Shareable:** Same schemas work on frontend and backend
- **Small Bundle:** Lightweight for frontend use
- **Error Messages:** Great default messages, easy to customize
- **Transformations:** Can parse and transform data

**Alternatives Considered:**
- **Joi:** No TypeScript type inference
- **class-validator:** Requires decorators, less flexible
- **Yup:** Similar to Zod but older, less TS-friendly

**Trade-offs:**
- Pro: Perfect for TypeScript, works everywhere
- Con: Slightly verbose for simple validations

**Example Usage:**
```typescript
// packages/validation/src/lesson.schema.ts
import { z } from 'zod';

export const createLessonSchema = z.object({
  title_en: z.string().min(3).max(200),
  title_fr: z.string().min(3).max(200).optional(),
  courseId: z.string().cuid(),
  status: z.enum(['draft', 'published']),
});

export type CreateLessonDto = z.infer<typeof createLessonSchema>;
```

---

### 5. File Upload: Multer + S3

**Decision:** Use Multer with S3-compatible storage

**Rationale:**
- **Standard Library:** Multer is battle-tested for Express/NestJS
- **Flexible Storage:** Easy to switch between local/S3/R2
- **PowerPoint Parsing:** Need files in memory/disk for processing
- **Direct Upload:** Can generate signed URLs for client-side upload
- **Render Compatible:** Works well with Render's persistent storage

**Alternatives Considered:**
- **UploadThing:** Third-party service, adds cost
- **Formidable:** Less integration with NestJS
- **Native Fetch:** Too low-level

**Trade-offs:**
- Pro: Simple, reliable, flexible
- Con: Need to manage S3 credentials

**Implementation Strategy:**
- Development: Local file storage or MinIO
- Production: Cloudflare R2 or AWS S3
- Images: Optimize with Sharp before upload
- PowerPoint: Store temporarily, process, then delete

---

### 6. Background Jobs: BullMQ + Redis

**Decision:** Use BullMQ with Redis over alternatives

**Rationale:**
- **PowerPoint Import:** Long-running PPTX parsing needs background processing
- **Reliability:** BullMQ has retry logic, dead letter queues
- **Performance:** Redis is fast and scales well
- **Monitoring:** Built-in web UI for job monitoring
- **Cron Jobs:** Support for scheduled tasks (certificates, reminders)
- **TypeScript Support:** Excellent type definitions

**Alternatives Considered:**
- **Agenda:** MongoDB-based, slower for high throughput
- **node-cron:** No persistence, lost on restart
- **AWS SQS:** Vendor lock-in, more complex
- **pg-boss:** Postgres-based, but Redis is better for queues

**Trade-offs:**
- Pro: Reliable, fast, great for our use case
- Con: Requires Redis instance (added infrastructure)

**Queue Types:**
- `pptx-import`: Parse PowerPoint files
- `image-processing`: Optimize and resize images
- `certificate-generation`: Create PDF certificates
- `email-notifications`: Send lesson notifications

---

### 7. Frontend: React + Vite

**Decision:** Use React with Vite over Next.js

**Rationale:**
- **SPA Architecture:** Lesson viewer needs SPA for smooth navigation
- **Vite Speed:** Instant HMR, fast builds
- **Flexibility:** No framework opinions on routing/data fetching
- **Smaller Bundle:** No server-side code in frontend
- **Learning Curve:** Most developers know React
- **Deployment:** Simpler deployment to Vercel/Netlify

**Alternatives Considered:**
- **Next.js:** Overkill for SPA, adds complexity we don't need
- **Remix:** Too new, smaller ecosystem
- **Vue/Svelte:** Team expertise in React

**Trade-offs:**
- Pro: Fast dev experience, flexible, simple
- Con: Need to handle routing ourselves (React Router)
- Pro: Client-side rendering is fine for authenticated app
- Con: No SSR benefits (not needed for our use case)

**Key Libraries:**
- **React Router:** Client-side routing
- **React Query (TanStack Query):** Server state management
- **Zustand:** Client state management
- **React Hook Form:** Form handling

---

### 8. State Management: React Query + Zustand

**Decision:** Use React Query for server state, Zustand for client state

**Rationale:**

**React Query for Server State:**
- **Automatic Caching:** Reduces API calls
- **Background Refetching:** Keeps data fresh
- **Optimistic Updates:** Great UX for mutations
- **Loading/Error States:** Built-in state management
- **Pagination/Infinite Scroll:** Easy to implement

**Zustand for Client State:**
- **Lightweight:** 1KB bundle size
- **Simple API:** Minimal boilerplate
- **TypeScript:** Excellent type inference
- **No Context:** No unnecessary re-renders
- **DevTools:** Redux DevTools integration

**Alternatives Considered:**
- **Redux Toolkit:** Too heavy for our needs
- **Jotai/Recoil:** More complex than needed
- **Context API:** Performance issues with frequent updates

**Trade-offs:**
- Pro: Best practices, great DX, performant
- Con: Two libraries to learn (but both are simple)

**Example Usage:**
```typescript
// Server state (React Query)
const { data: lesson } = useQuery({
  queryKey: ['lesson', lessonId],
  queryFn: () => api.lessons.getById(lessonId),
});

// Client state (Zustand)
const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
```

---

### 9. UI Components: shadcn/ui + Tailwind CSS

**Decision:** Use shadcn/ui with Tailwind CSS

**Rationale:**
- **Copy-Paste Components:** Full control over component code
- **Tailwind Integration:** Consistent styling system
- **Accessibility:** Built on Radix UI primitives (WCAG compliant)
- **Customization:** Easy to modify for our brand
- **No Runtime:** Components are just code, no library
- **Dark Mode:** Built-in support (future feature)

**Alternatives Considered:**
- **Chakra UI:** Runtime CSS-in-JS, larger bundle
- **Material UI:** Too opinionated, harder to customize
- **Ant Design:** Chinese design language, not ideal
- **Headless UI:** Great but requires more custom styling

**Trade-offs:**
- Pro: Full control, excellent accessibility, beautiful defaults
- Con: Need to copy components (but that's the point)
- Pro: Tailwind makes styling fast and consistent
- Con: Tailwind learning curve for some developers

**Component Usage:**
- Dialog: Modals for confirmations
- Dropdown: Menus and selects
- Form: Form controls with validation
- Toast: Notifications
- Tabs: Content switching
- Accordion: Collapsible sections

---

### 10. Rich Text Editor: TipTap

**Decision:** Use TipTap over Slate.js or Draft.js

**Rationale:**
- **ProseMirror Core:** Battle-tested foundation
- **Extensible:** Easy to add custom blocks
- **TypeScript:** Excellent type support
- **Styling:** Works well with Tailwind
- **Collaboration Ready:** Built-in collaborative editing (future)
- **Modern API:** React hooks, intuitive API
- **Active Development:** Regularly updated

**Alternatives Considered:**
- **Slate.js:** More bugs, less stable API
- **Draft.js:** Deprecated by Facebook
- **Quill:** Limited extensibility
- **Lexical:** Too new, experimental

**Trade-offs:**
- Pro: Powerful, extensible, great DX
- Con: Larger bundle than simple textarea
- Pro: Can add Bible verse picker, vocabulary formatter
- Con: Learning curve for advanced features

**Custom Extensions Needed:**
- Bible Verse Block
- Vocabulary Term Formatter
- Callout Boxes
- Image Upload Handler

---

### 11. Form Handling: React Hook Form

**Decision:** Use React Hook Form over Formik

**Rationale:**
- **Performance:** Minimal re-renders
- **Small Bundle:** 8.5KB vs Formik's 13KB
- **TypeScript:** Better type inference
- **Zod Integration:** Works seamlessly with our validation
- **React Query Integration:** Easy to handle mutations
- **DevTools:** Built-in form inspection

**Alternatives Considered:**
- **Formik:** Older, more re-renders, larger bundle
- **Final Form:** Less popular, smaller ecosystem

**Trade-offs:**
- Pro: Fast, small, great with Zod
- Con: API is different from Formik (less familiar)

**Example:**
```typescript
const form = useForm<CreateLessonDto>({
  resolver: zodResolver(createLessonSchema),
  defaultValues: { title_en: '', status: 'draft' },
});

const { mutate } = useMutation({
  mutationFn: api.lessons.create,
  onSuccess: () => form.reset(),
});
```

---

### 12. Drag and Drop: dnd-kit

**Decision:** Use dnd-kit over react-dnd

**Rationale:**
- **Modern:** Built for React hooks
- **Performance:** Highly optimized
- **Touch Support:** Works on mobile devices
- **Accessibility:** Keyboard navigation support
- **Smaller Bundle:** More efficient than react-dnd
- **TypeScript:** Excellent type safety

**Alternatives Considered:**
- **react-dnd:** Older API, class-based
- **react-beautiful-dnd:** Limited to lists only

**Trade-offs:**
- Pro: Modern, accessible, performant
- Con: More setup than react-beautiful-dnd

**Use Cases:**
- Reorder slides in lesson builder
- Reorder content blocks within slides
- Reorder quiz questions
- Future: drag blocks between slides

---

## Infrastructure Decisions

### Database: PostgreSQL

**Decision:** PostgreSQL 15+ with JSONB support

**Rationale:**
- **JSONB:** Perfect for flexible content blocks
- **Full-Text Search:** Built-in search capabilities
- **Reliable:** Battle-tested, stable
- **Render Support:** Native PostgreSQL on Render
- **GIN Indexes:** Fast JSONB queries
- **JSON Path Queries:** Query inside JSON structures

**Alternatives Considered:**
- **MongoDB:** Less suitable for relational data (courses, enrollments)
- **MySQL:** Weaker JSON support

---

### Cache: Redis

**Decision:** Redis 7+ for caching and queues

**Rationale:**
- **BullMQ Requirement:** Needed for background jobs
- **Fast Caching:** Sub-millisecond reads
- **Pub/Sub:** Future real-time features
- **Render Support:** Redis addon available

**Cache Strategy:**
- Course lists: 5 min TTL
- Lesson content: 15 min TTL
- User sessions: 24 hour TTL
- Invalidate on updates

---

### File Storage: Cloudflare R2 / S3

**Decision:** S3-compatible object storage

**Rationale:**
- **Cost-Effective:** R2 has no egress fees
- **CDN Integration:** Fast global delivery
- **Signed URLs:** Secure direct uploads
- **Backup:** Easy replication

**Storage Structure:**
```
bibliology-assets/
├── lessons/
│   └── {lessonId}/
│       ├── images/
│       └── imports/
├── users/
│   └── avatars/
└── certificates/
    └── {userId}/
```

---

### Deployment: Render + Vercel

**Decision:** Deploy backend to Render, frontend to Vercel

**Rationale:**

**Render (Backend):**
- **Requirement:** Specified in project requirements
- **Integrated:** Database, Redis, Docker support
- **Autoscaling:** Handles traffic spikes
- **Affordable:** Good free tier for MVP

**Vercel (Frontend):**
- **Fast:** Edge network, instant deploys
- **Preview Deployments:** Per-branch previews
- **Free:** Generous free tier
- **DX:** Excellent developer experience

**Alternatives Considered:**
- **All on Render:** Possible but Vercel better for SPA
- **Railway:** Similar to Render, less mature

---

## Testing Strategy

### Unit Tests: Vitest

**Decision:** Use Vitest over Jest

**Rationale:**
- **Vite Integration:** Uses same config as dev/build
- **Faster:** 10x faster than Jest
- **Modern:** Better TypeScript support
- **Compatible:** Jest-like API, easy migration

### E2E Tests: Playwright

**Decision:** Use Playwright over Cypress

**Rationale:**
- **Multi-Browser:** Chrome, Firefox, Safari
- **Fast:** Runs in parallel
- **Better API:** More modern than Cypress
- **Screenshots/Videos:** Built-in debugging

---

## Security Decisions

### Authentication: Cookie-based JWT

**Decision:** HttpOnly cookies with JWT tokens

**Rationale:**
- **No localStorage:** Requirement from project spec
- **XSS Protection:** HttpOnly prevents JS access
- **CSRF Protection:** SameSite=Strict cookies
- **Refresh Tokens:** Secure token rotation

**Implementation:**
```typescript
// Login response sets cookie
res.cookie('accessToken', jwt, {
  httpOnly: true,
  secure: true,
  sameSite: 'strict',
  maxAge: 15 * 60 * 1000, // 15 minutes
});
```

---

## Migration Strategy

### From Development to Production

**Phase 1: MVP (Current)**
- Local: Docker Compose (Postgres + Redis)
- Development: Render free tier

**Phase 2: Beta**
- Staging: Render Starter plan
- Production: Render Professional

**Phase 3: Scale**
- Database: Upgrade to larger instance
- Redis: Move to managed Redis
- CDN: Add Cloudflare in front

---

## Open Questions & Future Decisions

### Not Decided Yet (Deferred to Phase 2)

1. **Real-time Features:** WebSockets vs Server-Sent Events
2. **Search:** Postgres FTS vs Algolia vs Meilisearch
3. **Mobile Apps:** Expo vs React Native CLI
4. **Email Service:** SendGrid vs AWS SES vs Postmark
5. **Analytics:** Self-hosted vs Google Analytics
6. **Monitoring:** Sentry vs LogRocket vs custom

These will be decided based on Phase 1 learnings and actual usage patterns.

---

## Key Metrics for Success

- **Build Time:** < 2 minutes for full monorepo
- **Page Load:** < 2 seconds for lesson viewer
- **API Response:** < 200ms for 95th percentile
- **PPTX Import:** < 30 seconds for 50-slide deck
- **Developer Onboarding:** < 1 day to be productive

---

## Approval

This ADR has been reviewed and approved for Phase 1 MVP implementation.

**Next Steps:**
1. Create project structure (see project-structure.md)
2. Set up monorepo with Turborepo
3. Configure base packages (types, validation)
4. Implement authentication module
5. Create database schema with Prisma
