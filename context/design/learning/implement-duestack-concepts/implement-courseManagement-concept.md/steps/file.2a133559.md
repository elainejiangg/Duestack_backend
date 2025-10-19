---
timestamp: 'Sun Oct 19 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010512.56841c14.md]]'
content_id: 2a1335591047d9cfff42a46b0e996a958710b29a544bf1d2c950aa893fae621a
---

# file: src/concepts/DueStack/DueStack-new-concepts.md

````markdown
# Concept Design

> Design a set of concepts that will embody the functionality of your app and deliver its features. We expect you to have 3–5 concepts. Fewer than 3 concepts would probably mean limited functionality or a lack of separation of concerns; more than 5 likely suggests overambition or lack of focus.

### Concept Specifications

#### UserIdentity

```concept
concept UserIdentity
purpose manage the core, unique identity and basic profile information for individuals interacting with the system.
principle new user identities can be created, storing their unique email and display name.

state
a set of Users with // 'Users' here refers to the collection of User entities
  a email String
  a name String

actions
createUser (email: String, name: String): (user: User) or (error: String)
  requires email is unique
  effects a new User is created with the given email and name, and its opaque ID is returned.
````

***

#### UserAuthentication

```concept
concept UserAuthentication [User]
purpose allow users to securely register, log in, and manage their credentials.
principle a user can register with a unique username and password, log in to establish a session, and log out to end it.

state
a set of AuthenticatedUsers with
  a user User
  a username String
  a passwordHash String
  an optional sessionID String
  an optional canvasOAuthToken String // To store Canvas connection token

actions
register (user: User, username: String, password: String): Empty or (error: String)
  requires username is unique and password meets complexity requirements
  effects creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

login (username: String, password: String): (sessionID: String, user: User) or (error: String)
  requires username and password match an existing AuthenticatedUser
  effects generates a new sessionID for the AuthenticatedUser.

logout (sessionID: String): Empty or (error: String)
  requires sessionID is valid
  effects clears the sessionID for the associated AuthenticatedUser.

changePassword (user: User, oldPassword: String, newPassword: String): Empty or (error: String)
  requires user exists, oldPassword matches, newPassword meets complexity requirements
  effects updates the passwordHash for the specified User.

connectCanvas (user: User, canvasOAuthToken: String): Empty or (error: String)
  requires user exists and canvasOAuthToken is valid
  effects stores the Canvas OAuth token for the user, enabling Canvas data fetching.
```

***

#### CourseManagement

```concept
concept CourseManagement [User]
purpose organize and categorize academic deadlines by associating them with specific courses.
principle each user can define courses, assign unique identifiers, and manage course-specific details including an optional link to an external Canvas course.

state
a set of Courses with // 'Courses' here refers to the collection of Course entities
  a creator User
  a courseCode String
  a title String
  an optional canvasId String

actions
createCourse (creator: User, courseCode: String, title: String): (course: Course) or (error: String)
  requires courseCode is unique for the creator
  effects creates a new course with the given details, linked to the creator.

updateCourse (course: Course, newCourseCode: String, newTitle: String): Empty or (error: String)
  requires course exists and newCourseCode is unique for the creator (if changed)
  effects updates the courseCode and title of an existing course.

setCanvasId (course: Course, canvasId: String): Empty or (error: String)
  requires course exists and canvasId is unique across all courses
  effects sets or updates the external Canvas ID for the specified course.

deleteCourse (course: Course): Empty or (error: String)
  requires course exists and has no associated deadlines
  effects removes the specified course.
```

***

#### DeadlineManagement

```concept
concept DeadlineManagement [User, Course]
purpose store and manage academic deadlines, tracking their status and association with courses.
principle each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.

state
a set of Deadlines with // 'Deadlines' here refers to the collection of Deadline entities
  a course Course
  a title String
  a due DateTime
  a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
  a addedBy User
  an optional status of NOT_STARTED or IN_PROGRESS or DONE

actions
createDeadline (course: Course, title: String, due: DateTime, source: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED, addedBy: User): (deadline: Deadline) or (error: String)
  requires course exists
  effects creates a new deadline with the given details.

updateDeadline (deadline: Deadline, newTitle: String, newDue: DateTime, newSource: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED): Empty or (error: String)
  requires deadline exists
  effects updates the title, due date, and source of an existing deadline.

setStatus (deadline: Deadline, status: NOT_STARTED or IN_PROGRESS or DONE): Empty or (error: String)
  requires deadline exists
  effects updates the completion status of a deadline.

deleteDeadline (deadline: Deadline): Empty or (error: String)
  requires deadline exists
  effects removes the specified deadline.
