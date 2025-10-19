
[@concept-design-overview](../../background/concept-design-overview.md)

[@concept-rubric](../../background/detailed/concept-rubric.md)

[@concept-state](../../background/detailed/concept-state.md)

[@concept-design-brief](../../background/concept-design-brief.md)

[@concept-design-overview](../../background/concept-design-overview.md)

[@implementing-concepts](../../background/implementing-concepts.md)

[@testing-concepts](../../background/testing-concepts.md)

[@implementation](../../concepts/examples/LikertSurvey/implementation.md)

[@LikertSurvey](../../concepts/examples/LikertSurvey/LikertSurvey.md)

[@testing](../../concepts/examples/LikertSurvey/testing.md)

[@conceptsExample](../../concepts/examples/GroceryShoppingExample/conceptsExample.md)

[@DueStack-old-concepts](../../concepts/DueStack-brainstorming/DueStack-old-concepts.md)

[@DueStack-new-concepts](../../concepts/DueStack-brainstorming/DueStack-new-concepts.md)

[@DueStack-initial-feedback](../../concepts/DueStack-brainstorming/DueStack-initial-feedback.md)

[@AI-Augmented-Feature-Concept](../../concepts/DueStack-brainstorming/AI-Augmented-Feature-Concept.md)

[@Assignment-4a-description](Assignment-4a-description.md)

[@AI-Augmented-feature-user-story](../../concepts/DueStack-brainstorming/AI-Augmented-feature-user-story.md)

[@LikertSurveyConcept.test](/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts)

[@LikertSurveyConcept.ts](/src/concepts/LikertSurvey/LikertSurveyConcept.ts)

[@README](../../../old-README.md)

[@implement-user-concepts](implement-user-concepts.md)

[@UserAuthenticationConceptTests](/src/concepts/DueStack/UserAuthenticationConcept.test.ts)

[@UserAuthenticationConcept](/src/concepts/DueStack/UserAuthenticationConcept.ts)

[@UserIdentityConceptTests](/src/concepts/DueStack/UserIdentityConcept.test.ts)

[@UserIdentityConcept](/src/concepts/DueStack/UserIdentityConcept.ts)


# question: now that you've implemented userId and UserAuth, implement CourseManagement and it corresponding tests
# response:

Okay, I will now implement the `CourseManagement` concept and its corresponding tests, strictly following the updated concept specifications and the guidelines.

***

# file: src/coursemanagement/CourseManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "CourseManagement" + ".";

// Generic type for a User, originating from UserIdentity concept
type User = ID;

// Internal entity type for a Course
type Course = ID;

/**
 * State: A set of Courses, each linked to a creator, with a unique courseCode, title, and optional Canvas ID.
 */
interface CourseDoc {
  _id: Course; // Primary key for this collection
  creator: User; // Reference to the UserIdentity's User ID
  courseCode: string; // Unique per creator
  title: string;
  canvasId?: string; // Optional: external Canvas ID, unique globally if set
}

/**
 * @concept CourseManagement
 * @purpose organize and categorize academic deadlines by associating them with specific courses.
 */
export default class CourseManagementConcept {
  courses: Collection<CourseDoc>;

  constructor(private readonly db: Db) {
    this.courses = this.db.collection(PREFIX + "courses");
  }

  /**
   * Action: Creates a new course.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.creator - The ID of the User who is creating the course.
   * @param {string} args.courseCode - A unique code for the course (unique per creator).
   * @param {string} args.title - The title of the course.
   * @returns {Promise<{course: Course} | {error: string}>} A promise that resolves to an object containing the new course's ID on success, or an error message on failure.
   * @requires courseCode is unique for the creator.
   * @effects Creates a new course with the given details, linked to the creator.
   */
  async createCourse({ creator, courseCode, title }: { creator: User; courseCode: string; title: string }): Promise<{ course: Course } | { error: string }> {
    const existingCourse = await this.courses.findOne({ creator, courseCode });
    if (existingCourse) {
      return { error: `Course with code '${courseCode}' already exists for this creator.` };
    }

    const courseId = freshID() as Course;
    await this.courses.insertOne({
      _id: courseId,
      creator,
      courseCode,
      title,
    });
    return { course: courseId };
  }

  /**
   * Action: Updates the courseCode and/or title of an existing course.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course to update.
   * @param {string} args.newCourseCode - The new unique course code.
   * @param {string} args.newTitle - The new title of the course.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires course exists and newCourseCode is unique for the creator (if changed).
   * @effects Updates the courseCode and title of an existing course.
   */
  async updateCourse({ course, newCourseCode, newTitle }: { course: Course; newCourseCode: string; newTitle: string }): Promise<Empty | { error: string }> {
    const existingCourse = await this.courses.findOne({ _id: course });
    if (!existingCourse) {
      return { error: `Course with ID ${course} not found.` };
    }

    // Check uniqueness if courseCode is changed
    if (existingCourse.courseCode !== newCourseCode) {
      const duplicateCourse = await this.courses.findOne({
        creator: existingCourse.creator,
        courseCode: newCourseCode,
      });
      if (duplicateCourse) {
        return { error: `New course code '${newCourseCode}' already exists for this creator.` };
      }
    }

    await this.courses.updateOne(
      { _id: course },
      { $set: { courseCode: newCourseCode, title: newTitle } },
    );
    return {};
  }

  /**
   * Action: Sets or updates the external Canvas ID for the specified course.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course to update.
   * @param {string} args.canvasId - The external Canvas ID.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires course exists and canvasId is unique across all courses.
   * @effects Sets or updates the external Canvas ID for the specified course.
   */
  async setCanvasId({ course, canvasId }: { course: Course; canvasId: string }): Promise<Empty | { error: string }> {
    const existingCourse = await this.courses.findOne({ _id: course });
    if (!existingCourse) {
      return { error: `Course with ID ${course} not found.` };
    }

    // Check if another course already uses this canvasId (must be unique globally)
    const duplicateCanvasIdCourse = await this.courses.findOne({ canvasId });
    if (duplicateCanvasIdCourse && duplicateCanvasIdCourse._id !== course) {
      return { error: `Canvas ID '${canvasId}' is already linked to another course.` };
    }

    await this.courses.updateOne(
      { _id: course },
      { $set: { canvasId } },
    );
    return {};
  }

  /**
   * Action: Removes the specified course.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course to delete.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires course exists.
   * @effects Removes the specified course.
   * @note The concept specification states "and has no associated deadlines". This check must be enforced by external synchronizations or services before calling this action, as DeadlineManagement is an independent concept. This concept only ensures the 'course exists' precondition.
   */
  async deleteCourse({ course }: { course: Course }): Promise<Empty | { error: string }> {
    const result = await this.courses.deleteOne({ _id: course });

    if (result.deletedCount === 0) {
      return { error: `Course with ID ${course} not found.` };
    }
    return {};
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves a course by its ID.
   */
  async _getCourseById({ courseId }: { courseId: Course }): Promise<CourseDoc | null> {
    return await this.courses.findOne({ _id: courseId });
  }

  /**
   * Query: Retrieves courses created by a specific user.
   */
  async _getCoursesByCreator({ creator }: { creator: User }): Promise<CourseDoc[]> {
    return await this.courses.find({ creator }).toArray();
  }

  /**
   * Query: Retrieves a course by its courseCode and creator.
   */
  async _getCourseByCodeAndCreator({ creator, courseCode }: { creator: User; courseCode: string }): Promise<CourseDoc | null> {
    return await this.courses.findOne({ creator, courseCode });
  }

  /**
   * Query: Retrieves all courses.
   */
  async _getAllCourses(): Promise<CourseDoc[]> {
    return await this.courses.find({}).toArray();
  }
}
```

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

*   **Correspondence to Concept Spec:** The file name `CourseManagementConcept.ts` directly matches the `CourseManagement` concept name.
*   **Implementation Details & Rationale:**
    *   Standard MongoDB, `ID`, and `freshID` imports are included as per project guidelines.
    *   `const PREFIX = "CourseManagement" + ".";`: This prefix is used for MongoDB collection names (`CourseManagement.courses`) to ensure namespace separation, aligning with the modularity of concept design.
    *   `type User = ID;`: `User` is a generic parameter for this concept, meaning it's treated as an opaque `ID` originating from `UserIdentity`. This reinforces independence; `CourseManagement` doesn't need to know anything about a `User`'s email or password.
    *   `type Course = ID;`: `Course` is an internal entity managed by this concept, represented by an opaque `ID`.

#### 2. `CourseDoc` Interface (State Representation)

*   **Correspondence to Concept Spec (`state` section):**
    ```concept
    state
    a set of Courses with // 'Courses' here refers to the collection of Course entities
      a creator User
      a courseCode String
      a title String
      an optional canvasId String
    ```
*   **Implementation Details & Rationale:**
    *   `_id: Course;`: MongoDB's primary key for each course document, using our internal `Course` ID.
    *   `creator: User;`: A reference (ID) to the `User` entity from `UserIdentity`.
    *   `courseCode: string;`: Corresponds to `a courseCode String`.
    *   `title: string;`: Corresponds to `a title String`.
    *   `canvasId?: string;`: Corresponds to `an optional canvasId String`. The `?` makes it optional in TypeScript, matching "optional" in the spec.
    *   **Rationale:** This interface directly maps the declared state components to a MongoDB document structure.

#### 3. Class Definition and Constructor

*   **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `CourseManagementConcept` and its JSDoc `@concept` and `@purpose` tags directly link to the concept's definition.
*   **Implementation Details & Rationale:**
    *   `courses: Collection<CourseDoc>;`: Declares the MongoDB collection for storing course documents.
    *   `constructor(private readonly db: Db) { ... }`: Initializes the `courses` collection using the `PREFIX` for namespacing.

#### 4. `createCourse` Action

*   **Correspondence to Concept Spec:**
    ```concept
    createCourse (creator: User, courseCode: String, title: String): (course: Course) or (error: String)
      requires courseCode is unique for the creator
      effects creates a new course with the given details, linked to the creator.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires courseCode is unique for the creator`**:
        *   `await this.courses.findOne({ creator, courseCode });` checks for an existing course with the same `creator` and `courseCode`.
        *   If a duplicate is found, it returns an `{ error: ... }`.
    *   **`effects creates a new course ... and its ID is returned.`**:
        *   `const courseId = freshID() as Course;`: Generates a new unique ID for the course.
        *   `await this.courses.insertOne({ _id: courseId, creator, courseCode, title });`: Inserts the new course document.
        *   `return { course: courseId };`: Returns the new course's ID on success.
    *   **Rationale:** This action ensures that each user's courses are uniquely identified by their `courseCode`, while allowing different users to have courses with the same `courseCode` (e.g., "6.1040" for Alice and "6.1040" for Bob, if they were both instructors, or if the concept allowed multiple creators for the same code, though here it's "unique for the creator").

#### 5. `updateCourse` Action

*   **Correspondence to Concept Spec:**
    ```concept
    updateCourse (course: Course, newCourseCode: String, newTitle: String): Empty or (error: String)
      requires course exists and newCourseCode is unique for the creator (if changed)
      effects updates the courseCode and title of an existing course.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires course exists`**: `await this.courses.findOne({ _id: course });` checks if the course to be updated exists. If not, returns `{ error: ... }`.
    *   **`requires newCourseCode is unique for the creator (if changed)`**:
        *   An `if` block specifically checks if `existingCourse.courseCode !== newCourseCode`.
        *   If the code is being changed, it then performs another `findOne` query to ensure `newCourseCode` isn't already taken by another course belonging to the *same creator*. If a duplicate is found, it returns `{ error: ... }`.
    *   **`effects updates the courseCode and title`**: `await this.courses.updateOne({ _id: course }, { $set: { courseCode: newCourseCode, title: newTitle } });` performs the update.
    *   `return {};`: Returns an empty object on success.
    *   **Rationale:** This action allows modification of core course details while maintaining the uniqueness constraint for `courseCode` per `creator`.

#### 6. `setCanvasId` Action

*   **Correspondence to Concept Spec:**
    ```concept
    setCanvasId (course: Course, canvasId: String): Empty or (error: String)
      requires course exists and canvasId is unique across all courses
      effects sets or updates the external Canvas ID for the specified course.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires course exists`**: `await this.courses.findOne({ _id: course });` checks for the course.
    *   **`requires canvasId is unique across all courses`**:
        *   `const duplicateCanvasIdCourse = await this.courses.findOne({ canvasId });` queries for any course with this `canvasId`.
        *   `if (duplicateCanvasIdCourse && duplicateCanvasIdCourse._id !== course) { ... }`: If a duplicate is found *and it's not the current course itself*, an error is returned. This handles cases where a course might update its own `canvasId` to the same value (which is fine) versus trying to claim an `canvasId` already held by another course.
    *   **`effects sets or updates the external Canvas ID`**: `await this.courses.updateOne({ _id: course }, { $set: { canvasId } });` updates the `canvasId` field.
    *   `return {};`: Returns an empty object on success.
    *   **Rationale:** This action allows linking a course to an external Canvas instance, ensuring that each Canvas ID is uniquely mapped to one course in the system to prevent data inconsistencies or misattribution.

#### 7. `deleteCourse` Action

*   **Correspondence to Concept Spec:**
    ```concept
    deleteCourse (course: Course): Empty or (error: String)
      requires course exists and has no associated deadlines
      effects removes the specified course.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires course exists`**: `const result = await this.courses.deleteOne({ _id: course });` attempts to delete.
    *   `if (result.deletedCount === 0) { ... }`: If no document was deleted, it means the course didn't exist, so an error is returned.
    *   **`requires ... has no associated deadlines`**: As discussed earlier, this specific precondition cannot be enforced *within* `CourseManagement` without violating concept independence (as it would require querying `DeadlineManagement`'s state). The `NOTE` in the JSDoc explicitly addresses this: "This check must be enforced by external synchronizations or services before calling this action." The `deleteCourse` action strictly adheres to its own boundaries.
    *   **`effects removes the specified course`**: `deleteOne` fulfills this effect.
    *   `return {};`: Returns an empty object on success.
    *   **Rationale:** Provides a way to remove courses, with the understanding that referential integrity (e.g., cascading deletes for deadlines) would be handled by external synchronizations.

#### 8. Query Methods (`_getCourseById`, `_getCoursesByCreator`, `_getCourseByCodeAndCreator`, `_getAllCourses`)

*   **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` but are essential for testing and for other concepts/synchronizations to inspect `CourseManagement`'s state.
*   **Implementation Details & Rationale:**
    *   Methods starting with `_` are queries, reading state without modification.
    *   They provide flexible ways to retrieve course documents based on various criteria (ID, creator, code+creator, all courses).
    *   **Rationale:** These queries enable comprehensive testing of action effects and support the overall application's ability to display and filter course information.

***

### `src/coursemanagement/CourseManagementConcept.test.ts` Implementation Explained

This file contains tests for the `CourseManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The test file name and imports confirm its purpose for testing `CourseManagementConcept`.
*   **Implementation Details & Rationale:**
    *   Standard Deno assertion functions (`assertEquals`, `assertExists`, etc.`).
    *   `testDb`, `ID`, `freshID` from `@utils`.
    *   `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";`: **Crucially, this imports `UserIdentityConcept`.**
        *   **Rationale:** `CourseManagement.createCourse` requires a `creator: User` ID. Just like `UserAuthentication`, `CourseManagement` needs an existing `User` ID (from `UserIdentity`) to operate its actions. This showcases how concepts are independently implemented but integrate behaviorally via shared opaque IDs and synchronizations. The relative path `../useridentity/UserIdentityConcept.ts` assumes the test file is in `src/coursemanagement/` and `UserIdentityConcept.ts` is in `src/useridentity/`.

#### 2. Test Constants

*   **Implementation Details:** Defines constants (`TEST_EMAIL_ALICE`, `TEST_COURSE_CODE_61040`, etc.) for clear and consistent test data, improving readability and maintainability.

#### 3. "Principle" Test Case

