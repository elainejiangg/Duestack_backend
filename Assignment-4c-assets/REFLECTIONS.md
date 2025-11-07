# Assignment 4c: Project Reflections

---

## What Was Hard

### Backend Sync Implementation

- **Parameter Binding Complexity**: Understanding symbol-based binding for syncs required significant trial and error. Mismatches between frontend/sync/concept parameter names caused numerous "Missing binding" errors.
- **Optional Parameters**: Discovering that optional parameters couldn't be included in sync `when`/`then` clauses required multiple debugging cycles.
- **Cascade Deletion**: Implementing referential integrity in the sync `where` clause while maintaining transaction-like behavior was conceptually challenging.

### Frontend Debugging

- **Browser Caching**: Safari's aggressive caching frustrated development. DevTools Network tab's "Disable cache" option and checking response headers became critical for verifying updates.
- **API Response Format**: Backend returned `{ error: "message" }` with HTTP 200 status, requiring custom axios interceptor logic. Network tab inspection revealed this non-standard pattern.
- **DevTools Dependency**: Console logging, breakpoint debugging in Sources tab, and Network request inspection were essential for systematic debugging.

---

## What Went Well

### Development Process

- **Batch Implementation**: Implementing syncs in batches with testing between each caught errors early.
- **AI Integration**: Gemini-powered deadline extraction worked well after prompt engineering refinement.
- **Code Organization**: Clean separation between `services/` and `stores/` with unified `apiRequest()`/`publicRequest()` helpers.

### Effective Use of Browser DevTools

- **Network Tab**: Monitored API requests/responses, filtered by XHR, checked timing, used "Copy as fetch" for debugging.
- **Console**: Inspected Vue reactive state, logged lifecycle events, used `$vm0` trick for component access.
- **Sources Tab**: Set breakpoints in interceptors and components. Used "Pause on caught exceptions."
- **Application Tab**: Inspected localStorage for sessionID debugging.
- **Vue DevTools**: Critical for inspecting component props, Pinia stores, and Timeline feature for re-render issues.

---

## Key Mistakes & Lessons Learned

1. **Parameter Name Inconsistency**: Different names across layers caused bugs. **Fix**: Establish naming conventions upfront; use TypeScript for enforcement.

2. **Canvas Scope Creep**: Planned Canvas integration without researching API complexity. **Fix**: Conduct API feasibility research during design phase with spike tasks.

3. **Browser Caching Assumptions**: Didn't anticipate caching issues. **Fix**: Always enable "Disable cache" in DevTools Network tab; configure cache-busting headers; verify file timestamps.

4. **Database State Pollution**: Corrupted data caused cascading errors. **Fix**: Create database reset scripts early; use test database for development.

---

## Skills Acquired

**New Skills**

- Concept-oriented programming (when/where/then sync patterns)
- Symbol-based parameter binding
- Request-level authentication with syncs
- LLM prompt engineering for deadline extraction
- Cascade deletion in document databases

**Reinforced Skills**

- Vue 3 Composition API
- **Browser DevTools mastery** (Network, Console, Sources, Application tabs, Vue DevTools)
- Systematic debugging (frontend vs. backend vs. browser isolation)
- Custom axios interceptors

**Still Need Development**

- Automated testing (Vitest, Playwright)
- Performance optimization (MongoDB indexing, frontend memoization)
- CI/CD and monitoring infrastructure
- TypeScript for type safety

---

## Use of Tools

### Context Tool (Class Tool - Assignments 4a/4b)

Used for design phase:

- **Concept Specifications**: Generated initial concept definitions with actions, queries, and state
- **Sync Specifications**: Created structured sync patterns (when/where/then) for authentication flows
- **Effectiveness**: Excellent for structured design work and spec generation before implementation

### Cursor/Claude (Agentic Coding - Assignment 4c Implementation)

**Effective for:**

- Debugging complex sync binding errors with backend log analysis
- Generating repetitive CRUD patterns and service methods
- Interpreting Requesting concept documentation
- Refactoring suggestions and error message enhancement

**Limitations:**

- Couldn't observe browser state directly (required manual DevTools inspection)
- Sometimes suggested overly complex solutions
- Needed screenshots/logs for context

**Key Insights:**

- Treat as senior pair programmer, but verify everything
- Excellent for boilerplate generation, debugging, code review
- Combine with DevTools: LLM suggests → DevTools confirms → Human decides
- Cannot replace architectural decisions, code verification, or learning fundamentals

**Workflow:**
Context tool (design specs) → Cursor (implementation) → DevTools (verification)

---

## Overall Experience

### Proud Of

- Shipped all planned features except Canvas (pragmatic scope management)
- Clean architecture with reusable patterns
- Successfully integrated AI for practical deadline extraction
- Systematic debugging of complex sync/authentication issues

### Would Do Differently

1. Write tests from day one instead of manual testing
2. Use TypeScript for compile-time error catching
3. Prototype third-party APIs early (would have caught Canvas complexity)
4. Better git hygiene with frequent, descriptive commits

---

## Conclusion

This project reinforced that **software development is iterative problem-solving**. The combination of concept-oriented architecture, AI-powered features, and comprehensive authentication made for a challenging but rewarding implementation.

Three pillars proved essential:

1. **Tool-Assisted Design & Implementation**: Context tool for structured design specs (4a/4b), Cursor for coding implementation (4c). Required human judgment for architecture and verification.

2. **DevTools Mastery**: Network tab for API inspection, Console for state debugging, Sources for breakpoints, and Vue DevTools for component analysis were foundational.

3. **Systematic Debugging**: Disciplined isolation of frontend vs. backend vs. browser issues prevented debugging rabbit holes.

The most powerful workflow: **Context (design) → Cursor (implement) → DevTools (verify) → Human (decide)**. Combined with resilience in debugging and pragmatic scope management (removing Canvas), this approach enabled successful delivery of a complex full-stack application.

**Key takeaway**: AI tools (Context for design, Cursor for coding) amplify productivity when used thoughtfully, but can't replace fundamental programming skills, DevTools expertise, and critical thinking.
