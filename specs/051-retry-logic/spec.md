# Specification: Retry Logic with Backoff

## Header

- **Title:** Retry Logic with Backoff
- **Roadmap Anchor:** [roadmap.md 5.1](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L562-L586)
- **Priority:** P0
- **Type:** Feature
- **Target Area:** Reliability and offline queue
- **Target Acceptance Criteria:** FR6.3, FR6.5, NFR2.3, REL-4, REL-7

---

## Problem Statement

The offline queue system (Epic 5.0) successfully persists captures when Anytype is unavailable, but currently lacks automatic retry logic. Queued items remain in the "queued" status indefinitely until manually retried or until the service worker is restarted and attempts to process them.

Users need intelligent retry logic that:
- Automatically retries failed captures when Anytype becomes available
- Uses exponential backoff to avoid overwhelming the API
- Prevents infinite retry loops with a maximum attempt limit
- Tracks retry attempts per queue item
- Stores error messages for debugging
- Allows manual retry and deletion of failed items

Without automatic retry logic, users must manually monitor the queue and retry failed captures, defeating the purpose of seamless offline support.

---

## Goals and Non-Goals

### Goals

- Implement exponential backoff retry scheduler with intervals: 1s, 5s, 30s, 5m
- Enforce maximum 10 retry attempts per queue item
- Track retry count per queue item
- Store error messages for failed items
- Provide manual retry capability for failed items
- Provide delete capability for failed items
- Prevent infinite retry loops
- Integrate with chrome.alarms API for background retry scheduling
- Resume retry processing after service worker termination

### Non-Goals

- Queue UI components (badge counter, status display) (covered in Epic 5.3)
- Health check ping before requests (covered in Epic 5.2)
- Real-time queue status notifications (covered in Epic 5.3)
- Queue export/import functionality (post-MVP)
- Configurable retry intervals (post-MVP, Epic 7.2)
- Retry statistics and analytics (post-MVP)

---

## User Stories

### US3 (Partial): Build Offline Queue During Research Session

**As a** power user doing deep research with intermittent internet,  
**I want to** have my queued captures automatically retry when Anytype becomes available,  
**So that** I don't have to manually monitor and retry failed captures.

**Acceptance:**
- When Anytype reopens, extension auto-retries queued items with exponential backoff
- Queue processes in background without blocking new captures
- User sees success notifications as queued items complete
- Failed items (after max retries) are marked with error messages
- User can manually retry or delete failed items

**Note:** This epic (5.1) implements the automatic retry logic. Queue UI elements are covered in Epic 5.3.

---

## Scope

### In-Scope

- RetryScheduler class for managing retry timing
- Exponential backoff calculation (1s, 5s, 30s, 5m)
- Integration with chrome.alarms API for background scheduling
- Retry attempt tracking per queue item
- Maximum retry limit enforcement (10 attempts)
- Error message storage for failed items
- Manual retry method for failed items
- Delete method for failed items
- Service worker alarm listener for retry processing
- Integration with QueueManager for status updates
- Unit tests for RetryScheduler
- Integration tests for retry flow

### Out-of-Scope

- Queue UI components (Epic 5.3)
- Health check implementation (Epic 5.2)
- Queue status notifications (Epic 5.3)
- Configurable retry intervals (post-MVP)
- Retry statistics tracking (post-MVP)
- Debug log integration (Epic 10.6)

---

## Requirements

### Functional Requirements

#### FR-R1: Exponential Backoff Intervals
- **Description:** Implement exponential backoff with intervals: 1s, 5s, 30s, 5m (300s)
- **Priority:** P0
- **Rationale:** Prevents API overload and respects server recovery time
- **Dependencies:** None

#### FR-R2: Maximum Retry Attempts
- **Description:** Enforce maximum 10 retry attempts per queue item
- **Priority:** P0
- **Rationale:** Prevents infinite retry loops and resource exhaustion
- **Dependencies:** FR-R1

#### FR-R3: Retry Count Tracking
- **Description:** Track retry count per queue item in `retryCount` field
- **Priority:** P0
- **Rationale:** Enables retry limit enforcement and debugging
- **Dependencies:** Epic 5.0 (QueueItem schema)

#### FR-R4: Error Message Storage
- **Description:** Store sanitized error messages in queue item `error` field when retry fails
- **Priority:** P1
- **Rationale:** Enables debugging and user feedback
- **Dependencies:** Epic 5.0 (QueueItem schema)

#### FR-R5: Automatic Retry Scheduling
- **Description:** Use chrome.alarms API to schedule retry attempts in background
- **Priority:** P0
- **Rationale:** Enables retry processing even when popup is closed
- **Dependencies:** FR-R1

#### FR-R6: Manual Retry
- **Description:** Provide method to manually retry a failed queue item, resetting retry count
- **Priority:** P1
- **Rationale:** Allows user to retry after fixing issues (e.g., restarting Anytype)
- **Dependencies:** FR-R2, FR-R3

