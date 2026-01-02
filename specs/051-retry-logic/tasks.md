# Tasks: Retry Logic with Backoff

## Setup

### T1: Create RetryScheduler Class Structure
**Goal:** Create the RetryScheduler class with basic structure and dependencies

**Steps:**
1. Create `src/background/retry-scheduler.ts`
2. Define RetryScheduler class with singleton pattern
3. Add dependencies: QueueManager, AnytypeApiClient
4. Define constants: MAX_RETRY_ATTEMPTS = 10, BACKOFF_INTERVALS = [1000, 5000, 30000, 300000]
5. Add TypeScript types for retry operations

**Done When:**
- File created with class structure
- Dependencies injected via constructor
- Constants defined
- TypeScript compiles without errors

**Verify:**
- Run `npm run type-check`
- Verify no TypeScript errors

**Evidence to Record:**
- File path and structure
- TypeScript compilation success

**Files Touched:**
- `src/background/retry-scheduler.ts` (new)

---

### T2: Implement Backoff Calculation
**Goal:** Implement exponential backoff calculation method

**Steps:**
1. Add `calculateBackoff(retryCount: number): number` method
2. Implement logic:
   - Attempt 1: 1000ms (1s)
   - Attempt 2: 5000ms (5s)
   - Attempt 3: 30000ms (30s)
   - Attempt 4+: 300000ms (5m)
3. Add JSDoc comments explaining backoff strategy
4. Handle edge cases (retryCount < 0, retryCount > 10)

**Done When:**
- Method implemented with correct intervals
- JSDoc comments added
- Edge cases handled

**Verify:**
- Write unit test in `tests/unit/retry-scheduler.test.ts`
- Test cases for attempts 1-10
- Test edge cases

**Evidence to Record:**
- Unit test results showing correct backoff intervals

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/unit/retry-scheduler.test.ts` (new)

---

## Core Implementation

### T3: Implement Retry Scheduling
**Goal:** Implement method to schedule retry attempts using chrome.alarms

**Steps:**
1. Add `scheduleRetry(queueItem: QueueItem): Promise<void>` method
2. Calculate backoff delay using `calculateBackoff(queueItem.retryCount)`
3. Create chrome.alarms alarm with name `retry-${queueItem.id}`
4. Convert milliseconds to minutes for chrome.alarms.create
5. Handle short delays (<1 minute) with delayInMinutes = 0 (immediate)
6. Add error handling for alarm creation failures
7. Log retry scheduling at debug level

**Done When:**
- Method implemented with chrome.alarms integration
- Alarm naming convention followed
- Error handling added
- Debug logging added

**Verify:**
- Write unit test with mocked chrome.alarms
- Verify alarm created with correct delay
- Verify alarm name format

**Evidence to Record:**
- Unit test results
- Debug log output

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/unit/retry-scheduler.test.ts`

---

### T4: Implement Retry Processing
**Goal:** Implement method to process retry attempts when alarms trigger

**Steps:**
1. Add `processRetry(queueItemId: string): Promise<void>` method
2. Get queue item from QueueManager
3. Check if item exists and status is "queued"
4. Check retry count against MAX_RETRY_ATTEMPTS
5. If retry count >= 10:
   - Mark item as failed with error message
   - Log failure at error level
   - Return early
6. Update item status to "sending"
7. Increment retry count
8. Attempt to send capture via AnytypeApiClient
9. On success:
   - Mark item as sent
   - Clear retry alarm
   - Log success at debug level
10. On failure:
    - Store sanitized error message
    - Schedule next retry
    - Log failure at debug level
11. Add comprehensive error handling

**Done When:**
- Method implemented with full retry logic
- Retry limit enforced
- Error messages sanitized
- Success and failure paths handled
- Logging added

**Verify:**
- Write integration test in `tests/integration/retry-flow.test.ts`
- Test successful retry after failure
- Test retry count increment
- Test max retry limit enforcement
- Test error message storage

**Evidence to Record:**
- Integration test results
- Retry count tracking verified
- Max retry limit enforced

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/integration/retry-flow.test.ts` (new)

---

### T5: Implement Error Message Sanitization
**Goal:** Implement method to sanitize error messages before storage

**Steps:**
1. Add `sanitizeErrorMessage(error: any): string` method
2. Remove API keys (patterns: /api[_-]?key[=:]\s*[\w-]+/gi)
3. Remove tokens (patterns: /token[=:]\s*[\w-]+/gi, /bearer\s+[\w-]+/gi)
4. Remove PII (email patterns, phone patterns)
5. Truncate to max 500 characters
6. Return sanitized message
7. Add unit tests for sanitization patterns

**Done When:**
- Method implemented with regex patterns
- All sensitive data patterns removed
- Message truncated to reasonable length
- Unit tests pass

**Verify:**
- Write unit tests with sample error messages containing sensitive data
- Verify sensitive data removed
- Verify message remains readable

**Evidence to Record:**
- Unit test results showing sanitization works

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/unit/retry-scheduler.test.ts`

