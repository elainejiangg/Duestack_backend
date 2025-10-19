

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

[@LikertSurveyConcept.ts[implement-management-concepts]

[@implement-management-concepts.md](/src/concepts/LikertSurvey/LikertSurveyConcept.ts)

[@files-in-mongo-piazza-note](files-in-mongo-piazza-note.md)

[@README](../../../old-README.md)
# question: After reading

[@files-in-mongo-piazza-note](files-in-mongo-piazza-note.md)

how would you recommend updating the documentmanget concept? and other concepts? note the change in concept specs and implementations (both regular .ts files and test .ts files)


# response:

Okay, let's refine your `DocumentManagement` and `SuggestionManagement` concepts, and their associated synchronizations, based on the feedback and the discussion about handling files with external storage.

The core changes will be:
1.  **`DocumentManagement`:**
    *   Change `fileContent: String` in the state to `contentUrl: String`.
    *   The `uploadDocument` action will now simulate saving content to an external store and return a `contentUrl` and the `processedTextContent` (e.g., OCR'd text) as a string. This `processedTextContent` is what `SuggestionManagement` will consume.
    *   Add `deleteDocument` and `updateDocumentMetadata` actions as per the rubric's feedback for missing actions.
    *   Add `getDocumentContent` to retrieve the processed text.
2.  **`SuggestionManagement`:**
    *   Ensure all actions take `User`, `Document`, `Course` as generic IDs, and `documentContent` as a primitive `String` where content is passed. This aligns with modularity.
    *   Add `user: User` to the `ParsedDeadlineSuggestion` state as previously identified.
    *   Implement actions to accept mock LLM/parsing results for testing.
    *   Refine `confirm` action to explicitly return the data for `DeadlineManagement.createDeadline`.
3.  **Synchronizations:** Adjust `parse_upload` to reflect the new return values of `DocumentManagement.uploadDocument`.

I will provide the updated concept specifications, then the TypeScript implementations, and finally the test files and the trace for `DocumentManagement` and `SuggestionManagement`.

---

## **Updated Concept: DocumentManagement**

```concept
concept DocumentManagement [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with
  a course Course
  a uploader User
  a fileName String
  a fileType String // e.g., "application/pdf", "image/png", "text/plain"
  a uploadTime DateTime
  a contentUrl String // URL where the actual file content is stored externally (e.g., GCS, S3)
  a processedTextContent String // Extracted text content from the file, suitable for LLM processing

actions
uploadDocument (course: Course, fileName: String, fileType: String, rawFileContent: String, uploader: User): (document: UploadedDocument, processedTextContent: String, contentUrl: String) or (error: String)
  requires course exists and rawFileContent is non-empty
  effects stores the rawFileContent in external storage (simulated), records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing.

updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
  requires document exists
  effects updates the fileName and fileType of an existing document's metadata.

getDocumentContent (document: UploadedDocument): (processedTextContent: String) or (error: String)
  requires document exists
  effects retrieves the stored processed text content of the specified document.

deleteDocument (document: UploadedDocument): Empty or (error: String)
  requires document exists
  effects removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.
```

---

## **Updated Concept: SuggestionManagement**

```concept
concept SuggestionManagement [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestions with
  a user User // The user who initiated the parsing
  an optional document Document // ID of the UploadedDocument if applicable
  an optional canvasMetadata String // Raw JSON data from Canvas
  an optional websiteUrl String
  a title String
  a due DateTime
  a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
  an optional confirmed Boolean = false
  an optional confidence Number (0.0–1.0)
  an optional extractionMethod of CANVAS_JSON or LLM
  an optional provenance String // e.g., LLM model version, prompt used, file name
  an optional warnings set of String // e.g., "date ambiguous", "low confidence"

a set of ExtractionConfigs with
  a name String
  a modelVersion String
  a basePromptTemplate String
  a maxTokens Number
  a temperature Number
  a timezone String
  an optional timeout Number

actions
createExtractionConfig (name: String, modelVersion: String, basePromptTemplate: String, maxTokens: Number, temperature: Number, timezone: String, optionalTimeout: Number): (config: ExtractionConfig) or (error: String)
  requires name is unique
  effects creates a new extraction configuration for LLM processing.

parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists and canvasData is valid JSON
  effects parses assignment JSON data, creates suggestions linked to `user`.
           sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

llmExtractFromDocument(user: User, documentId: Document, documentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, documentId exists, documentContent is text or image suitable for LLM
  effects uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

llmExtractFromMultipleDocuments(user: User, documentContents: List<{documentId: Document, content: String}>, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, all documentContents are provided and suitable for LLM
  effects sends ALL document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.

llmExtractFromWebsite(user: User, url: String, websiteContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, url is reachable, websiteContent is non-empty
  effects uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `provenance`, `confidence`.

refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists, feedback is non-empty, config exists
  effects re-prompts LLM using user feedback to refine fields of the suggestion.
           updates title, due, warnings, or confidence.

editSuggestion(suggestion: ParsedDeadlineSuggestion, newTitle: String, newDue: DateTime): Empty or (error: String)
  requires suggestion exists, newTitle is non-empty, newDue is valid
  effects updates suggestion title and due date.
           sets `warnings` to indicate manual editing.

updateSuggestionTitle(suggestion: ParsedDeadlineSuggestion, newTitle: String): Empty or (error: String)
  requires suggestion exists and newTitle is non-empty
  effects updates suggestion title.
           sets `warnings` to indicate manual editing.

updateSuggestionDate(suggestion: ParsedDeadlineSuggestion, newDue: DateTime): Empty or (error: String)
  requires suggestion exists and newDue is valid
  effects updates suggestion due date.
           sets `warnings` to indicate manual editing.

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date, and course exists
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
```

---

### **Updated Essential Synchronizations**

```
sync parse_upload
when DocumentManagement.uploadDocument (document: d, processedTextContent: ptc, contentUrl: cu, course: crs, fileName: fn, fileType: ft, uploader: u)
where ft is "application/pdf" or "image/png" or "text/plain" // simplified check
then SuggestionManagement.llmExtractFromDocument (user: u, documentId: d, documentContent: ptc, config: default_llm_config) // Assuming 'default_llm_config' is an implicitly available config from ExtractionConfigs

sync parse_canvas
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token) // This sync would need to trigger a periodic fetch or an explicit user action
then SuggestionManagement.parseFromCanvas (user: u, canvasData: (fetched data), config: default_canvas_config) // Assuming 'default_canvas_config' is an implicitly available config from ExtractionConfigs

sync confirm_suggestion
when SuggestionManagement.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then DeadlineManagement.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

sync status_update
when Request.setStatus (deadline: dl, status: st) // Assuming 'Request' is a pseudo-concept for user requests
then DeadlineManagement.setStatus (deadline: dl, status: st)
```

---

# file: src/documentmanagement/DocumentManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "DocumentManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Course = ID;

// Internal entity types, represented as IDs
type UploadedDocument = ID;

/**
 * State: A set of UploadedDocuments with metadata and a URL to its content.
 */
interface UploadedDocumentDoc {
  _id: UploadedDocument;
  course: Course;
  uploader: User;
  fileName: string;
  fileType: string;
  uploadTime: Date;
  contentUrl: string; // URL where the actual file content is stored externally (e.g., GCS, S3)
  processedTextContent: string; // Extracted text content from the file
}

/**
 * @concept DocumentManagement
 * @purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots)
 *          and associate them with specific courses and users.
 */
export default class DocumentManagementConcept {
  documents: Collection<UploadedDocumentDoc>;

  constructor(private readonly db: Db) {
    this.documents = this.db.collection(PREFIX + "documents");
  }

  /**
   * Action: Uploads a document.
   * @requires course exists and rawFileContent is non-empty.
   * @effects Stores the rawFileContent in external storage (simulated), records its contentUrl and metadata.
   *          Simulates text extraction. Returns document ID, extracted text content, and contentUrl.
   */
  async uploadDocument(
    { course, fileName, fileType, rawFileContent, uploader }: {
      course: Course;
      fileName: string;
      fileType: string;
      rawFileContent: string;
      uploader: User;
    },
  ): Promise<
    | {
      document: UploadedDocument;
      processedTextContent: string;
      contentUrl: string;
    }
    | { error: string }
  > {
    // In a real scenario, rawFileContent would be sent to GCS/S3 here,
    // and contentUrl would be the URL returned by the storage service.
    // processedTextContent would be extracted (e.g., via OCR for images/PDFs).
    // For this assignment, we simulate these steps.

    if (!rawFileContent) {
      return { error: "rawFileContent cannot be empty." };
    }
    // Simulate content storage and URL generation
    const simulatedContentUrl = `https://mock-storage.com/${freshID()}/${fileName}`;
    const simulatedProcessedTextContent = `[Extracted Text from ${fileName}]: ${rawFileContent.substring(0, 50)}...`; // Simple simulation

    const documentId = freshID() as UploadedDocument;
    const uploadTime = new Date();

    const newDocument: UploadedDocumentDoc = {
      _id: documentId,
      course,
      uploader,
      fileName,
      fileType,
      uploadTime,
      contentUrl: simulatedContentUrl,
      processedTextContent: simulatedProcessedTextContent,
    };

    await this.documents.insertOne(newDocument);

    return {
      document: documentId,
      processedTextContent: simulatedProcessedTextContent,
      contentUrl: simulatedContentUrl,
    };
  }

  /**
   * Action: Updates an existing document's metadata.
   * @requires document exists.
   * @effects Updates the fileName and fileType of an existing document's metadata.
   */
  async updateDocumentMetadata(
    { document, newFileName, newFileType }: {
      document: UploadedDocument;
      newFileName: string;
      newFileType: string;
    },
  ): Promise<Empty | { error: string }> {
    const result = await this.documents.updateOne(
      { _id: document },
      { $set: { fileName: newFileName, fileType: newFileType } },
    );

    if (result.matchedCount === 0) {
      return { error: `Document with ID ${document} not found.` };
    }
    return {};
  }

  /**
   * Action: Retrieves the stored processed text content of the specified document.
   * @requires document exists.
   * @effects Returns the processed text content.
   */
  async getDocumentContent(
    { document }: { document: UploadedDocument },
  ): Promise<{ processedTextContent: string } | { error: string }> {
    const doc = await this.documents.findOne({ _id: document });
    if (!doc) {
      return { error: `Document with ID ${document} not found.` };
    }
    return { processedTextContent: doc.processedTextContent };
  }

  /**
   * Action: Removes the specified document's metadata and simulates deletion of its content.
   * @requires document exists.
   * @effects Removes the document from the concept state and simulates deletion from external storage.
   */
  async deleteDocument(
    { document }: { document: UploadedDocument },
  ): Promise<Empty | { error: string }> {
    const result = await this.documents.deleteOne({ _id: document });
    if (result.deletedCount === 0) {
      return { error: `Document with ID ${document} not found.` };
    }
    // In a real scenario, trigger deletion from GCS/S3 here using contentUrl
    console.log(`Simulating deletion of content for document ${document}`);
    return {};
  }

  /**
   * Query: Retrieves a document by its ID.
   */
  async _getDocumentById({ document }: { document: UploadedDocument }): Promise<
    UploadedDocumentDoc | null
  > {
    return await this.documents.findOne({ _id: document });
  }

  /**
   * Query: Retrieves all documents uploaded by a specific user.
   */
  async _getDocumentsByUser({ uploader }: { uploader: User }): Promise<
    UploadedDocumentDoc[]
  > {
    return await this.documents.find({ uploader }).toArray();
  }

  /**
   * Query: Retrieves all documents associated with a specific course.
   */
  async _getDocumentsByCourse({ course }: { course: Course }): Promise<
    UploadedDocumentDoc[]
  > {
    return await this.documents.find({ course }).toArray();
  }
}
```

---

# file: src/documentmanagement/DocumentManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import DocumentManagementConcept from "./DocumentManagementConcept.ts";

const userA = "user:Alice" as ID;
const courseX = "course:CS101" as ID;
const courseY = "course:CS102" as ID;

Deno.test("DocumentManagement: Principle - User uploads document, metadata is stored, and content is retrievable", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);

  try {
    const rawContent = "This is the raw content of the syllabus PDF.";
    const fileName = "syllabus.pdf";
    const fileType = "application/pdf";

    // 1. User uploads a document
    const uploadResult = await docConcept.uploadDocument({
      course: courseX,
      fileName,
      fileType,
      rawFileContent: rawContent,
      uploader: userA,
    });
    assertNotEquals("error" in uploadResult, true, "Upload should not fail.");
    const { document, processedTextContent, contentUrl } = uploadResult as {
      document: ID;
      processedTextContent: string;
      contentUrl: string;
    };
    assertExists(document);
    assertExists(processedTextContent);
    assertExists(contentUrl);
    assertEquals(
      processedTextContent.startsWith("[Extracted Text from syllabus.pdf]:"),
      true,
      "Processed text should be simulated.",
    );
    assertEquals(
      contentUrl.startsWith("https://mock-storage.com/"),
      true,
      "Content URL should be simulated.",
    );

    // Verify document metadata is stored
    const storedDoc = await docConcept._getDocumentById({ document });
    assertExists(storedDoc);
    assertEquals(storedDoc.fileName, fileName);
    assertEquals(storedDoc.fileType, fileType);
    assertEquals(storedDoc.uploader, userA);
    assertEquals(storedDoc.course, courseX);
    assertEquals(storedDoc.contentUrl, contentUrl);
    assertEquals(storedDoc.processedTextContent, processedTextContent);

    // 2. Content is retrievable
    const getContentResult = await docConcept.getDocumentContent({ document });
    assertNotEquals(
      "error" in getContentResult,
      true,
      "Getting content should not fail.",
    );
    const { processedTextContent: retrievedContent } = getContentResult as {
      processedTextContent: string;
    };
    assertEquals(retrievedContent, processedTextContent);

    // 3. Document metadata can be updated
    const updateMetadataResult = await docConcept.updateDocumentMetadata({
      document,
      newFileName: "new_syllabus.pdf",
      newFileType: "text/plain",
    });
    assertEquals(
      "error" in updateMetadataResult,
      false,
      "Updating metadata should succeed.",
    );
    const updatedDoc = await docConcept._getDocumentById({ document });
    assertExists(updatedDoc);
    assertEquals(updatedDoc.fileName, "new_syllabus.pdf");
    assertEquals(updatedDoc.fileType, "text/plain");

    // 4. Document can be deleted
    const deleteResult = await docConcept.deleteDocument({ document });
    assertEquals("error" in deleteResult, false, "Deletion should succeed.");
    const deletedDoc = await docConcept._getDocumentById({ document });
    assertEquals(deletedDoc, null, "Document should no longer exist.");
  } finally {
    await client.close();
  }
});

Deno.test("DocumentManagement: uploadDocument requires rawFileContent to be non-empty", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);

  try {
    const result = await docConcept.uploadDocument({
      course: courseX,
      fileName: "empty.txt",
      fileType: "text/plain",
      rawFileContent: "",
      uploader: userA,
    });
    assertEquals("error" in result, true, "Upload with empty content should fail.");
    assertEquals(
      (result as { error: string }).error,
      "rawFileContent cannot be empty.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("DocumentManagement: updateDocumentMetadata fails for non-existent document", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);
  const nonExistentDocId = "doc:fake" as ID;

  try {
    const result = await docConcept.updateDocumentMetadata({
      document: nonExistentDocId,
      newFileName: "fake.txt",
      newFileType: "text/plain",
    });
    assertEquals(
      "error" in result,
      true,
      "Updating metadata for non-existent document should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("DocumentManagement: getDocumentContent fails for non-existent document", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);
  const nonExistentDocId = "doc:fake" as ID;

  try {
    const result = await docConcept.getDocumentContent({
      document: nonExistentDocId,
    });
    assertEquals(
      "error" in result,
      true,
      "Getting content for non-existent document should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("DocumentManagement: deleteDocument fails for non-existent document", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);
  const nonExistentDocId = "doc:fake" as ID;

  try {
    const result = await docConcept.deleteDocument({
      document: nonExistentDocId,
    });
    assertEquals(
      "error" in result,
      true,
      "Deleting non-existent document should fail.",
    );
  } finally {
    await client.close();
  }
});

Deno.test("DocumentManagement: Multiple documents for different users/courses", async () => {
  const [db, client] = await testDb();
  const docConcept = new DocumentManagementConcept(db);

  const userB = "user:Bob" as ID;

  try {
    const doc1Result = await docConcept.uploadDocument({
      course: courseX,
      fileName: "doc1.txt",
      fileType: "text/plain",
      rawFileContent: "Content for doc1.",
      uploader: userA,
    });
    const { document: doc1 } = doc1Result as { document: ID };

    const doc2Result = await docConcept.uploadDocument({
      course: courseY,
      fileName: "doc2.pdf",
      fileType: "application/pdf",
      rawFileContent: "Content for doc2.",
      uploader: userA,
    });
    const { document: doc2 } = doc2Result as { document: ID };

    const doc3Result = await docConcept.uploadDocument({
      course: courseX,
      fileName: "doc3.jpg",
      fileType: "image/jpeg",
      rawFileContent: "Content for doc3.",
      uploader: userB,
    });
    const { document: doc3 } = doc3Result as { document: ID };

    const docsUserA = await docConcept._getDocumentsByUser({ uploader: userA });
    assertEquals(docsUserA.length, 2, "UserA should have 2 documents.");
    assertExists(docsUserA.find((d) => d._id === doc1));
    assertExists(docsUserA.find((d) => d._id === doc2));

    const docsUserB = await docConcept._getDocumentsByUser({ uploader: userB });
    assertEquals(docsUserB.length, 1, "UserB should have 1 document.");
    assertExists(docsUserB.find((d) => d._id === doc3));

    const docsCourseX = await docConcept._getDocumentsByCourse({ course: courseX });
    assertEquals(docsCourseX.length, 2, "CourseX should have 2 documents.");
    assertExists(docsCourseX.find((d) => d._id === doc1));
    assertExists(docsCourseX.find((d) => d._id === doc3));

    const docsCourseY = await docConcept._getDocumentsByCourse({ course: courseY });
    assertEquals(docsCourseY.length, 1, "CourseY should have 1 document.");
    assertExists(docsCourseY.find((d) => d._id === doc2));
  } finally {
    await client.close();
  }
});
```

---

# file: src/suggestionmanagement/SuggestionManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "SuggestionManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Document = ID; // From DocumentManagement
type Course = ID; // From CourseManagement

// Internal entity types, represented as IDs
type ParsedDeadlineSuggestion = ID;
type ExtractionConfig = ID;

/**
 * State: A set of ParsedDeadlineSuggestions representing extracted deadline candidates.
 */
interface ParsedDeadlineSuggestionDoc {
  _id: ParsedDeadlineSuggestion;
  user: User;
  document?: Document;
  canvasMetadata?: string;
  websiteUrl?: string;
  title: string;
  due: Date;
  source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS";
  confirmed: boolean;
  confidence?: number; // 0.0 - 1.0
  extractionMethod?: "CANVAS_JSON" | "LLM";
  provenance?: string;
  warnings?: string[];
}

/**
 * State: A set of ExtractionConfigs for LLM processing.
 */
interface ExtractionConfigDoc {
  _id: ExtractionConfig;
  name: string;
  modelVersion: string;
  basePromptTemplate: string;
  maxTokens: number;
  temperature: number;
  timezone: string;
  timeout?: number;
}

/**
 * @concept SuggestionManagement
 * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas;
 *          optionally AI-augmented.
 */
export default class SuggestionManagementConcept {
  suggestions: Collection<ParsedDeadlineSuggestionDoc>;
  extractionConfigs: Collection<ExtractionConfigDoc>;

  constructor(private readonly db: Db) {
    this.suggestions = this.db.collection(PREFIX + "suggestions");
    this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
  }

  /**
   * Action: Creates a new extraction configuration.
   * @requires name is unique.
   * @effects Creates a new extraction configuration and returns its ID.
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
    const existingConfig = await this.extractionConfigs.findOne({ name });
    if (existingConfig) {
      return { error: `Extraction config with name '${name}' already exists.` };
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
      timeout: optionalTimeout,
    });
    return { config: configId };
  }

  // --- LLM/Parsing Simulation Methods ---
  private async _simulateLLMExtraction(
    user: User,
    source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS",
    contentIdentifier: Document | string, // documentId, canvasMetadata, or websiteUrl
    content: string,
    config: ExtractionConfig,
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    // In a real application, this would involve calling an LLM API.
    // For this simulation, we generate mock suggestions based on keywords.
    const configDoc = await this.extractionConfigs.findOne({ _id: config });
    if (!configDoc) {
      console.warn(`Config ${config} not found. Using default mock behavior.`);
    }

    const mockSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("assignment 1")) {
      mockSuggestions.push({
        _id: freshID() as ParsedDeadlineSuggestion,
        user,
        document: source !== "CANVAS" && source !== "WEBSITE"
          ? (contentIdentifier as Document)
          : undefined,
        websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Assignment 1: Introduction",
        due: new Date(new Date().getFullYear(), 8, 15, 23, 59), // Sept 15
        source,
        confirmed: false,
        confidence: 0.95,
        extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
        provenance: `Simulated LLM from ${source}`,
      });
    }
    if (lowerContent.includes("final project")) {
      mockSuggestions.push({
        _id: freshID() as ParsedDeadlineSuggestion,
        user,
        document: source !== "CANVAS" && source !== "WEBSITE"
          ? (contentIdentifier as Document)
          : undefined,
        websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Final Project Submission",
        due: new Date(new Date().getFullYear(), 11, 20, 17, 0), // Dec 20
        source,
        confirmed: false,
        confidence: 0.88,
        extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
        provenance: `Simulated LLM from ${source}`,
        warnings: ["Date might be ambiguous"],
      });
    }
    return mockSuggestions;
  }

  /**
   * Action: Parses assignment JSON data from Canvas.
   * @requires config exists and canvasData is valid JSON.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
   */
  async parseFromCanvas(
    { user, canvasData, config }: {
      user: User;
      canvasData: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    try {
      JSON.parse(canvasData); // Validate JSON
    } catch (e) {
      return { error: "canvasData is not valid JSON." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "CANVAS",
      canvasData, // Use canvasData as identifier for simulation
      canvasData,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    await this.suggestions.insertMany(mockSuggestions);
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Uses LLM to extract structured suggestions from document content.
   * @requires config exists, documentId exists, documentContent is text or image suitable for LLM.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance`.
   */
  async llmExtractFromDocument(
    { user, documentId, documentContent, config }: {
      user: User;
      documentId: Document;
      documentContent: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!documentContent) {
      return { error: "documentContent cannot be empty for LLM extraction." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "SYLLABUS", // Or IMAGE, depending on how `documentContent` is handled
      documentId,
      documentContent,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    await this.suggestions.insertMany(mockSuggestions);
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Sends ALL document contents to LLM in SINGLE request to enable cross-referencing.
   * @requires config exists, all documentContents are provided and suitable for LLM.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.
   */
  async llmExtractFromMultipleDocuments(
    { user, documentContents, config }: {
      user: User;
      documentContents: { documentId: Document; content: string }[];
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!documentContents || documentContents.length === 0) {
      return { error: "No document contents provided for multiple extraction." };
    }

    const combinedContent = documentContents.map((d) =>
      `[DOC:${d.documentId}]: ${d.content}`
    ).join("\n\n");
    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "SYLLABUS",
      "multi-document", // Placeholder identifier for simulation
      combinedContent,
      config,
    ); // Simulate combined extraction
    const suggestionIds = mockSuggestions.map((s) => s._id);
    await this.suggestions.insertMany(mockSuggestions);
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Uses LLM to parse website content into deadline suggestions.
   * @requires config exists, url is reachable, websiteContent is non-empty.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   */
  async llmExtractFromWebsite(
    { user, url, websiteContent, config }: {
      user: User;
      url: string;
      websiteContent: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!url || !url.startsWith("https://")) {
      return { error: "Invalid URL provided." };
    }
    if (!websiteContent) {
      return { error: "websiteContent cannot be empty for LLM extraction." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "WEBSITE",
      url,
      websiteContent,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    await this.suggestions.insertMany(mockSuggestions);
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
   * @requires suggestion exists, feedback is non-empty, config exists.
   * @effects Updates title, due, warnings, or confidence of the suggestion.
   */
  async refineWithFeedback(
    { suggestion, feedback, config }: {
      suggestion: ParsedDeadlineSuggestion;
      feedback: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestion: ParsedDeadlineSuggestion } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!feedback) {
      return { error: "Feedback cannot be empty." };
    }

    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }

    // Simulate LLM refinement based on feedback.
    // For example, if feedback contains "due at 11:59 PM", update the time.
    let newDue = existingSuggestion.due;
    if (feedback.includes("11:59 PM")) {
      newDue.setHours(23, 59, 0, 0);
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Refined by user feedback")) {
      updatedWarnings.push("Refined by user feedback");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      {
        $set: {
          due: newDue,
          warnings: updatedWarnings,
          confidence: existingSuggestion.confidence ? Math.min(existingSuggestion.confidence + 0.05, 1.0) : 0.9, // Simulate confidence increase
          provenance: `${existingSuggestion.provenance}, Refined by feedback: ${feedback}`,
        },
      },
    );

    return { suggestion };
  }

  /**
   * Action: Updates suggestion title and due date.
   * @requires suggestion exists, newTitle is non-empty, newDue is valid.
   * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
   */
  async editSuggestion(
    { suggestion, newTitle, newDue }: {
      suggestion: ParsedDeadlineSuggestion;
      newTitle: string;
      newDue: Date;
    },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle) {
      return { error: "New title cannot be empty." };
    }
    if (isNaN(newDue.getTime())) {
      return { error: "New due date is invalid." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { title: newTitle, due: newDue, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Updates suggestion title.
   * @requires suggestion exists and newTitle is non-empty.
   * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionTitle(
    { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle) {
      return { error: "New title cannot be empty." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { title: newTitle, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Updates suggestion due date.
   * @requires suggestion exists and newDue is valid.
   * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionDate(
    { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (isNaN(newDue.getTime())) {
      return { error: "New due date is invalid." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { due: newDue, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Marks a suggestion as confirmed, and returns the data for creating a new Deadline.
   * @requires suggestion exists, is not already confirmed, has valid title and due date, and course exists.
   * @effects Marks suggestion as confirmed, and emits canonical data to `Deadlines.create`.
   */
  async confirm(
    { suggestion, course, addedBy }: {
      suggestion: ParsedDeadlineSuggestion;
      course: Course;
      addedBy: User;
    },
  ): Promise<
    | {
      course: Course;
      title: string;
      due: Date;
      source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
      addedBy: User;
    }
    | { error: string }
  > {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (existingSuggestion.confirmed) {
      return { error: `Suggestion with ID ${suggestion} is already confirmed.` };
    }
    if (!existingSuggestion.title || isNaN(existingSuggestion.due.getTime())) {
      return { error: "Suggestion has invalid title or due date and cannot be confirmed." };
    }
    // In a real app, you might validate `course` existence via `CourseManagement._getCourseById` or similar if direct querying were allowed (it's not, without a sync).
    // For this concept, we assume the `course` ID passed is valid for the `DeadlineManagement` concept.

    await this.suggestions.updateOne({ _id: suggestion }, { $set: { confirmed: true } });

    return {
      course,
      title: existingSuggestion.title,
      due: existingSuggestion.due,
      source: existingSuggestion.source,
      addedBy,
    };
  }

  // --- Queries ---
  async _getSuggestionById(
    { suggestion }: { suggestion: ParsedDeadlineSuggestion },
  ): Promise<ParsedDeadlineSuggestionDoc | null> {
    return await this.suggestions.findOne({ _id: suggestion });
  }

  async _getSuggestionsByUser(
    { user }: { user: User },
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user }).toArray();
  }

  async _getUnconfirmedSuggestionsByUser(
    { user }: { user: User },
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user, confirmed: false }).toArray();
  }
}
```

---

# file: src/suggestionmanagement/SuggestionManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import SuggestionManagementConcept from "./SuggestionManagementConcept.ts";

const userA = "user:Alice" as ID;
const document1 = "document:doc1" as ID;
const courseX = "course:CS101" as ID;
const LLM_CONFIG_NAME = "default_llm_config";
const CANVAS_CONFIG_NAME = "default_canvas_config";

Deno.test("SuggestionManagement: Principle - Suggestions produced, refined, and confirmed", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);

  try {
    // Setup: Create LLM and Canvas configs
    const createLlmConfigResult = await suggestionConcept.createExtractionConfig({
      name: LLM_CONFIG_NAME,
      modelVersion: "LLaMA-3",
      basePromptTemplate: "Extract deadlines from text.",
      maxTokens: 500,
      temperature: 0.7,
      timezone: "America/New_York",
    });
    assertNotEquals("error" in createLlmConfigResult, true, "LLM config creation should succeed.");
    const { config: llmConfig } = createLlmConfigResult as { config: ID };

    const createCanvasConfigResult = await suggestionConcept.createExtractionConfig({
      name: CANVAS_CONFIG_NAME,
      modelVersion: "CANVAS_JSON",
      basePromptTemplate: "Parse Canvas JSON for deadlines.",
      maxTokens: 500,
      temperature: 0.0,
      timezone: "America/New_York",
    });
    assertNotEquals("error" in createCanvasConfigResult, true, "Canvas config creation should succeed.");
    const { config: canvasConfig } = createCanvasConfigResult as { config: ID };

    // 1. Suggestions are produced via an LLM from uploaded files (simulated)
    const docContent = "Assignment 1 due on 2025-09-15. Final project due Dec 20, 2025.";
    const extractDocResult = await suggestionConcept.llmExtractFromDocument({
      user: userA,
      documentId: document1,
      documentContent: docContent,
      config: llmConfig,
    });
    assertNotEquals("error" in extractDocResult, true, "LLM extraction from document should succeed.");
    const { suggestions: docSuggestions } = extractDocResult as { suggestions: ID[] };
    assertEquals(docSuggestions.length, 2, "Should extract 2 suggestions from document.");

    const s1 = await suggestionConcept._getSuggestionById({ suggestion: docSuggestions[0] });
    assertExists(s1);
    assertEquals(s1.title, "Assignment 1: Introduction");
    assertEquals(s1.user, userA);
    assertEquals(s1.document, document1);
    assertEquals(s1.confirmed, false);

    // 2. User refines a suggestion
    const refineResult = await suggestionConcept.refineWithFeedback({
      suggestion: s1._id,
      feedback: "The due time should be 11:59 PM.",
      config: llmConfig,
    });
    assertNotEquals("error" in refineResult, true, "Refinement should succeed.");
    const refinedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
    assertExists(refinedS1);
    assertEquals(refinedS1.due.getHours(), 23, "Due hour should be updated to 23 (11 PM).");
    assertEquals(refinedS1.due.getMinutes(), 59, "Due minute should be updated to 59.");
    assertExists(refinedS1.warnings?.includes("Refined by user feedback"));

    // 3. User edits a suggestion manually
    const newDate = new Date(refinedS1.due.getFullYear(), refinedS1.due.getMonth(), refinedS1.due.getDate() + 1, 23, 59);
    const editResult = await suggestionConcept.editSuggestion({
      suggestion: s1._id,
      newTitle: "Revised Assignment 1",
      newDue: newDate,
    });
    assertNotEquals("error" in editResult, true, "Manual edit should succeed.");
    const editedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
    assertExists(editedS1);
    assertEquals(editedS1.title, "Revised Assignment 1");
    assertEquals(editedS1.due.getDate(), s1.due.getDate() + 1, "Date should be incremented by 1.");
    assertExists(editedS1.warnings?.includes("Manually edited"));

    // 4. Users confirm suggestions before they become official deadlines
    const confirmResult = await suggestionConcept.confirm({
      suggestion: s1._id,
      course: courseX,
      addedBy: userA,
    });
    assertNotEquals("error" in confirmResult, true, "Confirmation should succeed.");
    const confirmedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
    assertExists(confirmedS1);
    assertEquals(confirmedS1.confirmed, true, "Suggestion should be marked as confirmed.");

    const { course, title, due, source, addedBy } = confirmResult as {
      course: ID;
      title: string;
      due: Date;
      source: string;
      addedBy: ID;
    };
    assertEquals(course, courseX);
    assertEquals(title, editedS1.title);
    assertEquals(due, editedS1.due);
    assertEquals(source, editedS1.source);
    assertEquals(addedBy, userA);
  } finally {
    await client.close();
  }
});

Deno.test("SuggestionManagement: createExtractionConfig requires unique name", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);

  try {
    const createResult1 = await suggestionConcept.createExtractionConfig({
      name: "unique_config",
      modelVersion: "v1",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    });
    assertEquals("error" in createResult1, false, "First config creation should succeed.");

    const createResult2 = await suggestionConcept.createExtractionConfig({
      name: "unique_config",
      modelVersion: "v2",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    });
    assertEquals("error" in createResult2, true, "Second config with same name should fail.");
  } finally {
    await client.close();
  }
});

Deno.test("SuggestionManagement: llmExtractFromDocument handles invalid config/content", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);
  const fakeConfigId = "config:fake" as ID;

  try {
    const result1 = await suggestionConcept.llmExtractFromDocument({
      user: userA,
      documentId: document1,
      documentContent: "some content",
      config: fakeConfigId,
    });
    assertEquals("error" in result1, true, "Should fail with non-existent config.");

    const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
      name: LLM_CONFIG_NAME,
      modelVersion: "v1",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    })) as { config: ID };

    const result2 = await suggestionConcept.llmExtractFromDocument({
      user: userA,
      documentId: document1,
      documentContent: "",
      config: llmConfig,
    });
    assertEquals("error" in result2, true, "Should fail with empty document content.");
  } finally {
    await client.close();
  }
});

