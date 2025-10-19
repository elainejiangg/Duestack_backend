```
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
