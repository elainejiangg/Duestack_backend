---
timestamp: 'Sun Oct 19 2025 01:33:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_013358.d4aa73cb.md]]'
content_id: 7f72349f54c4868cbd908777e149909d9d2e25c66ab47971d71f21bfefe46114
---

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

* **Correspondence to Concept Spec:** The file name `DocumentManagementConcept.ts` directly aligns with the singular concept name `DocumentManagement`.
* **Implementation Details & Rationale:**
  * Standard imports for `Collection`, `Db` from `mongodb`, and project utilities `Empty`, `ID`, `freshID`.
  * `const PREFIX = "DocumentManagement" + ".";`: This prefix is used for MongoDB collection names (`DocumentManagement.uploadedDocuments`), ensuring unique namespacing in the database. This is critical for maintaining modularity and avoiding naming collisions if other concepts were to manage their own "documents" internally.
  * `type User = ID;` and `type Course = ID;`: These are the generic type parameters for the concept, representing opaque identifiers originating from `UserIdentity` and `CourseManagement`, respectively. `DocumentManagement` treats these simply as unique IDs, without needing to know the internal details (email, password, course code) of those entities. This strictly follows the principle of concept independence and polymorphism.
  * `type UploadedDocument = ID;`: This defines the internal entity ID for an individual uploaded document managed by this concept.

#### 2. `UploadedDocumentDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):** This interface directly maps to the `a set of UploadedDocuments` declaration in the concept specification.
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
* **Implementation Details & Rationale:**
  * `_id: UploadedDocument;`: MongoDB's primary key for each document, ensuring unique identification within its collection.
  * `course: Course;`: A reference (ID) to the `Course` entity, as a generic parameter.
  * `uploader: User;`: A reference (ID) to the `User` entity, as a generic parameter.
  * `fileName: string;`, `fileType: string;`, `fileContent: string;`: Directly correspond to the `String` types in the spec.
  * `uploadTime: Date;`: Corresponds to `a uploadTime DateTime`. TypeScript's `Date` object is the standard representation for `DateTime` in JavaScript/TypeScript, and MongoDB handles it as a BSON Date type.
  * **Rationale:** This interface rigorously defines the structure of an uploaded document, ensuring all specified state components are correctly represented for persistence.

#### 3. Class Definition and Constructor

* **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `DocumentManagementConcept` and its JSDoc `@concept` and `@purpose` tags explicitly link to the concept's definition.
* **Implementation Details & Rationale:**
  * `uploadedDocuments: Collection<UploadedDocumentDoc>;`: Declares the MongoDB collection that will store documents for this concept.
  * `constructor(private readonly db: Db) { ... }`: Initializes the `uploadedDocuments` collection using the defined `PREFIX`.

#### 4. `uploadDocument` Action

* **Correspondence to Concept Spec:**
  ```concept
  uploadDocument (course: Course, fileName: String, fileType: String, fileContent: String, uploader: User): (document: UploadedDocument, content: String) or (error: String)
    requires course exists
    effects stores the document content and metadata, associating it with the course and uploader. Returns document ID and content for further processing.
  ```
* **Implementation Details & Rationale:**
  * **Input Validation (`fileName`, `fileType`, `fileContent` non-empty):** The initial `if` statements check for empty or whitespace-only inputs for these crucial fields. If any are invalid, an `{ error: ... }` is returned, enforcing basic data integrity.
  * **`requires course exists` and `requires uploader exists` (implicit):** The JSDoc `// Note: 'course exists' and 'uploader exists' are preconditions to be enforced by calling context/syncs...` explicitly follows the independence principle. `DocumentManagement` does not query `CourseManagement` or `UserIdentity` to verify the existence of these IDs. It assumes that any `Course` or `User` ID passed in is valid and comes from the appropriate managing concept. This ensures strict separation of concerns.
  * **`effects stores the document content and metadata ... Returns document ID and content`**:
    * `const documentId = freshID() as UploadedDocument;`: A new unique ID is generated for the document.
    * `const uploadTime = new Date();`: The current timestamp is captured.
    * `await this.uploadedDocuments.insertOne({ _id: documentId, course, uploader, fileName, fileType, uploadTime, fileContent });`: The new document is inserted into the collection.
    * `return { document: documentId, content: fileContent };`: The action returns both the new document's ID and its content, as explicitly stated in the spec.

#### 5. `updateDocumentMetadata` Action

* **Correspondence to Concept Spec:**
  ```concept
  updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
    requires document exists
    effects updates the fileName and fileType of an existing document.
  ```
