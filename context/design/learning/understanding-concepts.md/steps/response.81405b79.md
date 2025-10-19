---
timestamp: 'Sat Oct 18 2025 17:36:00 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_173600.23ad193c.md]]'
content_id: 81405b79086eae28c5a276b421ec5be8e77e674905fa2e5cb13eb1b2f6dace8f
---

# response:

Here's a summary of the format for writing a concept spec, the difference between principle and purpose, and how to keep concepts independent/modular, based on the provided documentation:

***

## Format for Writing a Concept Specification

A concept is specified using the following structured format:

1. **concept**: A descriptive name for the concept, along with any generic type parameters (e.g., `[Item, User]`) that represent external entities the concept interacts with polymorphically.
2. **purpose**: A brief phrase or sentence defining the motivation for the concept's existence and the user need it serves.
3. **principle**: An archetypal scenario or "defining story" that explains *how* the concept fulfills its purpose through a typical sequence of interactions.
4. **state**: A data model describing the information the concept stores using the Simple State Form (SSF). This captures the relationships between necessary information.
5. **actions**: A set of events that largely mutate the state. Each action is defined with:
   * **Name and arguments**: `actionName (arg1: Type, arg2: Type): (result1: Type, ...)`
   * **requires**: Preconditions specifying when the action can occur (firing conditions).
   * **effects**: Postconditions specifying the outcome, including results and changes to the state.
   * **(Optional)** `system` keyword if the action is autonomous rather than user-initiated.
6. **(Implicit/Optional)** **Queries**: Reads of the concept state. Straightforward queries are often implicit, but complex or significant observations can be explicitly defined (prefixed with `_`).

***

## Difference Between Principle and Purpose

The documentation clearly distinguishes `purpose` and `principle`:

* **Purpose:**
  * **What it is:** The fundamental **reason for existence** of the concept; the need it serves; the "why."
  * **Focus:** Need-focused, specific to the concept, and evaluable. It should express what value it brings.
  * **Example:** For the *Trash* concept, its purpose is "support deletion of items with possibility of restoring," emphasizing *undeletion* rather than just deletion.
  * **Think:** "Why does this concept exist?" or "What problem does it solve for the user?"

* **Principle:**
  * **What it is:** An **archetypal scenario** that explains *how* the concept fulfills its purpose in a typical case; a "defining story."
  * **Focus:** Demonstrates the key functionality, differentiates the concept from simpler alternatives, and is archetypal (not including rare corner cases). It describes a sequence of actions and results.
  * **Example:** For the *Trash* concept, a principle would involve deleting an item *and then restoring it*, demonstrating the core value of undeletion. For *PersonalAccessToken*, it highlights both creation/usage and *revocation* to differentiate it from a simple password.
  * **Think:** "How does a user typically achieve the purpose using this concept?" or "What's the most illustrative flow of interaction?"

In essence, **Purpose is the "why," and Principle is the "how" (in a key scenario).**

***

## How to Keep Different Concepts Independent/Modular

Concept design emphasizes **mutual independence** as its most significant distinguishing feature. Several rules and guidelines ensure this:

1. **No Direct References (Independence Rule):**
   * Each concept is defined and understood in **isolation**, without referring to other concepts by name.
   * A concept action **cannot "call" an action of another concept** or directly query another concept's state.
   * This fosters independent understandability, development, and reuse.

2. **Polymorphism for External Types (Genericity):**
   * Concepts use **generic type parameters** (e.g., `[User, Item]`) for objects that originate outside the concept.
   * The concept must make **no assumptions about the content or interpretation** of these external objects beyond their identity (e.g., an `Upvote` concept only cares about `User` and `Item` IDs, not `User` names or `Item` content).
   * This enables broad reuse across different applications where the specific types of `User` or `Item` might vary.

3. **Strict Separation of Concerns:**
   * Each concept addresses **only a single, coherent aspect** of functionality.
   * Functionalities that could easily be separated are not conflated. For instance, a `User` entity in traditional design might encompass authentication, profiles, and notifications. In concept design, these would be separate concepts (`UserAuthentication`, `Profile`, `Notification`).
   * Concept state should contain **only the properties strictly necessary** for its purpose and actions, and no state component should be droppable without compromising essential functionality. It should not gratuitously include state not needed, or references to external objects' properties when only their identity is needed.

4. **Completeness of Functionality:**
   * Each concept must be **complete with respect to its functionality**, delivering its stated purpose **without relying on services or functionality from other concepts**.
   * For example, a `Notification` concept that sends messages must include the logic for emailing or texting *within itself*, rather than "calling out" to an external emailing service. If a part of its functionality *could* be a coherent, independent concept, it *should* be separated.

5. **Composition by Synchronization (Syncs):**
   * Because concepts are independent, they cannot directly interact. Instead, they are composed using **synchronizations (syncs)**.
   * A sync is a rule (`when X, where Y, then Z`) that orchestrates interactions by observing actions or state changes in one concept (`when` clause) and then triggering actions in another concept (`then` clause), potentially based on conditions across multiple concepts (`where` clause).
   * This provides a loosely coupled mechanism for concepts to work together without direct dependencies. Examples include cascading deletions (`Post.delete -> Comment.delete`) or authentication (`Request.deletePost -> Post.delete` if user is author).

By adhering to these principles, concept design aims to achieve highly modular, reusable, and independently understandable units of software functionality.
