---
timestamp: 'Sun Oct 19 2025 01:15:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_011526.2a963ae0.md]]'
content_id: f1e75fcae374c188b1a32ba9451253a4a6e102b91730d50302f0f15fd72e960d
---

# file: src/userauthentication/UserAuthenticationConcept.ts

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
