```running 6 tests from ./src/concepts/DueStack/DocumentManagementConcept.test.ts
DocumentManagement: Principle - User uploads document, metadata is stored, and content is retrievable ...
------- post-test output -------
Simulating deletion of content for document 0199fb32-1595-71ed-a108-908956386cbf
----- post-test output end -----
DocumentManagement: Principle - User uploads document, metadata is stored, and content is retrievable ... ok (707ms)
DocumentManagement: uploadDocument requires rawFileContent to be non-empty ... ok (556ms)
DocumentManagement: updateDocumentMetadata fails for non-existent document ... ok (516ms)
DocumentManagement: getDocumentContent fails for non-existent document ... ok (449ms)
DocumentManagement: deleteDocument fails for non-existent document ... ok (399ms)
DocumentManagement: Multiple documents for different users/courses ... ok (580ms)
```