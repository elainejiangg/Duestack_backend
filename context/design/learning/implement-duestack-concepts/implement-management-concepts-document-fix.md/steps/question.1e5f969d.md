---
timestamp: 'Sun Oct 19 2025 02:13:06 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_021306.586fa681.md]]'
content_id: 1e5f969d15a30d2c4df24c73e361a646c8312a997176a55bffbe7a0a39ae5521
---

# question: do these new concepts in

#### 1) UserIdentity

```concept
concept UserIdentity
purpose manage the core, unique identity and basic profile information for individuals interacting with the system.
principle new user identities can be created, storing their unique email and display name.

state
a set of Users with
  a email String
  a name String

actions
createUser (email: String, name: String): (user: User) or (error: String)
  requires email is unique
  effects a new User entity is created with the given email and name, and its opaque ID is returned.

updateUserName (user: User, newName: String): Empty or (error: String)
  requires user exists
  effects updates the name for the specified User.

updateUserEmail (user: User, newEmail: String): Empty or (error: String)
  requires user exists and newEmail is unique
  effects updates the email for the specified User.
```

***

#### 2) UserAuthentication `[User]`

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
  effects stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

disconnectCanvas (user: User): Empty or (error: String)
  requires user exists and has an existing canvasOAuthToken
  effects clears the Canvas OAuth token for the user.
```

***

#### 3) CourseManagement `[User]`

```concept
concept CourseManagement [User]
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
  effects creates a new Course entity with the given details, linked to the creator.

updateCourse (course: Course, newCourseCode: String, newTitle: String): Empty or (error: String)
  requires course exists and newCourseCode is unique for its creator (if changed)
  effects updates the courseCode and title of an existing course.

setCanvasId (course: Course, canvasId: String): Empty or (error: String)
  requires course exists and canvasId is unique across all courses
  effects sets or updates the external Canvas ID for the specified course.

deleteCourse (course: Course): Empty or (error: String)
  requires course exists and has no associated deadlines (this external check would be via syncs)
  effects removes the specified course entity.
```

***

#### 4) DeadlineManagement `[User, Course]`

```concept
concept DeadlineManagement [User, Course]
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
  requires course exists (this external check would be via syncs)
  effects creates a new Deadline entity with the given details.

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

#### 5) DocumentManagement `[User, Course]`

```concept
concept DocumentManagement [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with
  a course Course
  a uploader User
  a fileName String
  a fileType String // e.g., "application/pdf", "image/png", "text/plain"
  a uploadTime DateTime
  a contentUrl String // URL where the actual file content is stored externally (e.g., GCS, S3)
  a processedTextContent String // Extracted text content from the file, suitable for LLM processing

actions
uploadDocument (course: Course, fileName: String, fileType: String, rawFileContent: String, uploader: User): (document: UploadedDocument, processedTextContent: String, contentUrl: String) or (error: String)
  requires course exists (external check via syncs) and rawFileContent is non-empty
  effects simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
  requires document exists
  effects updates the fileName and fileType of an existing document's metadata.

getDocumentContent (document: UploadedDocument): (processedTextContent: String) or (error: String)
  requires document exists
  effects retrieves the stored processed text content of the specified document.

deleteDocument (document: UploadedDocument): Empty or (error: String)
  requires document exists
  effects removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.
```

***

#### 6) SuggestionManagement `[User, Document, Course]`

```concept
concept SuggestionManagement [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestions with
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
  effects creates a new ExtractionConfig entity for LLM processing.

parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists and canvasData is valid JSON
  effects parses assignment JSON data, creates suggestions linked to `user`.
           sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

llmExtractFromDocument(user: User, documentId: Document, documentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM
  effects uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

llmExtractFromMultipleDocuments(user: User, documentIds: List<Document>, combinedDocumentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, combinedDocumentContent is non-empty and suitable for LLM
  effects sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

llmExtractFromWebsite(user: User, url: String, websiteContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, url is reachable, websiteContent is non-empty
  effects uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `provenance`, `confidence`.

refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists, feedback is non-empty, config exists
  effects re-prompts LLM using user feedback to refine fields of the suggestion.
           updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

editSuggestion(suggestion: ParsedDeadlineSuggestion, newTitle: String, newDue: DateTime): Empty or (error: String)
  requires suggestion exists, newTitle is non-empty, newDue is valid
  effects updates suggestion title and due date.
           sets `warnings` to indicate manual editing.

updateSuggestionTitle(suggestion: ParsedDeadlineSuggestion, newTitle: String): Empty or (error: String)
  requires suggestion exists and newTitle is non-empty
  effects updates suggestion title.
           sets `warnings` to indicate manual editing.

updateSuggestionDate(suggestion: ParsedDeadlineSuggestion, newDue: DateTime): Empty or (error: String)
  requires suggestion exists and newDue is valid
  effects updates suggestion due date.
           sets `warnings` to indicate manual editing.

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date, and course exists (external check via syncs)
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.
```

***

### Essential Synchronizations

```
sync parse_single_upload
when DocumentManagement.uploadDocument (document: d, processedTextContent: ptc, contentUrl: cu, course: crs, fileName: fn, fileType: ft, uploader: u)
where ft is "application/pdf" or "image/png" or "text/plain" // simplified check
then SuggestionManagement.llmExtractFromDocument (user: u, documentId: d, documentContent: ptc, config: default_llm_config) // Assuming 'default_llm_config' is an implicitly available config from ExtractionConfigs

sync parse_multiple_uploads // A new sync to handle combining multiple documents
when DocumentManagement.uploadDocument (document: d1, processedTextContent: ptc1, course: crs, uploader: u) AND
     DocumentManagement.uploadDocument (document: d2, processedTextContent: ptc2, course: crs, uploader: u) // Extend 'when' for N documents as needed
then SuggestionManagement.llmExtractFromMultipleDocuments (user: u, documentIds: [d1, d2], combinedDocumentContent: (ptc1 + "\n\n" + ptc2), config: default_llm_config)

sync parse_canvas_connect
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token)
then SuggestionManagement.parseFromCanvas (user: u, canvasData: (fetched data), config: default_canvas_config) // fetched data would come from an external Canvas API call

sync confirm_suggestion
when SuggestionManagement.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then DeadlineManagement.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

sync status_update
when Request.setStatus (deadline: dl, status: st)
then DeadlineManagement.setStatus (deadline: dl, status: st)
```

***

### A Brief Note

The six concepts work together to support DueStack’s core features while maintaining strong separation of concerns and modularity.

* **UserIdentity** manages fundamental user identities (email, name) and is purely about identity management. All actions (e.g., uploading documents, creating deadlines, updating status) are scoped by a `User` ID which originates from this concept. Update actions for user name and email have been added.
* **UserAuthentication** handles secure registration, login, and managing user credentials, including Canvas connection tokens, for existing `User` IDs from `UserIdentity`. It now includes a `disconnectCanvas` action for completeness.
* **CourseManagement** serves as containers for organizing deadlines and documents. Each course is tied to specific content and metadata, and allows both imports and manual additions. It includes full CRUD for courses and a dedicated `setCanvasId` action.
* **DeadlineManagement** is the primary planning unit in the app. Deadlines can come from Canvas imports, manual inputs, or confirmed document/image parsing. Status values help students track progress. It includes full CRUD for deadlines and `setStatus`.
* **DocumentManagement** securely stores and manages external syllabus files, GitHub tables, screenshots, and ties uploads to users and courses. It now distinguishes between `contentUrl` (for external storage) and `processedTextContent` (for LLM consumption), ensuring that large binary data is not stored in the database. Full CRUD actions for document metadata are now available.
* **SuggestionManagement** represents the result of OCR or parsing logic and must be confirmed by users before becoming official Deadlines. Canvas data also routes through this system to preserve the same confirmation pattern. Its actions have been refined to take primitive `string` content (e.g., `documentContent`, `combinedDocumentContent`) and `User` IDs, enforcing strict modularity. It also includes `ExtractionConfigs` and actions for refining and directly editing suggestions.

Generic parameters are resolved as:

* `User` always comes from the `UserIdentity` concept.
* `Course` in all references maps to `CourseManagement`.
* `Document` is an object from `DocumentManagement`.
* `SuggestionManagement.confirm` emits data for `DeadlineManagement.createDeadline` but doesn’t create the Deadline itself; this is handled by a synchronization.

match exactly to the existing implementations in the following files? If not, provide updated implementation of the conepts, such that the conepxt specs are the groun truth i.e., the code matches the spec exactly

## DueStack Concept Files:

**Core User Management:**

