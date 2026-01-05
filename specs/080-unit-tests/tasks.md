# Tasks: Epic 8.0 Unit Test Suite

## Setup

### T1: Configure Jest Coverage Thresholds
- **Goal:** Enable coverage reporting and set 80% thresholds
- **Steps:**
  1. Update `jest.config.js` to include coverage configuration
  2. Add `collectCoverage`, `coverageThreshold`, `coverageReporters` options
  3. Set thresholds: 80% branches, functions, lines, statements
  4. Add `coveragePathIgnorePatterns` for types, fixtures, and generated files
  5. Run `npm test -- --coverage` to verify configuration
- **Done when:** Coverage report generates with thresholds enforced
- **Verify:** Run `npm test -- --coverage` and confirm thresholds apply
- **Evidence to record:** Screenshot of coverage output, updated jest.config.js
- **Files touched:** `jest.config.js`

### T2: Create Global Test Setup
- **Goal:** Centralize chrome API mocks and test utilities
- **Steps:**
  1. Create `tests/setup.ts` with chrome mock initialization
  2. Configure `setupFilesAfterEnv` in jest.config.js
  3. Add mock implementations for `chrome.storage.local`
  4. Add mock implementations for `chrome.runtime.sendMessage`
  5. Add mock implementations for `chrome.alarms`
  6. Export test utility functions
- **Done when:** Setup file loads before all tests
- **Verify:** Run existing tests and confirm they pass with new setup
- **Evidence to record:** Setup file contents, test execution output
- **Files touched:** `tests/setup.ts`, `jest.config.js`

### T3: Create Mock Anytype API Fixture
- **Goal:** Provide realistic API mocks for testing
- **Steps:**
  1. Create `tests/fixtures/mock-api.ts`
  2. Define mock response factories for spaces, objects, auth
  3. Add error response mocks (401, 404, 500, network errors)
  4. Export helper functions: `createMockSpace`, `createMockObject`, `createMockApiError`
  5. Add TypeScript types matching actual API responses
- **Done when:** Mock API can generate realistic responses for all endpoints
- **Verify:** Write test using mock API, verify responses match types
- **Evidence to record:** Mock API file contents, example usage
- **Files touched:** `tests/fixtures/mock-api.ts`, `tests/fixtures/api-responses/`

---

## Core Implementation

### T4: Add Storage Manager Tests
- **Goal:** Achieve coverage for `src/lib/storage/storage-manager.ts`
- **Steps:**
  1. Create `tests/unit/storage/storage-manager.test.ts`
  2. Test `get`, `set`, `remove`, `clear` methods
  3. Test quota monitoring (80% warning, 95% failure)
  4. Test schema validation
  5. Test error handling for storage failures
  6. Test data migration utilities
- **Done when:** >80% coverage for storage-manager.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/lib/storage/storage-manager.ts"`
- **Evidence to record:** Coverage output for storage-manager.ts
- **Files touched:** `tests/unit/storage/storage-manager.test.ts`

### T5: Add Settings Manager Tests
- **Goal:** Achieve coverage for `src/lib/storage/settings-manager-v2.ts`
- **Steps:**
  1. Create `tests/unit/storage/settings-manager.test.ts`
  2. Test `getSettings`, `setSettings`, `resetToDefaults` methods
  3. Test default value handling
  4. Test settings migration
  5. Test validation of settings values
  6. Test partial updates
- **Done when:** >80% coverage for settings-manager-v2.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/lib/storage/settings-manager-v2.ts"`
- **Evidence to record:** Coverage output for settings-manager-v2.ts
- **Files touched:** `tests/unit/storage/settings-manager.test.ts`

### T6: Add Health Check Module Tests
- **Goal:** Achieve coverage for `src/lib/api/health.ts`
- **Steps:**
  1. Create `tests/unit/api/health.test.ts`
  2. Test health check ping success case
  3. Test health check ping failure case (timeout)
  4. Test health check ping network error
  5. Test custom port configuration
  6. Test retry behavior
- **Done when:** >80% coverage for health.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/lib/api/health.ts"`
- **Evidence to record:** Coverage output for health.ts
- **Files touched:** `tests/unit/api/health.test.ts`

### T7: Enhance API Client Tests
- **Goal:** Improve coverage for `src/lib/api/client.ts`
- **Steps:**
  1. Review existing `client.test.ts` in `src/lib/api/`
  2. Add tests for auth token handling
  3. Add tests for 401 response detection
  4. Add tests for API error parsing
  5. Add tests for request/response validation
  6. Add tests for custom port configuration
- **Done when:** >80% coverage for client.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/lib/api/client.ts"`
- **Evidence to record:** Coverage output for client.ts
- **Files touched:** `tests/unit/api/client.test.ts` or `src/lib/api/client.test.ts`

### T8: Enhance Queue Manager Tests
- **Goal:** Improve coverage for `src/background/queue-manager.ts`
- **Steps:**
  1. Review existing `queue-manager.test.ts`
  2. Add tests for queue size limit (1000 items)
  3. Add tests for FIFO eviction
  4. Add tests for atomic operations
  5. Add tests for service worker recovery
  6. Add tests for concurrent access handling
- **Done when:** >80% coverage for queue-manager.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/background/queue-manager.ts"`
- **Evidence to record:** Coverage output for queue-manager.ts
- **Files touched:** `tests/unit/queue-manager.test.ts`

### T9: Enhance Retry Scheduler Tests
- **Goal:** Improve coverage for `src/background/retry-scheduler.ts`
- **Steps:**
  1. Review existing `retry-scheduler.test.ts`
  2. Add tests for exponential backoff intervals (1s, 5s, 30s, 5m)
  3. Add tests for max retry limit (10 attempts)
  4. Add tests for manual retry
  5. Add tests for failed item deletion
  6. Add tests for alarm integration
