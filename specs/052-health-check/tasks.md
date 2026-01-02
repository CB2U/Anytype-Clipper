# Tasks: Health Check & Recovery

## Overview

This document breaks down Epic 5.2 into granular, implementation-ready tasks. Each task includes goal, steps, done-when criteria, verification steps, and evidence to record.

---

## Setup

### T1: Review Existing Health Check Implementation

**Goal:** Understand the current `health.ts` implementation and identify integration points.

**Steps:**
1. Read `src/lib/api/health.ts` completely
2. Review `checkHealth()` function signature and behavior
3. Identify how it's currently exported and used
4. Review timeout and port configuration
5. Document any gaps or needed changes

**Done When:**
- Existing health check implementation understood
- Integration points identified
- No changes needed to `health.ts` itself

**Verify:**
- Review notes on health check implementation
- Confirm health check is already exported from `src/lib/api/index.ts`

**Evidence to Record:**
- Confirmation that `checkHealth()` is ready for integration
- Note any discovered issues or limitations

**Files Touched:**
- `src/lib/api/health.ts` (read only)
- `src/lib/api/index.ts` (read only)

---

### T2: Review Queue Manager and Service Worker

**Goal:** Understand current queue manager and service worker initialization flow.

**Steps:**
1. Read `src/background/queue-manager.ts` to understand queue operations
2. Review `src/background/service-worker.ts` initialization sequence
3. Identify where recovery logic should be added
4. Review how `RetryScheduler.resumeRetries()` currently works
5. Document service worker startup sequence

**Done When:**
- Queue manager operations understood
- Service worker initialization flow documented
- Recovery insertion point identified

**Verify:**
- Review notes on service worker startup
- Confirm `initialize()` function is the right place for recovery

**Evidence to Record:**
- Service worker initialization sequence documented
- Recovery insertion point identified

**Files Touched:**
- `src/background/queue-manager.ts` (read only)
- `src/background/service-worker.ts` (read only)
- `src/background/retry-scheduler.ts` (read only)

---

## Core Implementation

### T3: Add Queue Manager Recovery Method

**Goal:** Implement `resetSendingToQueued()` method in QueueManager to reset stuck items.

**Steps:**
1. Open `src/background/queue-manager.ts`
2. Add `resetSendingToQueued()` method that:
   - Gets all queue items
   - Filters for items with status "sending"
   - Updates each to status "queued"
   - Logs the number of items reset
3. Add TypeScript types as needed
4. Add JSDoc comments

**Done When:**
- `resetSendingToQueued()` method implemented
- Method returns number of items reset
- Method is async and handles errors gracefully
- Code compiles without errors

**Verify:**
- TypeScript compilation passes
- Method signature matches plan

**Evidence to Record:**
- Code snippet of `resetSendingToQueued()` implementation
- TypeScript compilation success

**Files Touched:**
- `src/background/queue-manager.ts`

---

### T4: Implement Service Worker Recovery

**Goal:** Add recovery logic to service worker initialization to reset stuck items.

**Steps:**
1. Open `src/background/service-worker.ts`
2. Add `recoverStuckItems()` async function that:
   - Calls `queueManager.resetSendingToQueued()`
   - Logs recovery start and completion at info level
   - Logs number of items recovered
   - Handles errors gracefully
3. Update `initialize()` function to call `recoverStuckItems()` before `retryScheduler.resumeRetries()`
4. Add appropriate logging

**Done When:**
- `recoverStuckItems()` function implemented
- Function called in `initialize()` before retry resumption
- Logging added at info level
- Code compiles without errors

**Verify:**
- TypeScript compilation passes
- Recovery runs before retry scheduler

**Evidence to Record:**
- Code snippet of recovery implementation
- Log output showing recovery sequence

**Files Touched:**
- `src/background/service-worker.ts`

---

### T5: Integrate Health Check into Bookmark Capture Service

**Goal:** Add health check before API calls in `BookmarkCaptureService.captureBookmark()`.

**Steps:**
1. Open `src/lib/capture/bookmark-capture-service.ts`
2. Import `checkHealth` from `../api/health`
3. In `captureBookmark()` method, before the API call:
   - Call `checkHealth()` with default port 31009 and 2s timeout
   - If health check returns false:
     - Log at debug level: "Anytype unavailable, queuing capture"
     - Queue the capture immediately
     - Return queue result
   - If health check returns true:
     - Proceed with existing API call logic
4. Add logging for health check results
5. Handle errors gracefully

**Done When:**
- Health check integrated into capture flow
- Queue decision based on health check result
- Logging added at debug level
- Code compiles without errors

**Verify:**
- TypeScript compilation passes
- Health check called before API attempt
- Queue logic triggered when health check fails

