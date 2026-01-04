# Specification: Queue UI & Status

## Header

- **Title:** Queue UI & Status
- **Roadmap Anchor:** [roadmap.md 5.3](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L614-L638)
- **Priority:** P0
- **Type:** Feature
- **Target Area:** UI and user feedback
- **Target Acceptance Criteria:** FR6.2, FR6.5, AC5, US3

---

## Problem Statement

The offline queue system (Epic 5.0) and retry logic (Epic 5.1) successfully persist and retry captures when Anytype is unavailable. However, users currently have no visibility into the queue status, pending captures, or failed items.

Users need a queue UI that:
- Displays queue status in the popup with pending count
- Shows badge counter on extension icon for pending items
- Displays detailed status for each queued item (queued/sending/sent/failed)
- Shows timestamps and retry counts for each item
- Displays error messages for failed items
- Provides manual retry and delete actions for failed items

Without queue visibility, users cannot monitor offline captures, understand retry progress, or take action on failed items.

---

## Goals and Non-Goals

### Goals

- Display queue status section in popup UI
- Show pending count with badge counter on extension icon
- Display item status indicators (queued/sending/sent/failed)
- Show timestamps and retry counts for each item
- Display error messages for failed items
- Provide manual retry button for failed items
- Provide delete button for failed/sent items
- Update UI reactively when queue status changes
- Maintain responsive UI performance with large queues

### Non-Goals

- Export queue as JSON (post-MVP, Epic 10.7)
- Statistics dashboard (post-MVP, Epic 10.7)
- Debug log viewer (post-MVP, Epic 10.6)
- Queue filtering or search (post-MVP)
- Bulk operations (retry all, delete all) (post-MVP)
- Queue item editing (post-MVP)

---

## User Stories

### US3 (Partial): Build Offline Queue During Research Session

**As a** power user doing deep research with intermittent internet,  
**I want to** see the status of my queued captures in the popup,  
**So that** I can monitor offline captures and take action on failed items.

**Acceptance:**
- Popup shows pending count with badge counter
- Popup displays "Retry All" button and detailed queue status
- User sees success notifications as queued items complete
- Can manually retry or delete failed items from popup
- Queue status updates in real-time as items are processed

**Note:** This epic (5.3) implements the queue UI components. Queue persistence is covered in Epic 5.0, and retry logic is covered in Epic 5.1.

---

## Scope

### In-Scope

- Queue status section in popup UI
- Badge counter on extension icon showing pending count
- Queue item list with status indicators
- Status badges (queued/sending/sent/failed) with color coding
- Timestamps display (created, last retry)
- Retry count display
- Error message display for failed items
- Manual retry button for failed items
- Delete button for failed/sent items
- Real-time UI updates when queue changes
- Empty state UI when queue is empty
- Loading states during operations
- CSS styling for queue UI components
- Integration with QueueManager for data
- Integration with RetryScheduler for manual retry

### Out-of-Scope

- Export queue functionality (Epic 10.7)
- Statistics and analytics (Epic 10.7)
- Debug log integration (Epic 10.6)
- Queue filtering or search (post-MVP)
- Bulk operations (post-MVP)
- Queue item editing (post-MVP)
- Configurable queue display settings (post-MVP)

---

## Requirements

### Functional Requirements

#### FR-Q1: Queue Status Section
- **Description:** Display queue status section in popup UI below capture controls
- **Priority:** P0
- **Rationale:** Provides visibility into offline queue
- **Dependencies:** Epic 5.0 (QueueManager)

#### FR-Q2: Badge Counter
- **Description:** Display badge counter on extension icon showing pending count (queued + sending)
- **Priority:** P0
- **Rationale:** Provides at-a-glance queue status without opening popup
- **Dependencies:** Epic 5.0 (QueueManager)

#### FR-Q3: Queue Item List
- **Description:** Display list of queue items with status, timestamps, and actions
- **Priority:** P0
- **Rationale:** Provides detailed queue visibility
- **Dependencies:** Epic 5.0 (QueueManager)

#### FR-Q4: Status Indicators
- **Description:** Display status badges with color coding:
  - **Queued:** Blue badge, "Queued" text
  - **Sending:** Yellow badge, "Sending..." text with spinner
  - **Sent:** Green badge, "Sent" text
  - **Failed:** Red badge, "Failed" text
