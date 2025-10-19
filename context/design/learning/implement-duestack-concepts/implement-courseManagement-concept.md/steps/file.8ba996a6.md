---
timestamp: 'Sun Oct 19 2025 01:05:48 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010548.8bcd7ec8.md]]'
content_id: 8ba996a6ccefd1ab9c00d81fb78e141ea24764a41955d6f5a17ddf953d18c739
---

# file: src/coursemanagement/CourseManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertStrictEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts"; // Assuming UserIdentityConcept is in src/useridentity
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

***

### `src/coursemanagement/CourseManagementConcept.ts` Implementation Explained

This file implements the `CourseManagement` concept, providing functionality to create, update, and delete course entities.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The file name `CourseManagementConcept.ts` directly matches the `CourseManagement` concept name.
* **Implementation Details & Rationale:**
  * Standard MongoDB, `ID`, and `freshID` imports are included as per project guidelines.
  * `const PREFIX = "CourseManagement" + ".";`: This prefix is used for MongoDB collection names (`CourseManagement.courses`) to ensure namespace separation, aligning with the modularity of concept design.
  * `type User = ID;`: `User` is a generic parameter for this concept, meaning it's treated as an opaque `ID` originating from `UserIdentity`. This reinforces independence; `CourseManagement` doesn't need to know anything about a `User`'s email or password.
  * `type Course = ID;`: `Course` is an internal entity managed by this concept, represented by an opaque `ID`.

#### 2. `CourseDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):**
  ```concept
  state
  a set of Courses with // 'Courses' here refers to the collection of Course entities
    a creator User
    a courseCode String
    a title String
    an optional canvasId String
  ```
* **Implementation Details & Rationale:**
  * `_id: Course;`: MongoDB's primary key for each course document, using our internal `Course` ID.
  * `creator: User;`: A reference (ID) to the `User` entity from `UserIdentity`.
  * `courseCode: string;`: Corresponds to `a courseCode String`.
  * `title: string;`: Corresponds to `a title String`.
  * `canvasId?: string;`: Corresponds to `an optional canvasId String`. The `?` makes it optional in TypeScript, matching "optional" in the spec.
  * **Rationale:** This interface directly maps the declared state components to a MongoDB document structure.

#### 3. Class Definition and Constructor

* **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `CourseManagementConcept` and its JSDoc `@concept` and `@purpose` tags directly link to the concept's definition.
* **Implementation Details & Rationale:**
  * `courses: Collection<CourseDoc>;`: Declares the MongoDB collection for storing course documents.
  * `constructor(private readonly db: Db) { ... }`: Initializes the `courses` collection using the `PREFIX` for namespacing.

#### 4. `createCourse` Action

* **Correspondence to Concept Spec:**
  ```concept
  createCourse (creator: User, courseCode: String, title: String): (course: Course) or (error: String)
    requires courseCode is unique for the creator
    effects creates a new course with the given details, linked to the creator.
  ```
* **Implementation Details & Rationale:**
  * **`requires courseCode is unique for the creator`**:
    * `await this.courses.findOne({ creator, courseCode });` checks for an existing course with the same `creator` and `courseCode`.
    * If a duplicate is found, it returns an `{ error: ... }`.
  * **`effects creates a new course ... and its ID is returned.`**:
    * `const courseId = freshID() as Course;`: Generates a new unique ID for the course.
    * `await this.courses.insertOne({ _id: courseId, creator, courseCode, title });`: Inserts the new course document.
    * `return { course: courseId };`: Returns the new course's ID on success.
  * **Rationale:** This action ensures that each user's courses are uniquely identified by their `courseCode`, while allowing different users to have courses with the same `courseCode` (e.g., "6.1040" for Alice and "6.1040" for Bob, if they were both instructors, or if the concept allowed multiple creators for the same code, though here it's "unique for the creator").

#### 5. `updateCourse` Action

* **Correspondence to Concept Spec:**
  ```concept
  updateCourse (course: Course, newCourseCode: String, newTitle: String): Empty or (error: String)
    requires course exists and newCourseCode is unique for the creator (if changed)
    effects updates the courseCode and title of an existing course.
  ```
* **Implementation Details & Rationale:**
  * **`requires course exists`**: `await this.courses.findOne({ _id: course });` checks if the course to be updated exists. If not, returns `{ error: ... }`.
  * **`requires newCourseCode is unique for the creator (if changed)`**:
    * An `if` block specifically checks if `existingCourse.courseCode !== newCourseCode`.
    * If the code is being changed, it then performs another `findOne` query to ensure `newCourseCode` isn't already taken by another course belonging to the *same creator*. If a duplicate is found, it returns `{ error: ... }`.
  * **`effects updates the courseCode and title`**: `await this.courses.updateOne({ _id: course }, { $set: { courseCode: newCourseCode, title: newTitle } });` performs the update.
  * `return {};`: Returns an empty object on success.
  * **Rationale:** This action allows modification of core course details while maintaining the uniqueness constraint for `courseCode` per `creator`.

