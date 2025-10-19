---
timestamp: 'Sun Oct 19 2025 01:05:12 GMT-0400 (Eastern Daylight Time)'
parent: '[[../20251019_010512.56841c14.md]]'
content_id: dff62ce7aa8045dbb081e8ca12f30b47dd9fcb039ed0a799f94a181501b9ea8c
---

# question:

ejian@MacBook-Pro-93 Duestack\_backend %    deno test -A
Check file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserAuthenticationConcept.test.ts
Check file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserIdentityConcept.test.ts
Check file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/LikertSurvey/LikertSurveyConcept.test.ts
TS2307 \[ERROR]: Cannot find module 'file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/useridentity/UserIdentityConcept.ts'.
at file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserAuthenticationConcept.test.ts:4:33

TS2339 \[ERROR]: Property 'error' does not exist on type '{ sessionID: string; user: ID; } | { error: string; }'.
Property 'error' does not exist on type '{ sessionID: string; user: ID; }'.
assertEquals("error" in loginResult, false, `Login should succeed: ${loginResult.error}`);
\~~~~~
at file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserAuthenticationConcept.test.ts:51:86

TS2304 \[ERROR]: Cannot find name 'freshID'.
const weakPasswordResult = await userAuthConcept.register({ user: freshID() as ID, username: "weakuser", password: "weak" });
\~~~~~~~
at file:///Users/ejian/mitClasses/61040/Duestack\_backend/src/concepts/DueStack/UserAuthenticationConcept.test.ts:92:71

Found 3 errors.

error: Type checking failed.

info: The program failed type-checking, but it still might work correctly.
hint: Re-run with --no-check to skip type-checking.
ejian@MacBook-Pro-93 Duestack\_backend %

I got the following when running your new tests
