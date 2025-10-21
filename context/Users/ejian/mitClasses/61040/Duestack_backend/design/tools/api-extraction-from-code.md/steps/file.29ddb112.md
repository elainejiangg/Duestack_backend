---
timestamp: 'Tue Oct 21 2025 10:47:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_104749.839987d5.md]]'
content_id: 29ddb112cdff0a9d6380500da7b2cc7063393d9027a317f79a0ddf000590514a
---

# file: /Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/CourseManagementConcept.test.ts

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