* # file: src/concepts/DueStack/UserIdentityConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
      import { Empty, ID } from "@utils/types.ts"; // Added Empty type for actions returning no specific data
      import { freshID } from "@utils/database.ts";

      // Collection prefix to ensure namespace separation, matching the concept name
      const PREFIX = "UserIdentity" + ".";

      // Generic type for a User, representing an opaque ID
      type User = ID;

      /**
       * State: A set of Users, each with a unique email and a name.
       * 'Users' here refers to the collection of User entities.
       */
      interface UserDoc {
        _id: User;
        email: string;
        name: string;
      }

      /**
       * @concept UserIdentity
       * @purpose manage the core, unique identity and basic profile information for individuals interacting with the system.
       * @principle new user identities can be created, storing their unique email and display name.
       */
      export default class UserIdentityConcept {
        users: Collection<UserDoc>;

        constructor(private readonly db: Db) {
          this.users = this.db.collection(PREFIX + "users");
        }

        /**
         * Action: Creates a new user identity.
         * @param {Object} args - The arguments for the action.
         * @param {string} args.email - The unique email address for the new user.
         * @param {string} args.name - The display name for the new user.
         * @returns {Promise<{user: User} | {error: string}>} A promise that resolves to an object containing the new user's ID on success, or an error message on failure.
         * @requires email is unique across all users.
         * @effects A new User is created with the given email and name, and its opaque ID is returned.
         */
        async createUser({ email, name }: { email: string; name: string }): Promise<{ user: User } | { error: string }> {
          const existingUser = await this.users.findOne({ email });
          if (existingUser) {
            return { error: `User with email '${email}' already exists. Email must be unique.` };
          }

          const userId = freshID() as User;
          await this.users.insertOne({ _id: userId, email, name });
          return { user: userId };
        }

        /**
         * Action: Updates the name for the specified User.
         * @param {Object} args - The arguments for the action.
         * @param {User} args.user - The ID of the user whose name to update.
         * @param {string} args.newName - The new display name for the user.
         * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
         * @requires user exists.
         * @effects Updates the name for the specified User.
         */
        async updateUserName({ user, newName }: { user: User; newName: string }): Promise<Empty | { error: string }> {
          const result = await this.users.updateOne(
            { _id: user },
            { $set: { name: newName } },
          );

          if (result.matchedCount === 0) {
            return { error: `User with ID ${user} not found.` };
          }
          return {};
        }

        /**
         * Action: Updates the email for the specified User.
         * @param {Object} args - The arguments for the action.
         * @param {User} args.user - The ID of the user whose email to update.
         * @param {string} args.newEmail - The new unique email address for the user.
         * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
         * @requires user exists and newEmail is unique.
         * @effects Updates the email for the specified User.
         */
        async updateUserEmail({ user, newEmail }: { user: User; newEmail: string }): Promise<Empty | { error: string }> {
          const existingUser = await this.users.findOne({ _id: user });
          if (!existingUser) {
            return { error: `User with ID ${user} not found.` };
          }

          const duplicateEmailUser = await this.users.findOne({ email: newEmail });
          if (duplicateEmailUser && duplicateEmailUser._id !== user) {
            return { error: `Email '${newEmail}' is already in use by another user.` };
          }

          await this.users.updateOne(
            { _id: user },
            { $set: { email: newEmail } },
          );
          return {};
        }

        // --- Query Methods (for internal use and testing) ---

        /**
         * Query: Retrieves a user identity by their ID.
         */
        async _getUserById({ userId }: { userId: User }): Promise<UserDoc | null> {
          return await this.users.findOne({ _id: userId });
        }

        /**
         * Query: Retrieves a user identity by their email address.
         */
        async _getUserByEmail({ email }: { email: string }): Promise<UserDoc | null> {
          return await this.users.findOne({ email });
        }

        /**
         * Query: Retrieves all user identities.
         */
        async _getAllUsers(): Promise<UserDoc[]> {
          return await this.users.find({}).toArray();
        }
      }
      
  ```
*
* # file: src/concepts/DueStack/UserIdentityConcept.test.ts
  ```typescript
  import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts"; // Import freshID for dynamic user creation in tests
  import UserIdentityConcept from "./UserIdentityConcept.ts";

  const TEST_EMAIL_ALICE = "alice@example.com";
  const TEST_NAME_ALICE = "Alice Smith";
  const TEST_EMAIL_BOB = "bob@example.com";
  const TEST_NAME_BOB = "Bob Johnson";
  const TEST_EMAIL_CHARLIE = "charlie@example.com";

  Deno.test("UserIdentity: Principle - New user identities can be created, storing their unique email and display name.", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);

    try {
      // 1. Create a new user identity
      const createUserResult = await userIdentityConcept.createUser({
        email: TEST_EMAIL_ALICE,
        name: TEST_NAME_ALICE,
      });
      assertNotEquals("error" in createUserResult, true, "User identity creation should not fail.");
      const { user: aliceUserId } = createUserResult as { user: ID };
      assertExists(aliceUserId, "A user ID should be returned on successful creation.");

      // 2. Their core information is stored
      const storedUser = await userIdentityConcept._getUserById({ userId: aliceUserId });
      assertExists(storedUser, "The created user identity should exist in the database.");
      assertEquals(storedUser?.email, TEST_EMAIL_ALICE, "Stored user email should match.");
      assertEquals(storedUser?.name, TEST_NAME_ALICE, "Stored user name should match.");

      // 3. Their existence is tracked (e.g., through a query for all users)
      const allUsers = await userIdentityConcept._getAllUsers();
      assertEquals(allUsers.length, 1, "There should be one user identity in the system.");
      assertEquals(allUsers[0]._id, aliceUserId, "The retrieved user ID should match the created one.");
    } finally {
      await client.close();
    }
  });

  Deno.test("UserIdentity: Action - createUser enforces unique email", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);

    try {
      await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });

      const duplicateEmailResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_BOB });
      assertEquals("error" in duplicateEmailResult, true, "Creating user with duplicate email should fail.");
      assertEquals((duplicateEmailResult as { error: string }).error, `User with email '${TEST_EMAIL_ALICE}' already exists. Email must be unique.`);

      const allUsers = await userIdentityConcept._getAllUsers();
      assertEquals(allUsers.length, 1, "Only one user should exist after duplicate email attempt.");
    } finally {
      await client.close();
    }
  });

  Deno.test("UserIdentity: Action - updateUserName successfully updates name", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      const newName = "Alice Wonderland";
      const updateResult = await userIdentityConcept.updateUserName({ user: aliceUserId, newName });
      assertEquals("error" in updateResult, false, "Updating user name should succeed.");

      const updatedUser = await userIdentityConcept._getUserById({ userId: aliceUserId });
      assertEquals(updatedUser?.name, newName, "User name should be updated.");

      const nonExistentUserId = freshID() as ID;
      const nonExistentUpdateResult = await userIdentityConcept.updateUserName({ user: nonExistentUserId, newName: "Fake" });
      assertEquals("error" in nonExistentUpdateResult, true, "Updating non-existent user should fail.");
    } finally {
      await client.close();
    }
  });

  Deno.test("UserIdentity: Action - updateUserEmail successfully updates email and enforces uniqueness", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);

    try {
      const createUserResult1 = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult1 as { user: ID };

      const createUserResult2 = await userIdentityConcept.createUser({ email: TEST_EMAIL_BOB, name: TEST_NAME_BOB });
      const { user: bobUserId } = createUserResult2 as { user: ID };

      // Successful email update for Alice
      const newEmailAlice = TEST_EMAIL_CHARLIE;
      const updateResult = await userIdentityConcept.updateUserEmail({ user: aliceUserId, newEmail: newEmailAlice });
      assertEquals("error" in updateResult, false, "Updating Alice's email should succeed.");

      const updatedAlice = await userIdentityConcept._getUserById({ userId: aliceUserId });
      assertEquals(updatedAlice?.email, newEmailAlice, "Alice's email should be updated.");
      assertEquals((await userIdentityConcept._getUserByEmail({ email: TEST_EMAIL_ALICE })), null, "Old email should no longer exist.");

      // Attempt to update Alice's email to Bob's existing email (should fail)
      const duplicateEmailUpdateResult = await userIdentityConcept.updateUserEmail({ user: aliceUserId, newEmail: TEST_EMAIL_BOB });
      assertEquals("error" in duplicateEmailUpdateResult, true, "Updating to a duplicate email should fail.");
      assertEquals((duplicateEmailUpdateResult as { error: string }).error, `Email '${TEST_EMAIL_BOB}' is already in use by another user.`);

      // Attempt to update non-existent user
      const nonExistentUserId = freshID() as ID;
      const nonExistentUpdateResult = await userIdentityConcept.updateUserEmail({ user: nonExistentUserId, newEmail: "nonexistent@example.com" });
      assertEquals("error" in nonExistentUpdateResult, true, "Updating non-existent user should fail.");
    } finally {
      await client.close();
    }
  });

  Deno.test("UserIdentity: Queries return correct data or null", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      const userById = await userIdentityConcept._getUserById({ userId: aliceUserId });
      assertExists(userById);
      assertEquals(userById?.name, TEST_NAME_ALICE);

      const userByEmail = await userIdentityConcept._getUserByEmail({ email: TEST_EMAIL_ALICE });
      assertExists(userByEmail);
      assertEquals(userByEmail?._id, aliceUserId);

      const allUsers = await userIdentityConcept._getAllUsers();
      assertEquals(allUsers.length, 1);
      assertEquals(allUsers[0]._id, aliceUserId);
    } finally {
      await client.close();
    }
  });

  ```
*
* # file: src/concepts/DueStack/UserAuthenticationConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
  import { Empty, ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";
  import { createHash } from "node:crypto"; // Deno supports node:crypto for hashing

  // Collection prefix to ensure namespace separation
  const PREFIX = "UserAuthentication" + ".";

  // Generic types for the concept's external dependencies
  type User = ID; // User ID originating from UserIdentity concept

  // Internal entity types, represented as IDs
  type AuthenticatedUser = ID; // ID for the authenticated user entry itself

  /**
   * State: A set of AuthenticatedUsers, associating a User ID with authentication credentials.
   */
  interface AuthenticatedUserDoc {
    _id: AuthenticatedUser; // Primary key for this collection
    user: User; // Reference to the UserIdentity's User ID
    username: string;
    passwordHash: string;
    sessionID?: string; // Optional: current active session ID
    canvasOAuthToken?: string; // Optional: Canvas connection token
  }

  /**
   * Helper function for basic password hashing (for demonstration purposes).
   * In a real application, use a robust library like bcrypt.
   */
  function hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("hex");
  }

  /**
   * Basic password complexity check (for demonstration purposes).
   * Requires minimum 8 characters.
   */
  function checkPasswordComplexity(password: string): boolean {
    return password.length >= 8;
  }

  /**
   * @concept UserAuthentication
   * @purpose allow users to securely register, log in, and manage their credentials.
   */
  export default class UserAuthenticationConcept {
    authenticatedUsers: Collection<AuthenticatedUserDoc>;

    constructor(private readonly db: Db) {
      this.authenticatedUsers = this.db.collection(PREFIX + "authenticatedUsers");
    }

    /**
     * Action: Allows a User to register with a unique username and password.
     * @param {Object} args - The arguments for the action.
     * @param {User} args.user - The ID of the User (from UserIdentity) to register.
     * @param {string} args.username - The chosen unique username.
     * @param {string} args.password - The chosen password.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires username is unique and password meets complexity requirements.
     * @effects Creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.
     */
    async register({ user, username, password }: { user: User; username: string; password: string }): Promise<Empty | { error: string }> {
      const existingUsername = await this.authenticatedUsers.findOne({ username });
      if (existingUsername) {
        return { error: `Username '${username}' is already taken.` };
      }

      if (!checkPasswordComplexity(password)) {
        return { error: "Password does not meet complexity requirements (min 8 characters)." };
      }

      const passwordHash = hashPassword(password);
      const authUserId = freshID() as AuthenticatedUser;

      await this.authenticatedUsers.insertOne({
        _id: authUserId,
        user,
        username,
        passwordHash,
      });
      return {};
    }

    /**
     * Action: Allows a user to log in with their username and password.
     * @param {Object} args - The arguments for the action.
     * @param {string} args.username - The username for login.
     * @param {string} args.password - The password for login.
     * @returns {Promise<{sessionID: string, user: User} | {error: string}>} A promise that resolves to an object containing a new session ID and the associated User ID on success, or an error message on failure.
     * @requires username and password match an existing AuthenticatedUser.
     * @effects Generates a new sessionID for the AuthenticatedUser.
     */
    async login({ username, password }: { username: string; password: string }): Promise<{ sessionID: string; user: User } | { error: string }> {
      const authUser = await this.authenticatedUsers.findOne({ username });

      if (!authUser || authUser.passwordHash !== hashPassword(password)) {
        return { error: "Invalid username or password." };
      }

      const sessionID = freshID(); // Generate a new session ID
      await this.authenticatedUsers.updateOne(
        { _id: authUser._id },
        { $set: { sessionID } },
      );
      return { sessionID, user: authUser.user };
    }

    /**
     * Action: Allows a user to log out by invalidating their session.
     * @param {Object} args - The arguments for the action.
     * @param {string} args.sessionID - The session ID to invalidate.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires sessionID is valid.
     * @effects Clears the sessionID for the associated AuthenticatedUser.
     */
    async logout({ sessionID }: { sessionID: string }): Promise<Empty | { error: string }> {
      const result = await this.authenticatedUsers.updateOne(
        { sessionID },
        { $unset: { sessionID: "" } }, // Unset the sessionID field
      );

      if (result.matchedCount === 0) {
        return { error: "Invalid or expired session ID." };
      }
      return {};
    }

    /**
     * Action: Allows a user to change their password.
     * @param {Object} args - The arguments for the action.
     * @param {User} args.user - The ID of the User whose password to change.
     * @param {string} args.oldPassword - The current password.
     * @param {string} args.newPassword - The new password.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires user exists, oldPassword matches, newPassword meets complexity requirements.
     * @effects Updates the passwordHash for the specified User.
     */
    async changePassword({ user, oldPassword, newPassword }: { user: User; oldPassword: string; newPassword: string }): Promise<Empty | { error: string }> {
      const authUser = await this.authenticatedUsers.findOne({ user });

      if (!authUser) {
        return { error: "User not found." };
      }

      if (authUser.passwordHash !== hashPassword(oldPassword)) {
        return { error: "Old password does not match." };
      }

      if (!checkPasswordComplexity(newPassword)) {
        return { error: "New password does not meet complexity requirements (min 8 characters)." };
      }

      const newPasswordHash = hashPassword(newPassword);
      await this.authenticatedUsers.updateOne(
        { _id: authUser._id },
        { $set: { passwordHash: newPasswordHash } },
      );
      return {};
    }

    /**
     * Action: Stores the Canvas OAuth token for a user.
     * @param {Object} args - The arguments for the action.
     * @param {User} args.user - The ID of the User to connect to Canvas.
     * @param {string} args.canvasOAuthToken - The OAuth token from Canvas.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires user exists and canvasOAuthToken is valid (validity check is external to this concept).
     * @effects Stores the Canvas OAuth token for the user, enabling Canvas data fetching.
     */
    async connectCanvas({ user, canvasOAuthToken }: { user: User; canvasOAuthToken: string }): Promise<Empty | { error: string }> {
      const authUser = await this.authenticatedUsers.findOne({ user });

      if (!authUser) {
        return { error: "User not found." };
      }

      await this.authenticatedUsers.updateOne(
        { _id: authUser._id },
        { $set: { canvasOAuthToken } },
      );
      return {};
    }

    // --- Query Methods (for internal use and testing) ---

    /**
     * Query: Retrieves an AuthenticatedUserDoc by username.
     */
    async _getAuthenticatedUserByUsername({ username }: { username: string }): Promise<AuthenticatedUserDoc | null> {
      return await this.authenticatedUsers.findOne({ username });
    }

    /**
     * Query: Retrieves an AuthenticatedUserDoc by the User ID.
     */
    async _getAuthenticatedUserByUser({ user }: { user: User }): Promise<AuthenticatedUserDoc | null> {
      return await this.authenticatedUsers.findOne({ user });
    }

    /**
     * Query: Retrieves the User ID associated with a given session ID.
     */
    async _getSessionUser({ sessionID }: { sessionID: string }): Promise<User | null> {
      const authUser = await this.authenticatedUsers.findOne({ sessionID });
      return authUser ? authUser.user : null;
    }
  }

  ```