* **Implementation Details & Rationale:**
  * **`requires document exists`**: `await this.uploadedDocuments.findOne({ _id: document });` checks if the document to be updated exists. If not found, returns an `{ error: ... }`.
  * **Input Validation (`newFileName`, `newFileType` non-empty):** Similar to `uploadDocument`, checks for non-empty string inputs for the new metadata.
  * **`effects updates the fileName and fileType`**: `await this.uploadedDocuments.updateOne({ _id: document }, { $set: { fileName: newFileName, fileType: newFileType } });` updates the specified fields in the database.
  * `return {};`: Returns an empty object on success.

#### 6. `getDocumentContent` Action

* **Correspondence to Concept Spec:**
  ```concept
  getDocumentContent (document: UploadedDocument): (content: String) or (error: String)
    requires document exists
    effects retrieves the content of the specified document.
  ```
* **Implementation Details & Rationale:**
  * **`requires document exists`**: `await this.uploadedDocuments.findOne({ _id: document });` checks for the document. If not found, returns an `{ error: ... }`.
  * **`effects retrieves the content`**: If the document exists, `return { content: existingDocument.fileContent };` returns its `fileContent`.

#### 7. `deleteDocument` Action

* **Correspondence to Concept Spec:**
  ```concept
  deleteDocument (document: UploadedDocument): Empty or (error: String)
    requires document exists
    effects removes the specified document.
  ```
* **Implementation Details & Rationale:**
  * **`requires document exists`**: `const result = await this.uploadedDocuments.deleteOne({ _id: document });` attempts to delete the document.
  * `if (result.deletedCount === 0) { ... }`: If `deletedCount` is 0, it means the document with the given ID was not found, so an error is returned.
  * **`effects removes the specified document`**: The `deleteOne` operation fulfills this effect.
  * `return {};`: Returns an empty object on success.

#### 8. Query Methods (`_getDocumentById`, `_getDocumentsByCourse`, `_getDocumentsByUploader`, `_getAllDocuments`)

* **Correspondence to Concept Spec:** These are implicit queries, not explicitly defined in the concept spec's `actions` section but are essential for testing and for other concepts/synchronizations to inspect `DocumentManagement`'s state (e.g., `SuggestionManagement` needs to fetch documents).
* **Implementation Details & Rationale:**
  * Methods prefixed with `_` are queries, designed to read the state without modification.
  * They provide various ways to retrieve `UploadedDocumentDoc` documents based on ID, associated `Course` ID, or `uploader` `User` ID, or all documents.
  * **Rationale:** These queries are vital for verifying the `effects` of actions in tests and for enabling higher-level logic in the application.

***

### `src/documentmanagement/DocumentManagementConcept.test.ts` Implementation Explained

