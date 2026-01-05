# Epic 8.1: Integration Tests

## Header

- **Title:** Integration Tests
- **Roadmap anchor reference:** docs/roadmap.md 8.1
- **Priority:** P1
- **Type:** Feature
- **Target area:** Testing infrastructure, critical path verification
- **Target Acceptance Criteria:** TEST-3, TEST-6

---

## Problem Statement

While Epic 8.0 achieved >80% unit test coverage for individual modules, the Anytype Clipper Extension requires integration tests to verify that critical paths work correctly when multiple modules interact. Unit tests validate isolated logic, but they cannot catch issues that arise from:

- Module integration failures (e.g., API client + storage manager)
- Async timing issues across service boundaries
- State management bugs in multi-step flows
- Chrome API interaction edge cases
- Real storage persistence issues

Without integration tests covering critical paths (auth, capture, queue, deduplication), bugs may slip through to production despite high unit test coverage.

---

## Goals and Non-Goals

### Goals

1. Test critical user flows end-to-end with multiple modules integrated
2. Verify auth flow from challenge code to API key storage
3. Test all capture flows (bookmark, highlight, article) with mock API
4. Verify queue + retry logic with real chrome.storage.local
5. Test deduplication with real storage and URL normalization
6. Ensure integration tests run in <10 seconds total
7. Provide clear failure messages for debugging

### Non-Goals

- E2E browser automation tests (covered in Epic 8.2)
- UI interaction tests (covered in Epic 8.2)
- Manual testing procedures (covered in Epic 8.3)
- Performance benchmarking beyond execution time
- Testing every possible edge case (unit tests cover those)

---

## User Stories

### US-TEST-INT-1: Developer Confidence in Integration
**As a** developer making changes across multiple modules,
**I want** integration tests that verify critical paths,
**So that** I can refactor confidently knowing module interactions won't break.

### US-TEST-INT-2: Fast Feedback Loop
**As a** developer running tests locally,
**I want** integration tests to complete in <10 seconds,
**So that** I get quick feedback during development.

### US-TEST-INT-3: Clear Failure Diagnosis
**As a** developer debugging a failing integration test,
**I want** clear error messages indicating which step failed,
**So that** I can quickly identify and fix the root cause.

---

## Scope

### In-Scope

1. **Auth Flow Integration Tests:**
   - Challenge code request → code display → API key exchange → storage
   - API key validation on startup
   - 401 response → re-auth trigger → queue captures → resume after re-auth

2. **Capture Flow Integration Tests:**
   - Bookmark: metadata extraction → API call → storage → success notification
   - Highlight: selection → context extraction → API call → storage
   - Article: extraction → markdown conversion → image handling → API call

3. **Queue + Retry Integration Tests:**
   - Offline capture → queue to storage → health check → retry with backoff
   - Service worker termination → recovery → queue resume
   - Failed item → max retries → mark as failed

4. **Deduplication Integration Tests:**
   - URL normalization → search existing objects → duplicate warning
   - Append mode → fetch existing → append content → update object

5. **API Client + Storage Integration Tests:**
   - API call → response validation → storage update
   - Storage quota check → warning trigger
   - Sequential write locking

### Out-of-Scope

- E2E tests with real browser automation (Epic 8.2)
- UI component testing (Epic 8.2)
- Content script injection tests (Epic 8.2)
- Manual testing (Epic 8.3)
- Performance profiling (Epic 8.3)

---

## Requirements

### Functional Requirements

- **FR-INT-1:** Integration tests MUST cover auth flow from challenge to storage
- **FR-INT-2:** Integration tests MUST cover all capture types (bookmark, highlight, article)
- **FR-INT-3:** Integration tests MUST verify queue persistence across service worker restarts
- **FR-INT-4:** Integration tests MUST test retry logic with exponential backoff
- **FR-INT-5:** Integration tests MUST verify deduplication with URL normalization
- **FR-INT-6:** Integration tests MUST use mock API for predictable responses
- **FR-INT-7:** Integration tests MUST use real chrome.storage.local (via jest-chrome)
- **FR-INT-8:** Integration tests MUST verify error handling in multi-step flows

### Non-Functional Requirements

- **NFR-INT-1:** Total integration test suite execution time MUST be <10 seconds
- **NFR-INT-2:** Integration tests MUST be deterministic (same results every run)
- **NFR-INT-3:** Integration tests MUST not require network access
- **NFR-INT-4:** Integration tests MUST provide clear failure messages
- **NFR-INT-5:** Integration tests MUST run in CI pipeline

### Constraints Checklist

- **Security:** Tests MUST NOT contain real API keys
- **Privacy:** Test fixtures MUST use synthetic data only
- **Offline behavior:** Tests MUST mock all network calls
- **Performance:** Total execution time <10 seconds
- **Observability:** Test output MUST be readable and actionable

---

## Acceptance Criteria

### AC-INT-1: Auth Flow Integration
Auth flow tested end-to-end: challenge request → code → API key exchange → storage → validation.
- **Verification approach:** Run integration test, verify API key stored in chrome.storage.local

### AC-INT-2: Capture Flows Integration
All capture types (bookmark, highlight, article) tested with mock API and real storage.
- **Verification approach:** Run integration tests for each capture type, verify objects created

### AC-INT-3: Queue + Retry Integration
Queue persistence and retry logic tested with service worker restart simulation.
- **Verification approach:** Run queue integration test, verify items persist and retry correctly

### AC-INT-4: Deduplication Integration
Deduplication tested with URL normalization and real storage search.
- **Verification approach:** Run deduplication test, verify duplicate detection and append mode

### AC-INT-5: Fast Execution
Integration test suite completes in <10 seconds.
- **Verification approach:** Run `npm run test:integration` and measure execution time

### AC-INT-6: CI Integration
Integration tests run automatically in CI pipeline.
- **Verification approach:** Verify GitHub Actions workflow includes integration test step

---

## Dependencies

### Epic Dependencies
- Epic 8.0 (Unit Test Suite) - MUST be complete for test infrastructure

### Technical Dependencies
- Jest ^30.2.0 (installed)
- ts-jest ^29.4.6 (installed)
- jest-chrome ^0.8.0 (installed)
- jest-environment-jsdom ^30.2.0 (installed)
- Mock Anytype API fixture (from Epic 8.0)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Integration tests too slow (>10s) | Medium | Medium | Optimize setup/teardown, use minimal test data |
| Flaky tests due to async timing | Medium | High | Use jest.useFakeTimers, await all promises explicitly |
| Chrome API mocking gaps | Low | Medium | Enhance jest-chrome setup as needed |
| Service worker restart simulation complex | Medium | Medium | Use jest.resetModules() and careful module isolation |

---

## Open Questions

None - requirements are clear from roadmap and Epic 8.0 learnings.

---

## EVIDENCE

*This section will be populated during implementation with verification evidence per task and per AC.*
