# Synchronization Design Rationale

## Overview

This document records the design decisions and rationale for the synchronizations implemented in DueStack's backend. These syncs enforce authentication, ensure data consistency, and improve security by moving authorization logic from the frontend to the backend.

## Design Principles

### 1. Authentication First
**Decision:** All concept actions that modify or retrieve user data require authentication.

**Rationale:** 
- Security: Users can only access their own data
- Consistency: Authentication logic centralized in backend
- Frontend simplification: Frontend doesn't need to implement auth guards

**Implementation:**
- Only 3 routes are public: `register`, `login`, `createUser`
- All other routes require a valid `sessionID` parameter
- Invalid sessions return immediate error responses (no timeout)

### 2. Sync Pattern: Request → Authenticate → Execute → Respond

**Decision:** Use a consistent pattern for all authenticated actions.

**Rationale:**
- Maintainability: Easy to add new syncs following the same pattern
- Debugging: Predictable flow for troubleshooting
- Security: Every action goes through authentication check

**Implementation Pattern for Actions:**
```typescript
export const ActionRequest: Sync = ({ request, sessionID, user, authError, ...params }) => ({
  when: actions([
    Requesting.request,
    { path: "/Concept/action", sessionID, ...params },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // 1. Authenticate
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user },
    );
    // 2. Check validity
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({ ...originalFrame, [authError]: "Invalid or expired session" });
    }
    return frames;
  },
  then: actions([Concept.action, { ...params }]),
});
```

**Implementation Pattern for Queries:**
```typescript
export const QueryRequest: Sync = ({ request, sessionID, user, authError, result, results }) => ({
  when: actions([
    Requesting.request,
    { path: "/Concept/_query", sessionID, ...params },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // 1. Authenticate
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user },
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({ ...originalFrame, [authError]: "Invalid or expired session" });
    }
    // 2. Execute query
    frames = await frames.query(
      Concept._query,
      { ...params },
      { result },
    );
    // 3. Handle empty results
    if (frames.length === 0) {
      return new Frames({ ...originalFrame, [results]: [] });
    }
    return frames.collectAs([result], results);
  },
  then: actions([Requesting.respond, { request, results }]),
});
```

### 3. Error Handling

**Decision:** Return immediate error responses for authentication failures.

**Rationale:**
- User experience: No 10-second timeout for auth errors
- Security: Clear distinction between auth errors and other errors
- Frontend: Can handle auth errors differently (e.g., redirect to login)

**Implementation:**
- Check if session is valid in `where` clause
- If invalid, return frame with `authError` binding
- Separate sync catches `authError` and responds with error message

### 4. Query Methods in Where Clause

**Decision:** All query methods (_get*) must be called in `where` clause, not `then` clause.

**Rationale:**
- Technical constraint: Query methods aren't instrumented as actions
- Design benefit: Forces us to combine auth check + data retrieval in one place
- Performance: Single sync handles both authentication and data retrieval

**Example:**
```typescript
// ✅ CORRECT - Query in where clause
where: async (frames) => {
  frames = await frames.query(Auth._getSessionUser, ...);
  frames = await frames.query(Course._getCoursesByCreator, ...);
  return frames;
},
then: actions([Requesting.respond, { request, results }])

// ❌ WRONG - Query in then clause (will fail)
where: async (frames) => { /* auth only */ },
then: actions([Course._getCoursesByCreator, { ... }])
```

---

## Implemented Synchronizations

### User Authentication Syncs

#### 1. Logout
**Routes:** `/api/UserAuthentication/logout`

**Design Decision:** Require session to logout (prevents random logout attempts).

**Rationale:**
- Only logged-in users can logout
- Invalidates the session on success
- Returns error if session already invalid

**Syncs:**
- `LogoutRequest`: Validates session, calls `logout` action
- `LogoutResponse`: Returns success message
- `LogoutAuthError`: Returns auth error if session invalid

#### 2. Change Password
**Routes:** `/api/UserAuthentication/changePassword`

**Design Decision:** Require current session + old password verification.

**Rationale:**
- Security: Must be logged in to change password
- Concept handles password verification (old password must match)
- Session ensures user can only change their own password

**Syncs:**
- `ChangePasswordRequest`: Validates session, calls `changePassword`
- `ChangePasswordResponse`: Returns concept-level errors (wrong old password)
- `ChangePasswordSuccess`: Returns success message
- `ChangePasswordAuthError`: Returns session errors

#### 3. Connect Canvas
**Routes:** `/api/UserAuthentication/connectCanvas`

**Design Decision:** Require session to link Canvas account.

