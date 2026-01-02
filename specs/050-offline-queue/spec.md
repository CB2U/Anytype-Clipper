# Specification: Offline Queue System

## Header

- **Title:** Offline Queue System
- **Roadmap Anchor:** [roadmap.md 5.0](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L534-L559)
- **Priority:** P0
- **Type:** Feature
- **Target Area:** Reliability and offline support
- **Target Acceptance Criteria:** AC5, AC8, FR6.1, FR6.2, FR6.4, FR6.6, FR6.9, FR6.10, DATA-1, DATA-3, DATA-4, US3

---

## Problem Statement

When users capture web content (bookmarks, highlights, articles) while Anytype Desktop is not running or the localhost API is unreachable, captures currently fail silently or display errors. This breaks the user's workflow and leads to data loss, especially during research sessions when users may capture multiple items before opening Anytype.

Users need a reliable offline queue system that:
- Persists capture requests when Anytype is unavailable
- Automatically retries when Anytype becomes available
- Survives browser restarts and service worker terminations
- Provides visibility into queue status
- Processes captures sequentially to respect API rate limits

Without an offline queue, the extension is unreliable and frustrating to use, violating the core promise of seamless web content capture.

---

## Goals and Non-Goals

### Goals

- Persist capture requests to `chrome.storage.local` when Anytype API is unreachable
- Track queue item status (queued/sending/sent/failed)
- Ensure queue survives browser restart and service worker termination
- Implement FIFO eviction when queue reaches 1000 item limit
- Process captures sequentially (not parallel) to avoid API overload
- Support atomic operations for captures <2MB
- Provide foundation for retry logic (Epic 5.1) and queue UI (Epic 5.3)

### Non-Goals

- Retry logic with exponential backoff (covered in Epic 5.1)
- Health check ping before requests (covered in Epic 5.2)
- Queue UI and status display (covered in Epic 5.3)
- Checkpoint-based recovery for large articles (post-MVP, Epic 10.2)
- Queue export/import functionality (post-MVP)
- Statistics and analytics (post-MVP)

---

## User Stories

### US3: Build Offline Queue During Research Session

**As a** power user doing deep research with intermittent internet,  
**I want to** capture bookmarks and articles even when Anytype Desktop is closed,  
**So that** I don't lose my workflow momentum and all my captures sync when I return.

**Acceptance:**
- Extension detects Anytype not running (localhost:31009 unreachable)
- Queues all captures in chrome.storage with status "queued"
- Popup shows pending count with badge counter
- Popup displays "Retry All" button and detailed queue status
- When Anytype reopens, extension auto-retries with exponential backoff
- Queue processes in background without blocking new captures
- User sees success notifications as queued items complete
- Queue survives browser restart
- Can export queue as JSON for debugging

**Note:** This epic (5.0) implements the core queue persistence. Retry logic (auto-retry, exponential backoff) is covered in Epic 5.1, and UI elements (badge counter, "Retry All" button) are covered in Epic 5.3.

---

## Scope

### In-Scope

- Queue data structure and TypeScript interfaces
- QueueManager class for queue operations (add, get, update, delete)
- Integration with StorageManager for persistence
- Queue item status tracking (queued, sending, sent, failed)
- FIFO eviction when queue reaches 1000 items
- Sequential processing (process one item at a time)
- Atomic operation support for small captures (<2MB)
- Queue survival across browser restarts
- Queue survival across service worker terminations
- Integration with existing capture flows (bookmark, highlight, article)
- Unit tests for QueueManager
- Integration tests for queue persistence

### Out-of-Scope

- Retry scheduler and exponential backoff (Epic 5.1)
- Health check ping implementation (Epic 5.2)
- Queue UI components (badge counter, status display, manual retry buttons) (Epic 5.3)
- Checkpoint-based recovery for large articles (Epic 10.2)
- Queue export/import functionality (post-MVP)
- Debug log integration (Epic 10.6)
- Queue statistics and analytics (Epic 10.7)

---

## Requirements

### Functional Requirements

#### FR-Q1: Queue Persistence
- **Description:** Persist capture requests to `chrome.storage.local` when Anytype API is unreachable
- **Priority:** P0
- **Rationale:** Core requirement for offline support
- **Dependencies:** Epic 1.2 (Storage Manager)

