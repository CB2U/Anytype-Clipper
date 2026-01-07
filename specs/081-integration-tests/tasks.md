# Tasks: Epic 8.1 Integration Tests

## Setup
### [x] T1: Configure Integration Test Infrastructure
- **Goal:** Set up integration test directory structure and npm scripts
- **Done when:** Directory structure exists, npm script works
- **Evidence:** `package.json` contains `test:integration`, `tests/integration/` exists.

---

## Creation (Audit: Complete)
### [x] T2: Auth Flow Integration Tests
### [x] T3: Bookmark Capture Integration Tests
### [x] T4: Highlight Capture Integration Tests
### [x] T5: Article Capture Integration Tests
### [x] T6: Offline Queue Integration Tests
### [x] T7: Retry Logic Integration Tests
### [x] T8: Service Worker Recovery Integration Tests
### [x] T9: URL Deduplication Integration Tests
### [x] T10: Append Mode Integration Tests
### [x] T11: API-Storage Integration Tests
### [x] T12: Quota Management Integration Tests

---

## Stabilization & Debugging (Active Phase)

### T17: Resolve `StorageManager` Quota TypeError
- **Goal:** Fix `TypeError: Cannot read properties of undefined (reading 'bytesInUse')`
- **Steps:**
    1. Inspect `StorageManager.checkQuota` implementation.
    2. Inspect `tests/integration/storage/quota-management.test.ts` mocks.
    3. Ensure `chrome.storage.local.getBytesInUse` returns expected result format.
- **Verify:** Run `npm run test:integration -- tests/integration/storage/quota-management.test.ts`

### T18: Debug Auth Flow Timeouts
- **Goal:** Stabilize `tests/integration/auth/challenge-flow.test.ts`
- **Steps:**
    1. Identify why challenge/API key exchange exceeds 5s.
    2. Increase timeout if necessary or resolve pending promises.
- **Verify:** Run `npm run test:integration -- auth/challenge`

### T19: Debug Capture Flow Timeouts
- **Goal:** Stabilize bookmark and article capture tests
- **Steps:**
    1. Investigate `tests/integration/capture/bookmark-flow.test.ts` failures.
    2. Optimize DOM mocking for article extraction tests.
- **Verify:** Run `npm run test:integration -- capture/`

### T20: Global Integration Config Tuning
- **Goal:** Update `jest.integration.config.js` for stability
- **Steps:**
    1. Increase global `testTimeout` to 10s if per-test fixes aren't enough.
    2. Ensure `jest-puppeteer` preset is correctly configured for non-browser integration tests.
- **Verify:** Run all tests.

---

## Verification & Tracking

### [/] T13: Run Full Integration Test Suite
### [ ] T14: Update CI Pipeline
### [/] T15: Update SPECS.md and SPEC.md
### [ ] T16: Record Final Evidence in spec.md

---

## Summary

| Task ID | Task Name | Status |
|---------|-----------|--------|
| T1-T12 | Creation Phase | Done |
| T17 | Fix Quota TypeError | Done |
| T18 | Debug Auth Timeouts | In Progress |
| T19 | Debug Capture Timeouts | In Progress |
| T20 | Config Tuning | Done |
| T13 | Full Suite Run | In Progress |
| T14 | CI Integration | To Do |
| T15 | Tracking Update | In Progress |
| T16 | Final Evidence | To Do |

**Total Estimated Remaining Time:** ~4-6 hours (debugging intensive)
