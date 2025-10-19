---
timestamp: 'Sun Oct 19 2025 01:51:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_015130.b61c6aa4.md]]'
content_id: 412244eb561aebcfc4e44b3d99afb9bb1ba6c6428b7c53e87ccd60b51c1f774b
---

# trace: DocumentManagement & SuggestionManagement

This trace illustrates the interaction between `DocumentManagement` and `SuggestionManagement` concepts, following the user journey where Tim uploads documents, the system processes them, and he refines/confirms suggestions.

1. **Given**: `userA` exists, `courseX` exists. A default LLM configuration named `default_llm_config` is implicitly available in `SuggestionManagement`.

2. **Action**: `userA` uploads a syllabus PDF for `courseX`.
   ```
   DocumentManagement.uploadDocument({
     course: "course:CS101",
     fileName: "63700-Calendar_F2025-v1.pdf",
     fileType: "application/pdf",
     rawFileContent: "Assignment 1 due 2025-09-15. Final Project due 2025-12-20. Homework due 11:59PM.",
     uploader: "user:Alice"
   })
   ```

3. **Result**: A new document is stored in `DocumentManagement`, and its ID, processed text content, and `contentUrl` are returned.
   ```
   {
     document: "doc:syllabus_pdf_id",
     processedTextContent: "[Extracted Text from 63700-Calendar_F2025-v1.pdf]: Assignment 1 due 2025-09-15. Final Proje...",
     contentUrl: "https://mock-storage.com/doc:syllabus_pdf_id/63700-Calendar_F2025-v1.pdf"
   }
   ```

4. **Synchronization**: `parse_upload` is triggered.
   * **When**: `DocumentManagement.uploadDocument` completes.
   * **Then**: `SuggestionManagement.llmExtractFromDocument` is called with the `processedTextContent`.
   ```
   SuggestionManagement.llmExtractFromDocument({
     user: "user:Alice",
     documentId: "doc:syllabus_pdf_id",
     documentContent: "[Extracted Text from 63700-Calendar_F2025-v1.pdf]: Assignment 1 due 2025-09-15. Final Proje...",
     config: "default_llm_config" // Assuming a pre-existing config
   })
   ```

5. **Result**: `SuggestionManagement` processes the content and creates new `ParsedDeadlineSuggestion` entities.
   ```
   {
     suggestions: [
       "suggestion:assign1_id",
       "suggestion:finalproj_id"
     ]
   }
   ```
   * `suggestion:assign1_id`: { user: "user:Alice", document: "doc:syllabus\_pdf\_id", title: "Assignment 1: Introduction", due: 2025-09-15T23:59:00Z, source: "SYLLABUS", confirmed: false, confidence: 0.95 }
   * `suggestion:finalproj_id`: { user: "user:Alice", document: "doc:syllabus\_pdf\_id", title: "Final Project Submission", due: 2025-12-20T17:00:00Z, source: "SYLLABUS", confirmed: false, confidence: 0.88, warnings: \["Date might be ambiguous"] }

6. **Action**: `userA` reviews suggestions and notices "Final Project Submission" is missing precise time and has a warning. They provide feedback to refine it.
   ```
   SuggestionManagement.refineWithFeedback({
     suggestion: "suggestion:finalproj_id",
     feedback: "This should be due at 11:59 PM, not 5 PM.",
     config: "default_llm_config"
   })
   ```

7. **Result**: The suggestion is updated, its `due` time is adjusted, and a warning about manual refinement is added.
   ```
   { suggestion: "suggestion:finalproj_id" }
   ```
   * `suggestion:finalproj_id` now has `due: 2025-12-20T23:59:00Z` and `warnings: ["Date might be ambiguous", "Refined by user feedback"]`.

8. **Action**: `userA` now confirms the refined "Final Project Submission" suggestion, associating it with `courseX`.
   ```
   SuggestionManagement.confirm({
     suggestion: "suggestion:finalproj_id",
     course: "course:CS101",
     addedBy: "user:Alice"
   })
   ```

9. **Result**: The suggestion is marked as confirmed, and the canonical data needed to create a real deadline is returned.
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
    * **When**: `SuggestionManagement.confirm` completes.
    * **Then**: `DeadlineManagement.createDeadline` is called with the extracted data.
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