*
* # file: src/concepts/DueStack/UserAuthenticationConcept.test.ts
  ```typescript
  import { assertEquals, assertExists, assertNotEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts"; // Added: Import freshID
  import UserIdentityConcept from "./UserIdentityConcept.ts";
  import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";


  const TEST_EMAIL_ALICE = "alice@example.com";
  const TEST_NAME_ALICE = "Alice Smith";
  const TEST_USERNAME_ALICE = "alice_smith";
  const TEST_PASSWORD_ALICE = "securePass123";
  const TEST_PASSWORD_ALICE_NEW = "evenMoreSecure456";
  const TEST_CANVAS_TOKEN_ALICE = "mock_canvas_token_abc123";

  const TEST_EMAIL_BOB = "bob@example.com";
  const TEST_NAME_BOB = "Bob Johnson";
  const TEST_PASSWORD_BOB = "BobSecure456";

  Deno.test("Principle: A user can register, log in, and log out.", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      // Setup: Create a UserIdentity first (as UserAuthentication uses User IDs)
      const createUserResult = await userIdentityConcept.createUser({
        email: TEST_EMAIL_ALICE,
        name: TEST_NAME_ALICE,
      });
      assertNotEquals("error" in createUserResult, true, "UserIdentity creation should succeed.");
      const { user: aliceUserId } = createUserResult as { user: ID };
      assertExists(aliceUserId);

      // 1. A user can register with a unique username and password
      const registerResult = await userAuthConcept.register({
        user: aliceUserId,
        username: TEST_USERNAME_ALICE,
        password: TEST_PASSWORD_ALICE,
      });
      // Removed problematic `registerResult.error` access on success path
      assertEquals("error" in registerResult, false, `Registration should succeed.`);

      const registeredUser = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertExists(registeredUser, "Registered user should exist in AuthenticatedUsers collection.");
      assertEquals(registeredUser?.username, TEST_USERNAME_ALICE);

      // 2. Log in to establish a session
      const loginResult = await userAuthConcept.login({
        username: TEST_USERNAME_ALICE,
        password: TEST_PASSWORD_ALICE,
      });
      // Removed problematic `loginResult.error` access on success path
      assertEquals("error" in loginResult, false, `Login should succeed.`);
      const { sessionID, user: loggedInUserId } = loginResult as { sessionID: string; user: ID };
      assertExists(sessionID, "Session ID should be generated.");
      assertStrictEquals(loggedInUserId, aliceUserId, "Logged in user ID should match.");

      const authUserAfterLogin = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUserAfterLogin?.sessionID, sessionID, "Session ID should be stored in the state.");

      // 3. Log out to end it
      const logoutResult = await userAuthConcept.logout({ sessionID });
      assertEquals("error" in logoutResult, false, `Logout should succeed.`);

      const authUserAfterLogout = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUserAfterLogout?.sessionID, undefined, "Session ID should be cleared after logout.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: register - enforces unique usernames and password complexity", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      // Valid registration
      const registerResult = await userAuthConcept.register({ user: aliceUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });
      assertEquals("error" in registerResult, false, "Valid registration should succeed.");

      // Attempt to register with a duplicate username
      const createUserResult2 = await userIdentityConcept.createUser({ email: TEST_EMAIL_BOB, name: TEST_NAME_BOB });
      const { user: bobUserId } = createUserResult2 as { user: ID };

      const duplicateUsernameResult = await userAuthConcept.register({ user: bobUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_BOB });
      assertEquals("error" in duplicateUsernameResult, true, "Registration with duplicate username should fail.");
      assertEquals((duplicateUsernameResult as { error: string }).error, `Username '${TEST_USERNAME_ALICE}' is already taken.`);

      // Attempt to register with a weak password (less than 8 characters)
      // Corrected `freshID()` usage and import
      const weakPasswordResult = await userAuthConcept.register({ user: freshID() as ID, username: "weakuser", password: "weak" });
      assertEquals("error" in weakPasswordResult, true, "Registration with weak password should fail.");
      assertEquals((weakPasswordResult as { error: string }).error, "Password does not meet complexity requirements (min 8 characters).");

      const authUsers = await userAuthConcept.authenticatedUsers.find({}).toArray();
      assertEquals(authUsers.length, 1, "Only one authenticated user should exist.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: login - handles invalid credentials", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      await userAuthConcept.register({ user: aliceUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });

      // Invalid username
      const invalidUsernameResult = await userAuthConcept.login({ username: "wrong_user", password: TEST_PASSWORD_ALICE });
      assertEquals("error" in invalidUsernameResult, true, "Login with invalid username should fail.");
      assertEquals((invalidUsernameResult as { error: string }).error, "Invalid username or password.");

      // Invalid password
      const invalidPasswordResult = await userAuthConcept.login({ username: TEST_USERNAME_ALICE, password: "wrong_password" });
      assertEquals("error" in invalidPasswordResult, true, "Login with invalid password should fail.");
      assertEquals((invalidPasswordResult as { error: string }).error, "Invalid username or password.");

      const authUser = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUser?.sessionID, undefined, "Session ID should not be set for failed login attempts.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: logout - handles invalid session ID", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      await userAuthConcept.register({ user: aliceUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });

      const loginResult = await userAuthConcept.login({ username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });
      const { sessionID } = loginResult as { sessionID: string; user: ID };

      // Attempt to logout with a non-existent session ID
      const invalidSessionResult = await userAuthConcept.logout({ sessionID: "fake_session_id" });
      assertEquals("error" in invalidSessionResult, true, "Logout with invalid session ID should fail.");
      assertEquals((invalidSessionResult as { error: string }).error, "Invalid or expired session ID.");

      const authUser = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUser?.sessionID, sessionID, "Session ID should remain active if logout fails for another session.");

      // Successful logout
      const logoutResult = await userAuthConcept.logout({ sessionID });
      assertEquals("error" in logoutResult, false, `Logout should succeed.`);
      const authUserAfterLogout = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUserAfterLogout?.sessionID, undefined, "Session ID should be cleared after successful logout.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: changePassword - handles incorrect old password or weak new password", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      await userAuthConcept.register({ user: aliceUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });

      // Incorrect old password
      const wrongOldPassResult = await userAuthConcept.changePassword({ user: aliceUserId, oldPassword: "wrong_password", newPassword: TEST_PASSWORD_ALICE_NEW });
      assertEquals("error" in wrongOldPassResult, true, "Changing password with incorrect old password should fail.");
      assertEquals((wrongOldPassResult as { error: string }).error, "Old password does not match.");

      // New password too weak
      const weakNewPassResult = await userAuthConcept.changePassword({ user: aliceUserId, oldPassword: TEST_PASSWORD_ALICE, newPassword: "weak" });
      assertEquals("error" in weakNewPassResult, true, "Changing password to a weak new password should fail.");
      assertEquals((weakNewPassResult as { error: string }).error, "New password does not meet complexity requirements (min 8 characters).");

      // Successful password change
      const changePassResult = await userAuthConcept.changePassword({ user: aliceUserId, oldPassword: TEST_PASSWORD_ALICE, newPassword: TEST_PASSWORD_ALICE_NEW });
      assertEquals("error" in changePassResult, false, "Valid password change should succeed.");

      // Verify login with new password
      const loginWithNewPass = await userAuthConcept.login({ username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE_NEW });
      assertEquals("error" in loginWithNewPass, false, "Login with new password should succeed.");

      // Verify old password no longer works
      const loginWithOldPass = await userAuthConcept.login({ username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });
      assertEquals("error" in loginWithOldPass, true, "Login with old password should now fail.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: connectCanvas - successfully stores Canvas OAuth token", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const userAuthConcept = new UserAuthenticationConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      await userAuthConcept.register({ user: aliceUserId, username: TEST_USERNAME_ALICE, password: TEST_PASSWORD_ALICE });

      // Connect Canvas account
      const connectCanvasResult = await userAuthConcept.connectCanvas({ user: aliceUserId, canvasOAuthToken: TEST_CANVAS_TOKEN_ALICE });
      assertEquals("error" in connectCanvasResult, false, "Connecting Canvas should succeed.");

      // Verify token is stored
      const authUser = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
      assertEquals(authUser?.canvasOAuthToken, TEST_CANVAS_TOKEN_ALICE, "Canvas OAuth token should be stored.");

      // Attempt to connect Canvas for non-existent user
      const nonExistentUserId = "user:nonexistent" as ID;
      const nonExistentUserConnectResult = await userAuthConcept.connectCanvas({ user: nonExistentUserId, canvasOAuthToken: "another_token" });
      assertEquals("error" in nonExistentUserConnectResult, true, "Connecting Canvas for non-existent user should fail.");
      assertEquals((nonExistentUserConnectResult as { error: string }).error, "User not found.");
    } finally {
      await client.close();
    }
  });
  ```

**Course Management:**