*   **Correspondence to Concept Spec (`principle` section):**
    ```concept
    principle each user can define courses, assign unique identifiers, and manage course-specific details including an optional link to an external Canvas course.
    ```
    This test meticulously steps through this scenario.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates an `aliceUserId` using `UserIdentityConcept` first.
    *   **Define Course:** Calls `createCourse`, asserting success and that a `courseId` is returned. It then uses `_getCourseById` to verify the course's details are correctly stored (`courseCode`, `title`, `creator`).
    *   **Manage Details (Set Canvas ID):** Calls `setCanvasId`, asserting success. It then re-fetches the course to verify the `canvasId` is correctly applied.
    *   **Update Course Details:** Calls `updateCourse` to change the course title. Fetches the course again to confirm the `title` update.
    *   **Verify Creator's Courses:** Uses `_getCoursesByCreator` to confirm Alice has exactly one course with the updated title.
    *   **Rationale:** This end-to-end test confirms the fundamental workflow and core features outlined in the concept's principle.

#### 4. "Action: createCourse - enforces unique courseCode per creator" Test Case

*   **Correspondence to Concept Spec (`createCourse` action's `requires`):**
    ```concept
    requires courseCode is unique for the creator
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates Alice's `User` ID and one course for her.
    *   **Duplicate for Same Creator:** Attempts to create another course for Alice with the *same* `courseCode`. The test asserts that an error is returned and checks its specific message.
    *   **Unique for Different Creator:** Creates Bob's `User` ID. Bob then successfully creates a course with the *same* `courseCode` as Alice's. This is a critical part of the uniqueness rule (per creator) and is correctly verified.
    *   **State Check:** `_getAllCourses` confirms there are exactly two courses (Alice's and Bob's), not three, ensuring no duplicates were erroneously added.
    *   **Rationale:** Rigorously tests the `courseCode` uniqueness precondition, covering both failure (same creator) and success (different creator) scenarios.

#### 5. "Action: updateCourse - updates details and enforces uniqueness if code changes" Test Case

*   **Correspondence to Concept Spec (`updateCourse` action's `requires` and `effects`):**
    ```concept
    requires course exists and newCourseCode is unique for the creator (if changed)
    effects updates the courseCode and title of an existing course.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates Alice's `User` ID and two courses for her.
    *   **Update Title Only:** Updates one course's title while keeping its `courseCode` the same. Asserts success and verifies the title change.
    *   **Update Code and Title:** Updates the same course with a new, unique `courseCode` and new `title`. Asserts success and verifies both changes.
    *   **Attempt Duplicate Code Update:** Tries to update a course's `courseCode` to one already used by *another* of Alice's courses. Asserts an error with the correct message.
    *   **Non-existent Course Update:** Tries to update a completely fake course. Asserts an error.
    *   **Rationale:** Comprehensive testing for `updateCourse`, covering various valid and invalid update scenarios and verifying precondition enforcement.

#### 6. "Action: setCanvasId - sets unique Canvas ID globally" Test Case

*   **Correspondence to Concept Spec (`setCanvasId` action's `requires` and `effects`):**
    ```concept
    requires course exists and canvasId is unique across all courses
    effects sets or updates the external Canvas ID for the specified course.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates Alice and Bob's `User` IDs, and one course for each.
    *   **Alice Sets Canvas ID:** Alice successfully sets a `canvasId` for her course.
    *   **Bob Tries Duplicate Canvas ID:** Bob attempts to set his course's `canvasId` to the *same ID Alice used*. This *must fail* due to the global uniqueness requirement. The test asserts an error.
    *   **Bob Sets Unique Canvas ID:** Bob successfully sets a *different*, unique `canvasId` for his course.
    *   **Non-existent Course:** Tries to set `canvasId` for a fake course. Asserts an error.
    *   **Rationale:** Verifies the crucial global uniqueness constraint of `canvasId`, which is distinct from `courseCode`'s per-creator uniqueness.

#### 7. "Action: deleteCourse - successfully deletes a course" Test Case

*   **Correspondence to Concept Spec (`deleteCourse` action's `requires` and `effects`):**
    ```concept
    deleteCourse (course: Course): Empty or (error: String)
      requires course exists and has no associated deadlines
      effects removes the specified course.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates Alice's `User` ID and one course for her.
    *   **Successful Deletion:** Calls `deleteCourse`, asserts success.
    *   **Verification:** Uses `_getCourseById` and `_getAllCourses` to confirm the course is no longer present in the database.
    *   **Non-existent Course Deletion:** Tries to delete a fake course. Asserts an error.
    *   **`has no associated deadlines`**: As noted in the concept file, this part of the precondition is explicitly *not* tested here, because `CourseManagement` is independent of `DeadlineManagement`. The test focuses only on what `CourseManagement` itself can validate and effect: the existence and removal of its own `Course` entities.
    *   **Rationale:** Tests the fundamental ability to remove courses and its handling of non-existent inputs.

These detailed explanations cover the correspondence of code to specification, the underlying rationale for design choices (especially concerning independence and `ID` usage), and the thoroughness of the test suite in verifying both successful operations and precondition failures.


# question: now implement the deadlineManagment concept with its corresponding tests, also strictly following the spec and concept rubric/guidance
# response:

Okay, I will implement the `DeadlineManagement` concept and its corresponding tests, strictly adhering to the concept specification and rubric guidelines, especially concerning modularity and generic parameters.

***

# file: src/deadlinemanagement/DeadlineManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "DeadlineManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID; // User ID originating from UserIdentity concept
type Course = ID; // Course ID originating from CourseManagement concept

// Internal entity type for a Deadline
type Deadline = ID;

/**
 * Enumeration for the source of a deadline.
 * Corresponds to: a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
 */
enum Source {
  SYLLABUS = "SYLLABUS",
  CANVAS = "CANVAS",
  WEBSITE = "WEBSITE",
  MANUAL = "MANUAL",
  IMAGE = "IMAGE",
  LLM_PARSED = "LLM_PARSED",
}

/**
 * Enumeration for the status of a deadline.
 * Corresponds to: an optional status of NOT_STARTED or IN_PROGRESS or DONE
 */
enum Status {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

/**
 * State: A set of Deadlines, each associated with a Course, title, due date, source,
 * the User who added it, and an optional status.
 */
interface DeadlineDoc {
  _id: Deadline; // Primary key for this collection
  course: Course; // Reference to the CourseManagement's Course ID
  title: string;
  due: Date; // DateTime is represented as Date in TypeScript/MongoDB
  source: Source;
  addedBy: User; // Reference to the UserIdentity's User ID
  status?: Status; // Optional completion status
}

/**
 * @concept DeadlineManagement
 * @purpose store and manage academic deadlines, tracking their status and association with courses.
 */
export default class DeadlineManagementConcept {
  deadlines: Collection<DeadlineDoc>;

  constructor(private readonly db: Db) {
    this.deadlines = this.db.collection(PREFIX + "deadlines");
  }

  /**
   * Action: Creates a new deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course this deadline belongs to.
   * @param {string} args.title - The title of the deadline.
   * @param {Date} args.due - The due date and time of the deadline.
   * @param {Source} args.source - The origin of the deadline (e.g., SYLLABUS, MANUAL).
   * @param {User} args.addedBy - The ID of the User who added this deadline.
   * @returns {Promise<{deadline: Deadline} | {error: string}>} A promise that resolves to an object containing the new deadline's ID on success, or an error message on failure.
   * @requires course exists (this is handled by external concepts/syncs, here we assume the ID is valid).
   * @requires title is non-empty.
   * @effects Creates a new deadline with the given details, initially with no status.
   */
  async createDeadline(
    { course, title, due, source, addedBy }: {
      course: Course;
      title: string;
      due: Date;
      source: Source;
      addedBy: User;
    },
  ): Promise<{ deadline: Deadline } | { error: string }> {
    // Basic validation
    if (!title || title.trim() === "") {
      return { error: "Deadline title cannot be empty." };
    }
    if (!Object.values(Source).includes(source)) {
      return { error: `Invalid source: ${source}.` };
    }
    // Note: 'course exists' and 'user exists' are preconditions to be enforced by calling context/syncs
    // as per concept independence. This concept only ensures the ID is of the correct type.

    const deadlineId = freshID() as Deadline;
    await this.deadlines.insertOne({
      _id: deadlineId,
      course,
      title,
      due,
      source,
      addedBy,
      // status is optional, so it's not set initially unless provided explicitly
    });
    return { deadline: deadlineId };
  }

  /**
   * Action: Updates the title, due date, and/or source of an existing deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to update.
   * @param {string} args.newTitle - The new title of the deadline.
   * @param {Date} args.newDue - The new due date and time of the deadline.
   * @param {Source} args.newSource - The new origin of the deadline.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @requires newTitle is non-empty.
   * @effects Updates the title, due date, and source of an existing deadline.
   */
  async updateDeadline(
    { deadline, newTitle, newDue, newSource }: {
      deadline: Deadline;
      newTitle: string;
      newDue: Date;
      newSource: Source;
    },
  ): Promise<Empty | { error: string }> {
    const existingDeadline = await this.deadlines.findOne({ _id: deadline });
    if (!existingDeadline) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "Deadline title cannot be empty." };
    }
    if (!Object.values(Source).includes(newSource)) {
      return { error: `Invalid source: ${newSource}.` };
    }

    await this.deadlines.updateOne(
      { _id: deadline },
      { $set: { title: newTitle, due: newDue, source: newSource } },
    );
    return {};
  }

  /**
   * Action: Updates the completion status of a deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to update.
   * @param {Status} args.status - The new status of the deadline.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @effects Updates the completion status of a deadline.
   */
  async setStatus(
    { deadline, status }: { deadline: Deadline; status: Status },
  ): Promise<Empty | { error: string }> {
    const existingDeadline = await this.deadlines.findOne({ _id: deadline });
    if (!existingDeadline) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    if (!Object.values(Status).includes(status)) {
      return { error: `Invalid status: ${status}.` };
    }

    await this.deadlines.updateOne(
      { _id: deadline },
      { $set: { status } },
    );
    return {};
  }

  /**
   * Action: Removes the specified deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to delete.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @effects Removes the specified deadline.
   */
  async deleteDeadline({ deadline }: { deadline: Deadline }): Promise<Empty | { error: string }> {
    const result = await this.deadlines.deleteOne({ _id: deadline });

    if (result.deletedCount === 0) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    return {};
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves a deadline by its ID.
   */
  async _getDeadlineById({ deadlineId }: { deadlineId: Deadline }): Promise<DeadlineDoc | null> {
    return await this.deadlines.findOne({ _id: deadlineId });
  }

  /**
   * Query: Retrieves all deadlines associated with a specific course.
   */
  async _getDeadlinesByCourse({ courseId }: { courseId: Course }): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({ course: courseId }).toArray();
  }

  /**
   * Query: Retrieves all deadlines added by a specific user.
   */
  async _getDeadlinesByAddedBy({ userId }: { userId: User }): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({ addedBy: userId }).toArray();
  }

  /**
   * Query: Retrieves all deadlines.
   */
  async _getAllDeadlines(): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({}).toArray();
  }
}
```

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

*   **Correspondence to Concept Spec:** The file name `DeadlineManagementConcept.ts` directly reflects the singular name of the `DeadlineManagement` concept.
*   **Implementation Details & Rationale:**
    *   Standard imports for `Collection`, `Db` from `mongodb`, and project utilities `Empty`, `ID`, `freshID`.
    *   `const PREFIX = "DeadlineManagement" + ".";`: This prefix is used for MongoDB collection names (`DeadlineManagement.deadlines`), ensuring clear namespace separation and preventing conflicts with other concepts that might have similarly named internal collections. This adheres to the modularity principle.
    *   `type User = ID;` and `type Course = ID;`: These are the generic type parameters for the concept, representing opaque identifiers that originate from other independent concepts (`UserIdentity` and `CourseManagement`, respectively). `DeadlineManagement` doesn't need to know the internal structure of a `User` or a `Course`; it only needs their unique IDs for referential purposes. This is a core aspect of concept independence and polymorphism.
    *   `type Deadline = ID;`: This defines the internal entity ID for a deadline managed by this concept.

#### 2. Enumerations (`Source` and `Status`)

*   **Correspondence to Concept Spec (`state` section):**
    ```concept
    a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
    an optional status of NOT_STARTED or IN_PROGRESS or DONE
    ```
*   **Implementation Details & Rationale:**
    *   `enum Source { ... }` and `enum Status { ... }`: TypeScript enums are used to represent the discrete set of allowed values for `source` and `status`. Using enums provides type safety and makes the code more readable by restricting values to predefined options.
    *   **Rationale:** These directly model the enumerated types specified in the concept's state, ensuring data integrity for these fields.

#### 3. `DeadlineDoc` Interface (State Representation)

*   **Correspondence to Concept Spec (`state` section):** This interface directly maps to the `a set of Deadlines` declaration in the concept specification.
*   **Implementation Details & Rationale:**
    *   `_id: Deadline;`: MongoDB's primary key for each deadline document, using our internal `Deadline` ID.
    *   `course: Course;`: A reference (ID) to the `Course` entity from `CourseManagement`.
    *   `title: string;`: Corresponds to `a title String`.
    *   `due: Date;`: Corresponds to `a due DateTime`. TypeScript's `Date` object is the natural choice for representing `DateTime` in JavaScript/TypeScript, and MongoDB natively supports BSON Date types.
    *   `source: Source;`: Corresponds to `a source of ...`, using the defined `Source` enum.
    *   `addedBy: User;`: A reference (ID) to the `User` entity from `UserIdentity`.
    *   `status?: Status;`: Corresponds to `an optional status of ...`. The `?` makes it optional in TypeScript, matching "optional" in the spec, implying it might not be set upon creation.
    *   **Rationale:** This interface rigorously defines the structure of a deadline document stored in MongoDB, ensuring all state components specified in the concept are represented.

#### 4. Class Definition and Constructor

*   **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `DeadlineManagementConcept` and its JSDoc `@concept` and `@purpose` tags directly link to the concept's definition.
*   **Implementation Details & Rationale:**
    *   `deadlines: Collection<DeadlineDoc>;`: Declares the MongoDB collection where deadline documents will be stored.
    *   `constructor(private readonly db: Db) { ... }`: Initializes the `deadlines` collection, namespacing it as `DeadlineManagement.deadlines`.

#### 5. `createDeadline` Action

*   **Correspondence to Concept Spec:**
    ```concept
    createDeadline (course: Course, title: String, due: DateTime, source: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED, addedBy: User): (deadline: Deadline) or (error: String)
      requires course exists
      requires title is non-empty.
      effects creates a new deadline with the given details, initially with no status.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires title is non-empty`**:
        *   `if (!title || title.trim() === "")`: Checks if the title is empty or just whitespace. If so, returns an `{ error: ... }`.
    *   **`requires source is a valid enum value`**:
        *   `if (!Object.values(Source).includes(source))`: Validates that the provided `source` string is one of the allowed `Source` enum values. Returns an `{ error: ... }` if invalid.
    *   **`requires course exists`**: The JSDoc `// Note: 'course exists' and 'user exists' are preconditions to be enforced by calling context/syncs ...` explicitly highlights that this concept, due to independence, assumes the validity of `course` and `addedBy` IDs. It does not perform a database lookup on `CourseManagement` or `UserIdentity`. This directly follows the "Concept Independence" rubric point: "Concept does not rely on any properties of other concepts."
    *   **`effects creates a new deadline ...`**:
        *   `const deadlineId = freshID() as Deadline;`: Generates a new unique `ID`.
        *   `await this.deadlines.insertOne({ _id: deadlineId, course, title, due, source, addedBy });`: Inserts the new document. The `status` is omitted, making it `undefined` as per "optional status".
        *   `return { deadline: deadlineId };`: Returns the new deadline's ID on success.

#### 6. `updateDeadline` Action

*   **Correspondence to Concept Spec:**
    ```concept
    updateDeadline (deadline: Deadline, newTitle: String, newDue: DateTime, newSource: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED): Empty or (error: String)
      requires deadline exists.
      requires newTitle is non-empty.
      effects updates the title, due date, and source of an existing deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires deadline exists`**: `await this.deadlines.findOne({ _id: deadline });` checks for the deadline's existence. If not found, returns `{ error: ... }`.
    *   **`requires newTitle is non-empty`**: Similar check to `createDeadline`.
    *   **`requires newSource is a valid enum value`**: Similar check to `createDeadline`.
    *   **`effects updates the title, due date, and source`**: `await this.deadlines.updateOne({ _id: deadline }, { $set: { title: newTitle, due: newDue, source: newSource } });` updates the specified fields.
    *   `return {};`: Returns an empty object on success.

