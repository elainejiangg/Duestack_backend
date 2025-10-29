# Assignment 4b Backend Updates

## Overview

This document summarizes the major backend changes made during Assignment 4b to support the frontend implementation and enhance the DueStack application's functionality.

## New Features Added

### 1. **AI-Powered Deadline Extraction System**

#### SuggestionManagement Concept - Major Enhancements

Added comprehensive AI extraction capabilities using Google Gemini 2.0 Flash:

**New Actions:**

- `llmExtractFromPDFUrls(user, pdfUrls, config, customPrompt)` - Extract deadlines from multiple Google Drive documents (PDFs, images)
- `llmExtractFromWebsite(user, url, course, config, customPrompt)` - Extract deadlines from course websites via web scraping
- `refineMultipleSuggestions(user, suggestions, refinementPrompt)` - Post-extraction refinement with custom prompts

**Key Capabilities:**

- **Multi-document processing**: Process multiple PDFs/images in a single extraction for cross-referencing
- **Custom prompts**: Users can provide specific instructions (e.g., "Focus on problem sets only")
- **AI refinement**: Re-process extractions with new instructions (e.g., "Reformat pset names to PSET 1")
- **Confidence scoring**: AI provides confidence levels (0.0-1.0) for each extracted deadline
- **Source tracking**: Store original document URLs for reference
- **Structured output**: JSON schema validation ensures reliable extraction

**Updated Data Model:**

```typescript
interface ParsedDeadlineSuggestionDoc {
  _id: ParsedDeadlineSuggestion;
  user: User;
  document?: Document;
  websiteUrl?: string; // NEW: Store source URLs for AI-parsed deadlines
  title: string;
  due: Date;
  source: "SYLLABUS" | "IMAGE" | "WEBSITE" | "CANVAS" | "LLM_PARSED"; // NEW: LLM_PARSED source type
  confirmed: boolean;
  confidence?: number; // 0.0 - 1.0
  extractionMethod?: "CANVAS_JSON" | "LLM";
  provenance?: string; // NEW: Extended to include course and document info
  warnings?: string[];
}
```

### 2. **Gemini API Integration**

#### New Utility: `geminiService.ts`

Comprehensive service for interacting with Google Gemini API:

**Key Functions:**

- `extractDeadlinesFromPDFs(pdfUrls, promptTemplate)` - Multi-document PDF extraction
- `extractDeadlinesFromWebsiteContent(websiteContent, promptTemplate, options)` - Website content extraction
- `uploadDocumentToFileAPI(documentUrl, originalUrl)` - Upload documents to Gemini File API
- `convertGoogleDriveUrl(shareUrl)` - Convert Google Drive share links to direct download links

**Features:**

- **Multimodal support**: PDFs, images (PNG, JPG, GIF), and text content
- **MIME type detection**: Automatic detection and handling of various document types
- **Large file support**: Uses Gemini File API for files >20MB
- **Structured extraction**: JSON schema with confidence scores and provenance
- **Error handling**: Robust error handling for API failures and invalid documents

### 3. **Website Scraping**

#### New Utility: `websiteScraper.ts`

Implemented HTML scraping using Cheerio and Undici:

**Function:**

```typescript
async function scrapeWebsiteContent(
  url: string
): Promise<ScrapedWebsiteContent>;
```

**Capabilities:**

- Extracts page title
- Parses headings (H1-H6)
- Extracts bullet points and lists
- Cleans and formats body text
- Returns LLM-friendly structured content

### 4. **DeadlineManagement Concept Updates**

**Enhanced Data Model:**

```typescript
interface DeadlineDoc {
  _id: Deadline;
  course: Course;
  title: string;
  due: Date;
  source: Source;
  addedBy: User;
  status?: Status;
  websiteUrl?: string; // NEW: Store source document URLs for AI-parsed deadlines
}
```

**Updated Actions:**

- `createDeadline()` - Now accepts optional `websiteUrl` parameter for source tracking

## Technical Implementation Details

### AI Extraction Pipeline

