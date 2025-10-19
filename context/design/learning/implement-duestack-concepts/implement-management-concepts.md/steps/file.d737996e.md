---
timestamp: 'Sun Oct 19 2025 01:16:02 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_011602.5db1512f.md]]'
content_id: d737996e5eb32a766a891941c0059cf7cb88ef8a3622c9d24e2d2594a84d123f
---

# file: src/deadlinemanagement/DeadlineManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertStrictEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts"; // Assuming path
import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts"; // Assuming path
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

***

### `src/deadlinemanagement/DeadlineManagementConcept.ts` Implementation Explained

This file implements the `DeadlineManagement` concept, which is responsible for storing, tracking, and modifying academic deadlines.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The file name `DeadlineManagementConcept.ts` directly reflects the singular name of the `DeadlineManagement` concept.
* **Implementation Details & Rationale:**
  * Standard imports for `Collection`, `Db` from `mongodb`, and project utilities `Empty`, `ID`, `freshID`.
  * `const PREFIX = "DeadlineManagement" + ".";`: This prefix is used for MongoDB collection names (`DeadlineManagement.deadlines`), ensuring clear namespace separation and preventing conflicts with other concepts that might have similarly named internal collections. This adheres to the modularity principle.
  * `type User = ID;` and `type Course = ID;`: These are the generic type parameters for the concept, representing opaque identifiers that originate from other independent concepts (`UserIdentity` and `CourseManagement`, respectively). `DeadlineManagement` doesn't need to know the internal structure of a `User` or a `Course`; it only needs their unique IDs for referential purposes. This is a core aspect of concept independence and polymorphism.
  * `type Deadline = ID;`: This defines the internal entity ID for a deadline managed by this concept.

#### 2. Enumerations (`Source` and `Status`)

* **Correspondence to Concept Spec (`state` section):**
  ```concept
  a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
  an optional status of NOT_STARTED or IN_PROGRESS or DONE
  ```
* **Implementation Details & Rationale:**
  * `enum Source { ... }` and `enum Status { ... }`: TypeScript enums are used to represent the discrete set of allowed values for `source` and `status`. Using enums provides type safety and makes the code more readable by restricting values to predefined options.
  * **Rationale:** These directly model the enumerated types specified in the concept's state, ensuring data integrity for these fields.

#### 3. `DeadlineDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):** This interface directly maps to the `a set of Deadlines` declaration in the concept specification.
* **Implementation Details & Rationale:**
  * `_id: Deadline;`: MongoDB's primary key for each deadline document, using our internal `Deadline` ID.
  * `course: Course;`: A reference (ID) to the `Course` entity from `CourseManagement`.
  * `title: string;`: Corresponds to `a title String`.
  * `due: Date;`: Corresponds to `a due DateTime`. TypeScript's `Date` object is the natural choice for representing `DateTime` in JavaScript/TypeScript, and MongoDB natively supports BSON Date types.
  * `source: Source;`: Corresponds to `a source of ...`, using the defined `Source` enum.
  * `addedBy: User;`: A reference (ID) to the `User` entity from `UserIdentity`.
  * `status?: Status;`: Corresponds to `an optional status of ...`. The `?` makes it optional in TypeScript, matching "optional" in the spec, implying it might not be set upon creation.
  * **Rationale:** This interface rigorously defines the structure of a deadline document stored in MongoDB, ensuring all state components specified in the concept are represented.

#### 4. Class Definition and Constructor

* **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `DeadlineManagementConcept` and its JSDoc `@concept` and `@purpose` tags directly link to the concept's definition.
* **Implementation Details & Rationale:**
  * `deadlines: Collection<DeadlineDoc>;`: Declares the MongoDB collection where deadline documents will be stored.
  * `constructor(private readonly db: Db) { ... }`: Initializes the `deadlines` collection, namespacing it as `DeadlineManagement.deadlines`.

#### 5. `createDeadline` Action

* **Correspondence to Concept Spec:**
  ```concept
  createDeadline (course: Course, title: String, due: DateTime, source: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED, addedBy: User): (deadline: Deadline) or (error: String)
    requires course exists
    requires title is non-empty.
    effects creates a new deadline with the given details, initially with no status.
  ```
* **Implementation Details & Rationale:**
  * **`requires title is non-empty`**:
    * `if (!title || title.trim() === "")`: Checks if the title is empty or just whitespace. If so, returns an `{ error: ... }`.
  * **`requires source is a valid enum value`**:
    * `if (!Object.values(Source).includes(source))`: Validates that the provided `source` string is one of the allowed `Source` enum values. Returns an `{ error: ... }` if invalid.
  * **`requires course exists`**: The JSDoc `// Note: 'course exists' and 'user exists' are preconditions to be enforced by calling context/syncs ...` explicitly highlights that this concept, due to independence, assumes the validity of `course` and `addedBy` IDs. It does not perform a database lookup on `CourseManagement` or `UserIdentity`. This directly follows the "Concept Independence" rubric point: "Concept does not rely on any properties of other concepts."
  * **`effects creates a new deadline ...`**:
    * `const deadlineId = freshID() as Deadline;`: Generates a new unique `ID`.
    * `await this.deadlines.insertOne({ _id: deadlineId, course, title, due, source, addedBy });`: Inserts the new document. The `status` is omitted, making it `undefined` as per "optional status".
    * `return { deadline: deadlineId };`: Returns the new deadline's ID on success.

