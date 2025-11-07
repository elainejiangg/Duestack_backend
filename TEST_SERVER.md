# Testing Your Authentication Syncs

## ✅ What's Been Fixed

1. **Removed the problematic `AuthenticationError` sync** - Query methods can't be used in `when` clauses
2. **Updated all authentication checks** - Now properly handle invalid sessions by returning error responses instead of timing out
3. **Added `authError` parameter** to all Request syncs that need authentication

## 🧪 Testing Steps

### 1. Start the Server

Run this command in your terminal (it needs network permissions):

```bash
deno run start
```

**Expected output:**
```
Requesting concept initialized with a timeout of 10000ms.

Registering concept passthrough routes.
  -> /api/LikertSurvey/submitResponse
  -> /api/LikertSurvey/updateResponse
  -> /api/LikertSurvey/_getSurveyQuestions
  -> /api/LikertSurvey/_getSurveyResponses
  -> /api/LikertSurvey/_getRespondentAnswers
  -> /api/UserAuthentication/register
  -> /api/UserAuthentication/login
  -> /api/UserIdentity/createUser

🚀 Requesting server listening for POST requests at base path of /api/*
Listening on http://0.0.0.0:8000/ (http://localhost:8000/)
```

✅ If you see this, your syncs are loaded successfully!

### 2. Test User Registration (Public Route)

```bash
curl -X POST http://localhost:8000/api/UserAuthentication/register \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123",
    "name": "Test User",
    "email": "test@example.com"
  }'
```

**Expected:** Success response

### 3. Test User Login (Public Route)

```bash
curl -X POST http://localhost:8000/api/UserAuthentication/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "testuser",
    "password": "testpass123"
  }'
```

**Expected:** Response with `sessionID` and `user` ID
```json
{
  "sessionID": "some-uuid-here",
  "user": "another-uuid-here"
}
```

**Important:** Save the `sessionID` for the next tests!

### 4. Test Authenticated Route WITHOUT Session (Should Fail)

```bash
curl -X POST http://localhost:8000/api/CourseManagement/createCourse \
  -H "Content-Type: application/json" \
  -d '{
    "code": "CS101",
    "name": "Intro to CS",
    "description": "A great course"
  }'
```

**Expected:** Timeout or error (no sessionID provided)

### 5. Test Authenticated Route WITH Invalid Session (Should Return Error)

```bash
curl -X POST http://localhost:8000/api/CourseManagement/createCourse \
  -H "Content-Type: application/json" \
  -d '{
    "sessionID": "invalid-session-id",
    "code": "CS101",
    "name": "Intro to CS",
    "description": "A great course"
  }'
```

**Expected:** Error response:
```json
{
  "error": "Invalid or expired session"
}
```

### 6. Test Authenticated Route WITH Valid Session (Should Succeed)

Replace `YOUR_SESSION_ID` with the actual sessionID from step 3:

```bash
curl -X POST http://localhost:8000/api/CourseManagement/createCourse \
  -H "Content-Type: application/json" \
  -d '{
    "sessionID": "YOUR_SESSION_ID",
    "code": "CS101",
    "name": "Intro to CS",
    "description": "A great course"
  }'
```

**Expected:** Success response with course ID:
```json
{
  "course": "uuid-of-new-course"
}
```

### 7. Check Server Console

While running these tests, watch the server console. You should see traces like:

```
Requesting.request { path: "/CourseManagement/createCourse", sessionID: "...", code: "CS101", ... }
UserAuthentication._getSessionUser { sessionID: "..." } => { user: "..." }
CourseManagement.createCourse { creator: "...", code: "CS101", ... } => { course: "..." }
Requesting.respond { request: "...", course: "..." }
```

## 🔍 What to Look For

### ✅ Good Signs:
- Server starts without errors
- Register and login work
- Invalid session returns error immediately (not timeout)
- Valid session allows actions to execute
- Console shows action traces

### ❌ Problems:
- **Server won't start** - Check for syntax errors, run `deno run build`
- **Requests timeout** - Sync isn't firing, check the `where` clause
- **"Action not instrumented" error** - Using query in `when` clause instead of `where`
- **No response** - Missing response sync

## 📝 Known Issues

### Issue: Some routes still timeout

**Problem:** Not all routes have syncs implemented yet. Only these routes currently work:
- UserAuthentication: logout, changePassword, connectCanvas, _getSessionUser
- UserIdentity: updateUserName, updateUserEmail, _getUserById
- CourseManagement: createCourse, _getCoursesByCreator
- DeadlineManagement: createDeadline, _getDeadlinesByCourse
- DocumentManagement: uploadDocument, _getDocumentsByUser
- SuggestionManagement: confirm, _getUnconfirmedSuggestionsByUser

**Solution:** Add more syncs following the same pattern (see SYNC_PROGRESS.md)

### Issue: Queries that return arrays show empty responses

**Problem:** If a query returns no results (e.g., no courses yet), the sync times out

**Solution:** Already handled in syncs with `collectAs` - they return empty arrays

### Issue: Frontend still using old API

**Problem:** Frontend doesn't include `sessionID` in requests

**Solution:** Update frontend to:
1. Store sessionID from login response
2. Include sessionID in all authenticated requests
3. Handle authentication errors

## 🎯 Next Steps

Once the server is working:

1. ✅ **Test all implemented routes** - Make sure they work with valid/invalid sessions
2. 📝 **Add missing syncs** - ~46 more routes need syncs (see SYNC_PROGRESS.md)
3. 🎨 **Update frontend** - Add sessionID to all requests
4. 🧪 **Test end-to-end** - Full user journey from login to data operations
5. 🚀 **Deploy** - Use Render to deploy your app
6. 🎥 **Create demo video** - Show key features with narration

## 🆘 If You Get Stuck

Common issues and solutions:

1. **Port already in use**: Kill the existing server with `killall deno`
2. **Module not found**: Run `deno run build` to regenerate imports
3. **Sync not firing**: Check that the `path` parameter matches exactly (no `/api` prefix!)
4. **TypeScript errors**: Often just caching, try restarting your editor

Good luck! 🎉

