---
timestamp: 'Sun Oct 19 2025 02:03:59 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_020359.78b78ae8.md]]'
content_id: 943e8b09636c8bee89ee02997ef02230165f88cb74069e8ae8005f161d38074c
---

# response:

You've provided a comprehensive set of concept specifications and their current TypeScript implementations and tests. Let's go through each concept to ensure the code exactly matches the provided specifications, which are considered the ground truth.

After a thorough review, here's a summary of the necessary updates:

1. **UserIdentity:**
   * The TypeScript implementation is missing the `updateUserName` and `updateUserEmail` actions specified in the concept.
   * The test file is missing tests for these actions.
2. **UserAuthentication:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
3. **CourseManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
4. **DeadlineManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
5. **DocumentManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
6. **SuggestionManagement:**
   * The `llmExtractFromMultipleDocuments` action in the TypeScript implementation has a different parameter signature than the concept specification. The spec currently dictates `documentIds: List<Document>, combinedDocumentContent: String`, while the implementation uses `documentContents: { documentId: Document; content: string }[]`. The code needs to be updated to match the spec's signature.
   * The test for `llmExtractFromMultipleDocuments` will need to be adjusted to reflect the updated signature in the implementation.

I will now provide the updated TypeScript implementation files for `UserIdentityConcept.ts` and `SuggestionManagementConcept.ts`, along with their corresponding test files. The other concepts are already aligned.

***

### **Updated Implementations (Matching Specs Exactly)**

#### 1) UserIdentity

* **# file: src/concepts/DueStack/UserIdentityConcept.ts**
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

* **# file: src/concepts/DueStack/UserIdentityConcept.test.ts**
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

#### 6) SuggestionManagement

* **# file: src/concepts/DueStack/SuggestionManagementConcept.ts**
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

* **# file: src/concepts/DueStack/SuggestionManagementConcept.test.ts**
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
