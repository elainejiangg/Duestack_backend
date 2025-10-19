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
    