* # file: src/concepts/DueStack/CourseManagementConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
  import { Empty, ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";

  // Collection prefix to ensure namespace separation
  const PREFIX = "CourseManagement" + ".";

  // Generic type for a User, originating from UserIdentity concept
  type User = ID;

  // Internal entity type for a Course
  type Course = ID;

  /**
   * State: A set of Courses, each linked to a creator, with a unique courseCode, title, and optional Canvas ID.
   */
  interface CourseDoc {
    _id: Course; // Primary key for this collection
    creator: User; // Reference to the UserIdentity's User ID
    courseCode: string; // Unique per creator
    title: string;
    canvasId?: string; // Optional: external Canvas ID, unique globally if set
  }

  /**
   * @concept CourseManagement
   * @purpose organize and categorize academic deadlines by associating them with specific courses.
   */
  export default class CourseManagementConcept {
    courses: Collection<CourseDoc>;

    constructor(private readonly db: Db) {
      this.courses = this.db.collection(PREFIX + "courses");
    }

    /**
     * Action: Creates a new course.
     * @param {Object} args - The arguments for the action.
     * @param {User} args.creator - The ID of the User who is creating the course.
     * @param {string} args.courseCode - A unique code for the course (unique per creator).
     * @param {string} args.title - The title of the course.
     * @returns {Promise<{course: Course} | {error: string}>} A promise that resolves to an object containing the new course's ID on success, or an error message on failure.
     * @requires courseCode is unique for the creator.
     * @effects Creates a new course with the given details, linked to the creator.
     */
    async createCourse({ creator, courseCode, title }: { creator: User; courseCode: string; title: string }): Promise<{ course: Course } | { error: string }> {
      const existingCourse = await this.courses.findOne({ creator, courseCode });
      if (existingCourse) {
        return { error: `Course with code '${courseCode}' already exists for this creator.` };
      }

      const courseId = freshID() as Course;
      await this.courses.insertOne({
        _id: courseId,
        creator,
        courseCode,
        title,
      });
      return { course: courseId };
    }

    /**
     * Action: Updates the courseCode and/or title of an existing course.
     * @param {Object} args - The arguments for the action.
     * @param {Course} args.course - The ID of the course to update.
     * @param {string} args.newCourseCode - The new unique course code.
     * @param {string} args.newTitle - The new title of the course.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires course exists and newCourseCode is unique for the creator (if changed).
     * @effects Updates the courseCode and title of an existing course.
     */
    async updateCourse({ course, newCourseCode, newTitle }: { course: Course; newCourseCode: string; newTitle: string }): Promise<Empty | { error: string }> {
      const existingCourse = await this.courses.findOne({ _id: course });
      if (!existingCourse) {
        return { error: `Course with ID ${course} not found.` };
      }

      // Check uniqueness if courseCode is changed
      if (existingCourse.courseCode !== newCourseCode) {
        const duplicateCourse = await this.courses.findOne({
          creator: existingCourse.creator,
          courseCode: newCourseCode,
        });
        if (duplicateCourse) {
          return { error: `New course code '${newCourseCode}' already exists for this creator.` };
        }
      }

      await this.courses.updateOne(
        { _id: course },
        { $set: { courseCode: newCourseCode, title: newTitle } },
      );
      return {};
    }

    /**
     * Action: Sets or updates the external Canvas ID for the specified course.
     * @param {Object} args - The arguments for the action.
     * @param {Course} args.course - The ID of the course to update.
     * @param {string} args.canvasId - The external Canvas ID.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires course exists and canvasId is unique across all courses.
     * @effects Sets or updates the external Canvas ID for the specified course.
     */
    async setCanvasId({ course, canvasId }: { course: Course; canvasId: string }): Promise<Empty | { error: string }> {
      const existingCourse = await this.courses.findOne({ _id: course });
      if (!existingCourse) {
        return { error: `Course with ID ${course} not found.` };
      }

      // Check if another course already uses this canvasId (must be unique globally)
      const duplicateCanvasIdCourse = await this.courses.findOne({ canvasId });
      if (duplicateCanvasIdCourse && duplicateCanvasIdCourse._id !== course) {
        return { error: `Canvas ID '${canvasId}' is already linked to another course.` };
      }

      await this.courses.updateOne(
        { _id: course },
        { $set: { canvasId } },
      );
      return {};
    }

    /**
     * Action: Removes the specified course.
     * @param {Object} args - The arguments for the action.
     * @param {Course} args.course - The ID of the course to delete.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires course exists.
     * @effects Removes the specified course.
     * @note The concept specification states "and has no associated deadlines". This check must be enforced by external synchronizations or services before calling this action, as DeadlineManagement is an independent concept. This concept only ensures the 'course exists' precondition.
     */
    async deleteCourse({ course }: { course: Course }): Promise<Empty | { error: string }> {
      const result = await this.courses.deleteOne({ _id: course });

      if (result.deletedCount === 0) {
        return { error: `Course with ID ${course} not found.` };
      }
      return {};
    }

    // --- Query Methods (for internal use and testing) ---

    /**
     * Query: Retrieves a course by its ID.
     */
    async _getCourseById({ courseId }: { courseId: Course }): Promise<CourseDoc | null> {
      return await this.courses.findOne({ _id: courseId });
    }

    /**
     * Query: Retrieves courses created by a specific user.
     */
    async _getCoursesByCreator({ creator }: { creator: User }): Promise<CourseDoc[]> {
      return await this.courses.find({ creator }).toArray();
    }

    /**
     * Query: Retrieves a course by its courseCode and creator.
     */
    async _getCourseByCodeAndCreator({ creator, courseCode }: { creator: User; courseCode: string }): Promise<CourseDoc | null> {
      return await this.courses.findOne({ creator, courseCode });
    }

    /**
     * Query: Retrieves all courses.
     */
    async _getAllCourses(): Promise<CourseDoc[]> {
      return await this.courses.find({}).toArray();
    }
  }

  ```
*
* # file: src/concepts/DueStack/CourseManagementConcept.test.ts
  ```typescript

  import { assertEquals, assertExists, assertNotEquals, assertStrictEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";
  import UserIdentityConcept from "./UserIdentityConcept.ts";
  import CourseManagementConcept from "./CourseManagementConcept.ts";

  const TEST_EMAIL_ALICE = "alice@example.com";
  const TEST_NAME_ALICE = "Alice Smith";
  const TEST_COURSE_CODE_61040 = "6.1040";
  const TEST_TITLE_61040 = "Software Design and Development";
  const TEST_CANVAS_ID_61040 = "canvas_id_61040";

  const TEST_EMAIL_BOB = "bob@example.com";
  const TEST_NAME_BOB = "Bob Johnson";
  const TEST_COURSE_CODE_6006 = "6.006";
  const TEST_TITLE_6006 = "Introduction to Algorithms";
  const TEST_CANVAS_ID_6006 = "canvas_id_6006";

  Deno.test("Principle: Each user can define courses, assign unique identifiers, and manage course-specific details.", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);

    try {
      // Setup: Create a UserIdentity for Alice
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      assertExists(aliceUserId);

      // 1. Alice defines a course with a unique identifier
      const createCourseResult = await courseManagementConcept.createCourse({
        creator: aliceUserId,
        courseCode: TEST_COURSE_CODE_61040,
        title: TEST_TITLE_61040,
      });
      assertEquals("error" in createCourseResult, false, `Course creation should succeed: ${JSON.stringify(createCourseResult)}`);
      const { course: courseId61040 } = createCourseResult as { course: ID };
      assertExists(courseId61040);

      // Verify the course exists and has correct details
      const createdCourse = await courseManagementConcept._getCourseById({ courseId: courseId61040 });
      assertExists(createdCourse, "The created course should exist.");
      assertEquals(createdCourse?.courseCode, TEST_COURSE_CODE_61040);
      assertEquals(createdCourse?.title, TEST_TITLE_61040);
      assertStrictEquals(createdCourse?.creator, aliceUserId);

      // 2. Alice manages course-specific details (e.g., setting Canvas ID)
      const setCanvasIdResult = await courseManagementConcept.setCanvasId({ course: courseId61040, canvasId: TEST_CANVAS_ID_61040 });
      assertEquals("error" in setCanvasIdResult, false, `Setting Canvas ID should succeed: ${JSON.stringify(setCanvasIdResult)}`);

      const courseWithCanvasId = await courseManagementConcept._getCourseById({ courseId: courseId61040 });
      assertEquals(courseWithCanvasId?.canvasId, TEST_CANVAS_ID_61040, "Canvas ID should be set.");

      // 3. Alice updates course details
      const updatedTitle = "Advanced Software Design";
      const updateCourseResult = await courseManagementConcept.updateCourse({
        course: courseId61040,
        newCourseCode: TEST_COURSE_CODE_61040, // Keep same code
        newTitle: updatedTitle,
      });
      assertEquals("error" in updateCourseResult, false, `Course update should succeed: ${JSON.stringify(updateCourseResult)}`);

      const updatedCourse = await courseManagementConcept._getCourseById({ courseId: courseId61040 });
      assertEquals(updatedCourse?.title, updatedTitle, "Course title should be updated.");

      // Verify Alice's courses
      const aliceCourses = await courseManagementConcept._getCoursesByCreator({ creator: aliceUserId });
      assertEquals(aliceCourses.length, 1, "Alice should have one course.");
      assertEquals(aliceCourses[0].title, updatedTitle);

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: createCourse - enforces unique courseCode per creator", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });

      // Attempt to create another course with the same code for Alice
      const duplicateCodeResult = await courseManagementConcept.createCourse({
        creator: aliceUserId,
        courseCode: TEST_COURSE_CODE_61040,
        title: "Duplicate Title",
      });
      assertEquals("error" in duplicateCodeResult, true, "Creating course with duplicate code for same creator should fail.");
      assertEquals((duplicateCodeResult as { error: string }).error, `Course with code '${TEST_COURSE_CODE_61040}' already exists for this creator.`);

      // Create a different user (Bob)
      const createUserResultBob = await userIdentityConcept.createUser({ email: TEST_EMAIL_BOB, name: TEST_NAME_BOB });
      const { user: bobUserId } = createUserResultBob as { user: ID };

      // Bob can create a course with the same code as Alice's, because it's unique per creator
      const bobCourseResult = await courseManagementConcept.createCourse({
        creator: bobUserId,
        courseCode: TEST_COURSE_CODE_61040,
        title: "Another Software Design Course",
      });
      assertEquals("error" in bobCourseResult, false, "Bob creating course with same code as Alice should succeed.");

      const totalCourses = await courseManagementConcept._getAllCourses();
      assertEquals(totalCourses.length, 2, "There should be two distinct courses.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: updateCourse - updates details and enforces uniqueness if code changes", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      const createCourseResult1 = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId1 } = createCourseResult1 as { course: ID };

      const createCourseResult2 = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_6006, title: TEST_TITLE_6006 });
      const { course: courseId2 } = createCourseResult2 as { course: ID };

      // Update title only (code remains same)
      const newTitle = "New and Improved Software Design";
      const updateTitleResult = await courseManagementConcept.updateCourse({ course: courseId1, newCourseCode: TEST_COURSE_CODE_61040, newTitle });
      assertEquals("error" in updateTitleResult, false, "Updating title only should succeed.");
      const updatedCourse1 = await courseManagementConcept._getCourseById({ courseId: courseId1 });
      assertEquals(updatedCourse1?.title, newTitle, "Course title should be updated.");

      // Update course code and title
      const newCourseCode = "6.810";
      const newTitle2 = "Engineering Interactive Technologies";
      const updateCodeTitleResult = await courseManagementConcept.updateCourse({ course: courseId1, newCourseCode, newTitle: newTitle2 });
      assertEquals("error" in updateCodeTitleResult, false, "Updating code and title should succeed.");
      const updatedCourse1Again = await courseManagementConcept._getCourseById({ courseId: courseId1 });
      assertEquals(updatedCourse1Again?.courseCode, newCourseCode, "Course code should be updated.");
      assertEquals(updatedCourse1Again?.title, newTitle2, "Course title should be updated again.");

      // Attempt to update course code to an existing one for the same creator
      const attemptDuplicateCodeUpdate = await courseManagementConcept.updateCourse({ course: courseId1, newCourseCode: TEST_COURSE_CODE_6006, newTitle: "Will Fail" });
      assertEquals("error" in attemptDuplicateCodeUpdate, true, "Updating to an existing course code for the same creator should fail.");
      assertEquals((attemptDuplicateCodeUpdate as { error: string }).error, `New course code '${TEST_COURSE_CODE_6006}' already exists for this creator.`);

      // Attempt to update a non-existent course
      const nonExistentCourseId = freshID() as ID;
      const nonExistentUpdateResult = await courseManagementConcept.updateCourse({ course: nonExistentCourseId, newCourseCode: "FAKE", newTitle: "Fake Title" });
      assertEquals("error" in nonExistentUpdateResult, true, "Updating a non-existent course should fail.");
      assertEquals((nonExistentUpdateResult as { error: string }).error, `Course with ID ${nonExistentCourseId} not found.`);

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: setCanvasId - sets unique Canvas ID globally", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);

    try {
      const createUserResultAlice = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResultAlice as { user: ID };
      const createUserResultBob = await userIdentityConcept.createUser({ email: TEST_EMAIL_BOB, name: TEST_NAME_BOB });
      const { user: bobUserId } = createUserResultBob as { user: ID };

      const createCourseResultAlice = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseIdAlice } = createCourseResultAlice as { course: ID };
      const createCourseResultBob = await courseManagementConcept.createCourse({ creator: bobUserId, courseCode: TEST_COURSE_CODE_6006, title: TEST_TITLE_6006 });
      const { course: courseIdBob } = createCourseResultBob as { course: ID };

      // Alice sets Canvas ID for her course
      const setAliceCanvasIdResult = await courseManagementConcept.setCanvasId({ course: courseIdAlice, canvasId: TEST_CANVAS_ID_61040 });
      assertEquals("error" in setAliceCanvasIdResult, false, "Alice setting Canvas ID should succeed.");
      const aliceCourse = await courseManagementConcept._getCourseById({ courseId: courseIdAlice });
      assertEquals(aliceCourse?.canvasId, TEST_CANVAS_ID_61040, "Alice's Canvas ID should be set.");

      // Bob tries to set the same Canvas ID for his course (should fail due to global uniqueness)
      const setBobDuplicateCanvasIdResult = await courseManagementConcept.setCanvasId({ course: courseIdBob, canvasId: TEST_CANVAS_ID_61040 });
      assertEquals("error" in setBobDuplicateCanvasIdResult, true, "Bob setting duplicate Canvas ID should fail.");
      assertEquals((setBobDuplicateCanvasIdResult as { error: string }).error, `Canvas ID '${TEST_CANVAS_ID_61040}' is already linked to another course.`);

      // Bob sets a unique Canvas ID for his course (should succeed)
      const setBobUniqueCanvasIdResult = await courseManagementConcept.setCanvasId({ course: courseIdBob, canvasId: TEST_CANVAS_ID_6006 });
      assertEquals("error" in setBobUniqueCanvasIdResult, false, "Bob setting unique Canvas ID should succeed.");
      const bobCourse = await courseManagementConcept._getCourseById({ courseId: courseIdBob });
      assertEquals(bobCourse?.canvasId, TEST_CANVAS_ID_6006, "Bob's Canvas ID should be set.");

      // Attempt to set Canvas ID for a non-existent course
      const nonExistentCourseId = freshID() as ID;
      const nonExistentSetCanvasIdResult = await courseManagementConcept.setCanvasId({ course: nonExistentCourseId, canvasId: "fake_canvas_id" });
      assertEquals("error" in nonExistentSetCanvasIdResult, true, "Setting Canvas ID for a non-existent course should fail.");
      assertEquals((nonExistentSetCanvasIdResult as { error: string }).error, `Course with ID ${nonExistentCourseId} not found.`);

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: deleteCourse - successfully deletes a course", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };

      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId } = createCourseResult as { course: ID };
      assertExists(courseId);

      // Delete the course
      const deleteResult = await courseManagementConcept.deleteCourse({ course: courseId });
      assertEquals("error" in deleteResult, false, "Course deletion should succeed.");

      // Verify the course is no longer in the database
      const deletedCourse = await courseManagementConcept._getCourseById({ courseId });
      assertEquals(deletedCourse, null, "The course should no longer exist after deletion.");

      const allCourses = await courseManagementConcept._getAllCourses();
      assertEquals(allCourses.length, 0, "There should be no courses left.");

      // Attempt to delete a non-existent course
      const nonExistentCourseId = freshID() as ID;
      const nonExistentDeleteResult = await courseManagementConcept.deleteCourse({ course: nonExistentCourseId });
      assertEquals("error" in nonExistentDeleteResult, true, "Deleting a non-existent course should fail.");
      assertEquals((nonExistentDeleteResult as { error: string }).error, `Course with ID ${nonExistentCourseId} not found.`);

    } finally {
      await client.close();
    }
  });

  ```

**Deadline Management:**

* # file: src/concepts/DueStack/DeadlineManagementConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
  import { Empty, ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";

  // Collection prefix to ensure namespace separation
  const PREFIX = "DeadlineManagement" + ".";

  // Generic types for the concept's external dependencies
  type User = ID; // User ID originating from UserIdentity concept
  type Course = ID; // Course ID originating from CourseManagement concept

  // Internal entity type for a Deadline
  type Deadline = ID;

  /**
   * Enumeration for the source of a deadline.
   * Corresponds to: a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
   */
  enum Source {
    SYLLABUS = "SYLLABUS",
    CANVAS = "CANVAS",
    WEBSITE = "WEBSITE",
    MANUAL = "MANUAL",
    IMAGE = "IMAGE",
    LLM_PARSED = "LLM_PARSED",
  }

  /**
   * Enumeration for the status of a deadline.
   * Corresponds to: an optional status of NOT_STARTED or IN_PROGRESS or DONE
   */
  enum Status {
    NOT_STARTED = "NOT_STARTED",
    IN_PROGRESS = "IN_PROGRESS",
    DONE = "DONE",
  }

  /**
   * State: A set of Deadlines, each associated with a Course, title, due date, source,
   * the User who added it, and an optional status.
   */
  interface DeadlineDoc {
    _id: Deadline; // Primary key for this collection
    course: Course; // Reference to the CourseManagement's Course ID
    title: string;
    due: Date; // DateTime is represented as Date in TypeScript/MongoDB
    source: Source;
    addedBy: User; // Reference to the UserIdentity's User ID
    status?: Status; // Optional completion status
  }

  /**
   * @concept DeadlineManagement
   * @purpose store and manage academic deadlines, tracking their status and association with courses.
   */
  export default class DeadlineManagementConcept {
    deadlines: Collection<DeadlineDoc>;

    constructor(private readonly db: Db) {
      this.deadlines = this.db.collection(PREFIX + "deadlines");
    }

    /**
     * Action: Creates a new deadline.
     * @param {Object} args - The arguments for the action.
     * @param {Course} args.course - The ID of the course this deadline belongs to.
     * @param {string} args.title - The title of the deadline.
     * @param {Date} args.due - The due date and time of the deadline.
     * @param {Source} args.source - The origin of the deadline (e.g., SYLLABUS, MANUAL).
     * @param {User} args.addedBy - The ID of the User who added this deadline.
     * @returns {Promise<{deadline: Deadline} | {error: string}>} A promise that resolves to an object containing the new deadline's ID on success, or an error message on failure.
     * @requires course exists (this is handled by external concepts/syncs, here we assume the ID is valid).
     * @requires title is non-empty.
     * @effects Creates a new deadline with the given details, initially with no status.
     */
    async createDeadline(
      { course, title, due, source, addedBy }: {
        course: Course;
        title: string;
        due: Date;
        source: Source;
        addedBy: User;
      },
    ): Promise<{ deadline: Deadline } | { error: string }> {
      // Basic validation
      if (!title || title.trim() === "") {
        return { error: "Deadline title cannot be empty." };
      }
      if (!Object.values(Source).includes(source)) {
        return { error: `Invalid source: ${source}.` };
      }
      // Note: 'course exists' and 'user exists' are preconditions to be enforced by calling context/syncs
      // as per concept independence. This concept only ensures the ID is of the correct type.

      const deadlineId = freshID() as Deadline;
      await this.deadlines.insertOne({
        _id: deadlineId,
        course,
        title,
        due,
        source,
        addedBy,
        // status is optional, so it's not set initially unless provided explicitly
      });
      return { deadline: deadlineId };
    }

    /**
     * Action: Updates the title, due date, and/or source of an existing deadline.
     * @param {Object} args - The arguments for the action.
     * @param {Deadline} args.deadline - The ID of the deadline to update.
     * @param {string} args.newTitle - The new title of the deadline.
     * @param {Date} args.newDue - The new due date and time of the deadline.
     * @param {Source} args.newSource - The new origin of the deadline.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires deadline exists.
     * @requires newTitle is non-empty.
     * @effects Updates the title, due date, and source of an existing deadline.
     */
    async updateDeadline(
      { deadline, newTitle, newDue, newSource }: {
        deadline: Deadline;
        newTitle: string;
        newDue: Date;
        newSource: Source;
      },
    ): Promise<Empty | { error: string }> {
      const existingDeadline = await this.deadlines.findOne({ _id: deadline });
      if (!existingDeadline) {
        return { error: `Deadline with ID ${deadline} not found.` };
      }
      if (!newTitle || newTitle.trim() === "") {
        return { error: "Deadline title cannot be empty." };
      }
      if (!Object.values(Source).includes(newSource)) {
        return { error: `Invalid source: ${newSource}.` };
      }

      await this.deadlines.updateOne(
        { _id: deadline },
        { $set: { title: newTitle, due: newDue, source: newSource } },
      );
      return {};
    }

    /**
     * Action: Updates the completion status of a deadline.
     * @param {Object} args - The arguments for the action.
     * @param {Deadline} args.deadline - The ID of the deadline to update.
     * @param {Status} args.status - The new status of the deadline.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires deadline exists.
     * @effects Updates the completion status of a deadline.
     */
    async setStatus(
      { deadline, status }: { deadline: Deadline; status: Status },
    ): Promise<Empty | { error: string }> {
      const existingDeadline = await this.deadlines.findOne({ _id: deadline });
      if (!existingDeadline) {
        return { error: `Deadline with ID ${deadline} not found.` };
      }
      if (!Object.values(Status).includes(status)) {
        return { error: `Invalid status: ${status}.` };
      }

      await this.deadlines.updateOne(
        { _id: deadline },
        { $set: { status } },
      );
      return {};
    }

    /**
     * Action: Removes the specified deadline.
     * @param {Object} args - The arguments for the action.
     * @param {Deadline} args.deadline - The ID of the deadline to delete.
     * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
     * @requires deadline exists.
     * @effects Removes the specified deadline.
     */
    async deleteDeadline({ deadline }: { deadline: Deadline }): Promise<Empty | { error: string }> {
      const result = await this.deadlines.deleteOne({ _id: deadline });

      if (result.deletedCount === 0) {
        return { error: `Deadline with ID ${deadline} not found.` };
      }
      return {};
    }

    // --- Query Methods (for internal use and testing) ---

    /**
     * Query: Retrieves a deadline by its ID.
     */
    async _getDeadlineById({ deadlineId }: { deadlineId: Deadline }): Promise<DeadlineDoc | null> {
      return await this.deadlines.findOne({ _id: deadlineId });
    }

    /**
     * Query: Retrieves all deadlines associated with a specific course.
     */
    async _getDeadlinesByCourse({ courseId }: { courseId: Course }): Promise<DeadlineDoc[]> {
      return await this.deadlines.find({ course: courseId }).toArray();
    }

    /**
     * Query: Retrieves all deadlines added by a specific user.
     */
    async _getDeadlinesByAddedBy({ userId }: { userId: User }): Promise<DeadlineDoc[]> {
      return await this.deadlines.find({ addedBy: userId }).toArray();
    }

    /**
     * Query: Retrieves all deadlines.
     */
    async _getAllDeadlines(): Promise<DeadlineDoc[]> {
      return await this.deadlines.find({}).toArray();
    }
  }

  ```