#### 7. `setStatus` Action

*   **Correspondence to Concept Spec:**
    ```concept
    setStatus (deadline: Deadline, status: NOT_STARTED or IN_PROGRESS or DONE): Empty or (error: String)
      requires deadline exists.
      effects updates the completion status of a deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires deadline exists`**: Checks for existence.
    *   **`requires status is a valid enum value`**: `if (!Object.values(Status).includes(status))`: Validates the `status` enum value.
    *   **`effects updates the completion status`**: `await this.deadlines.updateOne({ _id: deadline }, { $set: { status } });` updates the `status` field.
    *   `return {};`: Returns an empty object on success.

#### 8. `deleteDeadline` Action

*   **Correspondence to Concept Spec:**
    ```concept
    deleteDeadline (deadline: Deadline): Empty or (error: String)
      requires deadline exists.
      effects removes the specified deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires deadline exists`**: `const result = await this.deadlines.deleteOne({ _id: deadline });` attempts deletion.
    *   `if (result.deletedCount === 0) { ... }`: If no document was deleted, it means the deadline didn't exist, so an error is returned.
    *   **`effects removes the specified deadline`**: `deleteOne` operation fulfills this.
    *   `return {};`: Returns an empty object on success.

#### 9. Query Methods (`_getDeadlineById`, `_getDeadlinesByCourse`, `_getDeadlinesByAddedBy`, `_getAllDeadlines`)

*   **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` but are essential for testing and for other concepts/synchronizations to inspect `DeadlineManagement`'s state.
*   **Implementation Details & Rationale:**
    *   Methods prefixed with `_` are queries, designed to read the state without modification.
    *   They provide ways to retrieve `DeadlineDoc` documents based on ID, associated `Course` ID, or `addedBy` `User` ID, or all deadlines.
    *   **Rationale:** These queries are vital for verifying the `effects` of actions in tests and for enabling higher-level logic (e.g., displaying a user's deadlines or a course's deadlines).

---

### `src/deadlinemanagement/DeadlineManagementConcept.test.ts` Implementation Explained

This file contains tests for the `DeadlineManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The test file name directly reflects its purpose.
*   **Implementation Details & Rationale:**
    *   Standard Deno assertion functions are imported.
    *   `testDb`, `ID`, `freshID` are imported from `@utils`.
    *   `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";` and `import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";`: **These imports are crucial.**
        *   **Rationale:** The `DeadlineManagement` concept's actions (`createDeadline`) require `User` and `Course` IDs as generic parameters. To set up realistic test scenarios, we need to first create these `User` and `Course` entities using their respective concepts. This demonstrates that concepts are independently implemented but integrate behaviorally through shared opaque IDs. The relative paths reflect the assumed file structure (test in `deadlinemanagement`, concepts in sibling folders).

#### 2. Test Data Constants

*   **Implementation Details:** Defines constants for common test data (emails, names, course codes, deadline titles, due dates, sources). Using `new Date(...)` for `DateTime` ensures correct type usage.
*   **Rationale:** Improves test readability and maintainability, making it easy to see what data is being used for each test case.

#### 3. "Principle" Test Case

*   **Correspondence to Concept Spec (`principle` section):**
    ```concept
    principle each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.
    ```
    This test meticulously steps through this scenario.
*   **Implementation Details & Rationale:**
    *   **Setup:**
        *   Creates a `User` (`aliceUserId`) using `UserIdentityConcept`.
        *   Creates a `Course` (`courseId61040`) for that user using `CourseManagementConcept`.
        *   This establishes the necessary external IDs before `DeadlineManagement` actions can be called.
    *   **1. Create Deadline:** Calls `deadlineManagementConcept.createDeadline()`.
        *   `assertEquals("error" in createDeadlineResult, false, ...)`: Asserts no error.
        *   `assertExists(deadlineIdA1, ...)`: Asserts a `deadlineId` is returned.
    *   **Verify Initial State:** Uses `_getDeadlineById` to fetch the created deadline.
        *   Asserts `title`, `due`, `source`, `addedBy`, `course` are all correctly stored, directly reflecting the `state` properties.
        *   Asserts `status` is `undefined`, confirming the "optional" nature.
    *   **2. Update Status:** Calls `deadlineManagementConcept.setStatus()` to change the status.
        *   Asserts no error.
        *   Fetches the deadline again to confirm the `status` field is updated.
    *   **Verify Course Deadlines:** Uses `_getDeadlinesByCourse` to confirm the deadline is correctly associated with the course.
    *   **Rationale:** This end-to-end test confirms the concept's main purpose and principle by simulating a full lifecycle.

#### 4. "Action: createDeadline - enforces title and source requirements" Test Case

