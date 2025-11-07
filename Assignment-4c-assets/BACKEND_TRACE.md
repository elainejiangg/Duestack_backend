# Backend Trace - Demo Video Recording

```
UserAuthentication.login { username: 'timthebeaver314', password: 'password123abc' } => {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
}

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5ee9-5678-7d7d-8df4-5e645c9bf7ff' }


Requesting.respond {
  request: '019a5ee9-5678-7d7d-8df4-5e645c9bf7ff',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5ee9-5678-7d7d-8df4-5e645c9bf7ff' }

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator
[Requesting] Received request for path: /DeadlineManagement/_getDeadlinesByCourse

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5ee9-5f37-7ecd-9c7b-2521f72d296f' }


Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  courseId: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/DeadlineManagement/_getDeadlinesByCourse'
} => { request: '019a5ee9-5f3a-709a-8d85-5bbb0dc0cd91' }


Requesting.respond {
  request: '019a5ee9-5f37-7ecd-9c7b-2521f72d296f',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5ee9-5f37-7ecd-9c7b-2521f72d296f' }


Requesting.respond { request: '019a5ee9-5f3a-709a-8d85-5bbb0dc0cd91', results: [] } => { request: '019a5ee9-5f3a-709a-8d85-5bbb0dc0cd91' }

[Requesting] Received request for path: /SuggestionManagement/createExtractionConfig

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  name: 'default-1762528969011',
  modelVersion: 'gemini-2.5-flash',
  basePromptTemplate: 'You are an expert at extracting deadline information from academic documents.\n' +
    '\n' +
    'Extract all deadline information from the provided documents. For each deadline, provide:\n' +
    '- title: A clear, descriptive title of the assignment/task\n' +
    '- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)\n' +
    '- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy\n' +
    '- provenance: Where you found this information in the document\n' +
    '- warnings: Any ambiguities or concerns about the extracted data\n' +
    '\n' +
    'Current year is 2025. If a document only provides month/day without year, assume the current academic year.',
  maxTokens: 8192,
  temperature: 0.1,
  timezone: 'America/New_York',
  path: '/SuggestionManagement/createExtractionConfig'
} => { request: '019a5ee9-c13d-7639-8718-599f2727b5e6' }


SuggestionManagement.createExtractionConfig {
  name: 'default-1762528969011',
  modelVersion: 'gemini-2.5-flash',
  basePromptTemplate: 'You are an expert at extracting deadline information from academic documents.\n' +
    '\n' +
    'Extract all deadline information from the provided documents. For each deadline, provide:\n' +
    '- title: A clear, descriptive title of the assignment/task\n' +
    '- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)\n' +
    '- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy\n' +
    '- provenance: Where you found this information in the document\n' +
    '- warnings: Any ambiguities or concerns about the extracted data\n' +
    '\n' +
    'Current year is 2025. If a document only provides month/day without year, assume the current academic year.',
  maxTokens: 8192,
  temperature: 0.1,
  timezone: 'America/New_York'
} => { config: '019a5ee9-c18d-7b55-883f-8c5c7c8e5438' }


Requesting.respond {
  request: '019a5ee9-c13d-7639-8718-599f2727b5e6',
  config: '019a5ee9-c18d-7b55-883f-8c5c7c8e5438'
} => { request: '019a5ee9-c13d-7639-8718-599f2727b5e6' }

[Requesting] Received request for path: /SuggestionManagement/llmExtractFromWebsite

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  url: 'https://61040-fa25.github.io/schedule',
  config: '019a5ee9-c18d-7b55-883f-8c5c7c8e5438',
  customPrompt: 'Extract deadlines after 11/7.',
  path: '/SuggestionManagement/llmExtractFromWebsite'
} => { request: '019a5ee9-c1c6-72c6-bbeb-85770f260043' }

🔧 Custom website prompt received: Extract deadlines after 11/7.
🤖 Extracting deadlines from website content with Gemini...
✅ Extracted 11 deadline(s)

SuggestionManagement.llmExtractFromWebsite {
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  url: 'https://61040-fa25.github.io/schedule',
  config: '019a5ee9-c18d-7b55-883f-8c5c7c8e5438',
  customPrompt: 'Extract deadlines after 11/7.'
} => {
  suggestions: [
    '019a5ee9-e067-7e47-979d-3a94c7c1928a',
    '019a5ee9-e068-7244-a4f7-af60fac94d63',
    '019a5ee9-e068-76ed-9184-12cb8f1fd914',
    '019a5ee9-e068-7b64-b145-3af678b2ac62',
    '019a5ee9-e068-7d62-8c51-b0eb0a83aa4d',
    '019a5ee9-e068-7422-9291-a6e4c07b798e',
    '019a5ee9-e068-7832-b229-a5a81b23d38a',
    '019a5ee9-e068-7c87-9cb9-440cc9bd7bc6',
    '019a5ee9-e068-7f16-985b-3435cbdbd0be',
    '019a5ee9-e06a-7e22-a7d4-975eb3158d2b',
    '019a5ee9-e06a-76cb-be2f-68d4b8c168bc'
  ]
}


Requesting.respond {
  request: '019a5ee9-c1c6-72c6-bbeb-85770f260043',
  suggestions: [
    '019a5ee9-e067-7e47-979d-3a94c7c1928a',
    '019a5ee9-e068-7244-a4f7-af60fac94d63',
    '019a5ee9-e068-76ed-9184-12cb8f1fd914',
    '019a5ee9-e068-7b64-b145-3af678b2ac62',
    '019a5ee9-e068-7d62-8c51-b0eb0a83aa4d',
    '019a5ee9-e068-7422-9291-a6e4c07b798e',
    '019a5ee9-e068-7832-b229-a5a81b23d38a',
    '019a5ee9-e068-7c87-9cb9-440cc9bd7bc6',
    '019a5ee9-e068-7f16-985b-3435cbdbd0be',
    '019a5ee9-e06a-7e22-a7d4-975eb3158d2b',
    '019a5ee9-e06a-76cb-be2f-68d4b8c168bc'
  ]
} => { request: '019a5ee9-c1c6-72c6-bbeb-85770f260043' }

[Requesting] Received request for path: /SuggestionManagement/_getSuggestionsByUser

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/SuggestionManagement/_getSuggestionsByUser'
} => { request: '019a5ee9-e1ad-76bf-be47-2ed3a0d57587' }


Requesting.respond {
  request: '019a5ee9-e1ad-76bf-be47-2ed3a0d57587',
  results: [
    {
      _id: '019a5ee9-e067-7e47-979d-3a94c7c1928a',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team Contract',
      due: 2025-11-11T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Fri Nov 7 Team Contract Mon Nov 10 (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7244-a4f7-af60fac94d63',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Design Lessons Problem Framing (due noon)',
      due: 2025-11-12T16:00:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Wed Nov 12 L: Design Lessons Problem Framing (due noon) (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-76ed-9184-12cb8f1fd914',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Project Pitch',
      due: 2025-11-17T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Sun Nov 16 Project Pitch (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7b64-b145-3af678b2ac62',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-18T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Mon Nov 17 Team pitches (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7d62-8c51-b0eb0a83aa4d',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Functional Design',
      due: 2025-11-19T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Tue Nov 18 Functional Design (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7422-9291-a6e4c07b798e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-20T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Wed Nov 19 Team pitches (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7832-b229-a5a81b23d38a',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Peer Critique',
      due: 2025-11-22T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Fri Nov 21 Peer Critique (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7c87-9cb9-440cc9bd7bc6',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Alpha',
      due: 2025-11-26T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Tue Nov 25 Checkpoint: Alpha (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e068-7f16-985b-3435cbdbd0be',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Beta',
      due: 2025-12-03T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Tue Dec 2 Checkpoint: Beta (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e06a-7e22-a7d4-975eb3158d2b',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'User Testing',
      due: 2025-12-08T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Sun Dec 7 User Testing (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    },
    {
      _id: '019a5ee9-e06a-76cb-be2f-68d4b8c168bc',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Full Demo & Project Report',
      due: 2025-12-10T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Tue Dec 9 Full Demo & Project Report (Website: https://61040-fa25.github.io/schedule, Course: 019a5ee8-2753-7b74-9fdc-1156855117c4)',
      warnings: []
    }
  ]
} => { request: '019a5ee9-e1ad-76bf-be47-2ed3a0d57587' }

[Requesting] Received request for path: /SuggestionManagement/refineMultipleSuggestions

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestions: [
    '019a5ee9-e067-7e47-979d-3a94c7c1928a',
    '019a5ee9-e068-7244-a4f7-af60fac94d63',
    '019a5ee9-e068-76ed-9184-12cb8f1fd914',
    '019a5ee9-e068-7b64-b145-3af678b2ac62',
    '019a5ee9-e068-7d62-8c51-b0eb0a83aa4d',
    '019a5ee9-e068-7422-9291-a6e4c07b798e',
    '019a5ee9-e068-7832-b229-a5a81b23d38a',
    '019a5ee9-e068-7c87-9cb9-440cc9bd7bc6',
    '019a5ee9-e068-7f16-985b-3435cbdbd0be',
    '019a5ee9-e06a-7e22-a7d4-975eb3158d2b',
    '019a5ee9-e06a-76cb-be2f-68d4b8c168bc'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. The deadline time must be all on 11:59pm.',
  path: '/SuggestionManagement/refineMultipleSuggestions'
} => { request: '019a5eea-287b-7b15-8eb1-e0b1996dc99d' }

🔧 Backend received refinement request
🔧 User: 019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b
🔧 Suggestions count: 11
🔧 Refinement prompt: Extract deadlines after 11/7. The deadline time must be all on 11:59pm.
🔧 Found 11 suggestions in database
🔧 Re-extracting with refinement instructions (Website mode)
🔗 Source URL: https://61040-fa25.github.io/schedule
📝 Final combined prompt with refinement: You are an expert at extracting deadline information from academic documents.

Extract all deadline information from the provided documents. For each deadline, provide:
- title: A clear, descriptive title of the assignment/task
- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)
- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy
- provenance: Where you found this information in the document
- warnings: Any ambiguities or concerns about the extracted data

Current year is 2025. If a document only provides month/day without year, assume the current academic year.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REFINEMENT INSTRUCTIONS - THESE OVERRIDE ALL PREVIOUS RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract deadlines after 11/7. The deadline time must be all on 11:59pm.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME SPECIFICATION RULES:
- "11:59 PM" = "23:59:00" in 24-hour format
- "11:59PM EST" = Use time 23:59:00 with timezone -05:00
- "11:59PM EDT" = Use time 23:59:00 with timezone -04:00

Apply these refinement instructions to EVERY extracted deadline that matches the criteria.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Extracting deadlines from website content with Gemini...
✅ Extracted 9 deadline(s)
🗑️ Deleted 11 old suggestions
📊 RAW GEMINI OUTPUT:
  1. Project Pitch: 2025-11-16T23:59:00-04:00 (raw string from Gemini)
  2. Team pitches: 2025-11-17T23:59:00-04:00 (raw string from Gemini)
  3. Functional Design: 2025-11-18T23:59:00-04:00 (raw string from Gemini)
  4. Team pitches: 2025-11-19T23:59:00-04:00 (raw string from Gemini)
  5. Peer Critique: 2025-11-23T23:59:00-04:00 (raw string from Gemini)
  6. Checkpoint: Alpha: 2025-11-25T23:59:00-04:00 (raw string from Gemini)
  7. Checkpoint: Beta: 2025-12-02T23:59:00-04:00 (raw string from Gemini)
  8. User Testing: 2025-12-07T23:59:00-04:00 (raw string from Gemini)
  9. Full Demo & Project Report: 2025-12-09T23:59:00-04:00 (raw string from Gemini)
🕐 Time override disabled - Gemini handles it via prompt
🔍 Processing: Project Pitch - Gemini returned: 2025-11-16T23:59:00-04:00
🔍 Processing: Team pitches - Gemini returned: 2025-11-17T23:59:00-04:00
🔍 Processing: Functional Design - Gemini returned: 2025-11-18T23:59:00-04:00
🔍 Processing: Team pitches - Gemini returned: 2025-11-19T23:59:00-04:00
🔍 Processing: Peer Critique - Gemini returned: 2025-11-23T23:59:00-04:00
🔍 Processing: Checkpoint: Alpha - Gemini returned: 2025-11-25T23:59:00-04:00
🔍 Processing: Checkpoint: Beta - Gemini returned: 2025-12-02T23:59:00-04:00
🔍 Processing: User Testing - Gemini returned: 2025-12-07T23:59:00-04:00
🔍 Processing: Full Demo & Project Report - Gemini returned: 2025-12-09T23:59:00-04:00
✅ Created 9 new refined suggestions

SuggestionManagement.refineMultipleSuggestions {
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  suggestions: [
    '019a5ee9-e067-7e47-979d-3a94c7c1928a',
    '019a5ee9-e068-7244-a4f7-af60fac94d63',
    '019a5ee9-e068-76ed-9184-12cb8f1fd914',
    '019a5ee9-e068-7b64-b145-3af678b2ac62',
    '019a5ee9-e068-7d62-8c51-b0eb0a83aa4d',
    '019a5ee9-e068-7422-9291-a6e4c07b798e',
    '019a5ee9-e068-7832-b229-a5a81b23d38a',
    '019a5ee9-e068-7c87-9cb9-440cc9bd7bc6',
    '019a5ee9-e068-7f16-985b-3435cbdbd0be',
    '019a5ee9-e06a-7e22-a7d4-975eb3158d2b',
    '019a5ee9-e06a-76cb-be2f-68d4b8c168bc'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. The deadline time must be all on 11:59pm.'
} => {
  suggestions: [
    '019a5eea-40f6-758a-bcae-0f49a187f528',
    '019a5eea-40f6-768c-8e6f-766918f36a86',
    '019a5eea-40f6-7061-aeeb-fdc3f3ddc365',
    '019a5eea-40f6-7ec1-bb0e-3d87046f8d15',
    '019a5eea-40f6-74c7-b6a3-8fd700aeb3e6',
    '019a5eea-40f6-714a-bc84-71cc2ad9defe',
    '019a5eea-40f6-7b5d-9a7d-37901e2e69dc',
    '019a5eea-40f6-75a2-9fb4-3cf3acd64c4b',
    '019a5eea-40f6-7f2c-9a30-05a28c0724f2'
  ]
}


Requesting.respond {
  request: '019a5eea-287b-7b15-8eb1-e0b1996dc99d',
  suggestions: [
    '019a5eea-40f6-758a-bcae-0f49a187f528',
    '019a5eea-40f6-768c-8e6f-766918f36a86',
    '019a5eea-40f6-7061-aeeb-fdc3f3ddc365',
    '019a5eea-40f6-7ec1-bb0e-3d87046f8d15',
    '019a5eea-40f6-74c7-b6a3-8fd700aeb3e6',
    '019a5eea-40f6-714a-bc84-71cc2ad9defe',
    '019a5eea-40f6-7b5d-9a7d-37901e2e69dc',
    '019a5eea-40f6-75a2-9fb4-3cf3acd64c4b',
    '019a5eea-40f6-7f2c-9a30-05a28c0724f2'
  ]
} => { request: '019a5eea-287b-7b15-8eb1-e0b1996dc99d' }

[Requesting] Received request for path: /SuggestionManagement/_getSuggestionsByUser

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/SuggestionManagement/_getSuggestionsByUser'
} => { request: '019a5eea-413d-7447-85d9-08c7c8db5fc5' }


Requesting.respond {
  request: '019a5eea-413d-7447-85d9-08c7c8db5fc5',
  results: [
    {
      _id: '019a5eea-40f6-758a-bcae-0f49a187f528',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Project Pitch',
      due: 2025-11-17T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Project Pitch Mon Nov 17 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-768c-8e6f-766918f36a86',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-18T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Team pitches Tue Nov 18 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-7061-aeeb-fdc3f3ddc365',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Functional Design',
      due: 2025-11-19T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Functional Design Wed Nov 19 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-7ec1-bb0e-3d87046f8d15',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-20T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Team pitches Thu Nov 20 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-74c7-b6a3-8fd700aeb3e6',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Peer Critique',
      due: 2025-11-24T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Peer Critique Mon Nov 24 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-714a-bc84-71cc2ad9defe',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Alpha',
      due: 2025-11-26T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Checkpoint: Alpha Wed Nov 26 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-7b5d-9a7d-37901e2e69dc',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Beta',
      due: 2025-12-03T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Checkpoint: Beta Wed Dec 3 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-75a2-9fb4-3cf3acd64c4b',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'User Testing',
      due: 2025-12-08T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: User Testing Mon Dec 8 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-40f6-7f2c-9a30-05a28c0724f2',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Full Demo & Project Report',
      due: 2025-12-10T03:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Schedule | 6.1040 Fall 2025: Full Demo & Project Report Wed Dec 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    }
  ]
} => { request: '019a5eea-413d-7447-85d9-08c7c8db5fc5' }

[Requesting] Received request for path: /SuggestionManagement/refineMultipleSuggestions

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestions: [
    '019a5eea-40f6-758a-bcae-0f49a187f528',
    '019a5eea-40f6-768c-8e6f-766918f36a86',
    '019a5eea-40f6-7061-aeeb-fdc3f3ddc365',
    '019a5eea-40f6-7ec1-bb0e-3d87046f8d15',
    '019a5eea-40f6-74c7-b6a3-8fd700aeb3e6',
    '019a5eea-40f6-714a-bc84-71cc2ad9defe',
    '019a5eea-40f6-7b5d-9a7d-37901e2e69dc',
    '019a5eea-40f6-75a2-9fb4-3cf3acd64c4b',
    '019a5eea-40f6-7f2c-9a30-05a28c0724f2'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. The deadline time must be all on 11:59pm EST.',
  path: '/SuggestionManagement/refineMultipleSuggestions'
} => { request: '019a5eea-5f80-710a-889d-48a48705ab8f' }

🔧 Backend received refinement request
🔧 User: 019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b
🔧 Suggestions count: 9
🔧 Refinement prompt: Extract deadlines after 11/7. The deadline time must be all on 11:59pm EST.
🔧 Found 9 suggestions in database
🔧 Re-extracting with refinement instructions (Website mode)
🔗 Source URL: https://61040-fa25.github.io/schedule
📝 Final combined prompt with refinement: You are an expert at extracting deadline information from academic documents.

Extract all deadline information from the provided documents. For each deadline, provide:
- title: A clear, descriptive title of the assignment/task
- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)
- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy
- provenance: Where you found this information in the document
- warnings: Any ambiguities or concerns about the extracted data

Current year is 2025. If a document only provides month/day without year, assume the current academic year.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REFINEMENT INSTRUCTIONS - THESE OVERRIDE ALL PREVIOUS RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract deadlines after 11/7. The deadline time must be all on 11:59pm EST.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME SPECIFICATION RULES:
- "11:59 PM" = "23:59:00" in 24-hour format
- "11:59PM EST" = Use time 23:59:00 with timezone -05:00
- "11:59PM EDT" = Use time 23:59:00 with timezone -04:00

Apply these refinement instructions to EVERY extracted deadline that matches the criteria.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🤖 Extracting deadlines from website content with Gemini...
✅ Extracted 9 deadline(s)
🗑️ Deleted 9 old suggestions
📊 RAW GEMINI OUTPUT:
  1. Team Contract: 2025-11-10T23:59:00-05:00 (raw string from Gemini)
  2. Project Pitch: 2025-11-16T23:59:00-05:00 (raw string from Gemini)
  3. Team pitches: 2025-11-18T23:59:00-05:00 (raw string from Gemini)
  4. Functional Design: 2025-11-19T23:59:00-05:00 (raw string from Gemini)
  5. Team pitches: 2025-11-19T23:59:00-05:00 (raw string from Gemini)
  6. Peer Critique: 2025-11-24T23:59:00-05:00 (raw string from Gemini)
  7. Checkpoint: Alpha: 2025-11-26T23:59:00-05:00 (raw string from Gemini)
  8. User Testing: 2025-12-07T23:59:00-05:00 (raw string from Gemini)
  9. Full Demo & Project Report: 2025-12-10T23:59:00-05:00 (raw string from Gemini)
🕐 Time override disabled - Gemini handles it via prompt
🔍 Processing: Team Contract - Gemini returned: 2025-11-10T23:59:00-05:00
🔍 Processing: Project Pitch - Gemini returned: 2025-11-16T23:59:00-05:00
🔍 Processing: Team pitches - Gemini returned: 2025-11-18T23:59:00-05:00
🔍 Processing: Functional Design - Gemini returned: 2025-11-19T23:59:00-05:00
🔍 Processing: Team pitches - Gemini returned: 2025-11-19T23:59:00-05:00
🔍 Processing: Peer Critique - Gemini returned: 2025-11-24T23:59:00-05:00
🔍 Processing: Checkpoint: Alpha - Gemini returned: 2025-11-26T23:59:00-05:00
🔍 Processing: User Testing - Gemini returned: 2025-12-07T23:59:00-05:00
🔍 Processing: Full Demo & Project Report - Gemini returned: 2025-12-10T23:59:00-05:00
✅ Created 9 new refined suggestions

SuggestionManagement.refineMultipleSuggestions {
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  suggestions: [
    '019a5eea-40f6-758a-bcae-0f49a187f528',
    '019a5eea-40f6-768c-8e6f-766918f36a86',
    '019a5eea-40f6-7061-aeeb-fdc3f3ddc365',
    '019a5eea-40f6-7ec1-bb0e-3d87046f8d15',
    '019a5eea-40f6-74c7-b6a3-8fd700aeb3e6',
    '019a5eea-40f6-714a-bc84-71cc2ad9defe',
    '019a5eea-40f6-7b5d-9a7d-37901e2e69dc',
    '019a5eea-40f6-75a2-9fb4-3cf3acd64c4b',
    '019a5eea-40f6-7f2c-9a30-05a28c0724f2'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. The deadline time must be all on 11:59pm EST.'
} => {
  suggestions: [
    '019a5eea-731c-75b9-8287-6e061aaf2b52',
    '019a5eea-731c-78fe-8a6d-97dfd51f5792',
    '019a5eea-731c-7ccf-8e22-6932ce0a6111',
    '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
    '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
    '019a5eea-731c-7b45-a67b-0931fad316c2',
    '019a5eea-731c-7b39-88f7-d015c915620e',
    '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
    '019a5eea-731c-7840-acd8-b0777ca69a82'
  ]
}


Requesting.respond {
  request: '019a5eea-5f80-710a-889d-48a48705ab8f',
  suggestions: [
    '019a5eea-731c-75b9-8287-6e061aaf2b52',
    '019a5eea-731c-78fe-8a6d-97dfd51f5792',
    '019a5eea-731c-7ccf-8e22-6932ce0a6111',
    '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
    '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
    '019a5eea-731c-7b45-a67b-0931fad316c2',
    '019a5eea-731c-7b39-88f7-d015c915620e',
    '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
    '019a5eea-731c-7840-acd8-b0777ca69a82'
  ]
} => { request: '019a5eea-5f80-710a-889d-48a48705ab8f' }

[Requesting] Received request for path: /SuggestionManagement/_getSuggestionsByUser

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/SuggestionManagement/_getSuggestionsByUser'
} => { request: '019a5eea-7365-7532-9481-319bb70a9bd1' }


Requesting.respond {
  request: '019a5eea-7365-7532-9481-319bb70a9bd1',
  results: [
    {
      _id: '019a5eea-731c-75b9-8287-6e061aaf2b52',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team Contract',
      due: 2025-11-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 7 Team Contract Mon Nov 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78fe-8a6d-97dfd51f5792',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Project Pitch',
      due: 2025-11-17T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Nov 16 Project Pitch Mon Nov 17 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7ccf-8e22-6932ce0a6111',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-19T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Mon Nov 17 Team pitches Tue Nov 18 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Functional Design',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 18 Functional Design Wed Nov 19 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Wed Nov 19 Team pitches Thu Nov 20 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b45-a67b-0931fad316c2',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Peer Critique',
      due: 2025-11-25T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 21 Peer Critique Mon Nov 24 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b39-88f7-d015c915620e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Alpha',
      due: 2025-11-27T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 25 Checkpoint: Alpha Wed Nov 26 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'User Testing',
      due: 2025-12-08T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Dec 7 User Testing Mon Dec 8 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7840-acd8-b0777ca69a82',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Full Demo & Project Report',
      due: 2025-12-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Dec 9 Full Demo & Project Report Wed Dec 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    }
  ]
} => { request: '019a5eea-7365-7532-9481-319bb70a9bd1' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-75b9-8287-6e061aaf2b52',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-9c5c-70ab-bc08-5035eac123b3' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-75b9-8287-6e061aaf2b52',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team Contract',
  due: 2025-11-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-9c5c-70ab-bc08-5035eac123b3',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team Contract',
  due: 2025-11-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-9c5c-70ab-bc08-5035eac123b3' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team Contract',
  due: '2025-11-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-9cd9-7266-ae42-c1c81b196f8f' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team Contract',
  due: '2025-11-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-9d07-79e6-8e64-6c77f351cc7f' }


Requesting.respond {
  request: '019a5eea-9cd9-7266-ae42-c1c81b196f8f',
  deadline: '019a5eea-9d07-79e6-8e64-6c77f351cc7f'
} => { request: '019a5eea-9cd9-7266-ae42-c1c81b196f8f' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-78fe-8a6d-97dfd51f5792',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-9d3e-7a11-9a33-e700589279e7' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-78fe-8a6d-97dfd51f5792',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Project Pitch',
  due: 2025-11-17T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-9d3e-7a11-9a33-e700589279e7',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Project Pitch',
  due: 2025-11-17T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-9d3e-7a11-9a33-e700589279e7' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Project Pitch',
  due: '2025-11-17T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-9db9-7266-99a7-f902789cb633' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Project Pitch',
  due: '2025-11-17T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-9de5-7fd1-8225-5662c61ba9be' }


Requesting.respond {
  request: '019a5eea-9db9-7266-99a7-f902789cb633',
  deadline: '019a5eea-9de5-7fd1-8225-5662c61ba9be'
} => { request: '019a5eea-9db9-7266-99a7-f902789cb633' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7ccf-8e22-6932ce0a6111',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-9e1b-7dd1-bbff-d9e007264b2b' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7ccf-8e22-6932ce0a6111',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: 2025-11-19T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-9e1b-7dd1-bbff-d9e007264b2b',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: 2025-11-19T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-9e1b-7dd1-bbff-d9e007264b2b' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: '2025-11-19T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-9e92-7b0b-abc5-73f140e14e22' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: '2025-11-19T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-9ebe-772b-8081-c411abcfec9c' }


Requesting.respond {
  request: '019a5eea-9e92-7b0b-abc5-73f140e14e22',
  deadline: '019a5eea-9ebe-772b-8081-c411abcfec9c'
} => { request: '019a5eea-9e92-7b0b-abc5-73f140e14e22' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-9ef6-727a-bb6a-6785e7f22b71' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Functional Design',
  due: 2025-11-20T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-9ef6-727a-bb6a-6785e7f22b71',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Functional Design',
  due: 2025-11-20T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-9ef6-727a-bb6a-6785e7f22b71' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Functional Design',
  due: '2025-11-20T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-9f6b-75ab-b7b5-0ac18469a3f2' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Functional Design',
  due: '2025-11-20T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-9f9a-7402-8a83-429ed887156a' }


Requesting.respond {
  request: '019a5eea-9f6b-75ab-b7b5-0ac18469a3f2',
  deadline: '019a5eea-9f9a-7402-8a83-429ed887156a'
} => { request: '019a5eea-9f6b-75ab-b7b5-0ac18469a3f2' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-9fd6-7a32-896d-169d8abf577a' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: 2025-11-20T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-9fd6-7a32-896d-169d8abf577a',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: 2025-11-20T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-9fd6-7a32-896d-169d8abf577a' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: '2025-11-20T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-a052-78e1-8b0a-2b24273ec637' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Team pitches',
  due: '2025-11-20T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-a085-764f-8c50-2843b2084799' }


Requesting.respond {
  request: '019a5eea-a052-78e1-8b0a-2b24273ec637',
  deadline: '019a5eea-a085-764f-8c50-2843b2084799'
} => { request: '019a5eea-a052-78e1-8b0a-2b24273ec637' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7b45-a67b-0931fad316c2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-a0bf-7c34-bed0-ba0904982b6b' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7b45-a67b-0931fad316c2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Peer Critique',
  due: 2025-11-25T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-a0bf-7c34-bed0-ba0904982b6b',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Peer Critique',
  due: 2025-11-25T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-a0bf-7c34-bed0-ba0904982b6b' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Peer Critique',
  due: '2025-11-25T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-a136-7e00-aab9-a7a6b2894097' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Peer Critique',
  due: '2025-11-25T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-a163-7b0d-a8c7-026b6db00d9c' }


Requesting.respond {
  request: '019a5eea-a136-7e00-aab9-a7a6b2894097',
  deadline: '019a5eea-a163-7b0d-a8c7-026b6db00d9c'
} => { request: '019a5eea-a136-7e00-aab9-a7a6b2894097' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7b39-88f7-d015c915620e',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-a19c-7b23-988a-4d21e8c2f641' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7b39-88f7-d015c915620e',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Checkpoint: Alpha',
  due: 2025-11-27T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-a19c-7b23-988a-4d21e8c2f641',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Checkpoint: Alpha',
  due: 2025-11-27T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-a19c-7b23-988a-4d21e8c2f641' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Checkpoint: Alpha',
  due: '2025-11-27T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-a221-7909-86c4-aa560aff46b7' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Checkpoint: Alpha',
  due: '2025-11-27T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-a24e-737e-b2c1-ca4e9c394cb4' }


Requesting.respond {
  request: '019a5eea-a221-7909-86c4-aa560aff46b7',
  deadline: '019a5eea-a24e-737e-b2c1-ca4e9c394cb4'
} => { request: '019a5eea-a221-7909-86c4-aa560aff46b7' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-a284-7631-a5d3-d6ff9b588365' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'User Testing',
  due: 2025-12-08T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-a284-7631-a5d3-d6ff9b588365',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'User Testing',
  due: 2025-12-08T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-a284-7631-a5d3-d6ff9b588365' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'User Testing',
  due: '2025-12-08T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-a2fa-7706-9951-00c278b1441a' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'User Testing',
  due: '2025-12-08T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-a325-70a0-ad50-afbc33b9783b' }


Requesting.respond {
  request: '019a5eea-a2fa-7706-9951-00c278b1441a',
  deadline: '019a5eea-a325-70a0-ad50-afbc33b9783b'
} => { request: '019a5eea-a2fa-7706-9951-00c278b1441a' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eea-731c-7840-acd8-b0777ca69a82',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eea-a35d-733e-a550-481c10a79f6a' }


SuggestionManagement.confirm {
  suggestion: '019a5eea-731c-7840-acd8-b0777ca69a82',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Full Demo & Project Report',
  due: 2025-12-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
}


Requesting.respond {
  request: '019a5eea-a35d-733e-a550-481c10a79f6a',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Full Demo & Project Report',
  due: 2025-12-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://61040-fa25.github.io/schedule'
} => { request: '019a5eea-a35d-733e-a550-481c10a79f6a' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Full Demo & Project Report',
  due: '2025-12-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://61040-fa25.github.io/schedule',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eea-a3f1-7de5-9943-a3f43857bc63' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  title: 'Full Demo & Project Report',
  due: '2025-12-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eea-a41c-7f46-b35b-72e5f04d42bb' }


Requesting.respond {
  request: '019a5eea-a3f1-7de5-9943-a3f43857bc63',
  deadline: '019a5eea-a41c-7f46-b35b-72e5f04d42bb'
} => { request: '019a5eea-a3f1-7de5-9943-a3f43857bc63' }

[Requesting] Received request for path: /DeadlineManagement/_getDeadlinesByCourse

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  courseId: '019a5ee8-2753-7b74-9fdc-1156855117c4',
  path: '/DeadlineManagement/_getDeadlinesByCourse'
} => { request: '019a5eea-a458-7ab1-80b3-24c8c41e48f7' }


Requesting.respond {
  request: '019a5eea-a458-7ab1-80b3-24c8c41e48f7',
  results: [
    {
      _id: '019a5eea-9d07-79e6-8e64-6c77f351cc7f',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team Contract',
      due: '2025-11-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-9de5-7fd1-8225-5662c61ba9be',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Project Pitch',
      due: '2025-11-17T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-9ebe-772b-8081-c411abcfec9c',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team pitches',
      due: '2025-11-19T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-9f9a-7402-8a83-429ed887156a',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Functional Design',
      due: '2025-11-20T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a085-764f-8c50-2843b2084799',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team pitches',
      due: '2025-11-20T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a163-7b0d-a8c7-026b6db00d9c',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Peer Critique',
      due: '2025-11-25T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a24e-737e-b2c1-ca4e9c394cb4',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Checkpoint: Alpha',
      due: '2025-11-27T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a325-70a0-ad50-afbc33b9783b',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'User Testing',
      due: '2025-12-08T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a41c-7f46-b35b-72e5f04d42bb',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Full Demo & Project Report',
      due: '2025-12-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    }
  ]
} => { request: '019a5eea-a458-7ab1-80b3-24c8c41e48f7' }

[Requesting] Received request for path: /DeadlineManagement/setStatus

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  deadline: '019a5eea-9d07-79e6-8e64-6c77f351cc7f',
  status: 'IN_PROGRESS',
  path: '/DeadlineManagement/setStatus'
} => { request: '019a5eea-bc86-728e-865b-060b6eb9959c' }


DeadlineManagement.setStatus {
  deadline: '019a5eea-9d07-79e6-8e64-6c77f351cc7f',
  status: 'IN_PROGRESS'
} => {}


Requesting.respond {
  request: '019a5eea-bc86-728e-865b-060b6eb9959c',
  msg: 'Deadline status updated successfully'
} => { request: '019a5eea-bc86-728e-865b-060b6eb9959c' }

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5eea-ce16-786b-a08e-51f2684e8aad' }


Requesting.respond {
  request: '019a5eea-ce16-786b-a08e-51f2684e8aad',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5eea-ce16-786b-a08e-51f2684e8aad' }

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator
[Requesting] Received request for path: /DeadlineManagement/_getDeadlinesByCourse

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  courseId: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  path: '/DeadlineManagement/_getDeadlinesByCourse'
} => { request: '019a5eea-d6c5-703b-9083-38414469a557' }


Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5eea-d6c3-7679-baf1-829e08f313c6' }


Requesting.respond { request: '019a5eea-d6c5-703b-9083-38414469a557', results: [] } => { request: '019a5eea-d6c5-703b-9083-38414469a557' }


Requesting.respond {
  request: '019a5eea-d6c3-7679-baf1-829e08f313c6',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5eea-d6c3-7679-baf1-829e08f313c6' }

[Requesting] Received request for path: /SuggestionManagement/createExtractionConfig

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  name: 'default-1762529080995',
  modelVersion: 'gemini-2.5-flash',
  basePromptTemplate: 'You are an expert at extracting deadline information from academic documents.\n' +
    '\n' +
    'Extract all deadline information from the provided documents. For each deadline, provide:\n' +
    '- title: A clear, descriptive title of the assignment/task\n' +
    '- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)\n' +
    '- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy\n' +
    '- provenance: Where you found this information in the document\n' +
    '- warnings: Any ambiguities or concerns about the extracted data\n' +
    '\n' +
    'Current year is 2025. If a document only provides month/day without year, assume the current academic year.',
  maxTokens: 8192,
  temperature: 0.1,
  timezone: 'America/New_York',
  path: '/SuggestionManagement/createExtractionConfig'
} => { request: '019a5eeb-76a9-7811-9421-3ebc49a5035c' }


SuggestionManagement.createExtractionConfig {
  name: 'default-1762529080995',
  modelVersion: 'gemini-2.5-flash',
  basePromptTemplate: 'You are an expert at extracting deadline information from academic documents.\n' +
    '\n' +
    'Extract all deadline information from the provided documents. For each deadline, provide:\n' +
    '- title: A clear, descriptive title of the assignment/task\n' +
    '- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)\n' +
    '- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy\n' +
    '- provenance: Where you found this information in the document\n' +
    '- warnings: Any ambiguities or concerns about the extracted data\n' +
    '\n' +
    'Current year is 2025. If a document only provides month/day without year, assume the current academic year.',
  maxTokens: 8192,
  temperature: 0.1,
  timezone: 'America/New_York'
} => { config: '019a5eeb-76f6-7022-85da-457a61021b6c' }


Requesting.respond {
  request: '019a5eeb-76a9-7811-9421-3ebc49a5035c',
  config: '019a5eeb-76f6-7022-85da-457a61021b6c'
} => { request: '019a5eeb-76a9-7811-9421-3ebc49a5035c' }

[Requesting] Received request for path: /SuggestionManagement/llmExtractFromPDFUrls

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  pdfUrls: [
    'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing',
    'https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
  ],
  config: '019a5eeb-76f6-7022-85da-457a61021b6c',
  customPrompt: 'Extract deadline after 11/7.',
  path: '/SuggestionManagement/llmExtractFromPDFUrls'
} => { request: '019a5eeb-7731-72a1-ad84-47b9afe98a8e' }

🔧 Custom prompt received: Extract deadline after 11/7.
📝 Final combined prompt: You are an expert at extracting deadline information from academic documents.

Extract all deadline information from the provided documents. For each deadline, provide:
- title: A clear, descriptive title of the assignment/task
- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)
- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy
- provenance: Where you found this information in the document
- warnings: Any ambiguities or concerns about the extracted data

Current year is 2025. If a document only provides month/day without year, assume the current academic year.

Additional Instructions:
Extract deadline after 11/7.
📄 Uploading 2 document(s) to Gemini File API...
✅ Uploaded 2 file(s)
🤖 Extracting deadlines with Gemini...
✅ Extracted 4 deadline(s)

SuggestionManagement.llmExtractFromPDFUrls {
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  pdfUrls: [
    'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing',
    'https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
  ],
  config: '019a5eeb-76f6-7022-85da-457a61021b6c',
  customPrompt: 'Extract deadline after 11/7.'
} => {
  suggestions: [
    '019a5eeb-9aa6-75a7-bd3d-b8aa4d2bd09e',
    '019a5eeb-9aa6-7cc2-a195-871d4c9d717e',
    '019a5eeb-9aa6-79e8-94c0-17d47fb72b5e',
    '019a5eeb-9aa6-768f-af7d-de3175603c6c'
  ]
}


Requesting.respond {
  request: '019a5eeb-7731-72a1-ad84-47b9afe98a8e',
  suggestions: [
    '019a5eeb-9aa6-75a7-bd3d-b8aa4d2bd09e',
    '019a5eeb-9aa6-7cc2-a195-871d4c9d717e',
    '019a5eeb-9aa6-79e8-94c0-17d47fb72b5e',
    '019a5eeb-9aa6-768f-af7d-de3175603c6c'
  ]
} => { request: '019a5eeb-7731-72a1-ad84-47b9afe98a8e' }

[Requesting] Received request for path: /SuggestionManagement/_getSuggestionsByUser

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/SuggestionManagement/_getSuggestionsByUser'
} => { request: '019a5eeb-9ae4-7cc7-a758-355fc5b2b48d' }


Requesting.respond {
  request: '019a5eeb-9ae4-7cc7-a758-355fc5b2b48d',
  results: [
    {
      _id: '019a5eea-731c-75b9-8287-6e061aaf2b52',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team Contract',
      due: 2025-11-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 7 Team Contract Mon Nov 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78fe-8a6d-97dfd51f5792',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Project Pitch',
      due: 2025-11-17T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Nov 16 Project Pitch Mon Nov 17 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7ccf-8e22-6932ce0a6111',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-19T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Mon Nov 17 Team pitches Tue Nov 18 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Functional Design',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 18 Functional Design Wed Nov 19 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Wed Nov 19 Team pitches Thu Nov 20 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b45-a67b-0931fad316c2',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Peer Critique',
      due: 2025-11-25T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 21 Peer Critique Mon Nov 24 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b39-88f7-d015c915620e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Alpha',
      due: 2025-11-27T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 25 Checkpoint: Alpha Wed Nov 26 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'User Testing',
      due: 2025-12-08T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Dec 7 User Testing Mon Dec 8 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7840-acd8-b0777ca69a82',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Full Demo & Project Report',
      due: 2025-12-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Dec 9 Full Demo & Project Report Wed Dec 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eeb-9aa6-75a7-bd3d-b8aa4d2bd09e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'Quiz 2: MITX Lectures 8-14',
      due: 2025-11-13T04:00:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 0.95,
      extractionMethod: 'LLM',
      provenance: '11/13\n' +
        'Quiz 2: MITX\n' +
        'Lectures 8-14 (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Documents: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: []
    },
    {
      _id: '019a5eeb-9aa6-7cc2-a195-871d4c9d717e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'Lecture 22: MITx More on the Poisson Process PS8 Due',
      due: 2025-11-26T04:00:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 0.95,
      extractionMethod: 'LLM',
      provenance: '11/26\n' +
        'Lecture 22: MITx\n' +
        'More on the Poisson\n' +
        'Process\n' +
        'PS8 Due (L18, L19) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Documents: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: []
    },
    {
      _id: '019a5eeb-9aa6-79e8-94c0-17d47fb72b5e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'Lecture 24: MITx Steady-State Behavior of Markov Chains PS9 Due',
      due: 2025-12-04T04:00:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 0.95,
      extractionMethod: 'LLM',
      provenance: '12/4\n' +
        'Lecture 24: MITx\n' +
        'Steady-State\n' +
        'Behavior of Markov\n' +
        'Chains\n' +
        'PS9 Due (L20-L22) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Documents: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: []
    },
    {
      _id: '019a5eeb-9aa6-768f-af7d-de3175603c6c',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: "Lecture 26: Review for final by TA's PS10 Due",
      due: 2025-12-10T04:00:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 0.95,
      extractionMethod: 'LLM',
      provenance: '12/10\n' +
        'Lecture 26: Review\n' +
        "for final by TA's\n" +
        'PS10 Due (L23-L25) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Documents: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: []
    }
  ]
} => { request: '019a5eeb-9ae4-7cc7-a758-355fc5b2b48d' }

[Requesting] Received request for path: /SuggestionManagement/refineMultipleSuggestions

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestions: [
    '019a5eeb-9aa6-75a7-bd3d-b8aa4d2bd09e',
    '019a5eeb-9aa6-7cc2-a195-871d4c9d717e',
    '019a5eeb-9aa6-79e8-94c0-17d47fb72b5e',
    '019a5eeb-9aa6-768f-af7d-de3175603c6c'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. Only include psets. All deadline also have be on 11:59pm EST.',
  path: '/SuggestionManagement/refineMultipleSuggestions'
} => { request: '019a5eec-1f72-7536-8e34-2fed553ae294' }

🔧 Backend received refinement request
🔧 User: 019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b
🔧 Suggestions count: 4
🔧 Refinement prompt: Extract deadlines after 11/7. Only include psets. All deadline also have be on 11:59pm EST.
🔧 Found 4 suggestions in database
🔧 Re-extracting with refinement instructions (Document mode)
🔗 Source URL: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing
📝 Final combined prompt with refinement: You are an expert at extracting deadline information from academic documents.

Extract all deadline information from the provided documents. For each deadline, provide:
- title: A clear, descriptive title of the assignment/task
- due: The due date in ISO 8601 format (YYYY-MM-DDTHH:mm:ss-04:00)
- confidence: Your confidence level (0.0 to 1.0) in the extraction accuracy
- provenance: Where you found this information in the document
- warnings: Any ambiguities or concerns about the extracted data

Current year is 2025. If a document only provides month/day without year, assume the current academic year.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL REFINEMENT INSTRUCTIONS - THESE OVERRIDE ALL PREVIOUS RULES:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Extract deadlines after 11/7. Only include psets. All deadline also have be on 11:59pm EST.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

TIME SPECIFICATION RULES:
- "11:59 PM" = "23:59:00" in 24-hour format
- "11:59PM EST" = Use time 23:59:00 with timezone -05:00
- "11:59PM EDT" = Use time 23:59:00 with timezone -04:00

Apply these refinement instructions to EVERY extracted deadline that matches the criteria.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📄 Uploading 2 document(s) to Gemini File API...
✅ Uploaded 2 file(s)
🤖 Extracting deadlines with Gemini...
✅ Extracted 3 deadline(s)
🗑️ Deleted 4 old suggestions
📊 RAW GEMINI OUTPUT:
  1. PS8 Due: 2025-11-26T23:59:00-05:00 (raw string from Gemini)
  2. PS9 Due: 2025-12-03T23:59:00-05:00 (raw string from Gemini)
  3. PS10 Due: 2025-12-10T23:59:00-05:00 (raw string from Gemini)
🕐 Time override disabled - Gemini handles it via prompt
🔍 Processing: PS8 Due - Gemini returned: 2025-11-26T23:59:00-05:00
🔍 Processing: PS9 Due - Gemini returned: 2025-12-03T23:59:00-05:00
🔍 Processing: PS10 Due - Gemini returned: 2025-12-10T23:59:00-05:00
✅ Created 3 new refined suggestions

SuggestionManagement.refineMultipleSuggestions {
  user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  suggestions: [
    '019a5eeb-9aa6-75a7-bd3d-b8aa4d2bd09e',
    '019a5eeb-9aa6-7cc2-a195-871d4c9d717e',
    '019a5eeb-9aa6-79e8-94c0-17d47fb72b5e',
    '019a5eeb-9aa6-768f-af7d-de3175603c6c'
  ],
  refinementPrompt: 'Extract deadlines after 11/7. Only include psets. All deadline also have be on 11:59pm EST.'
} => {
  suggestions: [
    '019a5eec-3e38-7e2a-8f13-c3e48744bc8b',
    '019a5eec-3e39-7a4c-bf7e-f7aba8e1a0ad',
    '019a5eec-3e39-7560-b018-616e12c39816'
  ]
}


Requesting.respond {
  request: '019a5eec-1f72-7536-8e34-2fed553ae294',
  suggestions: [
    '019a5eec-3e38-7e2a-8f13-c3e48744bc8b',
    '019a5eec-3e39-7a4c-bf7e-f7aba8e1a0ad',
    '019a5eec-3e39-7560-b018-616e12c39816'
  ]
} => { request: '019a5eec-1f72-7536-8e34-2fed553ae294' }

[Requesting] Received request for path: /SuggestionManagement/_getSuggestionsByUser

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/SuggestionManagement/_getSuggestionsByUser'
} => { request: '019a5eec-3e73-7905-88a3-7c5baab5bc8a' }


Requesting.respond {
  request: '019a5eec-3e73-7905-88a3-7c5baab5bc8a',
  results: [
    {
      _id: '019a5eea-731c-75b9-8287-6e061aaf2b52',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team Contract',
      due: 2025-11-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 7 Team Contract Mon Nov 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78fe-8a6d-97dfd51f5792',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Project Pitch',
      due: 2025-11-17T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Nov 16 Project Pitch Mon Nov 17 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7ccf-8e22-6932ce0a6111',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-19T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Mon Nov 17 Team pitches Tue Nov 18 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7bf4-96cb-ae5c5a16c1b8',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Functional Design',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 18 Functional Design Wed Nov 19 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7e3e-95e8-cfdb4dbcca54',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Team pitches',
      due: 2025-11-20T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Wed Nov 19 Team pitches Thu Nov 20 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b45-a67b-0931fad316c2',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Peer Critique',
      due: 2025-11-25T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Fri Nov 21 Peer Critique Mon Nov 24 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7b39-88f7-d015c915620e',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Checkpoint: Alpha',
      due: 2025-11-27T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Nov 25 Checkpoint: Alpha Wed Nov 26 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-78b3-b8bc-5ee4a94be8b0',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'User Testing',
      due: 2025-12-08T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Sun Dec 7 User Testing Mon Dec 8 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eea-731c-7840-acd8-b0777ca69a82',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://61040-fa25.github.io/schedule',
      title: 'Full Demo & Project Report',
      due: 2025-12-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: true,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: 'Tue Dec 9 Full Demo & Project Report Wed Dec 10 (Course: unknown, Refined, Source: https://61040-fa25.github.io/schedule)',
      warnings: [Array]
    },
    {
      _id: '019a5eec-3e38-7e2a-8f13-c3e48744bc8b',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'PS8 Due',
      due: 2025-11-27T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: '11/26\n' +
        'Lecture 22: MITx\n' +
        'More on the Poisson\n' +
        'Process\n' +
        'PS8 Due (L18, L19) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Refined, Source: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: [Array]
    },
    {
      _id: '019a5eec-3e39-7a4c-bf7e-f7aba8e1a0ad',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'PS9 Due',
      due: 2025-12-04T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: '12/3\n' +
        'Lecture 24: MITx\n' +
        'Steady-State\n' +
        'Behavior of Markov\n' +
        'Chains\n' +
        'Book: §7.3\n' +
        'PS9 Due (L20-L22) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Refined, Source: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: [Array]
    },
    {
      _id: '019a5eec-3e39-7560-b018-616e12c39816',
      user: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
      title: 'PS10 Due',
      due: 2025-12-11T04:59:00.000Z,
      source: 'LLM_PARSED',
      confirmed: false,
      confidence: 1,
      extractionMethod: 'LLM',
      provenance: '12/10\n' +
        'Lecture 26: Review\n' +
        "for final by TA's\n" +
        'Last day of classes\n' +
        'PS10 Due (L23-L25) (Course: 019a5ee8-467e-7bfd-8ba0-7adbea12a589, Refined, Source: https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing)',
      warnings: [Array]
    }
  ]
} => { request: '019a5eec-3e73-7905-88a3-7c5baab5bc8a' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eec-3e38-7e2a-8f13-c3e48744bc8b',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eec-4f93-740e-9c50-b35afe4fcd1b' }


SuggestionManagement.confirm {
  suggestion: '019a5eec-3e38-7e2a-8f13-c3e48744bc8b',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS8 Due',
  due: 2025-11-27T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
}


Requesting.respond {
  request: '019a5eec-4f93-740e-9c50-b35afe4fcd1b',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS8 Due',
  due: 2025-11-27T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
} => { request: '019a5eec-4f93-740e-9c50-b35afe4fcd1b' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS8 Due',
  due: '2025-11-27T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eec-5009-7a67-a610-43ea67dc75be' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS8 Due',
  due: '2025-11-27T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eec-5035-7870-900e-58ecc01b98f8' }


Requesting.respond {
  request: '019a5eec-5009-7a67-a610-43ea67dc75be',
  deadline: '019a5eec-5035-7870-900e-58ecc01b98f8'
} => { request: '019a5eec-5009-7a67-a610-43ea67dc75be' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eec-3e39-7a4c-bf7e-f7aba8e1a0ad',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eec-5069-7844-9910-30fb854fb920' }


SuggestionManagement.confirm {
  suggestion: '019a5eec-3e39-7a4c-bf7e-f7aba8e1a0ad',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS9 Due',
  due: 2025-12-04T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
}


Requesting.respond {
  request: '019a5eec-5069-7844-9910-30fb854fb920',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS9 Due',
  due: 2025-12-04T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
} => { request: '019a5eec-5069-7844-9910-30fb854fb920' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS9 Due',
  due: '2025-12-04T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eec-50e7-75d2-8523-9ba3244aa26e' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS9 Due',
  due: '2025-12-04T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eec-5114-7664-8b44-d14a53d21f10' }


Requesting.respond {
  request: '019a5eec-50e7-75d2-8523-9ba3244aa26e',
  deadline: '019a5eec-5114-7664-8b44-d14a53d21f10'
} => { request: '019a5eec-50e7-75d2-8523-9ba3244aa26e' }

[Requesting] Received request for path: /SuggestionManagement/confirm

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  suggestion: '019a5eec-3e39-7560-b018-616e12c39816',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  path: '/SuggestionManagement/confirm'
} => { request: '019a5eec-5149-75dc-b491-a4305572b9c5' }


SuggestionManagement.confirm {
  suggestion: '019a5eec-3e39-7560-b018-616e12c39816',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS10 Due',
  due: 2025-12-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
}


Requesting.respond {
  request: '019a5eec-5149-75dc-b491-a4305572b9c5',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS10 Due',
  due: 2025-12-11T04:59:00.000Z,
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing'
} => { request: '019a5eec-5149-75dc-b491-a4305572b9c5' }

[Requesting] Received request for path: /DeadlineManagement/createDeadline

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS10 Due',
  due: '2025-12-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  websiteUrl: 'https://drive.google.com/file/d/1FDfFEL512miC89eMisOalwmytgDNlTyx/view?usp=sharing, https://drive.google.com/file/d/1O7vD9aN_iIkOwhZXSKmfGriY_AJwo8v4/view?usp=sharing',
  path: '/DeadlineManagement/createDeadline'
} => { request: '019a5eec-51cb-7add-806c-b4e0ef93d6a8' }


DeadlineManagement.createDeadline {
  course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  title: 'PS10 Due',
  due: '2025-12-11T04:59:00.000Z',
  source: 'LLM_PARSED',
  addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b'
} => { deadline: '019a5eec-51f6-72bd-8470-26186264d9fd' }


Requesting.respond {
  request: '019a5eec-51cb-7add-806c-b4e0ef93d6a8',
  deadline: '019a5eec-51f6-72bd-8470-26186264d9fd'
} => { request: '019a5eec-51cb-7add-806c-b4e0ef93d6a8' }

[Requesting] Received request for path: /DeadlineManagement/_getDeadlinesByCourse

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  courseId: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
  path: '/DeadlineManagement/_getDeadlinesByCourse'
} => { request: '019a5eec-522d-782c-af76-e29aea9a4e3e' }


Requesting.respond {
  request: '019a5eec-522d-782c-af76-e29aea9a4e3e',
  results: [
    {
      _id: '019a5eec-5035-7870-900e-58ecc01b98f8',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS8 Due',
      due: '2025-11-27T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eec-5114-7664-8b44-d14a53d21f10',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS9 Due',
      due: '2025-12-04T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eec-51f6-72bd-8470-26186264d9fd',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS10 Due',
      due: '2025-12-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    }
  ]
} => { request: '019a5eec-522d-782c-af76-e29aea9a4e3e' }

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5eec-61ac-790f-962a-61ad583aea92' }


Requesting.respond {
  request: '019a5eec-61ac-790f-962a-61ad583aea92',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5eec-61ac-790f-962a-61ad583aea92' }

[Requesting] Received request for path: /CourseManagement/_getCoursesByCreator

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/CourseManagement/_getCoursesByCreator'
} => { request: '019a5eec-6d84-7ee5-896a-9e9d3f6f88ff' }


Requesting.respond {
  request: '019a5eec-6d84-7ee5-896a-9e9d3f6f88ff',
  results: [
    {
      _id: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.1040',
      title: 'Software Design'
    },
    {
      _id: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      creator: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      courseCode: '6.3700',
      title: 'Intro to Probability'
    }
  ]
} => { request: '019a5eec-6d84-7ee5-896a-9e9d3f6f88ff' }

[Requesting] Received request for path: /DeadlineManagement/_getDeadlinesByAddedBy

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/DeadlineManagement/_getDeadlinesByAddedBy'
} => { request: '019a5eec-6de0-7f2a-8333-64dd472fc498' }


Requesting.respond {
  request: '019a5eec-6de0-7f2a-8333-64dd472fc498',
  results: [
    {
      _id: '019a5eea-9d07-79e6-8e64-6c77f351cc7f',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team Contract',
      due: '2025-11-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null,
      status: 'IN_PROGRESS'
    },
    {
      _id: '019a5eea-9de5-7fd1-8225-5662c61ba9be',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Project Pitch',
      due: '2025-11-17T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-9ebe-772b-8081-c411abcfec9c',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team pitches',
      due: '2025-11-19T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-9f9a-7402-8a83-429ed887156a',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Functional Design',
      due: '2025-11-20T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a085-764f-8c50-2843b2084799',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Team pitches',
      due: '2025-11-20T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a163-7b0d-a8c7-026b6db00d9c',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Peer Critique',
      due: '2025-11-25T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a24e-737e-b2c1-ca4e9c394cb4',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Checkpoint: Alpha',
      due: '2025-11-27T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a325-70a0-ad50-afbc33b9783b',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'User Testing',
      due: '2025-12-08T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eea-a41c-7f46-b35b-72e5f04d42bb',
      course: '019a5ee8-2753-7b74-9fdc-1156855117c4',
      title: 'Full Demo & Project Report',
      due: '2025-12-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eec-5035-7870-900e-58ecc01b98f8',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS8 Due',
      due: '2025-11-27T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eec-5114-7664-8b44-d14a53d21f10',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS9 Due',
      due: '2025-12-04T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    },
    {
      _id: '019a5eec-51f6-72bd-8470-26186264d9fd',
      course: '019a5ee8-467e-7bfd-8ba0-7adbea12a589',
      title: 'PS10 Due',
      due: '2025-12-11T04:59:00.000Z',
      source: 'LLM_PARSED',
      addedBy: '019a5ee8-0545-72eb-ae6c-4ca7ed9f4d1b',
      websiteUrl: null
    }
  ]
} => { request: '019a5eec-6de0-7f2a-8333-64dd472fc498' }

[Requesting] Received request for path: /UserAuthentication/logout

Requesting.request {
  sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2',
  path: '/UserAuthentication/logout'
} => { request: '019a5eed-c076-74d3-a323-5f9a29fe9ae0' }


UserAuthentication.logout { sessionID: '019a5ee9-4ebd-7ea0-ba42-33d3078845d2' } => {}


Requesting.respond {
  request: '019a5eed-c076-74d3-a323-5f9a29fe9ae0',
  msg: 'Logged out successfully'
} => { request: '019a5eed-c076-74d3-a323-5f9a29fe9ae0' }
```