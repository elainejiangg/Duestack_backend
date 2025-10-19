---
timestamp: 'Sun Oct 19 2025 01:47:40 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_014740.c646bcf3.md]]'
content_id: 245ef94c974a9fde3ea2cd559fe48c6aa0f8c4cc652f3bf1f5d03e7acc91fdb0
---

# file: src/suggestionmanagement/SuggestionManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import { List } from "lodash"; // Assuming List is a type alias for array, or using Array directly

// Collection prefix to ensure namespace separation
const PREFIX = "SuggestionManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID; // User ID originating from UserIdentity concept
type Document = ID; // Document ID originating from DocumentManagement concept
type Course = ID; // Course ID originating from CourseManagement concept

// Internal entity types for Suggestions and Configs
type ParsedDeadlineSuggestion = ID;
type ExtractionConfig = ID;

/**
 * Enumeration for the source of a parsed deadline suggestion.
 * Corresponds to: a source of SYLLABUS or IMAGE or WEBSITE or CANVAS
 */
enum SuggestionSource {
  SYLLABUS = "SYLLABUS",
  IMAGE = "IMAGE",
  WEBSITE = "WEBSITE",
  CANVAS = "CANVAS",
}

/**
 * Enumeration for the method of extraction.
 * Corresponds to: an optional extractionMethod of CANVAS_JSON or LLM
 */
enum ExtractionMethod {
  CANVAS_JSON = "CANVAS_JSON",
  LLM = "LLM",
}

/**
 * State: A set of ParsedDeadlineSuggestions.
 */
interface ParsedDeadlineSuggestionDoc {
  _id: ParsedDeadlineSuggestion; // Primary key for this collection
  user: User; // The user who initiated the parsing
  document?: Document; // Optional: ID of the UploadedDocument if applicable
  canvasMetadata?: string; // Optional: Raw JSON data from Canvas
  websiteUrl?: string; // Optional: URL if extracted from a website
  title: string;
  due: Date; // DateTime is represented as Date in TypeScript/MongoDB
  source: SuggestionSource;
  confirmed?: boolean; // Default to false, matches `an optional confirmed Boolean = false` in spec
  confidence?: number; // Optional: 0.0-1.0
  extractionMethod?: ExtractionMethod; // Optional: CANVAS_JSON or LLM
  provenance?: string; // Optional: e.g., LLM model version, prompt used, file name
  warnings?: string[]; // Optional: e.g., "date ambiguous", "low confidence"
}

/**
 * State: A set of ExtractionConfigs.
 */
interface ExtractionConfigDoc {
  _id: ExtractionConfig; // Primary key for this collection
  name: string; // Unique name for the config
  modelVersion: string;
  basePromptTemplate: string;
  maxTokens: number;
  temperature: number;
  timezone: string;
  timeout?: number; // Optional
}

/**
 * Type for document inputs in llmExtractFromMultipleDocuments action.
 * Note: This is a composite object within an action argument,
 * which generally goes against Concept Design principles of passing primitive or ID types.
 * However, it is explicitly defined in the provided specification for this action.
 */
interface DocumentContentPair {
  documentId: Document;
  documentContent: string;
}

/**
 * @concept SuggestionManagement
 * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas; optionally AI-augmented.
 */
export default class SuggestionManagementConcept {
  parsedDeadlineSuggestions: Collection<ParsedDeadlineSuggestionDoc>;
  extractionConfigs: Collection<ExtractionConfigDoc>;

  constructor(private readonly db: Db) {
    this.parsedDeadlineSuggestions = this.db.collection(PREFIX + "parsedDeadlineSuggestions");
    this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
  }

  /**
   * Helper to ensure valid Source enum value.
   */
  private isValidSuggestionSource(source: string): source is SuggestionSource {
    return Object.values(SuggestionSource).includes(source as SuggestionSource);
  }

  /**
   * Helper to ensure valid ExtractionMethod enum value.
   */
  private isValidExtractionMethod(method: string): method is ExtractionMethod {
    return Object.values(ExtractionMethod).includes(method as ExtractionMethod);
  }

