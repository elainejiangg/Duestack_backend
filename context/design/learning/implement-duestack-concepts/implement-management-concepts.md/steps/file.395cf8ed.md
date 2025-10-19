---
timestamp: 'Sun Oct 19 2025 01:47:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_014740.c646bcf3.md]]'
content_id: 395cf8edcafdd95b104613971bbde141a904a79fcbbdd7cdb5d13fb92ca5e28b
---

# file: src/suggestionmanagement/SuggestionManagementConcept.test.ts

```typescript
import { assertEquals, assertExists, assertNotEquals, assertStrictEquals, assertInstanceOf } from "jsr:@std/assert";
import { testDb } from "@utils/database.ts";
import { ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Import dependent concepts for test setup
import UserIdentityConcept from "../useridentity/UserIdentityConcept.ts";
import CourseManagementConcept from "../coursemanagement/CourseManagementConcept.ts";
import DocumentManagementConcept from "../documentmanagement/DocumentManagementConcept.ts";

import SuggestionManagementConcept from "./SuggestionManagementConcept.ts";

// Test Data
const TEST_USER_EMAIL = "tim@mit.edu";
const TEST_USER_NAME = "Tim Smith";
const TEST_COURSE_CODE = "6.1040";
const TEST_COURSE_TITLE = "Software Design and Development";
const TEST_DOC_FILENAME = "schedule.pdf";
const TEST_DOC_FILETYPE = "application/pdf";
const TEST_DOC_CONTENT = "This document contains a deadline for Assignment 4: Backend MVP on 2025-10-12.";
const TEST_WEBSITE_URL = "https://61040-fa25.github.io/schedule";
const TEST_WEBSITE_CONTENT = `<html><body><table><tr><td>Assignment 1</td><td>September 7</td></tr><tr><td>Assignment 4: Backend MVP</td><td>October 12</td></tr></table></body></html>`;

const TEST_CONFIG_NAME_LLM = "default-llm-config";
const TEST_CONFIG_MODEL_LLM = "gemini-pro";
const TEST_CONFIG_PROMPT_LLM = "Extract deadlines";
const TEST_CONFIG_TIMEZONE_LLM = "America/New_York";

const TEST_CANVAS_DATA = JSON.stringify([
  { "title": "Canvas Midterm", "due": "2025-11-15T14:00:00Z" },
  { "title": "Canvas Final Project", "due": "2025-12-10T23:59:00Z" },
]);

Deno.test("Principle: Suggestions are produced via LLM from documents/web/Canvas, users refine, then confirm.", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const suggestionManagementConcept = new SuggestionManagementConcept(db);

  try {
    // Setup: Create a User and a Course (external generic parameters)
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    assertExists(userId);
    assertExists(courseId);

    // Create an LLM extraction config
    const createConfigResult = await suggestionManagementConcept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 1000,
      temperature: 0.5,
      timezone: TEST_CONFIG_TIMEZONE_LLM,
    });
    assertEquals("error" in createConfigResult, false, `Config creation failed: ${JSON.stringify(createConfigResult)}`);
    const { config: llmConfigId } = createConfigResult as { config: ID };
    assertExists(llmConfigId);

    // 1. Suggestions are produced via LLM from uploaded files
    const uploadDocResult = await documentManagementConcept.uploadDocument({
      course: courseId,
      fileName: TEST_DOC_FILENAME,
      fileType: TEST_DOC_FILETYPE,
      fileContent: TEST_DOC_CONTENT,
      uploader: userId,
    });
    assertEquals("error" in uploadDocResult, false, `Document upload failed: ${JSON.stringify(uploadDocResult)}`);
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const extractResult = await suggestionManagementConcept.llmExtractFromDocument({
      user: userId,
      documentId: docId,
      documentContent: TEST_DOC_CONTENT,
      config: llmConfigId,
    });
    assertEquals("error" in extractResult, false, `LLM extraction from document failed: ${JSON.stringify(extractResult)}`);
    const { suggestions: initialSuggestions } = extractResult as { suggestions: any[] };
    assertEquals(initialSuggestions.length, 1, "Should extract one suggestion from document.");
    let suggestion1 = initialSuggestions[0];
    assertEquals(suggestion1.title.includes("LLM Extracted Task"), true);
    assertEquals(suggestion1.confirmed, false);
    assertEquals(suggestion1.extractionMethod, "LLM");

    // 2. Users refine suggestions (manual edit for date)
    const oldDueDate = suggestion1.due;
    const newDueDate = new Date(oldDueDate.getTime() + 24 * 60 * 60 * 1000); // Shift by 1 day
    const editResult = await suggestionManagementConcept.editSuggestion({
      suggestion: suggestion1._id,
      newTitle: suggestion1.title,
      newDue: newDueDate,
    });
    assertEquals("error" in editResult, false, `Editing suggestion failed: ${JSON.stringify(editResult)}`);
    suggestion1 = (editResult as { suggestion: any }).suggestion; // Update suggestion object
    assertEquals(suggestion1.due, newDueDate, "Suggestion due date should be updated.");
    assertEquals(suggestion1.warnings?.includes("manually edited"), true, "Suggestion should have 'manually edited' warning.");

    // 3. Users confirm suggestions before they become official deadlines
    const confirmResult = await suggestionManagementConcept.confirm({
      suggestion: suggestion1._id,
      course: courseId,
      addedBy: userId,
    });
    assertEquals("error" in confirmResult, false, `Confirming suggestion failed: ${JSON.stringify(confirmResult)}`);
    const { title, due, source, addedBy } = confirmResult as { course: ID; title: string; due: Date; source: string; addedBy: ID };

    assertEquals(title, suggestion1.title, "Confirmed title should match.");
    assertEquals(due, suggestion1.due, "Confirmed due date should match.");
    assertEquals(source, suggestion1.source, "Confirmed source should match.");
    assertStrictEquals(addedBy, userId, "Confirmed addedBy user should match.");

    const confirmedSuggestion = await suggestionManagementConcept._getSuggestionById({ suggestionId: suggestion1._id });
    assertEquals(confirmedSuggestion?.confirmed, true, "Suggestion should be marked as confirmed.");

    const allSuggestions = await suggestionManagementConcept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 1, "There should still be one suggestion for the user, now confirmed.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: createExtractionConfig - enforces unique names and validates input", async () => {
  const [db, client] = await testDb();
  const concept = new SuggestionManagementConcept(db);

  try {
    // Valid creation
    const result1 = await concept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result1, false, "Valid config creation should succeed.");
    const { config: configId } = result1 as { config: ID };
    assertExists(configId);

    // Duplicate name
    const result2 = await concept.createExtractionConfig({
      name: TEST_CONFIG_NAME_LLM,
      modelVersion: "v2",
      basePromptTemplate: "another prompt",
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result2, true, "Creating config with duplicate name should fail.");
    assertEquals((result2 as { error: string }).error, `ExtractionConfig with name '${TEST_CONFIG_NAME_LLM}' already exists.`);

    // Empty name
    const result3 = await concept.createExtractionConfig({
      name: " ",
      modelVersion: TEST_CONFIG_MODEL_LLM,
      basePromptTemplate: TEST_CONFIG_PROMPT_LLM,
      maxTokens: 500,
      temperature: 0.7,
      timezone: "UTC",
    });
    assertEquals("error" in result3, true, "Creating config with empty name should fail.");
    assertEquals((result3 as { error: string }).error, "Configuration name cannot be empty.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: parseFromCanvas - creates suggestions from valid JSON and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: "canvas-config", modelVersion: "v1", basePromptTemplate: "", maxTokens: 100, temperature: 0, timezone: "UTC" });
    const { config: canvasConfigId } = createConfigResult as { config: ID };

    // Valid parsing
    const parseResult = await concept.parseFromCanvas({ user: userId, canvasData: TEST_CANVAS_DATA, config: canvasConfigId });
    assertEquals("error" in parseResult, false, "Parsing valid Canvas data should succeed.");
    const { suggestions } = parseResult as { suggestions: any[] };
    assertEquals(suggestions.length, 2, "Should create two suggestions.");
    assertEquals(suggestions[0].title, "Canvas Midterm");
    assertEquals(suggestions[0].source, "CANVAS");
    assertEquals(suggestions[0].extractionMethod, "CANVAS_JSON");
    assertInstanceOf(suggestions[0].due, Date);

    // Non-existent config
    const nonExistentConfigId = freshID() as ID;
    const nonExistentConfigResult = await concept.parseFromCanvas({ user: userId, canvasData: TEST_CANVAS_DATA, config: nonExistentConfigId });
    assertEquals("error" in nonExistentConfigResult, true, "Parsing with non-existent config should fail.");
    assertEquals((nonExistentConfigResult as { error: string }).error, `ExtractionConfig with ID ${nonExistentConfigId} not found.`);

    // Empty canvasData
    const emptyDataResult = await concept.parseFromCanvas({ user: userId, canvasData: " ", config: canvasConfigId });
    assertEquals("error" in emptyDataResult, true, "Parsing with empty Canvas data should fail.");
    assertEquals((emptyDataResult as { error: string }).error, "Canvas data cannot be empty.");

    // Invalid canvasData JSON
    const invalidJsonResult = await concept.parseFromCanvas({ user: userId, canvasData: "{bad json", config: canvasConfigId });
    assertEquals("error" in invalidJsonResult, true, "Parsing with invalid JSON should fail.");

    const allSuggestions = await concept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 2, "Only two valid suggestions should be present.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromDocument - creates suggestions and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db); // Needed for docId, though content is passed directly
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: TEST_DOC_CONTENT, uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Valid extraction
    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: TEST_DOC_CONTENT, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one suggestion.");
    assertEquals(suggestions[0].document, docId);
    assertEquals(suggestions[0].extractionMethod, "LLM");
    assertEquals(suggestions[0].confidence! > 0, true);

    // Non-existent config
    const nonExistentConfigId = freshID() as ID;
    const nonExistentConfigResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: TEST_DOC_CONTENT, config: nonExistentConfigId });
    assertEquals("error" in nonExistentConfigResult, true, "Extraction with non-existent config should fail.");

    // Empty document content
    const emptyContentResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: " ", config: llmConfigId });
    assertEquals("error" in emptyContentResult, true, "Extraction with empty content should fail.");

    // Missing documentId
    const missingDocIdResult = await concept.llmExtractFromDocument({ user: userId, documentId: undefined as any, documentContent: TEST_DOC_CONTENT, config: llmConfigId });
    assertEquals("error" in missingDocIdResult, true, "Extraction with missing documentId should fail.");

    const allSuggestions = await concept._getSuggestionsByUser({ userId });
    assertEquals(allSuggestions.length, 1, "Only one valid suggestion should be present.");
  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromMultipleDocuments - creates suggestions with cross-referencing logic", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Upload two documents
    const uploadDoc1Result = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "doc1.txt", fileType: "text/plain", fileContent: "First document has a deadline.", uploader: userId });
    const { document: docId1 } = uploadDoc1Result as { document: ID; content: string };
    const uploadDoc2Result = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "doc2.txt", fileType: "text/plain", fileContent: "Second document, also talking about deadlines.", uploader: userId });
    const { document: docId2 } = uploadDoc2Result as { document: ID; content: string };

    const documentsToParse = [
      { documentId: docId1, documentContent: "First document has a deadline." },
      { documentId: docId2, documentContent: "Second document, also talking about deadlines." },
    ];

    // Valid extraction from multiple documents
    const extractResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: documentsToParse, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction from multiple documents should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one combined suggestion.");
    assertEquals(suggestions[0].title, "Combined Multi-Document Deadline");
    assertEquals(suggestions[0].provenance?.includes(docId1.toString()), true);
    assertEquals(suggestions[0].provenance?.includes(docId2.toString()), true);

    // No documents
    const noDocsResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: [], config: llmConfigId });
    assertEquals("error" in noDocsResult, true, "Extraction with no documents should fail.");

    // Document with empty content
    const emptyContentDocResult = await concept.llmExtractFromMultipleDocuments({ user: userId, documents: [{ documentId: docId1, documentContent: "" }], config: llmConfigId });
    assertEquals("error" in emptyContentDocResult, true, "Extraction with empty document content should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: llmExtractFromWebsite - creates suggestions from website content and handles errors", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    // Valid extraction
    const extractResult = await concept.llmExtractFromWebsite({ user: userId, url: TEST_WEBSITE_URL, websiteContent: TEST_WEBSITE_CONTENT, config: llmConfigId });
    assertEquals("error" in extractResult, false, "LLM extraction from website should succeed.");
    const { suggestions } = extractResult as { suggestions: any[] };
    assertEquals(suggestions.length, 1, "Should create one suggestion from website.");
    assertEquals(suggestions[0].websiteUrl, TEST_WEBSITE_URL);
    assertEquals(suggestions[0].title.includes("Web Assignment"), true);
    assertEquals(suggestions[0].source, "WEBSITE");

    // Invalid URL
    const invalidUrlResult = await concept.llmExtractFromWebsite({ user: userId, url: "http://bad.com", websiteContent: TEST_WEBSITE_CONTENT, config: llmConfigId });
    assertEquals("error" in invalidUrlResult, true, "Extraction with non-HTTPS URL should fail.");

    // Empty content
    const emptyContentResult = await concept.llmExtractFromWebsite({ user: userId, url: TEST_WEBSITE_URL, websiteContent: " ", config: llmConfigId });
    assertEquals("error" in emptyContentResult, true, "Extraction with empty website content should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: refineWithFeedback - updates suggestion based on feedback", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: "A test assignment.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A test assignment due tomorrow.", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    const initialDue = suggestion.due;
    const initialConfidence = suggestion.confidence;

    // Refine with feedback about date
    const refineResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: "The date is off by one day.", config: llmConfigId });
    assertEquals("error" in refineResult, false, "Refinement should succeed.");
    suggestion = (refineResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.due.getTime(), initialDue.getTime() + 24 * 60 * 60 * 1000, "Due date should shift.");
    assertEquals(suggestion.warnings?.includes("date refined by LLM"), true);
    assertEquals(suggestion.confidence! > initialConfidence!, true, "Confidence should increase.");

    // Refine with feedback about title
    const refineTitleResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: "This title is wrong.", config: llmConfigId });
    assertEquals("error" in refineTitleResult, false, "Refinement should succeed.");
    suggestion = (refineTitleResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title.includes("(Refined)"), true, "Title should be refined.");
    assertEquals(suggestion.warnings?.includes("title refined by LLM"), true);

    // Non-existent suggestion
    const nonExistentRefineResult = await concept.refineWithFeedback({ suggestion: freshID() as ID, feedback: "feedback", config: llmConfigId });
    assertEquals("error" in nonExistentRefineResult, true, "Refining non-existent suggestion should fail.");

    // Empty feedback
    const emptyFeedbackResult = await concept.refineWithFeedback({ suggestion: suggestion._id, feedback: " ", config: llmConfigId });
    assertEquals("error" in emptyFeedbackResult, true, "Refining with empty feedback should fail.");

  } finally {
    await client.close();
  }
});

Deno.test("Action: editSuggestion, updateSuggestionTitle, updateSuggestionDate - manually edit suggestions", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "test/plain", fileContent: "A test assignment.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A test assignment due tomorrow.", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    const originalTitle = suggestion.title;
    const originalDue = suggestion.due;

    // editSuggestion
    const newTitle = "Manually Edited Title";
    const newDue = new Date(originalDue.getTime() + 5 * 24 * 60 * 60 * 1000);
    const editResult = await concept.editSuggestion({ suggestion: suggestion._id, newTitle, newDue });
    assertEquals("error" in editResult, false, "editSuggestion should succeed.");
    suggestion = (editResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, newTitle);
    assertEquals(suggestion.due, newDue);
    assertEquals(suggestion.warnings?.includes("manually edited"), true);

    // updateSuggestionTitle
    const updatedTitle = "Only Title Updated";
    const updateTitleResult = await concept.updateSuggestionTitle({ suggestion: suggestion._id, newTitle: updatedTitle });
    assertEquals("error" in updateTitleResult, false, "updateSuggestionTitle should succeed.");
    suggestion = (updateTitleResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, updatedTitle);
    assertEquals(suggestion.due, newDue); // Due date should be unchanged
    assertEquals(suggestion.warnings?.includes("manually edited"), true); // Warning should persist

    // updateSuggestionDate
    const updatedDue = new Date(newDue.getTime() + 10 * 24 * 60 * 60 * 1000);
    const updateDateResult = await concept.updateSuggestionDate({ suggestion: suggestion._id, newDue: updatedDue });
    assertEquals("error" in updateDateResult, false, "updateSuggestionDate should succeed.");
    suggestion = (updateDateResult as { suggestion: any }).suggestion;
    assertEquals(suggestion.title, updatedTitle); // Title should be unchanged
    assertEquals(suggestion.due, updatedDue);
    assertEquals(suggestion.warnings?.includes("manually edited"), true);

  } finally {
    await client.close();
  }
});

Deno.test("Action: confirm - marks suggestion as confirmed and returns deadline data", async () => {
  const [db, client] = await testDb();
  const userIdentityConcept = new UserIdentityConcept(db);
  const courseManagementConcept = new CourseManagementConcept(db);
  const documentManagementConcept = new DocumentManagementConcept(db);
  const concept = new SuggestionManagementConcept(db);

  try {
    const createUserResult = await userIdentityConcept.createUser({ email: TEST_USER_EMAIL, name: TEST_USER_NAME });
    const { user: userId } = createUserResult as { user: ID };
    const createCourseResult = await courseManagementConcept.createCourse({ creator: userId, courseCode: TEST_COURSE_CODE, title: TEST_COURSE_TITLE });
    const { course: courseId } = createCourseResult as { course: ID };
    const uploadDocResult = await documentManagementConcept.uploadDocument({ course: courseId, fileName: "test.txt", fileType: "text/plain", fileContent: "A valid deadline.", uploader: userId });
    const { document: docId } = uploadDocResult as { document: ID; content: string };

    const createConfigResult = await concept.createExtractionConfig({ name: TEST_CONFIG_NAME_LLM, modelVersion: TEST_CONFIG_MODEL_LLM, basePromptTemplate: TEST_CONFIG_PROMPT_LLM, maxTokens: 1000, temperature: 0.5, timezone: TEST_CONFIG_TIMEZONE_LLM });
    const { config: llmConfigId } = createConfigResult as { config: ID };

    const extractResult = await concept.llmExtractFromDocument({ user: userId, documentId: docId, documentContent: "A valid deadline title and due date 2025-10-20T23:59:00Z", config: llmConfigId });
    const { suggestions } = extractResult as { suggestions: any[] };
    let suggestion = suggestions[0];
    suggestion.title = "Final Confirmed Assignment"; // Ensure valid title
    suggestion.due = new Date("2025-10-20T23:59:00Z"); // Ensure valid date
    await concept.editSuggestion({suggestion: suggestion._id, newTitle: suggestion.title, newDue: suggestion.due});


    // Successfully confirm
    const confirmResult = await concept.confirm({ suggestion: suggestion._id, course: courseId, addedBy: userId });
    assertEquals("error" in confirmResult, false, "Confirmation should succeed.");
    const { title, due, source } = confirmResult as { course: ID; title: string; due: Date; source: string; addedBy: ID };
    assertExists(title);
    assertExists(due);
    assertExists(source);
    assertEquals(title, suggestion.title);
    assertEquals(due, suggestion.due);
    assertEquals(source, suggestion.source);

    const confirmedSuggestion = await concept._getSuggestionById({ suggestionId: suggestion._id });
    assertEquals(confirmedSuggestion?.confirmed, true, "Suggestion should be marked as confirmed.");

    // Already confirmed
    const alreadyConfirmedResult = await concept.confirm({ suggestion: suggestion._id, course: courseId, addedBy: userId });
    assertEquals("error" in alreadyConfirmedResult, true, "Confirming an already confirmed suggestion should fail.");
    assertEquals((alreadyConfirmedResult as { error: string }).error, `ParsedDeadlineSuggestion with ID ${suggestion._id} is already confirmed.`);

    // Non-existent suggestion
    const nonExistentConfirmResult = await concept.confirm({ suggestion: freshID() as ID, course: courseId, addedBy: userId });
    assertEquals("error" in nonExistentConfirmResult, true, "Confirming non-existent suggestion should fail.");

    // Suggestion with empty title or invalid date (need to create one specifically to test this)
    const malformedSuggestionId = freshID() as ID;
    await concept.parsedDeadlineSuggestions.insertOne({ // Directly insert a malformed suggestion
      _id: malformedSuggestionId,
      user: userId,
      title: "", // Empty title
      due: new Date("invalid date"), // Invalid date
      source: "MANUAL" as any,
    });
    const malformedTitleConfirmResult = await concept.confirm({ suggestion: malformedSuggestionId, course: courseId, addedBy: userId });
    assertEquals("error" in malformedTitleConfirmResult, true, "Confirming suggestion with empty title should fail.");
    assertEquals((malformedTitleConfirmResult as { error: string }).error, "Confirmed suggestion must have a non-empty title.");

  } finally {
    await client.close();
  }
});
```