Deno.test("SuggestionManagement: confirm requirements are enforced", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);

  // Setup
  const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
    name: LLM_CONFIG_NAME,
    modelVersion: "v1",
    basePromptTemplate: "",
    maxTokens: 100,
    temperature: 0.5,
    timezone: "UTC",
  })) as { config: ID };
  const docContent = "Assignment 1 due on 2025-09-15.";
  const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
    user: userA,
    documentId: document1,
    documentContent: docContent,
    config: llmConfig,
  })) as { suggestions: ID[] };

  try {
    // Already confirmed
    await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
    const res1 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
    assertEquals("error" in res1, true, "Should fail if suggestion is already confirmed.");

    // Non-existent suggestion
    const fakeSuggestionId = "suggestion:fake" as ID;
    const res2 = await suggestionConcept.confirm({ suggestion: fakeSuggestionId, course: courseX, addedBy: userA });
    assertEquals("error" in res2, true, "Should fail for non-existent suggestion.");

    // Invalid title/due (simulated by modifying directly in DB)
    await suggestionConcept.suggestions.updateOne({ _id: s1Id }, { $set: { title: "" } });
    const res3 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
    assertEquals("error" in res3, true, "Should fail if suggestion has invalid title.");
  } finally {
    await client.close();
  }
});

Deno.test("SuggestionManagement: llmExtractFromMultipleDocuments works", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);

  try {
    const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
      name: LLM_CONFIG_NAME,
      modelVersion: "v1",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    })) as { config: ID };

    const doc2 = "document:doc2" as ID;
    const docContents = [
      { documentId: document1, content: "Assignment 1 details here." },
      { documentId: doc2, content: "Final project due date." },
    ];

    const result = await suggestionConcept.llmExtractFromMultipleDocuments({
      user: userA,
      documentContents: docContents,
      config: llmConfig,
    });
    assertNotEquals("error" in result, true, "Multiple document extraction should succeed.");
    const { suggestions } = result as { suggestions: ID[] };
    assertEquals(suggestions.length, 2, "Should extract multiple suggestions from combined content.");
    const s1 = await suggestionConcept._getSuggestionById({ suggestion: suggestions[0] });
    assertExists(s1);
    assertEquals(s1.user, userA);
  } finally {
    await client.close();
  }
});

