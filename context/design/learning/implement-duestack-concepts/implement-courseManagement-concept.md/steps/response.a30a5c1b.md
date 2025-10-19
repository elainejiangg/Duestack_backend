---
timestamp: 'Sun Oct 19 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010512.56841c14.md]]'
content_id: a30a5c1b26d4d1c119891615ee154f1a33ec6294b2d685ffc628cb9e1d09d173
---

# response:

Okay, let's break down the implementation of the `UserAuthenticationConcept` and its tests, aligning each part with the concept specification and explaining the rationale behind the choices.

***

### `src/userauthentication/UserAuthenticationConcept.ts` Implementation Explained

This file implements the `UserAuthentication` concept, handling user registration, login, logout, password changes, and Canvas integration.

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

***

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The file name `UserAuthenticationConcept.ts` directly corresponds to the `UserAuthentication` concept.
* **Implementation Details & Rationale:**
  * `import { Collection, Db } from "npm:mongodb";`: Standard imports for MongoDB interactions.
  * `import { Empty, ID } from "@utils/types.ts"; import { freshID } from "@utils/database.ts";`: Imports for our project's utility types (`ID` for opaque identifiers, `Empty` for actions returning no specific data) and ID generation. This aligns with the concept design's emphasis on using opaque IDs for generic parameters and specific return structures.
  * `import { createHash } from "node:crypto";`: Deno's `node:crypto` module is used for basic password hashing (SHA256).
  * `const PREFIX = "UserAuthentication" + ".";`: Ensures MongoDB collection names are namespaced (e.g., `UserAuthentication.authenticatedUsers`) to prevent conflicts and maintain modularity across concepts.
  * `type User = ID;`: Defines `User` as an `ID`, emphasizing it's an opaque identifier from `UserIdentity`, reinforcing concept independence.
  * `type AuthenticatedUser = ID;`: Represents the unique identifier for an entry *within this concept's state*, distinct from the `User` ID.

#### 2. `AuthenticatedUserDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):**
  ```concept
  state
  a set of AuthenticatedUsers with
    a user User
    a username String
    a passwordHash String
    an optional sessionID String
    an optional canvasOAuthToken String
  ```
* **Implementation Details & Rationale:**
  * `_id: AuthenticatedUser;`: MongoDB's primary key for each document in this collection, using our internal `AuthenticatedUser` ID.
  * `user: User;`: A reference (ID) to the `User` entity managed by `UserIdentity`. This demonstrates how concepts reference external generic types polymorphically, by their `ID`.
  * `username: string;`: Corresponds to `a username String`.
  * `passwordHash: string;`: Corresponds to `a passwordHash String`. Storing a hash, not the raw password, is a fundamental security practice.
  * `sessionID?: string;`: Corresponds to `an optional sessionID String`. The `?` makes it optional in TypeScript, matching "optional" in the spec.
  * `canvasOAuthToken?: string;`: Corresponds to `an optional canvasOAuthToken String`. Also optional.
  * **Rationale:** This interface directly maps the declared state components to a MongoDB document structure, ensuring all necessary information for the concept's behavior is present and correctly typed.

#### 3. Helper Functions (`hashPassword`, `checkPasswordComplexity`)

* **Implementation Details & Rationale:**
  * `hashPassword(password: string): string`: Uses `node:crypto` with SHA256.
  * `checkPasswordComplexity(password: string): boolean`: A very basic check (length >= 8).
  * **Rationale:** These are simple, internal helpers for demonstration. In a production system, `hashPassword` would use a more robust, slow hashing algorithm (like bcrypt or Argon2) to mitigate brute-force attacks, and `checkPasswordComplexity` would be much more comprehensive (e.g., requiring special characters, mixed case, etc.). For concept design, the *existence* and *effect* of these checks are what's important, not their cryptographic strength, as this concept's responsibility is *authentication*, not advanced password policy.

#### 4. Class Definition and Constructor

* **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class name `UserAuthenticationConcept` and its JSDoc `@concept` and `@purpose` tags directly link to the specification.
* **Implementation Details & Rationale:**
  * `authenticatedUsers: Collection<AuthenticatedUserDoc>;`: Declares the MongoDB collection where this concept's state (AuthenticatedUsers) will be stored.
  * `constructor(private readonly db: Db) { ... }`: Initializes the `authenticatedUsers` collection, pointing to `UserAuthentication.authenticatedUsers` in the database.

#### 5. `register` Action

* **Correspondence to Concept Spec:**
  ```concept
  register (user: User, username: String, password: String): Empty or (error: String)
    requires username is unique and password meets complexity requirements
    effects creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.
  ```