- **Priority:** P0
- **Rationale:** Clear visual feedback on item status
- **Dependencies:** Epic 5.0 (QueueItem.status)

#### FR-Q5: Timestamps Display
- **Description:** Display timestamps for each queue item:
  - Created timestamp (relative time, e.g., "2 minutes ago")
  - Last retry timestamp (if retried)
- **Priority:** P1
- **Rationale:** Helps user understand queue age and retry timing
- **Dependencies:** Epic 5.0 (QueueItem.timestamp)

#### FR-Q6: Retry Count Display
- **Description:** Display retry count for items that have been retried (e.g., "Retry 3/10")
- **Priority:** P1
- **Rationale:** Shows retry progress and remaining attempts
- **Dependencies:** Epic 5.1 (QueueItem.retryCount)

#### FR-Q7: Error Message Display
- **Description:** Display sanitized error message for failed items
- **Priority:** P1
- **Rationale:** Helps user understand why capture failed
- **Dependencies:** Epic 5.1 (QueueItem.error)

#### FR-Q8: Manual Retry Button
- **Description:** Provide "Retry" button for failed items that resets retry count and re-queues item
- **Priority:** P1
- **Rationale:** Allows user to retry after fixing issues
- **Dependencies:** Epic 5.1 (RetryScheduler.retryItem)

#### FR-Q9: Delete Button
- **Description:** Provide "Delete" button for failed and sent items that removes item from queue
- **Priority:** P1
- **Rationale:** Allows user to clean up queue
- **Dependencies:** Epic 5.0 (QueueManager.delete)

#### FR-Q10: Real-time UI Updates
- **Description:** Update queue UI reactively when queue changes (item added, status changed, item deleted)
- **Priority:** P0
- **Rationale:** Keeps UI in sync with queue state
- **Dependencies:** Epic 5.0 (QueueManager events)

#### FR-Q11: Empty State
- **Description:** Display empty state message when queue is empty ("No pending captures")
- **Priority:** P1
- **Rationale:** Provides clear feedback when queue is empty
- **Dependencies:** None

#### FR-Q12: Loading States
- **Description:** Display loading spinners during retry and delete operations
- **Priority:** P1
- **Rationale:** Provides feedback during async operations
- **Dependencies:** None

### Non-Functional Requirements

#### NFR-Q1: Performance
- **Description:** Queue UI must remain responsive with large queues:
  - Render up to 100 items without lag
  - Use virtual scrolling for queues \u003e100 items (post-MVP)
  - Update UI within 100ms of queue changes
- **Priority:** P1
- **Rationale:** Maintains responsive user experience
- **Measurement:** Manual testing with large queues
- **Dependencies:** None

#### NFR-Q2: Usability
- **Description:** Queue UI must be usable:
  - Clear visual distinction between statuses
  - Accessible with keyboard navigation
  - Screen reader support with ARIA labels
  - Tooltips for status badges
  - Confirmation dialog for delete action
- **Priority:** P1
- **Rationale:** Ensures accessibility and prevents accidental deletions
- **Measurement:** Manual testing
- **Dependencies:** None

#### NFR-Q3: Visual Design
- **Description:** Queue UI must match extension design:
  - Consistent color scheme
  - Consistent typography
  - Consistent spacing and layout
  - Responsive design (min 320px width)
- **Priority:** P1
- **Rationale:** Maintains visual consistency
- **Measurement:** Visual review
- **Dependencies:** Epic 7.0 (Popup UI)

#### NFR-Q4: Testability
- **Description:** Queue UI must be testable:
  - Unit tests for UI components
  - Integration tests for queue operations
  - Manual test scenarios documented
- **Priority:** P1
- **Rationale:** Ensures reliability
- **Measurement:** Code coverage \u003e80%
- **Dependencies:** None

### Constraints Checklist

- ✅ **Security:** No sensitive data displayed (error messages sanitized)
- ✅ **Privacy:** No external API calls, all data local
- ✅ **Offline Behavior:** Queue UI works offline
- ✅ **Performance:** UI remains responsive with large queues
- ✅ **Observability:** Queue status visible to user

---

## Acceptance Criteria

### AC-Q1: Queue Status Section Displayed
**Criteria:**
- Queue status section appears in popup below capture controls
- Section shows pending count (e.g., "3 pending captures")
- Section is collapsible/expandable
- Section is hidden when queue is empty

