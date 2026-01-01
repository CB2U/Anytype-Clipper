# Development Constitution: Anytype Clipper Extension

**Version:** 1.0\
**Status:** Active\
**Last Modified:** 2026-01-01

---

## 1\. Purpose and Scope

This constitution establishes the development principles, quality standards, and workflow gates for the Anytype Clipper Extension. It enforces **Spec-Driven Development** to prevent scope drift, ensure quality, and maintain alignment with the PRD.
**Scope:** All development work on the Anytype Clipper Extension, including features, bug fixes, refactors, and documentation.
**Authority:** This constitution is binding for all contributors. Modifications require explicit instruction with documented rationale.

---

## 2\. Non-Negotiables

### 2.1 Security

* **SEC-1:** API keys MUST be stored in `chrome.storage.local` only (never `chrome.storage.sync`).
* **SEC-2:** All Anytype API calls MUST target `localhost` only (default port: 31009).
* **SEC-3:** Sensitive data (API keys, full content) MUST NOT be logged to console or debug logs.
* **SEC-4:** Error messages MUST be sanitized before logging (remove tokens, keys, PII).
* **SEC-5:** Extension MUST request minimal permissions (see PRD NFR3.3).
* **SEC-6:** User inputs MUST be validated and sanitized before processing.
* **SEC-7:** Content Security Policy MUST be enforced per Manifest V3 standards.
* **SEC-8:** No external API calls permitted (localhost only).
  
  ### 2.2 Data Integrity
* **DATA-1:** Queue operations MUST be atomic for captures <2MB.
* **DATA-2:** Large captures (>2MB) MUST use checkpoint-based recovery.
* **DATA-3:** Queue MUST survive browser restarts and service worker termination.
* **DATA-4:** Queue size MUST be limited to 1000 items with FIFO eviction.
* **DATA-5:** All capture requests MUST include unique ID, timestamp, and retry count.
* **DATA-6:** Failed captures MUST be queued with error details, not silently dropped.
* **DATA-7:** URL normalization MUST handle http/https, trailing slashes, www variations, query params.
  
  ### 2.3 Privacy
* **PRIV-1:** All data MUST be stored locally (no cloud sync).
* **PRIV-2:** No telemetry or analytics collection permitted.
* **PRIV-3:** Privacy mode MUST disable URL history tracking when enabled.
* **PRIV-4:** Users MUST have "Clear All Data" option in settings.
* **PRIV-5:** Extension MUST be transparent about what data is captured and stored.
  
  ### 2.4 Performance
* **PERF-1:** Popup MUST open within 300ms.
* **PERF-2:** Article extraction MUST complete within 5 seconds for typical pages.
* **PERF-3:** Queue processing MUST NOT block UI interactions.
* **PERF-4:** Individual captures MUST be limited to 5MB.
* **PERF-5:** Content script injection MUST NOT impact page load performance.
* **PERF-6:** Image optimization MUST complete within 2 seconds per image.
* **PERF-7:** Duplicate detection search MUST complete within 1 second.
  
  ### 2.5 Reliability
* **REL-1:** Extension MUST handle Anytype API downtime gracefully with queue fallback.
* **REL-2:** Service worker termination MUST be detected and recovered from.
* **REL-3:** Health check ping MUST be performed before API requests.
* **REL-4:** Retry logic MUST use exponential backoff (1s, 5s, 30s, 5m) with max 10 attempts.
* **REL-5:** API responses MUST be validated before processing.
* **REL-6:** Clear error messages with actionable next steps MUST be shown to users.
  
  ### 2.6 Portability
* **PORT-1:** Extension MUST support Brave browser on Linux (primary target).
* **PORT-2:** Extension MUST be compatible with Chromium-based browsers (Chrome, Edge, Opera).
* **PORT-3:** Extension MUST comply with Manifest V3 standards.
* **PORT-4:** Custom Anytype ports (not just 31009) MUST be supported.
* **PORT-5:** Anytype API version changes MUST be handled gracefully with version detection.

