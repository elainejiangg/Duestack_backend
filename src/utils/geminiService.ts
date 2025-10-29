/**
 * Gemini API Service for PDF Document Extraction
 * Based on Gemini 2.5 Flash model with structured output
 */

interface DeadlineSuggestion {
  title: string;
  due: string; // ISO 8601 format
  confidence: number; // 0.0 - 1.0
  provenance: string;
  warnings?: string[];
}

interface ExtractionResponse {
  suggestions: DeadlineSuggestion[];
}

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent";

if (!GEMINI_API_KEY) {
  console.warn("⚠️  GEMINI_API_KEY not set. AI extraction will not work.");
}

/**
 * Extract deadlines from Google Drive document links using Gemini API with File API
 * Supports PDFs, images (JPEG, PNG, GIF, WebP), and other document formats
 * @param documentUrls Array of Google Drive document URLs to process
 * @param promptTemplate Base prompt for extraction
 * @returns Extraction response with suggestions
 */
export async function extractDeadlinesFromPDFs(
  documentUrls: string[],
  promptTemplate: string = DEFAULT_EXTRACTION_PROMPT
): Promise<ExtractionResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  if (!documentUrls || documentUrls.length === 0) {
    throw new Error("At least one document URL is required");
  }

  try {
    console.log(
      `📄 Uploading ${documentUrls.length} document(s) to Gemini File API...`
    );

    // Convert Google Drive links to direct download links
    const directUrls = documentUrls.map((url) => convertGoogleDriveUrl(url));

    // Step 1: Upload all documents to File API
    const uploadedFiles = await Promise.all(
      directUrls.map((url, index) =>
        uploadDocumentToFileAPI(url, documentUrls[index])
      )
    );

    console.log(`✅ Uploaded ${uploadedFiles.length} file(s)`);
    console.log(`🤖 Extracting deadlines with Gemini...`);

    // Step 2: Call Gemini API with all uploaded files
    const response = await callGeminiWithFiles(uploadedFiles, promptTemplate);

    console.log(`✅ Extracted ${response.suggestions.length} deadline(s)`);

    // Step 3: Clean up uploaded files (they auto-delete after 48 hours anyway)
    await Promise.all(
      uploadedFiles.map((file) =>
        deleteFileFromFileAPI(file.name).catch(() => {})
      )
    );

    return response;
  } catch (error) {
    console.error("❌ Gemini API Error:", error);
    throw new Error(`Failed to extract deadlines: ${error.message}`);
  }
}

/**
 * Refine deadline suggestions using Gemini API (text-only, no documents)
 * @param promptTemplate Prompt with existing deadline data and refinement instructions
 * @returns Extraction response with refined suggestions
 */
