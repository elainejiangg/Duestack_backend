---
timestamp: 'Tue Oct 21 2025 10:55:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_105536.b8a66f77.md]]'
content_id: 435a3f5ad1580975d20691202cab11a72fa784682ff28bbe781ce14930e25e9f
---

# API Specification: UserAuthentication Concept

**Purpose:** allow users to securely register, log in, and manage their credentials.

***

## API Endpoints

### POST /api/UserAuthentication/register

**Description:** Registers a new user with a unique username and password.

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

**Description:** Allows a user to log in with their username and password, establishing a session.

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

**Description:** Logs out a user by invalidating their session.

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

**Description:** Allows a user to change their password.

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

**Description:** Stores the Canvas OAuth token for a user, enabling Canvas data fetching.

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

**Description:** Clears the Canvas OAuth token for a user.

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