---

## 3\. Spec-Kit Workflow Gates

All development MUST follow the **Specify → Plan → Tasks → Implement** workflow. No exceptions.

### Gate 1: Specify

**Entry Criteria:**

* Feature request or bug report documented
* Alignment with PRD confirmed
  **Activities:**
* Write detailed specification referencing PRD requirements
* Define acceptance criteria (measurable)
* Identify affected modules and dependencies
* Document edge cases and error scenarios
  **Exit Criteria:**
* Specification reviewed and approved
* Acceptance criteria defined with test scenarios
* No ambiguities or \[NEEDS CLARIFICATION\] items remain
  **Deliverable:** Specification document (markdown)

---

### Gate 2: Plan

**Entry Criteria:**

* Specification approved from Gate 1
  **Activities:**
* Break specification into implementation tasks
* Identify required changes to types, interfaces, modules
* Plan test coverage (unit, integration, E2E)
* Estimate effort and identify risks
* Define rollback strategy
  **Exit Criteria:**
* Task list created with clear scope per task
* Test plan documented
* Dependencies and risks identified
* Technical approach validated
  **Deliverable:** Implementation plan with task breakdown

---

### Gate 3: Tasks

**Entry Criteria:**

* Implementation plan approved from Gate 2
  **Activities:**
* Create granular tasks in task tracker
* Assign priority and dependencies
* Link tasks to specification and PRD requirements
* Define "Definition of Done" per task (see Section 6)
  **Exit Criteria:**
* All tasks created with clear acceptance criteria
* Dependencies mapped
* Each task linked to specification
  **Deliverable:** Task list with DoD per task

---

### Gate 4: Implement

**Entry Criteria:**

* Tasks defined from Gate 3
* No code written before this gate
  **Activities:**
* Write implementation code
* Write tests (unit, integration, E2E as planned)
* Update documentation
* Perform self-review against DoD
* Submit for code review
  **Exit Criteria:**
* All DoD criteria met (see Section 6)
* Code review approved
* Tests passing (>80% coverage)
* Documentation updated
  **Deliverable:** Working code with tests and documentation

---

### Enforcement Rules

* **GATE-1:** Code MUST NOT be written before Gate 4 (Implement).
* **GATE-2:** Each gate MUST be completed before proceeding to next gate.
* **GATE-3:** Skipping gates is prohibited without explicit constitutional amendment.
* **GATE-4:** Specifications MUST reference specific PRD requirements (e.g., FR3.2, NFR1.1).
* **GATE-5:** Changes to specifications after Gate 2 require re-approval and impact assessment.

---

## 4\. Quality Bars

### 4.1 Testing Requirements

* **TEST-1:** Unit test coverage MUST be >80% for all modules.
* **TEST-2:** All public functions MUST have unit tests.
* **TEST-3:** Critical paths (auth, capture, queue) MUST have integration tests.
* **TEST-4:** E2E tests MUST cover all acceptance criteria from PRD (AC1-AC20).
* **TEST-5:** Edge cases and error scenarios MUST be tested.
* **TEST-6:** Tests MUST be automated and run in CI pipeline.
* **TEST-7:** Manual testing MUST be performed on Linux/Brave before release.
* **TEST-8:** Regression tests MUST be added for all bug fixes.
  **Test Categories:**
* **Unit Tests:** Jest, >80% coverage, fast (<5s total)
* **Integration Tests:** API client, queue manager, content extractors
* **E2E Tests:** Puppeteer, full capture flows, queue recovery
* **Manual Tests:** Cross-browser, UI/UX, accessibility

---

### 4.2 Documentation Requirements

