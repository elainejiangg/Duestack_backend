---
timestamp: 'Tue Oct 21 2025 10:47:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_104749.839987d5.md]]'
content_id: 509bfcb942a0d9b60be2a589dd12961fa9b3e2b6e184b16f23de654bd696a9e0
---

# file: /Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/DeadlineManagementConcept.test.ts

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
