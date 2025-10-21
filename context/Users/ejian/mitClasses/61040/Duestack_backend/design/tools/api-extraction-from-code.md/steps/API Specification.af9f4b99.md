---
timestamp: 'Tue Oct 21 2025 10:55:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_105536.b8a66f77.md]]'
content_id: af9f4b99e2966201e9f41cb5acd0a4643c8b9521936a97a8b611b716a0ef56ce
---

# API Specification: DocumentManagement Concept

**Purpose:** securely store and manage various uploaded materials (e.g., syllabi, screenshots) and associate them with specific courses and users.

***

## API Endpoints

### POST /api/DocumentManagement/uploadDocument

**Description:** Simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

**Requirements:**

* course exists (external check via syncs) and rawFileContent is non-empty

**Effects:**

* simulates storing the rawFileContent in external storage, records its contentUrl and metadata. Simulates text extraction. Returns document ID, extracted text content, and contentUrl for further processing by other concepts (via syncs).

**Request Body:**

```json
{
  "course": "string",
  "fileName": "string",
  "fileType": "string",
  "rawFileContent": "string",
  "uploader": "string"
}
```

**Success Response Body (Action):**

```json
{
  "document": "string",
  "processedTextContent": "string",
  "contentUrl": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DocumentManagement/updateDocumentMetadata

**Description:** Updates the fileName and fileType of an existing document's metadata.

**Requirements:**

* document exists

**Effects:**

* updates the fileName and fileType of an existing document's metadata.

**Request Body:**

```json
{
  "document": "string",
  "newFileName": "string",
  "newFileType": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DocumentManagement/getDocumentContent

**Description:** Retrieves the stored processed text content of the specified document.

**Requirements:**

* document exists

**Effects:**

* retrieves the stored processed text content of the specified document.

**Request Body:**

```json
{
  "document": "string"
}
```

**Success Response Body (Action):**

```json
{
  "processedTextContent": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/DocumentManagement/deleteDocument

**Description:** Removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.

**Requirements:**

* document exists

**Effects:**

* removes the specified document's metadata from the concept state and simulates deletion of its content from external storage.

**Request Body:**

```json
{
  "document": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
