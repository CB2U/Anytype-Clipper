# Implementation Plan: Retry Logic with Backoff

## Architecture Overview

### Key Components and Responsibilities

1. **RetryScheduler** (`src/background/retry-scheduler.ts`)
   - Calculates exponential backoff delays
   - Schedules retry attempts using chrome.alarms API
   - Manages retry attempt limits
   - Processes retry attempts when alarms trigger

2. **QueueManager** (existing, `src/background/queue-manager.ts`)
   - Extended to support retry count tracking
   - Already has methods for status updates and error storage
   - Provides queue item retrieval for retry processing

3. **Service Worker** (existing, `src/background/service-worker.ts`)
   - Registers chrome.alarms.onAlarm listener
   - Initializes retry processing on startup
   - Delegates retry processing to RetryScheduler

### Module Boundaries

```
Service Worker
    ├── RetryScheduler (new)
    │   ├── calculateBackoff()
    │   ├── scheduleRetry()
    │   ├── processRetry()
    │   └── resumeRetries()
    ├── QueueManager (existing)
    │   ├── getNext()
    │   ├── updateStatus()
    │   ├── markSent()
    │   └── markFailed()
    └── AnytypeApiClient (existing)
        └── createObject()
```

### Call Flow

1. **Capture Fails → Queue Item Created**
   - Capture service detects API failure
   - QueueManager.add() creates queue item with retryCount=0
   - RetryScheduler.scheduleRetry() schedules first retry (1s delay)

2. **Retry Alarm Triggers**
   - chrome.alarms.onAlarm fires
   - Service worker calls RetryScheduler.processRetry()
   - RetryScheduler gets next queued item from QueueManager
   - Checks retry count against max attempts (10)
   - Attempts to send via AnytypeApiClient
   - On success: QueueManager.markSent()
   - On failure: increment retry count, schedule next retry or mark failed

3. **Service Worker Startup**
   - Service worker initializes
   - RetryScheduler.resumeRetries() checks for pending queue items
   - Schedules retry for any queued items

### Alternatives Considered

**Alternative 1: Use setTimeout instead of chrome.alarms**
- **Pros:** More precise timing for short intervals
- **Cons:** Does not survive service worker termination
- **Decision:** Use chrome.alarms for reliability, accept timing imprecision

**Alternative 2: Configurable retry intervals**
- **Pros:** User flexibility
- **Cons:** Adds complexity, most users won't need it
- **Decision:** Defer to post-MVP (Epic 7.2)

**Alternative 3: Retry all pending items on startup**
- **Pros:** Simpler implementation
- **Cons:** May overwhelm API with retry storm
- **Decision:** Use exponential backoff to spread out retries

---

## Data Contracts

### QueueItem (existing, extended)

```typescript
interface QueueItem {
  id: string;
  type: 'bookmark' | 'highlight' | 'article';
  payload: CapturePayload;
  status: QueueStatus;
  retryCount: number; // Already exists
  error?: string; // Already exists
  timestamps: {
    created: number;
    lastAttempt: number;
    completed?: number;
  };
}
```

**Note:** QueueItem schema already includes `retryCount` and `error` fields from Epic 5.0.

### RetryAlarm

```typescript
interface RetryAlarm {
  name: string; // Format: "retry-{queueItemId}"
  scheduledTime: number;
}
```

---

## Storage and Persistence

No new storage required. Retry logic uses existing queue storage from Epic 5.0.

**Existing Storage:**
- Queue items in `chrome.storage.local` (via StorageManager)
- Retry count and error message already part of QueueItem schema

**chrome.alarms:**
- Alarms are persisted by Chrome and survive service worker termination
- Alarm names follow format: `retry-{queueItemId}`

---

## External Integrations

### chrome.alarms API

**Methods Used:**
- `chrome.alarms.create(name, alarmInfo)` - Schedule retry alarm
- `chrome.alarms.clear(name)` - Cancel retry alarm (on success or delete)
- `chrome.alarms.onAlarm.addListener(callback)` - Listen for alarm triggers

**Alarm Precision:**
- Minimum delay: 1 minute for unpacked extensions, 1 second for packed
- Short intervals (1s, 5s, 30s) may have imprecision
- Acceptable for retry logic (exact timing not critical)

---

## UX and Operational States

### Queue Item States (existing)

- **queued:** Item waiting for retry
- **sending:** Item currently being sent (set during retry attempt)
- **sent:** Item successfully sent
- **failed:** Item failed after max retry attempts

### Retry States (operational, not persisted)

- **Scheduled:** Retry alarm created, waiting for trigger
- **Processing:** Retry attempt in progress
- **Succeeded:** Retry succeeded, item marked as sent
- **Failed:** Retry failed, next retry scheduled or item marked as failed

---

## Testing Plan

### Unit Tests

**File:** `tests/unit/retry-scheduler.test.ts` (new)

**Test Cases:**
1. `calculateBackoff()` returns correct delays for attempts 1-10
   - Attempt 1: 1s
   - Attempt 2: 5s
   - Attempt 3: 30s
   - Attempt 4+: 300s (5m)

2. `scheduleRetry()` creates alarm with correct delay
   - Mock chrome.alarms.create
   - Verify alarm name format: `retry-{id}`
   - Verify delay matches backoff calculation

3. Retry limit enforcement
   - Verify item marked as failed after 10 attempts
   - Verify no 11th retry scheduled