* **Implementation Details & Rationale:**
  * **`requires username is unique`**: `await this.authenticatedUsers.findOne({ username });` checks for existing usernames. If found, returns `{ error: ... }`.
  * **`requires ... password meets complexity requirements`**: `checkPasswordComplexity(password)` is called. If not met, returns `{ error: ... }`.
  * **`effects creates a new AuthenticatedUser ...`**:
    * `const passwordHash = hashPassword(password);`: Hashes the password.
    * `const authUserId = freshID() as AuthenticatedUser;`: Generates a unique ID for this new authentication record.
    * `await this.authenticatedUsers.insertOne({ _id: authUserId, user, username, passwordHash });`: Inserts the new authentication record into the database, linking it to the provided `User` ID from `UserIdentity`.
    * `return {};`: Returns an empty object on success, matching `Empty` in the spec's return type.

#### 6. `login` Action

* **Correspondence to Concept Spec:**
  ```concept
  login (username: String, password: String): (sessionID: String, user: User) or (error: String)
    requires username and password match an existing AuthenticatedUser
    effects generates a new sessionID for the AuthenticatedUser.
  ```
* **Implementation Details & Rationale:**
  * **`requires username and password match`**:
    * `const authUser = await this.authenticatedUsers.findOne({ username });`: Retrieves the authentication record by username.
    * `if (!authUser || authUser.passwordHash !== hashPassword(password)) { ... }`: Checks if the user exists and if the provided password's hash matches the stored hash. If not, returns `{ error: ... }`.
  * **`effects generates a new sessionID`**:
    * `const sessionID = freshID();`: Generates a new, unique string for the session ID.
    * `await this.authenticatedUsers.updateOne({ _id: authUser._id }, { $set: { sessionID } });`: Updates the `AuthenticatedUserDoc` to store this new `sessionID`.
    * `return { sessionID, user: authUser.user };`: Returns the generated `sessionID` and the `User` ID from `UserIdentity`, matching the specified return type.

#### 7. `logout` Action

* **Correspondence to Concept Spec:**
  ```concept
  logout (sessionID: String): Empty or (error: String)
    requires sessionID is valid
    effects clears the sessionID for the associated AuthenticatedUser.
  ```
* **Implementation Details & Rationale:**
  * **`requires sessionID is valid`**:
    * `const result = await this.authenticatedUsers.updateOne({ sessionID }, { $unset: { sessionID: "" } });`: Attempts to find and update an `AuthenticatedUser` document that has the given `sessionID`. `$unset` is used to remove the field.
    * `if (result.matchedCount === 0) { ... }`: If no document was found (meaning the `sessionID` was invalid or already cleared), returns `{ error: ... }`.
  * **`effects clears the sessionID`**: The `$unset` operation fulfills this effect by removing the `sessionID` field from the document.
  * `return {};`: Returns an empty object on success.

#### 8. `changePassword` Action

* **Correspondence to Concept Spec:**
  ```concept
  changePassword (user: User, oldPassword: String, newPassword: String): Empty or (error: String)
    requires user exists, oldPassword matches, newPassword meets complexity requirements
    effects updates the passwordHash for the specified User.
  ```
* **Implementation Details & Rationale:**
  * **`requires user exists`**: `const authUser = await this.authenticatedUsers.findOne({ user });` checks for the authentication record associated with the given `User` ID.
  * **`requires oldPassword matches`**: `if (authUser.passwordHash !== hashPassword(oldPassword)) { ... }` compares the provided `oldPassword` hash with the stored hash.
  * **`requires newPassword meets complexity requirements`**: `if (!checkPasswordComplexity(newPassword)) { ... }` checks the new password.
  * **`effects updates the passwordHash`**: If all preconditions are met, `await this.authenticatedUsers.updateOne({ _id: authUser._id }, { $set: { passwordHash: newPasswordHash } });` updates the stored `passwordHash` in the database.
  * `return {};`: Returns an empty object on success.

#### 9. `connectCanvas` Action

* **Correspondence to Concept Spec:**
  ```concept
  connectCanvas (user: User, canvasOAuthToken: String): Empty or (error: String)
    requires user exists and canvasOAuthToken is valid
    effects stores the Canvas OAuth token for the user, enabling Canvas data fetching.
  ```
* **Implementation Details & Rationale:**
  * **`requires user exists`**: `const authUser = await this.authenticatedUsers.findOne({ user });` checks for the authentication record.
  * **`requires ... canvasOAuthToken is valid`**: The comment `(validity check is external to this concept)` clarifies that this concept's responsibility is *storage*, not *validation*, maintaining its narrow focus. External services or synchronizations would handle the actual token validation.
  * **`effects stores the Canvas OAuth token`**: `await this.authenticatedUsers.updateOne({ _id: authUser._id }, { $set: { canvasOAuthToken } });` stores the token in the `AuthenticatedUserDoc`.
  * `return {};`: Returns an empty object on success.

