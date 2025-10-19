---
timestamp: 'Sat Oct 18 2025 17:31:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_173145.f40ee422.md]]'
content_id: 576ee410a10fac685ad435713fa3f904892e1763a9afe5e24c3c41f9e25b58fb
---

# response:

Based on the provided text, here are the answers to your questions:

## What is the format for writing a concept spec?

While the text doesn't provide an explicit, formal template for a concept specification, we can infer its essential components based on the description of what a concept *is* and *does*. A concept specification would need to describe its purpose, its internal state, and its actions.

Here's a proposed format, derived from the text's descriptions:

***

**Concept Specification Template**

**1. Concept Name:**
A unique, descriptive name for the concept (e.g., `Upvote`, `Post`, `RestaurantReservation`, `UserAuthentication`).

**2. Purpose:**
A clear, concise statement of the concept's user-facing functionality and the value it provides. This defines "what" the concept is for.
*Example: "To rank items by popularity."*
*Example: "To manage the process of making, modifying, and fulfilling restaurant reservations."*

**3. State Definition:**
Describes the internal data that the concept maintains. This includes the types of objects it manages and the relationships it holds between them.

* **Constraint:** The state must be "sufficiently rich to support the concept's behavior" but "no richer than it need be." It should only contain information relevant to its purpose, and specifically **not** include details that are part of other concepts (e.g., `Upvote` doesn't include a user's name, only their identity).
* **Structure:** This typically involves defining entities and their attributes/relationships *within the scope of this concept*.
  *Example for `Upvote` concept:*
  \*   `Item`: Represents an entity that can be upvoted (e.g., a post, a comment). Its identity is crucial.
  \*   `User`: Represents a user who can cast a vote. Its identity is crucial.
  \*   `Vote`: A relationship mapping a `User` to an `Item` they have voted on, along with the vote type (up/down).
  \*   `ItemPopularity`: An aggregate count for each `Item`.

**4. Actions:**
Defines the atomic operations that users or other systems can invoke on the concept, as well as any output actions the concept performs spontaneously. These actions form the concept's API and its human behavioral protocol.

* **Constraint:** Actions should be designed with polymorphism in mind; arguments should be as generic as possible (e.g., an `item_id` rather than a full `Post` object) to maximize reusability and independence.
* **Input Actions (User-facing/API):**
  \*   `actionName(argument1: Type, argument2: Type, ...)`
  \*   *Example for `Upvote`:*
  * `vote(item_id: ID, user_id: ID, type: 'up' | 'down')`: Records a user's vote for an item.
    \*   *Example for `RestaurantReservation`:*
  * `reserve(party_size: Number, time: DateTime, user_id: ID)`
  * `cancel(reservation_id: ID, user_id: ID)`
  * `seat(reservation_id: ID)`
* **Output Actions (Spontaneous):**
  \*   Actions initiated by the concept itself, potentially triggering syncs.
  \*   *Example: `Post.deleted(post_id)` (after a user deletes a post through the `Post` concept).*

**5. Behavior/Protocol (Operational Semantics):**
Describes how the concept's state changes in response to actions, and any spontaneous output actions that occur. This effectively captures the "human behavioral protocol" and the API's implementation logic *within this concept*.

* *Example for `Upvote.vote(item_id, user_id, type)`:*
  \*   "If `user_id` has not previously voted on `item_id` with `type`, then record the vote in the `Vote` state. Update the `ItemPopularity` for `item_id` accordingly. If `user_id` *has* previously voted with the *same* type, the action has no effect. If `user_id` has previously voted with the *opposite* type, remove the old vote and add the new one, updating `ItemPopularity`."

***

## Difference between principle and purpose?

In the context of Concept Design as described:

* **Purpose:** The **specific function or goal** of a single concept. It's *what* a particular concept is designed to achieve for the user, and *why* it exists. Each concept has its own, distinct purpose.
  * **Example:** The *purpose* of the `Upvote` concept is "to rank items by popularity." The *purpose* of `RestaurantReservation` is to manage reservations.
  * The text states: "Improved focus on the purposes and motivations of the functionality, since each concept is closely targeted at delivering a particular function of value."

* **Principle:** A **fundamental truth, rule, or belief** that guides the design and implementation of *all* concepts and the overall Concept Design approach. These are general guidelines that lead to the advantages listed (modularity, reusability, independence, etc.). Principles dictate *how* concepts should be designed and interact (or not interact).
  * **Examples from the text:**
    * **Concept Independence:** "Each concept is defined without reference to any other concepts, and can be understood in isolation." (This is a core principle guiding how concepts are structured).
    * **Separation of Concerns:** "each concept addresses only a single, coherent aspect of the functionality of the application, and does not conflate aspects of functionality that could easily be separated." (A principle guiding the scope of a concept).
    * **Completeness of Functionality:** "concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts." (Another principle ensuring modularity).
    * **Polymorphism:** The principle that designers should "strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments." (A principle guiding action design for independence and reusability).

In short: A **purpose** tells you *what a specific concept does*. A **principle** tells you *how to design concepts generally* to achieve the desired qualities of the Concept Design approach.

## How to keep different concepts independent/modular?

The text outlines several key mechanisms and principles to ensure concepts remain independent and modular:

1. **Mutual Independence (No Direct References):**
   * This is the most significant distinguishing feature. "Each concept is defined without reference to any other concepts, and can be understood in isolation."
   * Concepts are strictly forbidden from directly calling or knowing about the internal state or actions of other concepts. This prevents tight coupling and ensures that modifying one concept doesn't necessitate changes in others.

2. **Polymorphism in Action Arguments:**
   * Design actions to accept generic arguments (e.g., `item_id`, `user_id`) rather than specific object types (`PostObject`, `UserInstance`).
   * "The designer of a concept should strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments." This makes concepts reusable across different contexts where the "type" of the item or user might vary.

3. **Strict Separation of Concerns:**
   * Each concept focuses on "a single, coherent aspect of the functionality."
   * Avoid conflating different concerns, especially around common entities like `User`. Instead of a monolithic `User` class, concerns like authentication, profiles, naming, and notifications are split into distinct concepts (`UserAuthentication`, `Profile`, `Notification`). This prevents concepts from becoming entangled and makes them simpler and more robust.

4. **Completeness of Functionality:**
   * "Concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts."
   * If a concept needs to perform a certain operation (e.g., `Notification` needs to send an email), the logic for that operation must reside *within* the `Notification` concept itself, not be delegated to a separate `EmailSender` concept. This ensures that each concept can fulfill its purpose independently.

5. **Minimal and Targeted State:**
   * A concept's state should be "sufficiently rich to support the concept's behavior" but "no richer than it need be."
   * By limiting its internal state to only what's absolutely necessary for its specific purpose, a concept reduces its "knowledge" of other parts of the system, further promoting its independence. For example, `Upvote` only tracks user IDs and item IDs, not user names or item content.

6. **Composition by Synchronization (Syncs):**
   * Since concepts cannot refer to each other, they are "composed using *synchronizations*."
   * Syncs are external rules that observe actions and state changes in one concept (`when` / `where`) and trigger actions in another concept (`then`).
   * This provides a powerful mechanism for inter-concept communication and coordination *without* building direct dependencies into the concepts themselves. Syncs act as the "glue" that orchestrates application behavior from independent building blocks.
