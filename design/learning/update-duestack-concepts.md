[@concept-design-overview](../background/concept-design-overview.md)

[@concept-rubric](../background/detailed/concept-rubric.md)

[@concept-state](../background/detailed/concept-state.md)

[@concept-design-brief](../background/concept-design-brief.md)

[@concept-design-overview](../background/concept-design-overview.md)

[@implementing-concepts](../background/implementing-concepts.md)

[@testing-concepts](../background/testing-concepts.md)

[@implementation](../concepts/examples/LikertSurvey/implementation.md)

[@LikertSurvey](../concepts/examples/LikertSurvey/LikertSurvey.md)

[@testing](../concepts/examples/LikertSurvey/testing.md)

[@conceptsExample](../concepts/examples/GroceryShoppingExample/conceptsExample.md)

[@DueStack-old-concepts](../concepts/DueStack-brainstorming/DueStack-old-concepts.md)

[@DueStack-new-concepts](../concepts/DueStack-brainstorming/DueStack-new-concepts.md)

[@DueStack-initial-feedback](../concepts/DueStack-brainstorming/DueStack-initial-feedback.md)

[@AI-Augmented-Feature-Concept](../concepts/DueStack-brainstorming/AI-Augmented-Feature-Concept.md)

[@Assignment-4a-description](implement-duestack-concepts/Assignment-4a-description.md)

[@AI-Augmented-feature-user-story](../concepts/DueStack-brainstorming/AI-Augmented-feature-user-story.md)
# questions: How do you recommend that I fix my  [@DueStack-concepts](../concepts/DueStack-brainstorming/DueStack-old-concepts.md) in reaction to feedback [@DueStack-initial-feedback](../concepts/DueStack-brainstorming/DueStack-initial-feedback.md). I also want the [@AI-Augmented-Feature-Concept](../concepts/DueStack-brainstorming/AI-Augmented-Feature-Concept.md) as part of my final concept design. Please make sure to adhere strictly to any guidance/rubric regarding concepts.
# response:

Here's a revised concept design for DueStack, addressing the feedback and integrating the AI-Augmented-Feature-Concept while strictly adhering to the concept design principles of modularity, independence, completeness, and proper use of generic parameters.

---

### **Revised Concept Design for DueStack**

This revised concept design addresses the feedback received, particularly focusing on:
1.  **Separating authentication** into its own concept.
2.  Ensuring **completeness of functionality** by adding update/delete actions.
3.  Strictly adhering to **modularity and independence**, especially for the `ParsedDeadlineSuggestions` concept, by using generic parameters and passing necessary data as action arguments rather than allowing cross-concept state access.
4.  Defining **generic types** explicitly.
5.  Integrating the **AI-Augmented-Feature-Concept** for `ParsedDeadlineSuggestions` with modularity in mind.

---

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
*   **Separation of Concerns:** The original `Users` concept hinted at authentication but didn't implement it. As per the rubric, authentication is a separate concern. This `Users` concept now strictly focuses on providing unique `User` identities, which are then referenced by other concepts (e.g., `UserAuthentication`, `Courses`, `Deadlines`).
*   **Generic Types:** No generic parameters are needed here, as `User` is the base entity type being defined by this concept.
*   **Error Handling:** Added `(error: String)` to action return for consistency.

---

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
*   **New Concept for Separation of Concerns:** This concept was introduced to specifically handle user authentication, aligning with the rubric's guidance that authentication should be separated from user profile/identity management.
*   **Completeness:** Includes `register`, `login`, `logout`, `changePassword`, and `connectCanvas` actions for a full authentication and integration lifecycle.
*   **Generic Parameters:** Takes `User` as a generic parameter, meaning it operates on `User` IDs managed by the `Users` concept. It *associates* authentication details with these `User` IDs.
*   **State:** Uses `passwordHash` to imply secure storage. Added `canvasOAuthToken` to enable Canvas integration, managed directly within this concept.

---

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
*   **Completeness:** Added `updateCourse` and `deleteCourse` actions.
*   **CanvasId Access:** Added `setCanvasId` action to make the `canvasId` mutable and accessible.
*   **Generic Parameters:** Explicitly defined `User` as a generic parameter, indicating that `Courses` are associated with a `User` (the `creator`).
*   **Uniqueness:** Added `creator` to state to ensure `courseCode` uniqueness is scoped per user.

