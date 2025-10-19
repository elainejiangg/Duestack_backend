---
timestamp: 'Sat Oct 18 2025 22:03:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_220328.fbadde05.md]]'
content_id: 70c74b94981d184795f69c3e4847f0aecea0ecc48b5a0f9671ff3584f2c7e282
---

# response:

Here's the updated concept design for DueStack, incorporating the feedback, fully supporting the `AI-Augmented-feature-user-story`, and strictly adhering to concept design principles.

***

### **Revised Concept Design for DueStack**

This revision addresses the feedback on modularity, completeness, and precise action definitions, especially for the `ParsedDeadlineSuggestions` concept. It ensures that concepts operate with opaque IDs, pass data explicitly via action arguments, and rely on external synchronizations for inter-concept coordination, fulfilling the user story while maintaining strict independence.

***

### **1) Concept: Users**

```concept
concept Users
purpose provide unique identities for individuals interacting with the system.
principle new users can be registered, their core information stored, and their existence tracked.

state
a set of Users with
  a email String
  a name String

actions
createUser (email: String, name: String): (user: User) or (error: String)
  requires email is unique
  effects a new User is created with the given email and name.
```

**Rationale:** This concept remains focused solely on managing fundamental user identities. `User` acts as an opaque ID for all other concepts.

***

### **2) Concept: UserAuthentication** `[User]`

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

**Rationale:** This concept exclusively manages authentication concerns for existing `User` IDs. It's crucial for `connectCanvas` for the user story.

***

### **3) Concept: Courses** `[User]`

```concept
concept Courses [User]
purpose organize and categorize academic deadlines by associating them with specific courses.
principle each user can define courses, assign unique identifiers, and manage course-specific details including an optional link to an external Canvas course.

state
a set of Courses with
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

**Rationale:** Manages courses, which act as containers for deadlines and documents. `setCanvasId` supports linking to external platforms.

***

### **4) Concept: Deadlines** `[User, Course]`

```concept
concept Deadlines [User, Course]
purpose store and manage academic deadlines, tracking their status and association with courses.
principle each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.

state
a set of Deadlines with
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

**Rationale:** The central concept for managing deadlines. `LLM_PARSED` source supports integration with the AI features. Includes full CRUD-like functionality for deadlines.

***

### **5) Concept: UploadedDocuments** `[User, Course]`

