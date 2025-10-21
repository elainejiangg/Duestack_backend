---
timestamp: 'Tue Oct 21 2025 10:55:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_105536.b8a66f77.md]]'
content_id: 79aa6406a7ae6d12999398f12db0aa7707f9981670debefaa3008cf0adf9d266
---

# API Specification: DeadlineManagement Concept

**Purpose:** store and manage academic deadlines, tracking their status and association with courses.

***

## API Endpoints

### POST /api/DeadlineManagement/createDeadline

**Description:** Creates a new Deadline entity with the given details.

**Requirements:**

* course exists (this external check would be via syncs)

**Effects:**

* creates a new Deadline entity with the given details.

**Request Body:**

```json
{
  "course": "string",
  "title": "string",
  "due": "string",
  "source": "SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED",
  "addedBy": "string"
}
```

**Success Response Body (Action):**

```json
{
  "deadline": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DeadlineManagement/updateDeadline

**Description:** Updates the title, due date, and source of an existing deadline.

**Requirements:**

* deadline exists

**Effects:**

* updates the title, due date, and source of an existing deadline.

**Request Body:**

```json
{
  "deadline": "string",
  "newTitle": "string",
  "newDue": "string",
  "newSource": "SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED"
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

### POST /api/DeadlineManagement/setStatus

**Description:** Updates the completion status of a deadline.

**Requirements:**

* deadline exists

**Effects:**

* updates the completion status of a deadline.

**Request Body:**

```json
{
  "deadline": "string",
  "status": "NOT_STARTED or IN_PROGRESS or DONE"
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

### POST /api/DeadlineManagement/deleteDeadline

**Description:** Removes the specified deadline.

**Requirements:**

* deadline exists

**Effects:**

* removes the specified deadline.

**Request Body:**

```json
{
  "deadline": "string"
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