  /**
   * Action: Creates a new extraction configuration for LLM processing.
   * @param {Object} args - The arguments for the action.
   * @param {string} args.name - Unique name for the configuration.
   * @param {string} args.modelVersion - The version of the LLM model.
   * @param {string} args.basePromptTemplate - The base prompt template.
   * @param {number} args.maxTokens - Maximum tokens for generation.
   * @param {number} args.temperature - LLM temperature setting.
   * @param {string} args.timezone - Timezone for date parsing.
   * @param {number} [args.optionalTimeout] - Optional timeout for LLM calls.
   * @returns {Promise<{config: ExtractionConfig} | {error: string}>} A promise that resolves to the new config's ID on success, or an error.
   * @requires name is unique.
   * @effects Creates a new extraction configuration.
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
    if (!name || name.trim() === "") {
      return { error: "Configuration name cannot be empty." };
    }
    const existingConfig = await this.extractionConfigs.findOne({ name });
    if (existingConfig) {
      return { error: `ExtractionConfig with name '${name}' already exists.` };
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
      timeout: optionalTimeout, // Optional
    });
    return { config: configId };
  }

  /**
   * Action: Parses assignment JSON data from Canvas and creates suggestions.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {string} args.canvasData - Raw JSON data from Canvas.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists and canvasData is valid JSON.
   * @effects Parses assignment JSON data, creates suggestions linked to `user`. Sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
   * @note For this implementation, we simulate parsing by accepting pre-structured data as `canvasData`. In a real app, this would involve complex parsing logic or an actual LLM call.
   */
  async parseFromCanvas(
    { user, canvasData, config }: { user: User; canvasData: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!canvasData || canvasData.trim() === "") {
      return { error: "Canvas data cannot be empty." };
    }

    let parsedItems: { title: string; due: string }[]; // Simulate parsing result
    try {
      // In a real scenario, this would involve LLM or complex parsing
      parsedItems = JSON.parse(canvasData);
      if (!Array.isArray(parsedItems)) {
        return { error: "canvasData is not a valid JSON array of items." };
      }
    } catch (e) {
      return { error: `Invalid canvasData JSON: ${e.message}` };
    }

    const createdSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    for (const item of parsedItems) {
      if (!item.title || !item.due) continue; // Skip malformed items

      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      const newSuggestion: ParsedDeadlineSuggestionDoc = {
        _id: suggestionId,
        user,
        canvasMetadata: canvasData, // Store raw data for provenance
        title: item.title,
        due: new Date(item.due), // Assuming 'due' is ISO string
        source: SuggestionSource.CANVAS,
        confirmed: false,
        extractionMethod: ExtractionMethod.CANVAS_JSON,
        provenance: `Canvas API data processed by config ${existingConfig.name}`,
        warnings: [],
      };
      await this.parsedDeadlineSuggestions.insertOne(newSuggestion);
      createdSuggestions.push(newSuggestion);
    }
    return { suggestions: createdSuggestions };
  }