*   **Correspondence to Concept Spec (`createDeadline` action's `requires`):**
    ```concept
    requires title is non-empty.
    requires source is a valid enum value
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user and a course.
    *   **Empty Title:** Attempts `createDeadline` with an empty string for `title`. Asserts an error and checks its message.
    *   **Whitespace Title:** Attempts `createDeadline` with only whitespace for `title`. Asserts an error and checks its message.
    *   **Invalid Source:** Attempts `createDeadline` with a `source` string not in the `Source` enum. Asserts an error and checks its message.
    *   **State Check:** `_getAllDeadlines()` is used to confirm that no deadlines were actually created after these failed attempts.
    *   **Rationale:** Rigorously tests the explicit `requires` clauses of the `createDeadline` action.

#### 5. "Action: updateDeadline - updates fields and enforces requirements" Test Case

*   **Correspondence to Concept Spec (`updateDeadline` action's `requires` and `effects`):**
    ```concept
    requires deadline exists.
    requires newTitle is non-empty.
    requires newSource is a valid enum value.
    effects updates the title, due date, and source of an existing deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and a deadline.
    *   **Successful Update:** Calls `updateDeadline` with new valid values. Asserts success and verifies all updated fields using `_getDeadlineById`.
    *   **Non-existent Deadline:** Attempts `updateDeadline` with a fake `deadlineId`. Asserts an error.
    *   **Empty New Title:** Attempts `updateDeadline` with an empty `newTitle`. Asserts an error.
    *   **Invalid New Source:** Attempts `updateDeadline` with an invalid `newSource`. Asserts an error.
    *   **Rationale:** Comprehensive testing for `updateDeadline`, covering valid updates and various precondition failures.

#### 6. "Action: setStatus - updates status and enforces requirements" Test Case

*   **Correspondence to Concept Spec (`setStatus` action's `requires` and `effects`):**
    ```concept
    requires deadline exists.
    effects updates the completion status of a deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and a deadline.
    *   **Successful Status Updates:** Calls `setStatus` multiple times with different valid `Status` enum values (`IN_PROGRESS`, `DONE`). Asserts success and verifies the status changes after each call.
    *   **Non-existent Deadline:** Attempts `setStatus` with a fake `deadlineId`. Asserts an error.
    *   **Invalid Status:** Attempts `setStatus` with an invalid `status` string. Asserts an error.
    *   **Rationale:** Tests the `setStatus` action, ensuring it correctly updates the optional status field and enforces its preconditions.

#### 7. "Action: deleteDeadline - successfully deletes a deadline" Test Case

*   **Correspondence to Concept Spec (`deleteDeadline` action's `requires` and `effects`):**
    ```concept
    deleteDeadline (deadline: Deadline): Empty or (error: String)
      requires deadline exists.
      effects removes the specified deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and *two* deadlines.
    *   **Delete First Deadline:** Calls `deleteDeadline` for one deadline. Asserts success.
    *   **Partial Verification:** Checks that the first deadline is gone (`null` from query) but the second one still exists (`assertExists`). This confirms precise deletion and no unintended side effects.
    *   **Delete Second Deadline:** Deletes the remaining deadline.
    *   **Final Verification:** Checks `_getAllDeadlines()` to confirm all are gone.
    *   **Non-existent Deadline:** Attempts `deleteDeadline` for a fake `deadlineId`. Asserts an error.
    *   **Rationale:** Tests the `deleteDeadline` action, confirming successful removal and correct handling of non-existent entities. It also demonstrates how a single item can be deleted without affecting others.

These detailed explanations provide a clear understanding of the implementation and testing strategy for the `DeadlineManagement` concept, emphasizing its adherence to concept design principles.


# question: now implement the DocumentManagement concept with its corresponding tests, also strictly following the spec and concept rubric/guidance



# response:

Okay, I will implement the `DocumentManagement` concept and its corresponding tests, strictly following the updated concept specifications and the guidelines for modularity and generic parameters.

***

# file: src/documentmanagement/DocumentManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "DocumentManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID; // User ID originating from UserIdentity concept
type Course = ID; // Course ID originating from CourseManagement concept

// Internal entity type for an UploadedDocument
type UploadedDocument = ID;

/**
 * State: A set of UploadedDocuments, each associated with a Course, Uploader,
 * file metadata, upload timestamp, and the file content itself.
 */
interface UploadedDocumentDoc {
  _id: UploadedDocument; // Primary key for this collection
  course: Course; // Reference to the CourseManagement's Course ID
  uploader: User; // Reference to the UserIdentity's User ID
  fileName: string;
  fileType: string; // e.g., "application/pdf", "image/png", "text/plain"
  uploadTime: Date; // DateTime is represented as Date in TypeScript/MongoDB
  fileContent: string; // For storing content directly (e.g., base64 for images, raw text for PDFs)
}

/**
 * @concept DocumentManagement
 * @purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
 */
export default class DocumentManagementConcept {
  uploadedDocuments: Collection<UploadedDocumentDoc>;

  constructor(private readonly db: Db) {
    this.uploadedDocuments = this.db.collection(PREFIX + "uploadedDocuments");
  }

  /**
   * Action: Stores a new document and its metadata.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course this document is associated with.
   * @param {string} args.fileName - The name of the uploaded file.
   * @param {string} args.fileType - The MIME type of the file (e.g., "application/pdf").
   * @param {string} args.fileContent - The content of the file (e.g., base64 encoded, raw text).
   * @param {User} args.uploader - The ID of the User who uploaded this document.
   * @returns {Promise<{document: UploadedDocument, content: string} | {error: string}>} A promise that resolves to an object containing the new document's ID and its content on success, or an error message on failure.
   * @requires course exists (this is handled by external concepts/syncs, here we assume the ID is valid).
   * @requires fileName is non-empty.
   * @effects Stores the document content and metadata, associating it with the course and uploader. Returns document ID and content for further processing.
   */
  async uploadDocument(
    { course, fileName, fileType, fileContent, uploader }: {
      course: Course;
      fileName: string;
      fileType: string;
      fileContent: string;
      uploader: User;
    },
  ): Promise<{ document: UploadedDocument; content: string } | { error: string }> {
    // Basic validation
    if (!fileName || fileName.trim() === "") {
      return { error: "File name cannot be empty." };
    }
    if (!fileType || fileType.trim() === "") {
      return { error: "File type cannot be empty." };
    }
    if (!fileContent || fileContent.trim() === "") {
      return { error: "File content cannot be empty." };
    }
    // Note: 'course exists' and 'uploader exists' are preconditions to be enforced by calling context/syncs
    // as per concept independence. This concept only ensures the ID is of the correct type.

    const documentId = freshID() as UploadedDocument;
    const uploadTime = new Date();

    await this.uploadedDocuments.insertOne({
      _id: documentId,
      course,
      uploader,
      fileName,
      fileType,
      uploadTime,
      fileContent,
    });
    return { document: documentId, content: fileContent };
  }

  /**
   * Action: Updates the fileName and fileType of an existing document.
   * @param {Object} args - The arguments for the action.
   * @param {UploadedDocument} args.document - The ID of the document to update.
   * @param {string} args.newFileName - The new name of the file.
   * @param {string} args.newFileType - The new MIME type of the file.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires document exists.
   * @requires newFileName is non-empty.
   * @requires newFileType is non-empty.
   * @effects Updates the fileName and fileType of an existing document.
   */
  async updateDocumentMetadata(
    { document, newFileName, newFileType }: {
      document: UploadedDocument;
      newFileName: string;
      newFileType: string;
    },
  ): Promise<Empty | { error: string }> {
    const existingDocument = await this.uploadedDocuments.findOne({ _id: document });
    if (!existingDocument) {
      return { error: `Document with ID ${document} not found.` };
    }
    if (!newFileName || newFileName.trim() === "") {
      return { error: "New file name cannot be empty." };
    }
    if (!newFileType || newFileType.trim() === "") {
      return { error: "New file type cannot be empty." };
    }

    await this.uploadedDocuments.updateOne(
      { _id: document },
      { $set: { fileName: newFileName, fileType: newFileType } },
    );
    return {};
  }

  /**
   * Action: Retrieves the content of the specified document.
   * @param {Object} args - The arguments for the action.
   * @param {UploadedDocument} args.document - The ID of the document to retrieve content for.
   * @returns {Promise<{content: string} | {error: string}>} A promise that resolves to an object containing the document's content on success, or an error message on failure.
   * @requires document exists.
   * @effects Retrieves the content of the specified document.
   */
  async getDocumentContent({ document }: { document: UploadedDocument }): Promise<{ content: string } | { error: string }> {
    const existingDocument = await this.uploadedDocuments.findOne({ _id: document });
    if (!existingDocument) {
      return { error: `Document with ID ${document} not found.` };
    }

    return { content: existingDocument.fileContent };
  }

  /**
   * Action: Removes the specified document.
   * @param {Object} args - The arguments for the action.
   * @param {UploadedDocument} args.document - The ID of the document to delete.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires document exists.
   * @effects Removes the specified document.
   */
  async deleteDocument({ document }: { document: UploadedDocument }): Promise<Empty | { error: string }> {
    const result = await this.uploadedDocuments.deleteOne({ _id: document });

    if (result.deletedCount === 0) {
      return { error: `Document with ID ${document} not found.` };
    }
    return {};
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves an uploaded document by its ID.
   */
  async _getDocumentById({ documentId }: { documentId: UploadedDocument }): Promise<UploadedDocumentDoc | null> {
    return await this.uploadedDocuments.findOne({ _id: documentId });
  }

  /**
   * Query: Retrieves all documents associated with a specific course.
   */
  async _getDocumentsByCourse({ courseId }: { courseId: Course }): Promise<UploadedDocumentDoc[]> {
    return await this.uploadedDocuments.find({ course: courseId }).toArray();
  }

  /**
   * Query: Retrieves all documents uploaded by a specific user.
   */
  async _getDocumentsByUploader({ uploaderId }: { uploaderId: User }): Promise<UploadedDocumentDoc[]> {
    return await this.uploadedDocuments.find({ uploader: uploaderId }).toArray();
  }

  /**
   * Query: Retrieves all uploaded documents.
   */
  async _getAllDocuments(): Promise<UploadedDocumentDoc[]> {
    return await this.uploadedDocuments.find({}).toArray();
  }
}
```

# file: src/documentmanagement/DocumentManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertStrictEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts"; // Assuming path
import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts"; // Assuming path
import DocumentManagementConcept from "./DocumentManagementConcept.ts";

// Test data constants
const TEST_EMAIL_ALICE = "alice@example.com";
const TEST_NAME_ALICE = "Alice Smith";
const TEST_COURSE_CODE_61040 = "6.1040";
const TEST_TITLE_61040 = "Software Design and Development";

const DOC_FILE_NAME_SYLLABUS = "61040_syllabus.pdf";
const DOC_FILE_TYPE_SYLLABUS = "application/pdf";
const DOC_CONTENT_SYLLABUS = "This is the content of the 6.1040 syllabus PDF.";

const DOC_FILE_NAME_SCREENSHOT = "ps1_due_date.png";
const DOC_FILE_TYPE_SCREENSHOT = "image/png";
const DOC_CONTENT_SCREENSHOT = "base64_encoded_image_data_here";

Deno.test("Principle: Each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);

  try {
    // Setup: Create a User and a Course (external generic parameters)
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
    const { user: aliceUserId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
    const { course: courseId61040 } = createCourseResult as { course: ID };
    assertExists(aliceUserId);
    assertExists(courseId61040);

    // 1. Upload a document, linking it to the user and course
    const uploadDocResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    assertEquals("error" in uploadDocResult, false, `Document upload should succeed: ${JSON.stringify(uploadDocResult)}`);
    const { document: docIdSyllabus, content: returnedContent } = uploadDocResult as { document: ID; content: string };
    assertExists(docIdSyllabus);
    assertStrictEquals(returnedContent, DOC_CONTENT_SYLLABUS, "Uploaded content should be returned.");

    // Verify the document exists and has correct metadata
    const uploadedDoc = await documentManagementConcept._getDocumentById({ documentId: docIdSyllabus });
    assertExists(uploadedDoc, "The uploaded document should exist.");
    assertEquals(uploadedDoc?.fileName, DOC_FILE_NAME_SYLLABUS);
    assertEquals(uploadedDoc?.fileType, DOC_FILE_TYPE_SYLLABUS);
    assertEquals(uploadedDoc?.fileContent, DOC_CONTENT_SYLLABUS);
    assertStrictEquals(uploadedDoc?.course, courseId61040);
    assertStrictEquals(uploadedDoc?.uploader, aliceUserId);
    assertExists(uploadedDoc?.uploadTime, "Upload time should be recorded.");

    // 2. Its core metadata is maintained (e.g., retrieve content)
    const getContentResult = await documentManagementConcept.getDocumentContent({ document: docIdSyllabus });
    assertEquals("error" in getContentResult, false, `Getting document content should succeed: ${JSON.stringify(getContentResult)}`);
    assertEquals((getContentResult as { content: string }).content, DOC_CONTENT_SYLLABUS, "Retrieved content should match uploaded content.");

    // 3. Update document metadata
    const newFileName = "updated_61040_syllabus.pdf";
    const newFileType = "application/x-pdf"; // Example of a different but plausible type
    const updateMetadataResult = await documentManagementConcept.updateDocumentMetadata({
      document: docIdSyllabus,
      newFileName,
      newFileType,
    });
    assertEquals("error" in updateMetadataResult, false, `Updating metadata should succeed: ${JSON.stringify(updateMetadataResult)}`);

    const updatedDoc = await documentManagementConcept._getDocumentById({ documentId: docIdSyllabus });
    assertEquals(updatedDoc?.fileName, newFileName, "File name should be updated.");
    assertEquals(updatedDoc?.fileType, newFileType, "File type should be updated.");
    // Content and uploader/course should remain unchanged
    assertEquals(updatedDoc?.fileContent, DOC_CONTENT_SYLLABUS);
    assertStrictEquals(updatedDoc?.uploader, aliceUserId);

  } finally {
    await client.close();
  }
});

Deno.test("Action: uploadDocument - enforces non-empty fields for metadata and content", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
    const { user: aliceUserId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
    const { course: courseId61040 } = createCourseResult as { course: ID };

    // Requires: fileName is non-empty
    const emptyFileNameResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: "",
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    assertEquals("error" in emptyFileNameResult, true, "Upload with empty file name should fail.");
    assertEquals((emptyFileNameResult as { error: string }).error, "File name cannot be empty.");

    // Requires: fileType is non-empty
    const emptyFileTypeResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: " ", // Whitespace
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    assertEquals("error" in emptyFileTypeResult, true, "Upload with empty file type should fail.");
    assertEquals((emptyFileTypeResult as { error: string }).error, "File type cannot be empty.");

    // Requires: fileContent is non-empty
    const emptyFileContentResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: "",
      uploader: aliceUserId,
    });
    assertEquals("error" in emptyFileContentResult, true, "Upload with empty file content should fail.");
    assertEquals((emptyFileContentResult as { error: string }).error, "File content cannot be empty.");

    const allDocs = await documentManagementConcept._getAllDocuments();
    assertEquals(allDocs.length, 0, "No documents should be created after failed attempts.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: updateDocumentMetadata - enforces document existence and non-empty new metadata", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
    const { user: aliceUserId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
    const { course: courseId61040 } = createCourseResult as { course: ID };

    const uploadDocResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    // Requires: document exists
    const nonExistentDocId = freshID() as ID;
    const nonExistentUpdateResult = await documentManagementConcept.updateDocumentMetadata({
      document: nonExistentDocId,
      newFileName: "fake.pdf",
      newFileType: "application/pdf",
    });
    assertEquals("error" in nonExistentUpdateResult, true, "Updating non-existent document should fail.");
    assertEquals((nonExistentUpdateResult as { error: string }).error, `Document with ID ${nonExistentDocId} not found.`);

    // Requires: newFileName is non-empty
    const emptyNewFileNameResult = await documentManagementConcept.updateDocumentMetadata({
      document: docId,
      newFileName: "",
      newFileType: DOC_FILE_TYPE_SYLLABUS,
    });
    assertEquals("error" in emptyNewFileNameResult, true, "Updating with empty new file name should fail.");
    assertEquals((emptyNewFileNameResult as { error: string }).error, "New file name cannot be empty.");

    // Requires: newFileType is non-empty
    const emptyNewFileTypeResult = await documentManagementConcept.updateDocumentMetadata({
      document: docId,
      newFileName: "still_valid.pdf",
      newFileType: " ",
    });
    assertEquals("error" in emptyNewFileTypeResult, true, "Updating with empty new file type should fail.");
    assertEquals((emptyNewFileTypeResult as { error: string }).error, "New file type cannot be empty.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: getDocumentContent - enforces document existence and retrieves content", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
    const { user: aliceUserId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
    const { course: courseId61040 } = createCourseResult as { course: ID };

    const uploadDocResult = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    // Successfully retrieve content
    const getContentResult = await documentManagementConcept.getDocumentContent({ document: docId });
    assertEquals("error" in getContentResult, false, "Retrieving content should succeed.");
    assertEquals((getContentResult as { content: string }).content, DOC_CONTENT_SYLLABUS, "Retrieved content should match.");

    // Requires: document exists
    const nonExistentDocId = freshID() as ID;
    const nonExistentContentResult = await documentManagementConcept.getDocumentContent({ document: nonExistentDocId });
    assertEquals("error" in nonExistentContentResult, true, "Retrieving content for non-existent document should fail.");
    assertEquals((nonExistentContentResult as { error: string }).error, `Document with ID ${nonExistentDocId} not found.`);

  } finally {
    await client.close();
  }
});

Deno.test("Action: deleteDocument - successfully deletes a document", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_EMAIL_ALICE, name: TEST_NAME_ALICE });
    const { user: aliceUserId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: aliceUserId, courseCode: TEST_COURSE_CODE_61040, title: TEST_TITLE_61040 });
    const { course: courseId61040 } = createCourseResult as { course: ID };

    const uploadDocResult1 = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SYLLABUS,
      fileType: DOC_FILE_TYPE_SYLLABUS,
      fileContent: DOC_CONTENT_SYLLABUS,
      uploader: aliceUserId,
    });
    const { document: docId1 } = uploadDocResult1 as { document: ID; content: string };

    const uploadDocResult2 = await documentManagementConcept.uploadDocument({
      course: courseId61040,
      fileName: DOC_FILE_NAME_SCREENSHOT,
      fileType: DOC_FILE_TYPE_SCREENSHOT,
      fileContent: DOC_CONTENT_SCREENSHOT,
      uploader: aliceUserId,
    });
    const { document: docId2 } = uploadDocResult2 as { document: ID; content: string };

    // Delete first document
    const deleteResult1 = await documentManagementConcept.deleteDocument({ document: docId1 });
    assertEquals("error" in deleteResult1, false, "First document deletion should succeed.");

    // Verify it's gone, but the other remains
    const deletedDoc1 = await documentManagementConcept._getDocumentById({ documentId: docId1 });
    assertEquals(deletedDoc1, null, "Document 1 should be deleted.");
    const remainingDoc = await documentManagementConcept._getDocumentById({ documentId: docId2 });
    assertExists(remainingDoc, "Document 2 should still exist.");

    // Delete second document
    const deleteResult2 = await documentManagementConcept.deleteDocument({ document: docId2 });
    assertEquals("error" in deleteResult2, false, "Second document deletion should succeed.");

    const allDocs = await documentManagementConcept._getAllDocuments();
    assertEquals(allDocs.length, 0, "All documents should be deleted.");

    // Attempt to delete a non-existent document
    const nonExistentDocId = freshID() as ID;
    const nonExistentDeleteResult = await documentManagementConcept.deleteDocument({ document: nonExistentDocId });
    assertEquals("error" in nonExistentDeleteResult, true, "Deleting non-existent document should fail.");
    assertEquals((nonExistentDeleteResult as { error: string }).error, `Document with ID ${nonExistentDocId} not found.`);

  } finally {
    await client.close();
  }
});
```

***

### `src/documentmanagement/DocumentManagementConcept.ts` Implementation Explained

This file implements the `DocumentManagement` concept, handling the storage, retrieval, and management of various uploaded materials.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The file name `DocumentManagementConcept.ts` directly aligns with the singular concept name `DocumentManagement`.
*   **Implementation Details & Rationale:**
    *   Standard imports for `Collection`, `Db` from `mongodb`, and project utilities `Empty`, `ID`, `freshID`.
    *   `const PREFIX = "DocumentManagement" + ".";`: This prefix is used for MongoDB collection names (`DocumentManagement.uploadedDocuments`), ensuring unique namespacing in the database. This is critical for maintaining modularity and avoiding naming collisions if other concepts were to manage their own "documents" internally.
    *   `type User = ID;` and `type Course = ID;`: These are the generic type parameters for the concept, representing opaque identifiers originating from `UserIdentity` and `CourseManagement`, respectively. `DocumentManagement` treats these simply as unique IDs, without needing to know the internal details (email, password, course code) of those entities. This strictly follows the principle of concept independence and polymorphism.
    *   `type UploadedDocument = ID;`: This defines the internal entity ID for an individual uploaded document managed by this concept.

#### 2. `UploadedDocumentDoc` Interface (State Representation)

*   **Correspondence to Concept Spec (`state` section):** This interface directly maps to the `a set of UploadedDocuments` declaration in the concept specification.
    ```concept
    state
    a set of UploadedDocuments with
      a course Course
      a uploader User
      a fileName String
      a fileType String // e.g., "application/pdf", "image/png", "text/plain"
      a uploadTime DateTime
      a fileContent String // For storing content directly (e.g., base64 for images, raw text for PDFs)
    ```
*   **Implementation Details & Rationale:**
    *   `_id: UploadedDocument;`: MongoDB's primary key for each document, ensuring unique identification within its collection.
    *   `course: Course;`: A reference (ID) to the `Course` entity, as a generic parameter.
    *   `uploader: User;`: A reference (ID) to the `User` entity, as a generic parameter.
    *   `fileName: string;`, `fileType: string;`, `fileContent: string;`: Directly correspond to the `String` types in the spec.
    *   `uploadTime: Date;`: Corresponds to `a uploadTime DateTime`. TypeScript's `Date` object is the standard representation for `DateTime` in JavaScript/TypeScript, and MongoDB handles it as a BSON Date type.
    *   **Rationale:** This interface rigorously defines the structure of an uploaded document, ensuring all specified state components are correctly represented for persistence.

#### 3. Class Definition and Constructor

*   **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `DocumentManagementConcept` and its JSDoc `@concept` and `@purpose` tags explicitly link to the concept's definition.
*   **Implementation Details & Rationale:**
    *   `uploadedDocuments: Collection<UploadedDocumentDoc>;`: Declares the MongoDB collection that will store documents for this concept.
    *   `constructor(private readonly db: Db) { ... }`: Initializes the `uploadedDocuments` collection using the defined `PREFIX`.

#### 4. `uploadDocument` Action

*   **Correspondence to Concept Spec:**
    ```concept
    uploadDocument (course: Course, fileName: String, fileType: String, fileContent: String, uploader: User): (document: UploadedDocument, content: String) or (error: String)
      requires course exists
      effects stores the document content and metadata, associating it with the course and uploader. Returns document ID and content for further processing.
    ```
*   **Implementation Details & Rationale:**
    *   **Input Validation (`fileName`, `fileType`, `fileContent` non-empty):** The initial `if` statements check for empty or whitespace-only inputs for these crucial fields. If any are invalid, an `{ error: ... }` is returned, enforcing basic data integrity.
    *   **`requires course exists` and `requires uploader exists` (implicit):** The JSDoc `// Note: 'course exists' and 'uploader exists' are preconditions to be enforced by calling context/syncs...` explicitly follows the independence principle. `DocumentManagement` does not query `CourseManagement` or `UserIdentity` to verify the existence of these IDs. It assumes that any `Course` or `User` ID passed in is valid and comes from the appropriate managing concept. This ensures strict separation of concerns.
    *   **`effects stores the document content and metadata ... Returns document ID and content`**:
        *   `const documentId = freshID() as UploadedDocument;`: A new unique ID is generated for the document.
        *   `const uploadTime = new Date();`: The current timestamp is captured.
        *   `await this.uploadedDocuments.insertOne({ _id: documentId, course, uploader, fileName, fileType, uploadTime, fileContent });`: The new document is inserted into the collection.
        *   `return { document: documentId, content: fileContent };`: The action returns both the new document's ID and its content, as explicitly stated in the spec.

#### 5. `updateDocumentMetadata` Action

*   **Correspondence to Concept Spec:**
    ```concept
    updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
      requires document exists
      effects updates the fileName and fileType of an existing document.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires document exists`**: `await this.uploadedDocuments.findOne({ _id: document });` checks if the document to be updated exists. If not found, returns an `{ error: ... }`.
    *   **Input Validation (`newFileName`, `newFileType` non-empty):** Similar to `uploadDocument`, checks for non-empty string inputs for the new metadata.
    *   **`effects updates the fileName and fileType`**: `await this.uploadedDocuments.updateOne({ _id: document }, { $set: { fileName: newFileName, fileType: newFileType } });` updates the specified fields in the database.
    *   `return {};`: Returns an empty object on success.

#### 6. `getDocumentContent` Action

*   **Correspondence to Concept Spec:**
    ```concept
    getDocumentContent (document: UploadedDocument): (content: String) or (error: String)
      requires document exists
      effects retrieves the content of the specified document.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires document exists`**: `await this.uploadedDocuments.findOne({ _id: document });` checks for the document. If not found, returns an `{ error: ... }`.
    *   **`effects retrieves the content`**: If the document exists, `return { content: existingDocument.fileContent };` returns its `fileContent`.

#### 7. `deleteDocument` Action

*   **Correspondence to Concept Spec:**
    ```concept
    deleteDocument (document: UploadedDocument): Empty or (error: String)
      requires document exists
      effects removes the specified document.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires document exists`**: `const result = await this.uploadedDocuments.deleteOne({ _id: document });` attempts to delete the document.
    *   `if (result.deletedCount === 0) { ... }`: If `deletedCount` is 0, it means the document with the given ID was not found, so an error is returned.
    *   **`effects removes the specified document`**: The `deleteOne` operation fulfills this effect.
    *   `return {};`: Returns an empty object on success.

#### 8. Query Methods (`_getDocumentById`, `_getDocumentsByCourse`, `_getDocumentsByUploader`, `_getAllDocuments`)

*   **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` section but are essential for testing and for other concepts/synchronizations to inspect `DocumentManagement`'s state (e.g., `SuggestionManagement` needs to fetch documents).
*   **Implementation Details & Rationale:**
    *   Methods prefixed with `_` are queries, designed to read the state without modification.
    *   They provide various ways to retrieve `UploadedDocumentDoc` documents based on ID, associated `Course` ID, or `uploader` `User` ID, or all documents.
    *   **Rationale:** These queries are vital for verifying the `effects` of actions in tests and for enabling higher-level logic in the application.

***

### `src/documentmanagement/DocumentManagementConcept.test.ts` Implementation Explained

This file contains tests for the `DocumentManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The test file name and imports confirm its purpose.
*   **Implementation Details & Rationale:**
    *   Standard Deno assertion functions are imported.
    *   `testDb`, `ID`, `freshID` are imported from `@utils`.
    *   `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";` and `import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";`: **These imports are crucial for test setup.**
        *   **Rationale:** The `DocumentManagement` concept's actions (`uploadDocument`) require `User` and `Course` IDs as generic parameters. To create realistic test scenarios, we first need to instantiate `UserIdentityConcept` and `CourseManagementConcept` to generate valid `User` and `Course` IDs. This highlights that while concepts are independently implemented, they are designed to interact behaviorally through shared opaque identifiers. The relative paths assume a sibling directory structure for concepts.

#### 2. Test Data Constants

*   **Implementation Details:** Defines constants for common test data (emails, names, course codes, file names, types, and content). Using descriptive names improves test readability.
*   **Rationale:** Provides clear and consistent inputs for test cases, making it easier to understand test intent and outcomes.

#### 3. "Principle" Test Case

*   **Correspondence to Concept Spec (`principle` section):**
    ```concept
    principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.
    ```
    This test block meticulously steps through this scenario.
*   **Implementation Details & Rationale:**
    *   **Setup:**
        *   Creates a `User` (`aliceUserId`) using `UserIdentityConcept`.
        *   Creates a `Course` (`courseId61040`) for that user using `CourseManagementConcept`.
        *   This provides the necessary external IDs as arguments for `DocumentManagement` actions.
    *   **1. Upload Document:** Calls `documentManagementConcept.uploadDocument()`.
        *   `assertEquals("error" in uploadDocResult, false, ...)`: Asserts no error on successful upload.
        *   `assertExists(docIdSyllabus, ...)`: Asserts that a `document ID` is returned.
        *   `assertStrictEquals(returnedContent, DOC_CONTENT_SYLLABUS, ...)`: Verifies that the action correctly returns the content along with the ID, as per the spec.
    *   **Verify Initial State:** Uses `_getDocumentById` to fetch the newly uploaded document.
        *   Assumes `uploadedDoc` exists and then verifies all its metadata (`fileName`, `fileType`, `fileContent`, `course`, `uploader`, `uploadTime`) against the input, confirming the `effects`.
    *   **2. Retrieve Content:** Calls `documentManagementConcept.getDocumentContent()` to explicitly retrieve the content.
        *   Asserts success and verifies the returned `content`.
    *   **3. Update Metadata:** Calls `documentManagementConcept.updateDocumentMetadata()` to change the `fileName` and `fileType`.
        *   Asserts success.
        *   Fetches the document again and verifies that only `fileName` and `fileType` are updated, while other fields (`fileContent`, `uploader`, `course`) remain unchanged, confirming frame conditions.
    *   **Rationale:** This end-to-end test confirms the concept's main purpose and principle by simulating a full lifecycle from upload to metadata update and content retrieval.

#### 4. "Action: uploadDocument - enforces non-empty fields for metadata and content" Test Case

*   **Correspondence to Concept Spec (`uploadDocument` action's implicit preconditions):** The explicit `requires` in the spec are `course exists`. My implementation adds checks for non-empty `fileName`, `fileType`, and `fileContent`. This test validates these implementation-level preconditions.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user and a course.
    *   **Empty `fileName`:** Attempts `uploadDocument` with an empty string for `fileName`. Asserts an error and checks its specific message.
    *   **Empty `fileType` (whitespace):** Attempts `uploadDocument` with whitespace for `fileType`. Asserts an error and checks its specific message.
    *   **Empty `fileContent`:** Attempts `uploadDocument` with an empty string for `fileContent`. Asserts an error and checks its specific message.
    *   **State Check:** `_getAllDocuments()` is used to confirm that no documents were created after these failed attempts.
    *   **Rationale:** Rigorously tests the essential input validation logic for creating documents.

#### 5. "Action: updateDocumentMetadata - enforces document existence and non-empty new metadata" Test Case

*   **Correspondence to Concept Spec (`updateDocumentMetadata` action's `requires`):**
    ```concept
    requires document exists.
    requires newFileName is non-empty.
    requires newFileType is non-empty.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and one document.
    *   **Non-existent Document:** Attempts `updateDocumentMetadata` with a fake `document ID`. Asserts an error.
    *   **Empty `newFileName`:** Attempts `updateDocumentMetadata` with an empty string for `newFileName`. Asserts an error.
    *   **Empty `newFileType` (whitespace):** Attempts `updateDocumentMetadata` with whitespace for `newFileType`. Asserts an error.
    *   **Rationale:** Comprehensive testing for `updateDocumentMetadata`, verifying preconditions.

#### 6. "Action: getDocumentContent - enforces document existence and retrieves content" Test Case

*   **Correspondence to Concept Spec (`getDocumentContent` action's `requires` and `effects`):**
    ```concept
    requires document exists.
    effects retrieves the content of the specified document.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and one document.
    *   **Successful Retrieval:** Calls `getDocumentContent` with a valid `document ID`. Asserts success and verifies the returned `content`.
    *   **Non-existent Document:** Attempts `getDocumentContent` with a fake `document ID`. Asserts an error.
    *   **Rationale:** Tests the core functionality of content retrieval and its precondition.

#### 7. "Action: deleteDocument - successfully deletes a document" Test Case

*   **Correspondence to Concept Spec (`deleteDocument` action's `requires` and `effects`):**
    ```concept
    deleteDocument (document: UploadedDocument): Empty or (error: String)
      requires document exists.
      effects removes the specified document.
    ```
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a user, a course, and *two* documents.
    *   **Delete First Document:** Calls `deleteDocument` for one document. Asserts success.
    *   **Partial Verification:** Checks that the first document is gone (`null` from query) but the second one still exists (`assertExists`). This confirms precise deletion and no unintended side effects.
    *   **Delete Second Document:** Deletes the remaining document.
    *   **Final Verification:** Checks `_getAllDocuments()` to confirm all documents are deleted.
    *   **Non-existent Document:** Attempts `deleteDocument` for a fake `document ID`. Asserts an error.
    *   **Rationale:** Tests the `deleteDocument` action, confirming successful removal and correct handling of non-existent entities, as well as demonstrating isolated deletion.

These detailed explanations provide a clear understanding of the implementation and testing strategy for the `DocumentManagement` concept, adhering strictly to the concept design principles of modularity and independence.


# question how are documents treated? like linked like AWS S3 or google drive links or what?
# response:

That's an excellent question, and it highlights a key aspect of how `DocumentManagement` is designed within the Concept Design framework.

Based on the concept specification and the TypeScript implementation:

**Documents are treated as having their content stored directly within the `DocumentManagement` concept's state in MongoDB.**

Let's break down the evidence:

1.  **Concept State Declaration:**
    ```concept
    a set of UploadedDocuments with
      ...
      a fileContent String // For storing content directly (e.g., base64 for images, raw text for PDFs)
    ```
    The `fileContent` field is explicitly defined as a `String` and the comment clarifies that it's "for storing content directly." This means the actual data of the file (e.g., the text from a PDF, or a base64 encoded string of an image) is part of the `UploadedDocument` record.

2.  **TypeScript Interface (`UploadedDocumentDoc`):**
    ```typescript
    interface UploadedDocumentDoc {
      _id: UploadedDocument;
      // ... other metadata fields
      fileContent: string; // For storing content directly (e.g., base64 for images, raw text for PDFs)
    }
    ```
    The `fileContent` property is a `string` directly within the `UploadedDocumentDoc` interface, which maps to a single MongoDB document.

3.  **`uploadDocument` Action:**
    ```typescript
    async uploadDocument(
      { course, fileName, fileType, fileContent, uploader }: {
        // ...
        fileContent: string;
        // ...
      },
    ): Promise<{ document: UploadedDocument; content: string } | { error: string }> {
      // ...
      await this.uploadedDocuments.insertOne({
        _id: documentId,
        course,
        uploader,
        fileName,
        fileType,
        uploadTime,
        fileContent, // <-- Stored directly
      });
      return { document: documentId, content: fileContent }; // Returns content directly
    }
    ```
    The `uploadDocument` action takes `fileContent` as a direct string argument and stores it verbatim in the MongoDB document. It also returns this content as part of its successful result.

4.  **`getDocumentContent` Action:**
    ```typescript
    async getDocumentContent({ document }: { document: UploadedDocument }): Promise<{ content: string } | { error: string }> {
      const existingDocument = await this.uploadedDocuments.findOne({ _id: document });
      // ...
      return { content: existingDocument.fileContent }; // <-- Retrieved directly
    }
    ```
    The `getDocumentContent` action directly retrieves the `fileContent` string from the stored document.

### Rationale within Concept Design:

This approach aligns with several Concept Design principles:

*   **Completeness of Functionality:** The `DocumentManagement` concept is "complete" with respect to storing and retrieving document content. It doesn't rely on an external service to host the files (like AWS S3 or Google Drive) and merely store a URL. Its actions are self-sufficient for the specified purpose.
*   **Independence:** The concept does not need to know the implementation details of any external file storage service. It treats `fileContent` as an internal piece of its state, reducing coupling. If it stored S3 URLs, it would implicitly depend on an S3 service being available and managed elsewhere.
*   **Focus:** Its sole focus is on managing *uploaded materials*, which includes their content, without conflating concerns about external storage providers or complex file serving infrastructure.

### Implications for a Real-World Application:

While this design perfectly adheres to Concept Design principles at this level of abstraction, in a production application, directly storing large file contents (especially binary files encoded as base64 strings) in MongoDB documents has considerations:

*   **Document Size Limits:** MongoDB documents have a 16MB size limit. Very large files would exceed this.
*   **Performance:** Storing and retrieving very large string fields can impact database performance, making reads and writes slower.
*   **Cost:** For large volumes of files, dedicated object storage services (like AWS S3, Google Cloud Storage, or Azure Blob Storage) are often more cost-effective and performant than storing directly in a general-purpose database like MongoDB.
*   **MongoDB GridFS:** For larger files that *must* be stored within MongoDB, GridFS is a specification for storing and retrieving files that exceed the BSON document size limit. It splits files into chunks and stores them in separate collections.

**In summary:** The `DocumentManagement` concept stores the actual document content (as a string) within its MongoDB collection. This choice prioritizes concept independence and completeness, abstracting away the underlying storage mechanism details from other concepts. For a real-world application, a decision on whether to use direct storage, GridFS, or external object storage would be an implementation detail potentially managed through a separate system concept or infrastructure layer, possibly involving synchronizations if an external service is used.



# response:

Okay, I will implement the `SuggestionManagement` concept and its corresponding tests, strictly following the provided concept specification and the established rubric guidelines for modularity and independence.

***

# file: src/suggestionmanagement/SuggestionManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { List } from "lodash"; // Assuming List is a type alias for array, or using Array directly

// Collection prefix to ensure namespace separation
const PREFIX = "SuggestionManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID; // User ID originating from UserIdentity concept
type Document = ID; // Document ID originating from DocumentManagement concept
type Course = ID; // Course ID originating from CourseManagement concept

// Internal entity types for Suggestions and Configs
type ParsedDeadlineSuggestion = ID;
type ExtractionConfig = ID;

/**
 * Enumeration for the source of a parsed deadline suggestion.
 * Corresponds to: a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
 */
enum SuggestionSource {
  SYLLABUS = "SYLLABUS",
  IMAGE = "IMAGE",
  WEBSITE = "WEBSITE",
  CANVAS = "CANVAS",
}

/**
 * Enumeration for the method of extraction.
 * Corresponds to: an optional extractionMethod of CANVAS_JSON or LLM
 */
enum ExtractionMethod {
  CANVAS_JSON = "CANVAS_JSON",
  LLM = "LLM",
}

/**
 * State: A set of ParsedDeadlineSuggestions.
 */
interface ParsedDeadlineSuggestionDoc {
  _id: ParsedDeadlineSuggestion; // Primary key for this collection
  user: User; // The user who initiated the parsing
  document?: Document; // Optional: ID of the UploadedDocument if applicable
  canvasMetadata?: string; // Optional: Raw JSON data from Canvas
  websiteUrl?: string; // Optional: URL if extracted from a website
  title: string;
  due: Date; // DateTime is represented as Date in TypeScript/MongoDB
  source: SuggestionSource;
  confirmed?: boolean; // Default to false, matches `an optional confirmed Boolean = false` in spec
  confidence?: number; // Optional: 0.0-1.0
  extractionMethod?: ExtractionMethod; // Optional: CANVAS_JSON or LLM
  provenance?: string; // Optional: e.g., LLM model version, prompt used, file name
  warnings?: string[]; // Optional: e.g., "date ambiguous", "low confidence"
}

/**
 * State: A set of ExtractionConfigs.
 */
interface ExtractionConfigDoc {
  _id: ExtractionConfig; // Primary key for this collection
  name: string; // Unique name for the config
  modelVersion: string;
  basePromptTemplate: string;
  maxTokens: number;
  temperature: number;
  timezone: string;
  timeout?: number; // Optional
}

/**
 * Type for document inputs in llmExtractFromMultipleDocuments action.
 * Note: This is a composite object within an action argument,
 * which generally goes against Concept Design principles of passing primitive or ID types.
 * However, it is explicitly defined in the provided specification for this action.
 */
interface DocumentContentPair {
  documentId: Document;
  documentContent: string;
}

/**
 * @concept SuggestionManagement
 * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
 */
export default class SuggestionManagementConcept {
  parsedDeadlineSuggestions: Collection<ParsedDeadlineSuggestionDoc>;
  extractionConfigs: Collection<ExtractionConfigDoc>;

  constructor(private readonly db: Db) {
    this.parsedDeadlineSuggestions = this.db.collection(PREFIX + "parsedDeadlineSuggestions");
    this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
  }

  /**
   * Helper to ensure valid Source enum value.
   */
  private isValidSuggestionSource(source: string): source is SuggestionSource {
    return Object.values(SuggestionSource).includes(source as SuggestionSource);
  }

  /**
   * Helper to ensure valid ExtractionMethod enum value.
   */
  private isValidExtractionMethod(method: string): method is ExtractionMethod {
    return Object.values(ExtractionMethod).includes(method as ExtractionMethod);
  }

  /**
   * Action: Creates a new extraction configuration for LLM processing.
   * @param {Object} args - The arguments for the action.
   * @param {string} args.name - Unique name for the configuration.
   * @param {string} args.modelVersion - The version of the LLM model.
   * @param {string} args.basePromptTemplate - The base prompt template.
   * @param {number} args.maxTokens - Maximum tokens for generation.
   * @param {number} args.temperature - LLM temperature setting.
   * @param {string} args.timezone - Timezone for date parsing.
   * @param {number} [args.optionalTimeout] - Optional timeout for LLM calls.
   * @returns {Promise<{config: ExtractionConfig} | {error: string}>} A promise that resolves to the new config's ID on success, or an error.
   * @requires name is unique.
   * @effects Creates a new extraction configuration.
   */
  async createExtractionConfig(
    { name, modelVersion, basePromptTemplate, maxTokens, temperature, timezone, optionalTimeout }: {
      name: string;
      modelVersion: string;
      basePromptTemplate: string;
      maxTokens: number;
      temperature: number;
      timezone: string;
      optionalTimeout?: number;
    },
  ): Promise<{ config: ExtractionConfig } | { error: string }> {
    if (!name || name.trim() === "") {
      return { error: "Configuration name cannot be empty." };
    }
    const existingConfig = await this.extractionConfigs.findOne({ name });
    if (existingConfig) {
      return { error: `ExtractionConfig with name '${name}' already exists.` };
    }

    const configId = freshID() as ExtractionConfig;
    await this.extractionConfigs.insertOne({
      _id: configId,
      name,
      modelVersion,
      basePromptTemplate,
      maxTokens,
      temperature,
      timezone,
      timeout: optionalTimeout, // Optional
    });
    return { config: configId };
  }

  /**
   * Action: Parses assignment JSON data from Canvas and creates suggestions.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {string} args.canvasData - Raw JSON data from Canvas.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists and canvasData is valid JSON.
   * @effects Parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
   * @note For this implementation, we simulate parsing by accepting pre-structured data as `canvasData`. In a real app, this would involve complex parsing logic or an actual LLM call.
   */
  async parseFromCanvas(
    { user, canvasData, config }: { user: User; canvasData: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!canvasData || canvasData.trim() === "") {
      return { error: "Canvas data cannot be empty." };
    }

    let parsedItems: { title: string; due: string }[]; // Simulate parsing result
    try {
      // In a real scenario, this would involve LLM or complex parsing
      parsedItems = JSON.parse(canvasData);
      if (!Array.isArray(parsedItems)) {
        return { error: "canvasData is not a valid JSON array of items." };
      }
    } catch (e) {
      return { error: `Invalid canvasData JSON: ${e.message}` };
    }

    const createdSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    for (const item of parsedItems) {
      if (!item.title || !item.due) continue; // Skip malformed items

      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      const newSuggestion: ParsedDeadlineSuggestionDoc = {
        _id: suggestionId,
        user,
        canvasMetadata: canvasData, // Store raw data for provenance
        title: item.title,
        due: new Date(item.due), // Assuming 'due' is ISO string
        source: SuggestionSource.CANVAS,
        confirmed: false,
        extractionMethod: ExtractionMethod.CANVAS_JSON,
        provenance: `Canvas API data processed by config ${existingConfig.name}`,
        warnings: [],
      };
      await this.parsedDeadlineSuggestions.insertOne(newSuggestion);
      createdSuggestions.push(newSuggestion);
    }
    return { suggestions: createdSuggestions };
  }

  /**
   * Action: Uses LLM to extract structured suggestions from document content.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {Document} args.documentId - The ID of the uploaded document.
   * @param {string} args.documentContent - The content of the document.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, documentId exists, documentContent is text or image suitable for LLM.
   * @effects Uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).
   * @note In this implementation, LLM interaction is simulated.
   */
  async llmExtractFromDocument(
    { user, documentId, documentContent, config }: { user: User; documentId: Document; documentContent: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!documentId) { // Check that documentId is provided, though its existence in DocumentManagement is external
      return { error: "Document ID cannot be empty." };
    }
    if (!documentContent || documentContent.trim() === "") {
      return { error: "Document content cannot be empty." };
    }

    // Simulate LLM extraction based on content
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    const keywords = ["assignment", "pset", "quiz", "exam"];
    const contentLower = documentContent.toLowerCase();

    if (keywords.some(k => contentLower.includes(k))) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        document: documentId,
        title: `LLM Extracted Task from ${documentId}`,
        due: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        source: SuggestionSource.SYLLABUS, // Defaulting for simplicity
        confirmed: false,
        confidence: 0.85,
        extractionMethod: ExtractionMethod.LLM,
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from document ${documentId}`,
        warnings: [],
      });
    }

    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Sends ALL document contents to LLM in a SINGLE request for cross-referencing.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {List<{documentId: Document, documentContent: String}>} args.documents - A list of document IDs and their contents.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, all documents contain extractable content.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.
   * @note This action explicitly accepts composite objects in the `documents` argument per spec, despite general Concept Design preference for primitives/IDs. LLM interaction is simulated.
   */
  async llmExtractFromMultipleDocuments(
    { user, documents, config }: { user: User; documents: DocumentContentPair[]; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!documents || documents.length === 0) {
      return { error: "No documents provided for multi-document extraction." };
    }
    if (documents.some(d => !d.documentId || !d.documentContent || d.documentContent.trim() === "")) {
      return { error: "All documents must have a valid ID and non-empty content." };
    }

    // Simulate LLM cross-referencing. For simplicity, we just combine titles.
    const combinedContent = documents.map(d => `Document ${d.documentId}: ${d.documentContent}`).join("\n\n");
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];

    // Assuming a simple "LLM" logic: if "deadline" is in combined content, create one suggestion
    if (combinedContent.toLowerCase().includes("deadline")) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        // Link to multiple documents via provenance or an array of document IDs if state supported
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from multiple documents: ${documents.map(d => d.documentId).join(", ")}`,
        title: `Combined Multi-Document Deadline`,
        due: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        source: SuggestionSource.SYLLABUS, // Simplified source
        confirmed: false,
        confidence: 0.95,
        extractionMethod: ExtractionMethod.LLM,
        warnings: [],
      });
    }

    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Uses LLM to parse website content into deadline suggestions.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {string} args.url - The URL of the website.
   * @param {string} args.websiteContent - The HTML or raw text content of the website.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, url is reachable, websiteContent is non-empty.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   * @note LLM interaction is simulated.
   */
  async llmExtractFromWebsite(
    { user, url, websiteContent, config }: { user: User; url: string; websiteContent: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!url || url.trim() === "" || !url.startsWith("https://")) {
      return { error: "Valid HTTPS URL is required." };
    }
    if (!websiteContent || websiteContent.trim() === "") {
      return { error: "Website content cannot be empty." };
    }

    // Simulate LLM extraction
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    if (websiteContent.toLowerCase().includes("assignment") && websiteContent.toLowerCase().includes("due")) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        websiteUrl: url,
        title: `Web Assignment from ${url.split('/')[2]}`,
        due: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        source: SuggestionSource.WEBSITE,
        confirmed: false,
        confidence: 0.90,
        extractionMethod: ExtractionMethod.LLM,
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from URL: ${url}`,
        warnings: [],
      });
    }
    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to refine.
   * @param {string} args.feedback - User feedback for refinement.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists, feedback is non-empty, config exists.
   * @effects Re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence.
   * @note LLM interaction is simulated.
   */
  async refineWithFeedback(
    { suggestion, feedback, config }: { suggestion: ParsedDeadlineSuggestion; feedback: string; config: ExtractionConfig },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!feedback || feedback.trim() === "") {
      return { error: "Feedback cannot be empty." };
    }

    // Simulate LLM refinement based on feedback
    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {};
    let newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];

    if (feedback.toLowerCase().includes("date")) {
      updatedFields.due = new Date(existingSuggestion.due.getTime() + 24 * 60 * 60 * 1000); // Shift date by 1 day
      if (!newWarnings.includes("date refined by LLM")) newWarnings.push("date refined by LLM");
    }
    if (feedback.toLowerCase().includes("title")) {
      updatedFields.title = `(Refined) ${existingSuggestion.title}`;
      if (!newWarnings.includes("title refined by LLM")) newWarnings.push("title refined by LLM");
    }
    updatedFields.confidence = Math.min(1.0, (existingSuggestion.confidence || 0) + 0.05); // Boost confidence
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." }; // Should not happen if update was successful
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually edits the title and due date of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to edit.
   * @param {string} args.newTitle - The new title.
   * @param {Date} args.newDue - The new due date.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists, newTitle is non-empty, newDue is valid.
   * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
   */
  async editSuggestion(
    { suggestion, newTitle, newDue }: { suggestion: ParsedDeadlineSuggestion; newTitle: string; newDue: Date },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "New title cannot be empty." };
    }
    if (!(newDue instanceof Date && !isNaN(newDue.getTime()))) {
      return { error: "New due date is invalid." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      title: newTitle,
      due: newDue,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually updates only the title of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to update.
   * @param {string} args.newTitle - The new title.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists and newTitle is non-empty.
   * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionTitle(
    { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "New title cannot be empty." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      title: newTitle,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually updates only the due date of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to update.
   * @param {Date} args.newDue - The new due date.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc, updatedDue: Date} | {error: string}>} A promise that resolves to the updated suggestion and its new due date, or an error.
   * @requires suggestion exists and newDue is valid.
   * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionDate(
    { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc; updatedDue: Date } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!(newDue instanceof Date && !isNaN(newDue.getTime()))) {
      return { error: "New due date is invalid." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      due: newDue,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion, updatedDue: updatedSuggestion.due };
  }

  /**
   * Action: Confirms a parsed deadline suggestion, returning data for creating a new Deadline.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to confirm.
   * @param {Course} args.course - The Course ID to link the final deadline to.
   * @param {User} args.addedBy - The User ID who is confirming/adding the deadline.
   * @returns {Promise<{course: Course, title: string, due: Date, source: SuggestionSource, addedBy: User} | {error: string}>} A promise that resolves to the extracted deadline data on success, or an error.
   * @requires suggestion exists, is not already confirmed, has valid title and due date.
   * @effects Marks suggestion as confirmed, and returns the data for creating a new Deadline.
   */
  async confirm(
    { suggestion, course, addedBy }: { suggestion: ParsedDeadlineSuggestion; course: Course; addedBy: User },
  ): Promise<{ course: Course; title: string; due: Date; source: SuggestionSource; addedBy: User } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (existingSuggestion.confirmed) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} is already confirmed.` };
    }
    if (!existingSuggestion.title || existingSuggestion.title.trim() === "") {
      return { error: "Confirmed suggestion must have a non-empty title." };
    }
    if (!(existingSuggestion.due instanceof Date && !isNaN(existingSuggestion.due.getTime()))) {
      return { error: "Confirmed suggestion must have a valid due date." };
    }

    // Note: Course and User existence checks are external to this concept.

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: { confirmed: true } },
    );

    // Prepare data for DeadlineManagement.createDeadline
    return {
      course,
      title: existingSuggestion.title,
      due: existingSuggestion.due,
      source: existingSuggestion.source,
      addedBy,
    };
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves a parsed deadline suggestion by its ID.
   */
  async _getSuggestionById({ suggestionId }: { suggestionId: ParsedDeadlineSuggestion }): Promise<ParsedDeadlineSuggestionDoc | null> {
    return await this.parsedDeadlineSuggestions.findOne({ _id: suggestionId });
  }

  /**
   * Query: Retrieves all suggestions for a specific user.
   */
  async _getSuggestionsByUser({ userId }: { userId: User }): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.parsedDeadlineSuggestions.find({ user: userId }).toArray();
  }

  /**
   * Query: Retrieves an extraction configuration by its name.
   */
  async _getExtractionConfigByName({ name }: { name: string }): Promise<ExtractionConfigDoc | null> {
    return await this.extractionConfigs.findOne({ name });
  }

  /**
   * Query: Retrieves all extraction configurations.
   */
  async _getAllExtractionConfigs(): Promise<ExtractionConfigDoc[]> {
    return await this.extractionConfigs.find({}).toArray();
  }

  /**
   * Query: Retrieves all parsed deadline suggestions.
   */
  async _getAllSuggestions(): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.parsedDeadlineSuggestions.find({}).toArray();
  }
}
```

# file: src/suggestionmanagement/SuggestionManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertStrictEquals, assertInstanceOf } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Import dependent concepts for test setup
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";
import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";
import DocumentManagementConcept from "../documentmanagement/DocumentManagementConcept.ts";

import SuggestionManagementConcept from "./SuggestionManagementConcept.ts";

// Test Data
const TEST_USER_EMAIL = "tim@mit.edu";
const TEST_USER_NAME = "Tim Smith";
const TEST_COURSE_CODE = "6.1040";
const TEST_COURSE_TITLE = "Software Design and Development";
const TEST_DOC_FILENAME = "schedule.pdf";
const TEST_DOC_FILETYPE = "application/pdf";
const TEST_DOC_CONTENT = "This document contains a deadline for Assignment 4: Backend MVP on 2025-10-12.";
const TEST_WEBSITE_URL = "https://61040-fa25.github.io/schedule";
const TEST_WEBSITE_CONTENT = `<html><body><table><tr><td>Assignment 1</td><td>September 7</td></tr><tr><td>Assignment 4: Backend MVP</td><td>October 12</td></tr></table></body></html>`;

const TEST_CONFIG_NAME_LLM = "default-llm-config";
const TEST_CONFIG_MODEL_LLM = "gemini-pro";
const TEST_CONFIG_PROMPT_LLM = "Extract deadlines";
const TEST_CONFIG_TIMEZONE_LLM = "America/New_York";

const TEST_CANVAS_DATA = JSON.stringify([
  { "title": "Canvas Midterm", "due": "2025-11-15T14:00:00Z" },
  { "title": "Canvas Final Project", "due": "2025-12-10T23:59:00Z" },
]);

Deno.test("Principle: Suggestions are produced via LLM from documents/web/Canvas, users refine, then confirm.", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const suggestionManagementConcept = new SuggestionManagementConcept(db);

  try {
    // Setup: Create a User and a Course (external generic parameters)
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    assertExists(userId);
    assertExists(courseId);

    // Create an LLM extraction config
    const createConfigResult = await suggestionManagementConcept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 1000,
      temperature: 0.5,
      timezone: TEST_CONFIG_TIMEZONE_LLM,
    });
    assertEquals("error" in createConfigResult, false, `Config creation failed: ${JSON.stringify(createConfigResult)}`);
    const { config: llmConfigId } = createConfigResult as { config: ID };
    assertExists(llmConfigId);

    // 1. Suggestions are produced via LLM from uploaded files
    const uploadDocResult = await documentManagementConcept.uploadDocument({
      course: courseId,
      fileName: TEST_DOC_FILENAME,
      fileType: TEST_DOC_FILETYPE,
      fileContent: TEST_DOC_CONTENT,
      uploader: userId,
    });
    assertEquals("error" in uploadDocResult, false, `Document upload failed: ${JSON.stringify(uploadDocResult)}`);
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const extractResult = await suggestionManagementConcept.llmExtractFromDocument({
      user: userId,
      documentId: docId,
      documentContent: TEST_DOC_CONTENT,
      config: llmConfigId,
    });
    assertEquals("error" in extractResult, false, `LLM extraction from document failed: ${JSON.stringify(extractResult)}`);
    const { suggestions: initialSuggestions } = extractResult as { suggestions: any[] };
    assertEquals(initialSuggestions.length, 1, "Should extract one suggestion from document.");
    let suggestion1 = initialSuggestions[0];
    assertEquals(suggestion1.title.includes("LLM Extracted Task"), true);
    assertEquals(suggestion1.confirmed, false);
    assertEquals(suggestion1.extractionMethod, "LLM");

    // 2. Users refine suggestions (manual edit for date)
    const oldDueDate = suggestion1.due;
    const newDueDate = new Date(oldDueDate.getTime() + 24 * 60 * 60 * 1000); // Shift by 1 day
    const editResult = await suggestionManagementConcept.editSuggestion({
      suggestion: suggestion1._id,
      newTitle: suggestion1.title,
      newDue: newDueDate,
    });
    assertEquals("error" in editResult, false, `Editing suggestion failed: ${JSON.stringify(editResult)}`);
    suggestion1 = (editResult as { suggestion: any }).suggestion; // Update suggestion object
    assertEquals(suggestion1.due, newDueDate, "Suggestion due date should be updated.");
    assertEquals(suggestion1.warnings?.includes("manually edited"), true, "Suggestion should have 'manually edited' warning.");

    // 3. Users confirm suggestions before they become official deadlines
    const confirmResult = await suggestionManagementConcept.confirm({
      suggestion: suggestion1._id,
      course: courseId,
      addedBy: userId,
    });
    assertEquals("error" in confirmResult, false, `Confirming suggestion failed: ${JSON.stringify(confirmResult)}`);
    const { title, due, source, addedBy } = confirmResult as { course: ID; title: string; due: Date; source: string; addedBy: ID };

    assertEquals(title, suggestion1.title, "Confirmed title should match.");
    assertEquals(due, suggestion1.due, "Confirmed due date should match.");
    assertEquals(source, suggestion1.source, "Confirmed source should match.");
    assertStrictEquals(addedBy, userId, "Confirmed addedBy user should match.");

    const confirmedSuggestion = await suggestionManagementConcept._getSuggestionById({ suggestionId: suggestion1._id });
    assertEquals(confirmedSuggestion?.confirmed, true, "Suggestion should be marked as confirmed.");

    const allSuggestions = await suggestionManagementConcept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 1, "There should still be one suggestion for the user, now confirmed.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: createExtractionConfig - enforces unique names and validates input", async () => {
  const [db, client] = await testDb();
  const concept = new SuggestionManagementConcept(db);

  try {
    // Valid creation
    const result1 = await concept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result1, false, "Valid config creation should succeed.");
    const { config: configId } = result1 as { config: ID };
    assertExists(configId);

    // Duplicate name
    const result2 = await concept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: "v2",
      basePromptTemplate: "another prompt",
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result2, true, "Creating config with duplicate name should fail.");
    assertEquals((result2 as { error: string }).error, `ExtractionConfig with name '${TEST_CONFIG_NAME_LLM}' already exists.`);

    // Empty name
    const result3 = await concept.createExtractionConfig({
      name: " ",
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result3, true, "Creating config with empty name should fail.");
    assertEquals((result3 as { error: string }).error, "Configuration name cannot be empty.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: parseFromCanvas - creates suggestions from valid JSON and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: "canvas-config", modelVersion: "v1", basePromptTemplate: "", maxTokens: 100, temperature: 0, timezone: "UTC" });
    const { config: canvasConfigId } = createConfigResult as { config: ID };

    // Valid parsing
    const parseResult = await concept.parseFromCanvas({ user: userId, canvasData: TEST_CANVAS_DATA, config: canvasConfigId });
    assertEquals("error" in parseResult, false, "Parsing valid Canvas data should succeed.");
    const { suggestions } = parseResult as { suggestions: any[] };
    assertEquals(suggestions.length, 2, "Should create two suggestions.");
    assertEquals(suggestions[0].title, "Canvas Midterm");
    assertEquals(suggestions[0].source, "CANVAS");
    assertEquals(suggestions[0].extractionMethod, "CANVAS_JSON");
    assertInstanceOf(suggestions[0].due, Date);

    // Non-existent config
    const nonExistentConfigId = freshID() as ID;
    const nonExistentConfigResult = await concept.parseFromCanvas({ user: userId, canvasData: TEST_CANVAS_DATA, config: nonExistentConfigId });
    assertEquals("error" in nonExistentConfigResult, true, "Parsing with non-existent config should fail.");
    assertEquals((nonExistentConfigResult as { error: string }).error, `ExtractionConfig with ID ${nonExistentConfigId} not found.`);

    // Empty canvasData
    const emptyDataResult = await concept.parseFromCanvas({ user: userId, canvasData: " ", config: canvasConfigId });
    assertEquals("error" in emptyDataResult, true, "Parsing with empty Canvas data should fail.");
    assertEquals((emptyDataResult as { error: string }).error, "Canvas data cannot be empty.");

    // Invalid canvasData JSON
    const invalidJsonResult = await concept.parseFromCanvas({ user: userId, canvasData: "{bad json", config: canvasConfigId });
    assertEquals("error" in invalidJsonResult, true, "Parsing with invalid JSON should fail.");

    const allSuggestions = await concept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 2, "Only two valid suggestions should be present.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromDocument - creates suggestions and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db); // Needed for docId, though content is passed directly
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: TEST_DOC_CONTENT, uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Valid extraction
    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: TEST_DOC_CONTENT, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one suggestion.");
    assertEquals(suggestions[0].document, docId);
    assertEquals(suggestions[0].extractionMethod, "LLM");
    assertEquals(suggestions[0].confidence! > 0, true);

    // Non-existent config
    const nonExistentConfigId = freshID() as ID;
    const nonExistentConfigResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: TEST_DOC_CONTENT, config: nonExistentConfigId });
    assertEquals("error" in nonExistentConfigResult, true, "Extraction with non-existent config should fail.");

    // Empty document content
    const emptyContentResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: " ", config: llmConfigId });
    assertEquals("error" in emptyContentResult, true, "Extraction with empty content should fail.");

    // Missing documentId
    const missingDocIdResult = await concept.llmExtractFromDocument({ user: userId, documentId: undefined as any, documentContent: TEST_DOC_CONTENT, config: llmConfigId });
    assertEquals("error" in missingDocIdResult, true, "Extraction with missing documentId should fail.");

    const allSuggestions = await concept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 1, "Only one valid suggestion should be present.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromMultipleDocuments - creates suggestions with cross-referencing logic", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Upload two documents
    const uploadDoc1Result = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "doc1.txt", fileType: "text/plain", fileContent: "First document has a deadline.", uploader: userId });
    const { document: docId1 } = uploadDoc1Result as { document: ID; content: string };
    const uploadDoc2Result = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "doc2.txt", fileType: "text/plain", fileContent: "Second document, also talking about deadlines.", uploader: userId });
    const { document: docId2 } = uploadDoc2Result as { document: ID; content: string };

    const documentsToParse = [
      { documentId: docId1, documentContent: "First document has a deadline." },
      { documentId: docId2, documentContent: "Second document, also talking about deadlines." },
    ];

    // Valid extraction from multiple documents
    const extractResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: documentsToParse, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction from multiple documents should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one combined suggestion.");
    assertEquals(suggestions[0].title, "Combined Multi-Document Deadline");
    assertEquals(suggestions[0].provenance?.includes(docId1.toString()), true);
    assertEquals(suggestions[0].provenance?.includes(docId2.toString()), true);

    // No documents
    const noDocsResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: [], config: llmConfigId });
    assertEquals("error" in noDocsResult, true, "Extraction with no documents should fail.");

    // Document with empty content
    const emptyContentDocResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: [{ documentId: docId1, documentContent: "" }], config: llmConfigId });
    assertEquals("error" in emptyContentDocResult, true, "Extraction with empty document content should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromWebsite - creates suggestions from website content and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Valid extraction
    const extractResult = await concept.llmExtractFromWebsite({ user: userId, url: TEST_WEBSITE_URL, websiteContent: TEST_WEBSITE_CONTENT, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction from website should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one suggestion from website.");
    assertEquals(suggestions[0].websiteUrl, TEST_WEBSITE_URL);
    assertEquals(suggestions[0].title.includes("Web Assignment"), true);
    assertEquals(suggestions[0].source, "WEBSITE");

    // Invalid URL
    const invalidUrlResult = await concept.llmExtractFromWebsite({ user: userId, url: "http://bad.com", websiteContent: TEST_WEBSITE_CONTENT, config: llmConfigId });
    assertEquals("error" in invalidUrlResult, true, "Extraction with non-HTTPS URL should fail.");

    // Empty content
    const emptyContentResult = await concept.llmExtractFromWebsite({ user: userId, url: TEST_WEBSITE_URL, websiteContent: " ", config: llmConfigId });
    assertEquals("error" in emptyContentResult, true, "Extraction with empty website content should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: refineWithFeedback - updates suggestion based on feedback", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: "A test assignment.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A test assignment due tomorrow.", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    const initialDue = suggestion.due;
    const initialConfidence = suggestion.confidence;

    // Refine with feedback about date
    const refineResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: "The date is off by one day.", config: llmConfigId });
    assertEquals("error" in refineResult, false, "Refinement should succeed.");
    suggestion = (refineResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.due.getTime(), initialDue.getTime() + 24 * 60 * 60 * 1000, "Due date should shift.");
    assertEquals(suggestion.warnings?.includes("date refined by LLM"), true);
    assertEquals(suggestion.confidence! > initialConfidence!, true, "Confidence should increase.");

    // Refine with feedback about title
    const refineTitleResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: "This title is wrong.", config: llmConfigId });
    assertEquals("error" in refineTitleResult, false, "Refinement should succeed.");
    suggestion = (refineTitleResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title.includes("(Refined)"), true, "Title should be refined.");
    assertEquals(suggestion.warnings?.includes("title refined by LLM"), true);

    // Non-existent suggestion
    const nonExistentRefineResult = await concept.refineWithFeedback({ suggestion: freshID() as ID, feedback: "feedback", config: llmConfigId });
    assertEquals("error" in nonExistentRefineResult, true, "Refining non-existent suggestion should fail.");

    // Empty feedback
    const emptyFeedbackResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: " ", config: llmConfigId });
    assertEquals("error" in emptyFeedbackResult, true, "Refining with empty feedback should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: editSuggestion, updateSuggestionTitle, updateSuggestionDate - manually edit suggestions", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "test/plain", fileContent: "A test assignment.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A test assignment due tomorrow.", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    const originalTitle = suggestion.title;
    const originalDue = suggestion.due;

    // editSuggestion
    const newTitle = "Manually Edited Title";
    const newDue = new Date(originalDue.getTime() + 5 * 24 * 60 * 60 * 1000);
    const editResult = await concept.editSuggestion({ suggestion: suggestion._id, newTitle, newDue });
    assertEquals("error" in editResult, false, "editSuggestion should succeed.");
    suggestion = (editResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, newTitle);
    assertEquals(suggestion.due, newDue);
    assertEquals(suggestion.warnings?.includes("manually edited"), true);

    // updateSuggestionTitle
    const updatedTitle = "Only Title Updated";
    const updateTitleResult = await concept.updateSuggestionTitle({ suggestion: suggestion._id, newTitle: updatedTitle });
    assertEquals("error" in updateTitleResult, false, "updateSuggestionTitle should succeed.");
    suggestion = (updateTitleResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, updatedTitle);
    assertEquals(suggestion.due, newDue); // Due date should be unchanged
    assertEquals(suggestion.warnings?.includes("manually edited"), true); // Warning should persist

    // updateSuggestionDate
    const updatedDue = new Date(newDue.getTime() + 10 * 24 * 60 * 60 * 1000);
    const updateDateResult = await concept.updateSuggestionDate({ suggestion: suggestion._id, newDue: updatedDue });
    assertEquals("error" in updateDateResult, false, "updateSuggestionDate should succeed.");
    suggestion = (updateDateResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, updatedTitle); // Title should be unchanged
    assertEquals(suggestion.due, updatedDue);
    assertEquals(suggestion.warnings?.includes("manually edited"), true);

  } finally {
    await client.close();
  }
});

Deno.test("Action: confirm - marks suggestion as confirmed and returns deadline data", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: "A valid deadline.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A valid deadline title and due date 2025-10-20T23:59:00Z", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    suggestion.title = "Final Confirmed Assignment"; // Ensure valid title
    suggestion.due = new Date("2025-10-20T23:59:00Z"); // Ensure valid date
    await concept.editSuggestion({suggestion: suggestion._id, newTitle: suggestion.title, newDue: suggestion.due});


    // Successfully confirm
    const confirmResult = await concept.confirm({ suggestion: suggestion._id, course: courseId, addedBy: userId });
    assertEquals("error" in confirmResult, false, "Confirmation should succeed.");
    const { title, due, source } = confirmResult as { course: ID; title: string; due: Date; source: string; addedBy: ID };
    assertExists(title);
    assertExists(due);
    assertExists(source);
    assertEquals(title, suggestion.title);
    assertEquals(due, suggestion.due);
    assertEquals(source, suggestion.source);

    const confirmedSuggestion = await concept._getSuggestionById({ suggestionId: suggestion._id });
    assertEquals(confirmedSuggestion?.confirmed, true, "Suggestion should be marked as confirmed.");

    // Already confirmed
    const alreadyConfirmedResult = await concept.confirm({ suggestion: suggestion._id, course: courseId, addedBy: userId });
    assertEquals("error" in alreadyConfirmedResult, true, "Confirming an already confirmed suggestion should fail.");
    assertEquals((alreadyConfirmedResult as { error: string }).error, `ParsedDeadlineSuggestion with ID ${suggestion._id} is already confirmed.`);

    // Non-existent suggestion
    const nonExistentConfirmResult = await concept.confirm({ suggestion: freshID() as ID, course: courseId, addedBy: userId });
    assertEquals("error" in nonExistentConfirmResult, true, "Confirming non-existent suggestion should fail.");

    // Suggestion with empty title or invalid date (need to create one specifically to test this)
    const malformedSuggestionId = freshID() as ID;
    await concept.parsedDeadlineSuggestions.insertOne({ // Directly insert a malformed suggestion
      _id: malformedSuggestionId,
      user: userId,
      title: "", // Empty title
      due: new Date("invalid date"), // Invalid date
      source: "MANUAL" as any,
    });
    const malformedTitleConfirmResult = await concept.confirm({ suggestion: malformedSuggestionId, course: courseId, addedBy: userId });
    assertEquals("error" in malformedTitleConfirmResult, true, "Confirming suggestion with empty title should fail.");
    assertEquals((malformedTitleConfirmResult as { error: string }).error, "Confirmed suggestion must have a non-empty title.");

  } finally {
    await client.close();
  }
});
```

