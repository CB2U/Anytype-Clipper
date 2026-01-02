# Tasks: Offline Queue System

## Setup

### T1: Create Type Definitions
**Goal:** Define TypeScript interfaces for queue system

**Steps:**
1. Create `src/types/queue.d.ts`
2. Define `QueueStatus` enum (Queued, Sending, Sent, Failed)
3. Define `QueueItem` interface (id, type, payload, status, timestamps, retryCount, error)
4. Define `CapturePayload` type (union of BookmarkPayload, HighlightPayload, ArticlePayload)
5. Export all types from `src/types/index.ts`

**Done When:**
- All type definitions created
- TypeScript compiles with no errors
- Types exported from `src/types/index.ts`

**Verify:**
- Run `npm run type-check`
- Verify no TypeScript errors

**Evidence to Record:**
- TypeScript compilation output
- Link to `queue.d.ts` file

**Files Touched:**
- `src/types/queue.d.ts` (new)
- `src/types/index.ts` (modify to export)

---

### T2: Create Test Fixtures
**Goal:** Prepare test fixtures for queue testing

**Steps:**
1. Create `tests/fixtures/queue/` directory
2. Create `bookmark-item.json` (sample bookmark queue item)
3. Create `highlight-item.json` (sample highlight queue item)
4. Create `article-item.json` (sample article queue item)
5. Create `queue-1000-items.json` (1000 items for eviction testing)

**Done When:**
- All 4 fixtures created
- Fixtures contain valid queue items
- Fixtures cover diverse scenarios

**Verify:**
- Parse each fixture as JSON, verify valid
- Verify fixtures match QueueItem schema

**Evidence to Record:**
- List of created fixtures
- Sample fixture content

**Files Touched:**
- `tests/fixtures/queue/*.json` (4 new files)

---

## Core Implementation

### T3: Implement QueueManager - Basic Operations
**Goal:** Create QueueManager class with basic queue operations

**Steps:**
1. Create `src/background/queue-manager.ts`
2. Implement constructor (inject StorageManager)
3. Implement `add(item: QueueItem): Promise<void>`
   - Validate item
   - Check queue size, evict if needed (FIFO)
   - Add to queue
   - Persist via StorageManager
4. Implement `getNext(): Promise<QueueItem | null>`
   - Get all queue items
   - Filter by status "queued"
   - Return oldest (FIFO)
5. Implement `getAll(): Promise<QueueItem[]>`
   - Get queue from storage
6. Implement `getPending(): Promise<QueueItem[]>`
   - Get all items with status "queued"
7. Implement `delete(id: string): Promise<void>`
   - Remove item from queue
   - Persist via StorageManager

**Done When:**
- QueueManager class implemented
- Basic operations work
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `queue-manager.ts` file
- TypeScript/ESLint output

**Files Touched:**
- `src/background/queue-manager.ts` (new)

---

### T4: Implement QueueManager - Status Operations
**Goal:** Implement status update operations

**Steps:**
1. Open `src/background/queue-manager.ts`
2. Implement `updateStatus(id: string, status: QueueStatus): Promise<void>`
   - Find item by ID
   - Update status
   - Update lastAttempt timestamp
   - If status is "sent" or "failed", update completed timestamp
   - Persist via StorageManager
3. Implement `markSent(id: string): Promise<void>`
   - Call updateStatus with "sent"
4. Implement `markFailed(id: string, error: string): Promise<void>`
   - Call updateStatus with "failed"
   - Set error message
5. Implement `clear(): Promise<void>`
   - Clear entire queue
   - Persist empty array

**Done When:**
- Status operations implemented
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `queue-manager.ts` file
- Code snippet of status operations

**Files Touched:**
- `src/background/queue-manager.ts` (modify)

---

### T5: Implement StorageManager Queue Methods
**Goal:** Add queue storage methods to StorageManager

**Steps:**
1. Open `src/lib/storage/storage-manager.ts`
2. Add `getQueue(): Promise<QueueItem[]>` method
   - Read queue from chrome.storage.local
   - Return empty array if not found
3. Add `setQueue(items: QueueItem[]): Promise<void>` method
   - Write queue to chrome.storage.local
4. Add `addQueueItem(item: QueueItem): Promise<void>` method
   - Get current queue
   - Add item
   - Set queue
5. Add `updateQueueItem(id: string, updates: Partial<QueueItem>): Promise<void>` method
   - Get current queue
   - Find item by ID
   - Apply updates
   - Set queue
6. Add `deleteQueueItem(id: string): Promise<void>` method
   - Get current queue
   - Filter out item by ID
   - Set queue