* **DOC-1:** All public APIs MUST have JSDoc comments with param types and return types.
* **DOC-2:** Complex algorithms MUST have inline comments explaining logic.
* **DOC-3:** README MUST be updated for user-facing changes.
* **DOC-4:** Architecture documentation MUST be updated for structural changes.
* **DOC-5:** Changelog MUST be updated for all releases.
* **DOC-6:** User guide MUST include screenshots for new UI features.
* **DOC-7:** API documentation MUST reflect current Anytype API version.
  **Documentation Standards:**
* Use markdown for all documentation
* Include code examples for complex features
* Keep language clear and concise
* Update docs in same PR as code changes

---

### 4.3 Error Handling Requirements

* **ERR-1:** All API calls MUST have try-catch blocks with specific error handling.
* **ERR-2:** User-facing errors MUST include actionable next steps.
* **ERR-3:** Errors MUST be logged to debug log with sanitized messages.
* **ERR-4:** Network errors MUST trigger queue fallback, not user-facing failures.
* **ERR-5:** Invalid user inputs MUST show validation errors before submission.
* **ERR-6:** Service worker termination MUST be detected and recovered from gracefully.
* **ERR-7:** Fallback strategies MUST be implemented for all critical operations (see FR5.1).
  **Error Handling Patterns:**
* Validate inputs early
* Use specific error types (AuthError, NetworkError, ValidationError)
* Log errors with context (operation, timestamp, sanitized details)
* Provide user-friendly messages (no stack traces)
* Implement retry logic for transient failures

---

### 4.4 Code Quality Standards

* **CODE-1:** TypeScript strict mode MUST be enabled.
* **CODE-2:** ESLint MUST pass with zero warnings.
* **CODE-3:** Prettier MUST be used for consistent formatting.
* **CODE-4:** No `any` types permitted (use `unknown` with type guards).
* **CODE-5:** Functions MUST be <50 lines (extract helpers if needed).
* **CODE-6:** Cyclomatic complexity MUST be <10 per function.
* **CODE-7:** No duplicate code (DRY principle).
* **CODE-8:** Magic numbers MUST be replaced with named constants.

---

## 5\. Security and Privacy Rules

### 5.1 Authentication

* **AUTH-1:** Challenge code flow MUST be used for first-run authentication (FR1.1-FR1.3).
* **AUTH-2:** API key MUST be stored in `chrome.storage.local` only.
* **AUTH-3:** 401 responses MUST trigger automatic re-authentication (FR1.6).
* **AUTH-4:** Re-auth MUST NOT block user (queue captures during re-auth).
* **AUTH-5:** "Disconnect" action MUST revoke API key and clear all stored credentials.
* **AUTH-6:** Token refresh flow MUST be implemented if Anytype API supports it.
  
  ### 5.2 Data Storage
* **STORE-1:** Sensitive data MUST NOT be stored in `chrome.storage.sync`.
* **STORE-2:** Queue items MUST be encrypted at rest \[NEEDS CLARIFICATION: encryption requirement\].
* **STORE-3:** Debug logs MUST NOT contain sensitive data (API keys, full content, PII).
* **STORE-4:** Storage quota MUST be monitored (warn at 80%, fail at 95%).
* **STORE-5:** Old data MUST be auto-purged (debug logs >30 days, queue items >90 days if failed).
  
  ### 5.3 Permissions
* **PERM-1:** Only permissions listed in PRD NFR3.3 are permitted.
* **PERM-2:** `<all_urls>` permission MUST be optional (only if screenshot feature enabled).
* **PERM-3:** Permission requests MUST include clear user-facing justification.
* **PERM-4:** Unused permissions MUST be removed before release.
  
  ### 5.4 Network Security
* **NET-1:** All API calls MUST target `localhost` only.
* **NET-2:** HTTPS MUST be used if Anytype supports TLS on localhost.
* **NET-3:** CORS errors MUST be handled gracefully (fallback to external image URLs).
* **NET-4:** No external API calls permitted (no analytics, no CDNs, no tracking).

---

## 6\. Definition of Done Template

