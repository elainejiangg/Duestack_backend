---
timestamp: 'Sun Oct 19 2025 01:33:58 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_013358.d4aa73cb.md]]'
content_id: 1da69759268f4194987174f90eb5937f2a3f6efff32afe8fa33af235bc66ca3d
---

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