#### 6. `setCanvasId` Action

* **Correspondence to Concept Spec:**
  ```concept
  setCanvasId (course: Course, canvasId: String): Empty or (error: String)
    requires course exists and canvasId is unique across all courses
    effects sets or updates the external Canvas ID for the specified course.
  ```
* **Implementation Details & Rationale:**
  * **`requires course exists`**: `await this.courses.findOne({ _id: course });` checks for the course.
  * **`requires canvasId is unique across all courses`**:
    * `const duplicateCanvasIdCourse = await this.courses.findOne({ canvasId });` queries for any course with this `canvasId`.
    * `if (duplicateCanvasIdCourse && duplicateCanvasIdCourse._id !== course) { ... }`: If a duplicate is found *and it's not the current course itself*, an error is returned. This handles cases where a course might update its own `canvasId` to the same value (which is fine) versus trying to claim an `canvasId` already held by another course.
  * **`effects sets or updates the external Canvas ID`**: `await this.courses.updateOne({ _id: course }, { $set: { canvasId } });` updates the `canvasId` field.
  * `return {};`: Returns an empty object on success.
  * **Rationale:** This action allows linking a course to an external Canvas instance, ensuring that each Canvas ID is uniquely mapped to one course in the system to prevent data inconsistencies or misattribution.

#### 7. `deleteCourse` Action

* **Correspondence to Concept Spec:**
  ```concept
  deleteCourse (course: Course): Empty or (error: String)
    requires course exists and has no associated deadlines
    effects removes the specified course.
  ```
