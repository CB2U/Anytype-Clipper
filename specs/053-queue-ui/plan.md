# Implementation Plan: Queue UI & Status

## Architecture Overview

### Key Components

This epic adds queue visibility to the popup UI by creating new UI components and integrating with existing queue infrastructure.

**Components:**

1. **QueueStatusSection** (new)
   - Container component for queue UI
   - Displays pending count and queue item list
   - Collapsible/expandable section
   - Handles empty state

2. **QueueItemList** (new)
   - Renders list of queue items
   - Handles scrolling for large queues
   - Manages item ordering (newest first)

3. **QueueItem** (new)
   - Individual queue item component
   - Displays status badge, title, timestamp, retry count, error message
   - Provides retry and delete action buttons
   - Handles loading states

4. **BadgeManager** (new)
   - Updates extension icon badge counter
   - Subscribes to queue changes
   - Calculates pending count (queued + sending)

5. **Popup UI Integration** (modify)
   - Add QueueStatusSection to popup layout
   - Wire up queue data subscription
   - Handle queue operation callbacks

### Component Hierarchy

```
Popup
├── CaptureControls (existing)
├── QueueStatusSection (new)
│   ├── QueueHeader (pending count, collapse toggle)
│   ├── QueueItemList (new)
│   │   └── QueueItem[] (new)
│   │       ├── StatusBadge
│   │       ├── ItemInfo (title, timestamp, retry count)
│   │       ├── ErrorMessage (if failed)
│   │       └── Actions (retry, delete buttons)
│   └── EmptyState (when queue empty)
```

### Data Flow

```
QueueManager (storage) 
  ↓ (subscribe to changes)
Popup UI State
  ↓ (props)
QueueStatusSection
  ↓ (props)
QueueItemList
  ↓ (props)
QueueItem
  ↓ (user action)
QueueManager / RetryScheduler (operations)
  ↓ (update storage)
QueueManager (storage)
```

### Alternatives Considered

**Alternative 1: Separate Queue Page**
- Pros: More space for queue UI, doesn't clutter popup
- Cons: Extra click to view queue, less discoverable
- **Decision:** Rejected. Queue status should be immediately visible in popup.

**Alternative 2: Minimal Queue UI (count only)**
- Pros: Simpler implementation, less UI clutter
- Cons: No visibility into individual items, no manual actions
- **Decision:** Rejected. Users need detailed queue visibility and manual retry/delete.

**Alternative 3: Notification-based Queue Status**
- Pros: Non-intrusive, works without opening popup
- Cons: Notifications can be dismissed, no persistent visibility
- **Decision:** Rejected. Persistent visibility in popup is essential.

**Chosen Approach:** Full queue UI in popup with collapsible section. Provides detailed visibility while allowing users to collapse when not needed.

---

## Data Contracts

### QueueItem (from Epic 5.0)

```typescript
interface QueueItem {
  id: string;
  type: 'bookmark' | 'highlight' | 'article';
  status: 'queued' | 'sending' | 'sent' | 'failed';
  timestamp: number;
  retryCount: number;
  error?: string;
  data: CaptureRequest;
}
```

### QueueStatus (new)

```typescript
interface QueueStatus {
  items: QueueItem[];
  pendingCount: number; // queued + sending
  totalCount: number;
}
```

### QueueItemProps (new)

```typescript
interface QueueItemProps {
  item: QueueItem;
  onRetry: (id: string) => Promise\u003cvoid\u003e;
  onDelete: (id: string) => Promise\u003cvoid\u003e;
}
```

---

## Storage and Persistence

No new storage requirements. Queue UI reads from existing queue storage managed by QueueManager (Epic 5.0).

---

## External Integrations

### chrome.action API

**Purpose:** Display badge counter on extension icon

**Integration Points:**
- `chrome.action.setBadgeText({ text: string })` - Set badge text
- `chrome.action.setBadgeBackgroundColor({ color: string })` - Set badge color

**Usage:**
- Update badge when queue changes
- Clear badge when queue is empty
- Set badge color to red if any failed items

---

## UX and Operational States

### Queue Status Section States

1. **Hidden** (queue empty)
   - Section not rendered
   - Badge counter hidden

2. **Collapsed** (queue has items, section collapsed)
   - Shows pending count only
   - Badge counter visible
   - Click to expand

3. **Expanded** (queue has items, section expanded)
   - Shows full queue item list
   - Badge counter visible
   - Click to collapse

### Queue Item States

1. **Queued** (status: 'queued')
   - Blue badge
   - "Queued" text
   - No actions available

2. **Sending** (status: 'sending')
   - Yellow badge with spinner
   - "Sending..." text
   - No actions available

3. **Sent** (status: 'sent')
   - Green badge
   - "Sent" text
   - Delete button available

4. **Failed** (status: 'failed')
   - Red badge
   - "Failed" text
   - Error message displayed
   - Retry and Delete buttons available

### Action States