*
* # file: src/concepts/DueStack/DeadlineManagementConcept.test.ts
  ```typescript
  import { assertEquals, assertExists, assertNotEquals, assertStrictEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";
  import UserIdentityConcept from "./UserIdentityConcept.ts"; // Assuming path
  import CourseManagementConcept from "./CourseManagementConcept.ts"; // Assuming path
  import DeadlineManagementConcept from "./DeadlineManagementConcept.ts";

  // Test data constants
  const TEST_EMAIL_ALICE = "alice@example.com";
  const TEST_NAME_ALICE = "Alice Smith";
  const TEST_COURSE_CODE_61040 = "6.1040";
  const TEST_TITLE_61040 = "Software Design and Development";

  const DEADLINE_TITLE_A1 = "Assignment 1: Problem Framing";
  const DEADLINE_DUE_A1 = new Date("2025-09-07T23:59:00Z"); // Example date/time
  const DEADLINE_SOURCE_A1 = "SYLLABUS";

  const DEADLINE_TITLE_P1 = "Pset 1: Concept Design";
  const DEADLINE_DUE_P1 = new Date("2025-09-14T11:59:00Z");
  const DEADLINE_SOURCE_P1 = "MANUAL";

  Deno.test("Principle: Each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);
    const deadlineManagementConcept = new DeadlineManagementConcept(db);

    try {
      // Setup: Create a User and a Course (external generic parameters)
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId61040 } = createCourseResult as { course: ID };
      assertExists(aliceUserId);
      assertExists(courseId61040);

      // 1. Create a deadline linked to a course and user
      const createDeadlineResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: DEADLINE_TITLE_A1,
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any, // Cast as any for enum string literal
        addedBy: aliceUserId,
      });
      assertEquals("error" in createDeadlineResult, false, `Deadline creation should succeed: ${JSON.stringify(createDeadlineResult)}`);
      const { deadline: deadlineIdA1 } = createDeadlineResult as { deadline: ID };
      assertExists(deadlineIdA1);

      // Verify initial state: deadline has due date, title, source, addedBy, and is linked to course
      const createdDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId: deadlineIdA1 });
      assertExists(createdDeadline, "Created deadline should exist.");
      assertEquals(createdDeadline?.title, DEADLINE_TITLE_A1);
      assertEquals(createdDeadline?.due, DEADLINE_DUE_A1);
      assertEquals(createdDeadline?.source, DEADLINE_SOURCE_A1);
      assertStrictEquals(createdDeadline?.addedBy, aliceUserId);
      assertStrictEquals(createdDeadline?.course, courseId61040);
      assertEquals(createdDeadline?.status, undefined, "Status should initially be undefined (optional).");

      // 2. Update the deadline's status
      const setStatusResult = await deadlineManagementConcept.setStatus({ deadline: deadlineIdA1, status: "IN_PROGRESS" as any });
      assertEquals("error" in setStatusResult, false, `Setting status should succeed: ${JSON.stringify(setStatusResult)}`);

      const updatedDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId: deadlineIdA1 });
      assertEquals(updatedDeadline?.status, "IN_PROGRESS", "Deadline status should be updated.");

      // Verify all deadlines for the course
      const courseDeadlines = await deadlineManagementConcept._getDeadlinesByCourse({ courseId: courseId61040 });
      assertEquals(courseDeadlines.length, 1, "There should be one deadline for the course.");
      assertEquals(courseDeadlines[0]._id, deadlineIdA1);

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: createDeadline - enforces title and source requirements", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);
    const deadlineManagementConcept = new DeadlineManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId61040 } = createCourseResult as { course: ID };

      // Requires: title is non-empty
      const emptyTitleResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: "",
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any,
        addedBy: aliceUserId,
      });
      assertEquals("error" in emptyTitleResult, true, "Creating deadline with empty title should fail.");
      assertEquals((emptyTitleResult as { error: string }).error, "Deadline title cannot be empty.");

      const whitespaceTitleResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: "   ",
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any,
        addedBy: aliceUserId,
      });
      assertEquals("error" in whitespaceTitleResult, true, "Creating deadline with whitespace title should fail.");
      assertEquals((whitespaceTitleResult as { error: string }).error, "Deadline title cannot be empty.");

      // Requires: source is a valid enum value
      const invalidSourceResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: "Invalid Source Deadline",
        due: DEADLINE_DUE_A1,
        source: "FAKE_SOURCE" as any, // Invalid enum value
        addedBy: aliceUserId,
      });
      assertEquals("error" in invalidSourceResult, true, "Creating deadline with invalid source should fail.");
      assertEquals((invalidSourceResult as { error: string }).error, "Invalid source: FAKE_SOURCE.");

      const allDeadlines = await deadlineManagementConcept._getAllDeadlines();
      assertEquals(allDeadlines.length, 0, "No deadlines should be created after failed attempts.");
    } finally {
      await client.close();
    }
  });

  Deno.test("Action: updateDeadline - updates fields and enforces requirements", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);
    const deadlineManagementConcept = new DeadlineManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId61040 } = createCourseResult as { course: ID };

      const createDeadlineResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: DEADLINE_TITLE_A1,
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any,
        addedBy: aliceUserId,
      });
      const { deadline: deadlineId } = createDeadlineResult as { deadline: ID };

      // Update successfully
      const newTitle = "Updated Assignment 1";
      const newDue = new Date("2025-09-10T00:00:00Z");
      const newSource = "WEBSITE";
      const updateResult = await deadlineManagementConcept.updateDeadline({
        deadline: deadlineId,
        newTitle,
        newDue,
        newSource: newSource as any,
      });
      assertEquals("error" in updateResult, false, "Deadline update should succeed.");

      const updatedDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId });
      assertEquals(updatedDeadline?.title, newTitle);
      assertEquals(updatedDeadline?.due, newDue);
      assertEquals(updatedDeadline?.source, newSource);

      // Requires: deadline exists
      const nonExistentDeadlineId = freshID() as ID;
      const nonExistentUpdateResult = await deadlineManagementConcept.updateDeadline({
        deadline: nonExistentDeadlineId,
        newTitle: "Fake",
        newDue: new Date(),
        newSource: "MANUAL" as any,
      });
      assertEquals("error" in nonExistentUpdateResult, true, "Updating non-existent deadline should fail.");
      assertEquals((nonExistentUpdateResult as { error: string }).error, `Deadline with ID ${nonExistentDeadlineId} not found.`);

      // Requires: newTitle is non-empty
      const emptyNewTitleResult = await deadlineManagementConcept.updateDeadline({
        deadline: deadlineId,
        newTitle: "",
        newDue: new Date(),
        newSource: "MANUAL" as any,
      });
      assertEquals("error" in emptyNewTitleResult, true, "Updating with empty title should fail.");
      assertEquals((emptyNewTitleResult as { error: string }).error, "Deadline title cannot be empty.");

      // Requires: newSource is a valid enum value
      const invalidNewSourceResult = await deadlineManagementConcept.updateDeadline({
        deadline: deadlineId,
        newTitle: "Still valid",
        newDue: new Date(),
        newSource: "BAD_SOURCE" as any,
      });
      assertEquals("error" in invalidNewSourceResult, true, "Updating with invalid source should fail.");
      assertEquals((invalidNewSourceResult as { error: string }).error, "Invalid source: BAD_SOURCE.");

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: setStatus - updates status and enforces requirements", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);
    const deadlineManagementConcept = new DeadlineManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId61040 } = createCourseResult as { course: ID };

      const createDeadlineResult = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: DEADLINE_TITLE_A1,
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any,
        addedBy: aliceUserId,
      });
      const { deadline: deadlineId } = createDeadlineResult as { deadline: ID };

      // Set status successfully
      const setStatusInProgressResult = await deadlineManagementConcept.setStatus({ deadline: deadlineId, status: "IN_PROGRESS" as any });
      assertEquals("error" in setStatusInProgressResult, false, "Setting status to IN_PROGRESS should succeed.");
      let updatedDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId });
      assertEquals(updatedDeadline?.status, "IN_PROGRESS", "Status should be IN_PROGRESS.");

      const setStatusDoneResult = await deadlineManagementConcept.setStatus({ deadline: deadlineId, status: "DONE" as any });
      assertEquals("error" in setStatusDoneResult, false, "Setting status to DONE should succeed.");
      updatedDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId });
      assertEquals(updatedDeadline?.status, "DONE", "Status should be DONE.");

      // Requires: deadline exists
      const nonExistentDeadlineId = freshID() as ID;
      const nonExistentSetStatusResult = await deadlineManagementConcept.setStatus({ deadline: nonExistentDeadlineId, status: "NOT_STARTED" as any });
      assertEquals("error" in nonExistentSetStatusResult, true, "Setting status for non-existent deadline should fail.");
      assertEquals((nonExistentSetStatusResult as { error: string }).error, `Deadline with ID ${nonExistentDeadlineId} not found.`);

      // Requires: status is a valid enum value
      const invalidStatusResult = await deadlineManagementConcept.setStatus({ deadline: deadlineId, status: "BAD_STATUS" as any });
      assertEquals("error" in invalidStatusResult, true, "Setting invalid status should fail.");
      assertEquals((invalidStatusResult as { error: string }).error, "Invalid status: BAD_STATUS.");

    } finally {
      await client.close();
    }
  });

  Deno.test("Action: deleteDeadline - successfully deletes a deadline", async () => {
    const [db, client] = await testDb();
    const userIdentityConcept = new UserIdentityConcept(db);
    const courseManagementConcept = new CourseManagementConcept(db);
    const deadlineManagementConcept = new DeadlineManagementConcept(db);

    try {
      const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
      const { user: aliceUserId } = createUserResult as { user: ID };
      const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
      const { course: courseId61040 } = createCourseResult as { course: ID };

      const createDeadlineResult1 = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: DEADLINE_TITLE_A1,
        due: DEADLINE_DUE_A1,
        source: DEADLINE_SOURCE_A1 as any,
        addedBy: aliceUserId,
      });
      const { deadline: deadlineId1 } = createDeadlineResult1 as { deadline: ID };

      const createDeadlineResult2 = await deadlineManagementConcept.createDeadline({
        course: courseId61040,
        title: DEADLINE_TITLE_P1,
        due: DEADLINE_DUE_P1,
        source: DEADLINE_SOURCE_P1 as any,
        addedBy: aliceUserId,
      });
      const { deadline: deadlineId2 } = createDeadlineResult2 as { deadline: ID };

      // Delete first deadline
      const deleteResult1 = await deadlineManagementConcept.deleteDeadline({ deadline: deadlineId1 });
      assertEquals("error" in deleteResult1, false, "First deadline deletion should succeed.");

      // Verify it's gone, but the other remains
      const deletedDeadline1 = await deadlineManagementConcept._getDeadlineById({ deadlineId: deadlineId1 });
      assertEquals(deletedDeadline1, null, "Deadline 1 should be deleted.");
      const remainingDeadline = await deadlineManagementConcept._getDeadlineById({ deadlineId: deadlineId2 });
      assertExists(remainingDeadline, "Deadline 2 should still exist.");

      // Delete second deadline
      const deleteResult2 = await deadlineManagementConcept.deleteDeadline({ deadline: deadlineId2 });
      assertEquals("error" in deleteResult2, false, "Second deadline deletion should succeed.");

      const allDeadlines = await deadlineManagementConcept._getAllDeadlines();
      assertEquals(allDeadlines.length, 0, "All deadlines should be deleted.");

      // Attempt to delete a non-existent deadline
      const nonExistentDeadlineId = freshID() as ID;
      const nonExistentDeleteResult = await deadlineManagementConcept.deleteDeadline({ deadline: nonExistentDeadlineId });
      assertEquals("error" in nonExistentDeleteResult, true, "Deleting non-existent deadline should fail.");
      assertEquals((nonExistentDeleteResult as { error: string }).error, `Deadline with ID ${nonExistentDeadlineId} not found.`);

    } finally {
      await client.close();
    }
  });

  ```

