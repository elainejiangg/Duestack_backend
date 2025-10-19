---
timestamp: 'Sat Oct 18 2025 20:29:54 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_202954.0bda1122.md]]'
content_id: 3ae6c376c1dd1c1d2a41e15e7ce8b635a0143eb32b24eb11f0428370ded967ea
---

# response:

This is a fundamental and excellent question that gets to the very heart of Concept Design's principles of modularity and independence! It's a common point of confusion, so let's clarify it carefully.

You've hit on the core challenge: how do you combine functionality when concepts are supposed to be completely independent?

Here's the breakdown:

1. **All Concept Entities Have Opaque IDs (Implicit Assumption):**
   Yes, it is a foundational assumption in Concept Design that every "object" or "entity" (like `User`, `Course`, `Survey`, `Deadline`, `Question`, `Document`, `ParsedDeadlineSuggestion`) that a concept manages *has a unique, opaque identifier*. When you declare `a set of Users`, you are implicitly declaring a set of `User` *identifiers*. When you have `a Course` as a field, it stores a `Course` *identifier*.
   These IDs are the "handle" or "reference" to an entity. Concepts don't deal with complex, nested objects being passed around; they deal with these simple, comparable IDs.

2. **Generic Parameters (`[User]`) Enforce Opacity and Polymorphism:**
   When `UserAuthentication` declares `[User]`, it's saying: "I will interact with entities of a type called `User`. I expect to receive `User` IDs as input to my actions, or store `User` IDs in my state. However, I make *no assumptions* about what a `User` actually *is* or what properties it might have (like `email` or `name`). For me, `User` is just an opaque identifier."

   This is polymorphism: `UserAuthentication` can operate on *any* type that acts as a `User` ID, regardless of its internal structure, because `UserAuthentication` only ever needs to compare `User` IDs or store them. It doesn't need to read `user.email` or `user.name`.

3. **Concepts Do NOT Directly "Use" Each Other:**
   This is the crucial distinction. Concept A *never* calls an action of Concept B, nor does it directly read or write the internal state of Concept B. If it did, that would create a direct dependency and violate independence.

   Instead, interactions happen through:

   * **Action Arguments:** If `UserAuthentication` needs to know *which* `User` it's authenticating, that `User`'s ID is passed as an *argument* to an `UserAuthentication` action (e.g., `register (user: User, ...)`).
   * **Synchronization Rules (Syncs):** This is the "glue" that allows concepts to work together without knowing about each other. Syncs live *outside* the individual concepts. A sync observes events (actions) and state changes in one or more concepts, and based on those observations, it can then trigger actions in other concepts.

Let's illustrate with your `Users` and `UserAuthentication` concepts:

**`Users` Concept:**

* **Purpose:** To create and manage the fundamental `User` *identities* (their IDs, email, name).
* **Action:** `createUser(email: String, name: String): (user: User)` returns a `User` ID.
* **Internal State:** Maps `User` IDs to their `email` and `name`.

**`UserAuthentication` Concept (`[User]`):**

* **Purpose:** To manage authentication *for existing `User` IDs*.
* **Action:** `register(user: User, username: String, password: String): Empty`
* **Internal State:** Maps `User` IDs (which came from `Users`) to their `username`, `passwordHash`, `sessionID`.
* **Crucial Point:** `UserAuthentication` *doesn't know* how the `User` ID (`user: User`) that was passed to `register` was created. It just accepts it as a valid `User` identifier and stores authentication-related data against it. It does not try to read the `email` or `name` of that `User` ID.

**How They Work Together (via Syncs):**

Imagine a scenario where a new user signs up for your app.

1. **User `Request`:** The user's front-end (or a `Request` pseudo-concept) initiates a "sign up" action.
2. **`Users` Creates the Core ID:** A sync might observe this `Request` and trigger:
   ```
   sync CreateCoreUser
   when Request.signUp (email: e, name: n)
   then Users.createUser (email: e, name: n) : (user: u) // u is a new, opaque User ID
   ```
3. **`UserAuthentication` Registers Credentials for that ID:** Another sync (or the same one, if chaining is allowed and immediate) then takes that newly created `User` ID (`u`) and passes it to `UserAuthentication`:
   ```
   sync RegisterAuthenticationDetails
   when Users.createUser (email: e, name: n) : (user: u)
   then UserAuthentication.register (user: u, username: deriveUsername(e), password: hash(request.password))
   ```

Notice:

* `Users` doesn't know about `UserAuthentication`.
* `UserAuthentication` doesn't know about `Users`. It just gets a `User` ID and stores authentication details against it.
* The `sync` is the external orchestrator that "knows" about both concepts and how to connect their actions and data (specifically, how to pass the `User` ID from `Users` to `UserAuthentication`).

This strict separation, mediated by opaque IDs and external synchronizations, is what gives Concept Design its power for modularity and reuse. Each concept can be designed, implemented, and tested in complete isolation, as long as it adheres to the contract of its generic parameters (i.e., treating them as opaque IDs) and defines clear actions and state changes that can be observed by syncs.