Every task MUST meet these criteria before being marked complete:

### Code Complete

* \[ \] Implementation matches specification exactly
* \[ \] TypeScript strict mode passes with no errors
* \[ \] ESLint passes with zero warnings
* \[ \] Prettier formatting applied
* \[ \] No `any` types used
* \[ \] No magic numbers (use named constants)
* \[ \] Functions <50 lines
* \[ \] Cyclomatic complexity <10
  
  ### Testing Complete
* \[ \] Unit tests written with >80% coverage
* \[ \] Integration tests written for critical paths
* \[ \] E2E tests written for user-facing features
* \[ \] All tests passing in CI
* \[ \] Edge cases tested
* \[ \] Error scenarios tested
* \[ \] Manual testing performed on Linux/Brave
  
  ### Documentation Complete
* \[ \] JSDoc comments added for public APIs
* \[ \] Inline comments added for complex logic
* \[ \] README updated (if user-facing change)
* \[ \] Architecture docs updated (if structural change)
* \[ \] Changelog updated
* \[ \] User guide updated (if new UI feature)
  
  ### Security & Privacy Complete
* \[ \] No sensitive data logged
* \[ \] Error messages sanitized
* \[ \] Inputs validated and sanitized
* \[ \] Permissions justified and minimal
* \[ \] No external API calls
* \[ \] Data stored locally only
  
  ### Quality Complete
* \[ \] Self-review performed against DoD
* \[ \] Code review approved by peer
* \[ \] No known bugs or regressions
* \[ \] Performance benchmarks met (see Section 2.4)
* \[ \] Accessibility tested (keyboard nav, screen reader)
* \[ \] Error handling implemented with fallbacks
  
  ### Integration Complete
* \[ \] Linked to specification and PRD requirements
* \[ \] Dependencies resolved
* \[ \] Conflicts resolved
* \[ \] Merged to main branch
* \[ \] Deployed to test environment (if applicable)

---

## 7\. Change Control

### 7.1 Constitution Stability

* **CHANGE-1:** This constitution is **stable** and binding.
* **CHANGE-2:** Modifications require **explicit instruction** with documented rationale.
* **CHANGE-3:** All changes MUST be versioned and logged in constitution header.
* **CHANGE-4:** Changes MUST be reviewed by project owner before approval.
* **CHANGE-5:** Emergency changes (security, critical bugs) may bypass review but MUST be documented retroactively.
  
  ### 7.2 PRD Alignment
* **ALIGN-1:** All specifications MUST reference specific PRD requirements.
* **ALIGN-2:** Deviations from PRD require explicit justification and approval.
* **ALIGN-3:** PRD updates MUST trigger constitution review for alignment.
* **ALIGN-4:** Features not in PRD are **out of scope** unless PRD is amended.
  
  ### 7.3 Scope Drift Prevention
* **SCOPE-1:** Feature requests MUST be evaluated against PRD goals and non-goals.
* **SCOPE-2:** "Nice to have" features MUST be deferred to future phases.
* **SCOPE-3:** Scope changes require PRD amendment and stakeholder approval.
* **SCOPE-4:** Bug fixes MUST NOT introduce new features.
* **SCOPE-5:** Refactors MUST NOT change external behavior.
  
  ### 7.4 Version Control
* **VER-1:** All code changes MUST be committed with descriptive messages.
* **VER-2:** Commit messages MUST reference task IDs and PRD requirements.
* **VER-3:** Breaking changes MUST be documented in commit message and changelog.
* **VER-4:** Main branch MUST always be in releasable state.
* **VER-5:** Feature branches MUST be short-lived (<1 week).

---

## 8\. Enforcement and Compliance

### 8.1 Pre-Commit Checks

* TypeScript compilation passes
* ESLint passes with zero warnings
* Prettier formatting applied
* Unit tests pass
  
  ### 8.2 Pre-Merge Checks