---

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
*   **Completeness:** Added `updateDeadline` and `deleteDeadline` actions.
*   **Source:** Added `LLM_PARSED` to the `source` enumeration to reflect potential sources from the `ParsedDeadlineSuggestions` concept.
*   **Generic Parameters:** Explicitly defined `User` and `Course` as generic parameters.

---

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
*   **Completeness:** Added `updateDocumentMetadata`, `getDocumentContent`, and `deleteDocument` actions.
*   **Modularity:** Added `fileContent` to the state. The `uploadDocument` action now explicitly returns the `fileContent` along with the `document` ID. This allows `ParsedDeadlineSuggestions` to receive the content via a synchronization, rather than directly accessing `UploadedDocuments` internal state.
*   **Generic Parameters:** Explicitly defined `User` and `Course` as generic parameters.

---

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
*   **Generic Parameters:** Explicitly defined `User`, `Document` (for `UploadedDocument` IDs), and `Course` (for `confirm` action data) as generic parameters.
*   **Modularity & Independence:**
    *   Actions like `parseFromCanvas`, `llmExtractFromDocument`, `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite` now explicitly take `canvasData`, `documentContent`, `websiteContent` as *input arguments*. This respects independence, as `ParsedDeadlineSuggestions` does not directly query the state of `UploadedDocuments` or an external Canvas API. The caller (via a sync) is responsible for fetching and passing this data.
    *   The `Document` generic parameter is used to link a `ParsedDeadlineSuggestion` back to its original `UploadedDocument` (by ID), but does not imply direct state access.
    *   `confirm` action now *returns* the necessary data for `Deadlines.createDeadline`, adhering to the rule that concepts don't call other concepts. Syncs will mediate this.
*   **User Association:** Added `user User` to `ParsedDeadlineSuggestion` state to correctly associate suggestions with the user who generated/owns them.
*   **ExtractionConfig:** Integrated the `ExtractionConfig` directly into this concept's state and added an action `createExtractionConfig` to manage it. Actions now take `config: ExtractionConfig` (meaning an ID to one of the configs in this concept's state).
*   **Removed `validateSuggestions(source: ...)`:** This action, as originally described, violated modularity by implying access to external `source` states or complex external validation. If validation is needed, it would be a system action on individual `ParsedDeadlineSuggestion` objects (e.g., populating `warnings` based on internal heuristics) or a query. For now, it's removed to maintain strict modularity. The `refineWithFeedback` action can handle some "validation" via LLM interaction.
*   **Source `LLM_PARSED`:** `confirm` action's return type now includes `LLM_PARSED` as a possible source for the `Deadlines` concept, reflecting the AI augmentation.

---

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
*   **`initiate_document_parsing`:**
    *   The `UploadedDocuments.uploadDocument` action now returns the `document` ID and the `fileContent`.
    *   The sync passes these directly as arguments to `ParsedDeadlineSuggestions.llmExtractFromDocument`, fully respecting modularity.
    *   `defaultExtractionConfig` is assumed to be an ID referring to an `ExtractionConfig` created and managed by `ParsedDeadlineSuggestions`.
*   **`initiate_canvas_parsing`:**
    *   Refined to assume `Request.fetchCanvasAssignments` (a pseudo-concept action representing a user or system request with fetched data) provides the actual `canvasAPIData`. This ensures `ParsedDeadlineSuggestions` itself doesn't make external API calls.
*   **`confirm_suggestion`:** Remains largely the same, but explicitly shows the returned values from `ParsedDeadlineSuggestions.confirm` being used as arguments for `Deadlines.createDeadline`.
*   **`status_update`:** Remains unchanged and valid.

---

### **A Brief Note**

The revised set of concepts (`Users`, `UserAuthentication`, `Courses`, `Deadlines`, `UploadedDocuments`, `ParsedDeadlineSuggestions`) now explicitly defines generic parameters and strictly adheres to the principle of modularity and independence.
*   **Users** defines the core identity.
*   **UserAuthentication** handles credentials, sessions, and external integrations (like Canvas OAuth), operating on `User` IDs.
*   **Courses** organizes academic contexts, linked to a `User` creator.
*   **Deadlines** are the central entities being managed, associated with `Course` and `User`.
*   **UploadedDocuments** manages file storage, explicitly returning content when requested.
*   **ParsedDeadlineSuggestions** intelligently extracts deadline candidates from various sources, explicitly receiving data as arguments, and requiring user confirmation before integrating with `Deadlines`.

Generic parameters like `User`, `Course`, and `Document` (for `UploadedDocument`) serve as opaque identifiers, ensuring concepts remain unaware of the internal structure or behavior of the entities they reference. Composition is exclusively through explicit action arguments and synchronizations, preventing direct inter-concept dependencies.


