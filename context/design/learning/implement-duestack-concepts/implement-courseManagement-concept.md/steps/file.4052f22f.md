---
timestamp: 'Sun Oct 19 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010512.56841c14.md]]'
content_id: 4052f22f0249cbd48c73c02d566e736a4f7b01e1177118f96ad034bfc5f5f13e
---

# file: src/concepts/DueStack/UserIdentityConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { ID } from "@utils/types.ts";
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
   * Query: Retrieves a user identity by their ID.
   * (This is an implicit query, added for convenience in testing and internal concept use.)
   * @param {Object} args - The arguments for the query.
   * @param {User} args.userId - The ID of the user to retrieve.
   * @returns {Promise<UserDoc | null>} A promise that resolves to the user document if found, otherwise null.
   */
  async _getUserById({ userId }: { userId: User }): Promise<UserDoc | null> {
    return await this.users.findOne({ _id: userId });
  }

  /**
   * Query: Retrieves a user identity by their email address.
   * (This is an implicit query, added for convenience in testing and internal concept use.)
   * @param {Object} args - The arguments for the query.
   * @param {string} args.email - The email address of the user to retrieve.
   * @returns {Promise<UserDoc | null>} A promise that resolves to the user document if found, otherwise null.
   */
  async _getUserByEmail({ email }: { email: string }): Promise<UserDoc | null> {
    return await this.users.findOne({ email });
  }

  /**
   * Query: Retrieves all user identities.
   * (This is an implicit query, added for convenience in testing and internal concept use.)
   * @returns {Promise<UserDoc[]>} A promise that resolves to an array of all user documents.
   */
  async _getAllUsers(): Promise<UserDoc[]> {
    return await this.users.find({}).toArray();
  }
}

```
