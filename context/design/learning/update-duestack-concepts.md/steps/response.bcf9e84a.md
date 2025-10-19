---
timestamp: 'Sat Oct 18 2025 20:34:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251018_203450.bb68b6e2.md]]'
content_id: bcf9e84a161a7510217d2e1b976410cb12fc5d5c1b928a846aea3c62acc18154
---

# response:

This is a fantastic follow-up question, as "opaque IDs" and "polymorphism" are truly central to understanding concept independence and modularity. Let's break it down with examples.

***

### What do we mean by "Opaque IDs"?

An **opaque ID** means that when a concept references an entity (like `User`, `Course`, `Document`, etc.) via its ID, that concept **does not, and should not, know or care about the internal structure or properties of the identified entity.**

* **Opaque:** You can't "see through" it to access its details. It's a black box.
* **ID:** It's just a unique identifier (like a UUID, a string, or a number).

The only operations a concept can perform on an opaque ID are:

1. **Storage:** Store the ID in its own state (e.g., `Deadlines` stores a `Course` ID).
2. **Comparison:** Check if two IDs are the same (e.g., `if (userA === userB)`).
3. **Passing as an argument:** Pass the ID to an action of another concept (via a sync).
4. **Returning as a result:** Return the ID from an action.

A concept **must not** attempt to dereference an opaque ID to access properties of the entity it identifies (e.g., you cannot do `user.email` or `course.title` *inside* a concept if `user` or `course` came in as an opaque ID, or if the concept holds them in its state as opaque IDs).

### What do we mean by "Polymorphism" in this context?

In Concept Design, **polymorphism** (specifically parametric polymorphism, or generics) means that a concept with type parameters (like `[User]`) is designed to work correctly with **any** concrete type that is supplied for that parameter, *as long as that concrete type behaves like an opaque ID*.

Because the concept only performs storage and comparison operations on these generic IDs, it doesn't matter what "kind" of `User` it is (e.g., a `User` from a simple username/password system, a `User` from an OAuth system, a `User` that just has a UUID and nothing else). The `UserAuthentication` concept, for example, will function identically, regardless of the specific details of the `User` objects that are being authenticated.

This is why generic parameters are crucial: they signal that the concept is truly decoupled from the specific implementation details of those types.

***

### Example that **Breaks** Modularity

Let's imagine a `Notification` concept that needs to send emails to users.

**Problematic `Notification` Concept (Breaks Modularity):**

```concept
concept Notification [AlertTarget]
purpose send notifications to users about various events

state
a set of NotificationEvents with
  an alertTarget AlertTarget // What the notification is about (e.g., a Deadline)
  a message String
  a recipient User // The user to notify
  a sent Flag = false

actions
sendNotification (alertTarget: AlertTarget, message: String, recipient: User)
  requires recipient.email is valid // <-- PROBLEM HERE
  effects creates a NotificationEvent, sends an email to recipient.email with message.
```

**Why this breaks modularity and uses non-opaque IDs:**

* **Non-Opaque `User` ID:** The `sendNotification` action's `requires` clause directly accesses `recipient.email`. This means the `Notification` concept is *assuming* that the `User` entity (which `recipient` is an ID for) has an `email` property. This is a direct violation of the opaque ID principle.
* **Direct Dependency:** The `Notification` concept is now directly dependent on the `User` concept (or `UserProfile` concept) to define and expose an `email` field.
  * If the `User` concept decides to store `email` differently (e.g., in a separate `ContactInfo` concept), `Notification` breaks.
  * If `Notification` is reused in an app where `User`s don't have emails (e.g., only SMS numbers), the `Notification` concept is not reusable without modification.
* **Conflated Concerns:** The `Notification` concept is conflating the concern of "generating and sending notifications" with the concern of "knowing user contact details." The latter belongs to a separate concept, like `ContactChannels` or `UserProfile`.

***

### Example that **Fixes** Modularity