#### 10. Query Methods

* **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` but necessary for internal logic (like checking uniqueness) and especially for testing to verify the state.
* **Implementation Details & Rationale:**
  * `_getAuthenticatedUserByUsername`, `_getAuthenticatedUserByUser`, `_getSessionUser`: These methods provide ways to read the concept's state. They perform simple MongoDB `findOne` operations based on `username`, `user` ID, or `sessionID`, respectively.
  * **Rationale:** They enable verification of effects during testing and support potential synchronization rules that might need to query this concept's state (e.g., for authorization checks using a session ID).

***

### `src/userauthentication/UserAuthenticationConcept.test.ts` Implementation Explained

This file contains tests for the `UserAuthenticationConcept`, ensuring its actions fulfill their specified requirements and effects, and demonstrating the concept's operational principle.

```typescript
import { assertEquals, assertExists, assertNotEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts"; // Import UserIdentityConcept
import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";

const TEST_EMAIL_ALICE = "alice@example.com";
const TEST_NAME_ALICE = "Alice Smith";
const TEST_USERNAME_ALICE = "alice_smith";
const TEST_PASSWORD_ALICE = "securePass123";
const TEST_PASSWORD_ALICE_NEW = "evenMoreSecure456";
const TEST_CANVAS_TOKEN_ALICE = "mock_canvas_token_abc123";

const TEST_EMAIL_BOB = "bob@example.com";
const TEST_NAME_BOB = "Bob Johnson";
const TEST_USERNAME_BOB = "bob_j";
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
    assertEquals("error" in registerResult, false, `Registration should succeed: ${registerResult.error}`);

    const registeredUser = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
    assertExists(registeredUser, "Registered user should exist in AuthenticatedUsers collection.");
    assertEquals(registeredUser?.username, TEST_USERNAME_ALICE);

    // 2. Log in to establish a session
    const loginResult = await userAuthConcept.login({
      username: TEST_USERNAME_ALICE,
      password: TEST_PASSWORD_ALICE,
    });
    assertEquals("error" in loginResult, false, `Login should succeed: ${loginResult.error}`);
    const { sessionID, user: loggedInUserId } = loginResult as { sessionID: string; user: ID };
    assertExists(sessionID, "Session ID should be generated.");
    assertStrictEquals(loggedInUserId, aliceUserId, "Logged in user ID should match.");

    const authUserAfterLogin = await userAuthConcept._getAuthenticatedUserByUser({ user: aliceUserId });
    assertEquals(authUserAfterLogin?.sessionID, sessionID, "Session ID should be stored in the state.");

    // 3. Log out to end it
    const logoutResult = await userAuthConcept.logout({ sessionID });
    assertEquals("error" in logoutResult, false, `Logout should succeed: ${logoutResult.error}`);

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
    assertEquals("error" in logoutResult, false, "Successful logout should clear session ID.");
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

***

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The file name `UserAuthenticationConcept.test.ts` and the imports directly reflect that these are the tests for the `UserAuthentication` concept.
* **Implementation Details & Rationale:**
  * `import { assertEquals, assertExists, assertNotEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";`: Imports a comprehensive set of Deno assertion functions to rigorously check conditions.
  * `import { testDb } from "@utils/database.ts"; import { ID } from "@utils/types.ts";`: Standard project utilities for isolated database testing and opaque ID types.
  * `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";`: **Crucially, this imports `UserIdentityConcept`.**
    * **Rationale:** `UserAuthentication`'s `register` action takes a `User` ID (from `UserIdentity`) as an argument. To test `UserAuthentication`, we first need to create a `User` ID using the `UserIdentityConcept`. This demonstrates how concepts work *together* through their respective actions, even though they are independent at their core. The dependency is *behavioral* (an action requires an existing `User` ID), not *structural* (no direct import of `UserIdentity`'s internal state or methods into `UserAuthenticationConcept.ts`).
  * `const TEST_EMAIL_ALICE = ...`: Defines constants for consistent and readable test data.

#### 2. "Principle" Test Case

* **Correspondence to Concept Spec (`principle` section):**
  ```concept
  principle a user can register with a unique username and password, log in to establish a session, and log out to end it.
  ```
  This test block directly simulates and verifies this core user flow.
