---
timestamp: 'Sun Oct 19 2025 20:43:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_204349.106d38ea.md]]'
content_id: 7f30535377318ba99775e27127d431c0564a8ad867e8c0306b26411a4719ca0b
---

# file: src/concepts/DueStack/DocumentManagementConcept.ts

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