**Evidence to Record:**
- Code snippet of health check integration
- Log output showing health check decision

**Files Touched:**
- `src/lib/capture/bookmark-capture-service.ts`

---

### T6: Add Custom Port Support for Health Check

**Goal:** Support custom Anytype port configuration for health checks.

**Steps:**
1. Open `src/lib/capture/bookmark-capture-service.ts`
2. In health check integration (T5):
   - Read port from storage using `this.storage.get('anytypePort')` (or similar)
   - Default to 31009 if not configured
   - Validate port range (1024-65535)
   - Pass port to `checkHealth(port, 2000)`
3. Add port validation logic
4. Add logging for port configuration

**Done When:**
- Custom port support implemented
- Port validation added
- Default to 31009 on invalid port
- Code compiles without errors

**Verify:**
- TypeScript compilation passes
- Port configuration read from storage
- Invalid ports default to 31009

**Evidence to Record:**
- Code snippet of port configuration logic
- Test with custom port value

**Files Touched:**
- `src/lib/capture/bookmark-capture-service.ts`

---

## Tests

### T7: Write Health Check Integration Unit Tests

**Goal:** Create unit tests for health check integration in capture flow.

**Steps:**
1. Create `tests/unit/health-check-integration.test.ts`
2. Mock `checkHealth` function
3. Write test cases:
   - Health check returns true → capture proceeds with API call
   - Health check returns false → capture is immediately queued
   - Health check uses configured port
   - Health check timeout is 2 seconds
   - Health check never throws
4. Use existing test patterns from `tests/unit/queue-manager.test.ts`
5. Ensure all tests pass

**Done When:**
- Test file created with 5+ test cases
- All tests pass
- Code coverage >80% for health check integration

**Verify:**
- Run: `npm test -- tests/unit/health-check-integration.test.ts`
- All tests pass

**Evidence to Record:**
- Test output showing all tests passed
- Code coverage report

**Files Touched:**
- `tests/unit/health-check-integration.test.ts` (new)

---

### T8: Write Service Worker Recovery Integration Tests

**Goal:** Create integration tests for service worker recovery logic.

**Steps:**
1. Create `tests/integration/service-worker-recovery.test.ts`
2. Use existing integration test patterns from `tests/integration/queue-persistence.test.ts`
3. Write test cases:
   - "Sending" items are reset to "queued" on startup
   - Recovery runs before retry scheduler
   - No data loss during recovery
   - Multiple "sending" items are all recovered
4. Mock chrome.storage.local and QueueManager
5. Ensure all tests pass

**Done When:**
- Test file created with 4+ test cases
- All tests pass
- Recovery logic fully tested

**Verify:**
- Run: `npm test -- tests/integration/service-worker-recovery.test.ts`
- All tests pass

**Evidence to Record:**
- Test output showing all tests passed
- Recovery behavior verified

**Files Touched:**
- `tests/integration/service-worker-recovery.test.ts` (new)

---

## Verification

### T9: Manual Verification - Health Check Integration

**Goal:** Manually verify health check integration works as expected.

**Steps:**
1. Build extension: `npm run build`
2. Load extension in browser
3. Close Anytype Desktop completely
4. Open extension popup
5. Try to save a bookmark
6. Observe immediate "Saved offline!" message without delay
7. Check browser console for health check logs
8. Open Anytype Desktop
9. Wait for automatic retry
10. Verify bookmark created successfully

**Done When:**
- Immediate queue feedback when Anytype is closed
- No 2-second delay from failed API attempt
- Automatic retry succeeds when Anytype opens
- Health check logs visible in console

**Verify:**
- Manual test steps completed
- Screenshots or screen recording captured

**Evidence to Record:**
- Screenshot of "Saved offline!" message
- Console logs showing health check result
- Confirmation of successful retry

**Files Touched:**
- N/A (manual testing)

---

### T10: Manual Verification - Service Worker Recovery

**Goal:** Manually verify service worker recovery resets stuck items.

**Steps:**
1. Build extension: `npm run build`
2. Load extension in browser
3. Queue a bookmark (close Anytype first)
4. Open browser DevTools → Application → Service Workers
5. Find "Anytype Clipper" service worker
6. Click "Stop" to terminate the service worker
7. Wait a few seconds
8. Open extension popup (this will restart the service worker)
9. Check browser console for recovery logs
10. Verify queued item is still present and in "queued" status

**Done When:**
- Service worker recovery logs appear in console
- Queued item remains intact
- No items stuck in "sending" status
- Recovery completes successfully

**Verify:**
- Manual test steps completed
- Screenshots or screen recording captured

