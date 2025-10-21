---
timestamp: 'Sun Oct 19 2025 20:49:46 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_204946.a71face4.md]]'
content_id: 50775e18ddaaeb4b934240eb6050507463cbe92f21ed6199e19ca320e7e96618
---

# API Specification: SuggestionManagement Concept

**Purpose:** represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.

***

## API Endpoints

### POST /api/SuggestionManagement/createExtractionConfig

**Description:** Creates a new configuration profile for LLM processing.

**Requirements:**

* `name` is unique.

**Effects:**

* Creates a new `ExtractionConfig` entity for LLM processing.

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
  "config": "ExtractionConfig"
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

**Description:** Parses assignment JSON data from Canvas to create deadline suggestions.

**Requirements:**

* `config` exists and `canvasData` is valid JSON.

**Effects:**

* Parses assignment JSON data, creating suggestions linked to the `user`.
* Sets `extractionMethod = CANVAS_JSON` and `source = CANVAS` for the new suggestions.

**Request Body:**

```json
{
  "user": "User",
  "canvasData": "string",
  "config": "ExtractionConfig"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": "List<ParsedDeadlineSuggestion>"
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

**Description:** Uses an LLM to extract structured suggestions from a single document's content.

**Requirements:**

* `config` exists.
* `documentId` exists (external check via syncs).
* `documentContent` is text or image suitable for LLM.

**Effects:**

* Creates suggestions linked to the `user`.
* Sets `extractionMethod = LLM`, `confidence`, and `provenance` (linking to `documentId`).

**Request Body:**

```json
{
  "user": "User",
  "documentId": "Document",
  "documentContent": "string",
  "config": "ExtractionConfig"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": "List<ParsedDeadlineSuggestion>"
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

**Description:** Sends the combined content of multiple documents to an LLM in a single request to extract cross-referenced deadline suggestions.

**Requirements:**

* `config` exists.
* `combinedDocumentContent` is non-empty and suitable for LLM.

**Effects:**

* Creates suggestions linked to the `user`.
* Sets `extractionMethod = LLM`, `confidence`, and `provenance` with multi-source attribution (using `documentIds`).

**Request Body:**

```json
{
  "user": "User",
  "documentIds": "List<Document>",
  "combinedDocumentContent": "string",
  "config": "ExtractionConfig"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": "List<ParsedDeadlineSuggestion>"
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

**Description:** Uses an LLM to parse website content into deadline suggestions.

**Requirements:**

* `config` exists.
* `url` is reachable.
* `websiteContent` is non-empty.

**Effects:**

* Creates suggestions linked to the `user`.
* Sets `extractionMethod = LLM`, `provenance`, and `confidence`.

**Request Body:**

```json
{
  "user": "User",
  "url": "string",
  "websiteContent": "string",
  "config": "ExtractionConfig"
}
```

**Success Response Body (Action):**

```json
{
  "suggestions": "List<ParsedDeadlineSuggestion>"
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

**Description:** Re-prompts an LLM using user feedback to refine the fields of an existing suggestion.

**Requirements:**

* `suggestion` exists.
* `feedback` is non-empty.
* `config` exists.

**Effects:**

* Updates the `title`, `due`, `warnings`, or `confidence` of the suggestion.
* Returns the ID of the updated suggestion.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion",
  "feedback": "string",
  "config": "ExtractionConfig"
}
```

**Success Response Body (Action):**

```json
{
  "suggestion": "ParsedDeadlineSuggestion"
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

**Description:** Manually updates the title and due date of a deadline suggestion.

**Requirements:**

* `suggestion` exists.
* `newTitle` is non-empty.
* `newDue` is a valid date.

**Effects:**

* Updates the suggestion's title and due date.
* Sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion",
  "newTitle": "string",
  "newDue": "DateTime"
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

**Description:** Manually updates the title of a deadline suggestion.

**Requirements:**

* `suggestion` exists.
* `newTitle` is non-empty.

**Effects:**

* Updates the suggestion's title.
* Sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion",
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

**Description:** Manually updates the due date of a deadline suggestion.

**Requirements:**

* `suggestion` exists.
* `newDue` is a valid date.

**Effects:**

* Updates the suggestion's due date.
* Sets `warnings` to indicate manual editing.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion",
  "newDue": "DateTime"
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

**Description:** Confirms a suggestion, returning the data needed to create an official deadline.

**Requirements:**

* `suggestion` exists and is not already confirmed.
* The suggestion has a valid title and due date.
* `course` exists (external check via syncs).

**Effects:**

* Marks the suggestion as confirmed.
* Returns the canonical data for creating a new `Deadline`.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion",
  "course": "Course",
  "addedBy": "User"
}
```

**Success Response Body (Action):**

```json
{
  "course": "Course",
  "title": "string",
  "due": "DateTime",
  "source": "SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED",
  "addedBy": "User"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/\_getSuggestionById

**Description:** Retrieves a single suggestion by its unique ID.

**Requirements:**

* The `suggestion` ID must exist.

**Effects:**

* Returns an array containing the full suggestion document if found, otherwise an empty array.

**Request Body:**

```json
{
  "suggestion": "ParsedDeadlineSuggestion"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "ParsedDeadlineSuggestion",
    "user": "User",
    "document": "Document",
    "canvasMetadata": "string",
    "websiteUrl": "string",
    "title": "string",
    "due": "DateTime",
    "source": "string",
    "confirmed": "boolean",
    "confidence": "number",
    "extractionMethod": "string",
    "provenance": "string",
    "warnings": "List<string>"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/\_getSuggestionsByUser

**Description:** Retrieves all suggestions initiated by a specific user.

**Requirements:**

* The `user` ID must exist.

**Effects:**

* Returns an array of all suggestion documents associated with the user.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "ParsedDeadlineSuggestion",
    "user": "User",
    "document": "Document",
    "canvasMetadata": "string",
    "websiteUrl": "string",
    "title": "string",
    "due": "DateTime",
    "source": "string",
    "confirmed": "boolean",
    "confidence": "number",
    "extractionMethod": "string",
    "provenance": "string",
    "warnings": "List<string>"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/SuggestionManagement/\_getUnconfirmedSuggestionsByUser

**Description:** Retrieves all unconfirmed suggestions for a specific user.

**Requirements:**

* The `user` ID must exist.

**Effects:**

* Returns an array of suggestion documents associated with the user where the `confirmed` flag is false.

**Request Body:**

```json
{
  "user": "User"
}
```

**Success Response Body (Query):**

```json
[
  {
    "_id": "ParsedDeadlineSuggestion",
    "user": "User",
    "document": "Document",
    "canvasMetadata": "string",
    "websiteUrl": "string",
    "title": "string",
    "due": "DateTime",
    "source": "string",
    "confirmed": false,
    "confidence": "number",
    "extractionMethod": "string",
    "provenance": "string",
    "warnings": "List<string>"
  }
]
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
