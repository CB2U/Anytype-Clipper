# Tasks: Queue UI & Status

## Setup

### T1: Create UI component files
**Goal:** Set up file structure for queue UI components

**Steps:**
1. Create `src/popup/components/QueueStatusSection.ts`
2. Create `src/popup/components/QueueItemList.ts`
3. Create `src/popup/components/QueueItem.ts`
4. Create `src/popup/styles/queue-ui.css`
5. Create `src/background/badge-manager.ts`

**Done when:**
- All files created with basic structure
- Files export placeholder components/classes

**Verify:**
- Files exist at specified paths
- TypeScript compiles without errors

**Evidence to record:**
- File creation confirmation
- TypeScript compilation success

**Files touched:**
- `src/popup/components/QueueStatusSection.ts` (new)
- `src/popup/components/QueueItemList.ts` (new)
- `src/popup/components/QueueItem.ts` (new)
- `src/popup/styles/queue-ui.css` (new)
- `src/background/badge-manager.ts` (new)

---

## Core Implementation

### T2: Implement QueueStatusSection component
**Goal:** Create container component for queue UI

**Steps:**
1. Define QueueStatusSectionProps interface
2. Implement component with:
   - Pending count display
   - Collapse/expand toggle state
   - QueueItemList integration
   - Empty state handling
3. Add CSS classes for styling
4. Export component

**Done when:**
- Component renders with mock data
- Collapse/expand toggle works
- Empty state displays when no items
- TypeScript types are correct

**Verify:**
- Component renders in popup (visual check)
- Toggle state persists during session
- Empty state shows "No pending captures"

**Evidence to record:**
- Component implementation screenshot
- Toggle functionality demo

**Files touched:**
- `src/popup/components/QueueStatusSection.ts`
- `src/popup/styles/queue-ui.css`

---

### T3: Implement QueueItemList component
**Goal:** Create list component for queue items

**Steps:**
1. Define QueueItemListProps interface
2. Implement component with:
   - Item ordering (newest first)
   - Scrollable container
   - QueueItem rendering
3. Add CSS for list layout and scrolling
4. Export component

**Done when:**
- Component renders list of items
- Items ordered by timestamp (newest first)
- List scrollable when \u003e5 items
- TypeScript types are correct

**Verify:**
- List renders with mock data
- Items in correct order
- Scrolling works with \u003e5 items

**Evidence to record:**
- List rendering screenshot
- Scrolling demo with 10+ items

**Files touched:**
- `src/popup/components/QueueItemList.ts`
- `src/popup/styles/queue-ui.css`

---

### T4: Implement QueueItem component
**Goal:** Create individual queue item component

**Steps:**
1. Define QueueItemProps interface
2. Implement component with:
   - Status badge with color coding
   - Title, timestamp, retry count display
   - Error message display (if failed)
   - Retry button (if failed)
   - Delete button (if failed or sent)
   - Loading state handling
3. Add CSS for item layout and status badges
4. Implement relative timestamp formatting
5. Export component

**Done when:**
- Component renders all queue item states (queued, sending, sent, failed)
- Status badges use correct colors
- Retry and delete buttons appear for appropriate statuses
- Loading state shows spinner
- TypeScript types are correct

**Verify:**
- All status badges display correctly
- Buttons appear for correct statuses
- Loading state works
- Timestamps format correctly

**Evidence to record:**
- Screenshots of all status states
- Button interaction demo

**Files touched:**
- `src/popup/components/QueueItem.ts`
- `src/popup/styles/queue-ui.css`

---

### T5: Implement status badge styling
**Goal:** Create CSS for status badges with color coding

