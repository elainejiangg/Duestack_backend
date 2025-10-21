---
timestamp: 'Sun Oct 19 2025 20:38:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_203852.83586eb5.md]]'
content_id: 63ab70aa2ced63bf75fe7a15cefb7e3fb99dd4a7972a89605fa344061fa4cdad
---

# API Specification: UserAuthentication Concept

**Purpose:** allow users to securely register, log in, and manage their credentials.

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

**Requirements:**

* username is unique and password meets complexity requirements

**Effects:**

* creates a new AuthenticatedUser, associating the provided User ID with a username and hashed password.

**Request Body:**

```json
{
  "user": "string",
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/login

**Description:** Generates a new sessionID for the AuthenticatedUser after successful login.

**Requirements:**

* username and password match an existing AuthenticatedUser

**Effects:**

* generates a new sessionID for the AuthenticatedUser.

**Request Body:**

```json
{
  "username": "string",
  "password": "string"
}
```

**Success Response Body (Action):**

```json
{
  "sessionID": "string",
  "user": "string"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/logout

**Description:** Clears the sessionID for the associated AuthenticatedUser, ending the session.

**Requirements:**

* sessionID is valid

**Effects:**

* clears the sessionID for the associated AuthenticatedUser.

**Request Body:**

```json
{
  "sessionID": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/changePassword

**Description:** Updates the password hash for the specified User.

**Requirements:**

* user exists, oldPassword matches, newPassword meets complexity requirements

**Effects:**

* updates the passwordHash for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "oldPassword": "string",
  "newPassword": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/connectCanvas

**Description:** Stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

**Requirements:**

* user exists and canvasOAuthToken is valid

**Effects:**

* stores or updates the Canvas OAuth token for the user, enabling Canvas data fetching.

**Request Body:**

```json
{
  "user": "string",
  "canvasOAuthToken": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/UserAuthentication/disconnectCanvas

**Description:** Clears the Canvas OAuth token for the user.

**Requirements:**

* user exists and has an existing canvasOAuthToken

**Effects:**

* clears the Canvas OAuth token for the user.

**Request Body:**

```json
{
  "user": "string"
}
```

**Success Response Body (Action):**

```json
{}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***