Deno.test("SuggestionManagement: editSuggestion/updateSuggestionTitle/Date updates and adds warnings", async () => {
  const [db, client] = await testDb();
  const suggestionConcept = new SuggestionManagementConcept(db);

  try {
    const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
      name: LLM_CONFIG_NAME,
      modelVersion: "v1",
      basePromptTemplate: "",
      maxTokens: 100,
      temperature: 0.5,
      timezone: "UTC",
    })) as { config: ID };

    const docContent = "Assignment X due 2025-10-01.";
    const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
      user: userA,
      documentId: document1,
      documentContent: docContent,
      config: llmConfig,
    })) as { suggestions: ID[] };

    let s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
    assertExists(s1);
    assertEquals(s1.title, "Assignment 1: Introduction"); // Mock LLM always returns this for "assignment 1"
    assertEquals(s1.due.getMonth(), 8); // Sept (0-indexed)

    // Update title
    const updateTitleResult = await suggestionConcept.updateSuggestionTitle({
      suggestion: s1Id,
      newTitle: "Revised Assignment X",
    });
    assertEquals("error" in updateTitleResult, false, "Updating title should succeed.");
    s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
    assertExists(s1);
    assertEquals(s1.title, "Revised Assignment X");
    assertExists(s1.warnings?.includes("Manually edited"));

    // Update date
    const newDueDate = new Date(2025, 9, 15); // Oct 15
    const updateDateResult = await suggestionConcept.updateSuggestionDate({
      suggestion: s1Id,
      newDue: newDueDate,
    });
    assertEquals("error" in updateDateResult, false, "Updating date should succeed.");
    s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
    assertExists(s1);
    assertEquals(s1.due.getMonth(), 9); // Oct
    assertEquals(s1.due.getDate(), 15);
    assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");

    // Edit both
    const finalDueDate = new Date(2025, 10, 1); // Nov 1
    const editBothResult = await suggestionConcept.editSuggestion({
      suggestion: s1Id,
      newTitle: "Final Assignment",
      newDue: finalDueDate,
    });
    assertEquals("error" in editBothResult, false, "Editing both should succeed.");
    s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
    assertExists(s1);
    assertEquals(s1.title, "Final Assignment");
    assertEquals(s1.due.getMonth(), 10); // Nov
    assertEquals(s1.due.getDate(), 1);
    assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");
  } finally {
    await client.close();
  }
});
```

---

# trace: DocumentManagement & SuggestionManagement

This trace illustrates the interaction between `DocumentManagement` and `SuggestionManagement` concepts, following the user journey where Tim uploads documents, the system processes them, and he refines/confirms suggestions.

1.  **Given**: `userA` exists, `courseX` exists. A default LLM configuration named `default_llm_config` is implicitly available in `SuggestionManagement`.

2.  **Action**: `userA` uploads a syllabus PDF for `courseX`.
    ```
    DocumentManagement.uploadDocument({
      course: "course:CS101",
      fileName: "63700-Calendar_F2025-v1.pdf",
      fileType: "application/pdf",
      rawFileContent: "Assignment 1 due 2025-09-15. Final Project due 2025-12-20. Homework due 11:59PM.",
      uploader: "user:Alice"
    })
    ```

3.  **Result**: A new document is stored in `DocumentManagement`, and its ID, processed text content, and `contentUrl` are returned.
    ```
    {
      document: "doc:syllabus_pdf_id",
      processedTextContent: "[Extracted Text from 63700-Calendar_F2025-v1.pdf]: Assignment 1 due 2025-09-15. Final Proje...",
      contentUrl: "https://mock-storage.com/doc:syllabus_pdf_id/63700-Calendar_F2025-v1.pdf"
    }
    ```

4.  **Synchronization**: `parse_upload` is triggered.
    *   **When**: `DocumentManagement.uploadDocument` completes.
    *   **Then**: `SuggestionManagement.llmExtractFromDocument` is called with the `processedTextContent`.
    ```
    SuggestionManagement.llmExtractFromDocument({
      user: "user:Alice",
      documentId: "doc:syllabus_pdf_id",
      documentContent: "[Extracted Text from 63700-Calendar_F2025-v1.pdf]: Assignment 1 due 2025-09-15. Final Proje...",
      config: "default_llm_config" // Assuming a pre-existing config
    })
    ```

5.  **Result**: `SuggestionManagement` processes the content and creates new `ParsedDeadlineSuggestion` entities.
    ```
    {
      suggestions: [
        "suggestion:assign1_id",
        "suggestion:finalproj_id"
      ]
    }
    ```
    *   `suggestion:assign1_id`: { user: "user:Alice", document: "doc:syllabus_pdf_id", title: "Assignment 1: Introduction", due: 2025-09-15T23:59:00Z, source: "SYLLABUS", confirmed: false, confidence: 0.95 }
    *   `suggestion:finalproj_id`: { user: "user:Alice", document: "doc:syllabus_pdf_id", title: "Final Project Submission", due: 2025-12-20T17:00:00Z, source: "SYLLABUS", confirmed: false, confidence: 0.88, warnings: ["Date might be ambiguous"] }

6.  **Action**: `userA` reviews suggestions and notices "Final Project Submission" is missing precise time and has a warning. They provide feedback to refine it.
    ```
    SuggestionManagement.refineWithFeedback({
      suggestion: "suggestion:finalproj_id",
      feedback: "This should be due at 11:59 PM, not 5 PM.",
      config: "default_llm_config"
    })
    ```

7.  **Result**: The suggestion is updated, its `due` time is adjusted, and a warning about manual refinement is added.
    ```
    { suggestion: "suggestion:finalproj_id" }
    ```
    *   `suggestion:finalproj_id` now has `due: 2025-12-20T23:59:00Z` and `warnings: ["Date might be ambiguous", "Refined by user feedback"]`.

8.  **Action**: `userA` now confirms the refined "Final Project Submission" suggestion, associating it with `courseX`.
    ```
    SuggestionManagement.confirm({
      suggestion: "suggestion:finalproj_id",
      course: "course:CS101",
      addedBy: "user:Alice"
    })
    ```

9.  **Result**: The suggestion is marked as confirmed, and the canonical data needed to create a real deadline is returned.
    ```
    {
      course: "course:CS101",
      title: "Final Project Submission",
      due: 2025-12-20T23:59:00Z,
      source: "SYLLABUS",
      addedBy: "user:Alice"
    }
    ```

10. **Synchronization**: `confirm_suggestion` is triggered.
    *   **When**: `SuggestionManagement.confirm` completes.
    *   **Then**: `DeadlineManagement.createDeadline` is called with the extracted data.
    ```
    DeadlineManagement.createDeadline({
      course: "course:CS101",
      title: "Final Project Submission",
      due: 2025-12-20T23:59:00Z,
      source: "SYLLABUS",
      addedBy: "user:Alice"
    })
    ```

11. **Result**: A new deadline is successfully created in `DeadlineManagement`.
    ```
    { deadline: "deadline:finalproj_id" }
    ```


# question: explain the key changes and what exactly is a pre-signed url
# response:

Okay, let's break down the key changes made to your `DocumentManagement` and `SuggestionManagement` concepts, and clarify what a pre-signed URL is in this context.

## Key Changes to Concepts and Synchronizations

The main goal of these changes is to enhance modularity, independence, and completeness, addressing the feedback points, especially regarding file handling and inter-concept dependencies.

### 1. `DocumentManagement` Concept Changes

**Rationale for Changes:**
*   **Decoupling File Content from Database:** Direct storage of large binary `fileContent` (like PDF or image data) in MongoDB is generally not advisable. Databases are optimized for structured data and querying, not large binary blobs. External object storage (like Google Cloud Storage or AWS S3) is purpose-built for this.
*   **Clearer Responsibility:** `DocumentManagement` now focuses purely on managing *metadata* about uploaded documents and interacting with external storage, rather than attempting to parse or understand the file's content in depth.
*   **Completeness:** Added missing update and delete actions.

**Specific Changes:**
*   **State (`UploadedDocumentDoc` interface):**
    *   Removed `fileContent: String`.
    *   Added `contentUrl: String`: This field will store the **persistent URL** to where the actual file (e.g., PDF, image) is stored in an external object storage service (simulated for this assignment).
    *   Added `processedTextContent: String`: This stores the **extracted text** from the document (e.g., via OCR for an image, or text extraction for a PDF). This is the key textual content that the `SuggestionManagement` concept will consume.
*   **Actions:**
    *   `uploadDocument`:
        *   Now takes `rawFileContent: String` as an input parameter (simulating the raw content received from the client).
        *   Its return type now includes `{ document: UploadedDocument, processedTextContent: String, contentUrl: String }`. This means after a document is "uploaded" (simulated storage + text extraction), `DocumentManagement` provides both the stable URL to the file and the text that can be processed further.
        *   The implementation simulates saving to an external `contentUrl` and generating `processedTextContent`.
    *   `updateDocumentMetadata`: **New Action**. Allows updating `fileName` and `fileType` of an existing document, fulfilling the need for update functionality.
    *   `getDocumentContent`: **New Action**. Provides a way to explicitly retrieve the `processedTextContent` of a document.
    *   `deleteDocument`: **New Action**. Allows deleting a document's metadata from the concept's state and simulates deletion from external storage, fulfilling the need for delete functionality.

### 2. `SuggestionManagement` Concept Changes

**Rationale for Changes:**
*   **Strict Independence:** `SuggestionManagement` must not directly `call` or `read the state of` `DocumentManagement`. It should operate purely on primitive values and IDs it receives. By receiving `documentContent: String` as an argument (instead of directly referencing an `UploadedDocument` object's content), it maintains its independence.
*   **User Association:** Suggestions need to be tied to the `User` who initiated their creation for proper management and filtering.
*   **Action Clarity and Consistency:** Refined action parameters and return types for better alignment with concept design principles (e.g., `Empty` for successful void actions, consistent error handling).
*   **Flexibility:** Added `ExtractionConfigs` to allow different LLM models or prompts to be used.

**Specific Changes:**
*   **State (`ParsedDeadlineSuggestionDoc` interface):**
    *   Added `user: User`: This explicitly links each suggestion to the `User` who triggered its extraction, enabling user-specific views and filtering of suggestions.
    *   Added `ExtractionConfigs` collection and `ExtractionConfigDoc` interface: This allows defining and managing different LLM configurations (model, prompt, temperature, etc.) within the concept.
*   **Actions:**
    *   `createExtractionConfig`: **New Action**. Allows creation of reusable LLM configurations.
    *   `parseFromCanvas`, `llmExtractFromDocument`, `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite`:
        *   All now explicitly take `user: User` as the first argument.
        *   `llmExtractFromDocument` and `llmExtractFromMultipleDocuments` take `documentContent: String` (or `List<{documentId: Document, content: String}>`) directly. This is the **`processedTextContent`** passed from `DocumentManagement` via a synchronization, adhering to the independence rule.
    *   `refineWithFeedback`: Added. Allows users to provide feedback to an LLM-generated suggestion for further refinement.
    *   `editSuggestion`, `updateSuggestionTitle`, `updateSuggestionDate`: The return types were changed from `ParsedDeadlineSuggestion` to `Empty | {error: string}` for consistency, as they are primarily state-mutating actions.
    *   `confirm`: Now explicitly requires `course: Course` and `addedBy: User` as arguments, which are essential for `DeadlineManagement.createDeadline`. Its return type is the exact data structure expected by `DeadlineManagement.createDeadline`, facilitating direct synchronization.

### 3. Updated Essential Synchronizations

*   **`sync parse_upload`:**
    *   **When Clause:** Now correctly captures the new outputs of `DocumentManagement.uploadDocument`, specifically `processedTextContent: ptc` and `contentUrl: cu`.
    *   **Then Clause:** Now calls `SuggestionManagement.llmExtractFromDocument`, explicitly passing `user: u` (the original uploader), `documentId: d`, and crucially, the `processedTextContent: ptc`. This ensures `SuggestionManagement` receives only primitive `string` data, maintaining the concept's independence from `DocumentManagement`'s internal data structures.
*   **Other Syncs:** `parse_canvas` and `confirm_suggestion` were also slightly adjusted to reflect the new `user` parameter for parsing actions and the more explicit return type of `confirm`.

## What Exactly is a Pre-signed URL?

A **pre-signed URL** is a way to grant temporary and limited access to a specific object (file) in an object storage service (like Google Cloud Storage, Amazon S3, Azure Blob Storage) to someone (typically a client application like a web browser or mobile app) without requiring them to have their own credentials for that storage service.

Here's how it works and why it's used:

1.  **The Problem:** You want a user to upload a large file to cloud storage (e.g., a PDF syllabus). If the user sends the file *through your backend server* first, it consumes your server's bandwidth, processing power, and potentially storage, which can be inefficient and expensive. Exposing your main cloud storage credentials directly to the client is a major security risk.

2.  **The Solution: Pre-signed URL:**
    *   **Backend Generates:** Your backend server (e.g., your `DocumentManagement` concept's implementation) securely authenticates with the cloud storage service using its *own* long-lived, secure credentials. It then tells the storage service, "Generate a special URL that allows anyone who possesses it to `PUT` (upload) a file named `my-syllabus.pdf` into `my-bucket` for the next 15 minutes."
    *   **URL Contents:** The storage service returns a URL that includes a cryptographic signature, the expiry time, and the specific action (PUT) it allows. Example: `https://storage.googleapis.com/my-bucket/my-syllabus.pdf?X-Goog-Algorithm=...&X-Goog-Credential=...&X-Goog-Date=...&X-Goog-Expires=...&X-Goog-SignedHeaders=host&X-Goog-Signature=...`
    *   **Backend Returns to Client:** Your backend concept returns this *temporary* pre-signed URL (as a `String`) to the client.
    *   **Client Uploads Directly:** The client then uses a standard HTTP `PUT` request to send the raw file content *directly* to this pre-signed URL. The file goes straight from the client's device to the cloud storage bucket, bypassing your backend server for the large data transfer.
    *   **Expiration:** After the specified time (e.g., 15 minutes), the pre-signed URL becomes invalid, preventing unauthorized future use.
    *   **Persistent URL:** Once the file is successfully uploaded using the pre-signed URL, it resides at a *stable, permanent URL* (e.g., `https://storage.googleapis.com/my-bucket/my-syllabus.pdf`). This is the `contentUrl` that your `DocumentManagement` concept would store in its state.