# question: what does the bracket notation mean? UserAuthentication [User]
# response:

In the Concept Design framework, the bracket notation `[User]` in `UserAuthentication [User]` indicates that `User` is a **type parameter** (or generic parameter) for the `UserAuthentication` concept.

Here's what that means:

1.  **Generic Type:** The `UserAuthentication` concept itself does *not* define what a `User` is or what properties a `User` has. Instead, it expects to receive `User` identifiers (IDs) from an **external source or another concept**.
2.  **Opaque Identifier:** Inside `UserAuthentication`, `User` is treated as an opaque identifier. The concept can compare two `User` IDs to see if they refer to the same entity, but it cannot assume anything else about the `User` (e.g., its name, email, profile picture, etc.). This enforces **polymorphism** and **independence**.
3.  **Role in `UserAuthentication`:** In your specific design, the `UserAuthentication` concept uses these external `User` IDs to *associate* authentication-specific data (like `username`, `passwordHash`, `sessionID`, `canvasOAuthToken`) with them. It handles the *behavior* of authentication *for* these `User` entities.
4.  **Relationship to the `Users` Concept:** The `Users` concept you defined (`concept Users`) is responsible for actually *creating* and managing the fundamental `User` entities (their unique IDs, email, and name). So, in a full application, the `Users` concept would be the one producing the `User` IDs that `UserAuthentication` then uses as its generic parameter.

In essence, `UserAuthentication [User]` tells you: "This concept works with a type called `User`, but it doesn't own or define `User`; it simply references `User` entities that are managed elsewhere, treating them as abstract identifiers." This is a cornerstone of the concept independence principle.

# question: ok, but does using User IDs in a concept other than User assume something about the User concept, or is it given that all Concepts 'objects' will have IDs? I'm confused as to how you would use concept A in another concept B without assuming anything about A in B?
# response:

This is a fundamental and excellent question that gets to the very heart of Concept Design's principles of modularity and independence! It's a common point of confusion, so let's clarify it carefully.

You've hit on the core challenge: how do you combine functionality when concepts are supposed to be completely independent?

Here's the breakdown:

1.  **All Concept Entities Have Opaque IDs (Implicit Assumption):**
    Yes, it is a foundational assumption in Concept Design that every "object" or "entity" (like `User`, `Course`, `Survey`, `Deadline`, `Question`, `Document`, `ParsedDeadlineSuggestion`) that a concept manages *has a unique, opaque identifier*. When you declare `a set of Users`, you are implicitly declaring a set of `User` *identifiers*. When you have `a Course` as a field, it stores a `Course` *identifier*.
    These IDs are the "handle" or "reference" to an entity. Concepts don't deal with complex, nested objects being passed around; they deal with these simple, comparable IDs.

2.  **Generic Parameters (`[User]`) Enforce Opacity and Polymorphism:**
    When `UserAuthentication` declares `[User]`, it's saying: "I will interact with entities of a type called `User`. I expect to receive `User` IDs as input to my actions, or store `User` IDs in my state. However, I make *no assumptions* about what a `User` actually *is* or what properties it might have (like `email` or `name`). For me, `User` is just an opaque identifier."

    This is polymorphism: `UserAuthentication` can operate on *any* type that acts as a `User` ID, regardless of its internal structure, because `UserAuthentication` only ever needs to compare `User` IDs or store them. It doesn't need to read `user.email` or `user.name`.

3.  **Concepts Do NOT Directly "Use" Each Other:**
    This is the crucial distinction. Concept A *never* calls an action of Concept B, nor does it directly read or write the internal state of Concept B. If it did, that would create a direct dependency and violate independence.

    Instead, interactions happen through:

    *   **Action Arguments:** If `UserAuthentication` needs to know *which* `User` it's authenticating, that `User`'s ID is passed as an *argument* to an `UserAuthentication` action (e.g., `register (user: User, ...)`).
    *   **Synchronization Rules (Syncs):** This is the "glue" that allows concepts to work together without knowing about each other. Syncs live *outside* the individual concepts. A sync observes events (actions) and state changes in one or more concepts, and based on those observations, it can then trigger actions in other concepts.

Let's illustrate with your `Users` and `UserAuthentication` concepts:

**`Users` Concept:**
*   **Purpose:** To create and manage the fundamental `User` *identities* (their IDs, email, name).
*   **Action:** `createUser(email: String, name: String): (user: User)` returns a `User` ID.
*   **Internal State:** Maps `User` IDs to their `email` and `name`.