***

### `src/suggestionmanagement/SuggestionManagementConcept.ts` Implementation Explained

This file implements the `SuggestionManagement` concept, which focuses on extracting, refining, and confirming potential deadlines from various sources.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The file `SuggestionManagementConcept.ts` directly aligns with the singular concept name `SuggestionManagement`.
* **Implementation Details & Rationale:**
  * Standard `Collection`, `Db`, `Empty`, `ID`, `freshID` imports are used.
  * `const PREFIX = "SuggestionManagement" + ".";`: Namespaces MongoDB collections (e.g., `SuggestionManagement.parsedDeadlineSuggestions`) for modularity.
  * `type User = ID;`, `type Document = ID;`, `type Course = ID;`: These are the generic type parameters. `SuggestionManagement` treats them as opaque IDs. This enforces concept independence; `SuggestionManagement` doesn't need to know the internal structure of a `User`, `Document`, or `Course`, only their unique identifiers.
  * `type ParsedDeadlineSuggestion = ID;`, `type ExtractionConfig = ID;`: Define internal entity IDs managed by this concept.

#### 2. Enumerations (`SuggestionSource` and `ExtractionMethod`)

* **Correspondence to Concept Spec (`state` section):** Directly maps to the `source of ...` and `extractionMethod of ...` declarations.
* **Implementation Details & Rationale:** TypeScript `enum`s provide type safety and ensure that these fields can only take predefined values, improving data integrity and readability.
* **Helper functions `isValidSuggestionSource` and `isValidExtractionMethod`:** Added for validating enum inputs, as direct string input might not match enum members.

#### 3. `ParsedDeadlineSuggestionDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):** This interface models `a set of ParsedDeadlineSuggestions`.
* **Implementation Details & Rationale:**
  * `_id: ParsedDeadlineSuggestion;`: Primary key for suggestion documents.
  * `user: User;`: The `User` ID associated with who initiated the parsing, following generic parameter rules.
  * `document?: Document;`, `canvasMetadata?: string;`, `websiteUrl?: string;`: Optional fields for provenance, directly mapping to the spec.
  * `title: string;`, `due: Date;`, `source: SuggestionSource;`: Core fields for a suggestion, with `Date` for `DateTime`.
  * `confirmed?: boolean = false;`: Default to `false` in the spec. In TypeScript, `?` makes it optional, and the insertion logic handles the default.
  * `confidence?: number;`, `extractionMethod?: ExtractionMethod;`, `provenance?: string;`, `warnings?: string[];`: Optional fields, directly mapping to the spec. `warnings` is an array of strings.
  * **Rationale:** Defines the detailed structure for storing individual deadline suggestions.

#### 4. `ExtractionConfigDoc` Interface (State Representation)

* **Correspondence to Concept Spec (`state` section):** This interface models `a set of ExtractionConfigs`.
* **Implementation Details & Rationale:**
  * `_id: ExtractionConfig;`: Primary key for config documents.
  * Fields like `name`, `modelVersion`, `basePromptTemplate`, `maxTokens`, `temperature`, `timezone`, `timeout?` directly map to the spec. `timeout?` is optional.
  * **Rationale:** Defines the structure for storing LLM configuration profiles, allowing different parsing strategies.

