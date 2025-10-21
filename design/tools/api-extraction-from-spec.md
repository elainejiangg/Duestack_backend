[@concept-specifications](../background/concept-specifications.md)

[@UserIdentityConceptSpec](../concepts/DueStack-specs/UserIdentityConcept.md)

[@UserAuthenticationConceptSpec](../concepts/DueStack-specs/UserAuthenticationConcept.md)

[@CourseManagementConceptSpec](../concepts/DueStack-specs/CourseManagementConcept.md)

[@DeadlineManagementConceptSpec](../concepts/DueStack-specs/DeadlineManagementConcept.md)

[@DocumentManagementConceptSpec](../concepts/DueStack-specs/DocumentManagementConcept.md)

[@SuggestionManagementConceptSpec](../concepts/DueStack-specs/SuggestionManagementConcept.md)

# Concept API extraction

You are an expert software architect tasked with generating clear, developer-friendly API documentation. Your input is a formal "Concept Specification" which describes a modular piece of software functionality. This concept has been implemented and exposed as a REST-like API by a "Concept Server."

Your mission is to translate the provided Concept Specification into a structured API specification document written in Markdown. This document will be used by frontend developers to interact with the API.

Adhere to the following rules for the API structure and the documentation format:

**API Structure Rules:**

1.  **Base URL:** Assume a base URL of `/api`.
2.  **Endpoint Naming:** Each concept action or query maps to an endpoint. The URL structure is: `/{conceptName}/{actionOrQueryName}`.
    *   For a concept named `Labeling` and an action `createLabel`, the endpoint is `/api/Labeling/createLabel`.
3.  **HTTP Method:** All endpoints use the `POST` method.
4.  **Data Format:** All requests and responses use the `application/json` content type.
5.  **Request Body:** The request body is always a single JSON object. The keys of this object correspond to the input arguments defined in the action's signature.
6.  **Response Body:**
    *   **Actions:** A successful call to an action returns a single JSON object. The keys correspond to the results defined in the action's signature. If there are no results, an empty object `{}` is returned.
    *   **Queries:** A successful call to a query (a method name starting with `_`) returns a JSON **array** of objects.
    *   **Errors:** If an action fails to meet its `requires` condition or encounters another error, it returns a single JSON object with a single key: `{ "error": "A descriptive error message." }`.

**Documentation Format Rules:**

Generate the output in Markdown using the following template. For each action and query in the specification, create a dedicated endpoint section.

~~~markdown
# API Specification: {Concept Name} Concept

**Purpose:** {The concept's purpose.}

---

## API Endpoints

### POST /api/{conceptName}/{actionName}

**Description:** {A brief, one-sentence description of what this action does.}

**Requirements:**
- {List each point from the 'requires' section of the specification.}

**Effects:**
- {List each point from the 'effects' section of the specification.}

**Request Body:**
```json
{
  "argument1": "{type}",
  "argument2": "{type}"
}
```

**Success Response Body (Action):**
```json
{
  "result1": "{type}",
  "result2": "{type}"
}
```

**Success Response Body (Query):**
```json
[
  {
    "result1": "{type}",
    "result2": "{type}"
  }
]
```

**Error Response Body:**
```json
{
  "error": "string"
}
```
---
*(Repeat for each action and query)*
~~~

# prompt:

Now, analyze the following Concept Specification and generate the API documentation based on these instructions.

# response:


# response:

# API Specification: SuggestionManagement Concept

**Purpose:** represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.

---

## API Endpoints

### POST /api/SuggestionManagement/createExtractionConfig

**Description:** Creates a new configuration profile for LLM processing.

**Requirements:**
- `name` is unique

**Effects:**
- Creates a new `ExtractionConfig` entity for LLM processing.

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
---
### POST /api/SuggestionManagement/parseFromCanvas

**Description:** Parses assignment data from Canvas JSON to create deadline suggestions.

**Requirements:**
- `config` exists
- `canvasData` is valid JSON

**Effects:**
- Parses assignment JSON data, creating suggestions linked to the `user`.
- Sets `extractionMethod` to `CANVAS_JSON` and `source` to `CANVAS` for the new suggestions.

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
---
### POST /api/SuggestionManagement/llmExtractFromDocument

**Description:** Uses an LLM to extract structured deadline suggestions from the content of a single document.

**Requirements:**
- `config` exists
- `documentId` exists (external check via syncs)
- `documentContent` is text or image suitable for LLM

**Effects:**
- Uses an LLM to extract structured suggestions from document content, creating suggestions linked to the `user`.
- Sets `extractionMethod` to `LLM`, and populates `confidence` and `provenance` (linking to `documentId`).

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
---
### POST /api/SuggestionManagement/llmExtractFromMultipleDocuments

**Description:** Sends the combined content of multiple documents to an LLM in a single request to extract cross-referenced deadline suggestions.

**Requirements:**
- `config` exists
- `combinedDocumentContent` is non-empty and suitable for LLM

**Effects:**
- Sends combined document contents to an LLM in a single request to enable cross-referencing, creating suggestions linked to the `user`.
- Sets `extractionMethod` to `LLM`, and populates `confidence` and `provenance` with multi-source attribution (using `documentIds`).

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
---
### POST /api/SuggestionManagement/llmExtractFromWebsite

**Description:** Uses an LLM to parse the content of a website to create deadline suggestions.

**Requirements:**
- `config` exists
- `url` is reachable
- `websiteContent` is non-empty

**Effects:**
- Uses an LLM to parse website content into deadline suggestions, creating suggestions linked to the `user`.
- Sets `extractionMethod` to `LLM`, and populates `provenance` and `confidence`.

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
---
### POST /api/SuggestionManagement/refineWithFeedback

**Description:** Re-prompts an LLM using user feedback to refine the fields of an existing suggestion.

**Requirements:**
- `suggestion` exists
- `feedback` is non-empty
- `config` exists

**Effects:**
- Re-prompts an LLM using user feedback to refine fields of the suggestion.
- Updates the suggestion's `title`, `due`, `warnings`, or `confidence`.
- Returns the ID of the updated suggestion.

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
---
### POST /api/SuggestionManagement/editSuggestion

**Description:** Manually updates the title and due date of a deadline suggestion.

**Requirements:**
- `suggestion` exists
- `newTitle` is non-empty
- `newDue` is valid

**Effects:**
- Updates the suggestion's title and due date.
- Sets `warnings` to indicate manual editing.

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
---
### POST /api/SuggestionManagement/updateSuggestionTitle

**Description:** Manually updates the title of a deadline suggestion.

**Requirements:**
- `suggestion` exists
- `newTitle` is non-empty

**Effects:**
- Updates the suggestion's title.
- Sets `warnings` to indicate manual editing.

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
---
### POST /api/SuggestionManagement/updateSuggestionDate

**Description:** Manually updates the due date of a deadline suggestion.

**Requirements:**
- `suggestion` exists
- `newDue` is valid

**Effects:**
- Updates the suggestion's due date.
- Sets `warnings` to indicate manual editing.

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
---
### POST /api/SuggestionManagement/confirm

**Description:** Confirms a suggestion, returning the necessary data to create an official deadline in the `DeadlineManagement` concept.

**Requirements:**
- `suggestion` exists
- The suggestion is not already confirmed
- The suggestion has a valid title and due date
- `course` exists (external check via syncs)

**Effects:**
- Marks the suggestion as confirmed.
- Returns the data required for creating a new `Deadline`.

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
---