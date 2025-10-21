---
timestamp: 'Sun Oct 19 2025 20:38:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_203852.83586eb5.md]]'
content_id: 8890027a89783bf741db6d66e41119779e22d710488efaad378003a99294f43e
---

# API Specification: CourseManagement Concept

**Purpose:** organize and categorize academic deadlines by associating them with specific courses.

***

## API Endpoints

### POST /api/CourseManagement/createCourse

**Description:** Creates a new Course entity with the given details, linked to the creator.

**Requirements:**

* courseCode is unique for the creator

**Effects:**

* creates a new Course entity with the given details, linked to the creator.

**Request Body:**

```json
{
  "creator": "string",
  "courseCode": "string",
  "title": "string"
}
```

**Success Response Body (Action):**

```json
{
  "course": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/CourseManagement/updateCourse

**Description:** Updates the courseCode and title of an existing course.

**Requirements:**

* course exists and newCourseCode is unique for its creator (if changed)

**Effects:**

* updates the courseCode and title of an existing course.

**Request Body:**

```json
{
  "course": "string",
  "newCourseCode": "string",
  "newTitle": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/CourseManagement/setCanvasId

**Description:** Sets or updates the external Canvas ID for the specified course.

**Requirements:**

* course exists and canvasId is unique across all courses

**Effects:**

* sets or updates the external Canvas ID for the specified course.

**Request Body:**

```json
{
  "course": "string",
  "canvasId": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/CourseManagement/deleteCourse

**Description:** Removes the specified course entity.

**Requirements:**

* course exists and has no associated deadlines (this external check would be via syncs)

**Effects:**

* removes the specified course entity.

**Request Body:**

```json
{
  "course": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