#### 6. `updateDeadline` Action

* **Correspondence to Concept Spec:**
  ```concept
  updateDeadline (deadline: Deadline, newTitle: String, newDue: DateTime, newSource: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED): Empty or (error: String)
    requires deadline exists.
    requires newTitle is non-empty.
    effects updates the title, due date, and source of an existing deadline.
  ```
* **Implementation Details & Rationale:**
  * **`requires deadline exists`**: `await this.deadlines.findOne({ _id: deadline });` checks for the deadline's existence. If not found, returns `{ error: ... }`.
  * **`requires newTitle is non-empty`**: Similar check to `createDeadline`.
  * **`requires newSource is a valid enum value`**: Similar check to `createDeadline`.
  * **`effects updates the title, due date, and source`**: `await this.deadlines.updateOne({ _id: deadline }, { $set: { title: newTitle, due: newDue, source: newSource } });` updates the specified fields.
  * `return {};`: Returns an empty object on success.

#### 7. `setStatus` Action

* **Correspondence to Concept Spec:**
  ```concept
  setStatus (deadline: Deadline, status: NOT_STARTED or IN_PROGRESS or DONE): Empty or (error: String)
    requires deadline exists.
    effects updates the completion status of a deadline.
  ```
* **Implementation Details & Rationale:**
  * **`requires deadline exists`**: Checks for existence.
  * **`requires status is a valid enum value`**: `if (!Object.values(Status).includes(status))`: Validates the `status` enum value.
  * **`effects updates the completion status`**: `await this.deadlines.updateOne({ _id: deadline }, { $set: { status } });` updates the `status` field.
  * `return {};`: Returns an empty object on success.

#### 8. `deleteDeadline` Action

* **Correspondence to Concept Spec:**
  ```concept
  deleteDeadline (deadline: Deadline): Empty or (error: String)
    requires deadline exists.
    effects removes the specified deadline.
  ```
* **Implementation Details & Rationale:**
  * **`requires deadline exists`**: `const result = await this.deadlines.deleteOne({ _id: deadline });` attempts deletion.
  * `if (result.deletedCount === 0) { ... }`: If no document was deleted, it means the deadline didn't exist, so an error is returned.
  * **`effects removes the specified deadline`**: `deleteOne` operation fulfills this.
  * `return {};`: Returns an empty object on success.

#### 9. Query Methods (`_getDeadlineById`, `_getDeadlinesByCourse`, `_getDeadlinesByAddedBy`, `_getAllDeadlines`)

* **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` but are essential for testing and for other concepts/synchronizations to inspect `DeadlineManagement`'s state.
* **Implementation Details & Rationale:**
  * Methods prefixed with `_` are queries, designed to read the state without modification.
  * They provide ways to retrieve `DeadlineDoc` documents based on ID, associated `Course` ID, or `addedBy` `User` ID, or all deadlines.
  * **Rationale:** These queries are vital for verifying the `effects` of actions in tests and for enabling higher-level logic (e.g., displaying a user's deadlines or a course's deadlines).

***

### `src/deadlinemanagement/DeadlineManagementConcept.test.ts` Implementation Explained

This file contains tests for the `DeadlineManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The test file name directly reflects its purpose.
* **Implementation Details & Rationale:**
  * Standard Deno assertion functions are imported.
  * `testDb`, `ID`, `freshID` are imported from `@utils`.
  * `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";` and `import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";`: **These imports are crucial.**
    * **Rationale:** The `DeadlineManagement` concept's actions (`createDeadline`) require `User` and `Course` IDs as generic parameters. To set up realistic test scenarios, we need to first create these `User` and `Course` entities using their respective concepts. This demonstrates that concepts are independently implemented but integrate behaviorally through shared opaque IDs. The relative paths reflect the assumed file structure (test in `deadlinemanagement`, concepts in sibling folders).

#### 2. Test Data Constants

* **Implementation Details:** Defines constants for common test data (emails, names, course codes, deadline titles, due dates, sources). Using `new Date(...)` for `DateTime` ensures correct type usage.
* **Rationale:** Improves test readability and maintainability, making it easy to see what data is being used for each test case.

#### 3. "Principle" Test Case

* **Correspondence to Concept Spec (`principle` section):**
  ```concept
  principle each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.
  ```
  This test meticulously steps through this scenario.
