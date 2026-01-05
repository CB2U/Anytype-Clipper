# Tasks: Notifications System

**Spec Reference:** [spec.md](./spec.md)  
**Plan Reference:** [plan.md](./plan.md)  
**Epic:** 7.3 Notifications System

---

## Setup

### [x] T1: Create Notification Types and Interfaces
**Goal:** Define TypeScript interfaces for all notification types and events

**Steps:**
1. Create `src/types/notifications.ts`
2. Define `Notification` interface with all required fields
3. Define `NotificationType` enum (success, error, warning, info)
4. Define `NotificationSeverity` enum (low, medium, high)
5. Define `NotificationAction` interface for buttons
6. Define `NotificationLink` interface for deep links
7. Define notification event types (create, dismiss, action)
8. Export all types

**Done when:**
- All notification types defined with JSDoc comments
- TypeScript strict mode passes
- No `any` types used
- Types exported from index

**Verify:**
- Run `npm run type-check`
- Review types in IDE for autocomplete

**Evidence to record:**
- TypeScript compilation success
- Type definitions file created

**Files touched:**
- `src/types/notifications.ts` (new)
- `src/types/index.ts` (update exports)

---

### [x] T2: Create Error Sanitizer Utility
**Goal:** Implement error sanitization to remove sensitive data from error messages

**Steps:**
1. Create `src/lib/utils/error-sanitizer.ts`
2. Implement `sanitizeError(error: Error): SanitizedError` function
3. Remove stack traces from error messages
4. Remove API keys, tokens, PII using regex patterns
5. Map error types to user-friendly messages
6. Generate actionable next steps based on error type
7. Add JSDoc comments
8. Export sanitizer function

**Done when:**
- Error sanitizer removes all sensitive data
- User-friendly messages generated for common errors
- Next steps provided for each error type
- Unit tests written and passing

**Verify:**
- Run `npm test -- error-sanitizer.test.ts`
- Manual test: trigger errors and verify sanitized output

**Evidence to record:**
- Unit test results (>80% coverage)
- Manual test screenshots

**Files touched:**
- `src/lib/utils/error-sanitizer.ts` (new)
- `tests/unit/error-sanitizer.test.ts` (new)

---

## Core Implementation

### [x] T3: Implement NotificationService
**Goal:** Create centralized notification management service

**Steps:**
1. Create `src/lib/notifications/notification-service.ts`
2. Implement `NotificationService` class with singleton pattern
3. Add `createNotification(notification: Notification)` method
4. Add `dismissNotification(id: string)` method
5. Add `clearAll()` method
6. Implement notification queue (max 3 visible)
7. Implement auto-dismiss timer for success notifications (5s)
8. Add event emitter for notification events
9. Add JSDoc comments
10. Export service instance

**Done when:**
- NotificationService manages notification lifecycle
- Queue limits enforced (max 3 visible)
- Auto-dismiss works for success notifications
- Event emitter broadcasts notification events
- Unit tests written and passing

**Verify:**
- Run `npm test -- notification-service.test.ts`
- Manual test: create multiple notifications and verify queue behavior

**Evidence to record:**
- Unit test results
- Queue behavior screenshots

**Files touched:**
- `src/lib/notifications/notification-service.ts` (new)
- `tests/unit/notification-service.test.ts` (new)

---

### [x] T4: Create Notification UI Component
**Goal:** Build reusable notification component for popup UI

**Steps:**
1. Create `src/popup/components/notification.ts`
2. Create `src/popup/components/notification.css`
3. Implement notification rendering with color-coded styling
4. Add icon for each notification type (checkmark, error, warning, info)
5. Add close button (X) with click handler
6. Implement fade-out animation for auto-dismiss (300ms)
7. Add keyboard navigation (Tab, Escape, Enter)
8. Add ARIA live region for screen reader support
9. Add ARIA labels for all interactive elements
10. Implement notification action buttons
11. Implement notification links (deep links or instructions)
12. Add high contrast mode support

**Done when:**
- Notification component renders all notification types
- Color-coded styling matches design (green, red, yellow, blue)
- Icons display correctly
- Close button works
- Fade-out animation smooth
- Keyboard navigation functional
- Screen reader announces notifications

**Verify:**
- Manual test: render each notification type
- Manual test: keyboard navigation (Tab, Escape, Enter)
- Manual test: screen reader (NVDA/Orca)