* All DoD criteria met
* Code review approved
* Integration tests pass
* E2E tests pass (if applicable)
* Documentation updated
* Changelog updated
  
  ### 8.3 Pre-Release Checks
* All acceptance criteria from PRD met
* Manual testing completed on Linux/Brave
* Performance benchmarks met
* Security review completed
* User guide updated
* Version number incremented
  
  ### 8.4 Violations
* Constitution violations MUST be flagged in code review
* Repeated violations require process review
* Emergency bypasses MUST be documented and remediated within 48 hours

---

## 9\. Measurable Thresholds

### Performance Thresholds

* Popup open time: **<300ms** (PERF-1)
* Article extraction: **<5s** (PERF-2)
* Image optimization: **<2s per image** (PERF-6)
* Duplicate detection: **<1s** (PERF-7)
* Capture size limit: **5MB** (PERF-4)
  
  ### Reliability Thresholds
* Retry attempts: **max 10** (REL-4)
* Retry intervals: **1s, 5s, 30s, 5m** (exponential backoff)
* Queue size: **1000 items** (DATA-4)
* Health check timeout: **2s** \[NEEDS CLARIFICATION: timeout value\]
  
  ### Quality Thresholds
* Test coverage: **>80%** (TEST-1)
* Function length: **<50 lines** (CODE-5)
* Cyclomatic complexity: **<10** (CODE-6)
* ESLint warnings: **0** (CODE-2)
  
  ### Storage Thresholds
* Debug log entries: **1000 max** (FR6.12)
* Debug log retention: **30 days** (FR6.12)
* Queue retention: **90 days for failed items** (STORE-5)
* Storage quota warning: **80%** (STORE-4)
* Storage quota failure: **95%** (STORE-4)
  
  ### Content Thresholds
* Image embedding: **<500KB** (FR5.6)
* Embedded images per article: **20 max** (FR5.6)
* Context for highlights: **50 chars before/after** (FR4.2)
* Auto-suggested tags: **5 max** (FR8.7)
* Screenshot size: **500KB max** (FR3.5)

---

## 10\. Clarifications Needed

The following items require clarification before implementation:

1. **\[NEEDS CLARIFICATION: Encryption requirement\]** - Should queue items be encrypted at rest in `chrome.storage.local`? (STORE-2)
2. **\[NEEDS CLARIFICATION: Health check timeout\]** - What is the appropriate timeout for health check ping to localhost? (Suggested: 2s)
3. **\[NEEDS CLARIFICATION: Token expiration\]** - Does Anytype API implement token expiration and refresh flow? (FR1.8)
4. **\[NEEDS CLARIFICATION: API versioning\]** - How does Anytype API communicate version changes? (NFR5.7)
5. **\[NEEDS CLARIFICATION: Object schemas\]** - What are the exact Anytype object schemas for Bookmark/Highlight/Article Types? (Next Action #6)

---

## Appendix A: Quick Reference

### Workflow Checklist

1. ✅ Specification written and approved (Gate 1)
2. ✅ Implementation plan created (Gate 2)
3. ✅ Tasks defined with DoD (Gate 3)
4. ✅ Code implemented with tests (Gate 4)
5. ✅ All DoD criteria met
6. ✅ Code review approved
7. ✅ Merged to main
   
   ### Pre-Commit Checklist
* \[ \] TypeScript compiles
* \[ \] ESLint passes
* \[ \] Prettier applied
* \[ \] Unit tests pass
  
  ### Pre-Release Checklist
* \[ \] All PRD acceptance criteria met
* \[ \] Manual testing on Linux/Brave
* \[ \] Performance benchmarks met
* \[ \] Security review completed
* \[ \] Documentation updated
* \[ \] Changelog updated
* \[ \] Version incremented

---

**End of Constitution**
This constitution is binding and may only be modified with explicit instruction and documented rationale. All contributors must adhere to these standards to maintain code quality, security, and alignment with the PRD.
