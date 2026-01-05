# Tasks: Epic 8.1 Integration Tests

## Setup

### T1: Configure Integration Test Infrastructure
- **Goal:** Set up integration test directory structure and npm scripts
- **Steps:**
  1. Create `tests/integration/` directory structure (auth/, capture/, queue/, deduplication/, storage/)
  2. Add `test:integration` script to package.json: `jest tests/integration --coverage`
  3. Create `tests/integration/setup.ts` for shared test utilities
  4. Document integration test patterns in README or TESTING.md
- **Done when:** Directory structure exists, npm script works
- **Verify:** Run `npm run test:integration` (should pass with 0 tests initially)
- **Evidence to record:** Screenshot of directory structure, npm script output
- **Files touched:** `package.json`, `tests/integration/setup.ts`, directory structure

---

## Core Implementation

### T2: Auth Flow Integration Tests
- **Goal:** Test complete authentication flow with API client and storage
- **Steps:**
  1. Create `tests/integration/auth/challenge-flow.test.ts`
  2. Test: challenge request → code → API key exchange → storage
  3. Test: API key validation on initialization
  4. Test: invalid API key handling
  5. Create `tests/integration/auth/reauth-flow.test.ts`
  6. Test: 401 response → re-auth trigger → queue captures → resume
- **Done when:** All auth flow tests passing
- **Verify:** Run `npm run test:integration -- auth/`
- **Evidence to record:** Test output showing all auth tests passing
- **Files touched:** `tests/integration/auth/challenge-flow.test.ts`, `tests/integration/auth/reauth-flow.test.ts`

### T3: Bookmark Capture Integration Tests
- **Goal:** Test end-to-end bookmark capture flow
- **Steps:**
  1. Create `tests/integration/capture/bookmark-flow.test.ts`
  2. Test: metadata extraction → tag suggestions → API call → storage
  3. Test: bookmark with custom tags and notes
  4. Test: bookmark capture error handling
- **Done when:** All bookmark capture tests passing
- **Verify:** Run `npm run test:integration -- capture/bookmark`
- **Evidence to record:** Test output, coverage report for BookmarkCaptureService
- **Files touched:** `tests/integration/capture/bookmark-flow.test.ts`

### T4: Highlight Capture Integration Tests
- **Goal:** Test highlight capture with context extraction
- **Steps:**
  1. Create `tests/integration/capture/highlight-flow.test.ts`
  2. Test: selection → context extraction → API call
  3. Test: highlight with tags
  4. Test: append mode for multiple highlights
- **Done when:** All highlight capture tests passing
- **Verify:** Run `npm run test:integration -- capture/highlight`
- **Evidence to record:** Test output showing context extraction working
- **Files touched:** `tests/integration/capture/highlight-flow.test.ts`

### T5: Article Capture Integration Tests
- **Goal:** Test article extraction and conversion flow
- **Steps:**
  1. Create `tests/integration/capture/article-flow.test.ts`
  2. Test: extraction → markdown conversion → image handling → API call
  3. Test: fallback chain execution
  4. Test: large content offloading to vault
- **Done when:** All article capture tests passing
- **Verify:** Run `npm run test:integration -- capture/article`
- **Evidence to record:** Test output, vault usage verification
- **Files touched:** `tests/integration/capture/article-flow.test.ts`

### T6: Offline Queue Integration Tests
- **Goal:** Test queue persistence and processing
- **Steps:**
  1. Create `tests/integration/queue/offline-queue.test.ts`
  2. Test: capture when offline → queue to storage
  3. Test: queue persists across module reload (jest.resetModules)
  4. Test: sequential processing
- **Done when:** All offline queue tests passing
- **Verify:** Run `npm run test:integration -- queue/offline`
- **Evidence to record:** Test output showing queue persistence
- **Files touched:** `tests/integration/queue/offline-queue.test.ts`

### T7: Retry Logic Integration Tests
- **Goal:** Test exponential backoff and retry limits
- **Steps:**
  1. Create `tests/integration/queue/retry-logic.test.ts`
  2. Test: failed capture → retry with backoff intervals
  3. Test: max retries → mark as failed
  4. Test: manual retry
- **Done when:** All retry logic tests passing
- **Verify:** Run `npm run test:integration -- queue/retry`
- **Evidence to record:** Test output showing backoff intervals
- **Files touched:** `tests/integration/queue/retry-logic.test.ts`

### T8: Service Worker Recovery Integration Tests
- **Goal:** Test queue recovery after service worker restart
- **Steps:**
  1. Create `tests/integration/queue/service-worker-recovery.test.ts`
  2. Test: service worker termination → recovery → queue resume
  3. Test: sending items reset to queued state
  4. Use jest.resetModules() to simulate restart
- **Done when:** All recovery tests passing
- **Verify:** Run `npm run test:integration -- queue/service-worker`
- **Evidence to record:** Test output showing recovery working
- **Files touched:** `tests/integration/queue/service-worker-recovery.test.ts`

### T9: URL Deduplication Integration Tests
- **Goal:** Test duplicate detection with URL normalization
- **Steps:**
  1. Create `tests/integration/deduplication/url-deduplication.test.ts`
  2. Test: URL normalization → search → duplicate found
  3. Test: URL variations (http/https, www, trailing slash)
  4. Test: no duplicate found