* **Implementation Details & Rationale:**
  * **Setup:**
    * Creates a `User` (`aliceUserId`) using `UserIdentityConcept`.
    * Creates a `Course` (`courseId61040`) for that user using `CourseManagementConcept`.
    * This establishes the necessary external IDs before `DeadlineManagement` actions can be called.
  * **1. Create Deadline:** Calls `deadlineManagementConcept.createDeadline()`.
    * `assertEquals("error" in createDeadlineResult, false, ...)`: Asserts no error.
    * `assertExists(deadlineIdA1, ...)`: Asserts a `deadlineId` is returned.
  * **Verify Initial State:** Uses `_getDeadlineById` to fetch the created deadline.
    * Asserts `title`, `due`, `source`, `addedBy`, `course` are all correctly stored, directly reflecting the `state` properties.
    * Asserts `status` is `undefined`, confirming the "optional" nature.
  * **2. Update Status:** Calls `deadlineManagementConcept.setStatus()` to change the status.
    * Asserts no error.
    * Fetches the deadline again to confirm the `status` field is updated.
  * **Verify Course Deadlines:** Uses `_getDeadlinesByCourse` to confirm the deadline is correctly associated with the course.
  * **Rationale:** This end-to-end test confirms the concept's main purpose and principle by simulating a full lifecycle.

#### 4. "Action: createDeadline - enforces title and source requirements" Test Case

* **Correspondence to Concept Spec (`createDeadline` action's `requires`):**
  ```concept
  requires title is non-empty.
  requires source is a valid enum value
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user and a course.
  * **Empty Title:** Attempts `createDeadline` with an empty string for `title`. Asserts an error and checks its message.
  * **Whitespace Title:** Attempts `createDeadline` with only whitespace for `title`. Asserts an error and checks its message.
  * **Invalid Source:** Attempts `createDeadline` with a `source` string not in the `Source` enum. Asserts an error and checks its message.
  * **State Check:** `_getAllDeadlines()` is used to confirm that no deadlines were actually created after these failed attempts.
  * **Rationale:** Rigorously tests the explicit `requires` clauses of the `createDeadline` action.

#### 5. "Action: updateDeadline - updates fields and enforces requirements" Test Case

* **Correspondence to Concept Spec (`updateDeadline` action's `requires` and `effects`):**
  ```concept
  requires deadline exists.
  requires newTitle is non-empty.
  requires newSource is a valid enum value.
  effects updates the title, due date, and source of an existing deadline.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and a deadline.
  * **Successful Update:** Calls `updateDeadline` with new valid values. Asserts success and verifies all updated fields using `_getDeadlineById`.
  * **Non-existent Deadline:** Attempts `updateDeadline` with a fake `deadlineId`. Asserts an error.
  * **Empty New Title:** Attempts `updateDeadline` with an empty `newTitle`. Asserts an error.
  * **Invalid New Source:** Attempts `updateDeadline` with an invalid `newSource`. Asserts an error.
  * **Rationale:** Comprehensive testing for `updateDeadline`, covering valid updates and various precondition failures.

#### 6. "Action: setStatus - updates status and enforces requirements" Test Case

* **Correspondence to Concept Spec (`setStatus` action's `requires` and `effects`):**
  ```concept
  requires deadline exists.
  effects updates the completion status of a deadline.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and a deadline.
  * **Successful Status Updates:** Calls `setStatus` multiple times with different valid `Status` enum values (`IN_PROGRESS`, `DONE`). Asserts success and verifies the status changes after each call.
  * **Non-existent Deadline:** Attempts `setStatus` with a fake `deadlineId`. Asserts an error.
  * **Invalid Status:** Attempts `setStatus` with an invalid `status` string. Asserts an error.
  * **Rationale:** Tests the `setStatus` action, ensuring it correctly updates the optional status field and enforces its preconditions.

#### 7. "Action: deleteDeadline - successfully deletes a deadline" Test Case

* **Correspondence to Concept Spec (`deleteDeadline` action's `requires` and `effects`):**
  ```concept
  deleteDeadline (deadline: Deadline): Empty or (error: String)
    requires deadline exists.
    effects removes the specified deadline.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and *two* deadlines.
  * **Delete First Deadline:** Calls `deleteDeadline` for one deadline. Asserts success.
  * **Partial Verification:** Checks that the first deadline is gone (`null` from query) but the second one still exists (`assertExists`). This confirms precise deletion and no unintended side effects.
  * **Delete Second Deadline:** Deletes the remaining deadline.
  * **Final Verification:** Checks `_getAllDeadlines()` to confirm all are gone.
  * **Non-existent Deadline:** Attempts `deleteDeadline` for a fake `deadlineId`. Asserts an error.
  * **Rationale:** Tests the `deleteDeadline` action, confirming successful removal and correct handling of non-existent entities. It also demonstrates how a single item can be deleted without affecting others.

These detailed explanations provide a clear understanding of the implementation and testing strategy for the `DeadlineManagement` concept, emphasizing its adherence to concept design principles.