* **Implementation Details & Rationale:**
  * **Setup:** Initializes both `UserIdentityConcept` and `UserAuthenticationConcept`. It starts by calling `userIdentityConcept.createUser()` to get a `User` ID (`aliceUserId`) that can then be used by `UserAuthenticationConcept`. This confirms the `User` generic parameter correctly takes an ID from an external source.
  * **Register:** Calls `userAuthConcept.register()` and asserts no error, then queries the internal state (`_getAuthenticatedUserByUser`) to confirm the `AuthenticatedUser` record was created and stores the correct username.
  * **Login:** Calls `userAuthConcept.login()` and asserts no error. It then verifies a `sessionID` was returned and that the `user` ID matches the original `aliceUserId` (`assertStrictEquals`). A subsequent query confirms the `sessionID` is stored in the `AuthenticatedUserDoc`.
  * **Logout:** Calls `userAuthConcept.logout()` with the `sessionID` from login, asserting no error. A final query confirms the `sessionID` has been cleared (`undefined`) from the `AuthenticatedUserDoc`.
  * **Rationale:** This test provides an end-to-end verification of the concept's main purpose and principle.

#### 3. "Action: register - enforces unique usernames and password complexity" Test Case

* **Correspondence to Concept Spec (`register` action's `requires`):**
  ```concept
  requires username is unique and password meets complexity requirements
  ```
* **Implementation Details & Rationale:**
  * **Valid Registration:** First, a successful registration establishes a baseline.
  * **Duplicate Username:** Attempts to register a *second* user (with a distinct `User` ID from `UserIdentity`) using the *same username* (`TEST_USERNAME_ALICE`).
    * `assertEquals("error" in duplicateUsernameResult, true, ...)`: Asserts that an error is returned.
    * `assertEquals((duplicateUsernameResult as { error: string }).error, ...)`: Verifies the specific error message, confirming the `username is unique` precondition enforcement.
  * **Weak Password:** Attempts registration with a password (`"weak"`) that fails `checkPasswordComplexity`.
    * Assertions verify an error is returned with the correct message.
  * **State Check:** `assertEquals(authUsers.length, 1, ...)` ensures only the *one* successful registration persists, demonstrating that failed operations do not alter the state inappropriately.
  * **Rationale:** Thoroughly tests the `requires` clauses of the `register` action.

#### 4. "Action: login - handles invalid credentials" Test Case

* **Correspondence to Concept Spec (`login` action's `requires`):**
  ```concept
  requires username and password match an existing AuthenticatedUser
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Registers Alice successfully.
  * **Invalid Username:** Attempts login with a non-existent username.
  * **Invalid Password:** Attempts login with the correct username but an incorrect password.
  * In both cases, assertions verify that an error is returned with the generic `Invalid username or password` message (to prevent username enumeration attacks).
  * A final state check confirms no `sessionID` was set for Alice, as expected for failed logins.
  * **Rationale:** Verifies the `requires` clause for `login` and good security practice in error messages.

#### 5. "Action: logout - handles invalid session ID" Test Case

* **Correspondence to Concept Spec (`logout` action's `requires`):**
  ```concept
  requires sessionID is valid
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Registers and logs in Alice, getting a valid `sessionID`.
  * **Invalid Session ID:** Attempts logout with a "fake" `sessionID`. Asserts an error.
  * **State Check:** Verifies Alice's original `sessionID` is still active, showing the failed logout did not affect other sessions.
  * **Successful Logout:** Performs a valid logout and confirms the `sessionID` is cleared.
  * **Rationale:** Tests the resilience of `logout` against invalid inputs.

#### 6. "Action: changePassword - handles incorrect old password or weak new password" Test Case

* **Correspondence to Concept Spec (`changePassword` action's `requires` and `effects`):**
  ```concept
  requires user exists, oldPassword matches, newPassword meets complexity requirements
  effects updates the passwordHash for the specified User.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Registers Alice.
  * **Incorrect Old Password:** Attempts to change password with a wrong `oldPassword`. Asserts an error.
  * **Weak New Password:** Attempts change with a `newPassword` that fails complexity. Asserts an error.
  * **Successful Change:** Performs a valid password change.
  * **Verification:** Attempts login with the `newPassword` (should succeed) and the `oldPassword` (should now fail), confirming the `passwordHash` was indeed updated and invalidated the old one.
  * **Rationale:** Verifies all preconditions for `changePassword` and its core effect.

#### 7. "Action: connectCanvas - successfully stores Canvas OAuth token" Test Case

* **Correspondence to Concept Spec (`connectCanvas` action's `effects`):**
  ```concept
  effects stores the Canvas OAuth token for the user, enabling Canvas data fetching.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Registers Alice.
  * **Successful Connection:** Calls `connectCanvas` with Alice's `User` ID and a `canvasOAuthToken`. Asserts no error.
  * **Verification:** Queries Alice's `AuthenticatedUserDoc` and asserts `canvasOAuthToken` is correctly stored.
  * **Non-existent User:** Attempts to connect Canvas for a `nonExistentUserId`. Asserts an error.
  * **Rationale:** Verifies the `connectCanvas` action's effect of storing the token and handles error cases for user existence.

These detailed explanations should clarify the rationale and alignment of the implementation and tests with the `UserAuthentication` concept specification, emphasizing modularity, independence, and the concept design principles.
