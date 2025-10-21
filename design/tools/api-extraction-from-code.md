[@api-extraction-from-spec](./api-extraction-from-spec.md)


[@UserIdentityConcept.ts](../../src/concepts/DueStack/UserIdentityConcept.ts)

[@UserIdentityConcept.test.ts](../../src/concepts/DueStack/UserIdentityConcept.test.ts)

[@UserAuthenticationConcept.ts](../../src/concepts/DueStack/UserAuthenticationConcept.ts)

[@UserAuthenticationConcept.test.ts](../../src/concepts/DueStack/UserAuthenticationConcept.test.ts)

[@CourseManagementConcept.ts](../../src/concepts/DueStack/CourseManagementConcept.ts)

[@CourseManagementConcept.test.ts](../../src/concepts/DueStack/CourseManagementConcept.test.ts)

[@DeadlineManagementConcept.ts](../../src/concepts/DueStack/DeadlineManagementConcept.ts)

[@DeadlineManagementConcept.test.ts](../../src/concepts/DueStack/DeadlineManagementConcept.test.ts)

[@DocumentManagementConcept.ts](../../src/concepts/DueStack/DocumentManagementConcept.ts)

[@DocumentManagementConcept.test.ts](../../src/concepts/DueStack/DocumentManagementConcept.test.ts)

[@SuggestionManagementConcept.ts](../../src/concepts/DueStack/SuggestionManagementConcept.ts)

[@SuggestionManagementConcept.test.ts](../../src/concepts/DueStack/SuggestionManagementConcept.test.ts)


# Extracting from code

The following is an explanation of how concepts are implemented, for the purposes of understanding how to extract an API.

[@implementing-concepts](../background/implementing-concepts.md)

# prompt: 

Now, analyze the following Concept Implementation and generate the API documentation based on these instructions.

# response:

# API Specification: UserIdentity Concept

**Purpose:** manage the core, unique identity and basic profile information for individuals interacting with the system.

---

## API Endpoints

### POST /api/UserIdentity/createUser

**Description:** Creates a new user identity, storing their unique email and display name.

**Requirements:**

*   email is unique

**Effects:**

*   a new User entity is created with the given email and name, and its opaque ID is returned.

**Request Body:**

