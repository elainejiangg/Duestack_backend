/**
 * The Requesting concept exposes passthrough routes by default,
 * which allow POSTs to the route:
 *
 * /{REQUESTING_BASE_URL}/{Concept name}/{action or query}
 *
 * to passthrough directly to the concept action or query.
 * This is a convenient and natural way to expose concepts to
 * the world, but should only be done intentionally for public
 * actions and queries.
 *
 * This file allows you to explicitly set inclusions and exclusions
 * for passthrough routes:
 * - inclusions: those that you can justify their inclusion
 * - exclusions: those to exclude, using Requesting routes instead
 */

/**
 * INCLUSIONS
 *
 * Each inclusion must include a justification for why you think
 * the passthrough is appropriate (e.g. public query).
 *
 * inclusions = {"route": "justification"}
 */

export const inclusions: Record<string, string> = {
  // Public authentication routes - no session required
  "/api/UserAuthentication/register": "public action for new user registration",
  "/api/UserAuthentication/login": "public action for user authentication",
  "/api/UserIdentity/createUser": "called by register, needs to be public",
};

/**
 * EXCLUSIONS
 *
 * Excluded routes fall back to the Requesting concept, and will
 * instead trigger the normal Requesting.request action. As this
 * is the intended behavior, no justification is necessary.
 *
 * exclusions = ["route"]
 */

export const exclusions: Array<string> = [
  // TODO: REMOVE BEFORE SUBMISSION - Example LikertSurvey exclusions (temporary)
  "/api/LikertSurvey/createSurvey",
  "/api/LikertSurvey/addQuestion",

  // UserAuthentication - authenticated actions
  "/api/UserAuthentication/logout",
  "/api/UserAuthentication/changePassword",
  "/api/UserAuthentication/connectCanvas",
  "/api/UserAuthentication/_getAuthenticatedUserByUsername",
  "/api/UserAuthentication/_getAuthenticatedUserByUser",
  "/api/UserAuthentication/_getSessionUser",

  // UserIdentity - all require authentication
  "/api/UserIdentity/updateUserName",
  "/api/UserIdentity/updateUserEmail",
  "/api/UserIdentity/_getUserById",
  "/api/UserIdentity/_getUserByEmail",
  "/api/UserIdentity/_getAllUsers",

  // CourseManagement - all require authentication and authorization
  "/api/CourseManagement/createCourse",
  "/api/CourseManagement/updateCourse",
  "/api/CourseManagement/setCanvasId",
  "/api/CourseManagement/deleteCourse",
  "/api/CourseManagement/_getCourseById",
  "/api/CourseManagement/_getCoursesByCreator",
  "/api/CourseManagement/_getCourseByCodeAndCreator",
  "/api/CourseManagement/_getAllCourses",

  // DeadlineManagement - all require authentication
  "/api/DeadlineManagement/createDeadline",
  "/api/DeadlineManagement/updateDeadline",
  "/api/DeadlineManagement/setStatus",
  "/api/DeadlineManagement/deleteDeadline",
  "/api/DeadlineManagement/_getDeadlineById",
  "/api/DeadlineManagement/_getDeadlinesByCourse",
  "/api/DeadlineManagement/_getDeadlinesByAddedBy",
  "/api/DeadlineManagement/_getAllDeadlines",

  // DocumentManagement - all require authentication
  "/api/DocumentManagement/uploadDocument",
  "/api/DocumentManagement/updateDocumentMetadata",
  "/api/DocumentManagement/getDocumentContent",
  "/api/DocumentManagement/deleteDocument",
  "/api/DocumentManagement/_getDocumentById",
  "/api/DocumentManagement/_getDocumentsByUser",
  "/api/DocumentManagement/_getDocumentsByCourse",

  // SuggestionManagement - all require authentication
  "/api/SuggestionManagement/createExtractionConfig",
  "/api/SuggestionManagement/_simulateLLMExtraction",
  "/api/SuggestionManagement/parseFromCanvas",
  "/api/SuggestionManagement/llmExtractFromDocument",
  "/api/SuggestionManagement/llmExtractFromMultipleDocuments",
  "/api/SuggestionManagement/llmExtractFromPDFUrls",
  "/api/SuggestionManagement/llmExtractFromWebsite",
  "/api/SuggestionManagement/refineWithFeedback",
  "/api/SuggestionManagement/extractTimeFromPrompt",
  "/api/SuggestionManagement/refineMultipleSuggestions",
  "/api/SuggestionManagement/editSuggestion",
  "/api/SuggestionManagement/updateSuggestionTitle",
  "/api/SuggestionManagement/updateSuggestionDate",
  "/api/SuggestionManagement/confirm",
  "/api/SuggestionManagement/_getSuggestionById",
  "/api/SuggestionManagement/_getSuggestionsByUser",
  "/api/SuggestionManagement/_getUnconfirmedSuggestionsByUser",
];