async function callGeminiStructuredExtraction(
  prompt: string,
  logLabel: string,
  errorPrefix: string
): Promise<ExtractionResponse> {
  if (!GEMINI_API_KEY) {
    throw new Error("GEMINI_API_KEY is not configured");
  }

  try {
    console.log(`🤖 ${logLabel}`);

    const requestBody = {
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        topK: 32,
        topP: 0.95,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: {
                    type: "string",
                    description: "Assignment or deadline title",
                  },
                  due: {
                    type: "string",
                    description:
                      "Due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)",
                  },
                  confidence: {
                    type: "number",
                    description: "Confidence score from 0.0 to 1.0",
                  },
                  provenance: {
                    type: "string",
                    description: "Source of the deadline information",
                  },
                  warnings: {
                    type: "array",
                    items: { type: "string" },
                    description: "Any warnings or notes about this deadline",
                  },
                },
                required: ["title", "due", "confidence", "provenance"],
              },
            },
          },
          required: ["suggestions"],
        },
      },
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned ${response.status}: ${errorText}`);
    }

    const data = await response.json();

    if (
      !data.candidates ||
      !data.candidates[0] ||
      !data.candidates[0].content
    ) {
      throw new Error("Invalid response from Gemini API");
    }

    const textResponse = data.candidates[0].content.parts[0].text;
    const parsedResponse: ExtractionResponse = JSON.parse(textResponse);

    return parsedResponse;
  } catch (error) {
    console.error("❌ Gemini Structured Extraction Error:", error);
    if (error instanceof Error) {
      throw new Error(`${errorPrefix}: ${error.message}`);
    }
    throw new Error(`${errorPrefix}: ${String(error)}`);
  }
}

export async function refineDeadlinesWithGemini(
  promptTemplate: string
): Promise<ExtractionResponse> {
  const response = await callGeminiStructuredExtraction(
    promptTemplate,
    "Refining deadlines with Gemini (text-only)...",
    "Failed to refine deadlines"
  );

  console.log(`✅ Refined ${response.suggestions.length} deadline(s)`);
  return response;
}

export async function extractDeadlinesFromWebsiteContent(
  websiteContent: string,
  promptTemplate: string = DEFAULT_EXTRACTION_PROMPT,
  options?: { url?: string; title?: string }
): Promise<ExtractionResponse> {
  if (!websiteContent || !websiteContent.trim()) {
    throw new Error("Website content is empty");
  }

  const sanitizedContent = websiteContent.replace(/\s+/g, " ").trim();
  const truncatedContent =
    sanitizedContent.length > 20000
      ? sanitizedContent.slice(0, 20000)
      : sanitizedContent;

  const contextHeader = [
    options?.url ? `Source URL: ${options.url}` : null,
    options?.title ? `Page Title: ${options.title}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const combinedPrompt = `${promptTemplate}

Use ONLY the information from the following course website content to extract deadlines.
${contextHeader ? `${contextHeader}\n` : ""}
<WEBSITE_CONTENT>
${truncatedContent}
</WEBSITE_CONTENT>`;

  const response = await callGeminiStructuredExtraction(
    combinedPrompt,
    "Extracting deadlines from website content with Gemini...",
    "Failed to extract deadlines from website"
  );

  console.log(`✅ Extracted ${response.suggestions.length} deadline(s)`);
  return response;
}

/**
 * Convert Google Drive share link to direct download link
 * @param url Google Drive URL (share link or direct)
 * @returns Direct download URL
 */
function convertGoogleDriveUrl(url: string): string {
  // If it's already a direct download link, return as is
  if (url.includes("drive.google.com/uc?") || url.includes("export=download")) {
    return url;
  }

  // Extract file ID from various Google Drive URL formats
  let fileId = null;

  // Format: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) {
    fileId = match1[1];
  }

  // Format: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) {
    fileId = match2[1];
  }

  if (fileId) {
    return `https://drive.google.com/uc?export=download&id=${fileId}`;
  }

  // If it's not a Google Drive link, return as is (might be another cloud storage)
  return url;
}

/**
 * Detect MIME type from URL or content
 */
function detectMimeType(url: string, contentType?: string): string {
  if (contentType && contentType !== "application/octet-stream") {
    return contentType;
  }

  const urlLower = url.toLowerCase();

  // PDF
  if (urlLower.includes(".pdf")) return "application/pdf";

  // Images
  if (urlLower.includes(".jpg") || urlLower.includes(".jpeg"))
    return "image/jpeg";
  if (urlLower.includes(".png")) return "image/png";
  if (urlLower.includes(".gif")) return "image/gif";
  if (urlLower.includes(".webp")) return "image/webp";

  // Documents
  if (urlLower.includes(".doc") || urlLower.includes(".docx"))
    return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (urlLower.includes(".txt")) return "text/plain";

  // Default to PDF (most common for academic docs)
  return "application/pdf";
}

/**
 * Upload a document (PDF, image, etc.) from URL to Gemini File API
 */
