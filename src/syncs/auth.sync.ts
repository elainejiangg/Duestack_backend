/**
 * Authentication Synchronizations
 *
 * These syncs handle authentication for all excluded routes.
 * Pattern:
 * 1. Request comes in with sessionID
 * 2. Validate sessionID using UserAuthentication._getSessionUser
 * 3. If valid, execute the concept action
 * 4. If invalid, respond with error
 */

import {
  CourseManagement,
  DeadlineManagement,
  DocumentManagement,
  Requesting,
  SuggestionManagement,
  UserAuthentication,
  UserIdentity,
} from "@concepts";
import { actions, Frames, Sync } from "@engine";

// ============================================================================
// USER AUTHENTICATION SYNCS
// ============================================================================

export const LogoutRequest: Sync = ({ request, sessionID, user, error }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/logout", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    // If session is invalid, return error response
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [error]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([UserAuthentication.logout, { sessionID }]),
});

export const LogoutResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserAuthentication/logout" }, { request }],
    [UserAuthentication.logout, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Logged out successfully" },
  ]),
});

export const LogoutAuthError: Sync = ({ request, error }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/logout" },
    { request },
  ]),
  where: async (frames) => {
    // Only fire if error exists (from auth check)
    return frames.filter(($) => $[error] !== undefined);
  },
  then: actions([Requesting.respond, { request, error }]),
});

export const ChangePasswordRequest: Sync = ({
  request,
  sessionID,
  user,
  oldPassword,
  newPassword,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/UserAuthentication/changePassword",
      sessionID,
      oldPassword,
      newPassword,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    UserAuthentication.changePassword,
    { user, oldPassword, newPassword },
  ]),
});

export const ChangePasswordResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/changePassword" },
      { request },
    ],
    [UserAuthentication.changePassword, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ChangePasswordSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/changePassword" },
      { request },
    ],
    [UserAuthentication.changePassword, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Password changed successfully" },
  ]),
});

export const ChangePasswordAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/changePassword" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const ConnectCanvasRequest: Sync = ({
  request,
  sessionID,
  user,
  canvasOAuthToken,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/connectCanvas", sessionID, canvasOAuthToken },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([UserAuthentication.connectCanvas, { user, canvasOAuthToken }]),
});

export const ConnectCanvasResponse: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserAuthentication/connectCanvas" },
      { request },
    ],
    [UserAuthentication.connectCanvas, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Canvas connected successfully" },
  ]),
});

export const GetSessionUserRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/_getSessionUser", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([Requesting.respond, { request, user }]),
});

export const GetSessionUserAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/UserAuthentication/_getSessionUser" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// USER IDENTITY SYNCS
// ============================================================================

export const UpdateUserNameRequest: Sync = ({
  request,
  sessionID,
  user,
  name,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/UserIdentity/updateUserName", sessionID, name },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([UserIdentity.updateUserName, { user, name }]),
});

export const UpdateUserNameResponse: Sync = ({ request }) => ({
  when: actions(
    [Requesting.request, { path: "/UserIdentity/updateUserName" }, { request }],
    [UserIdentity.updateUserName, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Name updated successfully" },
  ]),
});

export const UpdateUserEmailRequest: Sync = ({
  request,
  sessionID,
  user,
  email,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/UserIdentity/updateUserEmail", sessionID, email },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([UserIdentity.updateUserEmail, { user, email }]),
});

export const UpdateUserEmailResponse: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserIdentity/updateUserEmail" },
      { request },
    ],
    [UserIdentity.updateUserEmail, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const UpdateUserEmailSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/UserIdentity/updateUserEmail" },
      { request },
    ],
    [UserIdentity.updateUserEmail, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Email updated successfully" },
  ]),
});

export const GetUserByIdRequest: Sync = ({
  request,
  sessionID,
  authUser,
  user,
  authError,
  userData,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/UserIdentity/_getUserById", sessionID, user },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user: authUser }
    );
    if (frames.length === 0 || frames[0][authUser] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get user data
    frames = await frames.query(
      UserIdentity._getUserById,
      { user },
      { user: userData }
    );
    return frames;
  },
  then: actions([Requesting.respond, { request, user: userData }]),
});

