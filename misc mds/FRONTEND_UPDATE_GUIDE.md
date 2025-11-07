# Frontend Update Guide

## Overview

Your frontend needs to be updated to work with the new authenticated backend. This guide walks you through the necessary changes.

## Key Changes Required

1. **Store sessionID after login**
2. **Include sessionID in all authenticated requests**
3. **Handle authentication errors**
4. **Update API call signatures**

---

## Step 1: Update Login/Registration Flow

### A. Registration

**Before:**
```typescript
async function register(username: string, password: string, name: string, email: string) {
  // First create user identity
  const userResponse = await fetch('/api/UserIdentity/createUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email })
  });
  const { user } = await userResponse.json();
  
  // Then register authentication
  const authResponse = await fetch('/api/UserAuthentication/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user, username, password })
  });
  
  return await authResponse.json();
}
```

**After:** (Same - registration is public)

### B. Login

**Before:**
```typescript
async function login(username: string, password: string) {
  const response = await fetch('/api/UserAuthentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  return await response.json();
}
```

**After:** Add sessionID storage
```typescript
async function login(username: string, password: string) {
  const response = await fetch('/api/UserAuthentication/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  
  const data = await response.json();
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  // ✨ NEW: Store session data
  localStorage.setItem('sessionID', data.sessionID);
  localStorage.setItem('userId', data.user);
  
  return data;
}
```

### C. Logout

**Before:**
```typescript
function logout() {
  // Just clear local state
  localStorage.clear();
  router.push('/login');
}
```

**After:** Call backend to invalidate session
```typescript
async function logout() {
  const sessionID = localStorage.getItem('sessionID');
  
  if (sessionID) {
    try {
      await fetch('/api/UserAuthentication/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionID })
      });
    } catch (err) {
      console.error('Logout error:', err);
    }
  }
  
  // Clear local storage
  localStorage.removeItem('sessionID');
  localStorage.removeItem('userId');
  
  // Redirect to login
  router.push('/login');
}
```

---

## Step 2: Create API Helper Function

Create a helper to automatically include sessionID in all requests:

```typescript
// utils/api.ts or services/api.ts

/**
 * Make an authenticated API request
 */
async function apiRequest(path: string, body: any) {
  const sessionID = localStorage.getItem('sessionID');
  
  if (!sessionID) {
    // No session - redirect to login
    router.push('/login');
    throw new Error('Not authenticated');
  }
  
  const response = await fetch(`/api${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sessionID,  // Always include sessionID
      ...body
    })
  });
  
  const data = await response.json();
  
  // Handle auth errors
  if (data.error === "Invalid or expired session") {
    localStorage.removeItem('sessionID');
    localStorage.removeItem('userId');
    router.push('/login');
    throw new Error('Session expired. Please log in again.');
  }
  
  if (data.error) {
    throw new Error(data.error);
  }
  
  return data;
}

export { apiRequest };
```

---

## Step 3: Update All API Calls

### Course Management

**Before:**
```typescript
async function createCourse(code: string, name: string, description: string) {
  const userId = localStorage.getItem('userId');
  const response = await fetch('/api/CourseManagement/createCourse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      creator: userId,  // ❌ Don't send creator
      code, 
      name, 
      description 
    })
  });
  return await response.json();
}
```

**After:**
```typescript
import { apiRequest } from '@/utils/api';

