# Concept Design

  

> Design a set of concepts that will embody the functionality of your app and deliver its features. We expect you to have 3–5 concepts. Fewer than 3 concepts would probably mean limited functionality or a lack of separation of concerns; more than 5 likely suggests overambition or lack of focus.


  

### Concept Specifications


#### Users

```
concept Users
purpose represent authenticated users of the system
principle each user can add, track, and update deadlines

state

a set of Users with

a email String

a name String

actions

createUser (email, name: String): (user: User)

effect adds a new user with given info

```

  

---

  

#### Courses

```

concept Courses

purpose represent academic courses for organizing deadlines

principle each deadline belongs to exactly one course

state

a set of Courses with

a courseCode String

a title String

a optional canvasId String

actions

createCourse (courseCode, title: String): (course: Course)

effect creates a new course

```

  

---

  

#### Deadlines

```

concept Deadlines

purpose store and manage deadlines across courses

principle each deadline has a due date, title, and status

state

a set of Deadlines with

a Course

a title String

a due DateTime

a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE

a addedBy User

a optional status of NOT_STARTED or IN_PROGRESS or DONE

actions

create (course: Course, title: String, due: DateTime, source: SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE, addedBy: User): (deadline: Deadline)

effect creates a new deadline

setStatus (deadline: Deadline, status: NOT_STARTED or IN_PROGRESS or DONE)

effect updates status of a deadline

```

  

---

  

#### UploadedDocuments

```

concept UploadedDocuments

purpose hold uploaded syllabi, screenshots, or external sources

principle each document is associated with a course

state

a set of UploadedDocuments with

a Course

a uploader User

a fileName String

a uploadTime DateTime

actions

upload (course: Course, file: String, uploader: User): (document: UploadedDocument)

effect uploads a file and returns the document object

```

  

---

  

#### ParsedDeadlineSuggestions

```

concept ParsedDeadlineSuggestions

purpose represent auto-parsed deadlines from uploaded materials or Canvas

principle each suggestion comes from a document or Canvas and can be confirmed into a real deadline

state

a set of ParsedDeadlineSuggestions with

an optional UploadedDocument

a optional canvasMetadata String

a title String

a due DateTime

a source of SYLLABUS or IMAGE or CANVAS

a optional confirmed Flag

actions

parseFromDocument (document: UploadedDocument)

effect parses the document and creates suggestions

parseFromCanvas (user: User)

effect parses fetched Canvas data and creates suggestions

confirm (suggestion: ParsedDeadlineSuggestion): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or CANVAS, addedBy: User)

effect marks a suggestion as confirmed and extracts data for a real deadline

```

  

---

  

### Essential Synchronizations

  

```

sync parse_upload

when UploadedDocuments.upload (course, file, uploader)

where file is .pdf or image or structured text

then ParsedDeadlineSuggestions.parseFromDocument (document)

  

sync parse_canvas

when Users.connectCanvas (user)

where canvas OAuth is valid

then ParsedDeadlineSuggestions.parseFromCanvas (user)

  

sync confirm_suggestion

when ParsedDeadlineSuggestions.confirm (suggestion)

then Deadlines.create (course, title, due, source, addedBy)

  

sync status_update

when Request.setStatus (deadline, status)

then Deadlines.setStatus (deadline, status)

```

  

---

  

### A Brief Note

  
The five concepts work together to support DueStack’s core features while maintaining strong separation of concerns and modularity.

- **Users** represent authenticated individuals using the app. All actions (e.g., uploading documents, creating deadlines, updating status) are scoped by user identity.

- **Courses** serve as containers for organizing deadlines and documents. Each course is tied to specific content and metadata, and allows both imports and manual additions.

- **Deadlines** are the primary planning unit in the app. Deadlines can come from Canvas imports, manual inputs, or confirmed document/image parsing. Status values help students track progress.

- **UploadedDocuments** manage external syllabus files, GitHub tables, screenshots, and tie uploads to users and courses.

- **ParsedDeadlineSuggestions** serve as the result of OCR or parsing logic and must be confirmed by users before becoming official Deadlines. Canvas data also routes through this system to preserve the same confirmation pattern.

  

Generic parameters are resolved as:

- `User` always comes from the Users concept.

- `Course` in all references maps to Courses.

- `UploadedDocument` is an object from UploadedDocuments.

- `ParsedDeadlineSuggestions.confirm` emits data for `Deadlines.create` but doesn’t create the Deadline itself.

  

---