// ============================================================================
// COURSE MANAGEMENT SYNCS
// ============================================================================

export const CreateCourseRequest: Sync = ({
  request,
  sessionID,
  user,
  courseCode,
  title,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/createCourse", sessionID, courseCode, title },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    CourseManagement.createCourse,
    { creator: user, courseCode, title },
  ]),
});

export const CreateCourseResponse: Sync = ({ request, course }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/createCourse" },
      { request },
    ],
    [CourseManagement.createCourse, {}, { course }]
  ),
  then: actions([Requesting.respond, { request, course }]),
});

export const CreateCourseError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/createCourse" },
      { request },
    ],
    [CourseManagement.createCourse, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateCourseAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/createCourse" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const UpdateCourseRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  newCourseCode,
  newTitle,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/CourseManagement/updateCourse",
      sessionID,
      course,
      newCourseCode,
      newTitle,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    CourseManagement.updateCourse,
    { course, newCourseCode, newTitle },
  ]),
});

export const UpdateCourseSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/updateCourse" },
      { request },
    ],
    [CourseManagement.updateCourse, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Course updated successfully" },
  ]),
});

export const UpdateCourseError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/updateCourse" },
      { request },
    ],
    [CourseManagement.updateCourse, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const UpdateCourseAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/updateCourse" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const GetCoursesByCreatorRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
  course,
  results,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/_getCoursesByCreator", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get courses directly from the concept
    const userId = frames[0][user];
    const courseDocs = await CourseManagement._getCoursesByCreator({
      creator: userId,
    });
    return new Frames({ ...originalFrame, [results]: courseDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetCoursesByCreatorAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/_getCoursesByCreator" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// DEADLINE MANAGEMENT SYNCS
// ============================================================================

export const CreateDeadlineRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  title,
  due,
  source,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/DeadlineManagement/createDeadline",
      sessionID,
      course,
      title,
      due,
      source,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    DeadlineManagement.createDeadline,
    { course, title, due, source, addedBy: user },
  ]),
});

export const CreateDeadlineResponse: Sync = ({ request, deadline }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/createDeadline" },
      { request },
    ],
    [DeadlineManagement.createDeadline, {}, { deadline }]
  ),
  then: actions([Requesting.respond, { request, deadline }]),
});

export const CreateDeadlineAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/createDeadline" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const GetDeadlinesByCourseRequest: Sync = ({
  request,
  sessionID,
  user,
  courseId,
  authError,
  deadline,
  results,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/_getDeadlinesByCourse", sessionID, courseId },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get deadlines directly from the concept
    const courseIdValue = originalFrame[courseId];
    const deadlineDocs = await DeadlineManagement._getDeadlinesByCourse({
      courseId: courseIdValue,
    });
    return new Frames({ ...originalFrame, [results]: deadlineDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetDeadlinesByCourseAuthError: Sync = ({
  request,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/_getDeadlinesByCourse" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// DOCUMENT MANAGEMENT SYNCS
// ============================================================================

export const UploadDocumentRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  filename,
  content,
  mimeType,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/DocumentManagement/uploadDocument",
      sessionID,
      course,
      filename,
      content,
      mimeType,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    DocumentManagement.uploadDocument,
    { user, course, filename, content, mimeType },
  ]),
});

export const UploadDocumentResponse: Sync = ({ request, document }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DocumentManagement/uploadDocument" },
      { request },
    ],
    [DocumentManagement.uploadDocument, {}, { document }]
  ),
  then: actions([Requesting.respond, { request, document }]),
});

