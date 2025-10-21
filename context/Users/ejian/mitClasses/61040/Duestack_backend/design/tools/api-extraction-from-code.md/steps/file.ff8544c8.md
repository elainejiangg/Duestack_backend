---
timestamp: 'Tue Oct 21 2025 10:47:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_104749.839987d5.md]]'
content_id: ff8544c8269454662b04f7229c350604891e0e6750a1aef2f03e59483d9bd598
---

# file: /Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserIdentityConcept.test.ts

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