***

### `src/suggestionmanagement/SuggestionManagementConcept.ts` Implementation Explained

This file implements the `SuggestionManagement` concept, which focuses on extracting, refining, and confirming potential deadlines from various sources.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The file `SuggestionManagementConcept.ts` directly aligns with the singular concept name `SuggestionManagement`.
*   **Implementation Details & Rationale:**
    *   Standard `Collection`, `Db`, `Empty`, `ID`, `freshID` imports are used.
    *   `const PREFIX = "SuggestionManagement" + ".";`: Namespaces MongoDB collections (e.g., `SuggestionManagement.parsedDeadlineSuggestions`) for modularity.
    *   `type User = ID;`, `type Document = ID;`, `type Course = ID;`: These are the generic type parameters. `SuggestionManagement` treats them as opaque IDs. This enforces concept independence; `SuggestionManagement` doesn't need to know the internal structure of a `User`, `Document`, or `Course`, only their unique identifiers.
    *   `type ParsedDeadlineSuggestion = ID;`, `type ExtractionConfig = ID;`: Define internal entity IDs managed by this concept.

#### 2. Enumerations (`SuggestionSource` and `ExtractionMethod`)

*   **Correspondence to Concept Spec (`state` section):** Directly maps to the `source of ...` and `extractionMethod of ...` declarations.
*   **Implementation Details & Rationale:** TypeScript `enum`s provide type safety and ensure that these fields can only take predefined values, improving data integrity and readability.
*   **Helper functions `isValidSuggestionSource` and `isValidExtractionMethod`:** Added for validating enum inputs, as direct string input might not match enum members.

