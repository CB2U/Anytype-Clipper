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

While Epic 8.0 achieved >80% unit test coverage for individual modules, the Anytype Clipper Extension requires integration tests to verify that critical paths work correctly when multiple modules interact. 

**Current State Audit (2026-01-07):**
The integration test suite has been implemented across multiple categories (auth, capture, queue, deduplication, storage). However, the suite is currently unstable:
- 13/17 test suites are failing.
- 30/42 total tests are failing.
- Primary issues: Test timeouts (5000ms) and type errors (e.g., `TypeError: Cannot read properties of undefined (reading 'bytesInUse')` in quota tests).

Stabilization and debugging are required to fulfill the reliability and maintainability targets (NFR6.3, TEST-3, TEST-6).

---

## Goals and Non-Goals

### Goals

1. **Stabilize existing integration tests:** Resolve timeouts and type errors.
2. Verify auth flow from challenge code to API key storage.
3. Test all capture flows (bookmark, highlight, article) with mock API.
4. Verify queue + retry logic with real chrome.storage.local.
5. Test deduplication with real storage and URL normalization.
6. **Performance:** Ensure integration tests run in <10 seconds total (once stabilized).
7. Provide clear failure messages for debugging.

### Non-Goals

- E2E browser automation tests (covered in Epic 8.2).
- UI interaction tests (covered in Epic 8.2).
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

1. **Stabilization & Debugging:**
   - Resolve timeouts in `challenge-flow.test.ts`, `bookmark-flow.test.ts`, etc.
   - Fix `TypeError` in `quota-management.test.ts` regarding `bytesInUse`.
   - Ensure mocks correctly simulate Chrome API behavior.

2. **Auth Flow Integration Tests:**
   - Challenge code request → code display → API key exchange → storage.
   - API key validation on startup.
   - 401 response → re-auth trigger → queue captures → resume after re-auth

3. **Capture Flow Integration Tests:**
   - Bookmark: metadata extraction → API call → storage.
   - Highlight: selection → context extraction → API call.
   - Article: extraction → markdown conversion → image handling → API call.

4. **Queue + Retry Integration Tests:**
   - Offline capture → queue to storage → health check → retry with backoff.
   - Service worker recovery simulation.
   - Failed item → max retries → mark as failed

5. **Deduplication Integration Tests:**
   - URL normalization → search existing objects → duplicate warning.
   - Append mode → fetch existing → append content → update object

6. **API Client + Storage Integration Tests:**
   - API call → response validation → storage update
   - Storage quota check → warning trigger
   - Sequential write locking

### Out-of-Scope

- E2E tests with real browser automation (Epic 8.2).
- UI component testing (Epic 8.2)
- Content script injection tests (Epic 8.2)
- Manual testing (Epic 8.3).
- Performance profiling (Epic 8.3)

---

## Requirements

### Functional Requirements

- **FR-INT-1:** Integration tests MUST cover auth flow from challenge to storage.
- **FR-INT-2:** Integration tests MUST cover all capture types (bookmark, highlight, article).
- **FR-INT-3:** Integration tests MUST verify queue persistence across service worker restarts.
- **FR-INT-4:** Integration tests MUST test retry logic with exponential backoff.
- **FR-INT-5:** Integration tests MUST verify deduplication with URL normalization.
- **FR-INT-6:** Integration tests MUST use mock API for predictable responses.
- **FR-INT-7:** Integration tests MUST use real chrome.storage.local (via jest-chrome).
- **FR-INT-8:** Integration tests MUST verify error handling in multi-step flows

### Non-Functional Requirements

- **NFR-INT-1:** Total integration test suite execution time MUST be <10 seconds.
- **NFR-INT-2:** Integration tests MUST be deterministic.
- **NFR-INT-3:** Integration tests MUST not require network access.
- **NFR-INT-4:** Integration tests MUST provide clear failure messages.
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
- **Verification approach:** Run `npm run test:integration -- tests/integration/auth/challenge-flow.test.ts`.

### AC-INT-2: Capture Flows Integration
All capture types (bookmark, highlight, article) tested with mock API and real storage.
- **Verification approach:** Run `npm run test:integration -- tests/integration/capture/`.

### AC-INT-3: Queue + Retry Integration
Queue persistence and retry logic tested with service worker restart simulation.
- **Verification approach:** Run `npm run test:integration -- tests/integration/queue/`.

### AC-INT-4: Deduplication Integration
Deduplication tested with URL normalization and real storage search.
- **Verification approach:** Run `npm run test:integration -- tests/integration/deduplication/`.

### AC-INT-5: Fast Execution
Integration test suite completes in <10 seconds.
- **Verification approach:** Run `npm run test:integration` and measure execution time.

### AC-INT-6: CI Integration
Integration tests run automatically in CI pipeline.
- **Verification approach:** Verify GitHub Actions workflow includes integration test step

---

## Dependencies

### Epic Dependencies
- Epic 8.0 (Unit Test Suite) - Complete ✅

### Technical Dependencies
- Jest ^30.2.0
- ts-jest ^29.4.6
- jest-chrome ^0.8.0
- jest-puppeteer ^11.0.0 (per `jest.integration.config.js`)
- Mock Anytype API fixture (from Epic 8.0)

---

## Risks and Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Integration tests too slow (>10s) | High | Medium | Optimize setup/teardown, use minimal test data, increase timeout only where necessary. |
| Flaky tests due to async timing | High | High | Use `jest.useFakeTimers`, await all promises explicitly, resolve race conditions in mocks. |
| Chrome API mocking gaps | Medium | Medium | Enhance `StorageManager` mocks to return expected objects (e.g., `getBytesInUse`). |
| Service worker restart simulation complex | Medium | Medium | Use jest.resetModules() and careful module isolation |

---

## Open Questions

None - requirements are clear from roadmap and Epic 8.0 learnings.

---

## EVIDENCE

### Final Stability Results (2026-01-07)
- **Status:** 17/17 suites passed (100%), 39/39 tests passed (100%).
- **Unit Tests:** 47/47 suites passed, 404/404 tests passed.
- **Total:** 443 total tests passing.
- **Key Improvements:**
    - Refactored core services (`QueueManager`, `StorageManager`, `AppendService`, `DeduplicationService`, `RetryScheduler`, `BookmarkCaptureService`, `TagService`) to the `getInstance()` singleton pattern for reliable test resets.
    - Synchronized `QueueManager` in-memory cache with storage updates to ensure immediate consistency.
    - Resolved `StorageManager` schema validation errors and field name mismatches (`source` vs `source_url`).
    - Eliminated Jest open handle warnings by correctly clearing timeouts in `markdown-converter`.
    - Sanitized `src/` directory by moving investigative diagnostic tools to `tools/investigation/`.
    - Enabled CI pipeline in `.github/workflows/ci.yml` with full unit and integration test coverage.
    - Achieved 100% clean type-checking and linting across the entire `src/` directory.

### Infrastructure
- `package.json` contains `test` and `test:integration` scripts.
- `jest.integration.config.js` and `jest.config.js` are fully optimized.
- CI pipeline is active and verified.
