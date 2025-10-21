---
timestamp: 'Tue Oct 21 2025 10:55:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_105536.b8a66f77.md]]'
content_id: 97fa8564ecff7ef21eeace7a5d29c809c467dd1853f60aad6cad5c0ee56beafd
---

# API Specification: SuggestionManagement Concept

**Purpose:** represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.

***

## API Endpoints

### POST /api/SuggestionManagement/createExtractionConfig

**Description:** Creates a new ExtractionConfig entity for LLM processing.

**Requirements:**

* name is unique

**Effects:**

* creates a new ExtractionConfig entity for LLM processing.

**Request Body:**

```json
{
  "name": "string",
  "modelVersion": "string",
  "basePromptTemplate": "string",
  "maxTokens": "number",
  "temperature": "number",
  "timezone": "string",
  "optionalTimeout": "number"
}
```

**Success Response Body (Action):**

```json
{
  "config": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/parseFromCanvas

**Description:** Parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

**Requirements:**

* config exists and canvasData is valid JSON

**Effects:**

* parses assignment JSON data, creates suggestions linked to `user`.
* sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

**Request Body:**

```json
{
  "user": "string",
  "canvasData": "string",
  "config": "string"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": [
    "string"
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/llmExtractFromDocument

**Description:** Uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

**Requirements:**

* config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM

**Effects:**

* uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
* sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

**Request Body:**

```json
{
  "user": "string",
  "documentId": "string",
  "documentContent": "string",
  "config": "string"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": [
    "string"
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/llmExtractFromMultipleDocuments

**Description:** Sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

**Requirements:**

* config exists, combinedDocumentContent is non-empty and suitable for LLM

**Effects:**

* sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
* sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

**Request Body:**

```json
{
  "user": "string",
  "documentIds": [
    "string"
  ],
  "combinedDocumentContent": "string",
  "config": "string"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": [
    "string"
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/llmExtractFromWebsite

**Description:** Uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `provenance`, `confidence`.

**Requirements:**

* config exists, url is reachable, websiteContent is non-empty

**Effects:**

* uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
* sets `extractionMethod = LLM`, `provenance`, `confidence`.

**Request Body:**

```json
{
  "user": "string",
  "url": "string",
  "websiteContent": "string",
  "config": "string"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": [
    "string"
  ]
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/refineWithFeedback

**Description:** Re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

**Requirements:**

* suggestion exists, feedback is non-empty, config exists

**Effects:**

* re-prompts LLM using user feedback to refine fields of the suggestion.
* updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

**Request Body:**

```json
{
  "suggestion": "string",
  "feedback": "string",
  "config": "string"
}
```

**Success Response Body (Action):**

```json
{
  "suggestion": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/editSuggestion

**Description:** Updates suggestion title and due date. Sets `warnings` to indicate manual editing.

**Requirements:**

* suggestion exists, newTitle is non-empty, newDue is valid

**Effects:**

* updates suggestion title and due date.
* sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "string",
  "newTitle": "string",
  "newDue": "string"
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

### POST /api/SuggestionManagement/updateSuggestionTitle

**Description:** Updates suggestion title. Sets `warnings` to indicate manual editing.

**Requirements:**

* suggestion exists and newTitle is non-empty

**Effects:**

* updates suggestion title.
* sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "string",
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

### POST /api/SuggestionManagement/updateSuggestionDate

**Description:** Updates suggestion due date. Sets `warnings` to indicate manual editing.

**Requirements:**

* suggestion exists and newDue is valid

**Effects:**

* updates suggestion due date.
* sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "string",
  "newDue": "string"
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

### POST /api/SuggestionManagement/confirm

**Description:** Marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.

**Requirements:**

* suggestion exists, is not already confirmed, has valid title and due date, and course exists (external check via syncs)

**Effects:**

* marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.

**Request Body:**

```json
{
  "suggestion": "string",
  "course": "string",
  "addedBy": "string"
}
```

**Success Response Body (Action):**

```json
{
  "course": "string",
  "title": "string",
  "due": "string",
  "source": "SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED",
  "addedBy": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
