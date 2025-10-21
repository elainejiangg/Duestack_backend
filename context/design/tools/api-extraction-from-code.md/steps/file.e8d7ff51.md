---
timestamp: 'Sun Oct 19 2025 20:43:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_204349.106d38ea.md]]'
content_id: e8d7ff517677e9f1b55d685e70ad12213876144cddedefe9b203f7734f3c10b1
---

# file: src/concepts/DueStack/SuggestionManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "SuggestionManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID;
type Document = ID; // From DocumentManagement
type Course = ID; // From CourseManagement

// Internal entity types, represented as IDs
type ParsedDeadlineSuggestion = ID;
type ExtractionConfig = ID;

/**
 * State: A set of ParsedDeadlineSuggestions representing extracted deadline candidates.
 */
interface ParsedDeadlineSuggestionDoc {
  _id: ParsedDeadlineSuggestion;
  user: User; // The user who initiated the parsing
  document?: Document; // ID of the UploadedDocument if applicable
  canvasMetadata?: string; // Raw JSON data from Canvas
  websiteUrl?: string;
  title: string;
  due: Date;
  source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS";
  confirmed: boolean;
  confidence?: number; // 0.0 - 1.0
  extractionMethod?: "CANVAS_JSON" | "LLM";
  provenance?: string;
  warnings?: string[];
}

/**
 * State: A set of ExtractionConfigs for LLM processing.
 */
interface ExtractionConfigDoc {
  _id: ExtractionConfig;
  name: string;
  modelVersion: string;
  basePromptTemplate: string;
  maxTokens: number;
  temperature: number;
  timezone: string;
  timeout?: number;
}

/**
 * @concept SuggestionManagement
 * @purpose represent extracted deadline candidates from documents, images, web pages, or Canvas;
 *          optionally AI-augmented.
 * @principle suggestions are produced via an LLM from uploaded files, web pages, or Canvas data;
 *            users confirm suggestions before they become official deadlines.
 */
export default class SuggestionManagementConcept {
  suggestions: Collection<ParsedDeadlineSuggestionDoc>;
  extractionConfigs: Collection<ExtractionConfigDoc>;

  constructor(private readonly db: Db) {
    this.suggestions = this.db.collection(PREFIX + "suggestions");
    this.extractionConfigs = this.db.collection(PREFIX + "extractionConfigs");
  }

