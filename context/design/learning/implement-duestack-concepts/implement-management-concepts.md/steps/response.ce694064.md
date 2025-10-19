---
timestamp: 'Sun Oct 19 2025 01:15:26 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_011526.2a963ae0.md]]'
content_id: ce694064cd54d4d6dcc1aa1e0294a820711092abbd270c6ec8fd98de1f984d03
---

# response:

That's an excellent question, and it gets to the heart of what distinguishes Concept Design from more traditional object-oriented approaches! Let's "argue" it out using the rubric as guidance.

**Your Argument (Implicit):** Why isn't `User` a concept that other concepts can directly interact with or extend, like a central `User` object or class?

**My Rebuttal (Based on Concept Design Rubric):**

The reason `User` is used as a generic parameter (an opaque `ID`) across most concepts, with `UserIdentity` (and `UserAuthentication`, etc.) managing *aspects* of it, is to enforce the core principles of Concept Design:

1. **Separation of Concerns:**
   * **Rubric:** "each concept addresses only a single, coherent aspect of the functionality of the application, and does not conflate aspects of functionality that could easily be separated."
   * **Application:** A `User` entity, in a real application, is a bundle of many distinct concerns:
     * **Identity:** What makes a user unique (email, name). This is handled by `UserIdentity`.
     * **Authentication:** How a user proves who they are (username, password, session). This is handled by `UserAuthentication`.
     * **Profile:** Displayable information (bio, avatar, preferences). This would be a separate `UserProfile` concept.
     * **Roles/Permissions:** What a user is allowed to do. This would be a `UserAuthorization` or `RoleManagement` concept.
   * If `User` were a single concept, it would inevitably conflate these distinct concerns into one monolithic unit. Other concepts would then have to interact with a `User` concept that has a very broad purpose, making it less focused and harder to reuse parts of the "user" functionality independently.

2. **Independence:**
   * **Rubric:** "Concepts are fully independent of each other, and can therefore be understood and used independently of one another."
   * **Rubric (Failing Example):** "Concept action 'calls' an action of another concept or queries the state of another concept." or "Concept treats arguments as objects that have been constructed elsewhere (eg, takes in a user object that is assumed to have a name field)."
   * **Application:**
     * By making `User` an opaque `ID` (a generic parameter like `Author` or `Respondent` in `LikertSurvey`), concepts like `CourseManagement` don't need to know *anything* about how a `User` authenticates, what their email is, or what their profile picture looks like. They just need a unique identifier to associate with a course creator.
     * If `User` were a concept containing all `User` data, then `CourseManagement` would have to implicitly or explicitly "depend" on the internal state or actions of that `User` concept. For example, if `CourseManagement` wanted to display the creator's name, it would need to `query` the `User` concept's state directly, or the `User` concept would need to have actions like `getName(user: User): (name: String)`, which creates a direct behavioral dependency.
     * Instead, the `UserIdentity` concept *creates* the `User` ID. Other concepts *receive* or *reference* this `User` ID and treat it as a black box (polymorphic).

3. **Polymorphism and Generic Parameters:**
   * **Rubric:** "Polymorphism is key to independence: the designer of a concept should strive to make the concept as free as possible of any assumptions about the content and interpretation of objects passed as action arguments. Even if a `Comment` concept is used within an app only for comments on posts, it should be described as applying comments to arbitrary targets, defined only by their identity."
   * **Application:** `User` itself is that "arbitrary target" for other concepts.
     * `CourseManagement [User]` means `CourseManagement` works with any type of `User` ID, regardless of what `UserIdentity` or `UserAuthentication` might define for it. It only knows `User` as an identifier.
     * This allows `User` to be the unifying identifier across different concerns without coupling those concerns together.

4. **Concepts are not Objects:**
   * **Rubric:** "A concept holds in its state the set of all objects that are involved in the behavioral concern that it embodies, rather than the properties of a single object."
   * **Rubric:** "Concepts separate concerns, unlike objects in object oriented programming which tend to aggregate all properties and methods associated with a class of object."
   * **Application:** In an OO system, you'd likely have a `User` class with properties like `email`, `name`, `passwordHash`, `canvasOAuthToken`, etc. This single class aggregates all "user" related data and behavior. Concept Design explicitly aims to break this aggregation.
     * `UserIdentity` holds the *set of all Users* and their core identity properties (`email`, `name`).
     * `UserAuthentication` holds the *set of all AuthenticatedUsers* and their authentication properties (`username`, `passwordHash`, `sessionID`, `canvasOAuthToken`).
     * These are two separate "views" or "facets" of the same underlying `User` entity (identified by its opaque `ID`). This pattern is explicitly supported and encouraged by the "Two views of a declaration" section in the SSF documentation, which highlights how "multiple declarations can define structural aspects of the 'same object.'"

**Conclusion:**

Making `UserIdentity` and `UserAuthentication` (and potentially `UserProfile` later) separate, singular concepts that *manage* aspects of an opaque `User` ID is a direct and robust application of Concept Design principles. It prioritizes:

* **Sharp Separation of Concerns:** Each concept has a very focused responsibility.
* **High Independence:** Concepts can evolve and be reused without affecting others, as they only deal with `User` as an abstract identifier.
* **Composability:** The complete "user" functionality is composed via synchronizations between these independent concepts, rather than being bundled into one large, less modular unit.

This approach creates a more flexible, scalable, and understandable system in the long run, even if it initially requires breaking down what might seem like a single "User" into multiple specialized concepts.
