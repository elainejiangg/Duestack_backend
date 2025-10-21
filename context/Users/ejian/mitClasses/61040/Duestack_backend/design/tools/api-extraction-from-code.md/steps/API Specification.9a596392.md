---
timestamp: 'Tue Oct 21 2025 10:55:36 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251021_105536.b8a66f77.md]]'
content_id: 9a596392170f5aacb84f0acd5028278a16b074b08dda6489510259913fccd79c
---

# API Specification: UserIdentity Concept

**Purpose:** manage the core, unique identity and basic profile information for individuals interacting with the system.

***

## API Endpoints

### POST /api/UserIdentity/createUser

**Description:** Creates a new user identity, storing their unique email and display name.

**Requirements:**

* email is unique

**Effects:**

* a new User entity is created with the given email and name, and its opaque ID is returned.

**Request Body:**

```json
{
  "email": "string",
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
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

### POST /api/UserIdentity/updateUserName

**Description:** Updates the display name for the specified User.

**Requirements:**

* user exists

**Effects:**

* updates the name for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "newName": "string"
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

### POST /api/UserIdentity/updateUserEmail

**Description:** Updates the email address for the specified User.

**Requirements:**

* user exists and newEmail is unique

**Effects:**

* updates the email for the specified User.

**Request Body:**

```json
{
  "user": "string",
  "newEmail": "string"
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