**Rationale:**
- Users must be authenticated to link their Canvas
- Session identifies which user is connecting

**Syncs:**
- `ConnectCanvasRequest`: Validates session, stores Canvas token
- `ConnectCanvasResponse`: Returns success message

#### 4. Get Session User
**Routes:** `/api/UserAuthentication/_getSessionUser`

**Design Decision:** Query method that validates session and returns user ID.

**Rationale:**
- Frontend needs to check if session is still valid
- Used for "who am I?" queries
- Returns user ID if valid, error if not

**Syncs:**
- `GetSessionUserRequest`: Validates session, returns user
- `GetSessionUserAuthError`: Returns error if invalid

---

### User Identity Syncs

#### 5. Update User Name
**Routes:** `/api/UserIdentity/updateUserName`

**Design Decision:** Session identifies which user to update.

**Rationale:**
- User can only update their own name
- No need to pass user ID from frontend (derived from session)
- Prevents users from changing other users' names

**Syncs:**
- `UpdateUserNameRequest`: Gets user from session, updates name
- `UpdateUserNameResponse`: Returns success

#### 6. Update User Email
**Routes:** `/api/UserIdentity/updateUserEmail`

**Design Decision:** Same as name, with email uniqueness check in concept.

**Rationale:**
- Email must be unique (enforced by concept)
- Session ensures user only updates own email

**Syncs:**
- `UpdateUserEmailRequest`: Gets user from session, updates email
- `UpdateUserEmailResponse`: Returns concept errors (duplicate email)
- `UpdateUserEmailSuccess`: Returns success

#### 7. Get User By ID
**Routes:** `/api/UserIdentity/_getUserById`

**Design Decision:** Require auth to query user data.

**Rationale:**
- Prevents anonymous access to user information
- Could add authorization: only allow users to see their own data

**Future Enhancement:** Add check to ensure user can only query their own ID or public profiles.

**Syncs:**
- `GetUserByIdRequest`: Auth check, then query user data

---

### Course Management Syncs

#### 8. Create Course
**Routes:** `/api/CourseManagement/createCourse`

**Design Decision:** Creator is derived from session, not frontend.

**Rationale:**
- Security: User cannot create courses for other users
- Integrity: Session guarantees course ownership
- Frontend simplification: No need to pass creator ID

**Syncs:**
- `CreateCourseRequest`: Gets user from session, creates course with creator=user
- `CreateCourseResponse`: Returns new course ID
- `CreateCourseError`: Returns concept errors (duplicate course code)

#### 9. Get Courses By Creator
**Routes:** `/api/CourseManagement/_getCoursesByCreator`

**Design Decision:** Query returns only the authenticated user's courses.

**Rationale:**
- Privacy: Users can only see their own courses
- Simplified frontend: No need to filter by user
- Security: Cannot query other users' courses

**Future Enhancement:** Add sharing/collaboration syncs to allow viewing shared courses.

**Syncs:**
- `GetCoursesByCreatorRequest`: Auth + query in one sync, returns array

---

### Deadline Management Syncs

#### 10. Create Deadline
**Routes:** `/api/DeadlineManagement/createDeadline`

**Design Decision:** `addedBy` field populated from session.

**Rationale:**
- Tracks who added each deadline
- Useful for collaborative courses
- Frontend cannot spoof the creator

**Future Enhancement:** Add authorization to check if user owns the course before adding deadline.

**Syncs:**
- `CreateDeadlineRequest`: Gets user from session, creates deadline with addedBy=user
- `CreateDeadlineResponse`: Returns new deadline ID

#### 11. Get Deadlines By Course
**Routes:** `/api/DeadlineManagement/_getDeadlinesByCourse`

**Design Decision:** Require auth but allow querying any course.

**Rationale:**
- Must be logged in to view deadlines
- In future, add check that user owns or has access to the course

**Future Enhancement:** Add authorization sync to verify course access.

**Syncs:**
- `GetDeadlinesByCourseRequest`: Auth + query, returns array

---

### Document Management Syncs

#### 12. Upload Document
**Routes:** `/api/DocumentManagement/uploadDocument`

**Design Decision:** Uploader derived from session.

**Rationale:**
- Security: Frontend cannot upload as another user
- Ownership: Clear document ownership

**Syncs:**
- `UploadDocumentRequest`: Gets user from session, uploads with user=uploader
- `UploadDocumentResponse`: Returns document ID

#### 13. Get Documents By User
**Routes:** `/api/DocumentManagement/_getDocumentsByUser`

**Design Decision:** Returns only authenticated user's documents.