---

### T6: Implement Manual Retry
**Goal:** Implement method to manually retry a failed queue item

**Steps:**
1. Add `manualRetry(queueItemId: string): Promise<void>` method
2. Get queue item from QueueManager
3. Reset retry count to 0
4. Update status to "queued"
5. Clear any existing retry alarm
6. Schedule immediate retry (0 delay)
7. Log manual retry at debug level
8. Add error handling for item not found

**Done When:**
- Method implemented
- Retry count reset
- Status updated
- Immediate retry scheduled
- Error handling added

**Verify:**
- Write integration test
- Create failed item, call manualRetry
- Verify retry count reset to 0
- Verify status updated to "queued"
- Verify retry scheduled

**Evidence to Record:**
- Integration test results
- Manual retry functionality verified

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/integration/retry-flow.test.ts`

---

### T7: Implement Delete Failed Item
**Goal:** Implement method to delete a failed queue item

**Steps:**
1. Add `deleteFailed(queueItemId: string): Promise<void>` method
2. Clear any existing retry alarm
3. Delete item from queue via QueueManager.delete()
4. Log deletion at debug level
5. Add error handling

**Done When:**
- Method implemented
- Retry alarm cleared
- Item deleted from queue
- Logging added

**Verify:**
- Write integration test
- Create failed item, call deleteFailed
- Verify item removed from queue
- Verify alarm cleared

**Evidence to Record:**
- Integration test results
- Delete functionality verified

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `tests/integration/retry-flow.test.ts`

---

## Service Worker Integration

### T8: Register Alarm Listener
**Goal:** Register chrome.alarms.onAlarm listener in service worker

**Steps:**
1. Open `src/background/service-worker.ts`
2. Import RetryScheduler
3. Add chrome.alarms.onAlarm.addListener callback
4. Parse alarm name to extract queue item ID
5. Call RetryScheduler.processRetry(queueItemId)
6. Add error handling for alarm processing
7. Log alarm trigger at debug level

**Done When:**
- Alarm listener registered
- Alarm name parsed correctly
- RetryScheduler.processRetry called
- Error handling added

**Verify:**
- Write integration test
- Create alarm, trigger it
- Verify processRetry called

**Evidence to Record:**
- Integration test results
- Alarm listener registered

**Files Touched:**
- `src/background/service-worker.ts`

---

### T9: Implement Retry Resumption on Startup
**Goal:** Resume retry processing on service worker startup

**Steps:**
1. Add `resumeRetries(): Promise<void>` method to RetryScheduler
2. Get all pending queue items from QueueManager
3. For each pending item:
   - Check retry count
   - If < MAX_RETRY_ATTEMPTS, schedule retry
   - If >= MAX_RETRY_ATTEMPTS, mark as failed
4. Log resumption at debug level
5. Call resumeRetries() in service worker startup
6. Add error handling

**Done When:**
- Method implemented
- Pending items detected
- Retries scheduled on startup
- Called from service worker startup

**Verify:**
- Write integration test
- Create pending items
- Simulate service worker restart
- Verify retries scheduled

**Evidence to Record:**
- Integration test results
- Retry resumption verified

**Files Touched:**
- `src/background/retry-scheduler.ts`
- `src/background/service-worker.ts`
- `tests/integration/retry-flow.test.ts`

---

## Tests

### T10: Write Unit Tests for RetryScheduler
**Goal:** Complete unit test coverage for RetryScheduler

**Steps:**
1. Create `tests/unit/retry-scheduler.test.ts`
2. Mock chrome.alarms API
3. Mock QueueManager
4. Mock AnytypeApiClient
5. Test calculateBackoff for attempts 1-10
6. Test scheduleRetry creates alarm with correct delay
7. Test error message sanitization
8. Test retry limit enforcement
9. Achieve >80% code coverage

**Done When:**
- All unit tests written
- All tests pass
- Code coverage >80%

**Verify:**
- Run `npm test -- retry-scheduler.test.ts`
- Verify all tests pass
- Check coverage report

**Evidence to Record:**
- Test results
- Coverage percentage

**Files Touched:**
- `tests/unit/retry-scheduler.test.ts`

---

### T11: Write Integration Tests for Retry Flow
**Goal:** Complete integration test coverage for retry flow

**Steps:**
1. Create `tests/integration/retry-flow.test.ts`
2. Use real QueueManager with mocked storage
3. Mock chrome.alarms API
4. Mock AnytypeApiClient
5. Test successful retry after API failure
6. Test retry count increments after each failure
7. Test item marked as failed after max attempts
8. Test retry processing resumes after service worker restart
9. Test manual retry resets retry count
10. Test delete failed item

**Done When:**
- All integration tests written
- All tests pass
- All acceptance criteria covered

**Verify:**
- Run `npm test:integration -- retry-flow.test.ts`
- Verify all tests pass

**Evidence to Record:**
- Test results
- All ACs verified

**Files Touched:**
- `tests/integration/retry-flow.test.ts`

---

## Verification

### T12: Manual Verification - Automatic Retry
**Goal:** Manually verify automatic retry after API becomes available

**Steps:**
1. Close Anytype Desktop
2. Capture a bookmark in browser extension
3. Verify popup shows "Saved offline!" message
4. Open Anytype Desktop
5. Wait for automatic retry (1-5 seconds)
6. Verify bookmark appears in Anytype
7. Verify popup shows success notification

**Done When:**
- Bookmark automatically syncs when Anytype becomes available
- Success notification shown

**Verify:**
- Manual testing on Linux/Brave

**Evidence to Record:**
- Screenshot of success notification
- Bookmark verified in Anytype

**Files Touched:**
- None (manual verification)

---

### T13: Manual Verification - Failed Item After Max Retries
**Goal:** Manually verify item marked as failed after max retries

**Steps:**
1. Keep Anytype Desktop closed
2. Capture a bookmark in browser extension
3. Wait for 10 retry attempts (may take several minutes)
4. Open popup and check queue status
5. Verify item marked as "failed" with error message

**Done When:**
- Item marked as failed after 10 attempts
- Error message displayed in popup

**Verify:**
- Manual testing on Linux/Brave

**Evidence to Record:**
- Screenshot of failed item in popup
- Error message text

**Files Touched:**
- None (manual verification)

**Note:** Popup UI for queue status is implemented in Epic 5.3, but the underlying failed status is set in this epic.

---

### T14: Manual Verification - Manual Retry
**Goal:** Manually verify manual retry functionality

**Steps:**
1. Follow T13 to create a failed item
2. Open Anytype Desktop
3. Open popup and find the failed item
4. Click "Retry" button
5. Verify item status changes to "queued"
6. Verify item successfully syncs to Anytype

**Done When:**
- Manual retry succeeds after Anytype is available
- Item syncs to Anytype

**Verify:**
- Manual testing on Linux/Brave

**Evidence to Record:**
- Screenshot of retry button click
- Bookmark verified in Anytype

**Files Touched:**
- None (manual verification)

**Note:** Retry button UI is implemented in Epic 5.3, but the underlying manualRetry method is implemented in this epic.

---

## Tracking

### T15: Update SPECS.md
**Goal:** Update SPECS.md with Epic 5.1 status

**Steps:**
1. Open `SPECS.md`
2. Find Epic 5.1 row in BP4 table
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Add Evidence link to `specs/051-retry-logic/spec.md#evidence`
6. Add latest commit hash (placeholder: `{COMMIT_HASH}`)
7. Commit changes

