---
timestamp: 'Sun Oct 19 2025 20:42:42 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_204242.75b13a2f.md]]'
content_id: 30265313483b8f003e35aa6d5b8b7f597d8ed8fe2063b61d67cdf9d7bc918dc7
---

# API Specification: SuggestionManagement Concept

**Purpose:** represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.

***

## API Endpoints

### POST /api/SuggestionManagement/createExtractionConfig

**Description:** Creates a new configuration profile for LLM processing.

**Requirements:**

* `name` is unique

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

**Description:** Parses assignment data from Canvas JSON to create deadline suggestions.

**Requirements:**

* `config` exists
* `canvasData` is valid JSON

**Effects:**

* Parses assignment JSON data, creating suggestions linked to the `user`.
* Sets `extractionMethod` to `CANVAS_JSON` and `source` to `CANVAS` for the new suggestions.

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

**Description:** Uses an LLM to extract structured deadline suggestions from the content of a single document.

**Requirements:**

* `config` exists
* `documentId` exists (external check via syncs)
* `documentContent` is text or image suitable for LLM

**Effects:**

* Uses an LLM to extract structured suggestions from document content, creating suggestions linked to the `user`.
* Sets `extractionMethod` to `LLM`, and populates `confidence` and `provenance` (linking to `documentId`).

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

* `config` exists
* `combinedDocumentContent` is non-empty and suitable for LLM

**Effects:**

* Sends combined document contents to an LLM in a single request to enable cross-referencing, creating suggestions linked to the `user`.
* Sets `extractionMethod` to `LLM`, and populates `confidence` and `provenance` with multi-source attribution (using `documentIds`).

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

**Description:** Uses an LLM to parse the content of a website to create deadline suggestions.

**Requirements:**

* `config` exists
* `url` is reachable
* `websiteContent` is non-empty

**Effects:**

* Uses an LLM to parse website content into deadline suggestions, creating suggestions linked to the `user`.
* Sets `extractionMethod` to `LLM`, and populates `provenance` and `confidence`.

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

* `suggestion` exists
* `feedback` is non-empty
* `config` exists

**Effects:**

* Re-prompts an LLM using user feedback to refine fields of the suggestion.
* Updates the suggestion's `title`, `due`, `warnings`, or `confidence`.
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

* `suggestion` exists
* `newTitle` is non-empty
* `newDue` is valid

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

* `suggestion` exists
* `newTitle` is non-empty

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

* `suggestion` exists
* `newDue` is valid

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

**Description:** Confirms a suggestion, returning the necessary data to create an official deadline in the `DeadlineManagement` concept.

**Requirements:**

* `suggestion` exists
* The suggestion is not already confirmed
* The suggestion has a valid title and due date
* `course` exists (external check via syncs)

**Effects:**

* Marks the suggestion as confirmed.
* Returns the data required for creating a new `Deadline`.

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
