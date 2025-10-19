---
timestamp: 'Sun Oct 19 2025 01:15:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_011526.2a963ae0.md]]'
content_id: 4efc4dfb279ee71f068f04bf129ac1c8f1b36583f0c2776b27b08295bf30e319
---

# file: src/users/UserConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "Users" + ".";

// Internal entity type for a User, represented as an opaque ID
type User = ID;

/**
 * State: A set of Users, each with a unique email and a name.
 */
interface UserDoc {
  _id: User;
  email: string;
  name: string;
}

/**
 * @concept Users
 * @purpose provide unique identities for individuals interacting with the system.
 */
export default class UserConcept {
  users: Collection<UserDoc>;

  constructor(private readonly db: Db) {
    this.users = this.db.collection(PREFIX + "users");
  }

  /**
   * Action: Creates a new user.
   * @requires email is unique across all users.
   * @effects A new User is created with the given email and name, and its ID is returned.
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
   * Query: Retrieves a user by their ID.
   * (This is an implicit query, added for convenience in testing and internal concept use.)
   */
  async _getUserById({ userId }: { userId: User }): Promise<UserDoc | null> {
    return await this.users.findOne({ _id: userId });
  }

  /**
   * Query: Retrieves a user by their email address.
   * (This is an implicit query, added for convenience in testing and internal concept use.)
   */
  async _getUserByEmail({ email }: { email: string }): Promise<UserDoc | null> {
    return await this.users.findOne({ email });
  }

  /**
   * Query: Retrieves all users.
   */
  async _getAllUsers(): Promise<UserDoc[]> {
    return await this.users.find({}).toArray();
  }
}
```