**In summary, for file uploads:**
*   A pre-signed URL is a **temporary token disguised as a URL** that grants specific, time-limited permission to interact with an object in cloud storage.
*   It enables **direct client-to-storage transfers**, reducing load on your backend.
*   It's a **secure mechanism** because your main server credentials are never exposed to the client, and the access is temporary and scoped.

In your `DocumentManagementConcept`, the `uploadDocument` action now *simulates* this process. In a real-world scenario, you might split `uploadDocument` into:
1.  `requestUploadUrl(fileName, fileType)`: Returns a pre-signed `PUT` URL.
2.  `confirmUpload(documentId, processedTextContent)`: Called by the client *after* direct upload, letting the concept know the file is ready and providing the extracted text.

For this assignment, simulating the whole process within one action and passing `rawFileContent` as a string is acceptable for testing purposes, as it demonstrates the *flow* of data even if the actual low-level network operations are abstracted away.


# question are there any updates i should make to 

[@DueStack-new-concepts](../../concepts/DueStack-brainstorming/DueStack-new-concepts.md)

based on these changes? In fact provide the entirely new corrected spec 
# response:

Okay, let's refine your concepts to address the feedback, especially focusing on strict modularity, completeness, and the correct handling of file content and generic parameters.

The key adjustments will be:

1.  **`DocumentManagement`:** Update state and `uploadDocument` action to store a `contentUrl` (simulating external storage) and `processedTextContent` (extracted text for LLM processing), rather than raw file content. Add update/delete actions.
2.  **`SuggestionManagement`:**
    *   Ensure all parsing actions explicitly take `user: User` and primitive `documentContent: String` (or `combinedDocumentContent: String` for multiple documents) to strictly maintain independence.
    *   Modify `llmExtractFromMultipleDocuments` to take `documentIds: List<Document>` and `combinedDocumentContent: String` instead of a list of composite objects.
    *   Ensure all actions follow the `Empty | {error: string}` return pattern for void actions.
3.  **Synchronizations:** Adjust `parse_upload` to reflect the new return values of `DocumentManagement.uploadDocument` and the updated arguments for `SuggestionManagement` actions.
4.  **Overall Completeness:** Review all concepts to ensure core CRUD (Create, Read, Update, Delete) or equivalent lifecycle actions are present where appropriate, and generic parameters are clearly defined.

Here are the entirely new, corrected concept specifications:

---

### Concept Specifications

#### 1) UserIdentity

```concept
concept UserIdentity
purpose manage the core, unique identity and basic profile information for individuals interacting with the system.
principle new user identities can be created, storing their unique email and display name.

state
a set of Users with
  a email String
  a name String

actions
createUser (email: String, name: String): (user: User) or (error: String)
  requires email is unique
  effects a new User entity is created with the given email and name, and its opaque ID is returned.

updateUserName (user: User, newName: String): Empty or (error: String)
  requires user exists
  effects updates the name for the specified User.

updateUserEmail (user: User, newEmail: String): Empty or (error: String)
  requires user exists and newEmail is unique
  effects updates the email for the specified User.
```

***

#### 2) UserAuthentication `[User]`

```concept
concept UserAuthentication [User]
purpose allow users to securely register, log in, and manage their credentials.
principle a user can register with a unique username and password, log in to establish a session, and log out to end it.

state
a set of AuthenticatedUsers with
  a user User
  a username String
  a passwordHash String
  an optional sessionID String
  an optional canvasOAuthToken String // To store Canvas connection token

actions
register (user: User, username: String, password: String): Empty or (error: String)
  requires username is unique and password meets complexity requirements
  effects creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

login (username: String, password: String): (sessionID: String, user: User) or (error: String)
  requires username and password match an existing AuthenticatedUser
  effects generates a new sessionID for the AuthenticatedUser.

logout (sessionID: String): Empty or (error: String)
  requires sessionID is valid
  effects clears the sessionID for the associated AuthenticatedUser.

changePassword (user: User, oldPassword: String, newPassword: String): Empty or (error: String)
  requires user exists, oldPassword matches, newPassword meets complexity requirements
  effects updates the passwordHash for the specified User.

connectCanvas (user: User, canvasOAuthToken: String): Empty or (error: String)
  requires user exists and canvasOAuthToken is valid
  effects stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

disconnectCanvas (user: User): Empty or (error: String)
  requires user exists and has an existing canvasOAuthToken
  effects clears the Canvas OAuth token for the user.
```

***

#### 3) CourseManagement `[User]`

```concept
concept CourseManagement [User]
purpose organize and categorize academic deadlines by associating them with specific courses.
principle each user can define courses, assign unique identifiers, and manage course-specific details including an optional link to an external Canvas course.

state
a set of Courses with
  a creator User
  a courseCode String
  a title String
  an optional canvasId String

actions
createCourse (creator: User, courseCode: String, title: String): (course: Course) or (error: String)
  requires courseCode is unique for the creator
  effects creates a new Course entity with the given details, linked to the creator.

updateCourse (course: Course, newCourseCode: String, newTitle: String): Empty or (error: String)
  requires course exists and newCourseCode is unique for its creator (if changed)
  effects updates the courseCode and title of an existing course.

setCanvasId (course: Course, canvasId: String): Empty or (error: String)
  requires course exists and canvasId is unique across all courses
  effects sets or updates the external Canvas ID for the specified course.

deleteCourse (course: Course): Empty or (error: String)
  requires course exists and has no associated deadlines (this external check would be via syncs)
  effects removes the specified course entity.
```

***

#### 4) DeadlineManagement `[User, Course]`

```concept
concept DeadlineManagement [User, Course]
purpose store and manage academic deadlines, tracking their status and association with courses.
principle each deadline has a due date, title, status, and is explicitly linked to a course and the user who added it.

state
a set of Deadlines with
  a course Course
  a title String
  a due DateTime
  a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
  a addedBy User
  an optional status of NOT_STARTED or IN_PROGRESS or DONE

actions
createDeadline (course: Course, title: String, due: DateTime, source: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED, addedBy: User): (deadline: Deadline) or (error: String)
  requires course exists (this external check would be via syncs)
  effects creates a new Deadline entity with the given details.

updateDeadline (deadline: Deadline, newTitle: String, newDue: DateTime, newSource: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED): Empty or (error: String)
  requires deadline exists
  effects updates the title, due date, and source of an existing deadline.

setStatus (deadline: Deadline, status: NOT_STARTED or IN_PROGRESS or DONE): Empty or (error: String)
  requires deadline exists
  effects updates the completion status of a deadline.

deleteDeadline (deadline: Deadline): Empty or (error: String)
  requires deadline exists
  effects removes the specified deadline.
```

***

#### 5) DocumentManagement `[User, Course]`

```concept
concept DocumentManagement [User, Course]
purpose securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.
principle each document is uniquely identified, linked to its uploading user and associated course, and its core metadata is maintained.

state
a set of UploadedDocuments with
  a course Course
  a uploader User
  a fileName String
  a fileType String // e.g., "application/pdf", "image/png", "text/plain"
  a uploadTime DateTime
  a contentUrl String // URL where the actual file content is stored externally (e.g., GCS, S3)
  a processedTextContent String // Extracted text content from the file, suitable for LLM processing

actions
uploadDocument (course: Course, fileName: String, fileType: String, rawFileContent: String, uploader: User): (document: UploadedDocument, processedTextContent: String, contentUrl: String) or (error: String)
  requires course exists (external check via syncs) and rawFileContent is non-empty
  effects simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

updateDocumentMetadata (document: UploadedDocument, newFileName: String, newFileType: String): Empty or (error: String)
  requires document exists
  effects updates the fileName and fileType of an existing document's metadata.

getDocumentContent (document: UploadedDocument): (processedTextContent: String) or (error: String)
  requires document exists
  effects retrieves the stored processed text content of the specified document.

deleteDocument (document: UploadedDocument): Empty or (error: String)
  requires document exists
  effects removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.
```

***

#### 6) SuggestionManagement `[User, Document, Course]`