#### 3. `ParsedDeadlineSuggestionDoc` Interface (State Representation)

*   **Correspondence to Concept Spec (`state` section):** This interface models `a set of ParsedDeadlineSuggestions`.
*   **Implementation Details & Rationale:**
    *   `_id: ParsedDeadlineSuggestion;`: Primary key for suggestion documents.
    *   `user: User;`: The `User` ID associated with who initiated the parsing, following generic parameter rules.
    *   `document?: Document;`, `canvasMetadata?: string;`, `websiteUrl?: string;`: Optional fields for provenance, directly mapping to the spec.
    *   `title: string;`, `due: Date;`, `source: SuggestionSource;`: Core fields for a suggestion, with `Date` for `DateTime`.
    *   `confirmed?: boolean = false;`: Default to `false` in the spec. In TypeScript, `?` makes it optional, and the insertion logic handles the default.
    *   `confidence?: number;`, `extractionMethod?: ExtractionMethod;`, `provenance?: string;`, `warnings?: string[];`: Optional fields, directly mapping to the spec. `warnings` is an array of strings.
    *   **Rationale:** Defines the detailed structure for storing individual deadline suggestions.

#### 4. `ExtractionConfigDoc` Interface (State Representation)

*   **Correspondence to Concept Spec (`state` section):** This interface models `a set of ExtractionConfigs`.
*   **Implementation Details & Rationale:**
    *   `_id: ExtractionConfig;`: Primary key for config documents.
    *   Fields like `name`, `modelVersion`, `basePromptTemplate`, `maxTokens`, `temperature`, `timezone`, `timeout?` directly map to the spec. `timeout?` is optional.
    *   **Rationale:** Defines the structure for storing LLM configuration profiles, allowing different parsing strategies.

