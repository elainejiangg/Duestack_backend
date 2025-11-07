# DueStack - AI-Powered Deadline Management

A full-stack deadline management application with intelligent AI extraction from documents and websites, built using concept-oriented programming principles.

---
## Assignment 4c: Final Submission

### Deliverables
- **Repositories**:
    - **[Frontend Repository](https://github.com/elainejiangg/Duestack_frontend?tab=readme-ov-file)**
    - **Backend Repository**: This repository
- **[Design Document](Assignment-4c-assets/DESIGN_DOCUMENT.md)** 
- **[Reflections](Assignment-4c-assets/REFLECTIONS.md)** 
- **[Demo Video](https://www.dropbox.com/scl/fi/8eczytzk4dmbgl7efimfo/My-Movie-9.mp4?rlkey=nab1s7o11kxe0dhz0da0xfco0&st=hedkps7s&dl=0)**
- **[Backend Trace](Assignment-4c-assets/BACKEND_TRACE.md)** 
- **[Deployed Application on Render](https://duestack.onrender.com/)**

---

### 🚀 Quick Start (Local Development)

**Backend:**

```bash
cd Duestack_backend
deno run build
deno run start
```

**Frontend:**

```bash
cd Duestack_frontend
npm install
npm run dev
```

---

## Assignment 4a

## DueStack Concepts

#### 1) UserIdentityConcept:

- **Spec**: [UserIdentityConceptSpec](design/concepts/DueStack-specs/UserIdentityConcept.md)
- **Implementation**: [UserIdentityConcept.ts](src/concepts/DueStack/UserIdentityConcept.ts)
- **Test**: [UserIdentityConcept.test.ts](src/concepts/DueStack/UserIdentityConcept.test.ts)
- **Console Output**: [UserIdentityConcept-test-output.md](design/test-outputs/UserIdentityConcept-test-output.md)
- **Design Changes**: [UserIdentityConcept-design.md](design/concepts/DueStack-concept-design-files/UserIdentityConcept-design.md)

### 2) UserAuthenticationConcept:

- **Spec**: [UserAuthenticationConceptSpec](design/concepts/DueStack-specs/UserAuthenticationConcept.md)
- **Implementation**: [UserAuthenticationConcept.ts](src/concepts/DueStack/UserAuthenticationConcept.ts)
- **Test**: [UserAuthenticationConcept.test.ts](src/concepts/DueStack/UserAuthenticationConcept.test.ts)
- **Console Output**: [UserAuthenticationConcept-test-output.md](design/test-outputs/UserAuthenticationConcept-test-output.md)
- **Design Changes**: [UserAuthenticationConcept-design.md](design/concepts/DueStack-concept-design-files/UserAuthenticationConcept-design.md)

#### 3) CourseManagementConcept:

- **Spec**: [CourseManagementConceptSpec](design/concepts/DueStack-specs/CourseManagementConcept.md)
- **Implementation**: [CourseManagementConcept.ts](src/concepts/DueStack/CourseManagementConcept.ts)
- **Test**: [CourseManagementConcept.test.ts](src/concepts/DueStack/CourseManagementConcept.test.ts)
- **Console Output**: [CourseManagementConcept-test-output.md](design/test-outputs/CourseManagementConcept-test-output.md)
- **Design Changes**: [CourseManagementConcept-design.md](design/concepts/DueStack-concept-design-files/CourseManagementConcept-design.md)

#### 4) DeadlineManagementConcept:

- **Spec**: [DeadlineManagementConceptSpec](design/concepts/DueStack-specs/DeadlineManagementConcept.md)
- **Implementation**: [DeadlineManagementConcept.ts](src/concepts/DueStack/DeadlineManagementConcept.ts)
- **Test**: [DeadlineManagementConcept.test.ts](src/concepts/DueStack/DeadlineManagementConcept.test.ts)
- **Console Output**: [DeadlineManagementConcept-test-output.md](design/test-outputs/DeadlineManagementConcept-test-output.md)
- **Design Changes**: [DeadlineManagementConcept-design.md](design/concepts/DueStack-concept-design-files/DeadlineManagementConcept-design.md)

#### 5) DocumentManagementConcept:

- **Spec**: [DocumentManagementConceptSpec](design/concepts/DueStack-specs/DocumentManagementConcept.md)
- **Implementation**: [DocumentManagementConcept.ts](src/concepts/DueStack/DocumentManagementConcept.ts)
- **Test**: [DocumentManagementConcept.test.ts](src/concepts/DueStack/DocumentManagementConcept.test.ts)
- **Console Output**: [DocumentManagementConcept-test-output.md](design/test-outputs/DocumentManagementConcept-test-output.md)
- **Design Changes**: [DocumentManagementConcept-design.md](design/concepts/DueStack-concept-design-files/DocumentManagementConcept-design.md)

#### 6) SuggestionManagementConcept:

- **Spec**: [SuggestionManagementConceptSpec](design/concepts/DueStack-specs/SuggestionManagementConcept.md)
- **Implementation**: [SuggestionManagementConcept.ts](src/concepts/DueStack/SuggestionManagementConcept.ts)
- **Test**: [SuggestionManagementConcept.test.ts](src/concepts/DueStack/SuggestionManagementConcept.test.ts)
- **Console Output**: [SuggestionManagementConcept-test-output.md](design/test-outputs/SuggestionManagementConcept-test-output.md)
- **Design Changes**: [SuggestionManagementConcept-design.md](design/concepts/DueStack-concept-design-files/SuggestionManagementConcept-design.md)

## Overall Application Design Notes

- **Overall Design**: [DueStack-overall-design.md](design/concepts/DueStack-concept-design-files/DueStack-overall-design.md)