**Done When:**
- Queue storage methods implemented
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `storage-manager.ts` file
- Code snippet of queue methods

**Files Touched:**
- `src/lib/storage/storage-manager.ts` (modify)

---

### T6: Integrate Queue with Capture Flows
**Goal:** Add queue fallback to bookmark, highlight, article capture flows

**Steps:**
1. Open `src/background/service-worker.ts` (or relevant capture handler)
2. Import QueueManager
3. Instantiate QueueManager
4. Modify bookmark capture handler:
   - Wrap API call in try-catch
   - On NetworkError or AuthError, add to queue
   - Show "Queued" notification
5. Modify highlight capture handler (same pattern)
6. Modify article capture handler (same pattern)
7. Add helper function `shouldQueue(error)` to determine if error is queueable

**Done When:**
- Queue fallback integrated with all capture flows
- Queueable errors handled correctly
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to modified service-worker.ts
- Code snippet of queue integration

**Files Touched:**
- `src/background/service-worker.ts` (modify)

---

## Tests

### T7: Unit Tests - QueueManager Basic Operations
**Goal:** Write unit tests for QueueManager basic operations

**Steps:**
1. Create `tests/unit/queue-manager.test.ts`
2. Set up mock StorageManager
3. Test: Add item to queue
4. Test: Get next item (FIFO)
5. Test: Get all items
6. Test: Get pending items
7. Test: Delete item
8. Test: Clear queue
9. Test: FIFO eviction (add 1001 items, verify oldest evicted)
10. Test: Performance benchmark (add, get, update <100ms)
11. Run tests and verify all pass

**Done When:**
- All 8+ tests written
- Tests cover basic operations
- All tests pass
- Coverage ≥80% for basic operations

**Verify:**
- Run `npm test tests/unit/queue-manager.test.ts`
- Run `npm run test:coverage` and check coverage report

**Evidence to Record:**
- Test output (all passing)
- Coverage report for `queue-manager.ts`

**Files Touched:**
- `tests/unit/queue-manager.test.ts` (new)

---

### T8: Unit Tests - QueueManager Status Operations
**Goal:** Write unit tests for QueueManager status operations

**Steps:**
1. Open `tests/unit/queue-manager.test.ts`
2. Test: Update item status
3. Test: Mark item as sent
4. Test: Mark item as failed (with error message)
5. Test: Timestamps updated correctly (lastAttempt, completed)
6. Test: Handle invalid item ID gracefully
7. Run tests and verify all pass

**Done When:**
- All 5+ tests written
- Tests cover status operations
- All tests pass
- Coverage ≥80% for status operations

**Verify:**
- Run `npm test tests/unit/queue-manager.test.ts`
- Run `npm run test:coverage` and check coverage report

**Evidence to Record:**
- Test output (all passing)
- Coverage report for `queue-manager.ts`

**Files Touched:**
- `tests/unit/queue-manager.test.ts` (modify)

---

### T9: Integration Tests - Queue Persistence
**Goal:** Write integration tests for queue persistence

**Steps:**
1. Create `tests/integration/queue-persistence.test.ts`
2. Test: Add items to queue, verify persistence to chrome.storage.local
3. Test: Simulate service worker termination (create new QueueManager instance), verify queue intact
4. Test: Process queue items sequentially
5. Test: Verify FIFO order
6. Test: Queue survives multiple add/delete operations
7. Use real StorageManager (not mock)
8. Run tests and verify all pass

**Done When:**
- All 5+ integration tests written
- Tests use real storage
- All tests pass
- End-to-end flow verified

**Verify:**
- Run `npm test tests/integration/queue-persistence.test.ts`
- Verify chrome.storage.local is used

**Evidence to Record:**
- Test output (all passing)
- Sample queue data from storage

**Files Touched:**
- `tests/integration/queue-persistence.test.ts` (new)

---

### T10: Manual Verification - Queue Survives Browser Restart
**Goal:** Manually verify queue persists across browser restart

**Steps:**
1. Load extension in browser
2. Close Anytype Desktop
3. Capture 3 bookmarks (should be queued)
4. Open browser DevTools, check chrome.storage.local for queue
5. Verify 3 items in queue with status "queued"
6. Close browser completely
7. Reopen browser
8. Open DevTools, check chrome.storage.local for queue
9. Verify 3 items still in queue
10. Take screenshots

**Done When:**
- Queue persists across browser restart
- Screenshots captured

**Verify:**
- Visual inspection of chrome.storage.local
- Compare queue before and after restart