async function uploadDocumentToFileAPI(
  documentUrl: string,
  originalUrl: string
): Promise<{ name: string; uri: string; mimeType: string }> {
  // Fetch document from URL
  const docResponse = await fetch(documentUrl);
  if (!docResponse.ok) {
    throw new Error(
      `Failed to fetch document from ${documentUrl}: ${docResponse.statusText}`
    );
  }

  const docBlob = await docResponse.blob();
  const docArrayBuffer = await docBlob.arrayBuffer();

  // Detect MIME type
  const mimeType = detectMimeType(
    originalUrl,
    docResponse.headers.get("content-type") || undefined
  );

  // Upload to File API
  const uploadUrl = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;

  // Extract filename from URL or use generic name
  let filename = originalUrl.split("/").pop()?.split("?")[0] || "document";
  if (!filename.includes(".")) {
    // Add extension based on MIME type
    if (mimeType.includes("pdf")) filename += ".pdf";
    else if (mimeType.includes("jpeg")) filename += ".jpg";
    else if (mimeType.includes("png")) filename += ".png";
    else if (mimeType.includes("gif")) filename += ".gif";
    else if (mimeType.includes("webp")) filename += ".webp";
    else filename += ".bin";
  }

  const metadata = {
    file: {
      displayName: filename,
    },
  };

  // Create form data with metadata and file
  const boundary = "boundary_" + Math.random().toString(36).substring(2);

  // Build the multipart body parts as separate components
  const preBoundary = `--${boundary}\r\n`;
  const metadataPart = `Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(
    metadata
  )}\r\n`;
  const fileBoundary = `--${boundary}\r\n`;
  const fileHeader = `Content-Type: ${mimeType}\r\n\r\n`;
  const postBoundary = `\r\n--${boundary}--\r\n`;

  // Convert strings to bytes
  const preBoundaryBytes = new TextEncoder().encode(preBoundary);
  const metadataBytes = new TextEncoder().encode(metadataPart);
  const fileBoundaryBytes = new TextEncoder().encode(fileBoundary);
  const fileHeaderBytes = new TextEncoder().encode(fileHeader);
  const fileDataBytes = new Uint8Array(docArrayBuffer);
  const postBoundaryBytes = new TextEncoder().encode(postBoundary);

  // Calculate total length
  const totalLength =
    preBoundaryBytes.length +
    metadataBytes.length +
    fileBoundaryBytes.length +
    fileHeaderBytes.length +
    fileDataBytes.length +
    postBoundaryBytes.length;

  // Combine all parts
  const combinedData = new Uint8Array(totalLength);
  let offset = 0;

  combinedData.set(preBoundaryBytes, offset);
  offset += preBoundaryBytes.length;

  combinedData.set(metadataBytes, offset);
  offset += metadataBytes.length;

  combinedData.set(fileBoundaryBytes, offset);
  offset += fileBoundaryBytes.length;

  combinedData.set(fileHeaderBytes, offset);
  offset += fileHeaderBytes.length;

  combinedData.set(fileDataBytes, offset);
  offset += fileDataBytes.length;

  combinedData.set(postBoundaryBytes, offset);

  const uploadResponse = await fetch(uploadUrl, {
    method: "POST",
    headers: {
      "Content-Type": `multipart/related; boundary=${boundary}`,
      "X-Goog-Upload-Protocol": "multipart",
    },
    body: combinedData,
  });

  if (!uploadResponse.ok) {
    const errorText = await uploadResponse.text();
    throw new Error(`Failed to upload document: ${errorText}`);
  }

  const uploadResult = await uploadResponse.json();

  // Wait for file processing
  await waitForFileProcessing(uploadResult.file.name);

  return {
    name: uploadResult.file.name,
    uri: uploadResult.file.uri,
    mimeType: mimeType, // Include detected MIME type
  };
}

/**
 * Wait for uploaded file to be processed
 */