4. Error message sanitization
   - Verify API keys removed from error messages
   - Verify tokens removed from error messages

**Run Command:** `npm test -- retry-scheduler.test.ts`

---

### Integration Tests

**File:** `tests/integration/retry-flow.test.ts` (new)

**Test Cases:**
1. Successful retry after API failure
   - Queue item with retryCount=0
   - Mock API failure, then success
   - Verify retry scheduled
   - Trigger alarm
   - Verify item marked as sent

2. Retry count increments after each failure
   - Queue item with retryCount=0
   - Mock API failure 3 times
   - Trigger alarms
   - Verify retryCount increments to 3

3. Item marked as failed after max attempts
   - Queue item with retryCount=0
   - Mock API failure 10 times
   - Trigger alarms
   - Verify item marked as failed
   - Verify error message stored
   - Verify no 11th alarm scheduled

4. Retry processing resumes after service worker restart
   - Queue item with retryCount=2
   - Simulate service worker restart
   - Verify retry scheduled on startup

5. Manual retry resets retry count
   - Queue item with retryCount=5, status=failed
   - Call manualRetry()
   - Verify retryCount reset to 0
   - Verify status set to queued
   - Verify retry scheduled

**Run Command:** `npm test -- retry-flow.test.ts`

---

### Manual Verification

**Test Case 1: Automatic Retry After API Becomes Available**

**Steps:**
1. Close Anytype Desktop
2. Capture a bookmark in the browser extension
3. Verify popup shows "Saved offline!" message
4. Open Anytype Desktop
5. Wait for automatic retry (should happen within 1-5 seconds)
6. Verify bookmark appears in Anytype
7. Verify popup shows success notification

**Expected Result:** Bookmark automatically syncs when Anytype becomes available

---

**Test Case 2: Failed Item After Max Retries**

**Steps:**
1. Keep Anytype Desktop closed
2. Capture a bookmark in the browser extension
3. Wait for 10 retry attempts (may take several minutes due to exponential backoff)
4. Open popup and check queue status
5. Verify item marked as "failed" with error message

**Expected Result:** Item marked as failed after 10 attempts, error message displayed

---

**Test Case 3: Manual Retry**

**Steps:**
1. Follow Test Case 2 to create a failed item
2. Open Anytype Desktop
3. Open popup and find the failed item
4. Click "Retry" button (Epic 5.3 UI)
5. Verify item status changes to "queued"
6. Verify item successfully syncs to Anytype

**Expected Result:** Manual retry succeeds after Anytype is available

**Note:** Manual retry UI is implemented in Epic 5.3, but the underlying method is implemented in this epic.

---

## AC Verification Mapping

| AC | Verification Method | Test Location |
|----|---------------------|---------------|
| AC-R1 | Unit test | `retry-scheduler.test.ts` |
| AC-R2 | Integration test | `retry-flow.test.ts` |
| AC-R3 | Integration test | `retry-flow.test.ts` |
| AC-R4 | Unit test + Integration test | `retry-scheduler.test.ts`, `retry-flow.test.ts` |
| AC-R5 | Integration test | `retry-flow.test.ts` |
| AC-R6 | Integration test + Manual test | `retry-flow.test.ts`, Manual Test Case 3 |
| AC-R7 | Integration test | `retry-flow.test.ts` |
| AC-R8 | Integration test | `retry-flow.test.ts` |
| AC-R9 | Integration test | `retry-flow.test.ts` |
| AC-R10 | Integration test + Manual test | `retry-flow.test.ts`, Manual Test Case 1 |

---

## Risks and Mitigations

### Risk 1: chrome.alarms Precision
**Mitigation:**
- Accept timing imprecision for short intervals
- Test with actual alarms to measure precision
- Document precision limitations in code comments

### Risk 2: Service Worker Termination During Retry
**Mitigation:**
- Implement in Epic 5.2 (Health Check & Recovery)
- On startup, reset "sending" items to "queued"
- Retry logic will re-attempt queued items

### Risk 3: Retry Storm
**Mitigation:**
- Sequential processing (Epic 5.0) ensures one item at a time
- Exponential backoff spreads out retries
- Test with large queue (100+ items)

---

## Rollout and Migration Notes

### Migration

No data migration required. Existing queue items from Epic 5.0 already have `retryCount` and `error` fields.

### Rollout

1. Deploy RetryScheduler with service worker update
2. On service worker startup, resume retries for pending items
3. No user action required

### Backwards Compatibility

Fully backwards compatible. Existing queue items will work with retry logic.

---

## Observability and Debugging

### What Can Be Logged

- Retry attempt number
- Retry delay calculated
- Alarm creation/trigger events
- Queue item ID (UUID)
- Queue item type (bookmark/highlight/article)
- Queue item status transitions
- Sanitized error messages (no API keys, tokens, PII)

### What Must Never Be Logged

- API keys
- Authentication tokens
- Full capture content
- User PII (names, emails, etc.)
- Unsanitized error messages

### Debug Log Format

```
[RetryScheduler] Scheduling retry for item {id} (attempt {retryCount}/{maxAttempts}, delay: {delay}ms)
[RetryScheduler] Processing retry for item {id} (attempt {retryCount}/{maxAttempts})
[RetryScheduler] Retry succeeded for item {id}
[RetryScheduler] Retry failed for item {id}: {sanitizedError}
[RetryScheduler] Item {id} marked as failed after {maxAttempts} attempts
```

---

**End of Implementation Plan**