To fix this, we introduce another concept to manage contact information and use synchronizations to mediate the interaction.

**Revised `Notification` Concept (Modular and Opaque IDs):**

```concept
concept Notification [AlertTarget, Recipient]
purpose manage the generation and recording of notification requests.
principle a concept can request a notification for a Recipient, and the notification is recorded.

state
a set of NotificationRequests with
  an alertTarget AlertTarget // What the notification is about (e.g., a Deadline)
  a message String
  a recipient Recipient // The recipient's ID (opaque)
  a requestedAt DateTime
  an optional sent Flag = false // Managed by syncs, not internal action

actions
requestNotification (alertTarget: AlertTarget, message: String, recipient: Recipient) : (notificationRequest: NotificationRequest)
  requires true
  effects creates a new NotificationRequest.
```

**New `ContactChannels` Concept (for user contact details):**

```concept
concept ContactChannels [User]
purpose store and manage contact information for users.
principle users can register various contact methods (email, phone), and these can be retrieved.

state
a set of UserContactInfo with
  a user User
  an optional email String
  an optional phoneNumber String
  // ... other contact methods

actions
setEmail (user: User, email: String): Empty or (error: String)
  requires user exists
  effects sets the email address for the user.

setPhoneNumber (user: User, phoneNumber: String): Empty or (error: String)
  requires user exists
  effects sets the phone number for the user.

// Queries (implicitly or explicitly defined if complex)
// _getEmail (user: User): (email: String)
// _getPhoneNumber (user: User): (phoneNumber: String)
```

**How they interact via `Synchronization` (the "glue"):**

```
sync SendEmailNotification
when Notification.requestNotification (alertTarget: at, message: m, recipient: r) : (notificationRequest: nr)
where // (1) Find the user associated with the Recipient ID (if Recipient is a User ID)
      // Assuming 'Recipient' is the same type as 'User' in this application context.
      in ContactChannels: user of UserContactInfo is r
      in ContactChannels: email of UserContactInfo is e // (2) Get the email for that user

then // (3) An external, non-concept action actually sends the email.
     // This would typically be a system-level function or another concept (e.g., an EmailService concept, but that's a deeper rabbit hole).
     // For simplicity, imagine 'ExternalEmailSender.send(e, m)' is the actual implementation.
     // Then, update the NotificationRequest's status.
     Notification.markSent (notificationRequest: nr) // (4) Mark the request as sent
```

*(Note: A `Notification.markSent` action would need to be added to the `Notification` concept for this sync to work fully)*

**Why this fixes modularity:**

* **Opaque `Recipient` (User) ID in `Notification`:** The `Notification` concept *only* receives a `Recipient` ID. It doesn't attempt to access `recipient.email`. It is completely unaware of how to send an email or what a `User`'s contact details are.
* **Independence:** `Notification` is independent of `ContactChannels`. `ContactChannels` is independent of `Notification`. They manage distinct concerns.
* **Polymorphism in `Notification`:** The `Notification` concept can be reused in any application.
  * If `Recipient` IDs are `User` IDs, it works.
  * If `Recipient` IDs are `Team` IDs (and there's a `Team` concept managing team members, and a `ContactChannels` concept for `Team`s), `Notification` still works because it only deals with generic `Recipient` IDs. The `sync` layer would adapt to map `Team` IDs to `ContactChannels` for `Team`s.
* **Syncs as Orchestrators:** The `sync` acts as the orchestrator. It "knows" about both `Notification` and `ContactChannels` and mediates their interaction. It's the sync's job to:
  1. Observe a `Notification.requestNotification` action.
  2. Use the `recipient` ID from that action to look up the email in `ContactChannels` (this is allowed *in the `where` clause of the sync*, not inside the concept).
  3. Then trigger the actual email sending (an external side effect) and update the `Notification`'s internal `sent` status if applicable.

This approach ensures that each concept remains focused on its single purpose, truly independent, and highly reusable, with opaque IDs and external synchronizations facilitating their collaboration.
