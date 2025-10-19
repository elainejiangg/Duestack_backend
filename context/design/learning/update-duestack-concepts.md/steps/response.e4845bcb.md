---
timestamp: 'Sat Oct 18 2025 20:20:10 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_202010.e8b2e05e.md]]'
content_id: e4845bcb772fba67fac35b4f2882fde2d6e96c19864e90ffea3e677b348776d0
---

# response:

Here's a revised concept design for DueStack, addressing the feedback and integrating the AI-Augmented-Feature-Concept while strictly adhering to the concept design principles of modularity, independence, completeness, and proper use of generic parameters.

***

### **Revised Concept Design for DueStack**

This revised concept design addresses the feedback received, particularly focusing on:

1. **Separating authentication** into its own concept.
2. Ensuring **completeness of functionality** by adding update/delete actions.
3. Strictly adhering to **modularity and independence**, especially for the `ParsedDeadlineSuggestions` concept, by using generic parameters and passing necessary data as action arguments rather than allowing cross-concept state access.
4. Defining **generic types** explicitly.
5. Integrating the **AI-Augmented-Feature-Concept** for `ParsedDeadlineSuggestions` with modularity in mind.

***

### **Concept: Users**

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

**Rationale for changes:**

* **Separation of Concerns:** The original `Users` concept hinted at authentication but didn't implement it. As per the rubric, authentication is a separate concern. This `Users` concept now strictly focuses on providing unique `User` identities, which are then referenced by other concepts (e.g., `UserAuthentication`, `Courses`, `Deadlines`).
* **Generic Types:** No generic parameters are needed here, as `User` is the base entity type being defined by this concept.
* **Error Handling:** Added `(error: String)` to action return for consistency.

***

### **Concept: UserAuthentication** `[User]`

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
register (user: User, username: String, password: String): (error: String) or Empty
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

**Rationale for changes:**

* **New Concept for Separation of Concerns:** This concept was introduced to specifically handle user authentication, aligning with the rubric's guidance that authentication should be separated from user profile/identity management.
* **Completeness:** Includes `register`, `login`, `logout`, `changePassword`, and `connectCanvas` actions for a full authentication and integration lifecycle.
* **Generic Parameters:** Takes `User` as a generic parameter, meaning it operates on `User` IDs managed by the `Users` concept. It *associates* authentication details with these `User` IDs.
* **State:** Uses `passwordHash` to imply secure storage. Added `canvasOAuthToken` to enable Canvas integration, managed directly within this concept.

***

### **Concept: Courses** `[User]`

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

**Rationale for changes:**

* **Completeness:** Added `updateCourse` and `deleteCourse` actions.
* **CanvasId Access:** Added `setCanvasId` action to make the `canvasId` mutable and accessible.
* **Generic Parameters:** Explicitly defined `User` as a generic parameter, indicating that `Courses` are associated with a `User` (the `creator`).
* **Uniqueness:** Added `creator` to state to ensure `courseCode` uniqueness is scoped per user.

***

### **Concept: Deadlines** `[User, Course]`

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

**Rationale for changes:**

* **Completeness:** Added `updateDeadline` and `deleteDeadline` actions.
* **Source:** Added `LLM_PARSED` to the `source` enumeration to reflect potential sources from the `ParsedDeadlineSuggestions` concept.
* **Generic Parameters:** Explicitly defined `User` and `Course` as generic parameters.

***

### **Concept: UploadedDocuments** `[User, Course]`

```concept
concept UploadedDocuments [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with
  a course Course
  a uploader User
  a fileName String
  a fileType String
  a uploadTime DateTime
  a fileContent String // For storing content directly within the concept, or a reference to external storage

actions
uploadDocument (course: Course, fileName: String, fileType: String, fileContent: String, uploader: User): (document: UploadedDocument, content: String) or (error: String)
  requires course exists
  effects stores the document content and metadata, associating it with the course and uploader. Returns document ID and content.

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

**Rationale for changes:**

* **Completeness:** Added `updateDocumentMetadata`, `getDocumentContent`, and `deleteDocument` actions.
* **Modularity:** Added `fileContent` to the state. The `uploadDocument` action now explicitly returns the `fileContent` along with the `document` ID. This allows `ParsedDeadlineSuggestions` to receive the content via a synchronization, rather than directly accessing `UploadedDocuments` internal state.
* **Generic Parameters:** Explicitly defined `User` and `Course` as generic parameters.

***

### **Concept: ParsedDeadlineSuggestions** `[User, Document, Course]`

```concept
concept ParsedDeadlineSuggestions [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestion with
  a user User
  an optional document Document // ID of the UploadedDocument if applicable
  an optional canvasMetadata String // Raw JSON data from Canvas
  an optional websiteUrl String
  a title String
  a due DateTime
  a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
  an optional confirmed Boolean
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

parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): List<ParsedDeadlineSuggestion> or (error: String)
  requires config exists and canvasData is valid JSON
  effects parses assignment JSON data, creates suggestions linked to `user`.
           sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

llmExtractFromDocument(user: User, documentId: Document, documentContent: String, config: ExtractionConfig): List<ParsedDeadlineSuggestion> or (error: String)
  requires config exists, documentId exists, documentContent is text or image suitable for LLM
  effects uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

llmExtractFromMultipleDocuments(user: User, documents: List<{documentId: Document, documentContent: String}>, config: ExtractionConfig): List<ParsedDeadlineSuggestion> or (error: String)
  requires config exists, all documents contain extractable content
  effects sends ALL document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.

