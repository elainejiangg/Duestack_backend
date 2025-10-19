
### My Development Journey

I began this assignment with five core concepts, focusing on maintaining their independence and modularity while expanding each to include richer, more relevant actions as per feedback from Assignment 2. As I worked through implementation, I refined and split some of the more complex concepts such that in the end I had six simpler, better-scoped ones that were easier to test, reason about, and maintain.

Early feedback from my initial concept design played an essential role in shaping my approach. Specific comments about authentication, accessibility of state variables, and modularity guided my development choices, helping me systematically strengthen the design throughout the process.

---

## Application-Wide Changes

### Staying True to the Design
The overall application architecture remained faithful to my initial vision. All six concepts were implemented as planned, with enhancements centered around modularity, better abstraction, and improved database handling.

### Key Decisions I Made
1. **MongoDB Integration:** I designed each concept to use MongoDB with clearly defined, concept-specific collection prefixes for separation of concerns.  
2. **Test Database Strategy:** Implementing a `testDb()` function with automatic collection cleanup ensured complete test isolation and consistent results.  
3. **Error Handling:** I introduced robust error handling across all database operations to avoid silent failures.  
4. **Type Safety:** TypeScript’s static checking proved invaluable for preventing subtle bugs early in the development cycle.  
5. **File Storage Architecture:** I revised the DocumentManagement concept to use pre-signed URLs for file uploads, following Piazza guidance. This avoided storing large files directly in MongoDB and improved scalability.

---

## Most Interesting Development Moments

### 1. Import Path Issues
**What happened:** I spent significant time debugging TypeScript errors caused by incorrect import paths in multiple test files.  
**What I learned:** Verify your file structure before trusting automatically generated paths. IDEs like Cursor and Obsidian behave differently, and switching between them revealed the importance of understanding project layout.  
**Resolution:** I corrected all imports to consistent relative paths, ensuring all tests compiled cleanly.

**Relevant files:**
- [UserAuthenticationConcept.test.ts](src/concepts/DueStack/UserAuthenticationConcept.test.ts) - Shows corrected import paths
- [CourseManagementConcept.test.ts](src/concepts/DueStack/CourseManagementConcept.test.ts) - Another example of path corrections

### 2. MongoDB Empty Batch Error
**What happened:** Some SuggestionManagement tests failed with "Invalid BulkOperation: Batch cannot be empty."  
**What I learned:** Defensive programming matters—especially when working with database operations.  
**Resolution:** I added safety checks to prevent `insertMany()` calls with empty arrays, which eliminated the issue.

**Relevant files:**
- [SuggestionManagementConcept.ts](src/concepts/DueStack/SuggestionManagementConcept.ts) - Shows the safety checks added to prevent empty batch operations
- [SuggestionManagementConcept.test.ts](src/concepts/DueStack/SuggestionManagementConcept.test.ts) - Test cases that triggered this issue

### 3. Mock LLM Pattern Matching
**What happened:** My mock LLM tests were failing due to overly strict pattern matching (e.g., expecting "assignment 1" instead of "Assignment X").  
**What I learned:** Flexibility in pattern design improves robustness, especially when working with AI-generated or human-entered data.  
**Resolution:** I replaced exact string matching with partial matches for more realistic testing.

**Relevant files:**
- [SuggestionManagementConcept.ts](src/concepts/DueStack/SuggestionManagementConcept.ts) - Contains the `_simulateLLMExtraction` method with flexible pattern matching
- [SuggestionManagementConcept.test.ts](src/concepts/DueStack/SuggestionManagementConcept.test.ts) - Test cases demonstrating the pattern matching improvements

### 4. MongoDB Atlas Visibility
**What happened:** I was initially confused when only certain collections appeared in MongoDB Atlas.  
**What I learned:** The `testDb()` function resets collections before each test, so only the most recent test's collections persist.  
**Resolution:** I confirmed that this was intended behavior and documented it clearly for future reference.

**Relevant files:**
- [database.ts](src/utils/database.ts) - Contains the `testDb()` and `dropAllCollections()` functions that implement test isolation
- [UserIdentityConcept.test.ts](src/concepts/DueStack/UserIdentityConcept.test.ts) - Example test that demonstrates the isolation behavior

### 5. Concept Naming Conventions
**What happened:** I began using plural names like `Users`, which created inconsistency.  
**What I learned:** Concept names should be singular and functional (e.g., `UserIdentity`) to align with concept-driven design conventions.  
**Resolution:** I renamed all concepts to use singular names while keeping MongoDB collection names plural.

**Relevant files:**
- [UserIdentityConcept.ts](src/concepts/DueStack/UserIdentityConcept.ts) - Shows the final singular naming convention
- [CourseManagementConcept.ts](src/concepts/DueStack/CourseManagementConcept.ts) - Another example of consistent naming

### 6. Keeping Specs and Code in Sync
**What happened:** Some actions were added to specifications but not yet implemented, leading to inconsistencies.  
**What I learned:** Always synchronize specifications and implementations—it's easy to drift when not working incrementally.  
**Resolution:** I developed a habit of updating both together and verifying consistency after every major change.

**Relevant files:**
- [UserIdentityConcept.md](design/concepts/DueStack-specs/UserIdentityConcept.md) - Specification file showing the concept design
- [UserIdentityConcept.ts](src/concepts/DueStack/UserIdentityConcept.ts) - Implementation that matches the specification
- [CourseManagementConcept.md](design/concepts/DueStack-specs/CourseManagementConcept.md) - Another example of spec-implementation alignment

### 7. File Storage Refactor
**What happened:** My first plan was to store PDFs directly in MongoDB. After reading discussions on Piazza, I learned this wasn't ideal.  
**What I learned:** MongoDB should store metadata, not large binary files. Cloud storage with pre-signed URLs is a more scalable pattern.  
**Resolution:** I updated the DocumentManagement concept to store file URLs instead of file contents.

**Relevant files:**
- [DocumentManagementConcept.md](design/concepts/DueStack-specs/DocumentManagementConcept.md) - Updated specification showing pre-signed URL approach
- [DocumentManagementConcept.ts](src/concepts/DueStack/DocumentManagementConcept.ts) - Implementation using URL storage instead of binary data
- [files-in-mongo-piazza-note.md](design/learning/implement-duestack-concepts/files-in-mongo-piazza-note.md) - Piazza discussion that influenced this decision

### 8. Applying Early Feedback
**What happened:** My initial design feedback emphasized missing authentication and modularity improvements.  
**What I learned:** Feedback serves as a development blueprint. Implementing those insights made my system more robust and aligned with good concept practices.  
**Resolution:** I continuously referenced the feedback to refine concepts, actions, and relationships between them.

**Relevant files:**
- [DueStack-initial-feedback.md](design/concepts/DueStack-brainstorming/DueStack-initial-feedback.md) - The original feedback that guided development
- [UserAuthenticationConcept.ts](src/concepts/DueStack/UserAuthenticationConcept.ts) - Implementation addressing authentication concerns
- [UserIdentityConcept.ts](src/concepts/DueStack/UserIdentityConcept.ts) - Shows improved modularity and accessibility
