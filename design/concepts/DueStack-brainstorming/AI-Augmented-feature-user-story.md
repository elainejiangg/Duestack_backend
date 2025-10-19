**Brief User Journey**

**Title: Tim manages deadlines across multiple MIT classes with AI assistance**

Tim, an MIT junior juggling multiple Course 6 classes, needs to organize deadlines for both 6.3700 and 6.1040. He starts by uploading two PDF documents for 6.3700 to DueStack.

**Step 1: Uploading 6.3700 Course Materials** Tim uploads `63700-Calendar_F2025-v1.pdf` containing a table of all assignments and exams with their due dates (but no specific times), and `63700-General-Info-f25-v1.png` with timing specifications. He selects "Use AI Parsing" for both documents. The system uses `llmExtractFromMultipleDocuments` to send both documents to the LLM in a single request, allowing the LLM to cross-reference information across documents while analyzing them. The calendar PDF provides assignment due dates (e.g., "PS1 Due Wednesday, September 17th") while the general info PNG provides timing specifications (e.g., "Homework normally due at 11:59pm on Wednesdays").

**Step 2: Intelligent Cross-referencing and Time Integration** Because both documents were sent together in one request, the LLM immediately correlates the problem set due dates from the calendar with the timing specifications from the general info document. It recognizes that all problem sets follow the Wednesday 11:59 PM pattern, resulting in complete deadline suggestions in a single extraction:

- "PS1 Due (L1) – Wednesday, September 17th, 11:59 PM"
- "PS2 Due (L2, L3) – Wednesday, September 24th, 11:59 PM"
- "PS3 Due (L4, L5) – Wednesday, October 1st, 11:59 PM"
- "PS4 Due (L6, L7) – Wednesday, October 8th, 11:59 PM"
- "PS5 Due (L8, L9) – Wednesday, October 15th, 11:59 PM"

**Step 2.5: Manual Correction of LLM Error** Tim reviews the suggestions and notices that the LLM misread one entry from the calendar. The system shows "PS3 Due (L4, L5) – Wednesday, October 1st" but Tim knows from the calendar that PS3 is actually due on Wednesday, October 2nd. He manually edits the date field for PS3 directly in the interface, changing "October 1st" to "October 2nd". The system applies this change immediately without calling the LLM again:

- "PS3 Due (L4, L5) – Wednesday, October 2nd, 11:59 PM" ✅ (Manually corrected)

The system validates that the combined date-time information is reasonable and flags any potential conflicts or missing timing information.

**Step 3: Website Extraction for 6.1040** Tim then uses the website extraction feature to pull deadlines directly from the 6.1040 course website, specifically the URL pointing to the schedule: [https://61040-fa25.github.io/schedule](https://61040-fa25.github.io/schedule). The system uses `llmExtractFromWebsite` to parse the HTML table, but initially only extracts dates without precise times:

- "Assignment 1: Problem Framing – September 7"
- "Assignment 2: Functional Design – September 28"
- "Pset 1: Concept Design – September 14"
- "Assignment 3: An AI Augmented Concept – October 5"
- "Assignment 4: Backend MVP – October 12"
- "Assignment 5: Backend Complete – October 19"
- "Assignment 6: Full Stack MVP – October 26"
- "Team 5: Full Demo – December 7"

**Step 4: Review and Refinement** Tim reviews all extracted suggestions and notices they're missing specific times. He selects all the suggestions and provides feedback: "All assignments in 6.1040 are due at 11:59 PM. Please add the specific times to all deadline suggestions." The system uses `refineWithFeedback` to update all suggestions with the correct timing:

- "Assignment 1: Problem Framing – September 7, 11:59 PM"
- "Assignment 2: Functional Design – September 28, 11:59 PM"
- "Pset 1: Concept Design – September 14, 11:59 PM"
- "Assignment 3: An AI Augmented Concept – October 5, 11:59 PM"
- "Assignment 4: Backend MVP – October 12, 11:59 PM"
- "Assignment 5: Backend Complete – October 19, 11:59 PM"
- "Assignment 6: Full Stack MVP – October 26, 11:59 PM"
- "Team 5: Full Demo – December 7, 11:59 PM"

**Step 5: Confirmation and Integration** Once satisfied, Tim confirms all high-confidence suggestions with a single click. DueStack calls `ParsedDeadlineSuggestions.confirm` for each suggestion, feeding the data into his calendar system. The deadlines are now organized by course and sorted chronologically. Tim went from scattered PDFs and web pages to a complete, organized deadline system across two courses, with AI handling the tedious parsing work while he maintained control over the final decisions.