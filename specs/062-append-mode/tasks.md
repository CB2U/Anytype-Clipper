# Epic 6.2: Append Mode - Task Breakdown

**Status:** Not Started  
**Estimated Time:** 8-12 hours  
**Evidence:** [spec.md#evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/062-append-mode/spec.md#evidence)

---

## Prerequisites

### T0: API Research

**Goal:** Research Anytype Local API capabilities for object updates

**Steps:**
1. Review Anytype API documentation for object update endpoints
2. Test GET `/v1/spaces/{space_id}/objects/{object_id}` endpoint
3. Test PATCH `/v1/spaces/{space_id}/objects/{object_id}` endpoint
4. Determine which field stores object content (`description`, `content`, or `blocks`)
5. Test if PATCH supports partial updates or requires full object
6. Document findings in spec.md open questions

**Done When:**
- [ ] API endpoints tested and documented
- [ ] Content field identified
- [ ] Update strategy determined (append vs fetch-modify-update)
- [ ] Open questions resolved in spec.md

**Verify:**
- Manual API testing with curl or Postman
- Document API responses

**Evidence to Record:**
- API endpoint details
- Content field name
- Update strategy decision

**Files Touched:**
- `specs/062-append-mode/spec.md` (update open questions)

---

## Core Implementation

### T1: Create AppendService

**Goal:** Implement service to append content to existing objects

**Steps:**
1. Create `src/lib/services/append-service.ts`
2. Create `src/types/append.d.ts` with type definitions
3. Implement `formatAppendedContent()` method
   - Format with horizontal rule separator
   - Add timestamp (ISO 8601)
   - Add source link (URL + page title)
   - Format content based on capture type (bookmark/article/highlight)
4. Implement `fetchObjectContent()` method
   - Call Anytype GET API
   - Extract content field
   - Handle errors
5. Implement `appendToObject()` method
   - Fetch existing content
   - Format new content
   - Concatenate existing + new
   - Update via PATCH API
   - Handle errors
6. Add logging for debugging

**Done When:**
- [ ] AppendService class created
- [ ] All methods implemented
- [ ] Type definitions created
- [ ] Error handling implemented
- [ ] Logging added

**Verify:**
- Unit tests (T6)
- Manual testing with mock API

**Evidence to Record:**
- Service implementation details
- Content format examples

**Files Touched:**
- `src/lib/services/append-service.ts` (new)
- `src/types/append.d.ts` (new)

---

### T2: Modify DeduplicationService

**Goal:** Return duplicate object ID for append functionality

**Steps:**
1. Update `DuplicateCheckResult` interface to include `duplicateObjectId`
2. Modify `checkForDuplicates()` to extract and return object ID from API response
3. Update existing tests to handle new field
4. Add logging for object ID

**Done When:**
- [ ] Interface updated
- [ ] Object ID returned in duplicate check
- [ ] Existing tests updated
- [ ] Logging added

**Verify:**
- Existing unit tests pass
- New field populated in duplicate scenarios

**Evidence to Record:**
- Interface changes
- Object ID extraction logic

**Files Touched:**
- `src/lib/services/deduplication-service.ts` (modify)
- `src/types/deduplication.d.ts` (modify)
- `src/lib/services/deduplication-service.test.ts` (modify)

---

### T3: Update Duplicate Detection Dialog

**Goal:** Add "Append to Existing" button to duplicate dialog

**Steps:**
1. Locate duplicate dialog code in `src/popup/popup.ts`
2. Add third button: "Append to Existing"
3. Style button (use secondary button style)
4. Add click handler for append button
5. Pass duplicate object ID to handler
6. Show loading state during append operation
7. Display success/error messages

**Done When:**
- [ ] "Append" button added to dialog
- [ ] Click handler implemented
- [ ] Loading state shown
- [ ] Success/error messages displayed

**Verify:**
- Manual testing: trigger duplicate, verify button appears
- Click button, verify handler called

**Evidence to Record:**
- UI screenshot with 3 buttons
- User flow diagram

**Files Touched:**
- `src/popup/popup.ts` (modify)
- `src/popup/popup.css` (modify, if needed)

---

### T4: Service Worker Integration

**Goal:** Add append command handler to service worker

**Steps:**
1. Add `CMD_APPEND_TO_OBJECT` message handler in `src/service-worker.ts`
2. Instantiate AppendService
3. Extract parameters from message (spaceId, objectId, content, metadata)
4. Call `appendToObject()`
5. Return result to popup
6. Handle errors and return error messages

**Done When:**
- [ ] Message handler added
- [ ] AppendService integrated
- [ ] Error handling implemented
- [ ] Response sent to popup

**Verify:**
- Integration test (T7)
- Manual testing with popup

**Evidence to Record:**
- Message handler implementation
- Error handling approach

**Files Touched:**
- `src/service-worker.ts` (modify)

---

### T5: Popup Integration

**Goal:** Integrate append functionality into popup flow

**Steps:**
1. Add append handler function in `src/popup/popup.ts`
2. Collect current capture data (content, metadata)
3. Send `CMD_APPEND_TO_OBJECT` message to service worker
4. Handle response (success/error)
5. Show success message or error dialog
6. Close popup on success (optional)

**Done When:**
- [ ] Append handler implemented
- [ ] Message sent to service worker
- [ ] Response handled
- [ ] User feedback shown

**Verify:**
- Manual testing: append bookmark, verify success
- Manual testing: append highlight, verify success

**Evidence to Record:**
- Append flow implementation
- User feedback messages

**Files Touched:**
- `src/popup/popup.ts` (modify)

---

## Testing

### T6: Unit Tests for AppendService

**Goal:** Write comprehensive unit tests for AppendService

**Steps:**
1. Create `src/lib/services/append-service.test.ts`
2. Test `formatAppendedContent()` - bookmark format
3. Test `formatAppendedContent()` - article format
4. Test `formatAppendedContent()` - highlight format
5. Test `formatAppendedContent()` - timestamp format (ISO 8601)
6. Test `formatAppendedContent()` - source link format
7. Test `appendToObject()` - success scenario (mock API)
8. Test `appendToObject()` - API error scenario
9. Test `appendToObject()` - content concatenation
10. Test `fetchObjectContent()` - success
11. Test `fetchObjectContent()` - error

**Done When:**
- [ ] All tests written
- [ ] All tests passing
- [ ] Code coverage >80%

**Verify:**
- Run `npm test`
- Check coverage report

**Evidence to Record:**
- Test count
- Coverage percentage
- Test output

**Files Touched:**
- `src/lib/services/append-service.test.ts` (new)

---

### T7: Integration Tests

**Goal:** Test end-to-end append flow

**Steps:**
1. Create `tests/integration/append-flow.test.ts` (or add to existing file)
2. Test: Detect duplicate → Click append → Verify API call
3. Test: Multiple highlights to same object
4. Test: Append with API error (graceful degradation)
5. Mock Anytype API responses

**Done When:**
- [ ] Integration tests written
- [ ] All tests passing
- [ ] Mock API setup

**Verify:**
- Run integration tests
- Check test output

**Evidence to Record:**
- Integration test results
- Mock API setup

**Files Touched:**
- `tests/integration/append-flow.test.ts` (new or modify)

---

### T8: Manual Verification (AC17)

**Goal:** Verify AC17: Multiple highlights can be appended to same object

**Steps:**
1. Open article page in browser
2. Highlight text A, save to Anytype (creates new object)
3. Note object ID or title
4. Highlight text B on same page
5. Verify duplicate dialog appears
6. Click "Append to Existing"
7. Verify success message
8. Highlight text C on same page
9. Click "Append to Existing" again
10. Open object in Anytype
11. Verify all 3 highlights present
12. Verify each has timestamp and source link

**Done When:**
- [ ] All 3 highlights present in object
- [ ] Timestamps correct (ISO 8601)
- [ ] Source links present and clickable

**Verify:**
- Manual testing in browser
- Visual inspection in Anytype

**Evidence to Record:**
- Screenshot of object with 3 highlights
- Timestamp and source link format

**Files Touched:**
- None (manual testing only)

---

### T9: Manual Verification (AC-A1)

**Goal:** Verify AC-A1: "Append to Existing" button appears when duplicate detected

**Steps:**
1. Capture bookmark from URL A (creates object)
2. Capture bookmark from URL A again
3. Verify duplicate dialog appears
4. Verify 3 buttons present: Skip, Create Anyway, Append to Existing

**Done When:**
- [ ] Duplicate dialog shows 3 buttons
- [ ] "Append" button styled correctly
- [ ] Button labels clear

**Verify:**
- Manual testing in browser
- Screenshot of dialog

**Evidence to Record:**
- Screenshot of duplicate dialog with 3 buttons

**Files Touched:**
- None (manual testing only)

---

### T10: Manual Verification (AC-A2)

**Goal:** Verify AC-A2: Appending does not overwrite or corrupt existing object content

**Steps:**
1. Create bookmark with title "Original" and note "Original content"
2. Note object ID
3. Capture same URL again with note "Appended content"
4. Click "Append to Existing"
5. Open object in Anytype
6. Verify title remains "Original"
7. Verify "Original content" still present
8. Verify "Appended content" present
9. Verify no corruption or data loss

**Done When:**
- [ ] Original content preserved
- [ ] Appended content present
- [ ] No data corruption

**Verify:**
- Manual testing in browser
- Visual inspection in Anytype

**Evidence to Record:**
- Screenshot of object with both contents
- Confirmation of no data loss

**Files Touched:**
- None (manual testing only)

---

### T11: Manual Verification (AC-A3)

**Goal:** Verify AC-A3: Appended content includes timestamp and source link

**Steps:**
1. Append content to existing object (any method)
2. Open object in Anytype
3. Verify appended section has timestamp
4. Verify timestamp format is ISO 8601 (e.g., 2026-01-04T18:00:00Z)
5. Verify source link present
6. Click source link, verify it opens correct URL

**Done When:**
- [ ] Timestamp present and correct format
- [ ] Source link present and clickable
- [ ] Source link opens correct URL

**Verify:**
- Manual testing in browser
- Visual inspection in Anytype

**Evidence to Record:**
- Screenshot of appended content with timestamp and link
- Confirmation of link functionality

**Files Touched:**
- None (manual testing only)

---

## Documentation & Tracking

### T12: Update README

**Goal:** Document append mode feature in README

**Steps:**
1. Add "Append Mode" to features list
2. Add brief description of functionality
3. Update status section

**Done When:**
- [ ] README updated
- [ ] Feature documented

**Verify:**
- Read README, verify clarity

**Evidence to Record:**
- README diff

**Files Touched:**
- `README.md` (modify)

---

### T13: Update SPECS.md

**Goal:** Mark Epic 6.2 as Done in SPECS.md

**Steps:**
1. Update status to "Done"
2. Clear "Next Task" field
3. Add evidence link

**Done When:**
- [ ] Status updated
- [ ] Evidence link added

**Verify:**
- Read SPECS.md, verify accuracy

**Evidence to Record:**
- SPECS.md update

**Files Touched:**
- `SPECS.md` (modify)

---

### T14: Update SPEC.md

**Goal:** Update active specification pointer

**Steps:**
1. Update SPEC.md to show Epic 6.2 as complete
2. Add completion date
3. Suggest next epic

**Done When:**
- [ ] SPEC.md updated
- [ ] Completion date added

**Verify:**
- Read SPEC.md, verify accuracy

**Evidence to Record:**
- SPEC.md update

**Files Touched:**
- `SPEC.md` (modify)

---

### T15: Update tasks.md

**Goal:** Mark all tasks as complete

**Steps:**
1. Update task statuses to complete
2. Add actual time spent
3. Update evidence section

**Done When:**
- [ ] All tasks marked complete
- [ ] Actual time recorded

**Verify:**
- Read tasks.md, verify all tasks complete

**Evidence to Record:**
- Final task status

**Files Touched:**
- `specs/062-append-mode/tasks.md` (modify)

---

## Task Dependencies

```
T0 (API Research)
 ↓
T1 (AppendService) ← T2 (DeduplicationService)
 ↓                    ↓
T4 (Service Worker) ←┘
 ↓
T3 (Duplicate Dialog) → T5 (Popup Integration)
 ↓
T6 (Unit Tests) → T7 (Integration Tests)
 ↓
T8-T11 (Manual Verification)
 ↓
T12-T15 (Documentation)
```

---

## Estimated Timeline

- **T0:** 1-2 hours (API research)
- **T1:** 2-3 hours (AppendService)
- **T2:** 1 hour (DeduplicationService)
- **T3:** 1-2 hours (Duplicate Dialog)
- **T4:** 1 hour (Service Worker)
- **T5:** 1 hour (Popup Integration)
- **T6:** 2 hours (Unit Tests)
- **T7:** 1 hour (Integration Tests)
- **T8-T11:** 1 hour (Manual Verification)
- **T12-T15:** 30 minutes (Documentation)

**Total:** 11.5-14.5 hours