**Steps:**
1. Define badge base styles
2. Add status-specific colors:
   - Queued: Blue (#3B82F6)
   - Sending: Yellow (#F59E0B) with spinner
   - Sent: Green (#10B981)
   - Failed: Red (#EF4444)
3. Add spinner animation for "sending" status
4. Ensure accessibility (color contrast)

**Done when:**
- All status badges styled correctly
- Colors meet WCAG AA contrast standards
- Spinner animation smooth
- Badges responsive

**Verify:**
- Visual review of all badge states
- Contrast checker for accessibility
- Spinner animation smooth

**Evidence to record:**
- Badge styling screenshots
- Accessibility audit results

**Files touched:**
- `src/popup/styles/queue-ui.css`

---

### T6: Implement timestamp formatting
**Goal:** Create utility for relative timestamp formatting

**Steps:**
1. Create `formatRelativeTime(timestamp: number): string` function
2. Implement relative time logic:
   - \u003c1 minute: "Just now"
   - \u003c60 minutes: "X minutes ago"
   - \u003c24 hours: "X hours ago"
   - \u003e24 hours: "X days ago"
3. Add to QueueItem component
4. Add unit tests for timestamp formatting

**Done when:**
- Function formats timestamps correctly
- Unit tests pass
- Timestamps display in QueueItem

**Verify:**
- Unit tests pass: `npm test -- tests/unit/timestamp-formatter.test.ts`
- Visual check of timestamps in UI

**Evidence to record:**
- Unit test results
- Timestamp display screenshot

**Files touched:**
- `src/lib/utils/timestamp-formatter.ts` (new)
- `src/popup/components/QueueItem.ts`
- `tests/unit/timestamp-formatter.test.ts` (new)

---

### T7: Integrate QueueStatusSection into popup
**Goal:** Add queue UI to popup layout

**Steps:**
1. Import QueueStatusSection in `popup.ts`
2. Subscribe to queue changes from QueueManager
3. Pass queue data to QueueStatusSection as props
4. Implement retry callback (calls RetryScheduler.retryItem)
5. Implement delete callback (calls QueueManager.delete)
6. Add QueueStatusSection to popup HTML
7. Update popup CSS for layout

**Done when:**
- QueueStatusSection renders in popup
- Queue data flows from QueueManager to UI
- Retry and delete callbacks work
- UI updates when queue changes

**Verify:**
- Open popup, verify queue section displays
- Queue item, verify appears in UI
- Click retry, verify item re-queued
- Click delete, verify item removed

**Evidence to record:**
- Popup integration screenshot
- Queue operation demos (retry, delete)

**Files touched:**
- `src/popup/popup.ts`
- `src/popup/popup.html`
- `src/popup/styles/popup.css`

---

### T8: Implement real-time UI updates
**Goal:** Update queue UI when queue changes

**Steps:**
1. Subscribe to QueueManager change events in popup
2. Update UI state when queue changes
3. Debounce updates (100ms) to prevent thrashing
4. Test with rapid queue changes

**Done when:**
- UI updates within 100ms of queue change
- Multiple rapid changes batched into single update
- No UI lag or thrashing

**Verify:**
- Queue multiple items rapidly, verify UI updates smoothly
- Delete items, verify UI updates immediately
- Monitor performance with DevTools

**Evidence to record:**
- Real-time update demo
- Performance metrics

**Files touched:**
- `src/popup/popup.ts`

---

### T9: Implement BadgeManager
**Goal:** Create service to manage extension icon badge counter

**Steps:**
1. Create BadgeManager class in `src/background/badge-manager.ts`
2. Implement:
   - Subscribe to QueueManager change events
   - Calculate pending count (queued + sending)
   - Update badge text via chrome.action.setBadgeText
   - Set badge color (red if failed items, blue otherwise)
   - Clear badge when queue empty
3. Initialize BadgeManager in service worker
4. Add unit tests for BadgeManager

**Done when:**
- BadgeManager updates badge on queue changes
- Badge shows correct pending count
- Badge color correct (red if failed, blue otherwise)
- Badge hidden when queue empty
- Unit tests pass

**Verify:**
- Queue items, verify badge shows count
- Clear queue, verify badge hidden
- Fail item, verify badge turns red
- Unit tests pass: `npm test -- tests/unit/badge-manager.test.ts`

**Evidence to record:**
- Badge counter screenshots
- Unit test results

**Files touched:**
- `src/background/badge-manager.ts`
- `src/background/service-worker.ts`
- `tests/unit/badge-manager.test.ts` (new)

---

## Tests

### T10: Write unit tests for UI components
**Goal:** Test queue UI components in isolation

**Steps:**
1. Create `tests/unit/queue-ui.test.ts`
2. Write tests:
   - QueueStatusSection renders with items
   - QueueStatusSection hidden when queue empty
   - QueueItemList renders items in correct order
   - QueueItem displays correct status badge
   - QueueItem displays retry count when \u003e 0
   - QueueItem displays error message when failed
   - QueueItem retry button calls onRetry callback
   - QueueItem delete button calls onDelete callback
   - QueueItem shows loading state during operation
3. Run tests and verify all pass

**Done when:**
- All unit tests pass
- Code coverage \u003e80% for UI components

**Verify:**
- Run: `npm test -- tests/unit/queue-ui.test.ts`
- Verify all tests pass
- Check coverage report

**Evidence to record:**
- Test results output
- Coverage report

**Files touched:**
- `tests/unit/queue-ui.test.ts` (new)

---

### T11: Write unit tests for BadgeManager
**Goal:** Test badge counter logic

**Steps:**
1. Create `tests/unit/badge-manager.test.ts`
2. Write tests:
   - Badge text set to pending count
   - Badge hidden when queue empty
   - Badge color red when failed items exist
   - Badge updates on queue change event
3. Mock chrome.action API
4. Run tests and verify all pass

**Done when:**
- All unit tests pass
- Code coverage \u003e80% for BadgeManager

**Verify:**
- Run: `npm test -- tests/unit/badge-manager.test.ts`
- Verify all tests pass
- Check coverage report

**Evidence to record:**
- Test results output
- Coverage report

**Files touched:**
- `tests/unit/badge-manager.test.ts` (new)

---

### T12: Write integration tests for queue UI flow
**Goal:** Test end-to-end queue UI operations

**Steps:**
1. Create `tests/integration/queue-ui-flow.test.ts`
2. Write tests:
   - Queue UI updates when item added to queue
   - Queue UI updates when item status changes
   - Manual retry resets retry count and re-queues item
   - Manual delete removes item from queue and UI
   - Badge counter updates when queue changes
   - Empty state displayed when queue cleared
3. Run tests and verify all pass

**Done when:**
- All integration tests pass
- Tests cover all queue operations

**Verify:**
- Run: `npm test -- tests/integration/queue-ui-flow.test.ts`
- Verify all tests pass

**Evidence to record:**
- Test results output

**Files touched:**
- `tests/integration/queue-ui-flow.test.ts` (new)

---

## Verification

### T13: Manual verification - Queue status display
**Goal:** Verify queue status section displays correctly

**Steps:**
1. Open extension popup
2. Close Anytype Desktop
3. Save a bookmark
4. Verify queue status section appears with "1 pending capture"
5. Verify badge counter shows "1"
6. Verify queue item displayed with "Queued" status (blue badge)
7. Open Anytype Desktop
8. Verify item status changes to "Sending" then "Sent"
9. Verify badge counter updates to "0"
10. Verify queue status section hidden when queue empty

**Done when:**
- All steps verified successfully
- Screenshots captured

**Verify:**
- Visual inspection
- Badge counter accuracy
- Real-time updates

**Evidence to record:**
- Screenshots of each step
- Video recording of status changes

**Files touched:**
- None (manual verification)

---

### T14: Manual verification - Manual retry and delete
**Goal:** Verify manual retry and delete operations

**Steps:**
1. Queue a capture that will fail (close Anytype, queue item, modify queue item data to be invalid)
2. Wait for max retries (10 attempts) or manually set retryCount to 10
3. Verify item marked as "Failed" with error message
4. Click "Retry" button
5. Verify loading spinner shown
6. Verify retry count reset to 0
7. Verify status changed to "Queued"
8. Mark item as failed again
9. Click "Delete" button
10. Verify confirmation dialog shown
11. Confirm delete
12. Verify item removed from queue and UI
13. Verify badge counter updated

**Done when:**
- All steps verified successfully
- Screenshots captured

**Verify:**
- Visual inspection
- Retry operation works
- Delete operation works

**Evidence to record:**
- Screenshots of retry flow
- Screenshots of delete flow
- Video recording of operations

**Files touched:**
- None (manual verification)

---

### T15: Manual verification - Large queue performance
**Goal:** Verify UI performance with large queues

**Steps:**
1. Close Anytype Desktop
2. Queue 50 captures (use script or manual)
3. Open popup
4. Measure popup open time (should be \u003c300ms)
5. Measure queue UI render time (should be \u003c300ms)
6. Scroll through queue items
7. Verify smooth scrolling
8. Monitor CPU and memory usage

**Done when:**
- Popup opens within 300ms
- Queue UI renders within 300ms
- Scrolling is smooth
- No performance issues

**Verify:**
- Performance profiler in DevTools
- Visual inspection of scrolling
- CPU/memory monitoring

**Evidence to record:**
- Performance metrics screenshot
- Video of scrolling performance

**Files touched:**
- None (manual verification)

---

## Docs

### T16: Update README with queue UI documentation
**Goal:** Document queue UI features in README

**Steps:**
1. Add "Queue Status" section to README
2. Document:
   - Queue status display in popup
   - Badge counter on extension icon
   - Manual retry and delete operations
   - Queue item statuses
3. Add screenshots of queue UI

**Done when:**
- README updated with queue UI documentation
- Screenshots added

**Verify:**
- README renders correctly
- Screenshots display

**Evidence to record:**
- README update confirmation

**Files touched:**
- `README.md`

---

### T17: Update CHANGELOG
**Goal:** Document Epic 5.3 completion in CHANGELOG

**Steps:**
1. Add entry for Epic 5.3 under "Unreleased" or next version
2. Document:
   - Queue status display in popup
   - Badge counter on extension icon
   - Manual retry and delete operations
   - Real-time queue updates

**Done when:**
- CHANGELOG updated with Epic 5.3 entry

**Verify:**
- CHANGELOG renders correctly

**Evidence to record:**
- CHANGELOG update confirmation

**Files touched:**
- `CHANGELOG.md`

---

## Tracking

### T18: Update SPECS.md
**Goal:** Update specification index with Epic 5.3 status

**Steps:**
1. Update Epic 5.3 row in SPECS.md:
   - Status: "Done"
   - Next Task: "N/A"
   - Evidence: Link to spec.md#evidence
   - Latest Commit: [commit hash]
2. Update "Last Updated" timestamp
3. Update progress tracking counts

**Done when:**
- SPECS.md updated with Epic 5.3 completion
- Progress counts accurate

**Verify:**
- SPECS.md renders correctly
- Links work

**Evidence to record:**
- SPECS.md update confirmation

**Files touched:**
- `SPECS.md`

---

### T19: Update SPEC.md entrypoint
**Goal:** Update current focus to next epic

**Steps:**
1. Update SPEC.md:
   - Move Epic 5.3 to "Recent Completion"
   - Update "Current Focus" to next epic (6.0 or as directed)
   - Update active specification links
2. Commit changes

**Done when:**
- SPEC.md updated with next epic focus

**Verify:**
- SPEC.md renders correctly
- Links work

**Evidence to record:**
- SPEC.md update confirmation

**Files touched:**
- `SPEC.md`

---

### T20: Consolidate evidence in spec.md
**Goal:** Update spec.md with final evidence summary

**Steps:**
1. Update spec.md ## EVIDENCE section with:
   - Automated test results (unit, integration)
   - Manual verification results
   - Performance metrics
   - Screenshots and recordings
2. Link to verification evidence
3. Confirm all ACs verified

**Done when:**
- spec.md ## EVIDENCE section complete
- All ACs have verification evidence

**Verify:**
- spec.md renders correctly
- All evidence links work

**Evidence to record:**
- spec.md evidence section completion

**Files touched:**
- `specs/053-queue-ui/spec.md`

---

**End of Tasks**