#### 5. `DocumentContentPair` Interface (Composite Argument Type)

* **Correspondence to Concept Spec:**
  ```concept
  llmExtractFromMultipleDocuments(user: User, documents: List<{documentId: Document, documentContent: String}>, config: ExtractionConfig): ...
  ```
* **Implementation Details & Rationale:**
  * `interface DocumentContentPair { documentId: Document; documentContent: string; }`: This is a helper interface to define the structure of objects passed in the `documents` array for `llmExtractFromMultipleDocuments`.
  * **Rationale:** This explicitly handles the composite object (`List<{documentId: Document, documentContent: String}>`) in the action argument as defined in the concept spec. While the general guideline advises against composite objects as action arguments to maintain concept independence (as it implies assumptions about the internal structure of `Document`), here I'm strictly following the provided spec. A more "pure" concept design might have `llmExtractFromMultipleDocuments(user: User, documentIds: List<Document>, config: ExtractionConfig): ...` and require an external sync to call `DocumentManagement.getDocumentContent` for each ID.

#### 6. Class Definition and Constructor

* **Correspondence to Concept Spec (`concept` and `purpose` sections):** The class `SuggestionManagementConcept` and its JSDoc tags link to the concept.
* **Implementation Details & Rationale:** Initializes `parsedDeadlineSuggestions` and `extractionConfigs` MongoDB collections.