#### FR-Q2: Queue Item Schema
- **Description:** Define queue item structure with:
  - Unique ID (UUID)
  - Capture type (bookmark, highlight, article)
  - Capture payload (metadata, content)
  - Status (queued, sending, sent, failed)
  - Timestamps (created, lastAttempt, completed)
  - Retry count
  - Error message (if failed)
- **Priority:** P0
- **Rationale:** Structured data enables tracking and retry logic
- **Dependencies:** None

#### FR-Q3: Queue Operations
- **Description:** Implement QueueManager with operations:
  - `add(item)`: Add new item to queue
  - `getNext()`: Get next queued item (FIFO)
  - `updateStatus(id, status)`: Update item status
  - `markSent(id)`: Mark item as successfully sent
  - `markFailed(id, error)`: Mark item as failed with error message
  - `delete(id)`: Remove item from queue
  - `getAll()`: Get all queue items
  - `getPending()`: Get items with status "queued"
  - `clear()`: Clear entire queue
- **Priority:** P0
- **Rationale:** Encapsulates queue logic for reuse
- **Dependencies:** FR-Q1, FR-Q2

#### FR-Q4: FIFO Eviction
- **Description:** When queue reaches 1000 items, evict oldest queued item before adding new item
- **Priority:** P1
- **Rationale:** Prevents unbounded storage growth (NFR3.1 quota management)
- **Dependencies:** FR-Q3

#### FR-Q5: Sequential Processing
- **Description:** Process queue items one at a time (not parallel) to respect API limits
- **Priority:** P0
- **Rationale:** Prevents API overload and rate limiting
- **Dependencies:** FR-Q3

#### FR-Q6: Atomic Operations
- **Description:** Treat captures <2MB as atomic (all-or-nothing) operations
- **Priority:** P0
- **Rationale:** Small captures can complete quickly without checkpointing
- **Dependencies:** FR-Q3

#### FR-Q7: Queue Survival - Browser Restart
- **Description:** Queue must persist across browser restarts
- **Priority:** P0
- **Rationale:** Users may close browser while captures are queued
- **Dependencies:** FR-Q1 (chrome.storage.local persists across restarts)

#### FR-Q8: Queue Survival - Service Worker Termination
- **Description:** Queue must persist across service worker terminations
- **Priority:** P0
- **Rationale:** Service workers terminate after inactivity (Manifest V3)
- **Dependencies:** FR-Q1 (chrome.storage.local persists across terminations)

#### FR-Q9: Integration with Capture Flows
- **Description:** Integrate queue with existing capture flows:
  - Bookmark capture (Epic 3.0)
  - Highlight capture (Epic 3.1)
  - Article capture (Epic 4.0)
- **Priority:** P0
- **Rationale:** Queue must work with all capture types
- **Dependencies:** Epic 3.0, Epic 3.1, Epic 4.0

#### FR-Q10: Error Handling
- **Description:** Handle queue errors gracefully:
  - Storage quota exceeded → Evict oldest items
  - Invalid queue item → Log error and skip
  - Serialization errors → Log error and skip
- **Priority:** P1
- **Rationale:** Robust error handling prevents queue corruption
- **Dependencies:** FR-Q3

### Non-Functional Requirements

#### NFR-Q1: Performance
- **Description:** Queue operations must complete within performance budgets:
  - Add item: <50ms
  - Get next item: <20ms
  - Update status: <30ms
  - Get all items: <100ms
- **Priority:** P1
- **Rationale:** Queue operations should not block UI or capture flows
- **Measurement:** Unit test benchmarks
- **Dependencies:** None

#### NFR-Q2: Storage Efficiency
- **Description:** Queue items must be stored efficiently:
  - Use JSON serialization
  - Compress large payloads if >100KB
  - Limit queue to 1000 items (FIFO eviction)
- **Priority:** P1
- **Rationale:** chrome.storage.local has quota limits (NFR3.1)
- **Measurement:** Storage quota monitoring
- **Dependencies:** FR-Q4

#### NFR-Q3: Reliability
- **Description:** Queue must be reliable:
  - No data loss during browser restart
  - No data loss during service worker termination
  - No queue corruption from concurrent access
- **Priority:** P0
- **Rationale:** Queue is critical for offline support
- **Measurement:** Integration tests
- **Dependencies:** FR-Q7, FR-Q8

#### NFR-Q4: Testability
- **Description:** Queue must be testable:
  - Unit tests for all QueueManager operations
  - Integration tests for persistence
  - Mock storage for testing
- **Priority:** P1
- **Rationale:** High test coverage ensures reliability
- **Measurement:** Code coverage >80%
- **Dependencies:** None