* **Implementation Details & Rationale:**
  * **`requires course exists`**: `const result = await this.courses.deleteOne({ _id: course });` attempts to delete.
  * `if (result.deletedCount === 0) { ... }`: If no document was deleted, it means the course didn't exist, so an error is returned.
  * **`requires ... has no associated deadlines`**: As discussed earlier, this specific precondition cannot be enforced *within* `CourseManagement` without violating concept independence (as it would require querying `DeadlineManagement`'s state). The `NOTE` in the JSDoc explicitly addresses this: "This check must be enforced by external synchronizations or services before calling this action." The `deleteCourse` action strictly adheres to its own boundaries.
  * **`effects removes the specified course`**: `deleteOne` fulfills this effect.
  * `return {};`: Returns an empty object on success.
  * **Rationale:** Provides a way to remove courses, with the understanding that referential integrity (e.g., cascading deletes for deadlines) would be handled by external synchronizations.

#### 8. Query Methods (`_getCourseById`, `_getCoursesByCreator`, `_getCourseByCodeAndCreator`, `_getAllCourses`)

* **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` but are essential for testing and for other concepts/synchronizations to inspect `CourseManagement`'s state.
* **Implementation Details & Rationale:**
  * Methods starting with `_` are queries, reading state without modification.
  * They provide flexible ways to retrieve course documents based on various criteria (ID, creator, code+creator, all courses).
  * **Rationale:** These queries enable comprehensive testing of action effects and support the overall application's ability to display and filter course information.

***

### `src/coursemanagement/CourseManagementConcept.test.ts` Implementation Explained

This file contains tests for the `CourseManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The test file name and imports confirm its purpose for testing `CourseManagementConcept`.
* **Implementation Details & Rationale:**
  * Standard Deno assertion functions (`assertEquals`, `assertExists`, etc.\`).
  * `testDb`, `ID`, `freshID` from `@utils`.
  * `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";`: **Crucially, this imports `UserIdentityConcept`.**
    * **Rationale:** `CourseManagement.createCourse` requires a `creator: User` ID. Just like `UserAuthentication`, `CourseManagement` needs an existing `User` ID (from `UserIdentity`) to operate its actions. This showcases how concepts are independently implemented but integrate behaviorally via shared opaque IDs and synchronizations. The relative path `../useridentity/UserIdentityConcept.ts` assumes the test file is in `src/coursemanagement/` and `UserIdentityConcept.ts` is in `src/useridentity/`.

#### 2. Test Constants

* **Implementation Details:** Defines constants (`TEST_EMAIL_ALICE`, `TEST_COURSE_CODE_61040`, etc.) for clear and consistent test data, improving readability and maintainability.

#### 3. "Principle" Test Case

* **Correspondence to Concept Spec (`principle` section):**
  ```concept
  principle each user can define courses, assign unique identifiers, and manage course-specific details including an optional link to an external Canvas course.
  ```
  This test meticulously steps through this scenario.
* **Implementation Details & Rationale:**
  * **Setup:** Creates an `aliceUserId` using `UserIdentityConcept` first.
  * **Define Course:** Calls `createCourse`, asserting success and that a `courseId` is returned. It then uses `_getCourseById` to verify the course's details are correctly stored (`courseCode`, `title`, `creator`).
  * **Manage Details (Set Canvas ID):** Calls `setCanvasId`, asserting success. It then re-fetches the course to verify the `canvasId` is correctly applied.
  * **Update Course Details:** Calls `updateCourse` to change the course title. Fetches the course again to confirm the `title` update.
  * **Verify Creator's Courses:** Uses `_getCoursesByCreator` to confirm Alice has exactly one course with the updated title.
  * **Rationale:** This end-to-end test confirms the fundamental workflow and core features outlined in the concept's principle.

#### 4. "Action: createCourse - enforces unique courseCode per creator" Test Case

* **Correspondence to Concept Spec (`createCourse` action's `requires`):**
  ```concept
  requires courseCode is unique for the creator
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates Alice's `User` ID and one course for her.
  * **Duplicate for Same Creator:** Attempts to create another course for Alice with the *same* `courseCode`. The test asserts that an error is returned and checks its specific message.
  * **Unique for Different Creator:** Creates Bob's `User` ID. Bob then successfully creates a course with the *same* `courseCode` as Alice's. This is a critical part of the uniqueness rule (per creator) and is correctly verified.
  * **State Check:** `_getAllCourses` confirms there are exactly two courses (Alice's and Bob's), not three, ensuring no duplicates were erroneously added.
  * **Rationale:** Rigorously tests the `courseCode` uniqueness precondition, covering both failure (same creator) and success (different creator) scenarios.

#### 5. "Action: updateCourse - updates details and enforces uniqueness if code changes" Test Case

* **Correspondence to Concept Spec (`updateCourse` action's `requires` and `effects`):**
  ```concept
  requires course exists and newCourseCode is unique for the creator (if changed)
  effects updates the courseCode and title of an existing course.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates Alice's `User` ID and two courses for her.
  * **Update Title Only:** Updates one course's title while keeping its `courseCode` the same. Asserts success and verifies the title change.
  * **Update Code and Title:** Updates the same course with a new, unique `courseCode` and new `title`. Asserts success and verifies both changes.
  * **Attempt Duplicate Code Update:** Tries to update a course's `courseCode` to one already used by *another* of Alice's courses. Asserts an error with the correct message.
  * **Non-existent Course Update:** Tries to update a completely fake course. Asserts an error.
  * **Rationale:** Comprehensive testing for `updateCourse`, covering various valid and invalid update scenarios and verifying precondition enforcement.

#### 6. "Action: setCanvasId - sets unique Canvas ID globally" Test Case

* **Correspondence to Concept Spec (`setCanvasId` action's `requires` and `effects`):**
  ```concept
  requires course exists and canvasId is unique across all courses
  effects sets or updates the external Canvas ID for the specified course.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates Alice and Bob's `User` IDs, and one course for each.
  * **Alice Sets Canvas ID:** Alice successfully sets a `canvasId` for her course.
  * **Bob Tries Duplicate Canvas ID:** Bob attempts to set his course's `canvasId` to the *same ID Alice used*. This *must fail* due to the global uniqueness requirement. The test asserts an error.
  * **Bob Sets Unique Canvas ID:** Bob successfully sets a *different*, unique `canvasId` for his course.
  * **Non-existent Course:** Tries to set `canvasId` for a fake course. Asserts an error.
  * **Rationale:** Verifies the crucial global uniqueness constraint of `canvasId`, which is distinct from `courseCode`'s per-creator uniqueness.

#### 7. "Action: deleteCourse - successfully deletes a course" Test Case

* **Correspondence to Concept Spec (`deleteCourse` action's `requires` and `effects`):**
  ```concept
  deleteCourse (course: Course): Empty or (error: String)
    requires course exists and has no associated deadlines
    effects removes the specified course.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates Alice's `User` ID and one course for her.
  * **Successful Deletion:** Calls `deleteCourse`, asserts success.
  * **Verification:** Uses `_getCourseById` and `_getAllCourses` to confirm the course is no longer present in the database.
  * **Non-existent Course Deletion:** Tries to delete a fake course. Asserts an error.
  * **`has no associated deadlines`**: As noted in the concept file, this part of the precondition is explicitly *not* tested here, because `CourseManagement` is independent of `DeadlineManagement`. The test focuses only on what `CourseManagement` itself can validate and effect: the existence and removal of its own `Course` entities.
  * **Rationale:** Tests the fundamental ability to remove courses and its handling of non-existent inputs.

These detailed explanations cover the correspondence of code to specification, the underlying rationale for design choices (especially concerning independence and `ID` usage), and the thoroughness of the test suite in verifying both successful operations and precondition failures.
