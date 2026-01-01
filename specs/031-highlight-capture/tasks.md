# Tasks: Highlight Capture

## Setup

- [ ] T1: Create content script file structure <!-- id: 0 -->
  - **Goal:** Set up content script module for highlight capture
  - **Steps:**
    1. Create `src/content/highlight-capture.ts`
    2. Create `src/content/types.ts` for message types
    3. Update `vite.config.ts` to include content script in build
  - **Done when:** Files created, build configuration updated
  - **Verify:** `npm run build` succeeds, content script appears in `dist/`
  - **Evidence:** Build output shows content script compiled
  - **Files touched:** `src/content/highlight-capture.ts`, `src/content/types.ts`, `vite.config.ts`

- [ ] T2: Update manifest.json for content script permissions <!-- id: 1 -->
  - **Goal:** Add required permissions and declare content script
  - **Steps:**
    1. Add `contextMenus` permission to `manifest.json`
    2. Add `scripting` permission for dynamic injection
    3. Verify `activeTab` permission already exists
  - **Done when:** Manifest includes all required permissions
  - **Verify:** Extension loads without permission errors
  - **Evidence:** Chrome extension loads successfully
  - **Files touched:** `src/manifest.json`

## Core Implementation

- [ ] T3: Implement context menu registration <!-- id: 2 -->
  - **Goal:** Register "Send selection to Anytype" context menu item
  - **Steps:**
    1. Add context menu creation in `src/background/service-worker.ts`
    2. Register on extension install/update
    3. Show only when text is selected (`contexts: ['selection']`)
    4. Add click handler to trigger highlight capture
  - **Done when:** Context menu appears on text selection
  - **Verify:** Right-click on selected text shows menu item
  - **Evidence:** Screenshot of context menu
  - **Files touched:** `src/background/service-worker.ts`

- [ ] T4: Implement content script for selection capture <!-- id: 3 -->
  - **Goal:** Create content script to extract quote and context
  - **Steps:**
    1. Implement `getSelectedText()` using `window.getSelection()`
    2. Implement `extractContext(selection, beforeChars, afterChars)`
    3. Handle edge cases (start/end of document)
    4. Extract page metadata (URL, title)
    5. Send message to background worker
  - **Done when:** Content script captures selection + context
  - **Verify:** Unit tests pass for `extractContext()`
  - **Evidence:** Test results
  - **Files touched:** `src/content/highlight-capture.ts`

- [ ] T5: Implement content script injection handler <!-- id: 4 -->
  - **Goal:** Inject content script on context menu click
  - **Steps:**
    1. Add `chrome.scripting.executeScript` call in context menu handler
    2. Pass tab ID and target frame
    3. Handle injection errors gracefully
    4. Receive message from content script
  - **Done when:** Content script injects and sends data to background
  - **Verify:** Console shows message received from content script
  - **Evidence:** Debug log entry
  - **Files touched:** `src/background/service-worker.ts`

- [ ] T6: Extend popup UI for highlight preview <!-- id: 5 -->
  - **Goal:** Add highlight-specific fields to popup
  - **Steps:**
    1. Add quote preview field (read-only textarea)
    2. Add context preview field (read-only, smaller)
    3. Add source URL display (read-only)
    4. Detect highlight capture mode vs bookmark mode
    5. Show/hide fields based on mode
  - **Done when:** Popup displays highlight data correctly
  - **Verify:** Manual test - popup shows quote, context, URL
  - **Evidence:** Screenshot of popup with highlight data
  - **Files touched:** `src/popup/popup.html`, `src/popup/popup.ts`, `src/popup/popup.css`

- [ ] T7: Implement highlight object creation <!-- id: 6 -->
  - **Goal:** Create Anytype object for highlight
  - **Steps:**
    1. Define highlight object schema in `src/lib/api/types.ts`
    2. Map quote + context to object body (formatted)
    3. Map URL, page title to properties
    4. Use existing `AnytypeApiClient.createObject` method
    5. Handle tags (append to body if needed, based on 034 learnings)
  - **Done when:** Highlight object created in Anytype
  - **Verify:** Manual test - object appears in Anytype Desktop
  - **Evidence:** Screenshot of Anytype object
  - **Files touched:** `src/lib/api/types.ts`, `src/popup/popup.ts`

## Tests

- [ ] T8: Write unit tests for context extraction <!-- id: 7 -->
  - **Goal:** Test edge cases for context extraction
  - **Steps:**
    1. Create `tests/unit/highlight-capture.test.ts`
    2. Test: selection at document start (no before context)
    3. Test: selection at document end (no after context)
    4. Test: selection < 50 chars total
    5. Test: selection with special characters (quotes, newlines)
    6. Test: empty selection
  - **Done when:** All unit tests pass
  - **Verify:** `npm test -- highlight-capture.test.ts`
  - **Evidence:** Test output showing 6+ passing tests
  - **Files touched:** `tests/unit/highlight-capture.test.ts`