**Evidence to record:**
- Screenshots of each notification type
- Keyboard navigation video
- Screen reader test results

**Files touched:**
- `src/popup/components/notification.ts` (new)
- `src/popup/components/notification.css` (new)
- `src/popup/popup.ts` (update to integrate component)

---

### [x] T5: Integrate Success Notifications
**Goal:** Add success notifications to all capture flows

**Steps:**
1. Update `src/background/service-worker.ts` to emit success events
2. Add success notification for bookmark capture
3. Add success notification for highlight capture
4. Add success notification for article capture
5. Include capture type in notification title
6. Include word count for article captures
7. Add deep link to view in Anytype (if supported) or instruction
8. Test auto-dismiss after 5 seconds
9. Test manual dismiss via close button

**Done when:**
- Success notifications appear for all capture types
- Notifications include correct capture type and metadata
- Deep links work (or instructions shown)
- Auto-dismiss after 5 seconds
- Manual dismiss works

**Verify:**
- Manual test: capture bookmark, verify success notification
- Manual test: capture article, verify word count shown
- Manual test: verify auto-dismiss after 5 seconds

**Evidence to record:**
- Screenshots of success notifications for each capture type
- Auto-dismiss video

**Files touched:**
- `src/background/service-worker.ts` (update)
- `src/background/capture-handlers.ts` (update)

---

### [x] T6: Integrate Error Notifications
**Goal:** Add error notifications with actionable next steps

**Steps:**
1. Update error handling in `src/background/service-worker.ts`
2. Categorize errors (AuthError, NetworkError, ValidationError, APIError)
3. Use ErrorSanitizer to sanitize error messages
4. Generate actionable next steps based on error type
5. Add "View Queue" button for network errors
6. Add "Re-authenticate" button for auth errors
7. Test error notification persistence (manual dismiss only)
8. Test error notification actions

**Done when:**
- Error notifications appear for all error types
- Error messages sanitized (no stack traces, API keys)
- Actionable next steps provided
- Error notification buttons work
- Notifications persist until manually dismissed

**Verify:**
- Manual test: stop Anytype, attempt capture, verify error notification
- Manual test: invalidate API key, verify re-auth notification
- Manual test: verify error messages sanitized

**Evidence to record:**
- Screenshots of error notifications for each error type
- Error sanitization test results

**Files touched:**
- `src/background/service-worker.ts` (update)
- `src/background/error-handler.ts` (new or update)

---

### [x] T7: Integrate Queued Notifications
**Goal:** Add notifications when captures are queued due to offline status

**Steps:**
1. Update `src/background/queue-manager.ts` to emit queued events
2. Add queued notification when Anytype is unreachable
3. Include queue count in notification message
4. Add "View Queue" button to open queue UI
5. Test queued notification appears when Anytype offline
6. Test queue count updates correctly

**Done when:**
- Queued notifications appear when Anytype offline
- Queue count shown in notification
- "View Queue" button opens queue UI
- Notification auto-dismisses after 5 seconds

**Verify:**
- Manual test: stop Anytype, capture multiple items, verify queued notifications
- Manual test: verify queue count accuracy

**Evidence to record:**
- Screenshots of queued notifications
- Queue count verification

**Files touched:**
- `src/background/queue-manager.ts` (update)
- `src/popup/popup.ts` (update to handle "View Queue" action)

---

### [x] T8: Integrate Re-authentication Notifications
**Goal:** Add non-intrusive re-auth notifications when 401 detected

