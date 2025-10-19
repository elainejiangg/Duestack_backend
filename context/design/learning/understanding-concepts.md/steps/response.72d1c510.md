---
timestamp: 'Sat Oct 18 2025 17:29:30 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_172930.b91adfab.md]]'
content_id: 72d1c510bad4f8372a6c1fb44a0385f14810dd0d70fcd8d7b445d31d9dcad708
---

# response:

Based on the provided text, here are the answers to your questions:

***

## What is the format for writing a concept spec?

While the document doesn't explicitly provide a formal "template" for a concept specification, it describes the essential elements and characteristics that a concept specification must capture. Synthesizing these points, a concept specification would generally include:

1. **Concept Name/Identifier:** A clear, concise name for the concept (e.g., *Upvote*, *RestaurantReservation*, *Post*, *Comment*, *UserAuthentication*).

2. **Purpose Statement:** A clear and intelligible description of the concept's core purpose and the value it provides to users, often expressed as a verb or a goal.
   * *Example (Upvote):* "to rank items by popularity."
   * *Example (RestaurantReservation):* "to manage reservations for a restaurant."

3. **State Definition:** A detailed description of the data the concept maintains, including:
   * **Kinds of Objects:** The types of entities involved (e.g., for *Upvote*, items and users).
   * **Relationships:** How these objects are related within the concept's scope (e.g., for *Upvote*, the relationship between items and users who have approved/disapproved them).
   * **Properties/Fields:** The specific attributes of these objects that are relevant to the concept's behavior. The state should be *sufficiently rich* but *no richer than need be* (e.g., *Upvote* needs user identity to prevent double voting, but not user's name).
   * **Persistence:** A note that this state is typically persistent, usually in a database.

4. **Action Definitions:** A list of atomic actions the concept supports, categorized as:
   * **User-Initiated Actions:** Actions performed by users (e.g., for *RestaurantReservation*: `reserve`, `cancel`).
   * **Output/Spontaneous Actions:** Actions that occur under the concept's control, not directly by a user (the text implies these but doesn't explicitly name examples for this category, but one could imagine a `notifyAboutReservationReminder` action).
   * **API Specification:** For each action, details similar to a backend API:
     * Action Name (e.g., `delete`, `reserve`).
     * Input Arguments: What data/identifiers are required for the action (e.g., `delete (p)` for post `p`).
     * Preconditions/Invariants: Rules that must be true for the action to succeed (e.g., *Upvote* preventing double voting).
     * Postconditions/Effects: How the state changes after the action, and any output actions triggered.

5. **Behavioral Protocol (Human-Centric Description):** A description of the concept's behavior from a human user's perspective, explaining the typical flow and interaction patterns (e.g., for *RestaurantReservation*: "reserving, perhaps canceling, being seated on arrival").

6. **Constraints/Assumptions:** Any specific rules or constraints inherent to the concept's logic (e.g., an *Upvote* concept ensures a user can only upvote an item once).

7. **Polymorphism Principle:** An explicit statement that the concept strives to be as free as possible from assumptions about the content and interpretation of objects passed as arguments, using generic identities rather than specific types from other concepts.

**In essence, a concept spec would look like a combination of a precise API definition (for developers) and a clear behavioral protocol (for users and designers), focused on a single, coherent piece of user-facing functionality.**

***

## Difference between principle and purpose?

In the context of Concept Design as described:

* **Purpose:** The *purpose* of a concept is its **specific goal or function** – *what it is designed to achieve* or *what value it delivers*. It is inherent to a particular concept and explains *why that concept exists*.
  * **Example:** The *purpose* of the *Upvote* concept is "to rank items by popularity." The *purpose* of the *RestaurantReservation* concept is to manage the booking and seating process for a restaurant. Each concept has its own distinct purpose.

* **Principle:** A *principle* is a **fundamental rule, belief, or guiding characteristic** that defines the *Concept Design methodology itself*. These are overarching tenets that apply to *all concepts* and guide how they are designed, implemented, and understood. They describe *how the system works* or *should be structured*.
  * **Examples from the text:**
    * **Concept Independence:** "Each concept is defined without reference to any other concepts, and can be understood in isolation." This is a foundational principle for the entire approach.
    * **Separation of Concerns:** "each concept addresses only a single, coherent aspect of the functionality of the application, and does not conflate aspects of functionality that could easily be separated." This is a guiding principle for how functionality is partitioned.
    * **Completeness of functionality:** "concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts." This is a design principle ensuring self-sufficiency.
    * **Reusability:** The archetypal nature of concepts, allowing them to be used across applications and providing familiarity for users, is a key principle.

In short, a **purpose** is about the *what* of an individual concept, while a **principle** is about the *how* and *why* of the Concept Design approach as a whole.

***

## How to keep different concepts independent/modular?

The text highlights several key mechanisms and principles for maintaining the independence and modularity of concepts:

1. **Defining Concepts in Isolation:**
   * "Each concept is defined without reference to any other concepts, and can be understood in isolation." This means no explicit imports, calls, or direct references to other concepts within a concept's own definition.

2. **Strict Separation of Concerns:**
   * Concepts are designed to address "only a single, coherent aspect of the functionality." This prevents conflation of different functionalities that could be separated.
   * **Example:** Instead of a monolithic `User` class handling everything, functionalities like authentication, profiles, naming, and notification channels are broken down into distinct concepts (*UserAuthentication*, *Profile*, *Notification*), each managing only its relevant user-related state.

3. **Completeness of Functionality:**
   * "Concepts are *complete* with respect to their functionality and don't rely on functionality from other concepts." If a concept needs to perform an action (e.g., *Notification* needs to deliver a notification), it encapsulates that capability directly rather than calling out to another concept for it.

4. **Polymorphic Action Arguments:**
   * "The designer of a concept should strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments."
   * Concepts should accept generic identifiers (e.g., `target of c is p` where `p` is just an identifier for an item, not necessarily a `Post` object from a `Post` concept), allowing them to operate on various types of data without needing to know their specific origin or internal structure in other concepts.

5. **Composition by External Synchronization (Syncs):**
   * This is the *primary mechanism for interaction* between concepts without violating their independence. Instead of concepts directly calling each other, an external "sync" mechanism orchestrates interactions.
   * Syncs define rules: "*when* an action happens in one concept, *where* the state of some concept has some property, *then* some action happens in another concept."
   * **Example:** The *Post* concept doesn't know about *Comment* deletion. An external `CascadePostDeletion` sync observes `Post.delete(p)` and then triggers `Comment.delete(c)` based on the relationship it finds in the *Comment* concept's state.

By adhering to these principles, Concept Design aims to create highly modular, reusable, and independently understandable units of functionality that can be composed flexibly without tightly coupling their internal definitions.