**Done When:**
- SPECS.md updated
- Changes committed

**Verify:**
- Review SPECS.md diff
- Verify Epic 5.1 marked as Done

**Evidence to Record:**
- Commit hash
- SPECS.md updated

**Files Touched:**
- `SPECS.md`

---

### T16: Update SPEC.md with Evidence
**Goal:** Update SPEC.md entrypoint to point to Epic 5.1

**Steps:**
1. Open `SPEC.md`
2. Update "Current Focus" section
3. Update "Active Specification" section:
   - Epic: 5.1
   - Name: Retry Logic with Backoff
   - Status: Done
   - Spec Path: specs/051-retry-logic/spec.md
4. Update Quick Links to point to Epic 5.1 files
5. Commit changes

**Done When:**
- SPEC.md updated
- Changes committed

**Verify:**
- Review SPEC.md diff
- Verify links work

**Evidence to Record:**
- Commit hash
- SPEC.md updated

**Files Touched:**
- `SPEC.md`

---

### T17: Consolidate Evidence in spec.md
**Goal:** Update spec.md with final evidence summary

**Steps:**
1. Open `specs/051-retry-logic/spec.md`
2. Update ## EVIDENCE section with:
   - AC-R1: Unit test results for backoff calculation
   - AC-R2: Integration test results for max retry limit
   - AC-R3: Integration test results for retry count tracking
   - AC-R4: Unit test results for error sanitization
   - AC-R5: Integration test results for alarm scheduling
   - AC-R6: Integration test results for manual retry
   - AC-R7: Integration test results for delete failed item
   - AC-R8: Integration test results for retry processing
   - AC-R9: Integration test results for alarm listener
   - AC-R10: Integration test results for retry resumption
3. Add manual verification evidence
4. Add commit hash
5. Commit changes

**Done When:**
- All ACs have evidence entries
- Manual verification documented
- Commit hash added

**Verify:**
- Review spec.md EVIDENCE section
- Verify all ACs covered

**Evidence to Record:**
- Final commit hash
- Evidence section complete

**Files Touched:**
- `specs/051-retry-logic/spec.md`

---

**End of Tasks**
