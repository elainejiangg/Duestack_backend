---
timestamp: 'Sun Oct 19 2025 20:29:50 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_202950.4b979750.md]]'
content_id: 6a14e6b123faca7afdac5f6d44cafa6cb6fea769d5e777ee41aba6aecdc4c3f4
---

# API Specification: Labeling Concept

**Purpose:** associate labels with items and allow retrieval of items by label

***

## API Endpoints

### POST /api/Labeling/createLabel

**Description:** Creates a new label with the given name.

**Requirements:**

* no Label with the given `name` already exists

**Effects:**

* creates a new Label `l`
* sets the name of `l` to `name`
* returns `l` as `label`

**Request Body:**

```json
{
  "name": "string"
}
```

**Success Response Body (Action):**

```json
{
  "label": "ID"
}
```

**Error Response Body:**

```json
{
  "error": "string"
}
```

***

### POST /api/Labeling/addLabel

**Description:** Associates a label with a specific item.

**Requirements:**

* `item` exists
* `label` exists
* `item` is not already associated with `label`

**Effects:**

* associates `label` with `item`

**Request Body:**

```json
{
  "item": "ID",
  "label": "ID"
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

### POST /api/Labeling/deleteLabel

**Description:** Removes the association of a label from an item.

**Requirements:**

* `item` exists
* `label` exists
* `item` is associated with `label`

**Effects:**

* removes the association of `label` from `item`

**Request Body:**

```json
{
  "item": "ID",
  "label": "ID"
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