**Evidence to Record:**
- Screenshot of queue before restart
- Screenshot of queue after restart
- chrome.storage.local data

**Files Touched:**
- None (manual test)

---

### T11: Manual Verification - FIFO Eviction
**Goal:** Manually verify FIFO eviction at 1000 items

**Steps:**
1. Load extension in browser
2. Close Anytype Desktop
3. Use script or manual process to capture 1001 bookmarks
4. Open DevTools, check chrome.storage.local for queue
5. Verify queue has exactly 1000 items
6. Verify first item captured is not in queue (evicted)
7. Verify last 1000 items are in queue
8. Take screenshot

**Done When:**
- Queue has 1000 items (oldest evicted)
- Screenshot captured

**Verify:**
- Visual inspection of chrome.storage.local
- Check item IDs to verify oldest evicted

**Evidence to Record:**
- Screenshot of queue with 1000 items
- chrome.storage.local data
- Note about first item evicted

**Files Touched:**
- None (manual test)

---

## Docs

### T12: Update README
**Goal:** Document offline queue feature in user guide

**Steps:**
1. Open `README.md`
2. Add section "Offline Queue" under Features
3. Explain queue behavior:
   - Captures queued when Anytype is offline
   - Queue persists across browser restarts
   - Sequential processing (FIFO)
   - 1000 item limit with FIFO eviction
4. Note that retry logic and queue UI are in future epics

**Done When:**
- README updated with offline queue section
- Behavior explained clearly
- Limitations documented

**Verify:**
- Review README for clarity
- Verify examples are accurate

**Evidence to Record:**
- Link to updated README section

**Files Touched:**
- `README.md` (modify)

---

### T13: Update CHANGELOG
**Goal:** Document offline queue in changelog

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry under `[Unreleased]` or next version
3. Format: `### Added - Offline queue system for reliable capture (Epic 5.0)`
4. List key features:
   - Queue persists captures when Anytype is offline
   - Survives browser restart and service worker termination
   - FIFO processing with 1000 item limit

**Done When:**
- CHANGELOG updated
- Entry follows existing format

**Verify:**
- Review CHANGELOG for consistency

**Evidence to Record:**
- Link to CHANGELOG entry

**Files Touched:**
- `CHANGELOG.md` (modify)

---

## Verification

### T14: Acceptance Criteria Verification
**Goal:** Verify all acceptance criteria met and document evidence

**Steps:**
1. Review AC5, AC8, AC-Q1 through AC-Q5 in spec.md
2. Collect evidence from tests and manual verification:
   - AC5: Integration tests (T9) + manual test (T10)
   - AC8: Integration test (T9) + manual test (T10)
   - AC-Q1: Unit tests (T7)
   - AC-Q2: Unit tests (T7, T8)
   - AC-Q3: Unit test (T7) + manual test (T11)
   - AC-Q4: Integration test (T9)
   - AC-Q5: Integration test (T9) + manual test (T10)
3. Update spec.md EVIDENCE section with links and summaries
4. Verify all criteria met

**Done When:**
- All acceptance criteria verified
- Evidence documented in spec.md
- No gaps in verification

**Verify:**
- Review spec.md EVIDENCE section
- Confirm all ACs have evidence

**Evidence to Record:**
- Updated spec.md with complete EVIDENCE section

**Files Touched:**
- `specs/050-offline-queue/spec.md` (modify EVIDENCE section)

---

## Tracking

### T15: Update SPECS.md
**Goal:** Update specification index with offline queue status

**Steps:**
1. Open `SPECS.md`
2. Find row for Epic 5.0 (Offline Queue System)
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Update Evidence link to `specs/050-offline-queue/spec.md#evidence`
6. Update Last Updated timestamp
7. Update progress tracking section (BP4 progress)

**Done When:**
- SPECS.md row updated
- Progress tracking reflects completion

**Verify:**
- Review SPECS.md for accuracy

**Evidence to Record:**
- Link to updated SPECS.md

**Files Touched:**
- `SPECS.md` (modify)

---

### T16: Update SPEC.md
**Goal:** Update current focus to next epic

**Steps:**
1. Open `SPEC.md`
2. Update Current Focus to next epic (5.1 Retry Logic with Backoff)
3. Update Quick Links to new spec folder
4. Update Status to "In Progress" (for Epic 5.1)

**Done When:**
- SPEC.md points to next epic
- Links are correct

**Verify:**
- Review SPEC.md for accuracy

**Evidence to Record:**
- Link to updated SPEC.md

**Files Touched:**
- `SPEC.md` (modify)

---

**End of Tasks**