1. **Document Upload** (for PDF/image mode):

   - User provides Google Drive links
   - Backend converts share URLs to direct download links
   - Documents uploaded to Gemini File API
   - MIME types detected automatically

2. **Website Scraping** (for website mode):

   - User provides course website URL
   - Backend scrapes HTML content using Cheerio
   - Extracts structured text (headings, lists, body)
   - Cleans content for LLM processing

3. **Gemini Processing**:

   - Constructs prompt with base template + custom instructions
   - Sends documents/content to Gemini 2.0 Flash
   - Uses JSON schema for structured output
   - Receives suggestions with confidence scores

4. **Refinement** (optional):
   - Re-sends original documents to Gemini
   - Augments prompt with refinement instructions
   - Deletes old suggestions, creates new ones
   - Preserves source URLs and course information

### API Endpoints

All SuggestionManagement endpoints are exposed via the concept server:

```
POST /api/SuggestionManagement/llmExtractFromPDFUrls
POST /api/SuggestionManagement/llmExtractFromWebsite
POST /api/SuggestionManagement/refineMultipleSuggestions
POST /api/SuggestionManagement/confirm
POST /api/SuggestionManagement/_getSuggestionsByUser
POST /api/SuggestionManagement/_getUnconfirmedSuggestionsByUser
```

### Dependencies

**New Packages:**

- `cheerio` - HTML parsing for web scraping
- `undici` - HTTP client for fetching web content

## Frontend Integration

The frontend utilizes these backend features through:

1. **AIDeadlineExtractor Component**:

   - Dual-mode interface (Document vs Website)
   - Custom prompt input
   - Post-extraction refinement UI
   - Suggestion review and confirmation

2. **AI Extraction Service**:
   - `extractFromPDFUrls()` - Calls PDF extraction endpoint
   - `extractFromWebsite()` - Calls website extraction endpoint
   - `refineSuggestions()` - Calls refinement endpoint
   - `getAllSuggestions()` - Fetches unconfirmed suggestions
   - `confirmSuggestions()` - Confirms selected suggestions as deadlines

## Testing & Validation

The AI extraction system has been tested with:

- ✅ Multiple PDF documents (syllabi, calendars)
- ✅ Image screenshots (Canvas, course portals)
- ✅ Course website URLs (GitHub Pages, MIT class sites)
- ✅ Custom prompts for filtering and formatting
- ✅ Refinement prompts for post-extraction editing
- ✅ Multi-document cross-referencing
- ✅ Various MIME types (PDF, PNG, JPG, etc.)

## Concept Principles

### SuggestionManagement

**Purpose:** Manage AI-extracted deadline suggestions before confirmation

**Operational Principle:**

> After extracting deadline suggestions from documents or websites [llmExtractFromPDFUrls, llmExtractFromWebsite], the user can review them, optionally refine them with additional instructions [refineMultipleSuggestions], and then confirm selected suggestions [confirm] to create actual deadlines in the DeadlineManagement concept.

**State:**

- `suggestions`: Set of ParsedDeadlineSuggestion
- `extractionConfigs`: Configuration for AI extraction

**Actions:**

- Extract suggestions from various sources
- Edit individual suggestions
- Refine multiple suggestions with AI
- Confirm suggestions as deadlines

## Limitations & Future Work

### Current Limitations

1. **Google Drive Only**: Document extraction requires Google Drive links
2. **Public Websites Only**: Website extraction requires publicly accessible URLs
3. **No Canvas API**: Canvas integration uses screenshots, not direct API
4. **English Only**: AI optimized for English-language documents

### Potential Improvements

1. **Direct File Upload**: Support direct file uploads via AWS S3 instead of requiring Google Drive
2. **Canvas LMS Integration**: Direct API integration for automatic syncing
3. **Multi-language Support**: Prompts and parsing for non-English courses
4. **Batch Processing**: Process multiple courses simultaneously
5. **Smart Suggestions**: Recommend deadlines based on previous semester patterns
6. **Calendar Integration**: Export to Google Calendar, Outlook, etc.