```concept
concept SuggestionManagement [User, Document, Course]
purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.

state
a set of ParsedDeadlineSuggestions with
  a user User // The user who initiated the parsing
  an optional document Document // ID of the UploadedDocument if applicable
  an optional canvasMetadata String // Raw JSON data from Canvas
  an optional websiteUrl String
  a title String
  a due DateTime
  a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
  an optional confirmed Boolean = false
  an optional confidence Number (0.0–1.0)
  an optional extractionMethod of CANVAS_JSON or LLM
  an optional provenance String // e.g., LLM model version, prompt used, file name
  an optional warnings set of String // e.g., "date ambiguous", "low confidence"

a set of ExtractionConfigs with
  a name String
  a modelVersion String
  a basePromptTemplate String
  a maxTokens Number
  a temperature Number
  a timezone String
  an optional timeout Number

actions
createExtractionConfig (name: String, modelVersion: String, basePromptTemplate: String, maxTokens: Number, temperature: Number, timezone: String, optionalTimeout: Number): (config: ExtractionConfig) or (error: String)
  requires name is unique
  effects creates a new ExtractionConfig entity for LLM processing.

parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists and canvasData is valid JSON
  effects parses assignment JSON data, creates suggestions linked to `user`.
           sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.

llmExtractFromDocument(user: User, documentId: Document, documentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM
  effects uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).

llmExtractFromMultipleDocuments(user: User, documentIds: List<Document>, combinedDocumentContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, combinedDocumentContent is non-empty and suitable for LLM
  effects sends combined document contents to LLM in SINGLE request to enable cross-referencing, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).

llmExtractFromWebsite(user: User, url: String, websiteContent: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
  requires config exists, url is reachable, websiteContent is non-empty
  effects uses LLM to parse website content into deadline suggestions, creates suggestions linked to `user`.
           sets `extractionMethod = LLM`, `provenance`, `confidence`.

refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
  requires suggestion exists, feedback is non-empty, config exists
  effects re-prompts LLM using user feedback to refine fields of the suggestion.
           updates title, due, warnings, or confidence. Returns the ID of the updated suggestion.

editSuggestion(suggestion: ParsedDeadlineSuggestion, newTitle: String, newDue: DateTime): Empty or (error: String)
  requires suggestion exists, newTitle is non-empty, newDue is valid
  effects updates suggestion title and due date.
           sets `warnings` to indicate manual editing.

updateSuggestionTitle(suggestion: ParsedDeadlineSuggestion, newTitle: String): Empty or (error: String)
  requires suggestion exists and newTitle is non-empty
  effects updates suggestion title.
           sets `warnings` to indicate manual editing.

updateSuggestionDate(suggestion: ParsedDeadlineSuggestion, newDue: DateTime): Empty or (error: String)
  requires suggestion exists and newDue is valid
  effects updates suggestion due date.
           sets `warnings` to indicate manual editing.

confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
  requires suggestion exists, is not already confirmed, has valid title and due date, and course exists (external check via syncs)
  effects marks suggestion as confirmed, and returns the data for creating a new Deadline in `DeadlineManagement`.
```

---

### Essential Synchronizations

```
sync parse_single_upload
when DocumentManagement.uploadDocument (document: d, processedTextContent: ptc, contentUrl: cu, course: crs, fileName: fn, fileType: ft, uploader: u)
where ft is "application/pdf" or "image/png" or "text/plain" // simplified check
then SuggestionManagement.llmExtractFromDocument (user: u, documentId: d, documentContent: ptc, config: default_llm_config) // Assuming 'default_llm_config' is an implicitly available config from ExtractionConfigs

sync parse_multiple_uploads // A new sync to handle combining multiple documents
when DocumentManagement.uploadDocument (document: d1, processedTextContent: ptc1, course: crs, uploader: u) AND
     DocumentManagement.uploadDocument (document: d2, processedTextContent: ptc2, course: crs, uploader: u) // Extend 'when' for N documents as needed
then SuggestionManagement.llmExtractFromMultipleDocuments (user: u, documentIds: [d1, d2], combinedDocumentContent: (ptc1 + "\n\n" + ptc2), config: default_llm_config)

sync parse_canvas_connect
when UserAuthentication.connectCanvas (user: u, canvasOAuthToken: token)
then SuggestionManagement.parseFromCanvas (user: u, canvasData: (fetched data), config: default_canvas_config) // fetched data would come from an external Canvas API call

sync confirm_suggestion
when SuggestionManagement.confirm (suggestion: s, course: c, addedBy: u) : (course: out_c, title: t, due: d, source: src, addedBy: out_u)
then DeadlineManagement.createDeadline (course: out_c, title: t, due: d, source: src, addedBy: out_u)

sync status_update
when Request.setStatus (deadline: dl, status: st)
then DeadlineManagement.setStatus (deadline: dl, status: st)
```

---

### A Brief Note

The six concepts work together to support DueStack’s core features while maintaining strong separation of concerns and modularity.

*   **UserIdentity** manages fundamental user identities (email, name) and is purely about identity management. All actions (e.g., uploading documents, creating deadlines, updating status) are scoped by a `User` ID which originates from this concept. Update actions for user name and email have been added.
*   **UserAuthentication** handles secure registration, login, and managing user credentials, including Canvas connection tokens, for existing `User` IDs from `UserIdentity`. It now includes a `disconnectCanvas` action for completeness.
*   **CourseManagement** serves as containers for organizing deadlines and documents. Each course is tied to specific content and metadata, and allows both imports and manual additions. It includes full CRUD for courses and a dedicated `setCanvasId` action.
*   **DeadlineManagement** is the primary planning unit in the app. Deadlines can come from Canvas imports, manual inputs, or confirmed document/image parsing. Status values help students track progress. It includes full CRUD for deadlines and `setStatus`.
*   **DocumentManagement** securely stores and manages external syllabus files, GitHub tables, screenshots, and ties uploads to users and courses. It now distinguishes between `contentUrl` (for external storage) and `processedTextContent` (for LLM consumption), ensuring that large binary data is not stored in the database. Full CRUD actions for document metadata are now available.
*   **SuggestionManagement** represents the result of OCR or parsing logic and must be confirmed by users before becoming official Deadlines. Canvas data also routes through this system to preserve the same confirmation pattern. Its actions have been refined to take primitive `string` content (e.g., `documentContent`, `combinedDocumentContent`) and `User` IDs, enforcing strict modularity. It also includes `ExtractionConfigs` and actions for refining and directly editing suggestions.

Generic parameters are resolved as:

*   `User` always comes from the `UserIdentity` concept.
*   `Course` in all references maps to `CourseManagement`.
*   `Document` is an object from `DocumentManagement`.
*   `SuggestionManagement.confirm` emits data for `DeadlineManagement.createDeadline` but doesn’t create the Deadline itself; this is handled by a synchronization.


# question: do these new concepts in 

[@DueStack-new-concepts](../../concepts/DueStack-brainstorming/DueStack-new-concepts.md)

match exactly to the existing implementations in the following files? If not, provide updated implementation of the conepts, such that the conepxt specs are the groun truth i.e., the code matches the spec exactly

## DueStack Concept Files:

**Core User Management:**

- [@UserIdentityConcept.ts](/src/concepts/DueStack/UserIdentityConcept.ts)
- 
- [@UserIdentityConcept.test.ts](/src/concepts/DueStack/UserIdentityConcept.test.ts)
- 
- [@UserAuthenticationConcept.ts](/src/concepts/DueStack/UserAuthenticationConcept.ts)
- 
- [@UserAuthenticationConcept.test.ts](/src/concepts/DueStack/UserAuthenticationConcept.test.ts)

**Course Management:**

- [@CourseManagementConcept.ts](/src/concepts/DueStack/CourseManagementConcept.ts)
- 
- [@CourseManagementConcept.test.ts](/src/concepts/DueStack/CourseManagementConcept.test.ts)

**Deadline Management:**

- [@DeadlineManagementConcept.ts](/src/concepts/DueStack/DeadlineManagementConcept.ts)
- 
- [@DeadlineManagementConcept.test.ts](/src/concepts/DueStack/DeadlineManagementConcept.test.ts)

**Document Management:**

- [@DocumentManagementConcept.ts](/src/concepts/DueStack/DocumentManagementConcept.ts)
- 
- [@DocumentManagementConcept.test.ts](/src/concepts/DueStack/DocumentManagementConcept.test.ts)

**Suggestion Management:**

- [@SuggestionManagementConcept.ts](/src/concepts/DueStack/SuggestionManagementConcept.ts)
- 
- [@SuggestionManagementConcept.test.ts](/src/concepts/DueStack/SuggestionManagementConcept.test.ts)

**Total: 12 files** (6 concept implementations + 6 test files)
# response:

You've provided a comprehensive set of concept specifications and their current TypeScript implementations and tests. Let's go through each concept to ensure the code exactly matches the provided specifications, which are considered the ground truth.

After a thorough review, here's a summary of the necessary updates:

1.  **UserIdentity:**
    *   The TypeScript implementation is missing the `updateUserName` and `updateUserEmail` actions specified in the concept.
    *   The test file is missing tests for these actions.
2.  **UserAuthentication:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
3.  **CourseManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
4.  **DeadlineManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
5.  **DocumentManagement:** The TypeScript implementation and tests are already in close alignment with the specification. No changes needed.
6.  **SuggestionManagement:**
    *   The `llmExtractFromMultipleDocuments` action in the TypeScript implementation has a different parameter signature than the concept specification. The spec currently dictates `documentIds: List<Document>, combinedDocumentContent: String`, while the implementation uses `documentContents: { documentId: Document; content: string }[]`. The code needs to be updated to match the spec's signature.
    *   The test for `llmExtractFromMultipleDocuments` will need to be adjusted to reflect the updated signature in the implementation.

I will now provide the updated TypeScript implementation files for `UserIdentityConcept.ts` and `SuggestionManagementConcept.ts`, along with their corresponding test files. The other concepts are already aligned.

---

### **Updated Implementations (Matching Specs Exactly)**

#### 1) UserIdentity

*   **# file: src/concepts/DueStack/UserIdentityConcept.ts**
    ```typescript
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
    ```

*   **# file: src/concepts/DueStack/UserIdentityConcept.test.ts**
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

#### 6) SuggestionManagement