export const UploadDocumentAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DocumentManagement/uploadDocument" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const GetDocumentsByUserRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
  document,
  results,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DocumentManagement/_getDocumentsByUser", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get documents directly from the concept
    const userId = frames[0][user];
    const documentDocs = await DocumentManagement._getDocumentsByUser({
      user: userId,
    });
    return new Frames({ ...originalFrame, [results]: documentDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetDocumentsByUserAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DocumentManagement/_getDocumentsByUser" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// SUGGESTION MANAGEMENT SYNCS
// ============================================================================

export const GetUnconfirmedSuggestionsRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
  suggestion,
  results,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/_getUnconfirmedSuggestionsByUser",
      sessionID,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get suggestions directly from the concept
    const userId = frames[0][user];
    const suggestionDocs =
      await SuggestionManagement._getUnconfirmedSuggestionsByUser({
        user: userId,
      });
    return new Frames({ ...originalFrame, [results]: suggestionDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetUnconfirmedSuggestionsAuthError: Sync = ({
  request,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/_getUnconfirmedSuggestionsByUser" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

export const ConfirmSuggestionRequest: Sync = ({
  request,
  sessionID,
  user,
  suggestion,
  course,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/confirm", sessionID, suggestion, course },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.confirm,
    { suggestion, course, addedBy: user },
  ]),
});

export const ConfirmSuggestionResponse: Sync = ({
  request,
  course,
  title,
  due,
  source,
  addedBy,
  websiteUrl,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/confirm" },
      { request },
    ],
    [
      SuggestionManagement.confirm,
      {},
      { course, title, due, source, addedBy, websiteUrl },
    ]
  ),
  then: actions([
    Requesting.respond,
    { request, course, title, due, source, addedBy, websiteUrl },
  ]),
});

export const ConfirmSuggestionError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/confirm" },
      { request },
    ],
    [SuggestionManagement.confirm, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ConfirmSuggestionAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/confirm" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// DEADLINE STATUS SYNCS
// ============================================================================

export const SetDeadlineStatusRequest: Sync = ({
  request,
  sessionID,
  user,
  deadline,
  status,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/setStatus", sessionID, deadline, status },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([DeadlineManagement.setStatus, { deadline, status }]),
});

export const SetDeadlineStatusSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/setStatus" },
      { request },
    ],
    [DeadlineManagement.setStatus, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Deadline status updated successfully" },
  ]),
});

export const SetDeadlineStatusError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/setStatus" },
      { request },
    ],
    [DeadlineManagement.setStatus, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const SetDeadlineStatusAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/setStatus" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// DELETE DEADLINE SYNCS
// ============================================================================

export const DeleteDeadlineRequest: Sync = ({
  request,
  sessionID,
  user,
  deadline,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/deleteDeadline", sessionID, deadline },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([DeadlineManagement.deleteDeadline, { deadline }]),
});

export const DeleteDeadlineSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/deleteDeadline" },
      { request },
    ],
    [DeadlineManagement.deleteDeadline, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Deadline deleted successfully" },
  ]),
});

export const DeleteDeadlineError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/deleteDeadline" },
      { request },
    ],
    [DeadlineManagement.deleteDeadline, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteDeadlineAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/deleteDeadline" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// DELETE COURSE SYNCS
// ============================================================================

export const DeleteCourseRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/deleteCourse", sessionID, course },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }

    // CASCADE DELETE: Get and delete all deadlines associated with this course
    const courseIdValue = originalFrame[course];
    const deadlinesToDelete = await DeadlineManagement._getDeadlinesByCourse({
      courseId: courseIdValue,
    });

    // Delete each deadline
    for (const deadline of deadlinesToDelete) {
      await DeadlineManagement.deleteDeadline({ deadline: deadline._id });
    }

    return frames;
  },
  then: actions([CourseManagement.deleteCourse, { course }]),
});

export const DeleteCourseSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/deleteCourse" },
      { request },
    ],
    [CourseManagement.deleteCourse, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Course deleted successfully" },
  ]),
});