1. **Idle** (no operation in progress)
   - Action buttons enabled
   - Normal button styling

2. **Loading** (operation in progress)
   - Loading spinner replaces buttons
   - Buttons disabled
   - ARIA label: "Processing..."

---

## Testing Plan

### Unit Tests

#### Test File: `tests/unit/queue-ui.test.ts` (new)

**Tests:**
1. QueueStatusSection renders with items
2. QueueStatusSection hidden when queue empty
3. QueueItemList renders items in correct order (newest first)
4. QueueItem displays correct status badge
5. QueueItem displays retry count when \u003e 0
6. QueueItem displays error message when failed
7. QueueItem retry button calls onRetry callback
8. QueueItem delete button calls onDelete callback
9. QueueItem shows loading state during operation
10. BadgeManager calculates pending count correctly
11. BadgeManager updates badge on queue change

**Run Command:**
```bash
npm test -- tests/unit/queue-ui.test.ts
```

#### Test File: `tests/unit/badge-manager.test.ts` (new)

**Tests:**
1. Badge text set to pending count
2. Badge hidden when queue empty
3. Badge color red when failed items exist
4. Badge updates on queue change event

**Run Command:**
```bash
npm test -- tests/unit/badge-manager.test.ts
```

### Integration Tests

#### Test File: `tests/integration/queue-ui-flow.test.ts` (new)

**Tests:**
1. Queue UI updates when item added to queue
2. Queue UI updates when item status changes
3. Manual retry resets retry count and re-queues item
4. Manual delete removes item from queue and UI
5. Badge counter updates when queue changes
6. Empty state displayed when queue cleared

**Run Command:**
```bash
npm test -- tests/integration/queue-ui-flow.test.ts
```

### Manual Verification

#### Manual Test 1: Queue Status Display
**Steps:**
1. Open extension popup
2. Close Anytype Desktop
3. Save a bookmark
4. Verify queue status section appears with "1 pending capture"
5. Verify badge counter shows "1"
6. Verify queue item displayed with "Queued" status (blue badge)

**Expected:**
- Queue status section visible
- Badge counter shows "1"
- Queue item displayed with correct status

#### Manual Test 2: Status Updates
**Steps:**
1. Queue a capture (Anytype closed)
2. Open Anytype Desktop
3. Observe queue item status change from "Queued" to "Sending" to "Sent"
4. Verify badge counter updates to "0"
5. Verify queue status section hidden when queue empty

**Expected:**
- Status updates in real-time
- Badge counter updates
- Section hidden when empty

#### Manual Test 3: Manual Retry
**Steps:**
1. Queue a capture that will fail (e.g., invalid data)
2. Wait for max retries (10 attempts)
3. Verify item marked as "Failed" with error message
4. Click "Retry" button
5. Verify loading spinner shown
6. Verify retry count reset to 0
7. Verify status changed to "Queued"

**Expected:**
- Failed item displays error message
- Retry button works
- Loading state shown
- Retry count reset

#### Manual Test 4: Manual Delete
**Steps:**
1. Queue a capture that will fail
2. Wait for max retries
3. Click "Delete" button
4. Verify confirmation dialog shown
5. Confirm delete
6. Verify item removed from queue and UI
7. Verify badge counter updated

**Expected:**
- Confirmation dialog shown
- Item deleted
- UI updated
- Badge updated

#### Manual Test 5: Large Queue Performance
**Steps:**
1. Queue 50 captures (Anytype closed)
2. Open popup
3. Verify queue UI renders without lag
4. Scroll through queue items
5. Verify smooth scrolling

**Expected:**
- UI renders within 300ms
- Scrolling is smooth
- No UI lag

---

## AC Verification Mapping

| AC | Verification Method |
|----|---------------------|
| AC-Q1: Queue Status Section Displayed | Manual Test 1, Unit Test 1-2 |
| AC-Q2: Badge Counter Displayed | Manual Test 1-2, Unit Test 10-11, Integration Test 5 |
| AC-Q3: Queue Item List Displayed | Manual Test 1, Unit Test 3, Manual Test 5 |
| AC-Q4: Status Indicators Displayed | Manual Test 1-2, Unit Test 4 |
| AC-Q5: Timestamps Displayed | Manual Test 1, Unit Test (timestamp formatting) |
| AC-Q6: Retry Count Displayed | Manual Test 3, Unit Test 5 |
| AC-Q7: Error Message Displayed | Manual Test 3, Unit Test 6 |
| AC-Q8: Manual Retry Button Works | Manual Test 3, Unit Test 7, Integration Test 3 |
| AC-Q9: Delete Button Works | Manual Test 4, Unit Test 8, Integration Test 4 |
| AC-Q10: Real-time UI Updates | Manual Test 2, Integration Test 1-2, Integration Test 5 |
| AC-Q11: Empty State Displayed | Manual Test 2, Unit Test 2, Integration Test 6 |
| AC-Q12: Loading States Displayed | Manual Test 3-4, Unit Test 9 |

---