  /**
   * Action: Creates a new extraction configuration.
   * @requires name is unique.
   * @effects Creates a new ExtractionConfig entity for LLM processing.
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
    const existingConfig = await this.extractionConfigs.findOne({ name });
    if (existingConfig) {
      return { error: `Extraction config with name '${name}' already exists.` };
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
      timeout: optionalTimeout,
    });
    return { config: configId };
  }

  // --- LLM/Parsing Simulation Methods ---
  private async _simulateLLMExtraction(
    user: User,
    source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS",
    contentIdentifier: Document | string, // documentId, canvasMetadata, or websiteUrl
    content: string,
    config: ExtractionConfig,
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    // In a real application, this would involve calling an LLM API.
    // For this simulation, we generate mock suggestions based on keywords.
    const configDoc = await this.extractionConfigs.findOne({ _id: config });
    if (!configDoc) {
      console.warn(`Config ${config} not found. Using default mock behavior.`);
    }

    const mockSuggestions: ParsedDeadlineSuggestionDoc[] = [];
    const lowerContent = content.toLowerCase();

    if (lowerContent.includes("assignment")) {
      mockSuggestions.push({
        _id: freshID() as ParsedDeadlineSuggestion,
        user,
        document: source !== "CANVAS" && source !== "WEBSITE"
          ? (contentIdentifier as Document)
          : undefined,
        websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Assignment 1: Introduction",
        due: new Date(new Date().getFullYear(), 8, 15, 23, 59), // Sept 15
        source,
        confirmed: false,
        confidence: 0.95,
        extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
        provenance: `Simulated LLM from ${source}`,
      });
    }
    if (lowerContent.includes("final project")) {
      mockSuggestions.push({
        _id: freshID() as ParsedDeadlineSuggestion,
        user,
        document: source !== "CANVAS" && source !== "WEBSITE"
          ? (contentIdentifier as Document)
          : undefined,
        websiteUrl: source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata: source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Final Project Submission",
        due: new Date(new Date().getFullYear(), 11, 20, 17, 0), // Dec 20
        source,
        confirmed: false,
        confidence: 0.88,
        extractionMethod: configDoc ? configDoc.modelVersion === "CANVAS_JSON" ? "CANVAS_JSON" : "LLM" : "LLM",
        provenance: `Simulated LLM from ${source}`,
        warnings: ["Date might be ambiguous"],
      });
    }
    return mockSuggestions;
  }

  /**
   * Action: Parses assignment JSON data from Canvas.
   * @requires config exists and canvasData is valid JSON.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = CANVAS_JSON`, `source = CANVAS`.
   */
  async parseFromCanvas(
    { user, canvasData, config }: {
      user: User;
      canvasData: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    try {
      JSON.parse(canvasData); // Validate JSON
    } catch (e) {
      return { error: "canvasData is not valid JSON." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "CANVAS",
      canvasData, // Use canvasData as identifier for simulation
      canvasData,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    if (mockSuggestions.length > 0) {
      await this.suggestions.insertMany(mockSuggestions);
    }
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Uses LLM to extract structured suggestions from document content.
   * @requires config exists, documentId exists (external check via syncs), documentContent is text or image suitable for LLM.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` (linking to `documentId`).
   */
  async llmExtractFromDocument(
    { user, documentId, documentContent, config }: {
      user: User;
      documentId: Document;
      documentContent: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!documentContent) {
      return { error: "documentContent cannot be empty for LLM extraction." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "SYLLABUS", // Or IMAGE, depending on how `documentContent` is handled
      documentId,
      documentContent,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    if (mockSuggestions.length > 0) {
      await this.suggestions.insertMany(mockSuggestions);
    }
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Sends combined document contents to LLM in SINGLE request to enable cross-referencing.
   * @requires config exists, combinedDocumentContent is non-empty and suitable for LLM.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `confidence`, `provenance` with multi-source attribution (using `documentIds`).
   */
  async llmExtractFromMultipleDocuments(
    { user, documentIds, combinedDocumentContent, config }: { // Corrected signature to match spec
      user: User;
      documentIds: Document[]; // List<Document> from spec
      combinedDocumentContent: string; // String from spec
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!combinedDocumentContent) { // Check combined content
      return { error: "combinedDocumentContent cannot be empty for multiple extraction." };
    }
    if (!documentIds || documentIds.length === 0) {
        // While the LLM processes combined content, having the IDs for provenance is important.
        // This is a softer requirement, but good for data integrity.
        console.warn("No documentIds provided for multiple extraction, provenance might be less precise.");
    }


    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "SYLLABUS",
      documentIds.join(", "), // Use joined IDs as identifier for simulation
      combinedDocumentContent,
      config,
    ); // Simulate combined extraction
    const suggestionIds = mockSuggestions.map((s) => s._id);
    if (mockSuggestions.length > 0) {
      await this.suggestions.insertMany(mockSuggestions);
    }
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Uses LLM to parse website content into deadline suggestions.
   * @requires config exists, url is reachable, websiteContent is non-empty.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   */
  async llmExtractFromWebsite(
    { user, url, websiteContent, config }: {
      user: User;
      url: string;
      websiteContent: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!url || !url.startsWith("https://")) {
      return { error: "Invalid URL provided." };
    }
    if (!websiteContent) {
      return { error: "websiteContent cannot be empty for LLM extraction." };
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "WEBSITE",
      url,
      websiteContent,
      config,
    );
    const suggestionIds = mockSuggestions.map((s) => s._id);
    if (mockSuggestions.length > 0) {
      await this.suggestions.insertMany(mockSuggestions);
    }
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
   * @requires suggestion exists, feedback is non-empty, config exists.
   * @effects Updates title, due, warnings, or confidence of the suggestion.
   */
  async refineWithFeedback(
    { suggestion, feedback, config }: {
      suggestion: ParsedDeadlineSuggestion;
      feedback: string;
      config: ExtractionConfig;
    },
  ): Promise<{ suggestion: ParsedDeadlineSuggestion } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!feedback) {
      return { error: "Feedback cannot be empty." };
    }

    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }

    // Simulate LLM refinement based on feedback.
    // For example, if feedback contains "due at 11:59 PM", update the time.
    let newDue = existingSuggestion.due;
    if (feedback.includes("11:59 PM")) {
      newDue.setHours(23, 59, 0, 0);
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Refined by user feedback")) {
      updatedWarnings.push("Refined by user feedback");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      {
        $set: {
          due: newDue,
          warnings: updatedWarnings,
          confidence: existingSuggestion.confidence ? Math.min(existingSuggestion.confidence + 0.05, 1.0) : 0.9, // Simulate confidence increase
          provenance: `${existingSuggestion.provenance}, Refined by feedback: ${feedback}`,
        },
      },
    );

    return { suggestion };
  }

  /**
   * Action: Updates suggestion title and due date.
   * @requires suggestion exists, newTitle is non-empty, newDue is valid.
   * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
   */
  async editSuggestion(
    { suggestion, newTitle, newDue }: {
      suggestion: ParsedDeadlineSuggestion;
      newTitle: string;
      newDue: Date;
    },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle) {
      return { error: "New title cannot be empty." };
    }
    if (isNaN(newDue.getTime())) {
      return { error: "New due date is invalid." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { title: newTitle, due: newDue, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Updates suggestion title.
   * @requires suggestion exists and newTitle is non-empty.
   * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionTitle(
    { suggestion, newTitle }: { suggestion: ParsedDeadlineSuggestion; newTitle: string },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (!newTitle) {
      return { error: "New title cannot be empty." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { title: newTitle, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Updates suggestion due date.
   * @requires suggestion exists and newDue is valid.
   * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionDate(
    { suggestion, newDue }: { suggestion: ParsedDeadlineSuggestion; newDue: Date },
  ): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (isNaN(newDue.getTime())) {
      return { error: "New due date is invalid." };
    }

    const updatedWarnings = existingSuggestion.warnings || [];
    if (!updatedWarnings.includes("Manually edited")) {
      updatedWarnings.push("Manually edited");
    }

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { due: newDue, warnings: updatedWarnings } },
    );
    return {};
  }

  /**
   * Action: Marks a suggestion as confirmed, and returns the data for creating a new Deadline.
   * @requires suggestion exists, is not already confirmed, has valid title and due date, and course exists.
   * @effects Marks suggestion as confirmed, and emits canonical data to `Deadlines.create`.
   */
  async confirm(
    { suggestion, course, addedBy }: {
      suggestion: ParsedDeadlineSuggestion;
      course: Course;
      addedBy: User;
    },
  ): Promise<
    | {
      course: Course;
      title: string;
      due: Date;
      source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
      addedBy: User;
    }
    | { error: string }
  > {
    const existingSuggestion = await this.suggestions.findOne({ _id: suggestion });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (existingSuggestion.confirmed) {
      return { error: `Suggestion with ID ${suggestion} is already confirmed.` };
    }
    if (!existingSuggestion.title || isNaN(existingSuggestion.due.getTime())) {
      return { error: "Suggestion has invalid title or due date and cannot be confirmed." };
    }
    // In a real app, you might validate `course` existence via `CourseManagement._getCourseById` or similar if direct querying were allowed (it's not, without a sync).
    // For this concept, we assume the `course` ID passed is valid for the `DeadlineManagement` concept.

    await this.suggestions.updateOne({ _id: suggestion }, { $set: { confirmed: true } });

    return {
      course,
      title: existingSuggestion.title,
      due: existingSuggestion.due,
      source: existingSuggestion.source,
      addedBy,
    };
  }

  // --- Queries ---
  async _getSuggestionById(
    { suggestion }: { suggestion: ParsedDeadlineSuggestion },
  ): Promise<ParsedDeadlineSuggestionDoc | null> {
    return await this.suggestions.findOne({ _id: suggestion });
  }

  async _getSuggestionsByUser(
    { user }: { user: User },
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user }).toArray();
  }

  async _getUnconfirmedSuggestionsByUser(
    { user }: { user: User },
  ): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user, confirmed: false }).toArray();
  }
}


```