#### NFR-Q5: Observability
- **Description:** Queue must be observable:
  - Log queue operations at debug level
  - Log errors at error level
  - Track queue size and status counts
- **Priority:** P1
- **Rationale:** Enables debugging and monitoring
- **Measurement:** Debug logs
- **Dependencies:** None

### Constraints Checklist

- ✅ **Security:** No external API calls, all processing local
- ✅ **Privacy:** No queue data logged (only metadata like count, status)
- ✅ **Offline Behavior:** Fully offline, queue persists locally
- ✅ **Performance:** Queue operations <100ms, no blocking
- ✅ **Observability:** Log queue operations at debug level

---

## Acceptance Criteria

### AC5: Extension Queues Captures When Anytype Is Not Running
**Source:** PRD AC5

**Criteria:**
1. Extension detects Anytype not running (localhost:31009 unreachable)
2. Captures are queued in chrome.storage with status "queued"
3. Popup shows pending count with badge counter
4. Popup displays "Retry All" button and detailed queue status
5. When Anytype reopens, extension auto-retries with exponential backoff
6. Queue processes in background without blocking new captures
7. User sees success notifications as queued items complete
8. Queue survives browser restart

**Verification Approach:**
- **Manual Test:** Close Anytype, capture content, verify queued status in popup, restart Anytype, verify auto-retry succeeds
- **Integration Test:** Mock API unavailable, add items to queue, verify persistence, mock API available, verify processing

**Note:** This epic (5.0) verifies criteria 1-2 and 8. Criteria 3-7 are verified in Epic 5.1 (retry logic) and Epic 5.3 (queue UI).

---

### AC8: Queue Survives Browser Restart and Service Worker Termination
**Source:** PRD AC8

**Criteria:**
1. Queue items persist across browser restart
2. Queue items persist across service worker termination
3. Queue processing resumes after restart/termination
4. No data loss during restart/termination

**Verification Approach:**
- **Manual Test:** Queue items, restart browser, verify queue intact and processing resumes
- **Integration Test:** Add items to queue, simulate service worker termination, verify queue intact

---

### AC-Q1: Queue Item Schema
**Criteria:**
- Queue item includes all required fields (ID, type, payload, status, timestamps, retry count, error)
- Queue item serializes to JSON without data loss
- Queue item deserializes from JSON correctly
- Invalid queue items are rejected

**Verification Approach:**
- Unit test: Create queue item, serialize, deserialize, verify equality
- Unit test: Attempt to create invalid queue item, verify rejection

---

### AC-Q2: Queue Operations
**Criteria:**
- `add()` adds item to queue and persists to storage
- `getNext()` returns oldest queued item (FIFO)
- `updateStatus()` updates item status and persists
- `markSent()` marks item as sent and persists
- `markFailed()` marks item as failed with error message and persists
- `delete()` removes item from queue and storage
- `getAll()` returns all queue items
- `getPending()` returns only queued items
- `clear()` removes all items from queue and storage

**Verification Approach:**
- Unit test: Test each operation individually
- Integration test: Test operations with real storage

---

### AC-Q3: FIFO Eviction
**Criteria:**
- When queue reaches 1000 items, oldest queued item is evicted
- Eviction happens before adding new item
- Sent and failed items are not evicted (only queued items)
- Eviction is logged at debug level

**Verification Approach:**
- Unit test: Add 1001 items, verify oldest queued item evicted
- Unit test: Verify sent/failed items not evicted

---

### AC-Q4: Sequential Processing
**Criteria:**
- Queue processes one item at a time (not parallel)
- Next item is not processed until current item completes
- Processing order is FIFO

**Verification Approach:**
- Integration test: Add multiple items, verify sequential processing
- Integration test: Verify FIFO order

---

### AC-Q5: Queue Persistence
**Criteria:**
- Queue persists to chrome.storage.local
- Queue survives browser restart
- Queue survives service worker termination
- No data loss during persistence

**Verification Approach:**
- Integration test: Add items, restart service worker, verify queue intact
- Manual test: Add items, restart browser, verify queue intact

---

## Dependencies

### Epic Dependencies
- **1.2 Storage Manager:** Provides abstraction for chrome.storage.local
- **2.0 Challenge Code Authentication:** Provides API client for sending captures
- **3.0 Bookmark Capture:** Provides bookmark capture flow to integrate with queue
- **3.1 Highlight Capture:** Provides highlight capture flow to integrate with queue
- **4.0 Readability Integration:** Provides article capture flow to integrate with queue