**`UserAuthentication` Concept (`[User]`):**
*   **Purpose:** To manage authentication *for existing `User` IDs*.
*   **Action:** `register(user: User, username: String, password: String): Empty`
*   **Internal State:** Maps `User` IDs (which came from `Users`) to their `username`, `passwordHash`, `sessionID`.
*   **Crucial Point:** `UserAuthentication` *doesn't know* how the `User` ID (`user: User`) that was passed to `register` was created. It just accepts it as a valid `User` identifier and stores authentication-related data against it. It does not try to read the `email` or `name` of that `User` ID.

**How They Work Together (via Syncs):**

Imagine a scenario where a new user signs up for your app.

1.  **User `Request`:** The user's front-end (or a `Request` pseudo-concept) initiates a "sign up" action.
2.  **`Users` Creates the Core ID:** A sync might observe this `Request` and trigger:
    ```
    sync CreateCoreUser
    when Request.signUp (email: e, name: n)
    then Users.createUser (email: e, name: n) : (user: u) // u is a new, opaque User ID
    ```
3.  **`UserAuthentication` Registers Credentials for that ID:** Another sync (or the same one, if chaining is allowed and immediate) then takes that newly created `User` ID (`u`) and passes it to `UserAuthentication`:
    ```
    sync RegisterAuthenticationDetails
    when Users.createUser (email: e, name: n) : (user: u)
    then UserAuthentication.register (user: u, username: deriveUsername(e), password: hash(request.password))
    ```

Notice:
*   `Users` doesn't know about `UserAuthentication`.
*   `UserAuthentication` doesn't know about `Users`. It just gets a `User` ID and stores authentication details against it.
*   The `sync` is the external orchestrator that "knows" about both concepts and how to connect their actions and data (specifically, how to pass the `User` ID from `Users` to `UserAuthentication`).

This strict separation, mediated by opaque IDs and external synchronizations, is what gives Concept Design its power for modularity and reuse. Each concept can be designed, implemented, and tested in complete isolation, as long as it adheres to the contract of its generic parameters (i.e., treating them as opaque IDs) and defines clear actions and state changes that can be observed by syncs.

# question: what exactly do you mean by opaque IDs. Can you give an example the breaks modularity and one that fixes it? Explain polymorphism explicitly/
# response:

This is a fantastic follow-up question, as "opaque IDs" and "polymorphism" are truly central to understanding concept independence and modularity. Let's break it down with examples.

---

### What do we mean by "Opaque IDs"?

An **opaque ID** means that when a concept references an entity (like `User`, `Course`, `Document`, etc.) via its ID, that concept **does not, and should not, know or care about the internal structure or properties of the identified entity.**

*   **Opaque:** You can't "see through" it to access its details. It's a black box.
*   **ID:** It's just a unique identifier (like a UUID, a string, or a number).

The only operations a concept can perform on an opaque ID are:
1.  **Storage:** Store the ID in its own state (e.g., `Deadlines` stores a `Course` ID).
2.  **Comparison:** Check if two IDs are the same (e.g., `if (userA === userB)`).
3.  **Passing as an argument:** Pass the ID to an action of another concept (via a sync).
4.  **Returning as a result:** Return the ID from an action.

A concept **must not** attempt to dereference an opaque ID to access properties of the entity it identifies (e.g., you cannot do `user.email` or `course.title` *inside* a concept if `user` or `course` came in as an opaque ID, or if the concept holds them in its state as opaque IDs).

### What do we mean by "Polymorphism" in this context?

In Concept Design, **polymorphism** (specifically parametric polymorphism, or generics) means that a concept with type parameters (like `[User]`) is designed to work correctly with **any** concrete type that is supplied for that parameter, *as long as that concrete type behaves like an opaque ID*.

Because the concept only performs storage and comparison operations on these generic IDs, it doesn't matter what "kind" of `User` it is (e.g., a `User` from a simple username/password system, a `User` from an OAuth system, a `User` that just has a UUID and nothing else). The `UserAuthentication` concept, for example, will function identically, regardless of the specific details of the `User` objects that are being authenticated.

This is why generic parameters are crucial: they signal that the concept is truly decoupled from the specific implementation details of those types.

---

### Example that **Breaks** Modularity

Let's imagine a `Notification` concept that needs to send emails to users.

**Problematic `Notification` Concept (Breaks Modularity):**