#### 7. `createExtractionConfig` Action

* **Correspondence to Concept Spec:**
  ```concept
  createExtractionConfig (name: String, ...): (config: ExtractionConfig) or (error: String)
    requires name is unique
    effects creates a new extraction configuration for LLM processing.
  ```
* **Implementation Details \&ationale:**
  * **`requires name is unique`**: Checks for an existing config with the same `name`. Returns an error if found.
  * **Input Validation:** Ensures `name` is not empty.
  * **`effects creates a new extraction configuration`**: Generates `_id` and inserts the new config document.
  * `return { config: configId };`: Returns the ID of the new config.

#### 8. `parseFromCanvas` Action

* **Correspondence to Concept Spec:**
  ```concept
  parseFromCanvas(user: User, canvasData: String, config: ExtractionConfig): (suggestions: List<ParsedDeadlineSuggestion>) or (error: String)
    requires config exists and canvasData is valid JSON
    effects parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
  ```
* **Implementation Details & Rationale:**
  * **`requires config exists`**: Checks if the `ExtractionConfig` ID exists in its `extractionConfigs` collection.
  * **`requires canvasData is valid JSON`**: Includes a `try-catch` block to parse `canvasData`.
  * **`effects parses assignment JSON data, creates suggestions... Sets extractionMethod = CANVAS_JSON, source = CANVAS`**: Simulates parsing by assuming `canvasData` is an array of objects. Iterates, generates `_id` for each suggestion, sets `user`, `canvasMetadata`, `title`, `due`, `source`, `confirmed: false`, `extractionMethod`. Inserts each.
  * `return { suggestions: createdSuggestions };`: Returns an array of the `ParsedDeadlineSuggestionDoc` objects.