**Rationale:**
- Privacy: Users see only their own documents
- Security: Cannot query other users' documents

**Syncs:**
- `GetDocumentsByUserRequest`: Auth + query current user's docs

---

### Suggestion Management Syncs

#### 14. Get Unconfirmed Suggestions
**Routes:** `/api/SuggestionManagement/_getUnconfirmedSuggestionsByUser`

**Design Decision:** Query user's own unconfirmed suggestions only.

**Rationale:**
- Workflow: User reviews their own pending suggestions
- Privacy: Cannot see others' suggestions

**Syncs:**
- `GetUnconfirmedSuggestionsRequest`: Auth + query, returns array

#### 15. Confirm Suggestion
**Routes:** `/api/SuggestionManagement/confirm`

**Design Decision:** Require auth but don't verify ownership (yet).

**Rationale:**
- User must be logged in to confirm
- Currently any logged-in user can confirm any suggestion

**Future Enhancement:** Add authorization to check suggestion belongs to user.

**Syncs:**
- `ConfirmSuggestionRequest`: Auth + confirm action
- `ConfirmSuggestionResponse`: Returns success

---

## Design Improvements

### 1. Centralized Authentication
**Before:** Frontend had to check if user was logged in before making requests.

**After:** Backend enforces authentication for all protected routes.

**Benefit:** 
- Security: Cannot bypass auth by modifying frontend
- Consistency: All auth logic in one place
- Simpler frontend: Just include sessionID

### 2. User Identity Binding
**Before:** Frontend could specify any user ID in requests.

**After:** User ID derived from session token.

**Benefit:**
- Security: Users cannot impersonate others
- Data integrity: Actions correctly attributed to authenticated user
- Trust: Backend controls identity, not frontend

### 3. Immediate Error Responses
**Before:** Invalid sessions caused 10-second timeouts.

**After:** Invalid sessions return error immediately.

**Benefit:**
- UX: Fast feedback to user
- Debugging: Clear error messages
- Logging: Can track auth failures

---

## Future Enhancements

### 1. Authorization Checks
**Current:** Authentication only (who are you?)

**Future:** Add authorization (what can you do?)

**Examples:**
- Check if user owns course before modifying it
- Check if user has access to course before viewing deadlines
- Check if suggestion belongs to user before confirming

**Implementation:** Add additional queries in `where` clause to verify ownership/access.

### 2. Role-Based Access Control
**Current:** All authenticated users have same permissions.

**Future:** Add roles (student, instructor, admin).

**Examples:**
- Only instructors can delete courses
- Only course owners can add other instructors
- Admins can access all courses

### 3. Audit Logging
**Current:** Actions are logged to console.

**Future:** Persist audit log to database.

**Examples:**
- Who created/modified each resource
- When auth failures occur
- Track suspicious activity

### 4. Rate Limiting
**Current:** No rate limiting.

**Future:** Add rate limiting in syncs.

**Examples:**
- Limit login attempts per IP
- Limit API calls per user
- Prevent spam/abuse

---

## Testing Strategy

### Manual Testing
1. **Test public routes** (register, login) - should work without session
2. **Test authenticated routes** without session - should return error
3. **Test authenticated routes** with invalid session - should return error
4. **Test authenticated routes** with valid session - should succeed
5. **Test logout** - should invalidate session
6. **Test after logout** - should require re-login

### Edge Cases
1. **Concurrent requests** with same session
2. **Session expiry** during long operation
3. **Empty query results** (no courses, deadlines, etc.)
4. **Invalid parameters** with valid session

---

## Notes and Observations

### Performance Considerations
- Each authenticated request makes 2 queries: session check + actual query
- Could optimize by caching session validation
- Trade-off: Security vs. performance (chose security)

### Error Message Design
- Generic "Invalid or expired session" prevents information leakage
- Concept-level errors (e.g., "duplicate course code") are specific
- Helps users understand what went wrong without revealing system details

### Frontend Impact
- Frontend needs to include sessionID in every request
- Frontend should handle 401/auth errors by redirecting to login
- Frontend can cache user ID from login response

---

## Sync Count Summary

**Completed:** 15 core syncs covering key workflows
- Authentication: 4 syncs
- User Identity: 3 syncs  
- Course Management: 2 syncs
- Deadline Management: 2 syncs
- Document Management: 2 syncs
- Suggestion Management: 2 syncs

**Remaining:** ~46 additional syncs for complete coverage
- Will be added incrementally as needed during testing

**Strategy:** Add syncs on-demand as frontend usage reveals which routes are actually needed.


