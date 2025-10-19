
```concept
concept UserIdentity
purpose manage the core, unique identity and basic profile information for individuals interacting with the system.
principle new user identities can be created, storing their unique email and display name.

state
a set of Users with
  a email String
  a name String

actions
createUser (email: String, name: String): (user: User) or (error: String)
  requires email is unique
  effects a new User entity is created with the given email and name, and its opaque ID is returned.

updateUserName (user: User, newName: String): Empty or (error: String)
  requires user exists
  effects updates the name for the specified User.

updateUserEmail (user: User, newEmail: String): Empty or (error: String)
  requires user exists and newEmail is unique
  effects updates the email for the specified User.
