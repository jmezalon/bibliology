# Phase 1 MVP Timeline

**Project:** Bibliology - Bible Study Learning Platform
**Duration:** 4 weeks (8-10 week total timeline with buffer)
**Team Size:** 1-2 developers
**Date:** 2025-10-15

---

## Overview

This Phase 1 MVP focuses on **core functionality** that allows teachers to create lessons and students to learn. PowerPoint import is included but simplified. The goal is to have a working, deployable product that demonstrates value and can be tested with real users.

### MVP Success Criteria

- Teacher can create a lesson from scratch (10 slides, multiple content blocks)
- Teacher can import a PowerPoint and publish it (with manual adjustments)
- Student can view lessons, take inline quizzes, and see progress
- Progress tracking works reliably
- Deployed to production (Render + Vercel)
- Basic analytics for teacher dashboard

### Out of Scope for Phase 1

- Mobile apps (React Native)
- Advanced quiz types (matching, fill-in-blank)
- Real-time collaboration
- Discussion forums
- Email notifications
- Certificate generation (manual workaround for MVP)
- Advanced analytics
- Search functionality (basic filtering only)

---

## Week 1: Foundation & Authentication

**Goal:** Set up infrastructure, authentication, and database

### Days 1-2: Project Setup

**Tasks:**

- [ ] Initialize Turborepo monorepo
- [ ] Set up GitHub repository
- [ ] Configure ESLint, Prettier, TypeScript configs
- [ ] Set up Docker Compose (Postgres, Redis, MinIO)
- [ ] Create base package.json files for all apps/packages
- [ ] Set up GitHub Actions CI pipeline (lint, typecheck, test)

**Deliverables:**

- Working monorepo with `pnpm dev` running all apps
- CI pipeline passing on all commits

### Days 3-4: Database & Prisma Setup

**Tasks:**

- [ ] Create complete Prisma schema (see database-strategy.md)
- [ ] Set up initial migration
- [ ] Create seed data for development
  - Sample teacher user
  - Sample course with 3 lessons
  - Sample student user with progress
- [ ] Test all relationships and queries
- [ ] Set up Prisma Studio

**Deliverables:**

- Database schema fully migrated
- Seed script populates dev data
- All tables and relationships verified

### Days 5-7: Authentication Module

**Tasks:**

- [ ] Create shared types package (@bibliology/types)
- [ ] Create shared validation package (@bibliology/validation)
- [ ] Implement auth module in NestJS:
  - User model and repository
  - Registration endpoint
  - Login endpoint with JWT
  - Logout endpoint
  - Refresh token endpoint
  - Auth guard and role guard
- [ ] Implement frontend auth:
  - Login page
  - Register page
  - Auth context with React Query
  - Protected route wrapper
  - Logout functionality
- [ ] Write tests for auth service
- [ ] Set up HttpOnly cookies for tokens

**Deliverables:**

- User can register, login, logout
- JWT authentication working end-to-end
- Role-based access control (student vs teacher)
- Frontend shows different UI based on role

---

## Week 2: Lesson Management (Teacher)

**Goal:** Teachers can create and manage lessons

### Days 8-10: Lesson CRUD API

**Tasks:**

- [ ] Implement courses module:
  - Create/read/update/delete courses
  - Publish/unpublish course
  - List teacher's courses
- [ ] Implement lessons module:
  - Create/read/update/delete lessons
  - Publish/unpublish lesson
  - List lessons in a course
- [ ] Implement slides module:
  - Create/reorder/delete slides
  - Update slide layout and title
- [ ] Implement content blocks module:
  - Create/update/delete content blocks
  - Support all block types (heading, text, image, verse, vocabulary, callout)
  - Store JSONB content for each language
- [ ] Add validation with Zod schemas
- [ ] Write integration tests for lesson creation flow

**Deliverables:**

- Complete lesson CRUD API working
- Postman/Thunder Client collection for testing
- API documentation (OpenAPI spec)
- Teacher can create lessons via API

### Days 11-14: Lesson Builder UI

**Tasks:**

- [ ] Create lesson builder page layout:
  - Slide navigator (left sidebar)
  - Canvas (center)
  - Properties panel (right sidebar)
- [ ] Implement slide management:
  - Add/delete slides
  - Drag-and-drop slide reordering (dnd-kit)
  - Select active slide
- [ ] Implement content block editors:
  - Heading block editor
  - Text block editor (TipTap rich text)
  - Image block editor (with upload)
  - Verse block editor (manual entry for MVP)
  - Vocabulary block editor
  - Callout block editor
- [ ] Implement block management:
  - Add blocks to slide
  - Reorder blocks within slide
  - Delete blocks
  - Toggle between EN/FR tabs
- [ ] Implement auto-save (every 30 seconds)
- [ ] Add publish button with validation
- [ ] Style with Tailwind + shadcn/ui

**Deliverables:**

- Working lesson builder UI
- Teacher can create 10-slide lesson with various content types
- Auto-save works reliably
- Publish button validates and publishes lesson
- Bilingual content editing works