export const DeleteCourseError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/CourseManagement/deleteCourse" },
      { request },
    ],
    [CourseManagement.deleteCourse, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const DeleteCourseAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/CourseManagement/deleteCourse" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// UPDATE DEADLINE SYNCS
// ============================================================================

export const UpdateDeadlineRequest: Sync = ({
  request,
  sessionID,
  user,
  deadline,
  newTitle,
  newDue,
  newSource,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/DeadlineManagement/updateDeadline",
      sessionID,
      deadline,
      newTitle,
      newDue,
      newSource,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    DeadlineManagement.updateDeadline,
    { deadline, newTitle, newDue, newSource },
  ]),
});

export const UpdateDeadlineSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/updateDeadline" },
      { request },
    ],
    [DeadlineManagement.updateDeadline, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Deadline updated successfully" },
  ]),
});

export const UpdateDeadlineError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/DeadlineManagement/updateDeadline" },
      { request },
    ],
    [DeadlineManagement.updateDeadline, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const UpdateDeadlineAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/updateDeadline" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// GET ALL DEADLINES BY USER SYNCS
// ============================================================================

export const GetDeadlinesByUserRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
  results,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/_getDeadlinesByAddedBy", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get deadlines directly from the concept
    const userId = frames[0][user];
    const deadlineDocs = await DeadlineManagement._getDeadlinesByAddedBy({
      userId: userId,
    });
    return new Frames({ ...originalFrame, [results]: deadlineDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetDeadlinesByUserAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/DeadlineManagement/_getDeadlinesByAddedBy" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI EXTRACTION CONFIG SYNCS
// ============================================================================

export const CreateExtractionConfigRequest: Sync = ({
  request,
  sessionID,
  user,
  name,
  modelVersion,
  basePromptTemplate,
  maxTokens,
  temperature,
  timezone,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/createExtractionConfig",
      sessionID,
      name,
      modelVersion,
      basePromptTemplate,
      maxTokens,
      temperature,
      timezone,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.createExtractionConfig,
    {
      name,
      modelVersion,
      basePromptTemplate,
      maxTokens,
      temperature,
      timezone,
      // optionalTimeout not provided - concept will use default
    },
  ]),
});

export const CreateExtractionConfigSuccess: Sync = ({ request, config }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/createExtractionConfig" },
      { request },
    ],
    [SuggestionManagement.createExtractionConfig, {}, { config }]
  ),
  then: actions([Requesting.respond, { request, config }]),
});

export const CreateExtractionConfigError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/createExtractionConfig" },
      { request },
    ],
    [SuggestionManagement.createExtractionConfig, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const CreateExtractionConfigAuthError: Sync = ({
  request,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/createExtractionConfig" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI SUGGESTION QUERY SYNCS
// ============================================================================

export const GetSuggestionsByUserRequest: Sync = ({
  request,
  sessionID,
  user,
  authError,
  results,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/_getSuggestionsByUser", sessionID },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    // Check authentication
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    // If authenticated, get suggestions directly from the concept
    const userId = frames[0][user];
    const suggestionDocs = await SuggestionManagement._getSuggestionsByUser({
      user: userId,
    });
    return new Frames({ ...originalFrame, [results]: suggestionDocs });
  },
  then: actions([Requesting.respond, { request, results }]),
});

export const GetSuggestionsByUserAuthError: Sync = ({
  request,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/_getSuggestionsByUser" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI SUGGESTION EDIT SYNCS
// ============================================================================

export const EditSuggestionRequest: Sync = ({
  request,
  sessionID,
  user,
  suggestion,
  newTitle,
  newDue,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/editSuggestion",
      sessionID,
      suggestion,
      newTitle,
      newDue,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.editSuggestion,
    { suggestion, newTitle, newDue },
  ]),
});

export const EditSuggestionSuccess: Sync = ({ request }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/editSuggestion" },
      { request },
    ],
    [SuggestionManagement.editSuggestion, {}, {}]
  ),
  then: actions([
    Requesting.respond,
    { request, msg: "Suggestion edited successfully" },
  ]),
});

