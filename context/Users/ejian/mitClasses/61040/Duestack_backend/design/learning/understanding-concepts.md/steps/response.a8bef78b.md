---
timestamp: 'Sat Oct 18 2025 20:21:24 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_202124.0662852e.md]]'
content_id: a8bef78b74739a91d99839c8cedf813dc106f392754463e32bc55f2b3bd5b25b
---

# response:

Here's a breakdown of the requested information based on the provided documentation:

***

### 1. What is the format for writing a concept spec?

A concept specification follows a defined structure to ensure clarity, consistency, and adherence to concept design principles. It includes the following sections:

* **`concept`**:
  * **Name**: A descriptive name for the concept (e.g., `LikertSurvey`).
  * **Type Parameters**: A list of generic types (e.g., `[Author, Respondent]`) that represent external objects the concept interacts with. These types are treated polymorphically; the concept cannot assume any properties beyond their identity.
* **`purpose`**:
  * A brief phrase or sentence defining the motivation for the concept's existence and the user need it serves. It should be need-focused, specific, and evaluable.
* **`principle`**:
  * An *operational principle* or *archetypal scenario* that demonstrates how the concept fulfills its purpose. It's a "story" illustrating a typical sequence of actions and their results. It should be goal-focused, differentiating (from simpler concepts), and archetypal (not including corner cases).
* **`state`**:
  * A data model describing the information the concept stores. This is typically expressed using the Simple State Form (SSF) language, declaring sets of objects and their associated relations (properties). It represents the concept's memory of past actions.
* **`actions`**:
  * A set of operations that mutate the concept's state. Each action is defined with:
    * **Name**: The name of the action (e.g., `createSurvey`).
    * **Arguments**: Input parameters with their types (e.g., `author: Author, title: String`). Arguments and results are named and handled as dictionary/JSON objects in implementation.
    * **Results**: Output parameters with their types (e.g., `(survey: Survey)`). Errors can be represented as alternative result types (e.g., `(error: String)`). Successful actions *must* return a (possibly empty) dictionary.
    * **`requires`**: A precondition specifying conditions under which the action is allowed to occur. These are "firing conditions" – the action cannot happen if the precondition is false.
    * **`effects`**: A postcondition specifying the outcome of the action, including changes to the state and any returned results.
  * **`system` actions**: Actions that are performed autonomously by the system, rather than directly by a user (e.g., `notifyExpiry`).
* **`queries` (Optional)**:
  * Methods to read the concept's state without modifying it. Often, straightforward queries are implicit, but complex or significant observations can be explicitly defined.

***

### 2. What is the difference between principle and purpose?

The `purpose` and `principle` sections serve distinct but complementary roles in a concept specification:

* **Purpose (The "Why")**:
  * It defines the **motivation** and **value proposition** of the concept. It answers *why* the concept exists and *what fundamental problem or need* it addresses for the user.
  * It's a high-level, concise statement of the concept's ultimate goal or function.
  * *Example*: For the `LikertSurvey` concept, the purpose is "To measure attitudes or opinions by asking respondents to rate their level of agreement with a series of statements on a predefined scale." This states *what* value the concept provides.

* **Principle (The "How" via Scenario)**:
  * It describes an **archetypal scenario** that illustrates *how* the concept fulfills its stated purpose through a typical sequence of interactions and state changes. It's a concrete, defining story.
  * It provides a narrative walkthrough, showcasing the core behavior and interaction patterns. It answers *how* the user will achieve the purpose.
  * It's designed to be goal-focused, differentiating (highlighting what makes this concept unique), and archetypal (focusing on the essential flow rather than edge cases).
  * *Example*: For the `LikertSurvey` concept, the principle is: "If an author creates a survey with several questions on a 1-5 scale, and a respondent submits their answers to those questions, then the author can view the collected responses to analyze the respondent's opinions." This story demonstrates the "why" in action.

In essence:

* **Purpose** is the **objective** or **need**.
* **Principle** is the **canonical example** or **motivating story** of how that objective is met.

***

### 3. How to keep different concepts independent/modular?

Concept Design achieves independence and modularity through several key architectural principles and constraints:

1. **Mutual Independence**:
   * Each concept is explicitly designed and defined **without reference to any other specific concepts**. This means a concept can be understood and used in isolation, without needing to know about other concepts in the system.
   * This fosters reusability, as a concept like `Upvote` can be dropped into any application without bringing along a raft of dependencies.

2. **Polymorphism for External Types**:
   * Concepts interact with external entities (like `User` or `Item`) using **generic type parameters**. The concept explicitly avoids making assumptions about the internal structure or properties of these external objects. It only cares about their identity.
   * This ensures that the `Comment` concept, for instance, can comment on *any* `Target` type (posts, articles, etc.) without modification.

3. **Strict Separation of Concerns**:
   * Each concept addresses **only a single, coherent aspect of functionality**. It actively avoids conflating different functional concerns.
   * For example, instead of a monolithic `User` object handling everything, concerns like `UserAuthentication`, `UserProfile`, and `Notification` are separated into distinct concepts, each managing only the state and actions relevant to its specific concern.

4. **Completeness of Functionality**:
   * A concept must be **complete** with respect to its defined purpose. It should not rely on "calling" actions or services of other concepts to fulfill its core functionality.
   * If a `Notification` concept is to notify a user, the actual delivery mechanism (email, SMS) must be part of *that* `Notification` concept's implementation, not delegated to an external `EmailService` concept. This ensures that the concept can operate self-sufficiently for its declared purpose.

5. **Composition by Synchronization (Syncs)**:
   * Since concepts are fully independent and cannot directly call each other, their interactions are managed through **synchronizations (syncs)**.
   * A sync is an explicit rule that observes actions and state properties across *multiple* concepts and then triggers subsequent actions in other concepts.
   * *Example*: "When a `Post.delete(p)` action occurs, *and where* `c` is a comment on `p` (in the `Comment` concept's state), *then* `Comment.delete(c)`."
   * Syncs act as the glue, orchestrating behavior across independent services without introducing direct coupling or dependencies between the concepts themselves. They operate as an external, declarative layer.

6. **Implementation Constraints**:
   * The implementation guidelines directly enforce independence: "No import statements can reference another concept in any way, including type declarations." This prevents compile-time or runtime coupling.
   * Each action takes and returns only dictionary/JSON objects with primitive values, preventing the passing of custom objects that might implicitly carry dependencies or expose internal structures.

By adhering to these principles, Concept Design aims to create a highly modular system where individual functional units (`concepts`) are robust, reusable, scalable, and easier to understand in isolation.