#### FR-R7: Delete Failed Items
- **Description:** Provide method to delete failed queue items
- **Priority:** P1
- **Rationale:** Allows user to clean up queue after giving up on failed captures
- **Dependencies:** Epic 5.0 (QueueManager.delete)

#### FR-R8: Retry Processing
- **Description:** Process retry attempts by:
  1. Getting next queued item from QueueManager
  2. Checking retry count against max attempts
  3. Attempting to send capture via API client
  4. On success: mark as sent
  5. On failure: increment retry count, schedule next retry, or mark as failed if max attempts reached
- **Priority:** P0
- **Rationale:** Core retry logic
- **Dependencies:** FR-R1, FR-R2, FR-R3, Epic 5.0

#### FR-R9: Service Worker Alarm Listener
- **Description:** Register chrome.alarms.onAlarm listener in service worker to process retries
- **Priority:** P0
- **Rationale:** Enables background retry processing
- **Dependencies:** FR-R5

#### FR-R10: Retry Resumption After Termination
- **Description:** On service worker startup, check for pending queue items and schedule retry if needed
- **Priority:** P0
- **Rationale:** Ensures retry processing resumes after service worker termination
- **Dependencies:** FR-R5, FR-R8

### Non-Functional Requirements

#### NFR-R1: Reliability
- **Description:** Retry logic must be reliable:
  - No infinite retry loops
  - Retry count accurately tracked
  - Failed items marked after max attempts
  - Retry scheduling survives service worker termination
- **Priority:** P0
- **Rationale:** Critical for offline queue reliability
- **Measurement:** Integration tests
- **Dependencies:** FR-R2, FR-R3, FR-R10

#### NFR-R2: Performance
- **Description:** Retry processing must not block UI or new captures
- **Priority:** P1
- **Rationale:** Maintains responsive user experience
- **Measurement:** Manual testing
- **Dependencies:** FR-R8

#### NFR-R3: Observability
- **Description:** Retry operations must be observable:
  - Log retry attempts at debug level
  - Log errors at error level
  - Track retry count in queue item
- **Priority:** P1
- **Rationale:** Enables debugging and monitoring
- **Measurement:** Debug logs
- **Dependencies:** FR-R3, FR-R4

#### NFR-R4: Testability
- **Description:** Retry logic must be testable:
  - Unit tests for backoff calculation
  - Unit tests for retry limit enforcement
  - Integration tests for retry flow
  - Mock chrome.alarms for testing
- **Priority:** P1
- **Rationale:** High test coverage ensures reliability
- **Measurement:** Code coverage >80%
- **Dependencies:** None

### Constraints Checklist

- ✅ **Security:** No external API calls, all processing local
- ✅ **Privacy:** No sensitive data logged (sanitize error messages)
- ✅ **Offline Behavior:** Retry logic works offline, schedules retries for when online
- ✅ **Performance:** Retry processing does not block UI
- ✅ **Observability:** Log retry attempts and errors at appropriate levels

---

## Acceptance Criteria

### AC-R1: Exponential Backoff Intervals
**Criteria:**
- First retry attempt after 1 second
- Second retry attempt after 5 seconds
- Third retry attempt after 30 seconds
- Fourth retry attempt after 5 minutes (300 seconds)
- Fifth and subsequent retries after 5 minutes (300 seconds)
- Backoff calculation is accurate

**Verification Approach:**
- Unit test: Verify backoff calculation for attempts 1-10
- Integration test: Verify actual retry timing (with tolerance for alarm precision)

---

### AC-R2: Maximum Retry Attempts Enforced
**Criteria:**
- Queue item is marked as "failed" after 10 retry attempts
- No 11th retry attempt is scheduled
- Error message is stored in queue item
- Failed item remains in queue for user review

**Verification Approach:**
- Integration test: Queue item with failing API, verify max 10 attempts, verify marked as failed
- Unit test: Verify retry limit logic

---

### AC-R3: Retry Count Tracking
**Criteria:**
- Retry count starts at 0 for new queue items
- Retry count increments after each failed attempt
- Retry count is persisted to storage
- Retry count is reset on manual retry

**Verification Approach:**
- Integration test: Verify retry count increments after each attempt
- Integration test: Verify retry count persists across service worker restart
- Unit test: Verify manual retry resets count

---

### AC-R4: Error Message Storage
**Criteria:**
- Error messages are stored in queue item `error` field
- Error messages are sanitized (no API keys, tokens, PII)
- Error messages are human-readable
- Error messages persist to storage

**Verification Approach:**
- Integration test: Trigger API error, verify error message stored
- Unit test: Verify error message sanitization

---

### AC-R5: Automatic Retry Scheduling
**Criteria:**
- Retry alarm is created after failed attempt
- Retry alarm uses correct delay based on retry count
- Retry alarm survives service worker termination
- Retry processing resumes on alarm trigger

**Verification Approach:**
- Integration test: Verify alarm created with correct delay
- Integration test: Verify retry processing on alarm trigger
- Manual test: Verify retry processing after service worker termination

---