export const EditSuggestionError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/editSuggestion" },
      { request },
    ],
    [SuggestionManagement.editSuggestion, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const EditSuggestionAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/editSuggestion" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI REFINEMENT SYNCS
// ============================================================================

export const RefineMultipleSuggestionsRequest: Sync = ({
  request,
  sessionID,
  user,
  suggestions,
  refinementPrompt,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/refineMultipleSuggestions",
      sessionID,
      suggestions,
      refinementPrompt,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.refineMultipleSuggestions,
    { user, suggestions, refinementPrompt },
  ]),
});

export const RefineMultipleSuggestionsSuccess: Sync = ({
  request,
  suggestions,
}) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/refineMultipleSuggestions" },
      { request },
    ],
    [SuggestionManagement.refineMultipleSuggestions, {}, { suggestions }]
  ),
  then: actions([Requesting.respond, { request, suggestions }]),
});

export const RefineMultipleSuggestionsError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/refineMultipleSuggestions" },
      { request },
    ],
    [SuggestionManagement.refineMultipleSuggestions, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const RefineMultipleSuggestionsAuthError: Sync = ({
  request,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/refineMultipleSuggestions" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI PDF EXTRACTION SYNCS
// ============================================================================

export const ExtractFromPDFUrlsRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  pdfUrls,
  config,
  customPrompt,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/llmExtractFromPDFUrls",
      sessionID,
      course,
      pdfUrls,
      config,
      customPrompt,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.llmExtractFromPDFUrls,
    { user, course, pdfUrls, config, customPrompt },
  ]),
});

export const ExtractFromPDFUrlsSuccess: Sync = ({ request, suggestions }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/llmExtractFromPDFUrls" },
      { request },
    ],
    [SuggestionManagement.llmExtractFromPDFUrls, {}, { suggestions }]
  ),
  then: actions([Requesting.respond, { request, suggestions }]),
});

export const ExtractFromPDFUrlsError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/llmExtractFromPDFUrls" },
      { request },
    ],
    [SuggestionManagement.llmExtractFromPDFUrls, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ExtractFromPDFUrlsAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/llmExtractFromPDFUrls" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});

// ============================================================================
// AI WEBSITE EXTRACTION SYNCS
// ============================================================================

export const ExtractFromWebsiteRequest: Sync = ({
  request,
  sessionID,
  user,
  course,
  url,
  config,
  customPrompt,
  authError,
}) => ({
  when: actions([
    Requesting.request,
    {
      path: "/SuggestionManagement/llmExtractFromWebsite",
      sessionID,
      course,
      url,
      config,
      customPrompt,
    },
    { request },
  ]),
  where: async (frames) => {
    const originalFrame = frames[0];
    frames = await frames.query(
      UserAuthentication._getSessionUser,
      { sessionID },
      { user }
    );
    if (frames.length === 0 || frames[0][user] === null) {
      return new Frames({
        ...originalFrame,
        [authError]: "Invalid or expired session",
      });
    }
    return frames;
  },
  then: actions([
    SuggestionManagement.llmExtractFromWebsite,
    { user, course, url, config, customPrompt },
  ]),
});

export const ExtractFromWebsiteSuccess: Sync = ({ request, suggestions }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/llmExtractFromWebsite" },
      { request },
    ],
    [SuggestionManagement.llmExtractFromWebsite, {}, { suggestions }]
  ),
  then: actions([Requesting.respond, { request, suggestions }]),
});

export const ExtractFromWebsiteError: Sync = ({ request, error }) => ({
  when: actions(
    [
      Requesting.request,
      { path: "/SuggestionManagement/llmExtractFromWebsite" },
      { request },
    ],
    [SuggestionManagement.llmExtractFromWebsite, {}, { error }]
  ),
  then: actions([Requesting.respond, { request, error }]),
});

export const ExtractFromWebsiteAuthError: Sync = ({ request, authError }) => ({
  when: actions([
    Requesting.request,
    { path: "/SuggestionManagement/llmExtractFromWebsite" },
    { request },
  ]),
  where: async (frames) => {
    return frames.filter(($) => $[authError] !== undefined);
  },
  then: actions([Requesting.respond, { request, error: authError }]),
});