  /**
   * Action: Uses LLM to extract structured suggestions from document content.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {Document} args.documentId - The ID of the uploaded document.
   * @param {string} args.documentContent - The content of the document.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, documentId exists, documentContent is text or image suitable for LLM.
   * @effects Uses LLM to extract structured suggestions from document content, creates suggestions linked to `user`. Sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).
   * @note In this implementation, LLM interaction is simulated.
   */
  async llmExtractFromDocument(
    { user, documentId, documentContent, config }: { user: User; documentId: Document; documentContent: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!documentId) { // Check that documentId is provided, though its existence in DocumentManagement is external
      return { error: "Document ID cannot be empty." };
    }
    if (!documentContent || documentContent.trim() === "") {
      return { error: "Document content cannot be empty." };
    }

    // Simulate LLM extraction based on content
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    const keywords = ["assignment", "pset", "quiz", "exam"];
    const contentLower = documentContent.toLowerCase();

    if (keywords.some(k => contentLower.includes(k))) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        document: documentId,
        title: `LLM Extracted Task from ${documentId}`,
        due: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        source: SuggestionSource.SYLLABUS, // Defaulting for simplicity
        confirmed: false,
        confidence: 0.85,
        extractionMethod: ExtractionMethod.LLM,
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from document ${documentId}`,
        warnings: [],
      });
    }

    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Sends ALL document contents to LLM in a SINGLE request for cross-referencing.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {List<{documentId: Document, documentContent: String}>} args.documents - A list of document IDs and their contents.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, all documents contain extractable content.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution.
   * @note This action explicitly accepts composite objects in the `documents` argument per spec, despite general Concept Design preference for primitives/IDs. LLM interaction is simulated.
   */
  async llmExtractFromMultipleDocuments(
    { user, documents, config }: { user: User; documents: DocumentContentPair[]; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!documents || documents.length === 0) {
      return { error: "No documents provided for multi-document extraction." };
    }
    if (documents.some(d => !d.documentId || !d.documentContent || d.documentContent.trim() === "")) {
      return { error: "All documents must have a valid ID and non-empty content." };
    }

    // Simulate LLM cross-referencing. For simplicity, we just combine titles.
    const combinedContent = documents.map(d => `Document ${d.documentId}: ${d.documentContent}`).join("\n\n");
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];

    // Assuming a simple "LLM" logic: if "deadline" is in combined content, create one suggestion
    if (combinedContent.toLowerCase().includes("deadline")) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        // Link to multiple documents via provenance or an array of document IDs if state supported
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from multiple documents: ${documents.map(d => d.documentId).join(", ")}`,
        title: `Combined Multi-Document Deadline`,
        due: new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000), // 14 days from now
        source: SuggestionSource.SYLLABUS, // Simplified source
        confirmed: false,
        confidence: 0.95,
        extractionMethod: ExtractionMethod.LLM,
        warnings: [],
      });
    }

    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Uses LLM to parse website content into deadline suggestions.
   * @param {Object} args - The arguments for the action.
   * @param {User} args.user - The user who initiated the parsing.
   * @param {string} args.url - The URL of the website.
   * @param {string} args.websiteContent - The HTML or raw text content of the website.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestions: ParsedDeadlineSuggestion[]} | {error: string}>} A promise that resolves to a list of created suggestions, or an error.
   * @requires config exists, url is reachable, websiteContent is non-empty.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   * @note LLM interaction is simulated.
   */
  async llmExtractFromWebsite(
    { user, url, websiteContent, config }: { user: User; url: string; websiteContent: string; config: ExtractionConfig },
  ): Promise<{ suggestions: ParsedDeadlineSuggestionDoc[] } | { error: string }> {
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!url || url.trim() === "" || !url.startsWith("https://")) {
      return { error: "Valid HTTPS URL is required." };
    }
    if (!websiteContent || websiteContent.trim() === "") {
      return { error: "Website content cannot be empty." };
    }

    // Simulate LLM extraction
    const simulatedSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    if (websiteContent.toLowerCase().includes("assignment") && websiteContent.toLowerCase().includes("due")) {
      const suggestionId = freshID() as ParsedDeadlineSuggestion;
      simulatedSuggestions.push({
        _id: suggestionId,
        user,
        websiteUrl: url,
        title: `Web Assignment from ${url.split('/')[2]}`,
        due: new Date(new Date().getTime() + 21 * 24 * 60 * 60 * 1000), // 21 days from now
        source: SuggestionSource.WEBSITE,
        confirmed: false,
        confidence: 0.90,
        extractionMethod: ExtractionMethod.LLM,
        provenance: `LLM (v${existingConfig.modelVersion}) via config '${existingConfig.name}' from URL: ${url}`,
        warnings: [],
      });
    }
    await Promise.all(simulatedSuggestions.map(s => this.parsedDeadlineSuggestions.insertOne(s)));
    return { suggestions: simulatedSuggestions };
  }

  /**
   * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to refine.
   * @param {string} args.feedback - User feedback for refinement.
   * @param {ExtractionConfig} args.config - The ID of the extraction configuration to use.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists, feedback is non-empty, config exists.
   * @effects Re-prompts LLM using user feedback to refine fields of the suggestion. Updates title, due, warnings, or confidence.
   * @note LLM interaction is simulated.
   */
  async refineWithFeedback(
    { suggestion, feedback, config }: { suggestion: ParsedDeadlineSuggestion; feedback: string; config: ExtractionConfig },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    const existingConfig = await this.extractionConfigs.findOne({ _id: config });
    if (!existingConfig) {
      return { error: `ExtractionConfig with ID ${config} not found.` };
    }
    if (!feedback || feedback.trim() === "") {
      return { error: "Feedback cannot be empty." };
    }

    // Simulate LLM refinement based on feedback
    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {};
    let newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];

    if (feedback.toLowerCase().includes("date")) {
      updatedFields.due = new Date(existingSuggestion.due.getTime() + 24 * 60 * 60 * 1000); // Shift date by 1 day
      if (!newWarnings.includes("date refined by LLM")) newWarnings.push("date refined by LLM");
    }
    if (feedback.toLowerCase().includes("title")) {
      updatedFields.title = `(Refined) ${existingSuggestion.title}`;
      if (!newWarnings.includes("title refined by LLM")) newWarnings.push("title refined by LLM");
    }
    updatedFields.confidence = Math.min(1.0, (existingSuggestion.confidence || 0) + 0.05); // Boost confidence
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." }; // Should not happen if update was successful
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually edits the title and due date of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to edit.
   * @param {string} args.newTitle - The new title.
   * @param {Date} args.newDue - The new due date.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists, newTitle is non-empty, newDue is valid.
   * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
   */
  async editSuggestion(
    { suggestion, newTitle, newDue }: { suggestion: ParsedDeadlineSuggestion; newTitle: string; newDue: Date },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "New title cannot be empty." };
    }
    if (!(newDue instanceof Date && !isNaN(newDue.getTime()))) {
      return { error: "New due date is invalid." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      title: newTitle,
      due: newDue,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually updates only the title of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to update.
   * @param {string} args.newTitle - The new title.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc} | {error: string}>} A promise that resolves to the updated suggestion, or an error.
   * @requires suggestion exists and newTitle is non-empty.
   * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionTitle(
    { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "New title cannot be empty." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      title: newTitle,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion };
  }

  /**
   * Action: Manually updates only the due date of a suggestion.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to update.
   * @param {Date} args.newDue - The new due date.
   * @returns {Promise<{suggestion: ParsedDeadlineSuggestionDoc, updatedDue: Date} | {error: string}>} A promise that resolves to the updated suggestion and its new due date, or an error.
   * @requires suggestion exists and newDue is valid.
   * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionDate(
    { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
  ): Promise<{ suggestion: ParsedDeadlineSuggestionDoc; updatedDue: Date } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (!(newDue instanceof Date && !isNaN(newDue.getTime()))) {
      return { error: "New due date is invalid." };
    }

    const updatedFields: Partial<ParsedDeadlineSuggestionDoc> = {
      due: newDue,
    };
    const newWarnings = existingSuggestion.warnings ? [...existingSuggestion.warnings] : [];
    if (!newWarnings.includes("manually edited")) newWarnings.push("manually edited");
    updatedFields.warnings = newWarnings;

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: updatedFields },
    );

    const updatedSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!updatedSuggestion) {
      return { error: "Failed to retrieve updated suggestion." };
    }
    return { suggestion: updatedSuggestion, updatedDue: updatedSuggestion.due };
  }

  /**
   * Action: Confirms a parsed deadline suggestion, returning data for creating a new Deadline.
   * @param {Object} args - The arguments for the action.
   * @param {ParsedDeadlineSuggestion} args.suggestion - The ID of the suggestion to confirm.
   * @param {Course} args.course - The Course ID to link the final deadline to.
   * @param {User} args.addedBy - The User ID who is confirming/adding the deadline.
   * @returns {Promise<{course: Course, title: string, due: Date, source: SuggestionSource, addedBy: User} | {error: string}>} A promise that resolves to the extracted deadline data on success, or an error.
   * @requires suggestion exists, is not already confirmed, has valid title and due date.
   * @effects Marks suggestion as confirmed, and returns the data for creating a new Deadline.
   */
  async confirm(
    { suggestion, course, addedBy }: { suggestion: ParsedDeadlineSuggestion; course: Course; addedBy: User },
  ): Promise<{ course: Course; title: string; due: Date; source: SuggestionSource; addedBy: User } | { error: string }> {
    const existingSuggestion = await this.parsedDeadlineSuggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} not found.` };
    }
    if (existingSuggestion.confirmed) {
      return { error: `ParsedDeadlineSuggestion with ID ${suggestion} is already confirmed.` };
    }
    if (!existingSuggestion.title || existingSuggestion.title.trim() === "") {
      return { error: "Confirmed suggestion must have a non-empty title." };
    }
    if (!(existingSuggestion.due instanceof Date && !isNaN(existingSuggestion.due.getTime()))) {
      return { error: "Confirmed suggestion must have a valid due date." };
    }

    // Note: Course and User existence checks are external to this concept.

    await this.parsedDeadlineSuggestions.updateOne(
      { _id: suggestion },
      { $set: { confirmed: true } },
    );

    // Prepare data for DeadlineManagement.createDeadline
    return {
      course,
      title: existingSuggestion.title,
      due: existingSuggestion.due,
      source: existingSuggestion.source,
      addedBy,
    };
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves a parsed deadline suggestion by its ID.
   */
  async _getSuggestionById({ suggestionId }: { suggestionId: ParsedDeadlineSuggestion }): Promise<ParsedDeadlineSuggestionDoc | null> {
    return await this.parsedDeadlineSuggestions.findOne({ _id: suggestionId });
  }

  /**
   * Query: Retrieves all suggestions for a specific user.
   */
  async _getSuggestionsByUser({ userId }: { userId: User }): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.parsedDeadlineSuggestions.find({ user: userId }).toArray();
  }

  /**
   * Query: Retrieves an extraction configuration by its name.
   */
  async _getExtractionConfigByName({ name }: { name: string }): Promise<ExtractionConfigDoc | null> {
    return await this.extractionConfigs.findOne({ name });
  }

  /**
   * Query: Retrieves all extraction configurations.
   */
  async _getAllExtractionConfigs(): Promise<ExtractionConfigDoc[]> {
    return await this.extractionConfigs.find({}).toArray();
  }

  /**
   * Query: Retrieves all parsed deadline suggestions.
   */
  async _getAllSuggestions(): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.parsedDeadlineSuggestions.find({}).toArray();
  }
}
```