```concept
concept Notification [AlertTarget]
purpose send notifications to users about various events

state
a set of NotificationEvents with
  an alertTarget AlertTarget // What the notification is about (e.g., a Deadline)
  a message String
  a recipient User // The user to notify
  a sent Flag = false

actions
sendNotification (alertTarget: AlertTarget, message: String, recipient: User)
  requires recipient.email is valid // <-- PROBLEM HERE
  effects creates a NotificationEvent, sends an email to recipient.email with message.
```

**Why this breaks modularity and uses non-opaque IDs:**

*   **Non-Opaque `User` ID:** The `sendNotification` action's `requires` clause directly accesses `recipient.email`. This means the `Notification` concept is *assuming* that the `User` entity (which `recipient` is an ID for) has an `email` property. This is a direct violation of the opaque ID principle.
*   **Direct Dependency:** The `Notification` concept is now directly dependent on the `User` concept (or `UserProfile` concept) to define and expose an `email` field.
    *   If the `User` concept decides to store `email` differently (e.g., in a separate `ContactInfo` concept), `Notification` breaks.
    *   If `Notification` is reused in an app where `User`s don't have emails (e.g., only SMS numbers), the `Notification` concept is not reusable without modification.
*   **Conflated Concerns:** The `Notification` concept is conflating the concern of "generating and sending notifications" with the concern of "knowing user contact details." The latter belongs to a separate concept, like `ContactChannels` or `UserProfile`.

---

### Example that **Fixes** Modularity

To fix this, we introduce another concept to manage contact information and use synchronizations to mediate the interaction.

**Revised `Notification` Concept (Modular and Opaque IDs):**

```concept
concept Notification [AlertTarget, Recipient]
purpose manage the generation and recording of notification requests.
principle a concept can request a notification for a Recipient, and the notification is recorded.

state
a set of NotificationRequests with
  an alertTarget AlertTarget // What the notification is about (e.g., a Deadline)
  a message String
  a recipient Recipient // The recipient's ID (opaque)
  a requestedAt DateTime
  an optional sent Flag = false // Managed by syncs, not internal action

actions
requestNotification (alertTarget: AlertTarget, message: String, recipient: Recipient) : (notificationRequest: NotificationRequest)
  requires true
  effects creates a new NotificationRequest.
```

**New `ContactChannels` Concept (for user contact details):**

```concept
concept ContactChannels [User]
purpose store and manage contact information for users.
principle users can register various contact methods (email, phone), and these can be retrieved.

state
a set of UserContactInfo with
  a user User
  an optional email String
  an optional phoneNumber String
  // ... other contact methods

actions
setEmail (user: User, email: String): Empty or (error: String)
  requires user exists
  effects sets the email address for the user.

setPhoneNumber (user: User, phoneNumber: String): Empty or (error: String)
  requires user exists
  effects sets the phone number for the user.

// Queries (implicitly or explicitly defined if complex)
// _getEmail (user: User): (email: String)
// _getPhoneNumber (user: User): (phoneNumber: String)
```

**How they interact via `Synchronization` (the "glue"):**

```
sync SendEmailNotification
when Notification.requestNotification (alertTarget: at, message: m, recipient: r) : (notificationRequest: nr)
where // (1) Find the user associated with the Recipient ID (if Recipient is a User ID)
      // Assuming 'Recipient' is the same type as 'User' in this application context.
      in ContactChannels: user of UserContactInfo is r
      in ContactChannels: email of UserContactInfo is e // (2) Get the email for that user

then // (3) An external, non-concept action actually sends the email.
     // This would typically be a system-level function or another concept (e.g., an EmailService concept, but that's a deeper rabbit hole).
     // For simplicity, imagine 'ExternalEmailSender.send(e, m)' is the actual implementation.
     // Then, update the NotificationRequest's status.
     Notification.markSent (notificationRequest: nr) // (4) Mark the request as sent
```
*(Note: A `Notification.markSent` action would need to be added to the `Notification` concept for this sync to work fully)*

**Why this fixes modularity:**