**Evidence to Record:**
- Screenshot of recovery logs in console
- Confirmation that queued item is recovered
- Queue status showing "queued" not "sending"

**Files Touched:**
- N/A (manual testing)

---

### T11: Manual Verification - Custom Port Support

**Goal:** Manually verify custom port configuration works for health checks.

**Steps:**
1. Build extension: `npm run build`
2. Load extension in browser
3. Open browser console
4. Test with default port (31009):
   - Close Anytype
   - Try to save bookmark
   - Verify health check uses port 31009 (check logs)
5. Test with invalid port (if settings page exists):
   - Configure port to 999
   - Try to save bookmark
   - Verify health check defaults to 31009
6. Test with valid custom port (if settings page exists):
   - Configure port to custom value
   - Restart Anytype on custom port
   - Try to save bookmark
   - Verify health check uses custom port

**Done When:**
- Default port (31009) works correctly
- Invalid ports default to 31009
- Custom ports work correctly (if configurable)
- Port configuration logged in console

**Verify:**
- Manual test steps completed
- Port configuration verified in logs

**Evidence to Record:**
- Console logs showing port configuration
- Confirmation of default and custom port behavior

**Files Touched:**
- N/A (manual testing)

---

## Tracking

### T12: Update SPECS.md

**Goal:** Update the specification index to reflect Epic 5.2 status.

**Steps:**
1. Open `SPECS.md`
2. Update Epic 5.2 row in BP4 table:
   - Status: "In Progress" → "Implementing" (or "Done" if complete)
   - Next Task: Current task ID
   - Evidence: Link to `specs/052-health-check/spec.md#evidence`
3. Update "Last Updated" timestamp
4. Update progress tracking section
5. Commit changes

**Done When:**
- SPECS.md updated with Epic 5.2 status
- Evidence link added
- Timestamp updated

**Verify:**
- SPECS.md renders correctly
- Links work

**Evidence to Record:**
- Git commit hash for SPECS.md update

**Files Touched:**
- `SPECS.md`

---

### T13: Update SPEC.md Entrypoint

**Goal:** Update the SPEC.md entrypoint to point to Epic 5.2.

**Steps:**
1. Open `SPEC.md`
2. Update "Current Focus" section:
   - Recent Completion: Epic 5.1 (Retry Logic with Backoff)
   - Working on: Epic 5.2 (Health Check & Recovery)
3. Update "Active Specification" section:
   - Epic: 5.2
   - Name: Health Check & Recovery
   - Status: "In Progress" or "Implementing"
   - Spec Path: `specs/052-health-check/spec.md`
4. Update quick links
5. Commit changes

**Done When:**
- SPEC.md updated to point to Epic 5.2
- Links work correctly

**Verify:**
- SPEC.md renders correctly
- Links work

**Evidence to Record:**
- Git commit hash for SPEC.md update

**Files Touched:**
- `SPEC.md`

---

### T14: Update Documentation

**Goal:** Update README.md with health check and recovery information.

**Steps:**
1. Open `README.md`
2. Add section on "Health Check & Recovery" under features or architecture
3. Document:
   - Health check integration before captures
   - Service worker recovery on startup
   - How stuck items are recovered
4. Add any relevant troubleshooting tips
5. Commit changes

**Done When:**
- README.md updated with health check information
- Documentation is clear and accurate

**Verify:**
- README.md renders correctly
- Documentation is helpful

**Evidence to Record:**
- Git commit hash for README.md update

**Files Touched:**
- `README.md`

---

### T15: Consolidate Evidence in spec.md

**Goal:** Update `specs/052-health-check/spec.md` with final evidence summary.

**Steps:**
1. Open `specs/052-health-check/spec.md`
2. Navigate to ## EVIDENCE section
3. For each acceptance criterion (AC-H1 through AC-H6):
   - Add evidence from automated tests
   - Add evidence from manual verification
   - Link to test files and commits
   - Include screenshots or logs as needed
4. Add final summary of verification
5. Commit changes

**Done When:**
- All acceptance criteria have evidence
- Evidence is comprehensive and verifiable
- spec.md is complete

**Verify:**
- spec.md renders correctly
- All evidence links work

**Evidence to Record:**
- Git commit hash for spec.md evidence update
- Final verification summary

**Files Touched:**
- `specs/052-health-check/spec.md`

---

## Task Summary

**Total Tasks:** 15

**Breakdown:**
- Setup: 2 tasks (T1-T2)
- Core Implementation: 4 tasks (T3-T6)
- Tests: 2 tasks (T7-T8)
- Verification: 3 tasks (T9-T11)
- Tracking: 3 tasks (T12-T14)
- Final: 1 task (T15)

**Estimated Time:** 6-8 hours

---

**End of Tasks**
