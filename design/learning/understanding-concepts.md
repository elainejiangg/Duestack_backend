[@concept-design-overview](../background/concept-design-overview.md)

# questions: How to write a good concept?
# response:

Based on the provided text, writing a good concept involves adhering to several key principles that ensure modularity, reusability, independence, and a clear focus on user-facing functionality.

Here's how to write a good concept:

1.  **Define a Single, Well-Defined, and Intelligible Purpose:**
    *   Each concept should serve one specific, clear purpose that users can understand. It should be a "unit of user-facing functionality."
    *   **Example:** *Upvote* (ranking items by popularity), *RestaurantReservation* (managing reservations), *Post* (creating and managing posts).
    *   **Avoid:** Concepts that try to do too many unrelated things.

2.  **Ensure Complete Functionality for its Purpose:**
    *   A concept must be *complete* with respect to its own functionality. It shouldn't rely on calling actions or services of *other* concepts to fulfill its primary purpose.
    *   **Example:** A *Notification* concept must contain the logic to *actually deliver* a notification (e.g., via email or text), not just trigger another concept to do so.
    *   **Think:** Can this concept entirely stand alone and perform its stated function?

3.  **Maintain Strict Independence from Other Concepts:**
    *   This is perhaps the most crucial distinguishing feature. A concept must be defined and understood *without any reference to other concepts*.
    *   It should not directly call or depend on the internal logic or state of another concept.
    *   **Reason:** This enables individual concepts to be worked on by different teams, ensures reusability, and makes systems scalable and easier to comprehend.
    *   **Interactions:** All interactions between concepts happen externally through `syncs`, not internally within the concept's definition.

4.  **Embrace Polymorphism for Action Arguments:**
    *   To support independence and reusability, design concepts to be as generic as possible regarding the objects they interact with.
    *   **Rule:** Strive to make a concept free of assumptions about the content and interpretation of objects passed as arguments to its actions. Refer to objects only by their identity (e.g., an ID).
    *   **Example:** A *Comment* concept should allow comments on *arbitrary targets* (identified by an ID), not just "posts." The specific type of target is a concern for the application's overall orchestration, not the concept itself.

5.  **Focus on a Strong Separation of Concerns:**
    *   Avoid conflating different aspects of functionality that could logically be separated.
    *   **Rule:** Each concept addresses only a single, coherent aspect.
    *   **Example:** Instead of a monolithic `User` class handling everything, separate concerns into distinct concepts like *UserAuthentication*, *UserProfile*, *Notification*, *Karma*, etc. Each would manage its own specific state and actions related to users.

6.  **Manage its Own State (Sufficiently Rich, Yet Minimal):**
    *   A concept "maintains its own state" necessary for its behavior. This state typically involves relationships between different kinds of objects.
    *   **Sufficiently Rich:** The state must contain all information needed to support the concept's behavior. (e.g., *Upvote* needs user identity to prevent double voting).
    *   **No Richer Than Needed:** The state should *not* include any information that doesn't play a direct role in the concept's behavior. (e.g., *Upvote* doesn't need a user's name or email, just their ID).
    *   **Persistence:** This state is generally persisted in a database as part of a backend service.

7.  **Define Atomic, User-Facing Actions (and Human Behavioral Protocol):**
    *   Concepts interact with users (and other concepts via `syncs`) through atomic actions. These actions form an API specification for developers and a "human behavioral protocol" for users.
    *   **Example:** For *RestaurantReservation*, actions like `reserve`, `cancel`, `seat` correspond to both API endpoints and the real-world sequence of interactions.
    *   **Focus:** Actions should reflect observable, meaningful user or system behaviors.

8.  **Strive for Reusability and Archetypal Nature:**
    *   Good concepts are "archetypal" – they represent patterns of functionality that reappear across different applications.
    *   **Benefit:** This allows concepts to become repositories of design knowledge, fostering familiarity for users and reducing design/development effort.
    *   **Think:** Could this concept be used in another application, or instantiated multiple times within the same application for different roles (e.g., "upvoting posts" and "upvoting comments" using the same *Upvote* concept)?

By following these guidelines, you can create concepts that are truly modular, independent, reusable, and focused on delivering clear, valuable functionality within a larger software system.