#### 9. `llmExtractFromDocument` Action (and `llmExtractFromMultipleDocuments`, `llmExtractFromWebsite`)

* **Correspondence to Concept Spec:** These actions involve LLM interaction and document/website parsing.
  * They all require `config exists` and relevant content (`documentContent`, `websiteContent`) or valid `documentId`s/`url`.
  * Their effects are to create suggestions, link them to the `user`, set `extractionMethod = LLM`, `confidence`, and `provenance`.
* **Implementation Details & Rationale:**
  * **Simulated LLM:** For this backend assignment, LLM interaction is *simulated*. The logic looks for keywords (e.g., "assignment", "deadline") in the content to generate a mock suggestion. In a real application, this would involve calling an external LLM API.
  * **Precondition Checks:** Each action validates that `config` exists and that content/URLs are non-empty and well-formed (e.g., `url.startsWith("https://")`).
  * **Composite Argument (llmExtractFromMultipleDocuments):** This action explicitly takes `documents: DocumentContentPair[]`. I've implemented this by validating the array and its contents, then simulating processing. This highlights a deviation from the stricter "primitives/IDs only" rule for action arguments but adheres to the provided spec.
  * **`effects`:** Generates `_id`, links to `user`, sets appropriate `document` ID, `websiteUrl`, `title`, `due`, `source`, `confidence`, `extractionMethod`, and `provenance` as specified.
  * `return { suggestions: simulatedSuggestions };`: Returns an array of `ParsedDeadlineSuggestionDoc` objects.

#### 10. `refineWithFeedback` Action

* **Correspondence to Concept Spec:**
  ```concept
  refineWithFeedback(suggestion: ParsedDeadlineSuggestion, feedback: String, config: ExtractionConfig): (suggestion: ParsedDeadlineSuggestion) or (error: String)
    requires suggestion exists, feedback is non-empty, config exists
    effects re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence.
  ```
* **Implementation Details & Rationale:**
  * **Preconditions:** Checks for existing `suggestion` and `config`, and non-empty `feedback`.
  * **Simulated Refinement:** Based on keywords in `feedback`, it simulates updates to `title`, `due`, and `confidence`. It also adds a "date refined by LLM" or "title refined by LLM" warning.
  * **`effects`:** Updates the `ParsedDeadlineSuggestionDoc` in MongoDB using `$set`.
  * `return { suggestion: updatedSuggestion };`: Returns the updated suggestion document.

#### 11. `editSuggestion`, `updateSuggestionTitle`, `updateSuggestionDate` Actions

* **Correspondence to Concept Spec:** These provide manual editing capabilities.
  * Require `suggestion exists` and valid inputs (`newTitle` non-empty, `newDue` valid).
  * Effects are to update specific fields (`title`, `due`).
  * All set `warnings` to indicate manual editing.
* **Implementation Details & Rationale:**
  * Perform existence checks for the suggestion.
  * Perform input validation for `newTitle` and `newDue`.
  * Use `$set` to update fields in MongoDB.
  * Manage the `warnings` array: creates a copy, adds "manually edited" if not present, and updates the document.
  * Return the updated suggestion document (and `updatedDue` for `updateSuggestionDate` as per spec).
  * **Rationale:** Directly implements the manual correction features, which are vital for user control over LLM-generated content.

#### 12. `confirm` Action

* **Correspondence to Concept Spec:**
  ```concept
  confirm (suggestion: ParsedDeadlineSuggestion, course: Course, addedBy: User): (course: Course, title: String, due: DateTime, source: SYLLABUS or IMAGE or WEBSITE or CANVAS or LLM_PARSED, addedBy: User) or (error: String)
    requires suggestion exists, is not already confirmed, has valid title and due date
    effects marks suggestion as confirmed, and returns the data for creating a new Deadline.
  ```
* **Implementation Details & Rationale:**
  * **Preconditions:** Checks for existing `suggestion`, `is not already confirmed`, and `has valid title and due date`. Returns errors if any fail.
  * **`course` and `addedBy` existence:** JSDoc notes that their existence checks are external to this concept (concept independence).
  * **`effects marks suggestion as confirmed`**: Updates the `confirmed` field of the `ParsedDeadlineSuggestionDoc` to `true`.
  * **`effects ... returns the data for creating a new Deadline.`**: Constructs and returns an object containing all the necessary primitive fields (`course`, `title`, `due`, `source`, `addedBy`) that `DeadlineManagement.createDeadline` would require. This is the canonical way independent concepts interact via synchronizations.