```concept
concept UploadedDocuments [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with
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

**Rationale:** Manages the uploaded files. Crucially, `uploadDocument` returns `fileContent` and `getDocumentContent` allows retrieval, enabling `ParsedDeadlineSuggestions` to operate on the actual content *passed as an argument* rather than directly accessing `UploadedDocuments`' internal state.

***

### **6) Concept: ParsedDeadlineSuggestions** `[User, Document, Course]`

```concept
concept ParsedDeadlineSuggestions [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestion with
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

a set of ExtractionConfigs with
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

updateSuggestionDate(suggestion: ParsedDeadlineSuggestion, newDue: DateTime): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists and newDue is valid
  effects updates suggestion due date.
           sets `warnings` to indicate manual editing.

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
```

**Rationale:**

* **User Story Support:**
  * `llmExtractFromMultipleDocuments` (Step 1, 2) is specifically designed to handle multiple documents for cross-referencing.
  * `updateSuggestionDate` (Step 2.5) explicitly addresses the user's need to manually correct *only* the date. `updateSuggestionTitle` is added for symmetry.
  * `llmExtractFromWebsite` (Step 3) handles website content.
  * `refineWithFeedback` (Step 4) enables AI-driven refinement based on user feedback.
  * `confirm` (Step 5) finalizes the process, providing data for `Deadlines`.
* **Modularity & Independence:** All extraction actions (`parseFromCanvas`, `llmExtractFromDocument`, `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite`) now take the *content* (e.g., `canvasData`, `documentContent`, `websiteContent`) as direct arguments, rather than attempting to fetch it themselves or access other concepts' states. This ensures `ParsedDeadlineSuggestions` remains independent.
* **User Association:** The `user User` field in `ParsedDeadlineSuggestion` state clearly links each suggestion to the user who initiated its creation.
* **Generic Parameters:** Explicitly uses `[User, Document, Course]` to signal dependence on these opaque IDs managed by other concepts.
* **Completeness:** Comprehensive set of actions for creating extraction configs, parsing from various sources, refining, editing, and confirming suggestions. All actions include error returns for robustness.

***

### **Revised Essential Synchronizations**

```
// Sync to trigger single document parsing after an upload
sync initiate_document_parsing
when UploadedDocuments.uploadDocument (course: c, fileName: fn, fileType: ft, fileContent: fc, uploader: u) : (document: docId, content: fc)
then ParsedDeadlineSuggestions.llmExtractFromDocument (user: u, documentId: docId, documentContent: fc, config: 'defaultExtractionConfigId') // 'defaultExtractionConfigId' would be an ID for a predefined ExtractionConfig

// Sync to trigger multiple document parsing after a user request (assuming a Request pseudo-concept)
// This sync would first fetch the content of multiple documents then pass them.
// Example: User selects multiple documents in UI, triggers a 'Request.parseSelectedDocuments' action.
sync initiate_multi_document_parsing
when Request.parseSelectedDocuments (user: u, documentIds: List<docId>)
where // For each docId in documentIds, get its content
      // (This 'where' clause is simplified; actual implementation might involve a temporary state or a complex join)
      // For demonstration, let's assume a helper that provides the list of {documentId, documentContent}
      in UploadedDocuments: documents_with_content (documentIds: docIds_list) is documents_content_list
then ParsedDeadlineSuggestions.llmExtractFromMultipleDocuments (user: u, documents: documents_content_list, config: 'defaultExtractionConfigId')

// Sync to trigger website parsing after a user request (assuming a Request pseudo-concept)
sync initiate_website_parsing
when Request.parseWebsite (user: u, url: w_url)
where // External API call to fetch website content, triggered by the sync
      // (This 'where' clause is simplified; actual fetch logic would reside in the synchronization layer or an external service)
      fetched_content(url: w_url) is w_content
then ParsedDeadlineSuggestions.llmExtractFromWebsite (user: u, url: w_url, websiteContent: w_content, config: 'defaultExtractionConfigId')

// Sync to confirm a suggestion into a real deadline
sync confirm_suggestion
when ParsedDeadlineSuggestions.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then Deadlines.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

// Sync for status updates
sync status_update
when Request.setStatus (deadline: dl, status: st)
then Deadlines.setStatus (deadline: dl, status: st)
```

**Rationale for Sync Updates:**

* The synchronizations now explicitly demonstrate how `fileContent` and `websiteContent` would be *fetched or provided* by the orchestrating layer (which includes syncs and potentially a `Request` pseudo-concept) before being passed as arguments to `ParsedDeadlineSuggestions` actions. This strictly maintains concept independence.
* `'defaultExtractionConfigId'` is used as a placeholder for an `ExtractionConfig` ID that would be created and managed by `ParsedDeadlineSuggestions` itself, indicating that the LLM processing parameters are internal to that concept.
* The `initiate_multi_document_parsing` and `initiate_website_parsing` syncs illustrate the flow for the more complex user story elements, showing how aggregate data or externally fetched data is prepared and passed. This highlights the crucial role of syncs in orchestrating interactions between independent concepts.

***

### **A Brief Note**

This revised design for DueStack meticulously separates concerns across six concepts: `Users`, `UserAuthentication`, `Courses`, `Deadlines`, `UploadedDocuments`, and `ParsedDeadlineSuggestions`. Each concept manages its specific slice of functionality, leveraging opaque IDs (e.g., `User`, `Course`, `Document`) to reference entities managed by other concepts without forming direct dependencies. This modularity ensures high reusability and maintainability.

The `ParsedDeadlineSuggestions` concept, central to the AI-augmented features, has been carefully designed to operate on data provided as explicit action arguments, reinforcing its independence from `UploadedDocuments` or external web services. Synchronizations serve as the "glue," observing actions and state changes across concepts to orchestrate complex workflows, such as parsing multiple documents or refining suggestions based on user feedback, ultimately leading to confirmed `Deadlines`. This structure directly supports the detailed user journey by clearly mapping each step to specific concept actions and their interdependencies mediated by syncs.