**Document Management:**

* # file: src/concepts/DueStack/DocumentManagementConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
  import { Empty, ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";

  // Collection prefix to ensure namespace separation
  const PREFIX = "DocumentManagement" + ".";

  // Generic types for the concept's external dependencies
  type User = ID;
  type Course = ID;

  // Internal entity types, represented as IDs
  type UploadedDocument = ID;

  /**
   * State: A set of UploadedDocuments with metadata and a URL to its content.
   */
  interface UploadedDocumentDoc {
    _id: UploadedDocument;
    course: Course;
    uploader: User;
    fileName: string;
    fileType: string;
    uploadTime: Date;
    contentUrl: string; // URL where the actual file content is stored externally (e.g., GCS, S3)
    processedTextContent: string; // Extracted text content from the file
  }

  /**
   * @concept DocumentManagement
   * @purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots)
   *          and associate them with specific courses and users.
   */
  export default class DocumentManagementConcept {
    documents: Collection<UploadedDocumentDoc>;

    constructor(private readonly db: Db) {
      this.documents = this.db.collection(PREFIX + "documents");
    }

    /**
     * Action: Uploads a document.
     * @requires course exists and rawFileContent is non-empty.
     * @effects Stores the rawFileContent in external storage (simulated), records its contentUrl and metadata.
     *          Simulates text extraction. Returns document ID, extracted text content, and contentUrl.
     */
    async uploadDocument(
      { course, fileName, fileType, rawFileContent, uploader }: {
        course: Course;
        fileName: string;
        fileType: string;
        rawFileContent: string;
        uploader: User;
      },
    ): Promise<
      | {
        document: UploadedDocument;
        processedTextContent: string;
        contentUrl: string;
      }
      | { error: string }
    > {
      // In a real scenario, rawFileContent would be sent to GCS/S3 here,
      // and contentUrl would be the URL returned by the storage service.
      // processedTextContent would be extracted (e.g., via OCR for images/PDFs).
      // For this assignment, we simulate these steps.

      if (!rawFileContent) {
        return { error: "rawFileContent cannot be empty." };
      }
      // Simulate content storage and URL generation
      const simulatedContentUrl = `https://mock-storage.com/${freshID()}/${fileName}`;
      const simulatedProcessedTextContent = `[Extracted Text from ${fileName}]: ${rawFileContent.substring(0, 50)}...`; // Simple simulation

      const documentId = freshID() as UploadedDocument;
      const uploadTime = new Date();

      const newDocument: UploadedDocumentDoc = {
        _id: documentId,
        course,
        uploader,
        fileName,
        fileType,
        uploadTime,
        contentUrl: simulatedContentUrl,
        processedTextContent: simulatedProcessedTextContent,
      };

      await this.documents.insertOne(newDocument);

      return {
        document: documentId,
        processedTextContent: simulatedProcessedTextContent,
        contentUrl: simulatedContentUrl,
      };
    }

    /**
     * Action: Updates an existing document's metadata.
     * @requires document exists.
     * @effects Updates the fileName and fileType of an existing document's metadata.
     */
    async updateDocumentMetadata(
      { document, newFileName, newFileType }: {
        document: UploadedDocument;
        newFileName: string;
        newFileType: string;
      },
    ): Promise<Empty | { error: string }> {
      const result = await this.documents.updateOne(
        { _id: document },
        { $set: { fileName: newFileName, fileType: newFileType } },
      );

      if (result.matchedCount === 0) {
        return { error: `Document with ID ${document} not found.` };
      }
      return {};
    }

    /**
     * Action: Retrieves the stored processed text content of the specified document.
     * @requires document exists.
     * @effects Returns the processed text content.
     */
    async getDocumentContent(
      { document }: { document: UploadedDocument },
    ): Promise<{ processedTextContent: string } | { error: string }> {
      const doc = await this.documents.findOne({ _id: document });
      if (!doc) {
        return { error: `Document with ID ${document} not found.` };
      }
      return { processedTextContent: doc.processedTextContent };
    }

    /**
     * Action: Removes the specified document's metadata and simulates deletion of its content.
     * @requires document exists.
     * @effects Removes the document from the concept state and simulates deletion from external storage.
     */
    async deleteDocument(
      { document }: { document: UploadedDocument },
    ): Promise<Empty | { error: string }> {
      const result = await this.documents.deleteOne({ _id: document });
      if (result.deletedCount === 0) {
        return { error: `Document with ID ${document} not found.` };
      }
      // In a real scenario, trigger deletion from GCS/S3 here using contentUrl
      console.log(`Simulating deletion of content for document ${document}`);
      return {};
    }

    /**
     * Query: Retrieves a document by its ID.
     */
    async _getDocumentById({ document }: { document: UploadedDocument }): Promise<
      UploadedDocumentDoc | null
    > {
      return await this.documents.findOne({ _id: document });
    }

    /**
     * Query: Retrieves all documents uploaded by a specific user.
     */
    async _getDocumentsByUser({ uploader }: { uploader: User }): Promise<
      UploadedDocumentDoc[]
    > {
      return await this.documents.find({ uploader }).toArray();
    }

    /**
     * Query: Retrieves all documents associated with a specific course.
     */
    async _getDocumentsByCourse({ course }: { course: Course }): Promise<
      UploadedDocumentDoc[]
    > {
      return await this.documents.find({ course }).toArray();
    }
  }

  ```
*
* # file: src/concepts/DueStack/DocumentManagementConcept.test.ts
  ```typescript
  import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import DocumentManagementConcept from "./DocumentManagementConcept.ts";

  const userA = "user:Alice" as ID;
  const courseX = "course:CS101" as ID;
  const courseY = "course:CS102" as ID;

  Deno.test("DocumentManagement: Principle - User uploads document, metadata is stored, and content is retrievable", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);

    try {
      const rawContent = "This is the raw content of the syllabus PDF.";
      const fileName = "syllabus.pdf";
      const fileType = "application/pdf";

      // 1. User uploads a document
      const uploadResult = await docConcept.uploadDocument({
        course: courseX,
        fileName,
        fileType,
        rawFileContent: rawContent,
        uploader: userA,
      });
      assertNotEquals("error" in uploadResult, true, "Upload should not fail.");
      const { document, processedTextContent, contentUrl } = uploadResult as {
        document: ID;
        processedTextContent: string;
        contentUrl: string;
      };
      assertExists(document);
      assertExists(processedTextContent);
      assertExists(contentUrl);
      assertEquals(
        processedTextContent.startsWith("[Extracted Text from syllabus.pdf]:"),
        true,
        "Processed text should be simulated.",
      );
      assertEquals(
        contentUrl.startsWith("https://mock-storage.com/"),
        true,
        "Content URL should be simulated.",
      );

      // Verify document metadata is stored
      const storedDoc = await docConcept._getDocumentById({ document });
      assertExists(storedDoc);
      assertEquals(storedDoc.fileName, fileName);
      assertEquals(storedDoc.fileType, fileType);
      assertEquals(storedDoc.uploader, userA);
      assertEquals(storedDoc.course, courseX);
      assertEquals(storedDoc.contentUrl, contentUrl);
      assertEquals(storedDoc.processedTextContent, processedTextContent);

      // 2. Content is retrievable
      const getContentResult = await docConcept.getDocumentContent({ document });
      assertNotEquals(
        "error" in getContentResult,
        true,
        "Getting content should not fail.",
      );
      const { processedTextContent: retrievedContent } = getContentResult as {
        processedTextContent: string;
      };
      assertEquals(retrievedContent, processedTextContent);

      // 3. Document metadata can be updated
      const updateMetadataResult = await docConcept.updateDocumentMetadata({
        document,
        newFileName: "new_syllabus.pdf",
        newFileType: "text/plain",
      });
      assertEquals(
        "error" in updateMetadataResult,
        false,
        "Updating metadata should succeed.",
      );
      const updatedDoc = await docConcept._getDocumentById({ document });
      assertExists(updatedDoc);
      assertEquals(updatedDoc.fileName, "new_syllabus.pdf");
      assertEquals(updatedDoc.fileType, "text/plain");

      // 4. Document can be deleted
      const deleteResult = await docConcept.deleteDocument({ document });
      assertEquals("error" in deleteResult, false, "Deletion should succeed.");
      const deletedDoc = await docConcept._getDocumentById({ document });
      assertEquals(deletedDoc, null, "Document should no longer exist.");
    } finally {
      await client.close();
    }
  });

  Deno.test("DocumentManagement: uploadDocument requires rawFileContent to be non-empty", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);

    try {
      const result = await docConcept.uploadDocument({
        course: courseX,
        fileName: "empty.txt",
        fileType: "text/plain",
        rawFileContent: "",
        uploader: userA,
      });
      assertEquals("error" in result, true, "Upload with empty content should fail.");
      assertEquals(
        (result as { error: string }).error,
        "rawFileContent cannot be empty.",
      );
    } finally {
      await client.close();
    }
  });

  Deno.test("DocumentManagement: updateDocumentMetadata fails for non-existent document", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);
    const nonExistentDocId = "doc:fake" as ID;

    try {
      const result = await docConcept.updateDocumentMetadata({
        document: nonExistentDocId,
        newFileName: "fake.txt",
        newFileType: "text/plain",
      });
      assertEquals(
        "error" in result,
        true,
        "Updating metadata for non-existent document should fail.",
      );
    } finally {
      await client.close();
    }
  });

  Deno.test("DocumentManagement: getDocumentContent fails for non-existent document", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);
    const nonExistentDocId = "doc:fake" as ID;

    try {
      const result = await docConcept.getDocumentContent({
        document: nonExistentDocId,
      });
      assertEquals(
        "error" in result,
        true,
        "Getting content for non-existent document should fail.",
      );
    } finally {
      await client.close();
    }
  });

  Deno.test("DocumentManagement: deleteDocument fails for non-existent document", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);
    const nonExistentDocId = "doc:fake" as ID;

    try {
      const result = await docConcept.deleteDocument({
        document: nonExistentDocId,
      });
      assertEquals(
        "error" in result,
        true,
        "Deleting non-existent document should fail.",
      );
    } finally {
      await client.close();
    }
  });

  Deno.test("DocumentManagement: Multiple documents for different users/courses", async () => {
    const [db, client] = await testDb();
    const docConcept = new DocumentManagementConcept(db);

    const userB = "user:Bob" as ID;

    try {
      const doc1Result = await docConcept.uploadDocument({
        course: courseX,
        fileName: "doc1.txt",
        fileType: "text/plain",
        rawFileContent: "Content for doc1.",
        uploader: userA,
      });
      const { document: doc1 } = doc1Result as { document: ID };

      const doc2Result = await docConcept.uploadDocument({
        course: courseY,
        fileName: "doc2.pdf",
        fileType: "application/pdf",
        rawFileContent: "Content for doc2.",
        uploader: userA,
      });
      const { document: doc2 } = doc2Result as { document: ID };

      const doc3Result = await docConcept.uploadDocument({
        course: courseX,
        fileName: "doc3.jpg",
        fileType: "image/jpeg",
        rawFileContent: "Content for doc3.",
        uploader: userB,
      });
      const { document: doc3 } = doc3Result as { document: ID };

      const docsUserA = await docConcept._getDocumentsByUser({ uploader: userA });
      assertEquals(docsUserA.length, 2, "UserA should have 2 documents.");
      assertExists(docsUserA.find((d) => d._id === doc1));
      assertExists(docsUserA.find((d) => d._id === doc2));

      const docsUserB = await docConcept._getDocumentsByUser({ uploader: userB });
      assertEquals(docsUserB.length, 1, "UserB should have 1 document.");
      assertExists(docsUserB.find((d) => d._id === doc3));

      const docsCourseX = await docConcept._getDocumentsByCourse({ course: courseX });
      assertEquals(docsCourseX.length, 2, "CourseX should have 2 documents.");
      assertExists(docsCourseX.find((d) => d._id === doc1));
      assertExists(docsCourseX.find((d) => d._id === doc3));

      const docsCourseY = await docConcept._getDocumentsByCourse({ course: courseY });
      assertEquals(docsCourseY.length, 1, "CourseY should have 1 document.");
      assertExists(docsCourseY.find((d) => d._id === doc2));
    } finally {
      await client.close();
    }
  });

  ```

**Suggestion Management:**

* # file: src/concepts/DueStack/SuggestionManagementConcept.ts
  ```typescript
  import { Collection, Db } from "npm:mongodb";
  import { Empty, ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts";

  // Collection prefix to ensure namespace separation
  const PREFIX = "SuggestionManagement" + ".";

  // Generic types for the concept's external dependencies
  type User = ID;
  type Document = ID; // From DocumentManagement
  type Course = ID; // From CourseManagement

  // Internal entity types, represented as IDs
  type ParsedDeadlineSuggestion = ID;
  type ExtractionConfig = ID;

  /**
   * State: A set of ParsedDeadlineSuggestions representing extracted deadline candidates.
   */
  interface ParsedDeadlineSuggestionDoc {
    _id: ParsedDeadlineSuggestion;
    user: User; // The user who initiated the parsing
    document?: Document; // ID of the UploadedDocument if applicable
    canvasMetadata?: string; // Raw JSON data from Canvas
    websiteUrl?: string;
    title: string;
    due: Date;
    source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS";
    confirmed: boolean;
    confidence?: number; // 0.0 - 1.0
    extractionMethod?: "CANVAS_JSON" | "LLM";
    provenance?: string;
    warnings?: string[];
  }

  /**
   * State: A set of ExtractionConfigs for LLM processing.
   */
  interface ExtractionConfigDoc {
    _id: ExtractionConfig;
    name: string;
    modelVersion: string;
    basePromptTemplate: string;
    maxTokens: number;
    temperature: number;
    timezone: string;
    timeout?: number;
  }

  /**
   * @concept SuggestionManagement
   * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas;
   *          optionally AI-augmented.
   * @principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data;
   *            users confirm suggestions before they become official deadlines.
   */
  export default class SuggestionManagementConcept {
    suggestions: Collection<ParsedDeadlineSuggestionDoc>;
    extractionConfigs: Collection<ExtractionConfigDoc>;

    constructor(private readonly db: Db) {
      this.suggestions = this.db.collection(PREFIX + "suggestions");
      this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
    }

    /**
     * Action: Creates a new extraction configuration.
     * @requires name is unique.
     * @effects Creates a new ExtractionConfig entity for LLM processing.
     */
    async createExtractionConfig(
      { name, modelVersion, basePromptTemplate, maxTokens, temperature, timezone, optionalTimeout }: {
        name: string;
        modelVersion: string;
        basePromptTemplate: string;
        maxTokens: number;
        temperature: number;
        timezone: string;
        optionalTimeout?: number;
      },
    ): Promise<{ config: ExtractionConfig } | { error: string }> {
      const existingConfig = await this.extractionConfigs.findOne({ name });
      if (existingConfig) {
        return { error: `Extraction config with name '${name}' already exists.` };
      }

      const configId = freshID() as ExtractionConfig;
      await this.extractionConfigs.insertOne({
        _id: configId,
        name,
        modelVersion,
        basePromptTemplate,
        maxTokens,
        temperature,
        timezone,
        timeout: optionalTimeout,
      });
      return { config: configId };
    }

    // --- LLM/Parsing Simulation Methods ---
    private async _simulateLLMExtraction(
      user: User,
      source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS",
      contentIdentifier: Document | string, // documentId, canvasMetadata, or websiteUrl
      content: string,
      config: ExtractionConfig,
    ): Promise<ParsedDeadlineSuggestionDoc[]> {
      // In a real application, this would involve calling an LLM API.
      // For this simulation, we generate mock suggestions based on keywords.
      const configDoc = await this.extractionConfigs.findOne({ _id: config });
      if (!configDoc) {
        console.warn(`Config ${config} not found. Using default mock behavior.`);
      }

      const mockSuggestions: ParsedDeadlineSuggestionDoc[] = [];
      const lowerContent = content.toLowerCase();

      if (lowerContent.includes("assignment 1")) {
        mockSuggestions.push({
          _id: freshID() as ParsedDeadlineSuggestion,
          user,
          document: source !== "CANVAS" && source !== "WEBSITE"
            ? (contentIdentifier as Document)
            : undefined,
          websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
          canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
          title: "Assignment 1: Introduction",
          due: new Date(new Date().getFullYear(), 8, 15, 23, 59), // Sept 15
          source,
          confirmed: false,
          confidence: 0.95,
          extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
          provenance: `Simulated LLM from ${source}`,
        });
      }
      if (lowerContent.includes("final project")) {
        mockSuggestions.push({
          _id: freshID() as ParsedDeadlineSuggestion,
          user,
          document: source !== "CANVAS" && source !== "WEBSITE"
            ? (contentIdentifier as Document)
            : undefined,
          websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
          canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
          title: "Final Project Submission",
          due: new Date(new Date().getFullYear(), 11, 20, 17, 0), // Dec 20
          source,
          confirmed: false,
          confidence: 0.88,
          extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
          provenance: `Simulated LLM from ${source}`,
          warnings: ["Date might be ambiguous"],
        });
      }
      return mockSuggestions;
    }

    /**
     * Action: Parses assignment JSON data from Canvas.
     * @requires config exists and canvasData is valid JSON.
     * @effects Creates suggestions linked to `user`, sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
     */
    async parseFromCanvas(
      { user, canvasData, config }: {
        user: User;
        canvasData: string;
        config: ExtractionConfig;
      },
    ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
      const configExists = await this.extractionConfigs.findOne({ _id: config });
      if (!configExists) {
        return { error: `Extraction config with ID ${config} not found.` };
      }
      try {
        JSON.parse(canvasData); // Validate JSON
      } catch (e) {
        return { error: "canvasData is not valid JSON." };
      }

      const mockSuggestions = await this._simulateLLMExtraction(
        user,
        "CANVAS",
        canvasData, // Use canvasData as identifier for simulation
        canvasData,
        config,
      );
      const suggestionIds = mockSuggestions.map((s) => s._id);
      await this.suggestions.insertMany(mockSuggestions);
      return { suggestions: suggestionIds };
    }

    /**
     * Action: Uses LLM to extract structured suggestions from document content.
     * @requires config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM.
     * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).
     */
    async llmExtractFromDocument(
      { user, documentId, documentContent, config }: {
        user: User;
        documentId: Document;
        documentContent: string;
        config: ExtractionConfig;
      },
    ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
      const configExists = await this.extractionConfigs.findOne({ _id: config });
      if (!configExists) {
        return { error: `Extraction config with ID ${config} not found.` };
      }
      if (!documentContent) {
        return { error: "documentContent cannot be empty for LLM extraction." };
      }

      const mockSuggestions = await this._simulateLLMExtraction(
        user,
        "SYLLABUS", // Or IMAGE, depending on how `documentContent` is handled
        documentId,
        documentContent,
        config,
      );
      const suggestionIds = mockSuggestions.map((s) => s._id);
      await this.suggestions.insertMany(mockSuggestions);
      return { suggestions: suggestionIds };
    }

    /**
     * Action: Sends combined document contents to LLM in SINGLE request to enable cross-referencing.
     * @requires config exists, combinedDocumentContent is non-empty and suitable for LLM.
     * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).
     */
    async llmExtractFromMultipleDocuments(
      { user, documentIds, combinedDocumentContent, config }: { // Corrected signature to match spec
        user: User;
        documentIds: Document[]; // List<Document> from spec
        combinedDocumentContent: string; // String from spec
        config: ExtractionConfig;
      },
    ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
      const configExists = await this.extractionConfigs.findOne({ _id: config });
      if (!configExists) {
        return { error: `Extraction config with ID ${config} not found.` };
      }
      if (!combinedDocumentContent) { // Check combined content
        return { error: "combinedDocumentContent cannot be empty for multiple extraction." };
      }
      if (!documentIds || documentIds.length === 0) {
          // While the LLM processes combined content, having the IDs for provenance is important.
          // This is a softer requirement, but good for data integrity.
          console.warn("No documentIds provided for multiple extraction, provenance might be less precise.");
      }


      const mockSuggestions = await this._simulateLLMExtraction(
        user,
        "SYLLABUS",
        documentIds.join(", "), // Use joined IDs as identifier for simulation
        combinedDocumentContent,
        config,
      ); // Simulate combined extraction
      const suggestionIds = mockSuggestions.map((s) => s._id);
      await this.suggestions.insertMany(mockSuggestions);
      return { suggestions: suggestionIds };
    }

    /**
     * Action: Uses LLM to parse website content into deadline suggestions.
     * @requires config exists, url is reachable, websiteContent is non-empty.
     * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
     */
    async llmExtractFromWebsite(
      { user, url, websiteContent, config }: {
        user: User;
        url: string;
        websiteContent: string;
        config: ExtractionConfig;
      },
    ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
      const configExists = await this.extractionConfigs.findOne({ _id: config });
      if (!configExists) {
        return { error: `Extraction config with ID ${config} not found.` };
      }
      if (!url || !url.startsWith("https://")) {
        return { error: "Invalid URL provided." };
      }
      if (!websiteContent) {
        return { error: "websiteContent cannot be empty for LLM extraction." };
      }

      const mockSuggestions = await this._simulateLLMExtraction(
        user,
        "WEBSITE",
        url,
        websiteContent,
        config,
      );
      const suggestionIds = mockSuggestions.map((s) => s._id);
      await this.suggestions.insertMany(mockSuggestions);
      return { suggestions: suggestionIds };
    }

    /**
     * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
     * @requires suggestion exists, feedback is non-empty, config exists.
     * @effects Updates title, due, warnings, or confidence of the suggestion.
     */
    async refineWithFeedback(
      { suggestion, feedback, config }: {
        suggestion: ParsedDeadlineSuggestion;
        feedback: string;
        config: ExtractionConfig;
      },
    ): Promise<{ suggestion: ParsedDeadlineSuggestion } | { error: string }> {
      const configExists = await this.extractionConfigs.findOne({ _id: config });
      if (!configExists) {
        return { error: `Extraction config with ID ${config} not found.` };
      }
      if (!feedback) {
        return { error: "Feedback cannot be empty." };
      }

      const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
      if (!existingSuggestion) {
        return { error: `Suggestion with ID ${suggestion} not found.` };
      }

      // Simulate LLM refinement based on feedback.
      // For example, if feedback contains "due at 11:59 PM", update the time.
      let newDue = existingSuggestion.due;
      if (feedback.includes("11:59 PM")) {
        newDue.setHours(23, 59, 0, 0);
      }

      const updatedWarnings = existingSuggestion.warnings || [];
      if (!updatedWarnings.includes("Refined by user feedback")) {
        updatedWarnings.push("Refined by user feedback");
      }

      await this.suggestions.updateOne(
        { _id: suggestion },
        {
          $set: {
            due: newDue,
            warnings: updatedWarnings,
            confidence: existingSuggestion.confidence ? Math.min(existingSuggestion.confidence + 0.05, 1.0) : 0.9, // Simulate confidence increase
            provenance: `${existingSuggestion.provenance}, Refined by feedback: ${feedback}`,
          },
        },
      );

      return { suggestion };
    }

    /**
     * Action: Updates suggestion title and due date.
     * @requires suggestion exists, newTitle is non-empty, newDue is valid.
     * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
     */
    async editSuggestion(
      { suggestion, newTitle, newDue }: {
        suggestion: ParsedDeadlineSuggestion;
        newTitle: string;
        newDue: Date;
      },
    ): Promise<Empty | { error: string }> {
      const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
      if (!existingSuggestion) {
        return { error: `Suggestion with ID ${suggestion} not found.` };
      }
      if (!newTitle) {
        return { error: "New title cannot be empty." };
      }
      if (isNaN(newDue.getTime())) {
        return { error: "New due date is invalid." };
      }

      const updatedWarnings = existingSuggestion.warnings || [];
      if (!updatedWarnings.includes("Manually edited")) {
        updatedWarnings.push("Manually edited");
      }

      await this.suggestions.updateOne(
        { _id: suggestion },
        { $set: { title: newTitle, due: newDue, warnings: updatedWarnings } },
      );
      return {};
    }

    /**
     * Action: Updates suggestion title.
     * @requires suggestion exists and newTitle is non-empty.
     * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
     */
    async updateSuggestionTitle(
      { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
    ): Promise<Empty | { error: string }> {
      const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
      if (!existingSuggestion) {
        return { error: `Suggestion with ID ${suggestion} not found.` };
      }
      if (!newTitle) {
        return { error: "New title cannot be empty." };
      }

      const updatedWarnings = existingSuggestion.warnings || [];
      if (!updatedWarnings.includes("Manually edited")) {
        updatedWarnings.push("Manually edited");
      }

      await this.suggestions.updateOne(
        { _id: suggestion },
        { $set: { title: newTitle, warnings: updatedWarnings } },
      );
      return {};
    }

    /**
     * Action: Updates suggestion due date.
     * @requires suggestion exists and newDue is valid.
     * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
     */
    async updateSuggestionDate(
      { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
    ): Promise<Empty | { error: string }> {
      const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
      if (!existingSuggestion) {
        return { error: `Suggestion with ID ${suggestion} not found.` };
      }
      if (isNaN(newDue.getTime())) {
        return { error: "New due date is invalid." };
      }

      const updatedWarnings = existingSuggestion.warnings || [];
      if (!updatedWarnings.includes("Manually edited")) {
        updatedWarnings.push("Manually edited");
      }

      await this.suggestions.updateOne(
        { _id: suggestion },
        { $set: { due: newDue, warnings: updatedWarnings } },
      );
      return {};
    }

    /**
     * Action: Marks a suggestion as confirmed, and returns the data for creating a new Deadline.
     * @requires suggestion exists, is not already confirmed, has valid title and due date, and course exists.
     * @effects Marks suggestion as confirmed, and emits canonical data to `Deadlines.create`.
     */
    async confirm(
      { suggestion, course, addedBy }: {
        suggestion: ParsedDeadlineSuggestion;
        course: Course;
        addedBy: User;
      },
    ): Promise<
      | {
        course: Course;
        title: string;
        due: Date;
        source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
        addedBy: User;
      }
      | { error: string }
    > {
      const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
      if (!existingSuggestion) {
        return { error: `Suggestion with ID ${suggestion} not found.` };
      }
      if (existingSuggestion.confirmed) {
        return { error: `Suggestion with ID ${suggestion} is already confirmed.` };
      }
      if (!existingSuggestion.title || isNaN(existingSuggestion.due.getTime())) {
        return { error: "Suggestion has invalid title or due date and cannot be confirmed." };
      }
      // In a real app, you might validate `course` existence via `CourseManagement._getCourseById` or similar if direct querying were allowed (it's not, without a sync).
      // For this concept, we assume the `course` ID passed is valid for the `DeadlineManagement` concept.

      await this.suggestions.updateOne({ _id: suggestion }, { $set: { confirmed: true } });

      return {
        course,
        title: existingSuggestion.title,
        due: existingSuggestion.due,
        source: existingSuggestion.source,
        addedBy,
      };
    }

    // --- Queries ---
    async _getSuggestionById(
      { suggestion }: { suggestion: ParsedDeadlineSuggestion },
    ): Promise<ParsedDeadlineSuggestionDoc | null> {
      return await this.suggestions.findOne({ _id: suggestion });
    }

    async _getSuggestionsByUser(
      { user }: { user: User },
    ): Promise<ParsedDeadlineSuggestionDoc[]> {
      return await this.suggestions.find({ user }).toArray();
    }

    async _getUnconfirmedSuggestionsByUser(
      { user }: { user: User },
    ): Promise<ParsedDeadlineSuggestionDoc[]> {
      return await this.suggestions.find({ user, confirmed: false }).toArray();
    }
  }


  ```
*
* # file: src/concepts/DueStack/SuggestionManagementConcept.test.ts
  ```typescript
  import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
  import { testDb } from "@utils/database.ts";
  import { ID } from "@utils/types.ts";
  import { freshID } from "@utils/database.ts"; // Required for generating document IDs in mock data
  import SuggestionManagementConcept from "./SuggestionManagementConcept.ts";

  const userA = "user:Alice" as ID;
  const document1 = "document:doc1" as ID;
  const document2 = "document:doc2" as ID; // Added for multi-document test
  const courseX = "course:CS101" as ID;
  const LLM_CONFIG_NAME = "default_llm_config";
  const CANVAS_CONFIG_NAME = "default_canvas_config";

  Deno.test("SuggestionManagement: Principle - Suggestions produced, refined, and confirmed", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);

    try {
      // Setup: Create LLM and Canvas configs
      const createLlmConfigResult = await suggestionConcept.createExtractionConfig({
        name: LLM_CONFIG_NAME,
        modelVersion: "LLaMA-3",
        basePromptTemplate: "Extract deadlines from text.",
        maxTokens: 500,
        temperature: 0.7,
        timezone: "America/New_York",
      });
      assertNotEquals("error" in createLlmConfigResult, true, "LLM config creation should succeed.");
      const { config: llmConfig } = createLlmConfigResult as { config: ID };

      const createCanvasConfigResult = await suggestionConcept.createExtractionConfig({
        name: CANVAS_CONFIG_NAME,
        modelVersion: "CANVAS_JSON",
        basePromptTemplate: "Parse Canvas JSON for deadlines.",
        maxTokens: 500,
        temperature: 0.0,
        timezone: "America/New_York",
      });
      assertNotEquals("error" in createCanvasConfigResult, true, "Canvas config creation should succeed.");
      // const { config: canvasConfig } = createCanvasConfigResult as { config: ID }; // Not directly used in this principle trace

      // 1. Suggestions are produced via an LLM from uploaded files (simulated)
      const docContent = "Assignment 1 due on 2025-09-15. Final project due Dec 20, 2025.";
      const extractDocResult = await suggestionConcept.llmExtractFromDocument({
        user: userA,
        documentId: document1,
        documentContent: docContent,
        config: llmConfig,
      });
      assertNotEquals("error" in extractDocResult, true, "LLM extraction from document should succeed.");
      const { suggestions: docSuggestions } = extractDocResult as { suggestions: ID[] };
      assertEquals(docSuggestions.length, 2, "Should extract 2 suggestions from document.");

      const s1 = await suggestionConcept._getSuggestionById({ suggestion: docSuggestions[0] });
      assertExists(s1);
      assertEquals(s1.title, "Assignment 1: Introduction");
      assertEquals(s1.user, userA);
      assertEquals(s1.document, document1);
      assertEquals(s1.confirmed, false);

      // 2. User refines a suggestion
      const refineResult = await suggestionConcept.refineWithFeedback({
        suggestion: s1._id,
        feedback: "The due time should be 11:59 PM.",
        config: llmConfig,
      });
      assertNotEquals("error" in refineResult, true, "Refinement should succeed.");
      const refinedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
      assertExists(refinedS1);
      assertEquals(refinedS1.due.getHours(), 23, "Due hour should be updated to 23 (11 PM).");
      assertEquals(refinedS1.due.getMinutes(), 59, "Due minute should be updated to 59.");
      assertExists(refinedS1.warnings?.includes("Refined by user feedback"), "Warnings should include 'Refined by user feedback'.");

      // 3. User edits a suggestion manually
      const newDate = new Date(refinedS1.due.getFullYear(), refinedS1.due.getMonth(), refinedS1.due.getDate() + 1, 23, 59);
      const editResult = await suggestionConcept.editSuggestion({
        suggestion: s1._id,
        newTitle: "Revised Assignment 1",
        newDue: newDate,
      });
      assertEquals("error" in editResult, false, "Manual edit should succeed.");
      const editedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
      assertExists(editedS1);
      assertEquals(editedS1.title, "Revised Assignment 1");
      assertEquals(editedS1.due.getDate(), s1.due.getDate() + 1, "Date should be incremented by 1.");
      assertExists(editedS1.warnings?.includes("Manually edited"), "Warnings should include 'Manually edited'.");

      // 4. Users confirm suggestions before they become official deadlines
      const confirmResult = await suggestionConcept.confirm({
        suggestion: s1._id,
        course: courseX,
        addedBy: userA,
      });
      assertNotEquals("error" in confirmResult, true, "Confirmation should succeed.");
      const confirmedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
      assertExists(confirmedS1);
      assertEquals(confirmedS1.confirmed, true, "Suggestion should be marked as confirmed.");

      const { course, title, due, source, addedBy } = confirmResult as {
        course: ID;
        title: string;
        due: Date;
        source: string;
        addedBy: ID;
      };
      assertEquals(course, courseX);
      assertEquals(title, editedS1.title);
      assertEquals(due, editedS1.due);
      assertEquals(source, editedS1.source);
      assertEquals(addedBy, userA);
    } finally {
      await client.close();
    }
  });

  Deno.test("SuggestionManagement: createExtractionConfig requires unique name", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);

    try {
      const createResult1 = await suggestionConcept.createExtractionConfig({
        name: "unique_config",
        modelVersion: "v1",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      });
      assertEquals("error" in createResult1, false, "First config creation should succeed.");

      const createResult2 = await suggestionConcept.createExtractionConfig({
        name: "unique_config",
        modelVersion: "v2",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      });
      assertEquals("error" in createResult2, true, "Second config with same name should fail.");
    } finally {
      await client.close();
    }
  });

  Deno.test("SuggestionManagement: llmExtractFromDocument handles invalid config/content", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);
    const fakeConfigId = "config:fake" as ID;

    try {
      const result1 = await suggestionConcept.llmExtractFromDocument({
        user: userA,
        documentId: document1,
        documentContent: "some content",
        config: fakeConfigId,
      });
      assertEquals("error" in result1, true, "Should fail with non-existent config.");

      const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
        name: LLM_CONFIG_NAME,
        modelVersion: "v1",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      })) as { config: ID };

      const result2 = await suggestionConcept.llmExtractFromDocument({
        user: userA,
        documentId: document1,
        documentContent: "",
        config: llmConfig,
      });
      assertEquals("error" in result2, true, "Should fail with empty document content.");
    } finally {
      await client.close();
    }
  });

  Deno.test("SuggestionManagement: confirm requirements are enforced", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);

    // Setup
    const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
      name: LLM_CONFIG_NAME,
      modelVersion: "v1",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    })) as { config: ID };
    const docContent = "Assignment 1 due on 2025-09-15.";
    const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
      user: userA,
      documentId: document1,
      documentContent: docContent,
      config: llmConfig,
    })) as { suggestions: ID[] };

    try {
      // Already confirmed
      await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
      const res1 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
      assertEquals("error" in res1, true, "Should fail if suggestion is already confirmed.");

      // Non-existent suggestion
      const fakeSuggestionId = "suggestion:fake" as ID;
      const res2 = await suggestionConcept.confirm({ suggestion: fakeSuggestionId, course: courseX, addedBy: userA });
      assertEquals("error" in res2, true, "Should fail for non-existent suggestion.");

      // Invalid title/due (simulated by modifying directly in DB)
      await suggestionConcept.suggestions.updateOne({ _id: s1Id }, { $set: { title: "" } });
      const res3 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
      assertEquals("error" in res3, true, "Should fail if suggestion has invalid title.");
    } finally {
      await client.close();
    }
  });

  Deno.test("SuggestionManagement: llmExtractFromMultipleDocuments works with combined content", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);

    try {
      const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
        name: LLM_CONFIG_NAME,
        modelVersion: "v1",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      })) as { config: ID };

      const docIds = [document1, document2];
      const combinedContent = "Assignment 1 details here. Final project due date.";

      const result = await suggestionConcept.llmExtractFromMultipleDocuments({
        user: userA,
        documentIds: docIds,
        combinedDocumentContent: combinedContent,
        config: llmConfig,
      });
      assertNotEquals("error" in result, true, "Multiple document extraction should succeed.");
      const { suggestions } = result as { suggestions: ID[] };
      assertEquals(suggestions.length, 2, "Should extract multiple suggestions from combined content.");
      const s1 = await suggestionConcept._getSuggestionById({ suggestion: suggestions[0] });
      assertExists(s1);
      assertEquals(s1.user, userA);
      // In simulation, provenance might just use the joined IDs, or a generic string.
      assertExists(s1.provenance?.includes(document1.toString()) || s1.provenance?.includes("multi-document"));
    } finally {
      await client.close();
    }
  });

  Deno.test("SuggestionManagement: editSuggestion/updateSuggestionTitle/Date updates and adds warnings", async () => {
    const [db, client] = await testDb();
    const suggestionConcept = new SuggestionManagementConcept(db);

    try {
      const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
        name: LLM_CONFIG_NAME,
        modelVersion: "v1",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      })) as { config: ID };

      const docContent = "Assignment X due 2025-10-01.";
      const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
        user: userA,
        documentId: document1,
        documentContent: docContent,
        config: llmConfig,
      })) as { suggestions: ID[] };

      let s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
      assertExists(s1);
      assertEquals(s1.title, "Assignment 1: Introduction"); // Mock LLM always returns this for "assignment 1"
      assertEquals(s1.due.getMonth(), 8); // Sept (0-indexed)

      // Update title
      const updateTitleResult = await suggestionConcept.updateSuggestionTitle({
        suggestion: s1Id,
        newTitle: "Revised Assignment X",
      });
      assertEquals("error" in updateTitleResult, false, "Updating title should succeed.");
      s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
      assertExists(s1);
      assertEquals(s1.title, "Revised Assignment X");
      assertExists(s1.warnings?.includes("Manually edited"), "Warnings should include 'Manually edited'.");

      // Update date
      const newDueDate = new Date(2025, 9, 15); // Oct 15
      const updateDateResult = await suggestionConcept.updateSuggestionDate({
        suggestion: s1Id,
        newDue: newDueDate,
      });
      assertEquals("error" in updateDateResult, false, "Updating date should succeed.");
      s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
      assertExists(s1);
      assertEquals(s1.due.getMonth(), 9); // Oct
      assertEquals(s1.due.getDate(), 15);
      assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");

      // Edit both
      const finalDueDate = new Date(2025, 10, 1); // Nov 1
      const editBothResult = await suggestionConcept.editSuggestion({
        suggestion: s1Id,
        newTitle: "Final Assignment",
        newDue: finalDueDate,
      });
      assertEquals("error" in editBothResult, false, "Editing both should succeed.");
      s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
      assertExists(s1);
      assertEquals(s1.title, "Final Assignment");
      assertEquals(s1.due.getMonth(), 10); // Nov
      assertEquals(s1.due.getDate(), 1);
      assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");
    } finally {
      await client.close();
    }
  });
  ```

**Total: 12 files** (6 concept implementations + 6 test files)