#### 13. Query Methods (`_getSuggestionById`, `_getSuggestionsByUser`, `_getExtractionConfigByName`, `_getAllExtractionConfigs`, `_getAllSuggestions`)

* **Correspondence to Concept Spec:** These are implicit queries, essential for testing and for other concepts/synchronizations to inspect `SuggestionManagement`'s state.
* **Implementation Details & Rationale:** Provide various ways to read `ParsedDeadlineSuggestionDoc` and `ExtractionConfigDoc` documents from MongoDB.

***

### `src/suggestionmanagement/SuggestionManagementConcept.test.ts` Implementation Explained

This file contains comprehensive tests for the `SuggestionManagementConcept`, verifying its actions, preconditions, and effects, and demonstrating its operational principle.

#### 1. File Naming and Imports

* **Correspondence to Concept Spec:** The test file name directly reflects its purpose.
* **Implementation Details & Rationale:**
  * Standard Deno assertions (`assertEquals`, `assertExists`, etc.).
  * `testDb`, `ID`, `freshID` from `@utils`.
  * **Crucial Imports for Dependencies:** `UserIdentityConcept`, `CourseManagementConcept`, `DocumentManagementConcept` are imported.
    * **Rationale:** `SuggestionManagement` uses `User`, `Document`, and `Course` IDs as generic parameters. To set up realistic test scenarios, we need to create these entities using their respective managing concepts. This demonstrates behavioral integration between independent concepts via shared opaque IDs.

#### 2. Test Data Constants

* **Implementation Details:** Defines constants for test emails, names, course details, document content, website URLs/content, and LLM config details. `TEST_CANVAS_DATA` is pre-structured JSON to simulate Canvas API output for `parseFromCanvas`.
* **Rationale:** Improves test readability, maintainability, and makes it clear what data is used in each scenario.

#### 3. "Principle" Test Case

* **Correspondence to Concept Spec (`principle` section):**
  ```concept
  principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data; users confirm suggestions before they become official deadlines.
  ```
  This test meticulously steps through a scenario covering production, refinement, and confirmation.
* **Implementation Details & Rationale:**
  * **Setup:** Creates `User` and `Course` IDs using their respective concepts, and then an `ExtractionConfig` using `SuggestionManagement` itself.
  * **1. Produce Suggestions (from document):**
    * Uploads a document using `DocumentManagementConcept` to get a `docId`.
    * Calls `suggestionManagementConcept.llmExtractFromDocument()` with the `docId` and content.
    * Asserts successful extraction and verifies the basic properties of the created `suggestion` (e.g., `title` includes "LLM Extracted Task", `confirmed: false`, `extractionMethod: "LLM"`).
  * **2. Refine Suggestions (manual edit):**
    * Calls `suggestionManagementConcept.editSuggestion()` to manually adjust the `due` date of the first suggestion.
    * Asserts success and verifies the `due` date is updated and the "manually edited" warning is added.
  * **3. Confirm Suggestions:**
    * Calls `suggestionManagementConcept.confirm()`, passing the `suggestion ID`, `course ID`, and `user ID`.
    * Asserts success and then verifies that the returned data for creating a deadline matches the (now refined) suggestion's data.
    * Finally, queries the suggestion itself (`_getSuggestionById`) to ensure its `confirmed` status is `true`.
  * **Rationale:** This end-to-end test confirms the concept's main purpose by simulating a full lifecycle of a suggestion.

#### 4. "Action: createExtractionConfig - enforces unique names and validates input" Test Case