This file contains tests for the `DocumentManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The test file name and imports confirm its purpose.
* **Implementation Details & Rationale:**
  * Standard Deno assertion functions are imported.
  * `testDb`, `ID`, `freshID` are imported from `@utils`.
  * `import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";` and `import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";`: **These imports are crucial for test setup.**
    * **Rationale:** The `DocumentManagement` concept's actions (`uploadDocument`) require `User` and `Course` IDs as generic parameters. To create realistic test scenarios, we first need to instantiate `UserIdentityConcept` and `CourseManagementConcept` to generate valid `User` and `Course` IDs. This highlights that while concepts are independently implemented, they are designed to interact behaviorally through shared opaque identifiers. The relative paths assume a sibling directory structure for concepts.

#### 2. Test Data Constants

* **Implementation Details:** Defines constants for common test data (emails, names, course codes, file names, types, and content). Using descriptive names improves test readability.
* **Rationale:** Provides clear and consistent inputs for test cases, making it easier to understand test intent and outcomes.

#### 3. "Principle" Test Case

* **Correspondence to Concept Spec (`principle` section):**
  ```concept
  principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.
  ```
  This test block meticulously steps through this scenario.
* **Implementation Details & Rationale:**
  * **Setup:**
    * Creates a `User` (`aliceUserId`) using `UserIdentityConcept`.
    * Creates a `Course` (`courseId61040`) for that user using `CourseManagementConcept`.
    * This provides the necessary external IDs as arguments for `DocumentManagement` actions.
  * **1. Upload Document:** Calls `documentManagementConcept.uploadDocument()`.
    * `assertEquals("error" in uploadDocResult, false, ...)`: Asserts no error on successful upload.
    * `assertExists(docIdSyllabus, ...)`: Asserts that a `document ID` is returned.
    * `assertStrictEquals(returnedContent, DOC_CONTENT_SYLLABUS, ...)`: Verifies that the action correctly returns the content along with the ID, as per the spec.
  * **Verify Initial State:** Uses `_getDocumentById` to fetch the newly uploaded document.
    * Assumes `uploadedDoc` exists and then verifies all its metadata (`fileName`, `fileType`, `fileContent`, `course`, `uploader`, `uploadTime`) against the input, confirming the `effects`.
  * **2. Retrieve Content:** Calls `documentManagementConcept.getDocumentContent()` to explicitly retrieve the content.
    * Asserts success and verifies the returned `content`.
  * **3. Update Metadata:** Calls `documentManagementConcept.updateDocumentMetadata()` to change the `fileName` and `fileType`.
    * Asserts success.
    * Fetches the document again and verifies that only `fileName` and `fileType` are updated, while other fields (`fileContent`, `uploader`, `course`) remain unchanged, confirming frame conditions.
  * **Rationale:** This end-to-end test confirms the concept's main purpose and principle by simulating a full lifecycle from upload to metadata update and content retrieval.

#### 4. "Action: uploadDocument - enforces non-empty fields for metadata and content" Test Case

* **Correspondence to Concept Spec (`uploadDocument` action's implicit preconditions):** The explicit `requires` in the spec are `course exists`. My implementation adds checks for non-empty `fileName`, `fileType`, and `fileContent`. This test validates these implementation-level preconditions.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user and a course.
  * **Empty `fileName`:** Attempts `uploadDocument` with an empty string for `fileName`. Asserts an error and checks its specific message.
  * **Empty `fileType` (whitespace):** Attempts `uploadDocument` with whitespace for `fileType`. Asserts an error and checks its specific message.
  * **Empty `fileContent`:** Attempts `uploadDocument` with an empty string for `fileContent`. Asserts an error and checks its specific message.
  * **State Check:** `_getAllDocuments()` is used to confirm that no documents were created after these failed attempts.
  * **Rationale:** Rigorously tests the essential input validation logic for creating documents.

#### 5. "Action: updateDocumentMetadata - enforces document existence and non-empty new metadata" Test Case

* **Correspondence to Concept Spec (`updateDocumentMetadata` action's `requires`):**
  ```concept
  requires document exists.
  requires newFileName is non-empty.
  requires newFileType is non-empty.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and one document.
  * **Non-existent Document:** Attempts `updateDocumentMetadata` with a fake `document ID`. Asserts an error.
  * **Empty `newFileName`:** Attempts `updateDocumentMetadata` with an empty string for `newFileName`. Asserts an error.
  * **Empty `newFileType` (whitespace):** Attempts `updateDocumentMetadata` with whitespace for `newFileType`. Asserts an error.
  * **Rationale:** Comprehensive testing for `updateDocumentMetadata`, verifying preconditions.

#### 6. "Action: getDocumentContent - enforces document existence and retrieves content" Test Case

* **Correspondence to Concept Spec (`getDocumentContent` action's `requires` and `effects`):**
  ```concept
  requires document exists.
  effects retrieves the content of the specified document.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and one document.
  * **Successful Retrieval:** Calls `getDocumentContent` with a valid `document ID`. Asserts success and verifies the returned `content`.
  * **Non-existent Document:** Attempts `getDocumentContent` with a fake `document ID`. Asserts an error.
  * **Rationale:** Tests the core functionality of content retrieval and its precondition.

#### 7. "Action: deleteDocument - successfully deletes a document" Test Case

* **Correspondence to Concept Spec (`deleteDocument` action's `requires` and `effects`):**
  ```concept
  deleteDocument (document: UploadedDocument): Empty or (error: String)
    requires document exists.
    effects removes the specified document.
  ```
* **Implementation Details & Rationale:**
  * **Setup:** Creates a user, a course, and *two* documents.
  * **Delete First Document:** Calls `deleteDocument` for one document. Asserts success.
  * **Partial Verification:** Checks that the first document is gone (`null` from query) but the second one still exists (`assertExists`). This confirms precise deletion and no unintended side effects.
  * **Delete Second Document:** Deletes the remaining document.
  * **Final Verification:** Checks `_getAllDocuments()` to confirm all documents are deleted.
  * **Non-existent Document:** Attempts `deleteDocument` for a fake `document ID`. Asserts an error.
  * **Rationale:** Tests the `deleteDocument` action, confirming successful removal and correct handling of non-existent entities, as well as demonstrating isolated deletion.

These detailed explanations provide a clear understanding of the implementation and testing strategy for the `DocumentManagement` concept, adhering strictly to the concept design principles of modularity and independence.