llmExtractFromWebsite(user: User, url: String, websiteContent: String, config: ExtractionConfig): List<ParsedDeadlineSuggestion> or (error: String)
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

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
```

**Rationale for changes:**

* **Generic Parameters:** Explicitly defined `User`, `Document` (for `UploadedDocument` IDs), and `Course` (for `confirm` action data) as generic parameters.
* **Modularity & Independence:**
  * Actions like `parseFromCanvas`, `llmExtractFromDocument`, `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite` now explicitly take `canvasData`, `documentContent`, `websiteContent` as *input arguments*. This respects independence, as `ParsedDeadlineSuggestions` does not directly query the state of `UploadedDocuments` or an external Canvas API. The caller (via a sync) is responsible for fetching and passing this data.
  * The `Document` generic parameter is used to link a `ParsedDeadlineSuggestion` back to its original `UploadedDocument` (by ID), but does not imply direct state access.
  * `confirm` action now *returns* the necessary data for `Deadlines.createDeadline`, adhering to the rule that concepts don't call other concepts. Syncs will mediate this.
* **User Association:** Added `user User` to `ParsedDeadlineSuggestion` state to correctly associate suggestions with the user who generated/owns them.
* **ExtractionConfig:** Integrated the `ExtractionConfig` directly into this concept's state and added an action `createExtractionConfig` to manage it. Actions now take `config: ExtractionConfig` (meaning an ID to one of the configs in this concept's state).
* **Removed `validateSuggestions(source: ...)`:** This action, as originally described, violated modularity by implying access to external `source` states or complex external validation. If validation is needed, it would be a system action on individual `ParsedDeadlineSuggestion` objects (e.g., populating `warnings` based on internal heuristics) or a query. For now, it's removed to maintain strict modularity. The `refineWithFeedback` action can handle some "validation" via LLM interaction.
* **Source `LLM_PARSED`:** `confirm` action's return type now includes `LLM_PARSED` as a possible source for the `Deadlines` concept, reflecting the AI augmentation.

***

### **Revised Essential Synchronizations**

```
sync initiate_document_parsing
when UploadedDocuments.uploadDocument (course: c, fileName: fn, fileType: ft, fileContent: fc, uploader: u) : (document: docId, content: fc)
then ParsedDeadlineSuggestions.llmExtractFromDocument (user: u, documentId: docId, documentContent: fc, config: defaultExtractionConfig)
// 'defaultExtractionConfig' would be an ID for a predefined ExtractionConfig managed by ParsedDeadlineSuggestions.

sync initiate_canvas_parsing
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token) : (success: true)
// This sync would then fetch actual Canvas data using the token and user.
// For modularity, let's assume 'fetchCanvasData' is a hypothetical external helper or part of a client-side 'Request'.
// So, if UserAuthentication.connectCanvas simply *enables* a connection, another action (or a client-side request)
// would trigger the data fetch and then pass it to ParsedDeadlineSuggestions.

// A more direct sync if the Canvas data is directly accessible after connection:
sync trigger_canvas_parsing_after_connection
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token) : (success: true)
where in UserAuthentication: user of AuthenticatedUsers is u
// This 'then' needs to fetch the data. If the concept cannot directly fetch, then this must be
// triggered by a client Request action with the actual canvasData.
// Reverting to the spirit of the original prompt's 'parse_canvas' logic:
// Assuming 'Request.fetchCanvasAssignments' is an action that fetches and returns data.
when Request.fetchCanvasAssignments (user: u, token: t) : (canvasAPIData: data)
then ParsedDeadlineSuggestions.parseFromCanvas (user: u, canvasData: data, config: defaultExtractionConfig)


sync confirm_suggestion
when ParsedDeadlineSuggestions.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then Deadlines.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

sync status_update
when Request.setStatus (deadline: dl, status: st)
then Deadlines.setStatus (deadline: dl, status: st)
```

**Rationale for changes:**

* **`initiate_document_parsing`:**
  * The `UploadedDocuments.uploadDocument` action now returns the `document` ID and the `fileContent`.
  * The sync passes these directly as arguments to `ParsedDeadlineSuggestions.llmExtractFromDocument`, fully respecting modularity.
  * `defaultExtractionConfig` is assumed to be an ID referring to an `ExtractionConfig` created and managed by `ParsedDeadlineSuggestions`.
* **`initiate_canvas_parsing`:**
  * Refined to assume `Request.fetchCanvasAssignments` (a pseudo-concept action representing a user or system request with fetched data) provides the actual `canvasAPIData`. This ensures `ParsedDeadlineSuggestions` itself doesn't make external API calls.
* **`confirm_suggestion`:** Remains largely the same, but explicitly shows the returned values from `ParsedDeadlineSuggestions.confirm` being used as arguments for `Deadlines.createDeadline`.
* **`status_update`:** Remains unchanged and valid.

***

### **A Brief Note**

The revised set of concepts (`Users`, `UserAuthentication`, `Courses`, `Deadlines`, `UploadedDocuments`, `ParsedDeadlineSuggestions`) now explicitly defines generic parameters and strictly adheres to the principle of modularity and independence.

* **Users** defines the core identity.
* **UserAuthentication** handles credentials, sessions, and external integrations (like Canvas OAuth), operating on `User` IDs.
* **Courses** organizes academic contexts, linked to a `User` creator.
* **Deadlines** are the central entities being managed, associated with `Course` and `User`.
* **UploadedDocuments** manages file storage, explicitly returning content when requested.
* **ParsedDeadlineSuggestions** intelligently extracts deadline candidates from various sources, explicitly receiving data as arguments, and requiring user confirmation before integrating with `Deadlines`.

Generic parameters like `User`, `Course`, and `Document` (for `UploadedDocument`) serve as opaque identifiers, ensuring concepts remain unaware of the internal structure or behavior of the entities they reference. Composition is exclusively through explicit action arguments and synchronizations, preventing direct inter-concept dependencies.
