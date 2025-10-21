---
timestamp: 'Sun Oct 19 2025 20:43:49 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_204349.106d38ea.md]]'
content_id: 041545058e1d788a1e6cb0d0ae41349595b36034d43e4da6d9d7f7e162f45b7d
---

# file: src/concepts/DueStack/DeadlineManagementConcept.ts

```typescript
import { Collection, Db } from "npm:mongodb";
import { Empty, ID } from "@utils/types.ts";
import { freshID } from "@utils/database.ts";

// Collection prefix to ensure namespace separation
const PREFIX = "DeadlineManagement" + ".";

// Generic types for the concept's external dependencies
type User = ID; // User ID originating from UserIdentity concept
type Course = ID; // Course ID originating from CourseManagement concept

// Internal entity type for a Deadline
type Deadline = ID;

/**
 * Enumeration for the source of a deadline.
 * Corresponds to: a source of SYLLABUS or CANVAS or WEBSITE or MANUAL or IMAGE or LLM_PARSED
 */
enum Source {
  SYLLABUS = "SYLLABUS",
  CANVAS = "CANVAS",
  WEBSITE = "WEBSITE",
  MANUAL = "MANUAL",
  IMAGE = "IMAGE",
  LLM_PARSED = "LLM_PARSED",
}

/**
 * Enumeration for the status of a deadline.
 * Corresponds to: an optional status of NOT_STARTED or IN_PROGRESS or DONE
 */
enum Status {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
}

/**
 * State: A set of Deadlines, each associated with a Course, title, due date, source,
 * the User who added it, and an optional status.
 */
interface DeadlineDoc {
  _id: Deadline; // Primary key for this collection
  course: Course; // Reference to the CourseManagement's Course ID
  title: string;
  due: Date; // DateTime is represented as Date in TypeScript/MongoDB
  source: Source;
  addedBy: User; // Reference to the UserIdentity's User ID
  status?: Status; // Optional completion status
}

/**
 * @concept DeadlineManagement
 * @purpose store and manage academic deadlines, tracking their status and association with courses.
 */
export default class DeadlineManagementConcept {
  deadlines: Collection<DeadlineDoc>;

  constructor(private readonly db: Db) {
    this.deadlines = this.db.collection(PREFIX + "deadlines");
  }

  /**
   * Action: Creates a new deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Course} args.course - The ID of the course this deadline belongs to.
   * @param {string} args.title - The title of the deadline.
   * @param {Date} args.due - The due date and time of the deadline.
   * @param {Source} args.source - The origin of the deadline (e.g., SYLLABUS, MANUAL).
   * @param {User} args.addedBy - The ID of the User who added this deadline.
   * @returns {Promise<{deadline: Deadline} | {error: string}>} A promise that resolves to an object containing the new deadline's ID on success, or an error message on failure.
   * @requires course exists (this is handled by external concepts/syncs, here we assume the ID is valid).
   * @requires title is non-empty.
   * @effects Creates a new deadline with the given details, initially with no status.
   */
  async createDeadline(
    { course, title, due, source, addedBy }: {
      course: Course;
      title: string;
      due: Date;
      source: Source;
      addedBy: User;
    },
  ): Promise<{ deadline: Deadline } | { error: string }> {
    // Basic validation
    if (!title || title.trim() === "") {
      return { error: "Deadline title cannot be empty." };
    }
    if (!Object.values(Source).includes(source)) {
      return { error: `Invalid source: ${source}.` };
    }
    // Note: 'course exists' and 'user exists' are preconditions to be enforced by calling context/syncs
    // as per concept independence. This concept only ensures the ID is of the correct type.

    const deadlineId = freshID() as Deadline;
    await this.deadlines.insertOne({
      _id: deadlineId,
      course,
      title,
      due,
      source,
      addedBy,
      // status is optional, so it's not set initially unless provided explicitly
    });
    return { deadline: deadlineId };
  }

  /**
   * Action: Updates the title, due date, and/or source of an existing deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to update.
   * @param {string} args.newTitle - The new title of the deadline.
   * @param {Date} args.newDue - The new due date and time of the deadline.
   * @param {Source} args.newSource - The new origin of the deadline.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @requires newTitle is non-empty.
   * @effects Updates the title, due date, and source of an existing deadline.
   */
  async updateDeadline(
    { deadline, newTitle, newDue, newSource }: {
      deadline: Deadline;
      newTitle: string;
      newDue: Date;
      newSource: Source;
    },
  ): Promise<Empty | { error: string }> {
    const existingDeadline = await this.deadlines.findOne({ _id: deadline });
    if (!existingDeadline) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    if (!newTitle || newTitle.trim() === "") {
      return { error: "Deadline title cannot be empty." };
    }
    if (!Object.values(Source).includes(newSource)) {
      return { error: `Invalid source: ${newSource}.` };
    }

    await this.deadlines.updateOne(
      { _id: deadline },
      { $set: { title: newTitle, due: newDue, source: newSource } },
    );
    return {};
  }

  /**
   * Action: Updates the completion status of a deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to update.
   * @param {Status} args.status - The new status of the deadline.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @effects Updates the completion status of a deadline.
   */
  async setStatus(
    { deadline, status }: { deadline: Deadline; status: Status },
  ): Promise<Empty | { error: string }> {
    const existingDeadline = await this.deadlines.findOne({ _id: deadline });
    if (!existingDeadline) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    if (!Object.values(Status).includes(status)) {
      return { error: `Invalid status: ${status}.` };
    }

    await this.deadlines.updateOne(
      { _id: deadline },
      { $set: { status } },
    );
    return {};
  }

  /**
   * Action: Removes the specified deadline.
   * @param {Object} args - The arguments for the action.
   * @param {Deadline} args.deadline - The ID of the deadline to delete.
   * @returns {Promise<Empty | {error: string}>} A promise that resolves to an empty object on success, or an error message on failure.
   * @requires deadline exists.
   * @effects Removes the specified deadline.
   */
  async deleteDeadline({ deadline }: { deadline: Deadline }): Promise<Empty | { error: string }> {
    const result = await this.deadlines.deleteOne({ _id: deadline });

    if (result.deletedCount === 0) {
      return { error: `Deadline with ID ${deadline} not found.` };
    }
    return {};
  }

  // --- Query Methods (for internal use and testing) ---

  /**
   * Query: Retrieves a deadline by its ID.
   */
  async _getDeadlineById({ deadlineId }: { deadlineId: Deadline }): Promise<DeadlineDoc | null> {
    return await this.deadlines.findOne({ _id: deadlineId });
  }

  /**
   * Query: Retrieves all deadlines associated with a specific course.
   */
  async _getDeadlinesByCourse({ courseId }: { courseId: Course }): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({ course: courseId }).toArray();
  }

  /**
   * Query: Retrieves all deadlines added by a specific user.
   */
  async _getDeadlinesByAddedBy({ userId }: { userId: User }): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({ addedBy: userId }).toArray();
  }

  /**
   * Query: Retrieves all deadlines.
   */
  async _getAllDeadlines(): Promise<DeadlineDoc[]> {
    return await this.deadlines.find({}).toArray();
  }
}

```