```

***

#### DocumentManagement

```concept
concept DocumentManagement [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with // 'UploadedDocuments' here refers to the collection of UploadedDocument entities
  a course Course
  a uploader User
  a fileName String
  a fileType String // e.g., "application/pdf", "image/png", "text/plain"
  a uploadTime DateTime
  a fileContent String // For storing content directly (e.g., base64 for images, raw text for PDFs)

actions
uploadDocument (course: Course, fileName: String, fileType: String, fileContent: String, uploader: User): (document: UploadedDocument, content: String) or (error: String)
  requires course exists
  effects stores the document content and metadata, associating it with the course and uploader. Returns document ID and content for further processing.

updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
  requires document exists
  effects updates the fileName and fileType of an existing document.

getDocumentContent (document: UploadedDocument): (content: String) or (error: String)
  requires document exists
  effects retrieves the content of the specified document.

deleteDocument (document: UploadedDocument): Empty or (error: String)
  requires document exists
  effects removes the specified document.
```

***

#### SuggestionManagement

```concept
concept SuggestionManagement [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestions with // 'ParsedDeadlineSuggestions' here refers to the collection of ParsedDeadlineSuggestion entities
  a user User // The user who initiated the parsing
  an optional document Document // ID of the UploadedDocument if applicable
  an optional canvasMetadata String // Raw JSON data from Canvas
  an optional websiteUrl String
  a title String
  a due DateTime
  a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
  an optional confirmed Boolean = false
  an optional confidence Number (0.0–1.0)
  an optional extractionMethod of CANVAS_JSON or LLM
  an optional provenance String // e.g., LLM model version, prompt used, file name
  an optional warnings set of String // e.g., "date ambiguous", "low confidence"

a set of ExtractionConfigs with // 'ExtractionConfigs' here refers to the collection of ExtractionConfig entities
  a name String
  a modelVersion String
  a basePromptTemplate String
  a maxTokens Number
  a temperature Number
  a timezone String
  an optional timeout Number

actions
createExtractionConfig (name: String, modelVersion: String, basePromptTemplate: String, maxTokens: Number, temperature: Number, timezone: String, optionalTimeout: Number): (config: ExtractionConfig) or (error: String)
  requires name is unique
  effects creates a new extraction configuration for LLM processing.

parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists and canvasData is valid JSON
  effects parses assignment JSON data, creates suggestions linked to `user`.
           sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

llmExtractFromDocument(user: User, documentId: Document, documentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, documentId exists, documentContent is text or image suitable for LLM
  effects uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

llmExtractFromMultipleDocuments(user: User, documents: List<{documentId: Document, documentContent: String}>, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, all documents contain extractable content
  effects sends ALL document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.

llmExtractFromWebsite(user: User, url: String, websiteContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, url is reachable, websiteContent is non-empty
  effects uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `provenance`, `confidence`.

refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists, feedback is non-empty, config exists
  effects re-prompts LLM using user feedback to refine fields of the suggestion.
           updates title, due, warnings, or confidence.

editSuggestion(suggestion: ParsedDeadlineSuggestion, newTitle: String, newDue: DateTime): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists, newTitle is non-empty, newDue is valid
  effects updates suggestion title and due date.
           sets `warnings` to indicate manual editing.

updateSuggestionTitle(suggestion: ParsedDeadlineSuggestion, newTitle: String): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists and newTitle is non-empty
  effects updates suggestion title.
           sets `warnings` to indicate manual editing.

updateSuggestionDate(suggestion: ParsedDeadlineSuggestion, newDue: DateTime): (suggestion: ParsedDeadlineSuggestion, updatedDue: DateTime) or (error: String)
  requires suggestion exists and newDue is valid
  effects updates suggestion due date.
           sets `warnings` to indicate manual editing.

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
```

***

### Essential Synchronizations

```
sync parse_upload
when DocumentManagement.uploadDocument (document: d, content: c, course: crs, fileName: fn, fileType: ft, uploader: u)
where ft is "application/pdf" or "image/png" or "text/plain" // simplified check
then SuggestionManagement.llmExtractFromDocument (user: u, documentId: d, documentContent: c, config: (get default ExtractionConfig named "default-llm-config")) // Assuming a mechanism to get a default config by name

sync parse_canvas
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token) // This sync would need to trigger a periodic fetch or an explicit user action
then SuggestionManagement.parseFromCanvas (user: u, canvasData: (fetched data), config: (get default ExtractionConfig named "default-canvas-config"))

sync confirm_suggestion
when SuggestionManagement.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then DeadlineManagement.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

sync status_update
when Request.setStatus (deadline: dl, status: st) // Assuming 'Request' is a pseudo-concept for user requests
then DeadlineManagement.setStatus (deadline: dl, status: st)
```

***

### A Brief Note

The six concepts work together to support DueStack’s core features while maintaining strong separation of concerns and modularity.

* **UserIdentity** manages fundamental user identities (email, name) and is purely about identity management. All actions (e.g., uploading documents, creating deadlines, updating status) are scoped by a `User` ID which originates from this concept.
* **UserAuthentication** handles secure registration, login, and managing user credentials, including Canvas connection tokens, for existing `User` IDs from `UserIdentity`.
* **CourseManagement** serves as containers for organizing deadlines and documents. Each course is tied to specific content and metadata, and allows both imports and manual additions.
* **DeadlineManagement** is the primary planning unit in the app. Deadlines can come from Canvas imports, manual inputs, or confirmed document/image parsing. Status values help students track progress.
* **DocumentManagement** securely stores and manages external syllabus files, GitHub tables, screenshots, and ties uploads to users and courses.
* **SuggestionManagement** serves as the result of OCR or parsing logic and must be confirmed by users before becoming official Deadlines. Canvas data also routes through this system to preserve the same confirmation pattern.

Generic parameters are resolved as:

* `User` always comes from the `UserIdentity` concept.
* `Course` in all references maps to `CourseManagement`.
* `Document` is an object from `DocumentManagement`.
* `SuggestionManagement.confirm` emits data for `DeadlineManagement.createDeadline` but doesn’t create the Deadline itself.
