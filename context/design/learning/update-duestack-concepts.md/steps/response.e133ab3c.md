---
timestamp: 'Sat Oct 18 2025 20:25:45 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_202545.071acb66.md]]'
content_id: e133ab3c9a868a555179ce9269dfbb9d4cf28e3f33aeb70aeef787fda101a47b
---

# response:

In the Concept Design framework, the bracket notation `[User]` in `UserAuthentication [User]` indicates that `User` is a **type parameter** (or generic parameter) for the `UserAuthentication` concept.

Here's what that means:

1. **Generic Type:** The `UserAuthentication` concept itself does *not* define what a `User` is or what properties a `User` has. Instead, it expects to receive `User` identifiers (IDs) from an **external source or another concept**.
2. **Opaque Identifier:** Inside `UserAuthentication`, `User` is treated as an opaque identifier. The concept can compare two `User` IDs to see if they refer to the same entity, but it cannot assume anything else about the `User` (e.g., its name, email, profile picture, etc.). This enforces **polymorphism** and **independence**.
3. **Role in `UserAuthentication`:** In your specific design, the `UserAuthentication` concept uses these external `User` IDs to *associate* authentication-specific data (like `username`, `passwordHash`, `sessionID`, `canvasOAuthToken`) with them. It handles the *behavior* of authentication *for* these `User` entities.
4. **Relationship to the `Users` Concept:** The `Users` concept you defined (`concept Users`) is responsible for actually *creating* and managing the fundamental `User` entities (their unique IDs, email, and name). So, in a full application, the `Users` concept would be the one producing the `User` IDs that `UserAuthentication` then uses as its generic parameter.

In essence, `UserAuthentication [User]` tells you: "This concept works with a type called `User`, but it doesn't own or define `User`; it simply references `User` entities that are managed elsewhere, treating them as abstract identifiers." This is a cornerstone of the concept independence principle.
