```concept
concept UserAuthentication [User]
purpose allow users to securely register, log in, and manage their credentials.
principle a user can register with a unique username and password, log in to establish a session, and log out to end it.

state
a set of AuthenticatedUsers with
  a user User
  a username String
  a passwordHash String
  an optional sessionID String
  an optional canvasOAuthToken String // To store Canvas connection token

actions
register (user: User, username: String, password: String): Empty or (error: String)
  requires username is unique and password meets complexity requirements
  effects creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

login (username: String, password: String): (sessionID: String, user: User) or (error: String)
  requires username and password match an existing AuthenticatedUser
  effects generates a new sessionID for the AuthenticatedUser.

logout (sessionID: String): Empty or (error: String)
  requires sessionID is valid
  effects clears the sessionID for the associated AuthenticatedUser.

changePassword (user: User, oldPassword: String, newPassword: String): Empty or (error: String)
  requires user exists, oldPassword matches, newPassword meets complexity requirements
  effects updates the passwordHash for the specified User.

connectCanvas (user: User, canvasOAuthToken: String): Empty or (error: String)
  requires user exists and canvasOAuthToken is valid
  effects stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

disconnectCanvas (user: User): Empty or (error: String)
  requires user exists and has an existing canvasOAuthToken
  effects clears the Canvas OAuth token for the user.