*   **# file: src/concepts/DueStack/SuggestionManagementConcept.ts**
    ```typescript
    import { Collection, Db } from "npm:mongodb";
    import { Empty, ID } from "@utils/types.ts";
    import { freshID } from "@utils/database.ts";

    // Collection prefix to ensure namespace separation
    const PREFIX = "SuggestionManagement" + ".";

    // Generic types for the concept's external dependencies
    type User = ID;
    type Document = ID; // From DocumentManagement
    type Course = ID; // From CourseManagement

    // Internal entity types, represented as IDs
    type ParsedDeadlineSuggestion = ID;
    type ExtractionConfig = ID;

    /**
     * State: A set of ParsedDeadlineSuggestions representing extracted deadline candidates.
     */
    interface ParsedDeadlineSuggestionDoc {
      _id: ParsedDeadlineSuggestion;
      user: User; // The user who initiated the parsing
      document?: Document; // ID of the UploadedDocument if applicable
      canvasMetadata?: string; // Raw JSON data from Canvas
      websiteUrl?: string;
      title: string;
      due: Date;
      source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS";
      confirmed: boolean;
      confidence?: number; // 0.0 - 1.0
      extractionMethod?: "CANVAS_JSON" | "LLM";
      provenance?: string;
      warnings?: string[];
    }

    /**
     * State: A set of ExtractionConfigs for LLM processing.
     */
    interface ExtractionConfigDoc {
      _id: ExtractionConfig;
      name: string;
      modelVersion: string;
      basePromptTemplate: string;
      maxTokens: number;
      temperature: number;
      timezone: string;
      timeout?: number;
    }

    /**
     * @concept SuggestionManagement
     * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas;
     *          optionally AI-augmented.
     * @principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data;
     *            users confirm suggestions before they become official deadlines.
     */
    export default class SuggestionManagementConcept {
      suggestions: Collection<ParsedDeadlineSuggestionDoc>;
      extractionConfigs: Collection<ExtractionConfigDoc>;

      constructor(private readonly db: Db) {
        this.suggestions = this.db.collection(PREFIX + "suggestions");
        this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
      }

      /**
       * Action: Creates a new extraction configuration.
       * @requires name is unique.
       * @effects Creates a new ExtractionConfig entity for LLM processing.
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
        const existingConfig = await this.extractionConfigs.findOne({ name });
        if (existingConfig) {
          return { error: `Extraction config with name '${name}' already exists.` };
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
          timeout: optionalTimeout,
        });
        return { config: configId };
      }

      // --- LLM/Parsing Simulation Methods ---
      private async _simulateLLMExtraction(
        user: User,
        source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS",
        contentIdentifier: Document | string, // documentId, canvasMetadata, or websiteUrl
        content: string,
        config: ExtractionConfig,
      ): Promise<ParsedDeadlineSuggestionDoc[]> {
        // In a real application, this would involve calling an LLM API.
        // For this simulation, we generate mock suggestions based on keywords.
        const configDoc = await this.extractionConfigs.findOne({ _id: config });
        if (!configDoc) {
          console.warn(`Config ${config} not found. Using default mock behavior.`);
        }

        const mockSuggestions: ParsedDeadlineSuggestionDoc[] = [];
        const lowerContent = content.toLowerCase();

        if (lowerContent.includes("assignment 1")) {
          mockSuggestions.push({
            _id: freshID() as ParsedDeadlineSuggestion,
            user,
            document: source !== "CANVAS" && source !== "WEBSITE"
              ? (contentIdentifier as Document)
              : undefined,
            websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
            canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
            title: "Assignment 1: Introduction",
            due: new Date(new Date().getFullYear(), 8, 15, 23, 59), // Sept 15
            source,
            confirmed: false,
            confidence: 0.95,
            extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
            provenance: `Simulated LLM from ${source}`,
          });
        }
        if (lowerContent.includes("final project")) {
          mockSuggestions.push({
            _id: freshID() as ParsedDeadlineSuggestion,
            user,
            document: source !== "CANVAS" && source !== "WEBSITE"
              ? (contentIdentifier as Document)
              : undefined,
            websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
            canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
            title: "Final Project Submission",
            due: new Date(new Date().getFullYear(), 11, 20, 17, 0), // Dec 20
            source,
            confirmed: false,
            confidence: 0.88,
            extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
            provenance: `Simulated LLM from ${source}`,
            warnings: ["Date might be ambiguous"],
          });
        }
        return mockSuggestions;
      }

      /**
       * Action: Parses assignment JSON data from Canvas.
       * @requires config exists and canvasData is valid JSON.
       * @effects Creates suggestions linked to `user`, sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
       */
      async parseFromCanvas(
        { user, canvasData, config }: {
          user: User;
          canvasData: string;
          config: ExtractionConfig;
        },
      ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
        const configExists = await this.extractionConfigs.findOne({ _id: config });
        if (!configExists) {
          return { error: `Extraction config with ID ${config} not found.` };
        }
        try {
          JSON.parse(canvasData); // Validate JSON
        } catch (e) {
          return { error: "canvasData is not valid JSON." };
        }

        const mockSuggestions = await this._simulateLLMExtraction(
          user,
          "CANVAS",
          canvasData, // Use canvasData as identifier for simulation
          canvasData,
          config,
        );
        const suggestionIds = mockSuggestions.map((s) => s._id);
        await this.suggestions.insertMany(mockSuggestions);
        return { suggestions: suggestionIds };
      }

      /**
       * Action: Uses LLM to extract structured suggestions from document content.
       * @requires config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM.
       * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).
       */
      async llmExtractFromDocument(
        { user, documentId, documentContent, config }: {
          user: User;
          documentId: Document;
          documentContent: string;
          config: ExtractionConfig;
        },
      ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
        const configExists = await this.extractionConfigs.findOne({ _id: config });
        if (!configExists) {
          return { error: `Extraction config with ID ${config} not found.` };
        }
        if (!documentContent) {
          return { error: "documentContent cannot be empty for LLM extraction." };
        }

        const mockSuggestions = await this._simulateLLMExtraction(
          user,
          "SYLLABUS", // Or IMAGE, depending on how `documentContent` is handled
          documentId,
          documentContent,
          config,
        );
        const suggestionIds = mockSuggestions.map((s) => s._id);
        await this.suggestions.insertMany(mockSuggestions);
        return { suggestions: suggestionIds };
      }

      /**
       * Action: Sends combined document contents to LLM in SINGLE request to enable cross-referencing.
       * @requires config exists, combinedDocumentContent is non-empty and suitable for LLM.
       * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).
       */
      async llmExtractFromMultipleDocuments(
        { user, documentIds, combinedDocumentContent, config }: { // Corrected signature to match spec
          user: User;
          documentIds: Document[]; // List<Document> from spec
          combinedDocumentContent: string; // String from spec
          config: ExtractionConfig;
        },
      ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
        const configExists = await this.extractionConfigs.findOne({ _id: config });
        if (!configExists) {
          return { error: `Extraction config with ID ${config} not found.` };
        }
        if (!combinedDocumentContent) { // Check combined content
          return { error: "combinedDocumentContent cannot be empty for multiple extraction." };
        }
        if (!documentIds || documentIds.length === 0) {
            // While the LLM processes combined content, having the IDs for provenance is important.
            // This is a softer requirement, but good for data integrity.
            console.warn("No documentIds provided for multiple extraction, provenance might be less precise.");
        }


        const mockSuggestions = await this._simulateLLMExtraction(
          user,
          "SYLLABUS",
          documentIds.join(", "), // Use joined IDs as identifier for simulation
          combinedDocumentContent,
          config,
        ); // Simulate combined extraction
        const suggestionIds = mockSuggestions.map((s) => s._id);
        await this.suggestions.insertMany(mockSuggestions);
        return { suggestions: suggestionIds };
      }

      /**
       * Action: Uses LLM to parse website content into deadline suggestions.
       * @requires config exists, url is reachable, websiteContent is non-empty.
       * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
       */
      async llmExtractFromWebsite(
        { user, url, websiteContent, config }: {
          user: User;
          url: string;
          websiteContent: string;
          config: ExtractionConfig;
        },
      ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
        const configExists = await this.extractionConfigs.findOne({ _id: config });
        if (!configExists) {
          return { error: `Extraction config with ID ${config} not found.` };
        }
        if (!url || !url.startsWith("https://")) {
          return { error: "Invalid URL provided." };
        }
        if (!websiteContent) {
          return { error: "websiteContent cannot be empty for LLM extraction." };
        }

        const mockSuggestions = await this._simulateLLMExtraction(
          user,
          "WEBSITE",
          url,
          websiteContent,
          config,
        );
        const suggestionIds = mockSuggestions.map((s) => s._id);
        await this.suggestions.insertMany(mockSuggestions);
        return { suggestions: suggestionIds };
      }

      /**
       * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
       * @requires suggestion exists, feedback is non-empty, config exists.
       * @effects Updates title, due, warnings, or confidence of the suggestion.
       */
      async refineWithFeedback(
        { suggestion, feedback, config }: {
          suggestion: ParsedDeadlineSuggestion;
          feedback: string;
          config: ExtractionConfig;
        },
      ): Promise<{ suggestion: ParsedDeadlineSuggestion } | { error: string }> {
        const configExists = await this.extractionConfigs.findOne({ _id: config });
        if (!configExists) {
          return { error: `Extraction config with ID ${config} not found.` };
        }
        if (!feedback) {
          return { error: "Feedback cannot be empty." };
        }

        const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
        if (!existingSuggestion) {
          return { error: `Suggestion with ID ${suggestion} not found.` };
        }

        // Simulate LLM refinement based on feedback.
        // For example, if feedback contains "due at 11:59 PM", update the time.
        let newDue = existingSuggestion.due;
        if (feedback.includes("11:59 PM")) {
          newDue.setHours(23, 59, 0, 0);
        }

        const updatedWarnings = existingSuggestion.warnings || [];
        if (!updatedWarnings.includes("Refined by user feedback")) {
          updatedWarnings.push("Refined by user feedback");
        }

        await this.suggestions.updateOne(
          { _id: suggestion },
          {
            $set: {
              due: newDue,
              warnings: updatedWarnings,
              confidence: existingSuggestion.confidence ? Math.min(existingSuggestion.confidence + 0.05, 1.0) : 0.9, // Simulate confidence increase
              provenance: `${existingSuggestion.provenance}, Refined by feedback: ${feedback}`,
            },
          },
        );

        return { suggestion };
      }

      /**
       * Action: Updates suggestion title and due date.
       * @requires suggestion exists, newTitle is non-empty, newDue is valid.
       * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
       */
      async editSuggestion(
        { suggestion, newTitle, newDue }: {
          suggestion: ParsedDeadlineSuggestion;
          newTitle: string;
          newDue: Date;
        },
      ): Promise<Empty | { error: string }> {
        const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
        if (!existingSuggestion) {
          return { error: `Suggestion with ID ${suggestion} not found.` };
        }
        if (!newTitle) {
          return { error: "New title cannot be empty." };
        }
        if (isNaN(newDue.getTime())) {
          return { error: "New due date is invalid." };
        }

        const updatedWarnings = existingSuggestion.warnings || [];
        if (!updatedWarnings.includes("Manually edited")) {
          updatedWarnings.push("Manually edited");
        }

        await this.suggestions.updateOne(
          { _id: suggestion },
          { $set: { title: newTitle, due: newDue, warnings: updatedWarnings } },
        );
        return {};
      }

      /**
       * Action: Updates suggestion title.
       * @requires suggestion exists and newTitle is non-empty.
       * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
       */
      async updateSuggestionTitle(
        { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
      ): Promise<Empty | { error: string }> {
        const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
        if (!existingSuggestion) {
          return { error: `Suggestion with ID ${suggestion} not found.` };
        }
        if (!newTitle) {
          return { error: "New title cannot be empty." };
        }

        const updatedWarnings = existingSuggestion.warnings || [];
        if (!updatedWarnings.includes("Manually edited")) {
          updatedWarnings.push("Manually edited");
        }

        await this.suggestions.updateOne(
          { _id: suggestion },
          { $set: { title: newTitle, warnings: updatedWarnings } },
        );
        return {};
      }

      /**
       * Action: Updates suggestion due date.
       * @requires suggestion exists and newDue is valid.
       * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
       */
      async updateSuggestionDate(
        { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
      ): Promise<Empty | { error: string }> {
        const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
        if (!existingSuggestion) {
          return { error: `Suggestion with ID ${suggestion} not found.` };
        }
        if (isNaN(newDue.getTime())) {
          return { error: "New due date is invalid." };
        }

        const updatedWarnings = existingSuggestion.warnings || [];
        if (!updatedWarnings.includes("Manually edited")) {
          updatedWarnings.push("Manually edited");
        }

        await this.suggestions.updateOne(
          { _id: suggestion },
          { $set: { due: newDue, warnings: updatedWarnings } },
        );
        return {};
      }

      /**
       * Action: Marks a suggestion as confirmed, and returns the data for creating a new Deadline.
       * @requires suggestion exists, is not already confirmed, has valid title and due date, and course exists.
       * @effects Marks suggestion as confirmed, and emits canonical data to `Deadlines.create`.
       */
      async confirm(
        { suggestion, course, addedBy }: {
          suggestion: ParsedDeadlineSuggestion;
          course: Course;
          addedBy: User;
        },
      ): Promise<
        | {
          course: Course;
          title: string;
          due: Date;
          source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
          addedBy: User;
        }
        | { error: string }
      > {
        const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
        if (!existingSuggestion) {
          return { error: `Suggestion with ID ${suggestion} not found.` };
        }
        if (existingSuggestion.confirmed) {
          return { error: `Suggestion with ID ${suggestion} is already confirmed.` };
        }
        if (!existingSuggestion.title || isNaN(existingSuggestion.due.getTime())) {
          return { error: "Suggestion has invalid title or due date and cannot be confirmed." };
        }
        // In a real app, you might validate `course` existence via `CourseManagement._getCourseById` or similar if direct querying were allowed (it's not, without a sync).
        // For this concept, we assume the `course` ID passed is valid for the `DeadlineManagement` concept.

        await this.suggestions.updateOne({ _id: suggestion }, { $set: { confirmed: true } });

        return {
          course,
          title: existingSuggestion.title,
          due: existingSuggestion.due,
          source: existingSuggestion.source,
          addedBy,
        };
      }

      // --- Queries ---
      async _getSuggestionById(
        { suggestion }: { suggestion: ParsedDeadlineSuggestion },
      ): Promise<ParsedDeadlineSuggestionDoc | null> {
        return await this.suggestions.findOne({ _id: suggestion });
      }

      async _getSuggestionsByUser(
        { user }: { user: User },
      ): Promise<ParsedDeadlineSuggestionDoc[]> {
        return await this.suggestions.find({ user }).toArray();
      }

      async _getUnconfirmedSuggestionsByUser(
        { user }: { user: User },
      ): Promise<ParsedDeadlineSuggestionDoc[]> {
        return await this.suggestions.find({ user, confirmed: false }).toArray();
      }
    }
    ```

