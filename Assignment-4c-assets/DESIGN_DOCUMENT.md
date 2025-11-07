# Assignment 4c: Design Document

## DueStack - Final Implementation Design

---

## Overview

This document summarizes how the final DueStack implementation differs from the initial concept design (Assignment 2) and visual design (Assignment 4b), highlighting key architectural decisions, feature changes, and implementation details.

---

## Major Design Changes

### 1. Authentication & Authorization Architecture

**Initial Design (Assignment 2):** Basic concept-level authentication without explicit request interception.

**Final Implementation:**

- **Sync-based Authentication**: Implemented comprehensive authentication syncs using the Requesting concept pattern
- **Excluded Routes**: All sensitive operations (course/deadline CRUD) are excluded from passthrough routes and require authentication through syncs
- **Included Routes**: Only three public routes remain as passthrough:
  - `/api/UserAuthentication/register`
  - `/api/UserAuthentication/login`
  - `/api/UserIdentity/createUser`
- **Session Management**: Automatic session validation in sync `where` clauses before executing concept actions
- **Error Handling**: Dedicated auth error syncs (`AuthError` patterns) for clean error propagation

**Rationale:** This provides a clean separation between public and authenticated operations while maintaining security at the request level rather than relying solely on concept-level checks.

---

### 2. Canvas Integration - Removed

**Initial Design (Assignment 2/4b):** Planned Canvas LMS integration for automatic deadline extraction.

**Final Implementation:** **Completely removed** from the UI and backend syncs.

**Reasons:**

- Canvas API complexity exceeded project scope
- OAuth authentication flow too time-intensive for assignment timeline
- Adequate alternatives (AI website/PDF extraction) provide similar value

**Impact:**

- Cleaner codebase without unused Canvas-related code
- Removed from all frontend views (`DeadlinesView`, `AllDeadlinesView`, `CreateDeadlineForm`, `EditDeadlineModal`)
- Removed API endpoints: `connectCanvas`, `disconnectCanvas`, `setCanvasId`, `parseFromCanvas`
- UI now shows only three deadline sources: Manual, AI Document, AI Website

---

### 3. AI-Powered Deadline Extraction

**Initial Design:** Basic deadline parsing with manual entry focus.

**Final Implementation:**

- **Website Extraction**: Gemini-powered extraction from course websites
- **PDF Document Extraction**: Multi-document PDF processing with structured extraction
- **Suggestion Management**: Unconfirmed suggestions workflow with editing and refinement capabilities
- **Confidence Scoring**: AI provides confidence levels and provenance tracking

**Key Features:**

- Extraction configuration management with customizable prompts
- Suggestion refinement with user feedback
- Individual suggestion editing before confirmation
- Batch confirmation of AI-extracted deadlines

---

### 4. Data Integrity - Cascade Deletion

**Initial Design:** Simple deletion operations without dependency management.

**Final Implementation:**

```typescript
// Implemented in DeleteCourseRequest sync
export const DeleteCourseRequest: Sync = ({ course, ... }) => ({
  where: async (frames) => {
    // Delete all associated deadlines first
    const deadlineDocs = await DeadlineManagement._getDeadlinesByCourse({
      courseId: originalFrame[course],
    });
    for (const deadlineDoc of deadlineDocs) {
      await DeadlineManagement.deleteDeadline({ deadline: deadlineDoc._id });
    }
    return frames;
  },
  then: actions([CourseManagement.deleteCourse, { course }]),
});
```

**Impact:** Ensures referential integrity - deleting a course automatically removes all its deadlines, preventing orphaned data.

---

### 5. Frontend-Backend Communication Pattern

**Initial Design:** Direct concept action calls from frontend.

**Final Implementation:**

- **Unified API Helpers**: `apiRequest()` (authenticated) and `publicRequest()` (public)
- **Automatic Session Management**: `sessionID` injected automatically in authenticated requests
- **Response Interceptors**: Centralized error handling with automatic session expiry detection
- **Results Array Pattern**: Backend syncs return `{ results: [...] }` for query operations

**Example:**

```javascript
// Frontend - clean, no manual sessionID management
const courses = await courseService.getCoursesByCreator();

// Backend sync returns
Requesting.respond({ request, results: courseDocs });
```

---

### 6. LikertSurvey Removal

**Final Implementation:** Removed all LikertSurvey passthrough routes that were provided as examples in the starter code.

**Before:** 5 LikertSurvey routes cluttered the passthrough configuration.

**After:** Clean configuration with only essential public routes.

---

## Visual Design Refinements (from 4b)

### UI Enhancements

- **Enhanced Error Messages**: Login/register errors now display with prominent red styling, border emphasis, and shake animation
- **Modal State Management**: Fixed issue where edit modals would get stuck in loading state
- **Source Selection Interface**: Clean card-based selection for deadline sources (removed disabled Canvas option)
- **Deadline Display**: Improved deadline list with status badges, edit/delete actions

### UX Improvements

- **Automatic Deadline Refresh**: Deadlines automatically refresh after creation/deletion
- **Course Context**: Deadline views maintain course context for better navigation
- **Calendar Integration**: Interactive calendar view for deadline visualization
- **Filter Options**: Status-based filtering in All Deadlines view

---

## Technical Architecture

### Sync Patterns Implemented

1. **CRUD Operations**: Create, Read, Update, Delete syncs for courses and deadlines
2. **Authentication Guards**: `where` clauses check `_getSessionUser` before operations
3. **Error Handling**: Separate success, error, and auth-error syncs for each operation
4. **Query Operations**: Direct concept method calls returning document arrays

### Concept Organization

- **UserAuthentication**: Session management and password auth
- **UserIdentity**: User profile management
- **CourseManagement**: Course CRUD operations
- **DeadlineManagement**: Deadline CRUD with status tracking
- **SuggestionManagement**: AI extraction and suggestion workflow
- **DocumentManagement**: PDF/document storage and retrieval
- **Requesting**: HTTP server with passthrough/exclusion routing

---

## Key Implementation Decisions

### 1. Optional Parameters Handling

**Challenge:** Optional parameters like `websiteUrl` and `optionalTimeout` caused sync binding errors.

**Solution:** Removed optional parameters from sync `when` and `then` clauses entirely, letting concept methods handle defaults.

### 2. Parameter Name Consistency

**Challenge:** Mismatches between frontend (`creator`), sync (`user`), and concept (`creator`) parameter names.

**Solution:** Standardized naming conventions and mapped parameters explicitly in syncs.

### 3. Query vs. Action Pattern

**Decision:** Used underscore-prefixed queries (`_getCoursesByCreator`) for read operations that don't modify state.

**Benefit:** Clear semantic distinction between queries and actions in the codebase.

---

## Deviations from Assignment 4b Mockups

1. **Removed Canvas Source Option**: No longer appears in source selection UI
2. **Simplified Header**: Username displayed without Canvas connection status
3. **AI Extraction Flow**: Two-step process (select source → configure extraction) vs. single-step mockup
4. **Deadline Cards**: Added status badges and source indicators not in original mockup

---

## Conclusion

The final implementation represents a pragmatic evolution from the initial design, prioritizing:

- **Security**: Comprehensive sync-based authentication
- **Usability**: AI-powered extraction reduces manual entry burden
- **Data Integrity**: Cascade deletion prevents orphaned records
- **Maintainability**: Clean separation of public vs. authenticated routes
- **Scope Management**: Removed Canvas integration to focus on core value propositions

The result is a production-ready deadline management system with intelligent AI assistance, robust authentication, and intuitive user experience.
