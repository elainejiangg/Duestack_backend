---
timestamp: 'Sun Oct 19 2025 20:38:52 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_203852.83586eb5.md]]'
content_id: 77608fdff2f4ece720b30842c70ba9915be02a574e5db4cefbc700d8d1da2b77
---

# API Specification: UserIdentity Concept

**Purpose:** manage the core, unique identity and basic profile information for individuals interacting with the system.

***

## API Endpoints

### POST /api/UserIdentity/createUser

**Description:** Creates a new user identity, storing their unique email and display name, and returns the opaque ID of the new user.

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