*   **Opaque `Recipient` (User) ID in `Notification`:** The `Notification` concept *only* receives a `Recipient` ID. It doesn't attempt to access `recipient.email`. It is completely unaware of how to send an email or what a `User`'s contact details are.
*   **Independence:** `Notification` is independent of `ContactChannels`. `ContactChannels` is independent of `Notification`. They manage distinct concerns.
*   **Polymorphism in `Notification`:** The `Notification` concept can be reused in any application.
    *   If `Recipient` IDs are `User` IDs, it works.
    *   If `Recipient` IDs are `Team` IDs (and there's a `Team` concept managing team members, and a `ContactChannels` concept for `Team`s), `Notification` still works because it only deals with generic `Recipient` IDs. The `sync` layer would adapt to map `Team` IDs to `ContactChannels` for `Team`s.
*   **Syncs as Orchestrators:** The `sync` acts as the orchestrator. It "knows" about both `Notification` and `ContactChannels` and mediates their interaction. It's the sync's job to:
    1.  Observe a `Notification.requestNotification` action.
    2.  Use the `recipient` ID from that action to look up the email in `ContactChannels` (this is allowed *in the `where` clause of the sync*, not inside the concept).
    3.  Then trigger the actual email sending (an external side effect) and update the `Notification`'s internal `sent` status if applicable.

This approach ensures that each concept remains focused on its single purpose, truly independent, and highly reusable, with opaque IDs and external synchronizations facilitating their collaboration.


# question: Update [@DueStack-new-concepts](../concepts/DueStack-brainstorming/DueStack-new-concepts.md) the concept specs for DueStack to ensure they have necessary actions and states for the example user story[@AI-Augmented-feature-user-story](../concepts/DueStack-brainstorming/AI-Augmented-feature-user-story.md), while still strictly following the concept rubric/guidance.


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

---

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

---

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

---

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

---

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

---

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
*   **User Story Support:**
    *   `llmExtractFromMultipleDocuments` (Step 1, 2) is specifically designed to handle multiple documents for cross-referencing.
    *   `updateSuggestionDate` (Step 2.5) explicitly addresses the user's need to manually correct *only* the date. `updateSuggestionTitle` is added for symmetry.
    *   `llmExtractFromWebsite` (Step 3) handles website content.
    *   `refineWithFeedback` (Step 4) enables AI-driven refinement based on user feedback.
    *   `confirm` (Step 5) finalizes the process, providing data for `Deadlines`.
*   **Modularity & Independence:** All extraction actions (`parseFromCanvas`, `llmExtractFromDocument`, `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite`) now take the *content* (e.g., `canvasData`, `documentContent`, `websiteContent`) as direct arguments, rather than attempting to fetch it themselves or access other concepts' states. This ensures `ParsedDeadlineSuggestions` remains independent.
*   **User Association:** The `user User` field in `ParsedDeadlineSuggestion` state clearly links each suggestion to the user who initiated its creation.
*   **Generic Parameters:** Explicitly uses `[User, Document, Course]` to signal dependence on these opaque IDs managed by other concepts.
*   **Completeness:** Comprehensive set of actions for creating extraction configs, parsing from various sources, refining, editing, and confirming suggestions. All actions include error returns for robustness.

---

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
*   The synchronizations now explicitly demonstrate how `fileContent` and `websiteContent` would be *fetched or provided* by the orchestrating layer (which includes syncs and potentially a `Request` pseudo-concept) before being passed as arguments to `ParsedDeadlineSuggestions` actions. This strictly maintains concept independence.
*   `'defaultExtractionConfigId'` is used as a placeholder for an `ExtractionConfig` ID that would be created and managed by `ParsedDeadlineSuggestions` itself, indicating that the LLM processing parameters are internal to that concept.
*   The `initiate_multi_document_parsing` and `initiate_website_parsing` syncs illustrate the flow for the more complex user story elements, showing how aggregate data or externally fetched data is prepared and passed. This highlights the crucial role of syncs in orchestrating interactions between independent concepts.

---

### **A Brief Note**

This revised design for DueStack meticulously separates concerns across six concepts: `Users`, `UserAuthentication`, `Courses`, `Deadlines`, `UploadedDocuments`, and `ParsedDeadlineSuggestions`. Each concept manages its specific slice of functionality, leveraging opaque IDs (e.g., `User`, `Course`, `Document`) to reference entities managed by other concepts without forming direct dependencies. This modularity ensures high reusability and maintainability.

The `ParsedDeadlineSuggestions` concept, central to the AI-augmented features, has been carefully designed to operate on data provided as explicit action arguments, reinforcing its independence from `UploadedDocuments` or external web services. Synchronizations serve as the "glue," observing actions and state changes across concepts to orchestrate complex workflows, such as parsing multiple documents or refining suggestions based on user feedback, ultimately leading to confirmed `Deadlines`. This structure directly supports the detailed user journey by clearly mapping each step to specific concept actions and their interdependencies mediated by syncs.