---

## Week 3: Student Experience & PowerPoint Import

**Goal:** Students can view lessons, and teachers can import PowerPoint

### Days 15-17: Lesson Viewer (Student)

**Tasks:**

- [ ] Create lesson viewer page:
  - Full-screen slide display
  - Navigation controls (prev/next)
  - Progress indicator
  - Slide dots navigation
- [ ] Implement content block renderers:
  - Heading renderer
  - Text renderer (with formatting)
  - Image renderer
  - Verse renderer (styled)
  - Vocabulary renderer (card style)
  - Callout renderer (highlighted box)
- [ ] Implement navigation:
  - Keyboard shortcuts (arrow keys)
  - Click next/previous buttons
  - Click slide dots to jump
- [ ] Implement progress tracking:
  - Track current slide
  - Track time spent
  - Save progress to database
  - Resume where left off
- [ ] Add language toggle (EN/FR)
- [ ] Mobile-responsive design

**Deliverables:**

- Student can view published lessons
- Smooth navigation between slides
- Progress saves automatically
- Mobile experience works well
- Language toggle works

### Days 18-21: PowerPoint Import (Simplified)

**Tasks:**

- [ ] Set up BullMQ for background jobs
- [ ] Create worker app (separate from API)
- [ ] Implement PowerPoint parser:
  - Extract slides from .pptx
  - Extract text with basic formatting
  - Extract images
  - Create simplified content blocks (text + images only)
  - Store in temp Redis cache
- [ ] Implement import API endpoints:
  - POST /imports/parse (upload PPTX)
  - GET /imports/:jobId/status (poll for completion)
  - GET /imports/:jobId/preview (get parsed data)
  - POST /imports/confirm (save to database)
- [ ] Implement import UI:
  - File upload component
  - Processing indicator
  - Preview with slide thumbnails
  - Manual adjustment interface (teacher can fix issues)
  - Confirm and create lesson button
- [ ] Handle images:
  - Upload to S3/MinIO
  - Optimize with Sharp
  - Store URLs in content blocks

**Deliverables:**

- Teacher can upload .pptx file
- System parses and extracts content
- Teacher sees preview of parsed slides
- Teacher can adjust before importing
- Lesson created with slides and content blocks
- Images stored in S3 and displayed correctly

---

## Week 4: Quizzes, Polish & Deployment

**Goal:** Add quiz functionality, polish UI, deploy to production

### Days 22-24: Quiz System

**Tasks:**

- [ ] Implement quizzes API:
  - Create/update/delete quiz
  - Create/update/delete questions
  - Support multiple choice and true/false only (MVP)
  - Submit quiz answers
  - Calculate score
  - Return results with explanations
- [ ] Implement quiz builder UI (teacher):
  - Add quiz to lesson
  - Create questions with options
  - Mark correct answers
  - Add explanations
  - Preview quiz
- [ ] Implement quiz UI (student):
  - Display quiz questions
  - Radio buttons for multiple choice
  - Submit button
  - Show results with score
  - Show explanations for incorrect answers
  - Allow retry (configurable)
- [ ] Update progress tracking to include quiz completion

**Deliverables:**

- Teacher can add quizzes to lessons
- Student can take quizzes
- Scores calculated automatically
- Explanations shown for incorrect answers
- Quiz completion tracked in progress

### Days 25-26: Polish & Bug Fixes

**Tasks:**

- [ ] Fix all known bugs from testing
- [ ] Improve error handling:
  - User-friendly error messages
  - API error responses with clear messages
  - Frontend error boundaries
- [ ] Improve loading states:
  - Skeletons for loading content
  - Loading spinners where appropriate
  - Optimistic updates for better UX
- [ ] Accessibility improvements:
  - Keyboard navigation
  - Focus management
  - ARIA labels
  - Color contrast checks
- [ ] Performance optimizations:
  - Code splitting
  - Image lazy loading
  - Query optimization
  - Bundle size reduction
- [ ] Mobile UX improvements
- [ ] Add toast notifications for user feedback

**Deliverables:**

- All critical bugs fixed
- Error handling improved
- Loading states polished
- Accessibility issues addressed
- Performance metrics improved

### Days 27-28: Deployment & Testing

**Tasks:**

- [ ] Set up production environments:
  - Create Render account and projects
  - Create Vercel project
  - Set up production database on Render
  - Set up Redis on Render
  - Set up S3 bucket (Cloudflare R2)
- [ ] Configure environment variables for production
- [ ] Set up CI/CD pipelines:
  - Deploy API to Render on main branch
  - Deploy worker to Render on main branch
  - Deploy frontend to Vercel on main branch
- [ ] Run production migrations
- [ ] Seed production with sample data
- [ ] End-to-end testing in production:
  - Create account
  - Create course and lessons
  - Import PowerPoint
  - Publish lesson
  - Enroll student
  - View lesson and take quiz
  - Check progress tracking