**Steps:**
1. Update `src/background/auth-manager.ts` to emit re-auth events
2. Add re-auth notification when 401 detected
3. Add "Re-authenticate" button to trigger auth flow
4. Queue captures during re-auth (don't block user)
5. Auto-dismiss re-auth notification when re-auth completes
6. Test re-auth notification appears on 401
7. Test captures queued during re-auth

**Done when:**
- Re-auth notification appears on 401
- "Re-authenticate" button triggers auth flow
- Captures queued during re-auth
- Notification dismisses when re-auth completes

**Verify:**
- Manual test: invalidate API key, attempt capture, verify re-auth notification
- Manual test: verify captures queued during re-auth

**Evidence to record:**
- Screenshots of re-auth notification
- Re-auth flow video

**Files touched:**
- `src/background/auth-manager.ts` (update)
- `src/popup/popup.ts` (update to handle "Re-authenticate" action)

---

### [x] T9: Integrate Extraction Quality Feedback
**Goal:** Add quality indicators for article extraction

**Steps:**
1. Update `src/lib/extractors/article-extractor.ts` to return quality level
2. Add quality level to article capture response
3. Map quality level to notification type:
   - Level 1 (Readability) → Green: "Article captured (X words)"
   - Level 2 (Fallback 1/2) → Yellow: "Article captured (simplified)"
   - Level 3 (Fallback 3) → Orange: "Saved as bookmark - extraction failed"
4. Add "Retry extraction" button for yellow/orange notifications
5. Test quality indicators for each extraction level
6. Test "Retry extraction" button

**Done when:**
- Quality indicators appear for article captures
- Color-coded notifications match extraction level
- "Retry extraction" button works for fallback extractions
- Word count shown for successful extractions

**Verify:**
- Manual test: capture article with good structure, verify green notification
- Manual test: capture complex SPA, verify yellow notification
- Manual test: capture page that fails extraction, verify orange notification

**Evidence to record:**
- Screenshots of each quality level notification
- Retry extraction test results

**Files touched:**
- `src/lib/extractors/article-extractor.ts` (update)
- `src/background/capture-handlers.ts` (update)
- `src/popup/popup.ts` (update to handle "Retry extraction" action)

---

### [x] T10: Integrate Duplicate Detection Warnings
**Goal:** Add warnings when duplicate URLs detected

**Steps:**
1. Update `src/lib/deduplication/url-deduplicator.ts` to return duplicate info
2. Add duplicate warning in popup before capture
3. Show existing object title, type, and creation date
4. Add user choice buttons: Skip, Create Anyway, Append
5. Test duplicate detection for exact matches
6. Test duplicate detection for URL variations (http/https, trailing slash, www)
7. Test each user choice action

**Done when:**
- Duplicate warning appears when duplicate URL detected
- Existing object info shown (title, type, date)
- User choice buttons work (Skip, Create Anyway, Append)
- URL normalization rules respected

**Verify:**
- Manual test: capture same URL twice, verify warning appears
- Manual test: capture http and https versions, verify detected as duplicate
- Manual test: test each user choice (Skip, Create Anyway, Append)

**Evidence to record:**
- Screenshots of duplicate warning
- URL variation test results
- User choice action videos

**Files touched:**
- `src/lib/deduplication/url-deduplicator.ts` (update)
- `src/popup/popup.ts` (update to show duplicate warning)

---

## Tests

### T11: Write Unit Tests for NotificationService
**Goal:** Achieve >80% test coverage for NotificationService

**Steps:**
1. Create `tests/unit/notification-service.test.ts`
2. Test notification creation (all types)
3. Test notification dismissal (manual and auto)
4. Test notification queue (max 3 visible)
5. Test auto-dismiss timer (5 seconds for success)
6. Test event emitter (create, dismiss, action events)
7. Test edge cases (null/undefined inputs, empty queue)
8. Run tests and verify >80% coverage

**Done when:**
- All unit tests passing
- >80% code coverage for NotificationService
- Edge cases tested

**Verify:**
- Run `npm test -- notification-service.test.ts`
- Run `npm run coverage` and verify >80%

**Evidence to record:**
- Test results screenshot
- Coverage report

**Files touched:**
- `tests/unit/notification-service.test.ts` (new)

---

### T12: Write Unit Tests for ErrorSanitizer
**Goal:** Achieve >80% test coverage for ErrorSanitizer

**Steps:**
1. Create `tests/unit/error-sanitizer.test.ts`
2. Test sanitization of various error types (AuthError, NetworkError, APIError)
3. Test removal of stack traces
4. Test removal of API keys and tokens
5. Test removal of PII
6. Test user-friendly message mapping
7. Test next steps generation
8. Run tests and verify >80% coverage

**Done when:**
- All unit tests passing
- >80% code coverage for ErrorSanitizer
- Sensitive data removal verified

**Verify:**
- Run `npm test -- error-sanitizer.test.ts`
- Run `npm run coverage` and verify >80%

**Evidence to record:**
- Test results screenshot
- Coverage report

**Files touched:**
- `tests/unit/error-sanitizer.test.ts` (new)

---

### T13: Write Integration Tests for Notification Flows
**Goal:** Test end-to-end notification flows

**Steps:**
1. Create `tests/integration/notification-flow.test.ts`
2. Test success notification flow (capture → notification → auto-dismiss)
3. Test error notification flow (capture fails → error notification → manual dismiss)
4. Test queued notification flow (Anytype offline → queued notification)
5. Test duplicate warning flow (duplicate detected → warning → user choice)
6. Test re-auth notification flow (401 → re-auth notification → queue captures)
7. Run tests and verify all passing

**Done when:**
- All integration tests passing
- All notification flows tested end-to-end

**Verify:**
- Run `npm test -- notification-flow.test.ts`

**Evidence to record:**
- Test results screenshot

**Files touched:**
- `tests/integration/notification-flow.test.ts` (new)

---

## Docs

### T14: Update README with Notification Features
**Goal:** Document notification system for users

**Steps:**
1. Open `README.md`
2. Add section "Notifications" under "Features"
3. Document success notifications with deep links
4. Document error notifications with next steps
5. Document extraction quality feedback
6. Document queued notifications
7. Document duplicate warnings
8. Add screenshots of each notification type
9. Commit changes

**Done when:**
- README updated with notification documentation
- Screenshots included
- User-facing language clear and concise

**Verify:**
- Review README in browser
- Verify screenshots display correctly

**Evidence to record:**
- README diff
- Screenshot of updated README

**Files touched:**
- `README.md` (update)

---

### T15: Update CHANGELOG
**Goal:** Document notification system in changelog

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry under "Unreleased" or next version
3. Document new notification features:
   - Success notifications with deep links
   - Error notifications with actionable next steps
   - Extraction quality feedback (green/yellow/orange)
   - Queued notifications
   - Re-authentication notifications
   - Duplicate detection warnings
4. Commit changes

**Done when:**
- CHANGELOG updated with notification features
- Entry follows existing format

**Verify:**
- Review CHANGELOG for completeness

**Evidence to record:**
- CHANGELOG diff

**Files touched:**
- `CHANGELOG.md` (update)

---

## Verification

### T16: Manual Verification - Success Notifications
**Goal:** Verify success notifications work for all capture types

**Steps:**
1. Load extension in Brave browser
2. Open popup and capture a bookmark
3. Verify green success notification appears with:
   - "Bookmark saved" message
   - Link to view in Anytype (or instruction)
   - Auto-dismisses after 5 seconds
4. Capture a highlight
5. Verify success notification appears with "Highlight saved"
6. Capture an article
7. Verify success notification appears with "Article captured (X words)"
8. Test manual dismiss via close button
9. Test manual dismiss via Escape key
10. Document results with screenshots

**Done when:**
- All success notifications verified
- Auto-dismiss works
- Manual dismiss works
- Screenshots captured

**Verify:**
- Visual inspection of notifications
- Timer verification (5 seconds)

**Evidence to record:**
- Screenshots of each notification type
- Auto-dismiss video

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

### T17: Manual Verification - Error Notifications
**Goal:** Verify error notifications provide actionable guidance

**Steps:**
1. Stop Anytype Desktop
2. Open popup and attempt to capture a bookmark
3. Verify red error notification appears with:
   - "Anytype is not running" message
   - "Start Anytype Desktop and try again" next step
   - "View Queue" button
4. Click "View Queue" and verify queue UI opens
5. Invalidate API key (manually edit chrome.storage.local)
6. Attempt capture and verify re-auth notification appears
7. Trigger validation error (e.g., empty title)
8. Verify validation error notification appears
9. Document results with screenshots

**Done when:**
- All error types verified
- Error messages sanitized (no stack traces)
- Actionable next steps provided
- Screenshots captured

**Verify:**
- Visual inspection of error notifications
- Error message sanitization

**Evidence to record:**
- Screenshots of each error type
- Error sanitization verification

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

### T18: Manual Verification - Extraction Quality Feedback
**Goal:** Verify quality indicators match extraction level

**Steps:**
1. Capture an article with good structure (e.g., blog post from Medium)
2. Verify green notification: "Article captured (X words)"
3. Capture a complex SPA page (e.g., Twitter, Reddit)
4. Verify yellow notification: "Article captured (simplified)"
5. Capture a page that fails all extraction (e.g., login page, image gallery)
6. Verify orange notification: "Saved as bookmark - extraction failed"
7. Click "Retry extraction" on yellow/orange notification
8. Verify retry works
9. Document results with screenshots

**Done when:**
- All quality levels verified
- Color-coded notifications correct
- Retry extraction works
- Screenshots captured

**Verify:**
- Visual inspection of quality indicators
- Retry extraction functionality

**Evidence to record:**
- Screenshots of each quality level
- Retry extraction video

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

### T19: Manual Verification - Keyboard Navigation
**Goal:** Verify full keyboard navigation support

**Steps:**
1. Open popup and trigger a notification
2. Press Tab - verify focus moves to notification buttons
3. Press Enter - verify button action executes
4. Trigger another notification
5. Press Escape - verify notification dismisses
6. Verify focus returns to previous element
7. Test keyboard navigation for all notification types
8. Document results with video

**Done when:**
- Keyboard navigation works for all notifications
- Tab, Enter, Escape keys functional
- Focus management correct
- Video captured

**Verify:**
- Keyboard-only testing (no mouse)

**Evidence to record:**
- Keyboard navigation video

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

### T20: Manual Verification - Screen Reader Support
**Goal:** Verify screen reader announces notifications correctly

**Steps:**
1. Enable screen reader (NVDA on Windows, Orca on Linux)
2. Trigger success notification
3. Verify screen reader announces: "Success: Bookmark saved"
4. Trigger error notification
5. Verify screen reader announces: "Error: Anytype is not running"
6. Trigger warning notification
7. Verify screen reader announces: "Warning: This URL was already captured"
8. Trigger info notification
9. Verify screen reader announces: "Info: Capture queued"
10. Verify notification type is identified (success, error, warning, info)
11. Document results with audio recording or notes

**Done when:**
- Screen reader announces all notification types
- Notification type identified correctly
- ARIA labels functional
- Results documented

**Verify:**
- Screen reader testing (NVDA/Orca)

**Evidence to record:**
- Screen reader test notes
- Audio recording (optional)

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

## Tracking

### T21: Update SPECS.md
**Goal:** Update specification index with notification system status

**Steps:**
1. Open `SPECS.md`
2. Update row for Epic 7.3 (Notifications System):
   - Status: "Implementing" → "Testing" → "Done"
   - Next task: Current task ID
   - Evidence link: `specs/073-notifications/spec.md#evidence`
3. Update "Last Updated" timestamp
4. Commit changes

**Done when:**
- SPECS.md updated with current status
- Evidence link correct
- Timestamp updated

**Verify:**
- Review SPECS.md for accuracy

**Evidence to record:**
- SPECS.md diff

**Files touched:**
- `SPECS.md` (update)

---

### T22: Update SPEC.md (Current Work Pointer)
**Goal:** Update current work pointer to notifications system

**Steps:**
1. Open `SPEC.md` (if exists)
2. Update "Current focus" to Epic 7.3: Notifications System
3. Link to `specs/073-notifications/spec.md`, `plan.md`, `tasks.md`
4. Set Status to "In progress"
5. Commit changes

**Done when:**
- SPEC.md updated with current focus
- Links correct
- Status updated

**Verify:**
- Review SPEC.md for accuracy

**Evidence to record:**
- SPEC.md diff

**Files touched:**
- `SPEC.md` (update)

---

### T23: Final Evidence Consolidation
**Goal:** Consolidate all verification evidence in spec.md

**Steps:**
1. Open `specs/073-notifications/spec.md`
2. Update EVIDENCE section with:
   - Task completion evidence (links to commits, test results)
   - AC verification results (screenshots, videos, test reports)
   - Manual test results (all verification tasks)
3. Add summary of implementation:
   - Components created
   - Tests written and passing
   - Manual verification completed
4. Add links to relevant commits
5. Commit changes

**Done when:**
- EVIDENCE section complete
- All ACs verified and documented
- Summary written
- Commit links added

**Verify:**
- Review EVIDENCE section for completeness

**Evidence to record:**
- spec.md EVIDENCE section

**Files touched:**
- `specs/073-notifications/spec.md` (update EVIDENCE section)

---

**End of Tasks**
