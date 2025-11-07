# Assignment 4c: Design Document

## DueStack - From Concept to Reality

**How DueStack evolved from initial concept design (Assignment 2) through implementation (4a), visual design (4b), and final deployment (4c).**

---

## Table of Contents

1. [Assignment 2 → 4a: Building the Foundation](#assignment-2--4a-building-the-foundation)
2. [Assignment 4b: Visual Design](#assignment-4b-visual-design)
3. [Assignment 4c: Securing and Deploying](#assignment-4c-securing-and-deploying)
4. [Key Takeaways](#key-takeaways)

---

## Assignment 2 → 4a: Building the Foundation

### The Evolution

Started with **5 rough concepts** in Assignment 2. After feedback highlighting critical gaps (missing authentication, inaccessible state, broken modularity), refined into **6 well-scoped concepts** for Assignment 4a:

1. **UserIdentity** - User profiles
2. **UserAuthentication** - Login, sessions, passwords
3. **CourseManagement** - Course CRUD
4. **DeadlineManagement** - Deadline CRUD + status tracking
5. **DocumentManagement** - File storage with pre-signed URLs
6. **SuggestionManagement** - AI extraction and suggestions

### Addressing Assignment 2 Feedback (-13 points)

**Problem 1: Missing Authentication**

- **A2**: Single "User" concept without passwords
- **A4a**: Split into `UserIdentity` (profiles) + `UserAuthentication` (security)

**Problem 2: Inaccessible State 

- **A2**: `canvasId` in Courses had no setter
- **A4a**: Added `updateCourse()` and `setCanvasId()` actions
- **A4c**: Later removed entirely when Canvas integration was cut

**Problem 3: Missing CRUD Operations

- **A2**: Only Create and Read actions
- **A4a**: Systematically added Update and Delete to all concepts

**Problem 4: Broken Modularity 

- **A2**: `ParsedDeadlineSuggestions` directly accessed `DocumentManagement` state
- **A4a**: Frontend orchestrates—concepts never see each other's state

### Key Implementation Decisions

**MongoDB Strategy**: Concept-specific collections with prefixes (`users`, `courses`, `deadlines`, etc.)

**Test Isolation**: `testDb()` function drops all collections before each test—ensures clean slate

**File Storage Refactor**: Initially planned to store PDFs in MongoDB. After Piazza research, pivoted to **pre-signed URLs** with cloud storage (scalable, follows best practices)

**Type Safety**: TypeScript throughout caught numerous bugs early

### Notable Development Challenges

1. **Import Path Issues**: IDE differences (Cursor vs Obsidian) caused incorrect auto-imports
2. **MongoDB Empty Batch**: Added defensive checks before `insertMany()` operations
3. **Mock LLM Patterns**: Replaced strict matching with flexible patterns for realistic testing
4. **Concept Naming**: Settled on singular names (`UserIdentity`) with plural collections (`users`)
5. **Spec-Code Sync**: Developed habit of updating both simultaneously to prevent drift

---

## Assignment 4b: Visual Design

### Design Principles

- **Minimalist Interface**: Card-based layout with ample whitespace
- **Color-Coded Status**: Blue (TODO), Yellow (IN_PROGRESS), Green (COMPLETED), Red (OVERDUE)
- **Source Provenance**: Show where each deadline came from (Manual, AI Document, AI Website, ~~Canvas~~)

### Key UI Patterns

**Multi-Step AI Extraction**: Select source → Configure → Review suggestions → Edit → Confirm

**Deadline Cards**: Title, due date, course, status badge, source indicator, quick actions (edit, delete, set status)

**Calendar View**: Month/week visualization with color-coded deadlines

---

## Assignment 4c: Securing and Deploying

### 1. Sync-Based Authentication

**Problem**: Frontend directly calling concepts—not secure, auth logic scattered

**Solution**: Backend syncs intercept requests, validate sessions, then execute concept actions

```typescript
export const CreateCourseRequest: Sync = ({ sessionID, user, ... }) => ({
  when: actions([Requesting.request, { path: "/CourseManagement/createCourse", ... }]),
  where: async (frames) => {
    // Validate session, extract user
    frames = await frames.query(UserAuthentication._getSessionUser, { sessionID }, { user });
    if (!frames[0][user]) return new Frames({ [authError]: "Invalid session" });
    return frames;
  },
  then: actions([CourseManagement.createCourse, { creator: user, ... }]),
});
```

**Impact**: Only 3 public routes (`/register`, `/login`, `/createUser`). All others require authentication.

**Frontend Simplification**: `apiRequest()` helper auto-injects `sessionID` via axios interceptor

### 2. Canvas Integration Removal

**Initial Plan**: OAuth with Canvas, sync courses, extract Canvas assignments

**Decision**: **Removed entirely**

**Reasons**:

- Canvas OAuth too complex (app registration, redirect URIs, token management)
- Time constraints for Assignment 4c
- AI website/PDF extraction provides similar value

**Learning**: Prototype third-party APIs early—would have caught complexity during design phase

### 3. AI-Powered Features (The Differentiator)

**Website Extraction**: Paste URL → Gemini extracts deadlines → Review/edit → Confirm

**PDF Extraction**: Upload syllabi → Multi-document processing → Confidence scores → Batch confirm

**Suggestion Refinement**: Natural language edits (e.g., "Make all homework due at 11:59 PM")

**Individual Editing**: Manual tweaks before confirming

**Design Philosophy**: AI + human oversight = best results (trust but verify)

### 4. Cascade Deletion

**Problem**: What happens to deadlines when a course is deleted?

**Solution**: Implemented in `DeleteCourseRequest` sync—deletes all associated deadlines first

```typescript
where: async (frames) => {
  // Fetch and delete all deadlines for this course
  const deadlines = await DeadlineManagement._getDeadlinesByCourse({
    courseId,
  });
  for (const deadline of deadlines) {
    await DeadlineManagement.deleteDeadline({ deadline: deadline._id });
  }
  return frames;
};
```

**Rationale**: Syncs orchestrate multi-concept workflows while maintaining concept independence

### 5. Frontend-Backend Communication

**Unified Pattern**:

- `apiRequest(concept, action, data)` for authenticated routes
- `publicRequest(concept, action, data)` for login/register
- Axios interceptors handle session injection and error handling

**Benefits**: DRY principle, centralized error handling, automatic session expiry detection

---

## Key Takeaways

### What Stayed True

✅ All 6 concepts from A4a shipped to production  
✅ AI-first approach became the standout feature  
✅ Concept independence maintained throughout

### What Changed

❌ Canvas removed (pragmatic scope decision)  
✔️ Syncs added for security (A4c requirement)  
✔️ File storage pivoted to URLs (scalability/feasibility within assignment timeline)