**Verification Approach:**
- Manual test: Open popup with queued items, verify section displayed
- Manual test: Open popup with empty queue, verify section hidden
- Unit test: Verify section rendering logic

---

### AC-Q2: Badge Counter Displayed
**Criteria:**
- Badge counter appears on extension icon when queue has pending items
- Badge shows count of queued + sending items
- Badge is hidden when queue is empty
- Badge updates in real-time as queue changes

**Verification Approach:**
- Manual test: Queue items, verify badge counter appears with correct count
- Manual test: Clear queue, verify badge hidden
- Integration test: Verify badge updates when queue changes

---

### AC-Q3: Queue Item List Displayed
**Criteria:**
- Queue items are displayed in list format
- Each item shows: title, status badge, timestamp, actions
- Items are ordered by timestamp (newest first)
- List is scrollable if \u003e5 items

**Verification Approach:**
- Manual test: Queue multiple items, verify list displayed with correct order
- Manual test: Queue \u003e5 items, verify list scrollable
- Unit test: Verify list rendering logic

---

### AC-Q4: Status Indicators Displayed
**Criteria:**
- Status badges use correct colors:
  - Queued: Blue
  - Sending: Yellow with spinner
  - Sent: Green
  - Failed: Red
- Status text is clear and readable
- Status updates in real-time

**Verification Approach:**
- Manual test: Verify each status displays with correct color and text
- Manual test: Verify status updates when item status changes
- Visual review: Verify color contrast meets accessibility standards

---

### AC-Q5: Timestamps Displayed
**Criteria:**
- Created timestamp displayed in relative format (e.g., "2 minutes ago")
- Last retry timestamp displayed if item has been retried
- Timestamps update every minute
- Timestamps are human-readable

**Verification Approach:**
- Manual test: Queue item, verify created timestamp displayed
- Manual test: Retry item, verify last retry timestamp displayed
- Unit test: Verify timestamp formatting logic

---

### AC-Q6: Retry Count Displayed
**Criteria:**
- Retry count displayed for items with retryCount \u003e 0
- Format: "Retry X/10" where X is current retry count
- Retry count updates after each retry attempt
- Retry count is hidden for items with retryCount = 0

**Verification Approach:**
- Manual test: Retry item multiple times, verify count increments
- Manual test: Verify count hidden for new items
- Unit test: Verify retry count display logic

---

### AC-Q7: Error Message Displayed
**Criteria:**
- Error message displayed for failed items
- Error message is sanitized (no API keys, tokens, PII)
- Error message is human-readable
- Error message is truncated if \u003e100 chars with "..." and tooltip for full message

**Verification Approach:**
- Manual test: Trigger API error, verify error message displayed
- Manual test: Verify long error message truncated with tooltip
- Unit test: Verify error message sanitization

---

### AC-Q8: Manual Retry Button Works
**Criteria:**
- "Retry" button appears for failed items
- Clicking "Retry" resets retry count to 0
- Clicking "Retry" updates status to "queued"
- Clicking "Retry" schedules immediate retry attempt
- Loading spinner shown during retry operation

**Verification Approach:**
- Manual test: Mark item as failed, click "Retry", verify retry count reset and status updated
- Integration test: Verify retry operation calls RetryScheduler.retryItem
- Manual test: Verify loading spinner during operation

---

### AC-Q9: Delete Button Works
**Criteria:**
- "Delete" button appears for failed and sent items
- Clicking "Delete" shows confirmation dialog
- Confirming delete removes item from queue
- Confirming delete removes item from storage
- Loading spinner shown during delete operation

**Verification Approach:**
- Manual test: Click "Delete", verify confirmation dialog shown
- Manual test: Confirm delete, verify item removed from queue and UI
- Integration test: Verify delete operation calls QueueManager.delete
- Manual test: Verify loading spinner during operation

---

### AC-Q10: Real-time UI Updates
**Criteria:**
- UI updates when item added to queue
- UI updates when item status changes
- UI updates when item deleted from queue
- UI updates when retry count changes
- Updates occur within 100ms of queue change

**Verification Approach:**
- Manual test: Queue item, verify UI updates immediately
- Manual test: Delete item, verify UI updates immediately
- Integration test: Verify UI subscribes to queue change events

---

### AC-Q11: Empty State Displayed
**Criteria:**
- Empty state message displayed when queue is empty
- Message: "No pending captures"
- Empty state is visually distinct
- Empty state is hidden when queue has items

