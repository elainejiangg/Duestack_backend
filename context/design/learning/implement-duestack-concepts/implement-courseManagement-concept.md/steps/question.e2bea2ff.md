---
timestamp: 'Sun Oct 19 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010512.56841c14.md]]'
content_id: e2bea2ff37d45dd1af0c9b06d447d9c59ec724684825d54ec6f2f57c14e4b15b
---

# question: fyi your import paths are incorrect

here are the correct paths:

```
import { assertEquals, assertExists, assertNotEquals, assertNotStrictEquals, assertStrictEquals } from "jsr:@std/assert";

import { testDb } from "@utils/database.ts";

import { ID } from "@utils/types.ts";

import { freshID } from "@utils/database.ts"; // Added: Import freshID

import UserIdentityConcept from "./UserIdentityConcept.ts";

import UserAuthenticationConcept from "./UserAuthenticationConcept.ts";

```

Since obsedian can't view .ts scipts, it's hard to provide the right context/info espeically as it import paths. I switch between Cursor and Obsedian to aid with this.