- **Done when:** >80% coverage for retry-scheduler.ts
- **Verify:** Run `npm test -- --coverage --collectCoverageFrom="src/background/retry-scheduler.ts"`
- **Evidence to record:** Coverage output for retry-scheduler.ts
- **Files touched:** `tests/unit/retry-scheduler.test.ts`

### T10: Enhance Extractor Tests
- **Goal:** Add edge cases to all extractor tests
- **Steps:**
  1. Review all extractor test files in `tests/unit/`
  2. Add tests for empty HTML input
  3. Add tests for malformed HTML
  4. Add tests for missing meta tags
  5. Add tests for unicode content
  6. Add tests for very large content (>1MB)
- **Done when:** All extractor tests have edge case coverage
- **Verify:** Run `npm test -- --coverage` and check extractor coverage
- **Evidence to record:** Coverage report showing extractor modules
- **Files touched:** `tests/unit/article-extractor.test.ts`, `tests/unit/metadata-extractor.test.ts`, `tests/unit/opengraph-extractor.test.ts`, `tests/unit/schema-org-extractor.test.ts`, `tests/unit/twitter-card-extractor.test.ts`

### T11: Enhance Converter Tests
- **Goal:** Add edge cases to converter tests
- **Steps:**
  1. Review `markdown-converter.test.ts`, `table-converter.test.ts`, `url-normalizer.test.ts`
  2. Add tests for nested HTML structures
  3. Add tests for special characters and unicode
  4. Add tests for empty/null inputs
  5. Add tests for malformed URLs
  6. Add tests for very long content
- **Done when:** All converter tests have edge case coverage
- **Verify:** Run `npm test -- --coverage` and check converter coverage
- **Evidence to record:** Coverage report showing converter modules
- **Files touched:** `tests/unit/markdown-converter.test.ts`, `tests/unit/table-converter.test.ts`, `tests/unit/url-normalizer.test.ts`

### T12: Add Image Handler Tests
- **Goal:** Test image handling module if not covered
- **Steps:**
  1. Locate image handler module in `src/lib/extractors/` or `src/lib/converters/`
  2. Create test file if missing
  3. Test image size threshold (<500KB embed, >500KB link)
  4. Test CORS error handling
  5. Test WebP conversion
  6. Test embedded image limit (20 per article)
- **Done when:** >80% coverage for image handler
- **Verify:** Run `npm test -- --coverage` and check image handler coverage
- **Evidence to record:** Coverage report for image handler module
- **Files touched:** `tests/unit/image/` directory

---

## Verification

### T13: Run Full Coverage Report
- **Goal:** Verify >80% coverage threshold is met
- **Steps:**
  1. Run `npm test -- --coverage`
  2. Review coverage report for each module
  3. Identify any modules below 80%
  4. Add additional tests if needed
  5. Document final coverage percentages
- **Done when:** All modules at >80% coverage
- **Verify:** Coverage report shows all thresholds passing
- **Evidence to record:** Full coverage report, screenshot of summary
- **Files touched:** None (verification only)

### T14: Verify Test Execution Time
- **Goal:** Ensure tests complete in <5 seconds
- **Steps:**
  1. Run `npm test` and measure total execution time
  2. Identify any slow tests (>500ms each)
  3. Optimize slow tests using mocks
  4. Re-run and confirm <5s total
- **Done when:** Test suite completes in <5 seconds
- **Verify:** `npm test` output shows execution time <5s
- **Evidence to record:** Terminal output with timing
- **Files touched:** Any slow test files if optimization needed

---

## Documentation

### T15: Update SPECS.md and SPEC.md
- **Goal:** Update tracking files to reflect epic status
- **Steps:**
  1. Update SPECS.md row for 8.0 (Status: Done, Evidence link)
  2. Update SPEC.md to change active spec to next epic
  3. Update Progress Tracking section in SPECS.md
  4. Commit with descriptive message
- **Done when:** All tracking files updated
- **Verify:** Review SPECS.md and SPEC.md for accuracy
- **Evidence to record:** Commit hash
- **Files touched:** `SPECS.md`, `SPEC.md`

### T16: Record Final Evidence in spec.md
- **Goal:** Consolidate all verification evidence
- **Steps:**
  1. Document coverage report results in ## EVIDENCE section
  2. Document test execution time
  3. Document CI integration status
  4. Add links to relevant test files
  5. Summarize AC verification results
- **Done when:** EVIDENCE section complete with all AC verification
- **Verify:** Review spec.md for completeness
- **Evidence to record:** Final spec.md content
- **Files touched:** `specs/080-unit-tests/spec.md`

---

## Summary

| Task ID | Task Name | Estimated Time |
|---------|-----------|----------------|
| T1 | Configure Jest Coverage Thresholds | 30 min |
| T2 | Create Global Test Setup | 45 min |
| T3 | Create Mock Anytype API Fixture | 60 min |
| T4 | Add Storage Manager Tests | 60 min |
| T5 | Add Settings Manager Tests | 45 min |
| T6 | Add Health Check Module Tests | 45 min |
| T7 | Enhance API Client Tests | 45 min |
| T8 | Enhance Queue Manager Tests | 45 min |
| T9 | Enhance Retry Scheduler Tests | 45 min |
| T10 | Enhance Extractor Tests | 60 min |
| T11 | Enhance Converter Tests | 45 min |
| T12 | Add Image Handler Tests | 45 min |
| T13 | Run Full Coverage Report | 30 min |
| T14 | Verify Test Execution Time | 30 min |
| T15 | Update SPECS.md and SPEC.md | 15 min |
| T16 | Record Final Evidence | 30 min |

**Total Estimated Time:** ~10.5 hours
