import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";
import {
  extractDeadlinesFromPDFs,
  extractDeadlinesFromWebsiteContent,
  refineDeadlinesWithGemini,
} from "@utils/geminiService.ts";
import { scrapeWebsiteContent } from "@utils/websiteScraper.ts";

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
  source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
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
  async createExtractionConfig({
    name,
    modelVersion,
    basePromptTemplate,
    maxTokens,
    temperature,
    timezone,
    optionalTimeout,
  }: {
    name: string;
    modelVersion: string;
    basePromptTemplate: string;
    maxTokens: number;
    temperature: number;
    timezone: string;
    optionalTimeout?: number;
  }): Promise<{ config: ExtractionConfig } | { error: string }> {
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
    config: ExtractionConfig
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
        document:
          source !== "CANVAS" && source !== "WEBSITE"
            ? (contentIdentifier as Document)
            : undefined,
        websiteUrl:
          source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata:
          source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Assignment 1: Introduction",
        due: new Date(new Date().getFullYear(), 8, 15, 23, 59), // Sept 15
        source,
        confirmed: false,
        confidence: 0.95,
        extractionMethod: configDoc
          ? configDoc.modelVersion === "CANVAS_JSON"
            ? "CANVAS_JSON"
            : "LLM"
          : "LLM",
        provenance: `Simulated LLM from ${source}`,
      });
    }
    if (lowerContent.includes("final project")) {
      mockSuggestions.push({
        _id: freshID() as ParsedDeadlineSuggestion,
        user,
        document:
          source !== "CANVAS" && source !== "WEBSITE"
            ? (contentIdentifier as Document)
            : undefined,
        websiteUrl:
          source === "WEBSITE" ? (contentIdentifier as string) : undefined,
        canvasMetadata:
          source === "CANVAS" ? (contentIdentifier as string) : undefined,
        title: "Final Project Submission",
        due: new Date(new Date().getFullYear(), 11, 20, 17, 0), // Dec 20
        source,
        confirmed: false,
        confidence: 0.88,
        extractionMethod: configDoc
          ? configDoc.modelVersion === "CANVAS_JSON"
            ? "CANVAS_JSON"
            : "LLM"
          : "LLM",
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
  async parseFromCanvas({
    user,
    canvasData,
    config,
  }: {
    user: User;
    canvasData: string;
    config: ExtractionConfig;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
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
      config
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
  async llmExtractFromDocument({
    user,
    documentId,
    documentContent,
    config,
  }: {
    user: User;
    documentId: Document;
    documentContent: string;
    config: ExtractionConfig;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
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
      config
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
  async llmExtractFromMultipleDocuments({
    user,
    documentIds,
    combinedDocumentContent,
    config,
  }: {
    // Corrected signature to match spec
    user: User;
    documentIds: Document[]; // List<Document> from spec
    combinedDocumentContent: string; // String from spec
    config: ExtractionConfig;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!combinedDocumentContent) {
      // Check combined content
      return {
        error:
          "combinedDocumentContent cannot be empty for multiple extraction.",
      };
    }
    if (!documentIds || documentIds.length === 0) {
      // While the LLM processes combined content, having the IDs for provenance is important.
      // This is a softer requirement, but good for data integrity.
      console.warn(
        "No documentIds provided for multiple extraction, provenance might be less precise."
      );
    }

    const mockSuggestions = await this._simulateLLMExtraction(
      user,
      "SYLLABUS",
      documentIds.join(", "), // Use joined IDs as identifier for simulation
      combinedDocumentContent,
      config
    ); // Simulate combined extraction
    const suggestionIds = mockSuggestions.map((s) => s._id);
    if (mockSuggestions.length > 0) {
      await this.suggestions.insertMany(mockSuggestions);
    }
    return { suggestions: suggestionIds };
  }

  /**
   * Action: Uses Gemini API to extract deadlines from PDF URLs (real LLM extraction).
   * @requires config exists, pdfUrls is non-empty, course is valid.
   * @effects Creates suggestions linked to `user` and `course`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   */
  async llmExtractFromPDFUrls({
    user,
    course,
    pdfUrls,
    config,
    customPrompt,
  }: {
    user: User;
    course: Course;
    pdfUrls: string[];
    config: ExtractionConfig;
    customPrompt?: string;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!pdfUrls || pdfUrls.length === 0) {
      return { error: "At least one PDF URL is required." };
    }

    try {
      // Combine base prompt with custom prompt if provided
      let finalPrompt = configExists.basePromptTemplate;
      if (customPrompt && customPrompt.trim()) {
        console.log("🔧 Custom prompt received:", customPrompt);
        finalPrompt = `${
          configExists.basePromptTemplate
        }\n\nAdditional Instructions:\n${customPrompt.trim()}`;
        console.log("📝 Final combined prompt:", finalPrompt);
      } else {
        console.log("📝 Using base prompt only (no custom prompt)");
      }

      // Call real Gemini API
      const extractionResult = await extractDeadlinesFromPDFs(
        pdfUrls,
        finalPrompt
      );

      // Convert Gemini response to our suggestion format
      const newSuggestions: ParsedDeadlineSuggestionDoc[] =
        extractionResult.suggestions.map((s) => ({
          _id: freshID() as ParsedDeadlineSuggestion,
          user,
          websiteUrl: pdfUrls.join(", "), // Store URLs for reference
          title: s.title,
          due: new Date(s.due),
          source: "LLM_PARSED" as const,
          confirmed: false,
          confidence: s.confidence,
          extractionMethod: "LLM" as const,
          provenance: `${
            s.provenance
          } (Course: ${course}, Documents: ${pdfUrls.join(", ")})`,
          warnings: s.warnings || [],
        }));

      const suggestionIds = newSuggestions.map((s) => s._id);
      if (newSuggestions.length > 0) {
        await this.suggestions.insertMany(newSuggestions);
      }

      return { suggestions: suggestionIds };
    } catch (error) {
      console.error("LLM extraction error:", error);
      return { error: `Failed to extract deadlines: ${error.message}` };
    }
  }

  /**
   * Action: Scrapes a course website and uses LLM to extract deadlines.
   * @requires config exists, url is reachable.
   * @effects Creates suggestions linked to `user`, sets `extractionMethod = LLM`, `provenance`, `confidence`.
   */
  async llmExtractFromWebsite({
    user,
    course,
    url,
    config,
    customPrompt,
  }: {
    user: User;
    course?: Course;
    url: string;
    config: ExtractionConfig;
    customPrompt?: string;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!url || !url.startsWith("https://")) {
      return { error: "Invalid URL provided." };
    }

    try {
      const scraped = await scrapeWebsiteContent(url);

      let finalPrompt = configExists.basePromptTemplate;
      if (customPrompt && customPrompt.trim()) {
        console.log("🔧 Custom website prompt received:", customPrompt);
        finalPrompt = `${
          configExists.basePromptTemplate
        }\n\nAdditional Instructions:\n${customPrompt.trim()}`;
      }

      const extractionResult = await extractDeadlinesFromWebsiteContent(
        scraped.cleanText,
        finalPrompt,
        { url, title: scraped.title }
      );

      const newSuggestions: ParsedDeadlineSuggestionDoc[] =
        extractionResult.suggestions.map((s) => ({
          _id: freshID() as ParsedDeadlineSuggestion,
          user,
          websiteUrl: url,
          title: s.title,
          due: new Date(s.due),
          source: "LLM_PARSED" as const,
          confirmed: false,
          confidence: s.confidence,
          extractionMethod: "LLM" as const,
          provenance: `${s.provenance} (Website: ${url}${
            course ? `, Course: ${course}` : ""
          })`,
          warnings: s.warnings || [],
        }));

      const suggestionIds = newSuggestions.map((s) => s._id);
      if (newSuggestions.length > 0) {
        await this.suggestions.insertMany(newSuggestions);
      }

      return { suggestions: suggestionIds };
    } catch (error) {
      console.error("LLM website extraction error:", error);
      return {
        error: `Failed to extract deadlines from website: ${error.message}`,
      };
    }
  }

  /**
   * Action: Re-prompts LLM using user feedback to refine fields of the suggestion.
   * @requires suggestion exists, feedback is non-empty, config exists.
   * @effects Updates title, due, warnings, or confidence of the suggestion.
   */
  async refineWithFeedback({
    suggestion,
    feedback,
    config,
  }: {
    suggestion: ParsedDeadlineSuggestion;
    feedback: string;
    config: ExtractionConfig;
  }): Promise<{ suggestion: ParsedDeadlineSuggestion } | { error: string }> {
    const configExists = await this.extractionConfigs.findOne({ _id: config });
    if (!configExists) {
      return { error: `Extraction config with ID ${config} not found.` };
    }
    if (!feedback) {
      return { error: "Feedback cannot be empty." };
    }

    const existingSuggestion = await this.suggestions.findOne({
      _id: suggestion,
    });
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
          confidence: existingSuggestion.confidence
            ? Math.min(existingSuggestion.confidence + 0.05, 1.0)
            : 0.9, // Simulate confidence increase
          provenance: `${existingSuggestion.provenance}, Refined by feedback: ${feedback}`,
        },
      }
    );

    return { suggestion };
  }

  /**
   * Helper: Extract time specification from refinement prompt
   * @param prompt The refinement prompt text
   * @returns Object with hours and minutes if time found, null otherwise
   */
  private extractTimeFromPrompt(
    prompt: string
  ): { hours: number; minutes: number } | null {
    // Try various time patterns
    const patterns = [
      /(\d{1,2}):(\d{2})\s*(pm|PM|am|AM)/, // 11:59 PM
      /(\d{1,2}):(\d{2})(pm|PM|am|AM)/, // 11:59PM
      /(\d{1,2})\s*(pm|PM|am|AM)/, // 11 PM
    ];

    for (const pattern of patterns) {
      const match = prompt.match(pattern);
      if (match) {
        let hours = parseInt(match[1]);
        const minutes = match[2] ? parseInt(match[2]) : 0;
        const isPM = match[match.length - 1].toLowerCase() === "pm";

        // Convert to 24-hour format
        if (isPM && hours !== 12) {
          hours += 12;
        } else if (!isPM && hours === 12) {
          hours = 0;
        }

        console.log(
          `📋 Extracted time from prompt: ${hours}:${minutes
            .toString()
            .padStart(2, "0")}`
        );
        return { hours, minutes };
      }
    }

    return null;
  }

  /**
   * Action: Refines multiple suggestions using AI without re-processing documents.
   * @requires user exists, suggestions array is non-empty, refinementPrompt is non-empty.
   * @effects Updates multiple suggestions based on AI refinement prompt.
   */
  async refineMultipleSuggestions({
    user,
    suggestions,
    refinementPrompt,
  }: {
    user: User;
    suggestions: ParsedDeadlineSuggestion[];
    refinementPrompt: string;
  }): Promise<{ suggestions: ParsedDeadlineSuggestion[] } | { error: string }> {
    console.log("🔧 Backend received refinement request");
    console.log("🔧 User:", user);
    console.log("🔧 Suggestions count:", suggestions?.length);
    console.log("🔧 Refinement prompt:", refinementPrompt);

    if (!suggestions || suggestions.length === 0) {
      console.error("❌ No suggestions provided");
      return { error: "At least one suggestion is required." };
    }
    if (!refinementPrompt.trim()) {
      console.error("❌ Empty refinement prompt");
      return { error: "Refinement prompt cannot be empty." };
    }

    try {
      // Get existing suggestions from database
      const existingSuggestions = await this.suggestions
        .find({
          _id: { $in: suggestions },
          user: user,
        })
        .toArray();

      console.log(
        "🔧 Found",
        existingSuggestions.length,
        "suggestions in database"
      );

      if (existingSuggestions.length === 0) {
        return { error: "No suggestions found for the given IDs." };
      }

      // Get the original document/website URLs from the first suggestion
      const firstSuggestion = existingSuggestions[0];
      const sourceUrl = firstSuggestion.websiteUrl || "";

      // Extract course ID from provenance string (format: "... (Course: courseId)")
      const courseMatch =
        firstSuggestion.provenance?.match(/\(Course: ([^,)]+)/);
      const course = courseMatch ? courseMatch[1] : "unknown";

      if (!sourceUrl) {
        return { error: "No original source URL found for re-extraction." };
      }

      // Determine if this is a website extraction or document extraction
      const isWebsiteExtraction =
        sourceUrl.includes("/schedule") ||
        sourceUrl.includes("/syllabus") ||
        !sourceUrl.includes("drive.google.com");

      console.log(
        "🔧 Re-extracting with refinement instructions",
        isWebsiteExtraction ? "(Website mode)" : "(Document mode)"
      );
      console.log("🔗 Source URL:", sourceUrl);

      // Get the default extraction config
      const configs = await this.extractionConfigs.find({}).toArray();
      if (configs.length === 0) {
        return { error: "No extraction config found." };
      }
      const config = configs[0];

      // Combine base prompt with refinement instructions
      const finalPrompt = `${config.basePromptTemplate}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REFINEMENT INSTRUCTIONS - THESE OVERRIDE ALL PREVIOUS RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${refinementPrompt.trim()}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME SPECIFICATION RULES:
- "11:59 PM" = "23:59:00" in 24-hour format
- "11:59PM EST" = Use time 23:59:00 with timezone -05:00
- "11:59PM EDT" = Use time 23:59:00 with timezone -04:00

Apply these refinement instructions to EVERY extracted deadline that matches the criteria.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
      console.log("📝 Final combined prompt with refinement:", finalPrompt);

      // Call the appropriate extraction method based on source type
      let refinementResult;
      if (isWebsiteExtraction) {
        // Re-scrape the website and extract with refinement prompt
        const scraped = await scrapeWebsiteContent(sourceUrl);
        refinementResult = await extractDeadlinesFromWebsiteContent(
          scraped.cleanText,
          finalPrompt,
          { url: sourceUrl, title: scraped.title }
        );
      } else {
        // Re-process documents with refinement prompt
        const pdfUrls = sourceUrl.split(", ");
        refinementResult = await extractDeadlinesFromPDFs(pdfUrls, finalPrompt);
      }

      if (
        !refinementResult.suggestions ||
        refinementResult.suggestions.length === 0
      ) {
        return { error: "AI refinement failed to produce results." };
      }

      // Delete the old suggestions
      await this.suggestions.deleteMany({ _id: { $in: suggestions } });
      console.log(`🗑️ Deleted ${existingSuggestions.length} old suggestions`);

      // Log what Gemini actually returned
      console.log("📊 RAW GEMINI OUTPUT:");
      refinementResult.suggestions.forEach((s, i) => {
        console.log(
          `  ${i + 1}. ${s.title}: ${s.due} (raw string from Gemini)`
        );
      });

      // Post-process: Check if user specified time override
      // (Disabled - Gemini is already handling time changes correctly via prompting!)
      const timeOverride = null; // this.extractTimeFromPrompt(refinementPrompt);
      console.log("🕐 Time override disabled - Gemini handles it via prompt");

      // Create new refined suggestions
      const newSuggestions: ParsedDeadlineSuggestionDoc[] =
        refinementResult.suggestions.map((s) => {
          console.log(`🔍 Processing: ${s.title} - Gemini returned: ${s.due}`);
          let dueDate = new Date(s.due);

          // Apply time override if specified in prompt
          if (timeOverride) {
            // Parse the original ISO date string to get just the date part
            const isoString = new Date(s.due).toISOString();
            const datePart = isoString.split("T")[0]; // Get YYYY-MM-DD

            // Construct new ISO string with forced time in EST (UTC-5)
            // Format: YYYY-MM-DDTHH:mm:ss-05:00
            const hours = String(timeOverride.hours).padStart(2, "0");
            const minutes = String(timeOverride.minutes).padStart(2, "0");
            const newIsoString = `${datePart}T${hours}:${minutes}:00-05:00`;

            dueDate = new Date(newIsoString);

            console.log(
              `⏰ Forcing time to ${timeOverride.hours}:${
                timeOverride.minutes
              } for ${s.title}: ${newIsoString} → ${dueDate.toISOString()}`
            );
          }

          return {
            _id: freshID() as ParsedDeadlineSuggestion,
            user,
            websiteUrl: sourceUrl,
            title: s.title,
            due: dueDate,
            source: "LLM_PARSED" as const,
            confirmed: false,
            confidence: s.confidence,
            extractionMethod: "LLM" as const,
            provenance: `${s.provenance} (Course: ${course}, Refined, Source: ${sourceUrl})`,
            warnings: [
              ...(s.warnings || []),
              `AI Refined: ${refinementPrompt}`,
            ],
          };
        });

      await this.suggestions.insertMany(newSuggestions);
      console.log(
        `✅ Created ${newSuggestions.length} new refined suggestions`
      );

      return { suggestions: newSuggestions.map((s) => s._id) };
    } catch (error) {
      console.error("❌ Refinement error:", error);
      return { error: `Failed to refine suggestions: ${error.message}` };
    }
  }

  /**
   * Action: Updates suggestion title and due date.
   * @requires suggestion exists, newTitle is non-empty, newDue is valid.
   * @effects Updates suggestion title and due date. Sets `warnings` to indicate manual editing.
   */
  async editSuggestion({
    suggestion,
    newTitle,
    newDue,
  }: {
    suggestion: ParsedDeadlineSuggestion;
    newTitle: string;
    newDue: Date;
  }): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({
      _id: suggestion,
    });
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
      { $set: { title: newTitle, due: newDue, warnings: updatedWarnings } }
    );
    return {};
  }

  /**
   * Action: Updates suggestion title.
   * @requires suggestion exists and newTitle is non-empty.
   * @effects Updates suggestion title. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionTitle({
    suggestion,
    newTitle,
  }: {
    suggestion: ParsedDeadlineSuggestion;
    newTitle: string;
  }): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({
      _id: suggestion,
    });
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
      { $set: { title: newTitle, warnings: updatedWarnings } }
    );
    return {};
  }

  /**
   * Action: Updates suggestion due date.
   * @requires suggestion exists and newDue is valid.
   * @effects Updates suggestion due date. Sets `warnings` to indicate manual editing.
   */
  async updateSuggestionDate({
    suggestion,
    newDue,
  }: {
    suggestion: ParsedDeadlineSuggestion;
    newDue: Date;
  }): Promise<Empty | { error: string }> {
    const existingSuggestion = await this.suggestions.findOne({
      _id: suggestion,
    });
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
      { $set: { due: newDue, warnings: updatedWarnings } }
    );
    return {};
  }

  /**
   * Action: Marks a suggestion as confirmed, and returns the data for creating a new Deadline.
   * @requires suggestion exists, is not already confirmed, has valid title and due date, and course exists.
   * @effects Marks suggestion as confirmed, and emits canonical data to `Deadlines.create`.
   */
  async confirm({
    suggestion,
    course,
    addedBy,
  }: {
    suggestion: ParsedDeadlineSuggestion;
    course: Course;
    addedBy: User;
  }): Promise<
    | {
        course: Course;
        title: string;
        due: Date;
        source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED";
        addedBy: User;
        websiteUrl?: string;
      }
    | { error: string }
  > {
    const existingSuggestion = await this.suggestions.findOne({
      _id: suggestion,
    });
    if (!existingSuggestion) {
      return { error: `Suggestion with ID ${suggestion} not found.` };
    }
    if (existingSuggestion.confirmed) {
      return {
        error: `Suggestion with ID ${suggestion} is already confirmed.`,
      };
    }
    if (!existingSuggestion.title || isNaN(existingSuggestion.due.getTime())) {
      return {
        error:
          "Suggestion has invalid title or due date and cannot be confirmed.",
      };
    }
    // In a real app, you might validate `course` existence via `CourseManagement._getCourseById` or similar if direct querying were allowed (it's not, without a sync).
    // For this concept, we assume the `course` ID passed is valid for the `DeadlineManagement` concept.

    await this.suggestions.updateOne(
      { _id: suggestion },
      { $set: { confirmed: true } }
    );

    return {
      course,
      title: existingSuggestion.title,
      due: existingSuggestion.due,
      source: existingSuggestion.source,
      addedBy,
      websiteUrl: existingSuggestion.websiteUrl, // Pass document URLs to deadline
    };
  }

  // --- Queries ---
  async _getSuggestionById({
    suggestion,
  }: {
    suggestion: ParsedDeadlineSuggestion;
  }): Promise<ParsedDeadlineSuggestionDoc | null> {
    return await this.suggestions.findOne({ _id: suggestion });
  }

  async _getSuggestionsByUser({
    user,
  }: {
    user: User;
  }): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user }).toArray();
  }

  async _getUnconfirmedSuggestionsByUser({
    user,
  }: {
    user: User;
  }): Promise<ParsedDeadlineSuggestionDoc[]> {
    return await this.suggestions.find({ user, confirmed: false }).toArray();
  }
}
