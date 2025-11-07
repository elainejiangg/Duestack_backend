# Synchronization Progress

## What's Been Done

### 1. Routes Configuration ✅
File: `src/concepts/Requesting/passthrough.ts`

**Included (public) routes:**
- `/api/UserAuthentication/register`
- `/api/UserAuthentication/login`
- `/api/UserIdentity/createUser`
- `/api/LikertSurvey/*` (TODO: Remove before submission!)

**Excluded (authenticated) routes:**
- All other UserAuthentication routes (61 total)
- All UserIdentity routes except createUser
- All CourseManagement routes
- All DeadlineManagement routes
- All DocumentManagement routes
- All SuggestionManagement routes

### 2. Authentication Syncs Created ✅ (Partial)
File: `src/syncs/auth.sync.ts`

**Implemented syncs for:**
- UserAuthentication: logout, changePassword, connectCanvas, _getSessionUser
- UserIdentity: updateUserName, updateUserEmail, _getUserById
- CourseManagement: createCourse, _getCoursesByCreator
- DeadlineManagement: createDeadline, _getDeadlinesByCourse
- DocumentManagement: uploadDocument, _getDocumentsByUser
- SuggestionManagement: confirm, _getUnconfirmedSuggestionsByUser

## What Still Needs To Be Done

### 1. Add Missing Syncs ⚠️

You need to create request/response syncs for the following excluded routes:

**UserAuthentication:**
- `_getAuthenticatedUserByUsername`
- `_getAuthenticatedUserByUser`

**UserIdentity:**
- `_getUserByEmail`
- `_getAllUsers`

**CourseManagement:**
- `updateCourse`
- `setCanvasId`
- `deleteCourse`
- `_getCourseById`
- `_getCourseByCodeAndCreator`
- `_getAllCourses`

**DeadlineManagement:**
- `updateDeadline`
- `setStatus`
- `deleteDeadline`
- `_getDeadlineById`
- `_getDeadlinesByAddedBy`
- `_getAllDeadlines`

**DocumentManagement:**
- `updateDocumentMetadata`
- `getDocumentContent`
- `deleteDocument`
- `_getDocumentById`
- `_getDocumentsByCourse`

**SuggestionManagement:**
- `createExtractionConfig`
- `_simulateLLMExtraction`
- `parseFromCanvas`
- `llmExtractFromDocument`
- `llmExtractFromMultipleDocuments`
- `llmExtractFromPDFUrls`
- `llmExtractFromWebsite`
- `refineWithFeedback`
- `extractTimeFromPrompt`
- `refineMultipleSuggestions`
- `editSuggestion`
- `updateSuggestionTitle`
- `updateSuggestionDate`
- `_getSuggestionById`
- `_getSuggestionsByUser`

### 2. Pattern to Follow

Each excluded route needs TWO syncs:

**Request Sync** - Validates authentication and calls the concept action:
```typescript
export const ActionNameRequest: Sync = ({ request, sessionID, user, ...params }) => ({
  when: actions([
    Requesting.request,
    { path: "/ConceptName/actionName", sessionID, ...params },
    { request },
  ]),
  where: async (frames) => {
    // Validate session
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user },
    );
    // Filter out invalid sessions
    return frames.filter(($) => $[user] !== null);
  },
  then: actions([ConceptName.actionName, { ...params }]),
});
```

**Response Sync** - Returns the result to the client:
```typescript
export const ActionNameResponse: Sync = ({ request, ...outputs }) => ({
  when: actions(
    [Requesting.request, { path: "/ConceptName/actionName" }, { request }],
    [ConceptName.actionName, {}, { ...outputs }],
  ),
  then: actions([Requesting.respond, { request, ...outputs }]),
});
```

**For error handling**, add a third sync:
```typescript
export const ActionNameError: Sync = ({ request, error }) => ({
  when: actions(
    [Requesting.request, { path: "/ConceptName/actionName" }, { request }],
    [ConceptName.actionName, {}, { error }],
  ),
  then: actions([Requesting.respond, { request, error }]),
});
```

### 3. Testing Your Syncs

1. **Restart your server:**
   ```bash
   deno run start
   ```

2. **Check the console output** - you should see action traces like:
   ```
   Requesting.request { path: "/CourseManagement/createCourse", sessionID: "...", ... }
   UserAuthentication._getSessionUser { sessionID: "..." } => { user: "..." }
   CourseManagement.createCourse { creator: "...", ... } => { course: "..." }
   Requesting.respond { request: "...", course: "..." }
   ```

3. **Test from your frontend** - Try logging in, then making authenticated requests

### 4. Update Your Frontend

Your frontend needs to:
1. Store the `sessionID` returned from login
2. Include `sessionID` in ALL requests to excluded routes
3. Handle authentication errors (redirect to login)

Example frontend update:
```typescript
// After login, store sessionID
const { sessionID, user } = await login(username, password);
localStorage.setItem('sessionID', sessionID);

// For all authenticated requests
const sessionID = localStorage.getItem('sessionID');
const response = await fetch('/api/CourseManagement/createCourse', {
  method: 'POST',
  body: JSON.stringify({
    sessionID,  // ← Add this to every request!
    code: 'CS101',
    name: 'Intro to CS',
    description: 'An intro course'
  })
});
```

## Testing Checklist

- [ ] Server starts without errors
- [ ] Can register a new user
- [ ] Can login and receive sessionID
- [ ] Can make authenticated requests with sessionID
- [ ] Requests without sessionID return authentication error
- [ ] Requests with invalid sessionID return authentication error
- [ ] Can logout successfully
- [ ] Frontend updated to pass sessionID
- [ ] All concept actions work through syncs
- [ ] Console shows proper action traces

## Before Submission

- [ ] Remove LikertSurvey routes from passthrough.ts
- [ ] Delete or move LikertSurvey folder
- [ ] Remove sample.sync.ts
- [ ] All syncs implemented for all excluded routes
- [ ] Frontend fully updated and tested
- [ ] Authentication working end-to-end


