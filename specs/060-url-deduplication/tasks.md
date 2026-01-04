# Tasks: URL Deduplication

**Epic:** 6.0 URL Deduplication  
**Spec:** [spec.md](./spec.md)  
**Plan:** [plan.md](./plan.md)

---

## Setup

### T1: Verify Anytype API Search Endpoint ✅ COMPLETE

**Goal:** Confirm the exact API endpoint and request format for searching objects by URL

**Steps:**
1. Review Anytype API documentation (`docs/reference/openapi-2025-11-08.yaml`)
2. Identify the correct endpoint for searching objects by property
3. Document the request/response format
4. Test the endpoint manually using curl or Postman
5. Update plan.md with confirmed endpoint details

**Done When:**
- API endpoint confirmed and documented
- Request/response format validated
- Test request returns expected results

**Verify:**
- Manual API test with curl returns objects matching URL filter

**Evidence to Record:**
- API endpoint path and method
- Sample request/response JSON
- Any deviations from assumptions in plan.md

**Files Touched:**
- `specs/060-url-deduplication/plan.md` (update API section)
- `specs/060-url-deduplication/spec.md` (resolve open question #1)

---

## Core Implementation

### T2: Create DeduplicationService Module ✅ COMPLETE

**Goal:** Implement the DeduplicationService class for searching existing objects by URL

**Steps:**
1. Create `src/lib/services/deduplication-service.ts`
2. Implement `DeduplicationService` class with `searchByUrl()` method
3. Integrate with Anytype API search endpoint (from T1)
4. Use `cleanUrlForDeduplication()` from `url-normalizer.ts` for URL normalization
5. Implement 1-second timeout for search requests
6. Handle API errors gracefully (return `{found: false}` on error)
7. Add TypeScript interfaces for `DuplicateResult` and `ExistingObject`
8. Add console logging for debugging (sanitized URLs only)

**Done When:**
- `DeduplicationService` class implemented
- `searchByUrl()` method searches Anytype API
- URL normalization applied before search
- Timeout and error handling implemented
- TypeScript types defined

**Verify:**
- Unit tests pass (T10)
- Manual test: Search for existing URL returns `{found: true, object: {...}}`
- Manual test: Search for non-existent URL returns `{found: false}`

**Evidence to Record:**
- Code implementation in `deduplication-service.ts`
- Console logs showing search results
- Screenshot of successful duplicate detection

**Files Touched:**
- `src/lib/services/deduplication-service.ts` (new)
- `src/types/deduplication.d.ts` (new - TypeScript types)

---

### T3: Integrate Deduplication into Service Worker ✅ COMPLETE

**Goal:** Add deduplication check to bookmark capture flow in service worker

**Steps:**
1. Open `src/background/service-worker.ts`
2. Import `DeduplicationService`
3. Add deduplication check before creating bookmark object
4. Call `deduplicationService.searchByUrl(normalizedUrl, spaceId)`
5. If duplicate found, send message to popup with duplicate info
6. If no duplicate or error, proceed with bookmark creation
7. Skip deduplication if Anytype is offline (queue capture directly)
8. Add console logging for deduplication results

**Done When:**
- Deduplication check integrated into bookmark capture flow
- Duplicate detection runs before object creation
- Popup receives duplicate info when found
- Offline mode skips deduplication
- Logging added for debugging

**Verify:**
- Integration tests pass (T11)
- Manual test: Capture bookmark, attempt duplicate → Popup shows warning
- Manual test: Capture bookmark while offline → Deduplication skipped

**Evidence to Record:**
- Code changes in `service-worker.ts`
- Console logs showing deduplication flow
- Screenshot of duplicate warning in popup

**Files Touched:**
- `src/background/service-worker.ts` (modify)

---

### T4: Create Duplicate Warning UI Component
**Goal:** Build popup UI component to display duplicate warning and action buttons

**Steps:**
1. Create `src/popup/components/duplicate-warning.ts`
2. Create `src/popup/components/duplicate-warning.html` (template)
3. Create `src/popup/components/duplicate-warning.css` (styles)
4. Display existing object title and creation date
5. Add three action buttons: "Skip", "Create Anyway", "Append to Existing"
6. Implement button click handlers
7. Send user choice back to service worker
8. Add visual styling (warning icon, clear button labels)

**Done When:**
- Duplicate warning component implemented
- UI displays object title and date
- Three action buttons functional
- User choice sent to service worker
- Styling matches popup design

**Verify:**
- Manual test: Trigger duplicate warning → UI displays correctly
- Manual test: Click "Skip" → Capture cancelled
- Manual test: Click "Create Anyway" → New object created
- Manual test: Click "Append" → Stub message shown (full implementation in Epic 6.2)

**Evidence to Record:**
- Screenshot of duplicate warning UI
- Code implementation in `duplicate-warning.ts`
- User interaction flow working correctly

**Files Touched:**
- `src/popup/components/duplicate-warning.ts` (new)
- `src/popup/components/duplicate-warning.html` (new)
- `src/popup/components/duplicate-warning.css` (new)

---

### T5: Integrate Duplicate Warning into Popup
**Goal:** Connect duplicate warning component to main popup UI

**Steps:**
1. Open `src/popup/popup.ts`
2. Import `DuplicateWarning` component
3. Listen for duplicate detection message from service worker
4. Show duplicate warning when message received
5. Hide normal capture UI while warning is shown
6. Handle user choice from warning component
7. Send choice to service worker
8. Restore normal UI after user action

**Done When:**
- Duplicate warning integrated into popup
- Message listener implemented
- UI state management working
- User choice sent to service worker
- Normal UI restored after action

**Verify:**
- Manual test: Trigger duplicate → Warning shown, normal UI hidden
- Manual test: Choose action → Normal UI restored
- Integration tests pass (T11)

**Evidence to Record:**
- Code changes in `popup.ts`
- Screenshot of UI state transitions
- User flow working end-to-end

**Files Touched:**
- `src/popup/popup.ts` (modify)
- `src/popup/popup.html` (modify - add warning container)
- `src/popup/popup.css` (modify - add warning styles)

---

### T6: Implement User Action Handlers
**Goal:** Handle user choices (Skip, Create Anyway, Append) in service worker

**Steps:**
1. Open `src/background/service-worker.ts`
2. Add message listener for user choice from popup
3. Implement "Skip" action: Cancel capture, send cancellation message to popup
4. Implement "Create Anyway" action: Create bookmark despite duplicate
5. Implement "Append" action: Stub for Epic 6.2 (show "Coming soon" message)
6. Add logging for each action
7. Send success/error message back to popup

**Done When:**
- All three user actions handled
- "Skip" cancels capture
- "Create Anyway" creates object
- "Append" shows stub message
- Success/error messages sent to popup

**Verify:**
- Manual test: Choose "Skip" → Capture cancelled, popup shows message
- Manual test: Choose "Create Anyway" → Object created, success shown
- Manual test: Choose "Append" → Stub message shown
- Integration tests pass (T11)

**Evidence to Record:**
- Code implementation in `service-worker.ts`
- Console logs for each action
- Screenshots of success/error messages

**Files Touched:**
- `src/background/service-worker.ts` (modify)

---

### T7: Enhance URL Normalizer (if needed) ✅ COMPLETE

**Goal:** Verify and enhance URL normalization for www removal

**Steps:**
1. Open `src/lib/utils/url-normalizer.ts`
2. Review `cleanUrlForDeduplication()` function
3. Add www removal if not already implemented:
   ```typescript
   if (u.hostname.startsWith('www.')) {
     u.hostname = u.hostname.substring(4);
   }
   ```
4. Verify all normalization rules match spec requirements
5. Add unit tests for www removal (if added)

**Done When:**
- www removal implemented (if needed)
- All normalization rules verified
- Unit tests cover www removal

**Verify:**
- Unit tests pass (T10)
- Manual test: `www.example.com` and `example.com` normalize to same URL

**Evidence to Record:**
- Code changes in `url-normalizer.ts` (if any)
- Unit test results
- Confirmation that all normalization rules are implemented

**Files Touched:**
- `src/lib/utils/url-normalizer.ts` (modify if needed)
- `tests/unit/url-normalizer.test.ts` (modify if needed)

---

## Tests

### T8: Write Unit Tests for URL Normalization
**Goal:** Comprehensive unit tests for URL normalization edge cases

**Steps:**
1. Open or create `tests/unit/url-normalizer.test.ts`
2. Add test cases for:
   - HTTP/HTTPS normalization
   - Trailing slash removal
   - Hostname lowercasing
   - www removal
   - Tracking parameter removal
   - Query parameter sorting
   - Fragment removal
   - Malformed URL handling
3. Run tests and verify all pass
4. Achieve >90% coverage for `url-normalizer.ts`

**Done When:**
- All test cases implemented
- Tests pass
- Coverage >90%

**Verify:**
```bash
npm test -- tests/unit/url-normalizer.test.ts
npm run coverage -- tests/unit/url-normalizer.test.ts
```

**Evidence to Record:**
- Test file implementation
- Test output showing all tests passing
- Coverage report

**Files Touched:**
- `tests/unit/url-normalizer.test.ts` (new or modify)

---

### T9: Write Unit Tests for DeduplicationService
**Goal:** Unit tests for deduplication service with mocked API

**Steps:**
1. Create `tests/unit/deduplication-service.test.ts`
2. Mock Anytype API search endpoint
3. Add test cases for:
   - Successful duplicate detection
   - No duplicate found
   - API error handling
   - Timeout handling
   - Malformed URL handling
   - Performance (<1s search)
4. Run tests and verify all pass
5. Achieve >85% coverage for `deduplication-service.ts`

**Done When:**
- All test cases implemented
- API mocking working
- Tests pass
- Coverage >85%

**Verify:**
```bash
npm test -- tests/unit/deduplication-service.test.ts
npm run coverage -- tests/unit/deduplication-service.test.ts
```

**Evidence to Record:**
- Test file implementation
- Test output showing all tests passing
- Coverage report

**Files Touched:**
- `tests/unit/deduplication-service.test.ts` (new)
- `tests/fixtures/mock-anytype-api.ts` (new or modify - API mocks)

---

### T10: Write Integration Tests for Deduplication Flow
**Goal:** End-to-end integration tests for duplicate detection flow

**Steps:**
1. Create `tests/integration/deduplication-flow.test.ts`
2. Set up test environment with mock Anytype API
3. Add test cases for:
   - Basic duplicate detection (AC6)
   - URL variation handling (AC14)
   - Skip action
   - Create anyway action
   - Append action (stub)
   - Offline mode (deduplication skipped)
   - API error (graceful degradation)
4. Run tests and verify all pass

**Done When:**
- All integration test cases implemented
- Tests pass
- AC6 and AC14 verified by tests

**Verify:**
```bash
npm test -- tests/integration/deduplication-flow.test.ts
```

**Evidence to Record:**
- Test file implementation
- Test output showing all tests passing
- AC6 and AC14 verification confirmed

**Files Touched:**
- `tests/integration/deduplication-flow.test.ts` (new)

---

## Docs

### T11: Update README with Deduplication Feature
**Goal:** Document the deduplication feature in user-facing documentation

**Steps:**
1. Open `README.md`
2. Add section under "Features" describing URL deduplication
3. Explain how duplicate detection works
4. Document user actions (Skip, Create Anyway, Append)
5. Add screenshot of duplicate warning UI
6. Update feature checklist to mark deduplication as complete

**Done When:**
- README updated with deduplication section
- Screenshot added
- Feature checklist updated

**Verify:**
- Manual review of README
- Screenshot displays correctly

**Evidence to Record:**
- README changes
- Screenshot of duplicate warning

**Files Touched:**
- `README.md` (modify)
- `docs/screenshots/duplicate-warning.png` (new)

---

## Verification

### T12: Manual Verification - AC6 and AC14
**Goal:** Manually verify acceptance criteria AC6 and AC14

**Steps:**
1. Load extension in browser
2. Execute test matrix from plan.md:
   - TC1: Basic duplicate detection
   - TC2: Skip action
   - TC3: Create anyway action
   - TC4: HTTP/HTTPS variation
   - TC5: Trailing slash variation
   - TC6: WWW variation
   - TC7: Tracking params variation
   - TC8: Fragment variation
3. Document results for each test case
4. Take screenshots of duplicate warning UI
5. Record any issues or edge cases found

**Done When:**
- All test cases executed
- AC6 and AC14 verified
- Screenshots captured
- Issues documented

**Verify:**
- Manual test matrix completed
- All test cases pass
- Screenshots show correct behavior

**Evidence to Record:**
- Test matrix results (table with pass/fail for each TC)
- Screenshots of duplicate warning
- Any issues or edge cases found

**Files Touched:**
- `specs/060-url-deduplication/spec.md` (update EVIDENCE section)

---

### T13: Manual Verification - Performance and Error Handling
**Goal:** Verify performance requirements and error handling (AC-U1, AC-U2)

**Steps:**
1. Test performance (AC-U1):
   - Create 100+ bookmarks in a Space
   - Attempt to save duplicate
   - Measure search time using browser DevTools Network tab
   - Verify search completes <1s
2. Test error handling (AC-U2):
   - Mock API error (or stop Anytype temporarily)
   - Attempt to save bookmark
   - Verify error logged to console
   - Verify capture proceeds without blocking user
3. Test offline mode:
   - Stop Anytype
   - Attempt to save bookmark
   - Verify deduplication skipped
   - Verify bookmark queued
4. Document results

**Done When:**
- Performance test completed (<1s search)
- Error handling verified
- Offline mode verified
- Results documented

**Verify:**
- DevTools Network tab shows search <1s
- Console shows error log for API failure
- Bookmark created despite error
- Offline queue works correctly

**Evidence to Record:**
- Performance measurement results
- Console logs for error handling
- Screenshots of offline queue

**Files Touched:**
- `specs/060-url-deduplication/spec.md` (update EVIDENCE section)

---

## Tracking

### T14: Update SPECS.md
**Goal:** Update the specification index with current status

**Steps:**
1. Open `SPECS.md`
2. Update Epic 6.0 row:
   - Status: "Implementing" → "Testing" → "Done"
   - Next Task: Current task ID
   - Latest Commit: `git rev-parse --short HEAD`
3. Update progress counters
4. Commit changes

**Done When:**
- SPECS.md updated with current status
- Progress counters accurate
- Changes committed

**Verify:**
- SPECS.md shows correct status
- Commit hash matches latest commit

**Evidence to Record:**
- SPECS.md changes
- Commit hash

**Files Touched:**
- `SPECS.md` (modify)

---

### T15: Update SPEC.md with Evidence
**Goal:** Consolidate all verification evidence in spec.md

**Steps:**
1. Open `specs/060-url-deduplication/spec.md`
2. Update EVIDENCE section with:
   - AC6 verification results (from T12)
   - AC14 verification results (from T12)
   - AC-U1 verification results (from T13)
   - AC-U2 verification results (from T13)
   - Links to test files
   - Screenshots
   - Performance measurements
   - Any issues or edge cases found
3. Add summary of implementation
4. Mark all acceptance criteria as verified

**Done When:**
- EVIDENCE section complete
- All ACs verified and documented
- Screenshots and links added
- Summary written

**Verify:**
- Manual review of EVIDENCE section
- All ACs have verification evidence
- Links and screenshots work

**Evidence to Record:**
- Completed EVIDENCE section in spec.md

**Files Touched:**
- `specs/060-url-deduplication/spec.md` (modify EVIDENCE section)

---

## Task Summary

**Total Tasks:** 15  
**Estimated Time:** 8-12 hours

**Task Breakdown:**
- Setup: 1 task (T1)
- Core Implementation: 6 tasks (T2-T7)
- Tests: 3 tasks (T8-T10)
- Docs: 1 task (T11)
- Verification: 2 tasks (T12-T13)
- Tracking: 2 tasks (T14-T15)

**Dependencies:**
- T2 depends on T1 (API endpoint verification)
- T3 depends on T2 (DeduplicationService must exist)
- T4, T5 can be done in parallel with T2, T3
- T6 depends on T3, T5
- T7 can be done anytime
- T8, T9, T10 can be done in parallel after T2-T7
- T11 can be done after T4 (need screenshot)
- T12, T13 must be done after T2-T10
- T14, T15 must be done last
