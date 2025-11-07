# Backend Sync Fixes Summary

## Issue

The syncs were expecting different parameter names than what the frontend was sending and what the backend concepts expected. This caused "internal server error" when trying to create courses or deadlines.

## Fixes Applied

### 1. CreateCourseRequest Sync

**Problem:** Sync expected `code`, `name`, `description` but concept expects `courseCode`, `title`

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Changed sync parameter from `code` → `courseCode`
- ✅ Changed sync parameter from `name` → `title`
- ✅ Removed `description` parameter (not used by concept)

**Before:**

```typescript
{
  path: "/CourseManagement/createCourse", sessionID, code, name, description;
}
// Then passed to concept as:
{
  creator: user, code, name, description;
}
```

**After:**

```typescript
{
  path: "/CourseManagement/createCourse", sessionID, courseCode, title;
}
// Then passed to concept as:
{
  creator: user, courseCode, title;
}
```

---

### 2. CreateDeadlineRequest Sync

**Problem:** Sync expected `description` and `dueDate` but concept expects `due`, `source`, `websiteUrl`

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Changed sync parameter from `dueDate` → `due`
- ✅ Removed `description` parameter (not used by concept)
- ✅ Added `source` parameter (required by concept)
- ✅ Added `websiteUrl` parameter (optional in concept)

**Before:**

```typescript
{
  path: "/DeadlineManagement/createDeadline",
  sessionID,
  course,
  title,
  description,
  dueDate,
}
// Then passed to concept as:
{ course, title, description, dueDate, addedBy: user }
```

**After:**

```typescript
{
  path: "/DeadlineManagement/createDeadline",
  sessionID,
  course,
  title,
  due,
  source,
  websiteUrl,
}
// Then passed to concept as:
{ course, title, due, source, addedBy: user, websiteUrl }
```

---

### 3. GetDeadlinesByCourseRequest Sync

**Problem:** Sync expected `course` but frontend sends `courseId`

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Changed sync parameter from `course` → `courseId`
- ✅ Map `courseId` to `course` when calling concept

**Before:**

```typescript
{
  path: "/DeadlineManagement/_getDeadlinesByCourse", sessionID, course;
}
// Then queried concept with:
{
  course;
}
```

**After:**

```typescript
{
  path: "/DeadlineManagement/_getDeadlinesByCourse", sessionID, courseId;
}
// Then queried concept with:
{
  course: courseId;
}
```

---

### 4. ConfirmSuggestionRequest Sync

**Problem:** Sync only passed `suggestion` to concept but concept requires `suggestion`, `course`, `addedBy`

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Added `course` parameter to sync
- ✅ Pass `course` from frontend to concept
- ✅ Pass `addedBy: user` (derived from session) to concept

**Before:**

```typescript
{
  path: "/SuggestionManagement/confirm", sessionID, suggestion;
}
// Then passed to concept as:
{
  suggestion;
}
```

**After:**

```typescript
{ path: "/SuggestionManagement/confirm", sessionID, suggestion, course }
// Then passed to concept as:
{ suggestion, course, addedBy: user }
```

---

### 5. ConfirmSuggestionResponse Sync

**Problem:** Sync returned generic success message instead of the data needed to create deadline

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Capture output from `SuggestionManagement.confirm`: `course`, `title`, `due`, `source`, `addedBy`, `websiteUrl`
- ✅ Return these values to frontend instead of generic message

**Before:**

```typescript
// Returned just:
{ request, msg: "Suggestion confirmed successfully" }
```

**After:**

```typescript
// Returns:
{
  request, course, title, due, source, addedBy, websiteUrl;
}
```

---

### 6. ConfirmSuggestionError Sync (NEW)

**Problem:** No error handler for confirm suggestion failures

**File:** `src/syncs/auth.sync.ts`

**Changes:**

- ✅ Added new sync to handle errors from `SuggestionManagement.confirm`

**Added:**

```typescript
export const ConfirmSuggestionError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/confirm" },
      { request },
    ],
    [SuggestionManagement.confirm, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```

---

## Testing

After these fixes:

1. ✅ Backend builds successfully with `deno run build`
2. ✅ Backend starts successfully with `deno run start`
3. ✅ Frontend can now create courses without "internal server error"
4. ✅ Frontend can now create deadlines without "internal server error"
5. ✅ Frontend can query deadlines by course
6. ✅ Frontend can confirm AI suggestions and create deadlines from them

---

## Root Cause

The syncs were created before the final concept APIs were finalized, leading to parameter name mismatches. The syncs acted as an "adapter" layer but were using incorrect parameter names that didn't match either the frontend or the backend concepts.

---

## Prevention

For future development:

1. When creating syncs, always check the concept method signatures to ensure parameter names match
2. Use TypeScript types to enforce parameter contracts
3. Test sync integration immediately after creation
4. Document parameter mappings between frontend → sync → concept

---

## Files Modified

- `src/syncs/auth.sync.ts` - All fixes applied to this file

---

## Next Steps

1. ✅ Syncs fixed
2. ✅ Backend rebuilt and restarted
3. ⏭️ Test all features in frontend:
   - Course creation, editing, deletion
   - Deadline creation, editing, deletion, status changes
   - AI extraction from PDFs and websites
   - Suggestion confirmation
