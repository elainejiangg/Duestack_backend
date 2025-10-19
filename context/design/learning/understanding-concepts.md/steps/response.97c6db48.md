---
timestamp: 'Sat Oct 18 2025 17:33:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_173350.2aa3f617.md]]'
content_id: 97c6db486b46ea3ec25ae799ac6a171f0a8f361003969a1d4044cc3e49567e64
---

# response:

Based on the provided text, here are the answers to your questions:

## What is the format for writing a concept spec?

The text doesn't provide an explicit, formal template for a concept specification. However, by synthesizing the descriptions of "What is a concept?", we can infer the essential components that such a specification would need to include. It focuses on purpose, state, and actions, often viewed from both an API and a human behavioral protocol perspective.

Here's a proposed format, derived from the text's descriptions:

***

**Concept Specification Template**

**1. Concept Name:**

* A unique, descriptive identifier for the concept (e.g., `Upvote`, `Post`, `RestaurantReservation`, `UserAuthentication`).

**2. Purpose:**

* A clear, concise statement of the concept's user-facing functionality and the specific value it delivers. This defines "what" the concept is for.
* *Example: "To rank items by popularity."*
* *Example: "To manage the process of making, modifying, and fulfilling restaurant reservations."*

**3. State Definition:**

* Describes the internal data that the concept maintains. This includes the kinds of objects it manages and the relationships it holds between them.
* **Key Constraints:**
  * **Sufficiency:** The state must be "sufficiently rich to support the concept’s behavior."
  * **Minimality:** The state should be "no richer than it need be." It should only contain information relevant to its purpose, and specifically **not** include details that are part of other concepts (e.g., `Upvote` would not include a user's name, only their identity, as the name plays no role in its behavior).
* **Structure:** Typically involves defining entities and their relevant attributes/relationships *within the specific scope of this concept*.
  * *Example for `Upvote` concept:*
    * `Item`: Represents an entity that can be upvoted (identified by an `ID`).
    * `User`: Represents a user who can cast a vote (identified by an `ID`).
    * `Votes`: A set of relationships, each mapping a `User.ID` to an `Item.ID` and the vote type (`'up'` or `'down'`). This prevents double voting.
    * `PopularityScore`: An aggregate score for each `Item.ID` based on current votes.

**4. Actions:**

* Defines the atomic operations through which the concept interacts. These can be input actions (performed by users or other systems) or output actions (occurring spontaneously under the concept's control).
* **Key Constraint:** Actions should be designed with **polymorphism** in mind. Arguments should be as generic as possible (e.g., an `item_id` rather than a full `Post` object) to maximize reusability and independence.
* **Input Actions (User-facing/API Endpoints):**
  * `actionName(argument1: Type, argument2: Type, ...)`
  * *Example for `Upvote`:*
    * `vote(item_id: ID, user_id: ID, type: 'up' | 'down')`: Records a user's vote for an item.
  * *Example for `RestaurantReservation`:*
    * `reserve(party_size: Number, time: DateTime, user_id: ID, ...)`
    * `cancel(reservation_id: ID, user_id: ID)`
    * `seat(reservation_id: ID)`
* **Output Actions (Spontaneous/Events):**
  * Actions initiated by the concept itself as a result of internal state changes or input actions. These often trigger `syncs`.
  * *Example: `Post.deleted(post_id)` (after a user successfully deletes a post through the `Post` concept).*

**5. Behavior/Operational Semantics:**

* Describes precisely how the concept's state changes in response to input actions, and under what conditions spontaneous output actions occur. This section captures the "human behavioral protocol" and the internal logic of the concept's API.
* *Example for `Upvote.vote(item_id, user_id, type)`:*
  * "If `user_id` has not previously voted on `item_id` with `type`, and `user_id` has not previously voted on `item_id` with the opposite type, then record a new vote in the `Votes` state for `(user_id, item_id, type)`. Update the `PopularityScore` for `item_id`.
  * If `user_id` has previously voted on `item_id` with the *same* `type`, the action has no effect.
  * If `user_id` has previously voted on `item_id` with the *opposite* `type`, remove the old vote from `Votes`, add the new vote (`user_id, item_id, type`), and update `PopularityScore` accordingly."

***

## Difference between principle and purpose?

In the context of Concept Design as described in the text:

* **Purpose:** The **specific function or goal** of an *individual concept*. It describes *what* a particular concept is designed to achieve for the user, and *why* it exists as a distinct unit of functionality. Each concept has its own, well-defined purpose that provides value in the context of the larger application.
  * **Example:** The *purpose* of the `Upvote` concept is "to rank items by popularity." The *purpose* of `RestaurantReservation` is "to manage the process of making, modifying, and fulfilling restaurant reservations."
  * The text states that "each concept is closely targeted at delivering a particular function of value."

* **Principle:** A **fundamental rule, truth, or guiding belief** that underpins the entire Concept Design approach and dictates *how* concepts should be designed, structured, and interact (or not interact). These are general guidelines that lead to the advantages listed (improved modularity, reusability, independence, robustness).
  * **Examples from the text (these are core principles of the design approach):**
    * **Concept Independence:** "Perhaps the most significant distinguishing feature of concepts... is their mutual independence. Each concept is defined without reference to any other concepts, and can be understood in isolation."
    * **Separation of Concerns:** "each concept addresses only a single, coherent aspect of the functionality... and does not conflate aspects of functionality that could easily be separated."
    * **Completeness of Functionality:** "concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts."
    * **Polymorphism:** The principle that designers should "strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments" to enhance independence and reusability.

In summary: A **purpose** tells you *what a specific concept does*. A **principle** tells you *how to design concepts generally* to achieve the desired qualities of the Concept Design approach.

## How to keep different concepts independent/modular?

The text highlights several critical mechanisms and principles to ensure that concepts remain independent and modular:

1. **Mutual Independence (No Direct References):**
   * This is presented as the most significant distinguishing feature. "Each concept is defined without reference to any other concepts, and can be understood in isolation."
   * Concepts are strictly forbidden from directly calling or knowing about the internal state or actions of other concepts. This prevents tight coupling, meaning that a change in one concept does not directly necessitate changes in others, facilitating independent development and deployment.

2. **Polymorphism in Action Arguments:**
   * Concepts should be designed to be as generic as possible. The designer of a concept "should strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments."
   * Instead of expecting specific object types, actions should accept generic identifiers (e.g., `item_id`, `user_id`). This allows concepts to be reused across different contexts where the "type" of the item or user might vary, without introducing dependencies on those specific types.

3. **Strict Separation of Concerns:**
   * Each concept must address "only a single, coherent aspect of the functionality of the application" and "does not conflate aspects of functionality that could easily be separated."
   * This means avoiding monolithic structures, especially around common entities. For example, all user-related functions (authentication, profiles, naming, notifications) are separated into distinct concepts (`UserAuthentication`, `Profile`, `Notification`, etc.), rather than being consolidated into a single `User` class. This ensures each concept has a narrow, well-defined responsibility.

4. **Completeness of Functionality:**
   * "Concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts."
   * If a concept needs to perform a certain operation to fulfill its purpose (e.g., a `Notification` concept needs to send an email), the logic for that operation must be part of the `Notification` concept itself. It cannot delegate or "make a call" to an action of another concept (like an `Emailing` concept) to deliver a notification. This ensures each concept is self-sufficient for its declared functionality.

5. **Minimal and Targeted State:**
   * A concept's internal state must be "sufficiently rich to support the concept’s behavior" but "no richer than it need be."
   * By strictly limiting its internal state to only what is absolutely necessary for its specific purpose, a concept reduces its "knowledge" about other parts of the system. For instance, the `Upvote` concept only includes user and item IDs, not their names or content, thereby avoiding unnecessary coupling.

6. **Composition by Synchronization (Syncs):**
   * Since concepts cannot refer to or directly use each other's services, they are composed using *synchronizations* (syncs).
   * Syncs are external rules that observe actions and state conditions in one or more concepts (`when` / `where` clauses) and then trigger actions in other concepts (`then` clause).
   * This mechanism provides a powerful way for concepts to interact and coordinate their behaviors *without* building direct dependencies into the concepts themselves. Syncs act as the "glue" that orchestrates the overall application behavior from independent building blocks, thereby maintaining their modularity.