## Risks and Mitigations

### Risk 1: Performance with Large Queues
**Mitigation:**
- Limit initial render to 20 items
- Implement "Show more" button
- Test with 100+ items
- Monitor render performance

### Risk 2: Real-time Updates Performance
**Mitigation:**
- Debounce UI updates (100ms)
- Batch queue changes
- Use efficient DOM updates
- Test with rapid queue changes

### Risk 3: Badge Counter Sync
**Mitigation:**
- Subscribe to queue change events
- Update badge on every change
- Refresh badge on popup open
- Test badge accuracy

---

## Rollout and Migration Notes

### Rollout Plan

1. **Phase 1:** Implement UI components (T1-T6)
2. **Phase 2:** Integrate with QueueManager (T7-T8)
3. **Phase 3:** Implement badge counter (T9)
4. **Phase 4:** Testing (T10-T14)
5. **Phase 5:** Documentation and tracking (T15-T17)

### Migration Notes

No data migration required. Queue UI reads from existing queue storage.

### Backwards Compatibility

Queue UI is additive. No breaking changes to existing queue functionality.

---

## Observability and Debugging

### What Can Be Logged

- Queue UI render events (debug level)
- Queue operation events (retry, delete) (info level)
- Queue change events (debug level)
- Badge update events (debug level)
- Performance metrics (render time) (debug level)

### What Must Never Be Logged

- Queue item data (may contain sensitive content)
- Full error messages (may contain API keys or tokens)
- User input (tags, notes)

### Debug Capabilities

- Queue status visible in popup
- Error messages displayed for failed items
- Retry count visible
- Timestamps visible
- Console logs for queue operations (debug mode)

---

## Proposed Changes

### UI Components

#### [NEW] [src/popup/components/QueueStatusSection.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/components/QueueStatusSection.ts)

New component that displays queue status section in popup. Includes:
- Pending count display
- Collapse/expand toggle
- QueueItemList integration
- Empty state handling

#### [NEW] [src/popup/components/QueueItemList.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/components/QueueItemList.ts)

New component that renders list of queue items. Includes:
- Item ordering (newest first)
- Scrolling for large queues
- Integration with QueueItem component

#### [NEW] [src/popup/components/QueueItem.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/components/QueueItem.ts)

New component that renders individual queue item. Includes:
- Status badge display
- Title, timestamp, retry count display
- Error message display
- Retry and delete action buttons
- Loading state handling

#### [NEW] [src/popup/styles/queue-ui.css](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/styles/queue-ui.css)

New CSS file for queue UI styling. Includes:
- Status badge colors
- Layout and spacing
- Responsive design
- Loading state animations

---

### Background Services

#### [NEW] [src/background/badge-manager.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/badge-manager.ts)

New service that manages extension icon badge counter. Includes:
- Subscribe to queue changes
- Calculate pending count
- Update badge text and color
- Clear badge when queue empty

---

### Popup Integration

#### [MODIFY] [src/popup/popup.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)

Integrate QueueStatusSection into popup. Changes:
- Import QueueStatusSection component
- Subscribe to queue changes
- Pass queue data to QueueStatusSection
- Handle retry and delete callbacks

#### [MODIFY] [src/popup/popup.html](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.html)

Add queue status section to popup layout. Changes:
- Add container for QueueStatusSection
- Update layout to accommodate queue UI

#### [MODIFY] [src/popup/styles/popup.css](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/styles/popup.css)

Update popup styles for queue UI integration. Changes:
- Add spacing for queue section
- Ensure responsive layout

---

### Service Worker Integration

#### [MODIFY] [src/background/service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Initialize BadgeManager on service worker startup. Changes:
- Import BadgeManager
- Initialize BadgeManager instance
- Subscribe to queue changes

---

## Verification Plan

### Automated Tests

**Unit Tests:**
- Run: `npm test -- tests/unit/queue-ui.test.ts`
- Run: `npm test -- tests/unit/badge-manager.test.ts`
- Coverage: \u003e80% for new components

**Integration Tests:**
- Run: `npm test -- tests/integration/queue-ui-flow.test.ts`
- Coverage: All queue operations (add, update, delete)

### Manual Verification

**Test Scenarios:**
1. Queue Status Display (Manual Test 1)
2. Status Updates (Manual Test 2)
3. Manual Retry (Manual Test 3)
4. Manual Delete (Manual Test 4)
5. Large Queue Performance (Manual Test 5)

**Acceptance Criteria:**
- All 12 ACs verified (see AC Verification Mapping)

### Performance Testing

**Metrics:**
- Popup open time: \u003c300ms (existing requirement)
- Queue UI render time: \u003c100ms for 20 items
- Queue UI render time: \u003c300ms for 100 items
- UI update latency: \u003c100ms after queue change

**Test Method:**
- Manual testing with performance profiler
- Measure render time with console.time/timeEnd
- Test with various queue sizes (0, 1, 10, 50, 100 items)

---

**End of Implementation Plan**