### Technical Dependencies
- **chrome.storage.local:** Browser API for persistent storage
- **TypeScript:** Type definitions for queue structures
- **UUID library:** Generate unique IDs for queue items (or use crypto.randomUUID)

### Data Dependencies
- Queue items depend on capture payloads from Epic 3.0, 3.1, 4.0
- Queue persistence depends on StorageManager schema

---

## Risks and Mitigations

### Risk 1: Storage Quota Exceeded
**Description:** chrome.storage.local has quota limits (typically 5-10MB). Queue may exceed quota with large articles or many items.  
**Likelihood:** Medium  
**Impact:** High  
**Mitigation:**
- Implement FIFO eviction at 1000 items (FR-Q4)
- Monitor storage quota (Epic 1.2 already implements quota monitoring)
- Compress large payloads if >100KB (NFR-Q2)
- Warn user at 80% quota, fail at 95% (Epic 1.2)
- Document storage limits in user guide

---

### Risk 2: Service Worker Termination During Processing
**Description:** Service worker may terminate mid-processing, leaving item in "sending" state.  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Atomic operations for small captures (<2MB) (FR-Q6)
- Checkpoint-based recovery for large articles (Epic 10.2, post-MVP)
- On service worker startup, reset "sending" items to "queued" (Epic 5.2)
- Retry logic handles stuck items (Epic 5.1)

---

### Risk 3: Concurrent Queue Access
**Description:** Multiple capture requests may attempt to modify queue concurrently, causing race conditions.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Sequential processing ensures one item processed at a time (FR-Q5)
- Use chrome.storage.local locking mechanisms (if available)
- Implement queue operation mutex (if needed)
- Test concurrent access scenarios

---

### Risk 4: Queue Corruption
**Description:** Invalid data or serialization errors may corrupt queue.  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Validate queue items before adding (AC-Q1)
- Handle serialization errors gracefully (FR-Q10)
- Log errors and skip invalid items
- Provide "Clear Queue" option for recovery (Epic 5.3)
- Test with malformed data

---

### Risk 5: Performance Degradation with Large Queue
**Description:** Queue operations may slow down with 1000 items.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Set performance budgets (NFR-Q1)
- Benchmark queue operations with 1000 items
- Optimize storage queries (use indexes if needed)
- Limit queue to 1000 items (FR-Q4)

---

## Open Questions

None. All requirements are clear and aligned with PRD FR6.1-FR6.10 and AC5, AC8.

---

## EVIDENCE

*This section will be populated during implementation with verification evidence for each acceptance criterion.*

### AC5: Extension Queues Captures When Anytype Is Not Running
- **Evidence:** Integrated into `BookmarkCaptureService.captureBookmark`. Verified via unit tests in `tests/unit/queue-manager.test.ts` (`shouldQueue` helper) and integration tests in `tests/integration/queue-persistence.test.ts`.
- **Manual Verification:** Popup UI successfully shows "Saved offline!" status message when API returns queueable errors.

### AC8: Queue Survives Browser Restart and Service Worker Termination
- **Evidence:** Verified via integration tests in `tests/integration/queue-persistence.test.ts` (`should recover queue items after a simulated reload`). Survival is guaranteed by `chrome.storage.local` persistence.

### AC-Q1: Queue Item Schema
- **Evidence:** Defined in `src/types/queue.ts` and validated by `QueueItemSchema` in `src/lib/storage/schema.ts` using Zod.

### AC-Q2: Queue Operations
- **Evidence:** Fully implemented in `QueueManager` and `StorageManager`. Verified by unit tests in `tests/unit/queue-manager.test.ts` covering `add`, `getNext`, `updateStatus`, `markSent`, `markFailed`.

### AC-Q3: FIFO Eviction
- **Evidence:** Implemented in `QueueManager.add`. Verified by unit test `should enforce FIFO eviction when queue is full (1000 items)`.

### AC-Q4: Sequential Processing
- **Evidence:** `QueueManager.getNext` returns items in FIFO order. Integration tests confirm sequential status transitions (`queued` -> `sending` -> `sent`).

### AC-Q5: Queue Persistence
- **Evidence:** Verified by `tests/integration/queue-persistence.test.ts` which uses a real `StorageManager` instance to interact with a mocked `chrome.storage.local`.

---

**End of Specification**