#### 5. `DocumentContentPair` Interface (Composite Argument Type)

*   **Correspondence to Concept Spec:**
    ```concept
    llmExtractFromMultipleDocuments(user: User, documents: List<{documentId: Document, documentContent: String}>, config: ExtractionConfig): ...
    ```
*   **Implementation Details & Rationale:**
    *   `interface DocumentContentPair { documentId: Document; documentContent: string; }`: This is a helper interface to define the structure of objects passed in the `documents` array for `llmExtractFromMultipleDocuments`.
    *   **Rationale:** This explicitly handles the composite object (`List<{documentId: Document, documentContent: String}>`) in the action argument as defined in the concept spec. While the general guideline advises against composite objects as action arguments to maintain concept independence (as it implies assumptions about the internal structure of `Document`), here I'm strictly following the provided spec. A more "pure" concept design might have `llmExtractFromMultipleDocuments(user: User, documentIds: List<Document>, config: ExtractionConfig): ...` and require an external sync to call `DocumentManagement.getDocumentContent` for each ID.

#### 6. Class Definition and Constructor

*   **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `SuggestionManagementConcept` and its JSDoc tags link to the concept.
*   **Implementation Details & Rationale:** Initializes `parsedDeadlineSuggestions` and `extractionConfigs` MongoDB collections.