### AC-R6: Manual Retry
**Criteria:**
- User can manually retry a failed queue item
- Manual retry resets retry count to 0
- Manual retry updates status to "queued"
- Manual retry schedules immediate retry attempt

**Verification Approach:**
- Integration test: Mark item as failed, manually retry, verify retry count reset and status updated
- Manual test: Verify manual retry from popup UI (Epic 5.3)

---

### AC-R7: Delete Failed Items
**Criteria:**
- User can delete a failed queue item
- Deleted item is removed from queue
- Deleted item is removed from storage
- No retry alarm is scheduled for deleted item

**Verification Approach:**
- Integration test: Mark item as failed, delete, verify removed from queue and storage
- Manual test: Verify## Evidence

### Automated Verification
- **Unit Tests**: 13 tests passed covering `RetryScheduler` core logic.
- **Integration Tests**: 3 tests passed covering the end-to-end retry flow and resumption.

```bash
Ran all test suites matching tests/unit/retry-scheduler.test.ts.
Test Suites: 1 passed, 1 total
Tests:       13 passed, 13 total

Ran all test suites matching tests/integration/retry-flow.test.ts.
Test Suites: 1 passed, 1 total
Tests:       3 passed, 3 total
```

### Manual Verification
- Verified alarm creation via `chrome.alarms.getAll`.
- Verified error message sanitization for sensitive fields.
- Verified manual retry reset of count and status.

---

### AC-R8: Retry Processing
**Criteria:**
- Retry processing gets next queued item
- Retry processing checks retry count
- Retry processing attempts to send capture
- On success: marks item as sent
- On failure: increments retry count, schedules next retry or marks as failed

**Verification Approach:**
- Integration test: Mock API success, verify item marked as sent
- Integration test: Mock API failure, verify retry count incremented and next retry scheduled
- Integration test: Mock API failure 10 times, verify item marked as failed

---

### AC-R9: Service Worker Alarm Listener
**Criteria:**
- chrome.alarms.onAlarm listener is registered in service worker
- Listener processes retry attempts
- Listener handles errors gracefully

**Verification Approach:**
- Integration test: Trigger alarm, verify retry processing
- Unit test: Verify alarm listener registration

---

### AC-R10: Retry Resumption After Termination
**Criteria:**
- On service worker startup, pending queue items are detected
- Retry alarm is scheduled for pending items
- Retry processing resumes after service worker termination

**Verification Approach:**
- Integration test: Queue item, terminate service worker, restart, verify retry processing resumes
- Manual test: Queue item, restart browser, verify retry processing resumes

---

## Dependencies

### Epic Dependencies
- **5.0 Offline Queue System:** Provides QueueManager and queue persistence
- **1.1 API Client Foundation:** Provides API client for sending captures
- **1.2 Storage Manager:** Provides storage abstraction

### Technical Dependencies
- **chrome.alarms API:** Background alarm scheduling
- **QueueManager:** Queue operations and status updates
- **AnytypeApiClient:** API calls for sending captures
- **TypeScript:** Type definitions for retry logic

### Data Dependencies
- Queue items from Epic 5.0 (QueueItem schema with retryCount and error fields)

---

## Risks and Mitigations

### Risk 1: chrome.alarms Precision
**Description:** chrome.alarms API has limited precision (minimum 1 minute in some cases), which may affect short retry intervals (1s, 5s, 30s).  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Use chrome.alarms.create with `delayInMinutes` for intervals ≥1 minute
- Use setTimeout for intervals <1 minute (1s, 5s, 30s) with awareness of service worker termination
- Test alarm precision and adjust intervals if needed
- Document alarm precision limitations

---

### Risk 2: Service Worker Termination During Retry
**Description:** Service worker may terminate during retry processing, leaving item in "sending" status.  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- On service worker startup, reset "sending" items to "queued" (Epic 5.2)
- Use atomic operations for small captures (Epic 5.0)
- Retry logic will re-attempt "queued" items
- Test service worker termination scenarios

---

### Risk 3: Retry Storm
**Description:** Many queued items may retry simultaneously after Anytype becomes available, overwhelming the API.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Sequential processing ensures one item at a time (Epic 5.0)
- Exponential backoff spreads out retry attempts
- Health check before requests (Epic 5.2)
- Test with large queue (100+ items)

---

### Risk 4: Infinite Retry Loops
**Description:** Bug in retry logic may cause infinite retry loops.  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Enforce max 10 retry attempts (FR-R2)
- Unit tests verify retry limit enforcement
- Integration tests verify failed items marked after max attempts
- Code review for retry logic

---

### Risk 5: Error Message Leakage
**Description:** Error messages may contain sensitive data (API keys, tokens, PII).  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Sanitize error messages before storage (FR-R4)
- Unit tests verify error message sanitization
- Follow SEC-4 (sanitize error messages before logging)
- Code review for error handling

---

## Open Questions

None. All requirements are clear and aligned with PRD FR6.3, FR6.5, NFR2.3, REL-4, REL-7.

---

## EVIDENCE

*This section will be populated during implementation with verification evidence for each acceptance criterion.*

---

**End of Specification**
