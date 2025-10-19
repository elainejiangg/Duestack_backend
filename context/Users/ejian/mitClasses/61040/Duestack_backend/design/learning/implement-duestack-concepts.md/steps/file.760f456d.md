---
timestamp: 'Sat Oct 18 2025 22:54:28 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_225428.a79db294.md]]'
content_id: 760f456ddbe4f7fad86f2d9980ff161b12340556f7a4301834f92946fa91b399
---

# file: src/users/UserConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import UserConcept from "./UserConcept.ts";

const TEST_EMAIL_1 = "alice@example.com";
const TEST_NAME_1 = "Alice Smith";
const TEST_EMAIL_2 = "bob@example.com";
const TEST_NAME_2 = "Bob Johnson";

Deno.test("Principle: New users can be registered, their core information stored, and their existence tracked.", async () => {
  const [db, client] = await testDb();
  const userConcept = new UserConcept(db);

  try {
    // 1. Register a new user
    const createUserResult = await userConcept.createUser({
      email: TEST_EMAIL_1,
      name: TEST_NAME_1,
    });
    assertNotEquals("error" in createUserResult, true, "User creation should not fail.");
    const { user: userId } = createUserResult as { user: ID };
    assertExists(userId, "A user ID should be returned on successful creation.");

    // 2. Their core information is stored
    const storedUser = await userConcept._getUserById({ userId });
    assertExists(storedUser, "The created user should exist in the database.");
    assertEquals(storedUser?.email, TEST_EMAIL_1, "Stored user email should match.");
    assertEquals(storedUser?.name, TEST_NAME_1, "Stored user name should match.");

    // 3. Their existence is tracked (e.g., through a query for all users)
    const allUsers = await userConcept._getAllUsers();
    assertEquals(allUsers.length, 1, "There should be one user in the system.");
    assertEquals(allUsers[0]._id, userId, "The retrieved user ID should match the created one.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: createUser - successfully creates a unique user", async () => {
  const [db, client] = await testDb();
  const userConcept = new UserConcept(db);

  try {
    const result = await userConcept.createUser({
      email: TEST_EMAIL_1,
      name: TEST_NAME_1,
    });
    assertNotEquals("error" in result, true, "User creation should succeed.");
    const { user: userId } = result as { user: ID };
    assertExists(userId, "User ID should be returned.");

    const retrievedUser = await userConcept._getUserByEmail({ email: TEST_EMAIL_1 });
    assertExists(retrievedUser, "User should be retrievable by email.");
    assertEquals(retrievedUser?._id, userId, "Retrieved user ID should match.");
    assertEquals(retrievedUser?.name, TEST_NAME_1, "Retrieved user name should match.");

    const totalUsers = await userConcept._getAllUsers();
    assertEquals(totalUsers.length, 1, "There should be exactly one user after successful creation.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: createUser - requires email to be unique", async () => {
  const [db, client] = await testDb();
  const userConcept = new UserConcept(db);

  try {
    // Create first user successfully
    const result1 = await userConcept.createUser({
      email: TEST_EMAIL_1,
      name: TEST_NAME_1,
    });
    assertNotEquals("error" in result1, true, "First user creation should succeed.");

    // Attempt to create a second user with the same email
    const result2 = await userConcept.createUser({
      email: TEST_EMAIL_1,
      name: TEST_NAME_2, // Different name, same email
    });
    assertEquals("error" in result2, true, "Second user creation with same email should fail.");
    assertEquals(
      (result2 as { error: string }).error,
      `User with email '${TEST_EMAIL_1}' already exists. Email must be unique.`,
      "Error message should indicate email uniqueness violation.",
    );

    // Verify only one user exists in the database
    const allUsers = await userConcept._getAllUsers();
    assertEquals(allUsers.length, 1, "Only one user should exist after a failed creation attempt.");
  } finally {
    await client.close();
  }
});

Deno.test("Query: _getUserById and _getUserByEmail return null for non-existent users", async () => {
  const [db, client] = await testDb();
  const userConcept = new UserConcept(db);

  try {
    const nonExistentId = "user:nonexistent" as ID;
    const userById = await userConcept._getUserById({ userId: nonExistentId });
    assertEquals(userById, null, "Should return null for a non-existent user ID.");

    const userByEmail = await userConcept._getUserByEmail({ email: "nonexistent@example.com" });
    assertEquals(userByEmail, null, "Should return null for a non-existent email.");
  } finally {
    await client.close();
  }
});
```