- [ ] Set up monitoring (basic):
  - API health checks
  - Error logging
  - Basic analytics
- [ ] Create user documentation:
  - Teacher guide (how to create lessons)
  - Student guide (how to take lessons)
  - FAQ

**Deliverables:**

- Application deployed to production
- All features working in production
- CI/CD pipeline auto-deploys on merge
- Basic monitoring in place
- User documentation available

---

## Risk Management

### High-Risk Items

**1. PowerPoint Parsing Complexity**

- **Risk:** PPTX files have complex structure, parsing may fail
- **Mitigation:** Start with simple PPTX files, allow manual fixes
- **Backup Plan:** Manual lesson creation only (skip import for MVP)

**2. Background Job Processing**

- **Risk:** BullMQ/Redis setup might be complex
- **Mitigation:** Test thoroughly in development
- **Backup Plan:** Synchronous parsing (slower but simpler)

**3. Performance with Large Lessons**

- **Risk:** 50+ slide lessons might load slowly
- **Mitigation:** Implement pagination, lazy loading
- **Backup Plan:** Limit lesson size to 20 slides for MVP

**4. Cross-Browser Compatibility**

- **Risk:** Rich text editor might not work in all browsers
- **Mitigation:** Test in Chrome, Firefox, Safari
- **Backup Plan:** Support Chrome/Firefox only for MVP

### Medium-Risk Items

**5. Authentication Cookie Issues**

- **Risk:** SameSite cookie issues with Vercel/Render
- **Mitigation:** Test early, configure CORS properly
- **Backup Plan:** Use Authorization header (less secure)

**6. Time Estimation**

- **Risk:** Tasks may take longer than estimated
- **Mitigation:** Daily standups, adjust scope if needed
- **Backup Plan:** Cut less critical features (e.g., vocab blocks)

---

## Testing Strategy

### Week 1

- Unit tests for auth service
- Integration tests for auth flow

### Week 2

- Unit tests for lesson service
- Integration tests for lesson CRUD
- E2E tests for lesson builder

### Week 3

- Unit tests for progress tracking
- Integration tests for PowerPoint import
- E2E tests for lesson viewer

### Week 4

- Unit tests for quiz grading
- Integration tests for quiz submission
- E2E tests for complete user flows
- Production smoke tests

**Coverage Goals:**

- Backend: 80%+ unit test coverage
- Frontend: 60%+ component test coverage
- E2E: All critical user flows

---

## Daily Workflow

**Morning (9 AM - 12 PM):**

- Review previous day's work
- Daily standup (if team > 1)
- Focus on coding new features

**Afternoon (1 PM - 5 PM):**

- Continue feature development
- Code review (if team > 1)
- Write tests
- Fix bugs

**End of Day:**

- Commit and push code
- Update project board
- Document blockers

**End of Week:**

- Demo completed features
- Review progress against timeline
- Adjust scope if needed

---

## Success Metrics

At the end of Week 4, we should have:

### Functional Requirements

- ✅ Teachers can create lessons (10+ slides)
- ✅ Teachers can import PowerPoint (simple files)
- ✅ Students can view lessons
- ✅ Students can take quizzes
- ✅ Progress tracking works
- ✅ Bilingual content works (EN/FR)

### Technical Requirements

- ✅ Deployed to production
- ✅ CI/CD pipeline working
- ✅ 80%+ backend test coverage
- ✅ All critical paths tested
- ✅ No high-severity bugs

### Performance Requirements

- ✅ Page load < 3 seconds
- ✅ API response < 500ms
- ✅ PPTX import < 60 seconds (10-slide deck)

### User Experience

- ✅ Teacher can create lesson in < 30 min
- ✅ Student can complete lesson smoothly
- ✅ Mobile experience is usable
- ✅ No confusing UI elements

---

## Post-MVP (Phase 2) Priorities

After successful Phase 1, prioritize these features:

1. **Certificate Generation** - Automatic PDF certificates
2. **Email Notifications** - Lesson published, quiz completed
3. **Advanced Quiz Types** - Matching, fill-in-blank, essay
4. **Search Functionality** - Full-text search across lessons
5. **Student Notes** - Personal notes per slide
6. **Analytics Dashboard** - Detailed teacher analytics
7. **Mobile App** - React Native app (iOS + Android)
8. **Discussion Forum** - Q&A per lesson
9. **Improved PowerPoint Import** - Handle more complex slides
10. **Accessibility Enhancements** - Screen reader support, captions

---

## Conclusion

This 4-week timeline is aggressive but achievable with focused work and clear priorities. The key is to:

1. **Start simple** - Get core features working before polish
2. **Test early** - Catch bugs before they compound
3. **Deploy often** - Deploy to staging weekly
4. **Cut scope if needed** - Better to ship fewer features that work well
5. **Document as you go** - Don't save documentation for the end

By the end of Week 4, we'll have a working MVP that can be tested with real users and iterated upon based on feedback.

**Next Step:** Begin Week 1 Day 1 - Initialize Turborepo monorepo