* **Correspondence to Concept Spec (`createExtractionConfig` action's `requires` and `effects`):** This test targets the requirements for creating an LLM configuration.
* **Implementation Details & Rationale:**
  * **Valid Creation:** Creates a config successfully.
  * **Duplicate Name:** Attempts to create a config with the same name. Asserts an error and checks its message.
  * **Empty Name:** Attempts to create a config with an empty name. Asserts an error.
  * **Rationale:** Verifies the `name is unique` precondition and basic input validation.

#### 5. "Action: parseFromCanvas - creates suggestions from valid JSON and handles errors" Test Case

* **Correspondence to Concept Spec (`parseFromCanvas` action's `requires` and `effects`):** This tests the Canvas parsing functionality.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a `User` and an `ExtractionConfig`.
  * **Valid Parsing:** Calls `parseFromCanvas` with `TEST_CANVAS_DATA` (pre-structured JSON). Asserts success and verifies that two suggestions are created with correct titles, sources, and extraction methods. Checks that `due` is a `Date` object.
  * **Non-existent Config:** Attempts parsing with a fake `config ID`. Asserts an error.
  * **Empty `canvasData`:** Attempts parsing with empty data. Asserts an error.
  * **Invalid JSON:** Attempts parsing with malformed JSON. Asserts an error.
  * **Rationale:** Tests `parseFromCanvas`'s ability to create suggestions and its input validation.

#### 6. "Action: llmExtractFromDocument - creates suggestions and handles errors" Test Case

* **Correspondence to Concept Spec (`llmExtractFromDocument` action's `requires` and `effects`):** This tests the single-document LLM extraction.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a `User`, a `Course`, a `Document` (to get a valid `docId`), and an `ExtractionConfig`.
  * **Valid Extraction:** Calls `llmExtractFromDocument` with valid inputs. Asserts success and verifies one suggestion is created, linked to the `document ID`, with correct `extractionMethod` and a positive `confidence`.
  * **Non-existent Config:** Attempts extraction with a fake `config ID`. Asserts an error.
  * **Empty `documentContent`:** Attempts extraction with empty content. Asserts an error.
  * **Missing `documentId`:** Attempts extraction with an `undefined` `documentId`. Asserts an error.
  * **Rationale:** Tests `llmExtractFromDocument`'s functionality and error handling.

#### 7. "Action: llmExtractFromMultipleDocuments - creates suggestions with cross-referencing logic" Test Case

* **Correspondence to Concept Spec (`llmExtractFromMultipleDocuments` action's `requires` and `effects`):** This tests the multi-document LLM extraction, including the composite argument.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a `User`, `Course`, and *two* `Document`s.
  * **Valid Extraction:** Calls `llmExtractFromMultipleDocuments` with an array of `DocumentContentPair` objects. Asserts success and verifies one combined suggestion is created, and that its `provenance` links to both document IDs.
  * **No Documents:** Attempts with an empty array. Asserts an error.
  * **Empty Content in Document:** Attempts with a `DocumentContentPair` having empty `documentContent`. Asserts an error.
  * **Rationale:** Tests the more complex `llmExtractFromMultipleDocuments` action, including the specific composite input argument.

#### 8. "Action: llmExtractFromWebsite - creates suggestions from website content and handles errors" Test Case

* **Correspondence to Concept Spec (`llmExtractFromWebsite` action's `requires` and `effects`):** This tests website extraction.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a `User` and an `ExtractionConfig`.
  * **Valid Extraction:** Calls `llmExtractFromWebsite` with a valid URL and content. Asserts success and verifies the suggestion's `websiteUrl`, `title`, and `source`.
  * **Invalid URL:** Attempts with an `http://` URL (precondition requires `https://`). Asserts an error.
  * **Empty Content:** Attempts with empty `websiteContent`. Asserts an error.
  * **Rationale:** Tests the website extraction functionality and its input validation.

#### 9. "Action: refineWithFeedback - updates suggestion based on feedback" Test Case

* **Correspondence to Concept Spec (`refineWithFeedback` action's `requires` and `effects`):** This tests the interactive refinement.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a suggestion.
  * **Refine Date:** Calls `refineWithFeedback` with date-related feedback. Asserts success, verifies the `due` date has shifted, and the "date refined by LLM" warning is added. Checks confidence boost.
  * **Refine Title:** Calls `refineWithFeedback` with title-related feedback. Asserts success, verifies the `title` is refined, and the "title refined by LLM" warning is added.
  * **Non-existent Suggestion:** Attempts refinement with a fake `suggestion ID`. Asserts an error.
  * **Empty Feedback:** Attempts refinement with empty feedback. Asserts an error.
  * **Rationale:** Tests the LLM-driven refinement process.

#### 10. "Action: editSuggestion, updateSuggestionTitle, updateSuggestionDate - manually edit suggestions" Test Case

* **Correspondence to Concept Spec (multiple manual editing actions):** This test covers the user's ability to directly correct suggestions.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a suggestion.
  * **`editSuggestion`:** Edits both `title` and `due` date. Asserts success, verifies both changes, and checks for the "manually edited" warning.
  * **`updateSuggestionTitle`:** Edits only the `title`. Asserts success, verifies `title` changed while `due` remained the same, and the warning persists.
  * **`updateSuggestionDate`:** Edits only the `due` date. Asserts success, verifies `due` changed while `title` remained the same, and the warning persists.
  * **Rationale:** Thoroughly tests the manual editing actions, crucial for user control.

#### 11. "Action: confirm - marks suggestion as confirmed and returns deadline data" Test Case

* **Correspondence to Concept Spec (`confirm` action's `requires` and `effects`):** This is the final step where a suggestion becomes concrete.
* **Implementation Details & Rationale:**
  * **Setup:** Creates a `User`, `Course`, and a `ParsedDeadlineSuggestion`. Crucially, ensures the suggestion has a valid title and due date by directly editing it if the LLM simulation didn't produce a perfect one.
  * **Successful Confirmation:** Calls `confirm` with valid IDs. Asserts success and verifies that the *returned object* contains the correct `course`, `title`, `due`, `source`, and `addedBy` for `DeadlineManagement.createDeadline`. Also verifies the original suggestion is marked `confirmed: true` in its state.
  * **Already Confirmed:** Attempts to confirm the same suggestion again. Asserts an error.
  * **Non-existent Suggestion:** Attempts confirmation with a fake `suggestion ID`. Asserts an error.
  * **Malformed Suggestion:** Directly inserts a suggestion with an empty title or invalid due date to test these preconditions of `confirm`. Asserts errors for these cases.
  * **Rationale:** Verifies the critical `confirm` action, which is the bridge to creating actual deadlines, and ensures all its preconditions are enforced.

These detailed explanations provide a clear and comprehensive understanding of the implementation and testing strategy for the `SuggestionManagement` concept, emphasizing strict adherence to the concept design principles.