- **Done when:** All deduplication tests passing
- **Verify:** Run `npm run test:integration -- deduplication/url`
- **Evidence to record:** Test output showing URL normalization
- **Files touched:** `tests/integration/deduplication/url-deduplication.test.ts`

### T10: Append Mode Integration Tests
- **Goal:** Test appending content to existing objects
- **Steps:**
  1. Create `tests/integration/deduplication/append-mode.test.ts`
  2. Test: duplicate detected → append mode → fetch → append → update
  3. Test: multiple appends to same object
  4. Test: append with timestamp and source link
- **Done when:** All append mode tests passing
- **Verify:** Run `npm run test:integration -- deduplication/append`
- **Evidence to record:** Test output showing append working
- **Files touched:** `tests/integration/deduplication/append-mode.test.ts`

### T11: API-Storage Integration Tests
- **Goal:** Test API client and storage manager integration
- **Steps:**
  1. Create `tests/integration/storage/api-storage-integration.test.ts`
  2. Test: API call → response validation → storage update
  3. Test: sequential write locking
  4. Test: schema validation
- **Done when:** All API-storage tests passing
- **Verify:** Run `npm run test:integration -- storage/api`
- **Evidence to record:** Test output showing integration working
- **Files touched:** `tests/integration/storage/api-storage-integration.test.ts`

### T12: Quota Management Integration Tests
- **Goal:** Test storage quota monitoring
- **Steps:**
  1. Create `tests/integration/storage/quota-management.test.ts`
  2. Test: quota check → warning at 80%
  3. Test: quota exceeded handling
- **Done when:** All quota tests passing
- **Verify:** Run `npm run test:integration -- storage/quota`
- **Evidence to record:** Test output showing quota warnings
- **Files touched:** `tests/integration/storage/quota-management.test.ts`

---

## Verification

### T13: Run Full Integration Test Suite
- **Goal:** Verify all integration tests pass and meet performance targets
- **Steps:**
  1. Run `npm run test:integration -- --coverage`
  2. Verify all tests passing
  3. Measure total execution time (target: <10 seconds)
  4. Review coverage report for integration test files
  5. Document any slow tests (>2 seconds per file)
- **Done when:** All tests passing, execution time <10 seconds
- **Verify:** Check test output and timing
- **Evidence to record:** Full test output, execution time, coverage summary
- **Files touched:** None (verification only)

### T14: Update CI Pipeline
- **Goal:** Add integration tests to GitHub Actions workflow
- **Steps:**
  1. Update `.github/workflows/test.yml` (or create if missing)
  2. Add step to run `npm run test:integration`
  3. Ensure integration tests run after unit tests
  4. Verify CI pipeline runs successfully
- **Done when:** CI pipeline includes integration tests
- **Verify:** Check GitHub Actions workflow file and run
- **Evidence to record:** CI workflow file, successful CI run screenshot
- **Files touched:** `.github/workflows/test.yml`

---

## Documentation

### T15: Update SPECS.md and SPEC.md
- **Goal:** Update tracking files to reflect epic status
- **Steps:**
  1. Update SPECS.md row for 8.1 (Status: Done, Evidence link)
  2. Update SPEC.md to change active spec to next epic (8.2)
  3. Update Progress Tracking section in SPECS.md
  4. Commit with descriptive message
- **Done when:** All tracking files updated
- **Verify:** Review SPECS.md and SPEC.md for accuracy
- **Evidence to record:** Commit hash
- **Files touched:** `SPECS.md`, `SPEC.md`

### T16: Record Final Evidence in spec.md
- **Goal:** Consolidate all verification evidence
- **Steps:**
  1. Document integration test results in ## EVIDENCE section
  2. Document test execution time
  3. Document CI integration status
  4. Add links to relevant test files
  5. Summarize AC verification results
- **Done when:** EVIDENCE section complete with all AC verification
- **Verify:** Review spec.md for completeness
- **Evidence to record:** Final spec.md content
- **Files touched:** `specs/081-integration-tests/spec.md`

---

## Summary

| Task ID | Task Name | Estimated Time |
|---------|-----------|----------------|
| T1 | Configure Integration Test Infrastructure | 30 min |
| T2 | Auth Flow Integration Tests | 90 min |
| T3 | Bookmark Capture Integration Tests | 60 min |
| T4 | Highlight Capture Integration Tests | 60 min |
| T5 | Article Capture Integration Tests | 90 min |
| T6 | Offline Queue Integration Tests | 60 min |
| T7 | Retry Logic Integration Tests | 60 min |
| T8 | Service Worker Recovery Integration Tests | 90 min |
| T9 | URL Deduplication Integration Tests | 60 min |
| T10 | Append Mode Integration Tests | 60 min |
| T11 | API-Storage Integration Tests | 45 min |
| T12 | Quota Management Integration Tests | 45 min |
| T13 | Run Full Integration Test Suite | 30 min |
| T14 | Update CI Pipeline | 30 min |
| T15 | Update SPECS.md and SPEC.md | 15 min |
| T16 | Record Final Evidence | 30 min |

**Total Estimated Time:** ~13 hours
