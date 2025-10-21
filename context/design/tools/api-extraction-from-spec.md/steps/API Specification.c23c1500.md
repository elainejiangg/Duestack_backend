---
timestamp: 'Sun Oct 19 2025 20:38:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_203852.83586eb5.md]]'
content_id: c23c150034760da4ccd4acde34384d0ae6747c4fc27c07f8c498604de1ce07cd
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
  "source": "string",
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
  "newSource": "string"
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
  "status": "string"
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