**Verification Approach:**
- Manual test: Clear queue, verify empty state displayed
- Manual test: Queue item, verify empty state hidden
- Unit test: Verify empty state rendering logic

---

### AC-Q12: Loading States Displayed
**Criteria:**
- Loading spinner shown during retry operation
- Loading spinner shown during delete operation
- Loading spinner replaces action buttons during operation
- Loading spinner is accessible (ARIA label)

**Verification Approach:**
- Manual test: Click "Retry", verify loading spinner shown
- Manual test: Click "Delete", verify loading spinner shown
- Manual test: Verify screen reader announces loading state

---

## Dependencies

### Epic Dependencies
- **5.0 Offline Queue System:** Provides QueueManager and queue persistence
- **5.1 Retry Logic with Backoff:** Provides RetryScheduler for manual retry
- **7.0 Popup UI:** Provides popup UI structure and styling

### Technical Dependencies
- **QueueManager:** Queue operations (getAll, delete, subscribe to changes)
- **RetryScheduler:** Manual retry operation
- **chrome.action.setBadgeText:** Badge counter display
- **TypeScript:** Type definitions for UI components
- **CSS:** Styling for queue UI components

### Data Dependencies
- Queue items from Epic 5.0 (QueueItem schema with status, timestamp, retryCount, error)

---

## Risks and Mitigations

### Risk 1: Performance with Large Queues
**Description:** Rendering large queues (100+ items) may cause UI lag.  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Limit initial render to 20 items with "Show more" button
- Implement virtual scrolling for queues \u003e100 items (post-MVP)
- Test with large queues (100+ items)
- Optimize rendering with React/Vue if needed (post-MVP)

---

### Risk 2: Real-time Updates Performance
**Description:** Frequent queue updates may cause UI thrashing.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Debounce UI updates (100ms)
- Batch multiple queue changes into single UI update
- Test with rapid queue changes
- Use efficient DOM updates (virtual DOM or incremental updates)

---

### Risk 3: Badge Counter Accuracy
**Description:** Badge counter may become out of sync with queue state.  
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- Subscribe to queue change events
- Update badge on every queue change
- Test badge updates with various queue operations
- Add badge refresh on popup open

---

### Risk 4: Error Message Leakage
**Description:** Error messages may contain sensitive data (API keys, tokens, PII).  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Use sanitized error messages from Epic 5.1
- Verify error message sanitization in UI
- Unit tests for error message display
- Code review for error handling

---

### Risk 5: Accidental Deletions
**Description:** User may accidentally delete queue items.  
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- Show confirmation dialog before delete
- Provide "Undo" option (post-MVP)
- Test delete confirmation flow
- Consider "Archive" instead of "Delete" (post-MVP)

---

## Open Questions

None. All requirements are clear and aligned with PRD FR6.2, FR6.5, AC5, US3.

---

## EVIDENCE

### Automated Tests
- [x] **Unit Tests (UI Components)**: `tests/unit/queue-ui.test.ts` - Verified rendering, hiding, toggling, and action button logic.
- [x] **Unit Tests (BadgeManager)**: `tests/unit/badge-manager.test.ts` - Verified badge text and color logic.
- [x] **Unit Tests (Utilities)**: `tests/unit/timestamp-formatter.test.ts` - Verified relative time formatting.
- [x] **Integration Tests**: `tests/integration/queue-ui-flow.test.ts` - Verified message coordination for retry and delete actions.

### Implemented Features
- [x] **Queue Status Section**: Collapsible section in popup with pending count.
- [x] **Queue Item List**: Newest-first sorted list of capture requests.
- [x] **Status Badges**: Color-coded indicators for Queued, Sending, Sent, Failed.
- [x] **Manual Actions**: Retry and Delete functionality integrated with background services.
- [x] **Badge Manager**: Real-time extension icon counter with health indicators.
- [x] **Performance**: Debounced UI updates to prevent thrashing during rapid changes.

### File References
- Components: `src/popup/components/QueueStatusSection.ts`, `QueueItemList.ts`, `QueueItem.ts`
- Styling: `src/popup/styles/queue-ui.css`
- Background: `src/background/badge-manager.ts`
- Integration: `src/background/service-worker.ts`, `src/popup/popup.ts`

---

**End of Specification**