async function waitForFileProcessing(
  fileName: string,
  maxAttempts = 10
): Promise<void> {
  for (let i = 0; i < maxAttempts; i++) {
    const fileUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`;
    const response = await fetch(fileUrl);

    if (response.ok) {
      const fileInfo = await response.json();
      if (fileInfo.state === "ACTIVE") {
        return;
      }
    }

    // Wait 1 second before retry
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  throw new Error("File processing timeout");
}

/**
 * Call Gemini API with uploaded files
 */
async function callGeminiWithFiles(
  files: Array<{ name: string; uri: string; mimeType?: string }>,
  prompt: string
): Promise<ExtractionResponse> {
  // Build contents array with files and prompt
  const contents = [
    ...files.map((file) => ({
      fileData: {
        fileUri: file.uri,
        mimeType: file.mimeType || "application/pdf", // Use detected MIME type or default to PDF
      },
    })),
    {
      text: prompt,
    },
  ];

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: contents,
      },
    ],
    generationConfig: {
      temperature: 0.1,
      topK: 32,
      topP: 0.95,
      maxOutputTokens: 8192,
      responseMimeType: "application/json",
      responseSchema: {
        type: "object",
        properties: {
          suggestions: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: {
                  type: "string",
                  description: "Assignment or deadline title",
                },
                due: {
                  type: "string",
                  description:
                    "Due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)",
                },
                confidence: {
                  type: "number",
                  description: "Confidence score from 0.0 to 1.0",
                },
                provenance: {
                  type: "string",
                  description: "Where this deadline was found in the document",
                },
                warnings: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                  description: "Any warnings or uncertainties",
                },
              },
              required: ["title", "due", "confidence", "provenance"],
            },
          },
        },
        required: ["suggestions"],
      },
    },
  };

  const url = `${GEMINI_API_URL}?key=${GEMINI_API_KEY}`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API request failed: ${errorText}`);
  }

  const result = await response.json();

  // Extract JSON from response
  if (result.candidates && result.candidates[0]?.content?.parts?.[0]?.text) {
    const jsonText = result.candidates[0].content.parts[0].text;
    return JSON.parse(jsonText);
  }

  throw new Error("Unexpected response format from Gemini API");
}

/**
 * Delete file from File API
 */
async function deleteFileFromFileAPI(fileName: string): Promise<void> {
  const deleteUrl = `https://generativelanguage.googleapis.com/v1beta/${fileName}?key=${GEMINI_API_KEY}`;
  await fetch(deleteUrl, { method: "DELETE" });
}

/**
 * Default extraction prompt for academic deadlines
 */
const DEFAULT_EXTRACTION_PROMPT = `You are an expert at extracting deadline information from academic course documents (syllabi, calendars, schedules).

Extract ALL assignment deadlines, project due dates, exam dates, and important academic dates from the provided PDF document(s).

IMPORTANT EXTRACTION RULES:
1. **Date & Time Format**: Output dates in ISO 8601 format with timezone
   - Use America/New_York timezone (Eastern Time)
   - For September-October: Use EDT (UTC-4) → format: YYYY-MM-DDTHH:mm:ss-04:00
   - For November-December: Use EST (UTC-5) → format: YYYY-MM-DDTHH:mm:ss-05:00
   - If no time is specified, default to 23:59:00 (11:59 PM)
   - Example: 2025-09-15T23:59:00-04:00

2. **Title**: Use the exact assignment/project name from the document
   - Include course-specific identifiers (PS1, Assignment 1, etc.)
   - Keep it concise but descriptive

3. **Confidence Scores**:
   - 0.9-1.0: Explicit date with specific time (e.g., "Assignment 1 due Sept 15, 11:59 PM")
   - 0.7-0.9: Clear date without time (e.g., "Assignment 1 due Sept 15")
   - 0.5-0.7: Relative date (e.g., "due next Friday")
   - 0.3-0.5: Vague reference (e.g., "due soon", "end of semester")
   - Lower if ambiguous or inferred

4. **Provenance**: Describe where you found this deadline
   - Reference section/page if visible (e.g., "Course Schedule, page 2")
   - Note if information was cross-referenced across multiple documents

5. **Warnings**: Flag any issues
   - "Vague date term used" for TBD, soon, later, eventually
   - "Time not specified, defaulted to 11:59 PM"
   - "Date inferred from context"
   - "Potential duplicate" if similar assignments found
   - "Past date" if deadline is in the past

6. **Multi-Document Cross-Referencing** (if multiple PDFs provided):
   - Combine information intelligently
   - Example: If one document has "PS1 Due Sept 17" and another says "homework due at 11:59 PM on Wednesdays", combine them to "PS1 Due Sept 17, 11:59 PM"
   - Note in provenance when information was combined from multiple sources

7. **Avoid Hallucination**:
   - Do NOT make up specific dates for vague terms like "TBD", "soon", "later"
   - If uncertain, use lower confidence and add warnings
   - Only extract deadlines that are explicitly or clearly mentioned

Extract and return ALL deadlines found. Be thorough but conservative with confidence scores.`;

export { DEFAULT_EXTRACTION_PROMPT };