- [ ] T9: Write integration test for highlight flow <!-- id: 8 -->
  - **Goal:** Test end-to-end highlight capture flow
  - **Steps:**
    1. Create `tests/integration/highlight-flow.test.ts`
    2. Mock content script message
    3. Verify popup opens with correct data
    4. Mock user input (tags, notes)
    5. Verify API call payload
    6. Verify success notification
  - **Done when:** Integration test passes
  - **Verify:** `npm test -- highlight-flow.test.ts`
  - **Evidence:** Test output
  - **Files touched:** `tests/integration/highlight-flow.test.ts`

## Verification

- [ ] T10: Manual verification - Basic highlight capture <!-- id: 9 -->
  - **Goal:** Verify basic highlight capture works end-to-end
  - **Steps:**
    1. Build extension: `npm run build`
    2. Load unpacked in Brave
    3. Navigate to https://example.com
    4. Select paragraph (100+ chars)
    5. Right-click → "Send selection to Anytype"
    6. Verify popup shows quote, context, URL, title
    7. Add tags: "test", "highlight"
    8. Add note: "Testing highlight capture"
    9. Click "Save"
    10. Open Anytype Desktop
    11. Verify highlight object created with all properties
  - **Done when:** Highlight object appears in Anytype with correct data
  - **Verify:** Visual inspection in Anytype Desktop
  - **Evidence:** Screenshot of Anytype object + properties
  - **Files touched:** N/A (manual test)

- [ ] T11: Manual verification - Edge case testing <!-- id: 10 -->
  - **Goal:** Verify edge cases work correctly
  - **Steps:**
    1. Test selection at document start (first sentence)
    2. Test selection at document end (last sentence)
    3. Test very short selection (< 10 chars)
    4. Test selection with special characters (quotes, emojis)
    5. Test on different page types (static HTML, React SPA)
  - **Done when:** All edge cases handled gracefully
  - **Verify:** Visual inspection + no console errors
  - **Evidence:** Notes documenting edge case results
  - **Files touched:** N/A (manual test)

- [ ] T12: Performance verification <!-- id: 11 -->
  - **Goal:** Verify PERF-5 compliance (no page load impact)
  - **Steps:**
    1. Open Chrome DevTools → Performance tab
    2. Navigate to complex page (GitHub repo)
    3. Start performance recording
    4. Select text and trigger highlight capture
    5. Stop recording
    6. Verify content script execution < 50ms
    7. Verify no layout thrashing
    8. Verify no console errors
  - **Done when:** Performance metrics meet PERF-5 threshold
  - **Verify:** DevTools performance profile
  - **Evidence:** Screenshot of performance profile
  - **Files touched:** N/A (manual test)

## Documentation

- [ ] T13: Update README with highlight capture feature <!-- id: 12 -->
  - **Goal:** Document highlight capture for users
  - **Steps:**
    1. Add "Highlight Capture" section to README
    2. Include screenshot of context menu
    3. Document keyboard workflow
    4. Add troubleshooting tips
  - **Done when:** README includes highlight capture documentation
  - **Verify:** README renders correctly on GitHub
  - **Evidence:** README diff
  - **Files touched:** `README.md`

## Tracking

- [ ] T14: Update SPECS.md with progress <!-- id: 13 -->
  - **Goal:** Mark Epic 3.1 as complete in index
  - **Steps:**
    1. Update `SPECS.md` row for 3.1:
       - Status: "Done"
       - Next Task: "N/A"
       - Latest Commit: `<commit hash>`
       - Evidence Link: `specs/031-highlight-capture/spec.md#evidence`
    2. Recompute progress summary
    3. Update "Last Updated" timestamp
  - **Done when:** SPECS.md reflects completion
  - **Verify:** Visual inspection of SPECS.md
  - **Evidence:** SPECS.md diff
  - **Files touched:** `SPECS.md`

- [ ] T15: Consolidate evidence in spec.md <!-- id: 14 -->
  - **Goal:** Document all verification results
  - **Steps:**
    1. Add ## EVIDENCE section to `specs/031-highlight-capture/spec.md`
    2. Document task completion (T1-T14)
    3. Document AC verification results (AC3, AC3.1, AC3.2, AC3.3)
    4. Include screenshots and test outputs
    5. Document any issues encountered and resolutions
  - **Done when:** Evidence section complete and comprehensive
  - **Verify:** Spec.md has complete evidence trail
  - **Evidence:** Spec.md diff
  - **Files touched:** `specs/031-highlight-capture/spec.md`