async function createCourse(code: string, name: string, description: string) {
  // ✨ Creator is derived from session on backend
  return await apiRequest('/CourseManagement/createCourse', {
    code,
    name,
    description
  });
}
```

**Before:**
```typescript
async function getMyCourses() {
  const userId = localStorage.getItem('userId');
  const response = await fetch('/api/CourseManagement/_getCoursesByCreator', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ creator: userId })
  });
  return await response.json();
}
```

**After:**
```typescript
async function getMyCourses() {
  // ✨ User is derived from session on backend
  const data = await apiRequest('/CourseManagement/_getCoursesByCreator', {});
  return data.results || [];  // Returns array of courses
}
```

### Deadline Management

**Before:**
```typescript
async function createDeadline(course: string, title: string, description: string, dueDate: string) {
  const userId = localStorage.getItem('userId');
  const response = await fetch('/api/DeadlineManagement/createDeadline', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      course, 
      title, 
      description, 
      dueDate,
      addedBy: userId  // ❌ Don't send addedBy
    })
  });
  return await response.json();
}
```

**After:**
```typescript
async function createDeadline(course: string, title: string, description: string, dueDate: string) {
  // ✨ addedBy is derived from session on backend
  return await apiRequest('/DeadlineManagement/createDeadline', {
    course,
    title,
    description,
    dueDate
  });
}
```

**Before:**
```typescript
async function getDeadlinesByCourse(courseId: string) {
  const response = await fetch('/api/DeadlineManagement/_getDeadlinesByCourse', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ course: courseId })
  });
  return await response.json();
}
```

**After:**
```typescript
async function getDeadlinesByCourse(courseId: string) {
  const data = await apiRequest('/DeadlineManagement/_getDeadlinesByCourse', {
    course: courseId
  });
  return data.results || [];  // Returns array of deadlines
}
```

### Document Management

**Before:**
```typescript
async function uploadDocument(course: string, filename: string, content: string, mimeType: string) {
  const userId = localStorage.getItem('userId');
  const response = await fetch('/api/DocumentManagement/uploadDocument', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      user: userId,  // ❌ Don't send user
      course,
      filename,
      content,
      mimeType
    })
  });
  return await response.json();
}
```

**After:**
```typescript
async function uploadDocument(course: string, filename: string, content: string, mimeType: string) {
  // ✨ user is derived from session on backend
  return await apiRequest('/DocumentManagement/uploadDocument', {
    course,
    filename,
    content,
    mimeType
  });
}
```

### Suggestion Management

**Before:**
```typescript
async function getUnconfirmedSuggestions() {
  const userId = localStorage.getItem('userId');
  const response = await fetch('/api/SuggestionManagement/_getUnconfirmedSuggestionsByUser', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user: userId })
  });
  return await response.json();
}
```

**After:**
```typescript
async function getUnconfirmedSuggestions() {
  // ✨ user is derived from session on backend
  const data = await apiRequest('/SuggestionManagement/_getUnconfirmedSuggestionsByUser', {});
  return data.results || [];
}
```

**Before:**
```typescript
async function confirmSuggestion(suggestionId: string) {
  const response = await fetch('/api/SuggestionManagement/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suggestion: suggestionId })
  });
  return await response.json();
}
```

**After:**
```typescript
async function confirmSuggestion(suggestionId: string) {
  return await apiRequest('/SuggestionManagement/confirm', {
    suggestion: suggestionId
  });
}
```

---

## Step 4: Add Route Guards (Optional but Recommended)

Protect your routes so unauthenticated users can't access them:

```typescript
// router/index.ts or similar

router.beforeEach((to, from, next) => {
  const publicPages = ['/login', '/register'];
  const authRequired = !publicPages.includes(to.path);
  const sessionID = localStorage.getItem('sessionID');

  if (authRequired && !sessionID) {
    // Redirect to login if trying to access protected page without session
    return next('/login');
  }

  next();
});
```

---

## Step 5: Update Components

### Example: Login Component

```vue
<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const username = ref('');
const password = ref('');
const error = ref('');

async function handleLogin() {
  try {
    const data = await login(username.value, password.value);
    // SessionID is automatically stored by login function
    router.push('/dashboard');
  } catch (err) {
    error.value = err.message;
  }
}
</script>
```

### Example: Course List Component

```vue
<script setup lang="ts">
import { ref, onMounted } from 'vue';

const courses = ref([]);
const loading = ref(true);
const error = ref('');

onMounted(async () => {
  try {
    courses.value = await getMyCourses();
  } catch (err) {
    error.value = err.message;
    // Will auto-redirect to login if session expired
  } finally {
    loading.value = false;
  }
});
</script>
```

---

## Common Issues and Solutions

### Issue 1: Request Times Out
**Cause:** Route doesn't have a sync yet.

**Solution:** Note which route timed out and request a sync for it.

### Issue 2: "Invalid or expired session" Error
**Cause:** Session expired or was invalidated.

**Solution:** Already handled by `apiRequest` helper - redirects to login.

### Issue 3: User ID Still Needed
**Cause:** Some routes might still need explicit user ID.

**Solution:** Check sync design - most routes derive user from session, but some queries might need it as parameter.

### Issue 4: Response Format Changed
**Cause:** Query responses now return `{ results: [...] }` instead of direct array.

**Solution:** Update code to access `.results` property (as shown in examples above).

---

## Testing Checklist

After making changes, test:

- [ ] Registration works
- [ ] Login works and stores sessionID
- [ ] Can create courses after login
- [ ] Can view courses after login
- [ ] Can create deadlines
- [ ] Can view deadlines
- [ ] Can upload documents
- [ ] Can view suggestions
- [ ] Logout works and clears session
- [ ] Cannot access protected routes after logout
- [ ] Session expiry redirects to login
- [ ] Error messages display correctly

---

## Summary of Changes

### What to REMOVE from frontend:
- ❌ Passing `creator` when creating courses
- ❌ Passing `addedBy` when creating deadlines
- ❌ Passing `user` when uploading documents
- ❌ Passing `user` when querying user-specific data

### What to ADD to frontend:
- ✅ Store `sessionID` after login
- ✅ Include `sessionID` in all authenticated requests
- ✅ Handle authentication errors
- ✅ Clear session on logout
- ✅ Redirect to login when session invalid

### Key Insight:
**The backend now derives user identity from the session token**, so you don't need to (and shouldn't) send user IDs from the frontend. This is more secure and prevents users from impersonating others.