```json
{
  "email": "string",
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/UserIdentity/updateUserName

**Description:** Updates the display name for the specified User.

**Requirements:**

*   user exists

**Effects:**

*   updates the name for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "newName": "string"
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

### POST /api/UserIdentity/updateUserEmail

**Description:** Updates the email address for the specified User.

**Requirements:**

*   user exists and newEmail is unique

**Effects:**

*   updates the email for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "newEmail": "string"
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

# API Specification: UserAuthentication Concept

**Purpose:** allow users to securely register, log in, and manage their credentials.

---

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

**Requirements:**

*   username is unique and password meets complexity requirements

**Effects:**

*   creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

**Request Body:**

```json
{
  "user": "string",
  "username": "string",
  "password": "string"
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

### POST /api/UserAuthentication/login

**Description:** Allows a user to log in with their username and password, establishing a session.

**Requirements:**

*   username and password match an existing AuthenticatedUser

**Effects:**

*   generates a new sessionID for the AuthenticatedUser.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "sessionID": "string",
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/UserAuthentication/logout

**Description:** Logs out a user by invalidating their session.

**Requirements:**

*   sessionID is valid

**Effects:**

*   clears the sessionID for the associated AuthenticatedUser.

**Request Body:**

```json
{
  "sessionID": "string"
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

### POST /api/UserAuthentication/changePassword

**Description:** Allows a user to change their password.

**Requirements:**

*   user exists, oldPassword matches, newPassword meets complexity requirements

**Effects:**

*   updates the passwordHash for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "oldPassword": "string",
  "newPassword": "string"
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

### POST /api/UserAuthentication/connectCanvas

**Description:** Stores the Canvas OAuth token for a user, enabling Canvas data fetching.

**Requirements:**

*   user exists and canvasOAuthToken is valid

**Effects:**

*   stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

**Request Body:**

```json
{
  "user": "string",
  "canvasOAuthToken": "string"
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

### POST /api/UserAuthentication/disconnectCanvas

**Description:** Clears the Canvas OAuth token for a user.

**Requirements:**

*   user exists and has an existing canvasOAuthToken

**Effects:**

*   clears the Canvas OAuth token for the user.

**Request Body:**

```json
{
  "user": "string"
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

# API Specification: CourseManagement Concept

**Purpose:** organize and categorize academic deadlines by associating them with specific courses.

---

## API Endpoints

### POST /api/CourseManagement/createCourse

**Description:** Creates a new course entity with the given details, linked to the creator.

**Requirements:**

*   courseCode is unique for the creator

**Effects:**

*   creates a new Course entity with the given details, linked to the creator.

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

---

### POST /api/CourseManagement/updateCourse

**Description:** Updates the courseCode and title of an existing course.

**Requirements:**

*   course exists and newCourseCode is unique for its creator (if changed)

**Effects:**

*   updates the courseCode and title of an existing course.

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

---

### POST /api/CourseManagement/setCanvasId

**Description:** Sets or updates the external Canvas ID for the specified course.

**Requirements:**

*   course exists and canvasId is unique across all courses

**Effects:**

*   sets or updates the external Canvas ID for the specified course.

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

---

### POST /api/CourseManagement/deleteCourse

**Description:** Removes the specified course entity.

**Requirements:**

*   course exists and has no associated deadlines (this external check would be via syncs)

**Effects:**

*   removes the specified course entity.

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

---

# API Specification: DeadlineManagement Concept

**Purpose:** store and manage academic deadlines, tracking their status and association with courses.

---

## API Endpoints

### POST /api/DeadlineManagement/createDeadline

**Description:** Creates a new Deadline entity with the given details.

**Requirements:**

*   course exists (this external check would be via syncs)

**Effects:**

*   creates a new Deadline entity with the given details.

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

---

### POST /api/DeadlineManagement/updateDeadline

**Description:** Updates the title, due date, and source of an existing deadline.

**Requirements:**

*   deadline exists

**Effects:**

*   updates the title, due date, and source of an existing deadline.

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

---

### POST /api/DeadlineManagement/setStatus

**Description:** Updates the completion status of a deadline.

**Requirements:**

*   deadline exists

**Effects:**

*   updates the completion status of a deadline.

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

---

### POST /api/DeadlineManagement/deleteDeadline

**Description:** Removes the specified deadline.

**Requirements:**

*   deadline exists

**Effects:**

*   removes the specified deadline.

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

---

# API Specification: DocumentManagement Concept

**Purpose:** securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.

---

## API Endpoints

### POST /api/DocumentManagement/uploadDocument

**Description:** Simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

**Requirements:**

*   course exists (external check via syncs) and rawFileContent is non-empty

**Effects:**

*   simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

**Request Body:**

```json
{
  "course": "string",
  "fileName": "string",
  "fileType": "string",
  "rawFileContent": "string",
  "uploader": "string"
}
```

**Success Response Body (Action):**

```json
{
  "document": "string",
  "processedTextContent": "string",
  "contentUrl": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/DocumentManagement/updateDocumentMetadata

**Description:** Updates the fileName and fileType of an existing document's metadata.

**Requirements:**

*   document exists

**Effects:**

*   updates the fileName and fileType of an existing document's metadata.

**Request Body:**

```json
{
  "document": "string",
  "newFileName": "string",
  "newFileType": "string"
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

### POST /api/DocumentManagement/getDocumentContent

**Description:** Retrieves the stored processed text content of the specified document.

**Requirements:**

*   document exists

**Effects:**

*   retrieves the stored processed text content of the specified document.

**Request Body:**

```json
{
  "document": "string"
}
```

**Success Response Body (Action):**

```json
{
  "processedTextContent": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

---

### POST /api/DocumentManagement/deleteDocument

**Description:** Removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.

**Requirements:**

*   document exists

**Effects:**

*   removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.

**Request Body:**

```json
{
  "document": "string"
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

# API Specification: SuggestionManagement Concept

**Purpose:** represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.

---

## API Endpoints

### POST /api/SuggestionManagement/createExtractionConfig

**Description:** Creates a new ExtractionConfig entity for LLM processing.

**Requirements:**

*   name is unique

**Effects:**

*   creates a new ExtractionConfig entity for LLM processing.

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

---

### POST /api/SuggestionManagement/parseFromCanvas

**Description:** Parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

**Requirements:**

*   config exists and canvasData is valid JSON

**Effects:**

*   parses assignment JSON data, creates suggestions linked to `user`.
*   sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

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

---

### POST /api/SuggestionManagement/llmExtractFromDocument

**Description:** Uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

**Requirements:**

*   config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM

**Effects:**

*   uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
*   sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

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

---

### POST /api/SuggestionManagement/llmExtractFromMultipleDocuments

**Description:** Sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

**Requirements:**

*   config exists, combinedDocumentContent is non-empty and suitable for LLM

**Effects:**

*   sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
*   sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

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

---

### POST /api/SuggestionManagement/llmExtractFromWebsite

**Description:** Uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `provenance`, `confidence`.

**Requirements:**

*   config exists, url is reachable, websiteContent is non-empty

**Effects:**

*   uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
*   sets `extractionMethod = LLM`, `provenance`, `confidence`.

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

---

### POST /api/SuggestionManagement/refineWithFeedback

**Description:** Re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

**Requirements:**

*   suggestion exists, feedback is non-empty, config exists

**Effects:**

*   re-prompts LLM using user feedback to refine fields of the suggestion.
*   updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

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

---

### POST /api/SuggestionManagement/editSuggestion

**Description:** Updates suggestion title and due date. Sets `warnings` to indicate manual editing.

**Requirements:**

*   suggestion exists, newTitle is non-empty, newDue is valid

**Effects:**

*   updates suggestion title and due date.
*   sets `warnings` to indicate manual editing.

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

---

### POST /api/SuggestionManagement/updateSuggestionTitle

**Description:** Updates suggestion title. Sets `warnings` to indicate manual editing.

**Requirements:**

*   suggestion exists and newTitle is non-empty

**Effects:**

*   updates suggestion title.
*   sets `warnings` to indicate manual editing.

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

---

### POST /api/SuggestionManagement/updateSuggestionDate

**Description:** Updates suggestion due date. Sets `warnings` to indicate manual editing.

**Requirements:**

*   suggestion exists and newDue is valid

**Effects:**

*   updates suggestion due date.
*   sets `warnings` to indicate manual editing.

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

---

### POST /api/SuggestionManagement/confirm

**Description:** Marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.

**Requirements:**

*   suggestion exists, is not already confirmed, has valid title and due date, and course exists (external check via syncs)

**Effects:**

*   marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.

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

---