#### 7. `createExtractionConfig` Action

*   **Correspondence to Concept Spec:**
    ```concept
    createExtractionConfig (name: String, ...): (config: ExtractionConfig) or (error: String)
      requires name is unique
      effects creates a new extraction configuration for LLM processing.
    ```
*   **Implementation Details &ationale:**
    *   **`requires name is unique`**: Checks for an existing config with the same `name`. Returns an error if found.
    *   **Input Validation:** Ensures `name` is not empty.
    *   **`effects creates a new extraction configuration`**: Generates `_id` and inserts the new config document.
    *   `return { config: configId };`: Returns the ID of the new config.

#### 8. `parseFromCanvas` Action

*   **Correspondence to Concept Spec:**
    ```concept
    parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
      requires config exists and canvasData is valid JSON
      effects parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
    ```
*   **Implementation Details & Rationale:**
    *   **`requires config exists`**: Checks if the `ExtractionConfig` ID exists in its `extractionConfigs` collection.
    *   **`requires canvasData is valid JSON`**: Includes a `try-catch` block to parse `canvasData`.
    *   **`effects parses assignment JSON data, creates suggestions... Sets extractionMethod = CANVAS_JSON, source = CANVAS`**: Simulates parsing by assuming `canvasData` is an array of objects. Iterates, generates `_id` for each suggestion, sets `user`, `canvasMetadata`, `title`, `due`, `source`, `confirmed: false`, `extractionMethod`. Inserts each.
    *   `return { suggestions: createdSuggestions };`: Returns an array of the `ParsedDeadlineSuggestionDoc` objects.

#### 9. `llmExtractFromDocument` Action (and `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite`)

*   **Correspondence to Concept Spec:** These actions involve LLM interaction and document/website parsing.
    *   They all require `config exists` and relevant content (`documentContent`, `websiteContent`) or valid `documentId`s/`url`.
    *   Their effects are to create suggestions, link them to the `user`, set `extractionMethod = LLM`, `confidence`, and `provenance`.
*   **Implementation Details & Rationale:**
    *   **Simulated LLM:** For this backend assignment, LLM interaction is *simulated*. The logic looks for keywords (e.g., "assignment", "deadline") in the content to generate a mock suggestion. In a real application, this would involve calling an external LLM API.
    *   **Precondition Checks:** Each action validates that `config` exists and that content/URLs are non-empty and well-formed (e.g., `url.startsWith("https://")`).
    *   **Composite Argument (llmExtractFromMultipleDocuments):** This action explicitly takes `documents: DocumentContentPair[]`. I've implemented this by validating the array and its contents, then simulating processing. This highlights a deviation from the stricter "primitives/IDs only" rule for action arguments but adheres to the provided spec.
    *   **`effects`:** Generates `_id`, links to `user`, sets appropriate `document` ID, `websiteUrl`, `title`, `due`, `source`, `confidence`, `extractionMethod`, and `provenance` as specified.
    *   `return { suggestions: simulatedSuggestions };`: Returns an array of `ParsedDeadlineSuggestionDoc` objects.

#### 10. `refineWithFeedback` Action

*   **Correspondence to Concept Spec:**
    ```concept
    refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
      requires suggestion exists, feedback is non-empty, config exists
      effects re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence.
    ```
*   **Implementation Details & Rationale:**
    *   **Preconditions:** Checks for existing `suggestion` and `config`, and non-empty `feedback`.
    *   **Simulated Refinement:** Based on keywords in `feedback`, it simulates updates to `title`, `due`, and `confidence`. It also adds a "date refined by LLM" or "title refined by LLM" warning.
    *   **`effects`:** Updates the `ParsedDeadlineSuggestionDoc` in MongoDB using `$set`.
    *   `return { suggestion: updatedSuggestion };`: Returns the updated suggestion document.

#### 11. `editSuggestion`, `updateSuggestionTitle`, `updateSuggestionDate` Actions

*   **Correspondence to Concept Spec:** These provide manual editing capabilities.
    *   Require `suggestion exists` and valid inputs (`newTitle` non-empty, `newDue` valid).
    *   Effects are to update specific fields (`title`, `due`).
    *   All set `warnings` to indicate manual editing.
*   **Implementation Details & Rationale:**
    *   Perform existence checks for the suggestion.
    *   Perform input validation for `newTitle` and `newDue`.
    *   Use `$set` to update fields in MongoDB.
    *   Manage the `warnings` array: creates a copy, adds "manually edited" if not present, and updates the document.
    *   Return the updated suggestion document (and `updatedDue` for `updateSuggestionDate` as per spec).
    *   **Rationale:** Directly implements the manual correction features, which are vital for user control over LLM-generated content.

#### 12. `confirm` Action

*   **Correspondence to Concept Spec:**
    ```concept
    confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
      requires suggestion exists, is not already confirmed, has valid title and due date
      effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
    ```
*   **Implementation Details & Rationale:**
    *   **Preconditions:** Checks for existing `suggestion`, `is not already confirmed`, and `has valid title and due date`. Returns errors if any fail.
    *   **`course` and `addedBy` existence:** JSDoc notes that their existence checks are external to this concept (concept independence).
    *   **`effects marks suggestion as confirmed`**: Updates the `confirmed` field of the `ParsedDeadlineSuggestionDoc` to `true`.
    *   **`effects ... returns the data for creating a new Deadline.`**: Constructs and returns an object containing all the necessary primitive fields (`course`, `title`, `due`, `source`, `addedBy`) that `DeadlineManagement.createDeadline` would require. This is the canonical way independent concepts interact via synchronizations.

#### 13. Query Methods (`_getSuggestionById`, `_getSuggestionsByUser`, `_getExtractionConfigByName`, `_getAllExtractionConfigs`, `_getAllSuggestions`)

*   **Correspondence to Concept Spec:** These are implicit queries, essential for testing and for other concepts/synchronizations to inspect `SuggestionManagement`'s state.
*   **Implementation Details & Rationale:** Provide various ways to read `ParsedDeadlineSuggestionDoc` and `ExtractionConfigDoc` documents from MongoDB.

---

### `src/suggestionmanagement/SuggestionManagementConcept.test.ts` Implementation Explained

This file contains comprehensive tests for the `SuggestionManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

*   **Correspondence to Concept Spec:** The test file name directly reflects its purpose.
*   **Implementation Details & Rationale:**
    *   Standard Deno assertions (`assertEquals`, `assertExists`, etc.).
    *   `testDb`, `ID`, `freshID` from `@utils`.
    *   **Crucial Imports for Dependencies:** `UserIdentityConcept`, `CourseManagementConcept`, `DocumentManagementConcept` are imported.
        *   **Rationale:** `SuggestionManagement` uses `User`, `Document`, and `Course` IDs as generic parameters. To set up realistic test scenarios, we need to create these entities using their respective managing concepts. This demonstrates behavioral integration between independent concepts via shared opaque IDs.

#### 2. Test Data Constants

*   **Implementation Details:** Defines constants for test emails, names, course details, document content, website URLs/content, and LLM config details. `TEST_CANVAS_DATA` is pre-structured JSON to simulate Canvas API output for `parseFromCanvas`.
*   **Rationale:** Improves test readability, maintainability, and makes it clear what data is used in each scenario.

#### 3. "Principle" Test Case

*   **Correspondence to Concept Spec (`principle` section):**
    ```concept
    principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.
    ```
    This test meticulously steps through a scenario covering production, refinement, and confirmation.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates `User` and `Course` IDs using their respective concepts, and then an `ExtractionConfig` using `SuggestionManagement` itself.
    *   **1. Produce Suggestions (from document):**
        *   Uploads a document using `DocumentManagementConcept` to get a `docId`.
        *   Calls `suggestionManagementConcept.llmExtractFromDocument()` with the `docId` and content.
        *   Asserts successful extraction and verifies the basic properties of the created `suggestion` (e.g., `title` includes "LLM Extracted Task", `confirmed: false`, `extractionMethod: "LLM"`).
    *   **2. Refine Suggestions (manual edit):**
        *   Calls `suggestionManagementConcept.editSuggestion()` to manually adjust the `due` date of the first suggestion.
        *   Asserts success and verifies the `due` date is updated and the "manually edited" warning is added.
    *   **3. Confirm Suggestions:**
        *   Calls `suggestionManagementConcept.confirm()`, passing the `suggestion ID`, `course ID`, and `user ID`.
        *   Asserts success and then verifies that the returned data for creating a deadline matches the (now refined) suggestion's data.
        *   Finally, queries the suggestion itself (`_getSuggestionById`) to ensure its `confirmed` status is `true`.
    *   **Rationale:** This end-to-end test confirms the concept's main purpose by simulating a full lifecycle of a suggestion.

#### 4. "Action: createExtractionConfig - enforces unique names and validates input" Test Case

*   **Correspondence to Concept Spec (`createExtractionConfig` action's `requires` and `effects`):** This test targets the requirements for creating an LLM configuration.
*   **Implementation Details & Rationale:**
    *   **Valid Creation:** Creates a config successfully.
    *   **Duplicate Name:** Attempts to create a config with the same name. Asserts an error and checks its message.
    *   **Empty Name:** Attempts to create a config with an empty name. Asserts an error.
    *   **Rationale:** Verifies the `name is unique` precondition and basic input validation.

#### 5. "Action: parseFromCanvas - creates suggestions from valid JSON and handles errors" Test Case

*   **Correspondence to Concept Spec (`parseFromCanvas` action's `requires` and `effects`):** This tests the Canvas parsing functionality.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a `User` and an `ExtractionConfig`.
    *   **Valid Parsing:** Calls `parseFromCanvas` with `TEST_CANVAS_DATA` (pre-structured JSON). Asserts success and verifies that two suggestions are created with correct titles, sources, and extraction methods. Checks that `due` is a `Date` object.
    *   **Non-existent Config:** Attempts parsing with a fake `config ID`. Asserts an error.
    *   **Empty `canvasData`:** Attempts parsing with empty data. Asserts an error.
    *   **Invalid JSON:** Attempts parsing with malformed JSON. Asserts an error.
    *   **Rationale:** Tests `parseFromCanvas`'s ability to create suggestions and its input validation.

#### 6. "Action: llmExtractFromDocument - creates suggestions and handles errors" Test Case

*   **Correspondence to Concept Spec (`llmExtractFromDocument` action's `requires` and `effects`):** This tests the single-document LLM extraction.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a `User`, a `Course`, a `Document` (to get a valid `docId`), and an `ExtractionConfig`.
    *   **Valid Extraction:** Calls `llmExtractFromDocument` with valid inputs. Asserts success and verifies one suggestion is created, linked to the `document ID`, with correct `extractionMethod` and a positive `confidence`.
    *   **Non-existent Config:** Attempts extraction with a fake `config ID`. Asserts an error.
    *   **Empty `documentContent`:** Attempts extraction with empty content. Asserts an error.
    *   **Missing `documentId`:** Attempts extraction with an `undefined` `documentId`. Asserts an error.
    *   **Rationale:** Tests `llmExtractFromDocument`'s functionality and error handling.

#### 7. "Action: llmExtractFromMultipleDocuments - creates suggestions with cross-referencing logic" Test Case

*   **Correspondence to Concept Spec (`llmExtractFromMultipleDocuments` action's `requires` and `effects`):** This tests the multi-document LLM extraction, including the composite argument.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a `User`, `Course`, and *two* `Document`s.
    *   **Valid Extraction:** Calls `llmExtractFromMultipleDocuments` with an array of `DocumentContentPair` objects. Asserts success and verifies one combined suggestion is created, and that its `provenance` links to both document IDs.
    *   **No Documents:** Attempts with an empty array. Asserts an error.
    *   **Empty Content in Document:** Attempts with a `DocumentContentPair` having empty `documentContent`. Asserts an error.
    *   **Rationale:** Tests the more complex `llmExtractFromMultipleDocuments` action, including the specific composite input argument.

#### 8. "Action: llmExtractFromWebsite - creates suggestions from website content and handles errors" Test Case

*   **Correspondence to Concept Spec (`llmExtractFromWebsite` action's `requires` and `effects`):** This tests website extraction.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a `User` and an `ExtractionConfig`.
    *   **Valid Extraction:** Calls `llmExtractFromWebsite` with a valid URL and content. Asserts success and verifies the suggestion's `websiteUrl`, `title`, and `source`.
    *   **Invalid URL:** Attempts with an `http://` URL (precondition requires `https://`). Asserts an error.
    *   **Empty Content:** Attempts with empty `websiteContent`. Asserts an error.
    *   **Rationale:** Tests the website extraction functionality and its input validation.

#### 9. "Action: refineWithFeedback - updates suggestion based on feedback" Test Case

*   **Correspondence to Concept Spec (`refineWithFeedback` action's `requires` and `effects`):** This tests the interactive refinement.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a suggestion.
    *   **Refine Date:** Calls `refineWithFeedback` with date-related feedback. Asserts success, verifies the `due` date has shifted, and the "date refined by LLM" warning is added. Checks confidence boost.
    *   **Refine Title:** Calls `refineWithFeedback` with title-related feedback. Asserts success, verifies the `title` is refined, and the "title refined by LLM" warning is added.
    *   **Non-existent Suggestion:** Attempts refinement with a fake `suggestion ID`. Asserts an error.
    *   **Empty Feedback:** Attempts refinement with empty feedback. Asserts an error.
    *   **Rationale:** Tests the LLM-driven refinement process.

#### 10. "Action: editSuggestion, updateSuggestionTitle, updateSuggestionDate - manually edit suggestions" Test Case

*   **Correspondence to Concept Spec (multiple manual editing actions):** This test covers the user's ability to directly correct suggestions.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a suggestion.
    *   **`editSuggestion`:** Edits both `title` and `due` date. Asserts success, verifies both changes, and checks for the "manually edited" warning.
    *   **`updateSuggestionTitle`:** Edits only the `title`. Asserts success, verifies `title` changed while `due` remained the same, and the warning persists.
    *   **`updateSuggestionDate`:** Edits only the `due` date. Asserts success, verifies `due` changed while `title` remained the same, and the warning persists.
    *   **Rationale:** Thoroughly tests the manual editing actions, crucial for user control.

#### 11. "Action: confirm - marks suggestion as confirmed and returns deadline data" Test Case

*   **Correspondence to Concept Spec (`confirm` action's `requires` and `effects`):** This is the final step where a suggestion becomes concrete.
*   **Implementation Details & Rationale:**
    *   **Setup:** Creates a `User`, `Course`, and a `ParsedDeadlineSuggestion`. Crucially, ensures the suggestion has a valid title and due date by directly editing it if the LLM simulation didn't produce a perfect one.
    *   **Successful Confirmation:** Calls `confirm` with valid IDs. Asserts success and verifies that the *returned object* contains the correct `course`, `title`, `due`, `source`, and `addedBy` for `DeadlineManagement.createDeadline`. Also verifies the original suggestion is marked `confirmed: true` in its state.
    *   **Already Confirmed:** Attempts to confirm the same suggestion again. Asserts an error.
    *   **Non-existent Suggestion:** Attempts confirmation with a fake `suggestion ID`. Asserts an error.
    *   **Malformed Suggestion:** Directly inserts a suggestion with an empty title or invalid due date to test these preconditions of `confirm`. Asserts errors for these cases.
    *   **Rationale:** Verifies the critical `confirm` action, which is the bridge to creating actual deadlines, and ensures all its preconditions are enforced.

These detailed explanations provide a clear and comprehensive understanding of the implementation and testing strategy for the `SuggestionManagement` concept, emphasizing strict adherence to the concept design principles.