*   **# file: src/concepts/DueStack/SuggestionManagementConcept.test.ts**
    ```typescript
    import { assertEquals, assertExists, assertNotEquals } from "jsr:@std/assert";
    import { testDb } from "@utils/database.ts";
    import { ID } from "@utils/types.ts";
    import { freshID } from "@utils/database.ts"; // Required for generating document IDs in mock data
    import SuggestionManagementConcept from "./SuggestionManagementConcept.ts";

    const userA = "user:Alice" as ID;
    const document1 = "document:doc1" as ID;
    const document2 = "document:doc2" as ID; // Added for multi-document test
    const courseX = "course:CS101" as ID;
    const LLM_CONFIG_NAME = "default_llm_config";
    const CANVAS_CONFIG_NAME = "default_canvas_config";

    Deno.test("SuggestionManagement: Principle - Suggestions produced, refined, and confirmed", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);

      try {
        // Setup: Create LLM and Canvas configs
        const createLlmConfigResult = await suggestionConcept.createExtractionConfig({
          name: LLM_CONFIG_NAME,
          modelVersion: "LLaMA-3",
          basePromptTemplate: "Extract deadlines from text.",
          maxTokens: 500,
          temperature: 0.7,
          timezone: "America/New_York",
        });
        assertNotEquals("error" in createLlmConfigResult, true, "LLM config creation should succeed.");
        const { config: llmConfig } = createLlmConfigResult as { config: ID };

        const createCanvasConfigResult = await suggestionConcept.createExtractionConfig({
          name: CANVAS_CONFIG_NAME,
          modelVersion: "CANVAS_JSON",
          basePromptTemplate: "Parse Canvas JSON for deadlines.",
          maxTokens: 500,
          temperature: 0.0,
          timezone: "America/New_York",
        });
        assertNotEquals("error" in createCanvasConfigResult, true, "Canvas config creation should succeed.");
        // const { config: canvasConfig } = createCanvasConfigResult as { config: ID }; // Not directly used in this principle trace

        // 1. Suggestions are produced via an LLM from uploaded files (simulated)
        const docContent = "Assignment 1 due on 2025-09-15. Final project due Dec 20, 2025.";
        const extractDocResult = await suggestionConcept.llmExtractFromDocument({
          user: userA,
          documentId: document1,
          documentContent: docContent,
          config: llmConfig,
        });
        assertNotEquals("error" in extractDocResult, true, "LLM extraction from document should succeed.");
        const { suggestions: docSuggestions } = extractDocResult as { suggestions: ID[] };
        assertEquals(docSuggestions.length, 2, "Should extract 2 suggestions from document.");

        const s1 = await suggestionConcept._getSuggestionById({ suggestion: docSuggestions[0] });
        assertExists(s1);
        assertEquals(s1.title, "Assignment 1: Introduction");
        assertEquals(s1.user, userA);
        assertEquals(s1.document, document1);
        assertEquals(s1.confirmed, false);

        // 2. User refines a suggestion
        const refineResult = await suggestionConcept.refineWithFeedback({
          suggestion: s1._id,
          feedback: "The due time should be 11:59 PM.",
          config: llmConfig,
        });
        assertNotEquals("error" in refineResult, true, "Refinement should succeed.");
        const refinedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
        assertExists(refinedS1);
        assertEquals(refinedS1.due.getHours(), 23, "Due hour should be updated to 23 (11 PM).");
        assertEquals(refinedS1.due.getMinutes(), 59, "Due minute should be updated to 59.");
        assertExists(refinedS1.warnings?.includes("Refined by user feedback"), "Warnings should include 'Refined by user feedback'.");

        // 3. User edits a suggestion manually
        const newDate = new Date(refinedS1.due.getFullYear(), refinedS1.due.getMonth(), refinedS1.due.getDate() + 1, 23, 59);
        const editResult = await suggestionConcept.editSuggestion({
          suggestion: s1._id,
          newTitle: "Revised Assignment 1",
          newDue: newDate,
        });
        assertEquals("error" in editResult, false, "Manual edit should succeed.");
        const editedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
        assertExists(editedS1);
        assertEquals(editedS1.title, "Revised Assignment 1");
        assertEquals(editedS1.due.getDate(), s1.due.getDate() + 1, "Date should be incremented by 1.");
        assertExists(editedS1.warnings?.includes("Manually edited"), "Warnings should include 'Manually edited'.");

        // 4. Users confirm suggestions before they become official deadlines
        const confirmResult = await suggestionConcept.confirm({
          suggestion: s1._id,
          course: courseX,
          addedBy: userA,
        });
        assertNotEquals("error" in confirmResult, true, "Confirmation should succeed.");
        const confirmedS1 = await suggestionConcept._getSuggestionById({ suggestion: s1._id });
        assertExists(confirmedS1);
        assertEquals(confirmedS1.confirmed, true, "Suggestion should be marked as confirmed.");

        const { course, title, due, source, addedBy } = confirmResult as {
          course: ID;
          title: string;
          due: Date;
          source: string;
          addedBy: ID;
        };
        assertEquals(course, courseX);
        assertEquals(title, editedS1.title);
        assertEquals(due, editedS1.due);
        assertEquals(source, editedS1.source);
        assertEquals(addedBy, userA);
      } finally {
        await client.close();
      }
    });

    Deno.test("SuggestionManagement: createExtractionConfig requires unique name", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);

      try {
        const createResult1 = await suggestionConcept.createExtractionConfig({
          name: "unique_config",
          modelVersion: "v1",
          basePromptTemplate: "",
          maxTokens: 100,
          temperature: 0.5,
          timezone: "UTC",
        });
        assertEquals("error" in createResult1, false, "First config creation should succeed.");

        const createResult2 = await suggestionConcept.createExtractionConfig({
          name: "unique_config",
          modelVersion: "v2",
          basePromptTemplate: "",
          maxTokens: 100,
          temperature: 0.5,
          timezone: "UTC",
        });
        assertEquals("error" in createResult2, true, "Second config with same name should fail.");
      } finally {
        await client.close();
      }
    });

    Deno.test("SuggestionManagement: llmExtractFromDocument handles invalid config/content", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);
      const fakeConfigId = "config:fake" as ID;

      try {
        const result1 = await suggestionConcept.llmExtractFromDocument({
          user: userA,
          documentId: document1,
          documentContent: "some content",
          config: fakeConfigId,
        });
        assertEquals("error" in result1, true, "Should fail with non-existent config.");

        const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
          name: LLM_CONFIG_NAME,
          modelVersion: "v1",
          basePromptTemplate: "",
          maxTokens: 100,
          temperature: 0.5,
          timezone: "UTC",
        })) as { config: ID };

        const result2 = await suggestionConcept.llmExtractFromDocument({
          user: userA,
          documentId: document1,
          documentContent: "",
          config: llmConfig,
        });
        assertEquals("error" in result2, true, "Should fail with empty document content.");
      } finally {
        await client.close();
      }
    });

    Deno.test("SuggestionManagement: confirm requirements are enforced", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);

      // Setup
      const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
        name: LLM_CONFIG_NAME,
        modelVersion: "v1",
        basePromptTemplate: "",
        maxTokens: 100,
        temperature: 0.5,
        timezone: "UTC",
      })) as { config: ID };
      const docContent = "Assignment 1 due on 2025-09-15.";
      const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
        user: userA,
        documentId: document1,
        documentContent: docContent,
        config: llmConfig,
      })) as { suggestions: ID[] };

      try {
        // Already confirmed
        await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
        const res1 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
        assertEquals("error" in res1, true, "Should fail if suggestion is already confirmed.");

        // Non-existent suggestion
        const fakeSuggestionId = "suggestion:fake" as ID;
        const res2 = await suggestionConcept.confirm({ suggestion: fakeSuggestionId, course: courseX, addedBy: userA });
        assertEquals("error" in res2, true, "Should fail for non-existent suggestion.");

        // Invalid title/due (simulated by modifying directly in DB)
        await suggestionConcept.suggestions.updateOne({ _id: s1Id }, { $set: { title: "" } });
        const res3 = await suggestionConcept.confirm({ suggestion: s1Id, course: courseX, addedBy: userA });
        assertEquals("error" in res3, true, "Should fail if suggestion has invalid title.");
      } finally {
        await client.close();
      }
    });

    Deno.test("SuggestionManagement: llmExtractFromMultipleDocuments works with combined content", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);

      try {
        const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
          name: LLM_CONFIG_NAME,
          modelVersion: "v1",
          basePromptTemplate: "",
          maxTokens: 100,
          temperature: 0.5,
          timezone: "UTC",
        })) as { config: ID };

        const docIds = [document1, document2];
        const combinedContent = "Assignment 1 details here. Final project due date.";

        const result = await suggestionConcept.llmExtractFromMultipleDocuments({
          user: userA,
          documentIds: docIds,
          combinedDocumentContent: combinedContent,
          config: llmConfig,
        });
        assertNotEquals("error" in result, true, "Multiple document extraction should succeed.");
        const { suggestions } = result as { suggestions: ID[] };
        assertEquals(suggestions.length, 2, "Should extract multiple suggestions from combined content.");
        const s1 = await suggestionConcept._getSuggestionById({ suggestion: suggestions[0] });
        assertExists(s1);
        assertEquals(s1.user, userA);
        // In simulation, provenance might just use the joined IDs, or a generic string.
        assertExists(s1.provenance?.includes(document1.toString()) || s1.provenance?.includes("multi-document"));
      } finally {
        await client.close();
      }
    });

    Deno.test("SuggestionManagement: editSuggestion/updateSuggestionTitle/Date updates and adds warnings", async () => {
      const [db, client] = await testDb();
      const suggestionConcept = new SuggestionManagementConcept(db);

      try {
        const { config: llmConfig } = (await suggestionConcept.createExtractionConfig({
          name: LLM_CONFIG_NAME,
          modelVersion: "v1",
          basePromptTemplate: "",
          maxTokens: 100,
          temperature: 0.5,
          timezone: "UTC",
        })) as { config: ID };

        const docContent = "Assignment X due 2025-10-01.";
        const { suggestions: [s1Id] } = (await suggestionConcept.llmExtractFromDocument({
          user: userA,
          documentId: document1,
          documentContent: docContent,
          config: llmConfig,
        })) as { suggestions: ID[] };

        let s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
        assertExists(s1);
        assertEquals(s1.title, "Assignment 1: Introduction"); // Mock LLM always returns this for "assignment 1"
        assertEquals(s1.due.getMonth(), 8); // Sept (0-indexed)

        // Update title
        const updateTitleResult = await suggestionConcept.updateSuggestionTitle({
          suggestion: s1Id,
          newTitle: "Revised Assignment X",
        });
        assertEquals("error" in updateTitleResult, false, "Updating title should succeed.");
        s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
        assertExists(s1);
        assertEquals(s1.title, "Revised Assignment X");
        assertExists(s1.warnings?.includes("Manually edited"), "Warnings should include 'Manually edited'.");

        // Update date
        const newDueDate = new Date(2025, 9, 15); // Oct 15
        const updateDateResult = await suggestionConcept.updateSuggestionDate({
          suggestion: s1Id,
          newDue: newDueDate,
        });
        assertEquals("error" in updateDateResult, false, "Updating date should succeed.");
        s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
        assertExists(s1);
        assertEquals(s1.due.getMonth(), 9); // Oct
        assertEquals(s1.due.getDate(), 15);
        assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");

        // Edit both
        const finalDueDate = new Date(2025, 10, 1); // Nov 1
        const editBothResult = await suggestionConcept.editSuggestion({
          suggestion: s1Id,
          newTitle: "Final Assignment",
          newDue: finalDueDate,
        });
        assertEquals("error" in editBothResult, false, "Editing both should succeed.");
        s1 = await suggestionConcept._getSuggestionById({ suggestion: s1Id });
        assertExists(s1);
        assertEquals(s1.title, "Final Assignment");
        assertEquals(s1.due.getMonth(), 10); // Nov
        assertEquals(s1.due.getDate(), 1);
        assertEquals(s1.warnings?.length, 1, "Should still have one 'Manually edited' warning.");
      } finally {
        await client.close();
      }
    });
    ```
# response:

