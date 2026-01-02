# Tasks: Fix Highlight Save Function

## Setup

### T1: Update TypeScript Types
**Goal:** Add `isHighlightCapture` flag to message payload types

**Steps:**
1. Open `src/types/messages.ts`
2. Locate `CaptureBookmarkPayload` interface
3. Add optional field: `isHighlightCapture?: boolean;`
4. Add optional fields for highlight data: `quote?: string; contextBefore?: string; contextAfter?: string;`
5. Save and verify TypeScript compilation

**Done when:**
- TypeScript types updated
- No compilation errors
- Types are properly exported

**Verify:**
```bash
npm run build
```

**Evidence to record:**
- Screenshot of updated type definition
- Successful build output

**Files touched:**
- `src/types/messages.ts`

---

## Core Implementation

### T2: Fix loadCurrentTab() to Skip Article Extraction for Highlights
**Goal:** Prevent article extraction when a highlight is being captured

**Steps:**
1. Open `src/popup/popup.ts`
2. Locate `loadCurrentTab()` function (around line 146)
3. Move the highlight check (`chrome.storage.local.get('lastHighlight')`) to the top of the function
4. Wrap the article/metadata extraction logic in a conditional: `if (!data.lastHighlight)`
5. Only call `CMD_EXTRACT_ARTICLE` and `CMD_EXTRACT_METADATA` if NOT in highlight mode
6. Ensure highlight mode still populates fields correctly

**Done when:**
- Article extraction is skipped when `lastHighlight` exists
- Highlight mode still works (quote, context displayed)
- Bookmark/article modes still extract metadata

**Verify:**
- Manual test: Select text, trigger highlight, verify popup shows quote
- Check browser console: Should NOT see "Requesting article from content script" for highlights

**Evidence to record:**
- Code diff showing conditional logic
- Console log screenshot showing no article extraction for highlights

**Files touched:**
- `src/popup/popup.ts`

---

### T3: Update handleSave() to Pass Highlight Flag
**Goal:** Add `isHighlightCapture` flag to payload when saving highlights

**Steps:**
1. Open `src/popup/popup.ts`
2. Locate `handleSave()` function (around line 254)
3. In the payload construction (around line 294), add:
   ```typescript
   if (isHighlight) {
     payload.isHighlightCapture = true;
     payload.quote = currentHighlight.quote;
     payload.contextBefore = currentHighlight.contextBefore;
     payload.contextAfter = currentHighlight.contextAfter;
     payload.url = currentHighlight.url;
   } else {
     payload.isHighlightCapture = false;
   }
   ```
4. Ensure `metadata` object for highlights contains ONLY title and canonicalUrl (no content)
5. For highlights, create minimal metadata: `{ title, canonicalUrl: currentHighlight.url }`

**Done when:**
- Highlight payloads include `isHighlightCapture: true`
- Highlight payloads do NOT include `metadata.content`
- Article payloads include `isHighlightCapture: false`

**Verify:**
- Add console.log in handleSave to print payload
- Manual test: Save highlight, check console for payload structure

**Evidence to record:**
- Code diff showing payload construction
- Console log showing highlight payload with flag

**Files touched:**
- `src/popup/popup.ts`

---

### T4: Update BookmarkCaptureService to Handle Highlights
**Goal:** Use quote as content for highlights, not metadata.content

**Steps:**
1. Open `src/lib/capture/bookmark-capture-service.ts`
2. Locate `captureBookmark()` function signature (line 32)
3. Add parameter: `isHighlightCapture: boolean = false`
4. Add parameter: `quote?: string`
5. In the function body (around line 53-71), modify the article content logic:
   ```typescript
   if (typeKey === 'article' || typeKey === 'note') {
     if (isHighlightCapture && quote) {
       // For highlights, use the quote as the description
       createParams.description = quote;
     } else {
       // For articles, use the full content
       let articleBody = metadata.content || '';
       // ... existing article logic
       createParams.description = articleBody || createParams.description;
     }
   }
   ```
6. Ensure highlight path does NOT use `metadata.content` or `metadata.textContent`

**Done when:**
- Highlights use `quote` as description
- Articles use `metadata.content` as description
- No code path allows article content to leak into highlights

**Verify:**
- Unit test (T8)
- Manual test: Save highlight, verify only quote is saved

**Evidence to record:**
- Code diff showing conditional logic
- Test results

**Files touched:**
- `src/lib/capture/bookmark-capture-service.ts`

---

### T5: Update Service Worker to Pass Highlight Flag
**Goal:** Pass `isHighlightCapture` and `quote` through to BookmarkCaptureService

**Steps:**
1. Open `src/background/service-worker.ts`
2. Locate `CMD_CAPTURE_BOOKMARK` handler (line 182)
3. Destructure `isHighlightCapture` and `quote` from `message.payload`
4. Pass them to `bookmarkCaptureService.captureBookmark()`:
   ```typescript
   const { spaceId, metadata, userNote, tags, type_key, isHighlightCapture, quote } = message.payload;
   const result = await bookmarkCaptureService.captureBookmark(
     spaceId,
     metadata,
     userNote,
     tags,
     type_key,
     isHighlightCapture,
     quote
   );
   ```

**Done when:**
- Service worker passes all highlight-related fields
- No data is lost in the message passing

**Verify:**
- Add console.log in service worker to verify fields are received
- Manual test: Save highlight, check service worker console

**Evidence to record:**
- Code diff showing parameter passing
- Console log showing fields received

**Files touched:**
- `src/background/service-worker.ts`

---

## Tests

### T6: Write Unit Test for BookmarkCaptureService
**Goal:** Verify highlight vs article logic in captureBookmark()

**Steps:**
1. Create `tests/unit/bookmark-capture-service.test.ts`
2. Mock AnytypeApiClient, TagService, StorageManager
3. Write test case: "should use quote as description for highlights"
   - Call `captureBookmark()` with `isHighlightCapture=true` and `quote="Test quote"`
   - Verify `createObject()` is called with `description: "Test quote"`
4. Write test case: "should use metadata.content for articles"
   - Call `captureBookmark()` with `isHighlightCapture=false` and `metadata.content="Article content"`
   - Verify `createObject()` is called with `description: "Article content"`
5. Write test case: "should not use metadata.content for highlights"
   - Call with `isHighlightCapture=true`, `quote="Quote"`, `metadata.content="Article"`
   - Verify description is "Quote", NOT "Article"

**Done when:**
- All 3 test cases pass
- Code coverage includes highlight path

**Verify:**
```bash
npm test tests/unit/bookmark-capture-service.test.ts
```

**Evidence to record:**
- Test file content
- Test output showing all tests passing

**Files touched:**
- `tests/unit/bookmark-capture-service.test.ts` (new file)

---

### T7: Update Integration Test for Highlights
**Goal:** Verify end-to-end highlight save flow

**Steps:**
1. Open `tests/integration/api-client-highlight.test.ts`
2. Review existing tests
3. Add or update test: "should save only quote content, not full article"
   - Mock a highlight capture with quote="Short quote" and full page content
   - Verify saved object contains only "Short quote"
4. Ensure test mocks the complete flow from popup to API

**Done when:**
- Integration test verifies quote-only content
- Test passes

**Verify:**
```bash
npm test tests/integration/api-client-highlight.test.ts
```

**Evidence to record:**
- Updated test code
- Test output

**Files touched:**
- `tests/integration/api-client-highlight.test.ts`

---

### T8: Run Full Test Suite
**Goal:** Ensure no regressions in existing functionality

**Steps:**
1. Run all unit tests: `npm test tests/unit/`
2. Run all integration tests: `npm test tests/integration/`
3. Fix any failing tests
4. Verify all tests pass

**Done when:**
- All existing tests pass
- No regressions introduced

**Verify:**
```bash
npm test
```

**Evidence to record:**
- Full test suite output
- Count of passing tests

**Files touched:**
- Various test files (if fixes needed)

---

## Verification

### T9: Manual Verification - Highlight Save
**Goal:** Verify highlight saves only quote, not full article

**Steps:**
1. Build extension: `npm run build`
2. Load unpacked extension in Brave browser
3. Navigate to https://en.wikipedia.org/wiki/Internet_Computer (long article)
4. Select text: "The Internet Computer (IC) is a revolutionary blockchain platform"
5. Right-click → "Send selection to Anytype"
6. Popup opens, verify:
   - Context box shows the selected quote
   - "Save Highlight" button is visible
7. Add tag: "testag"
8. Click "Save Highlight"
9. Verify success message: "Highlight Saved! 🎉"
10. Open Anytype Desktop
11. Find the newly created Note
12. **Critical Verification:**
    - Note content is ONLY the quote (not full Wikipedia article)
    - Title is "Internet Computer price today..."
    - Tag "testag" is applied
13. Take screenshot of Anytype Note

**Done when:**
- Highlight saves only the selected quote
- Full article content is NOT included
- Tags are applied correctly

**Verify:**
- Visual inspection in Anytype
- Compare with uploaded_image_1 (should NOT look like that)

**Evidence to record:**
- Screenshot of popup with highlight
- Screenshot of Anytype Note showing ONLY quote
- Confirmation that full article is NOT present

**Files touched:**
- None (verification only)

---

### T10: Manual Verification - Article Save (Regression Test)
**Goal:** Ensure "Save as Article" still works correctly

**Steps:**
1. Navigate to https://en.wikipedia.org/wiki/Blockchain (different article)
2. Open extension popup (do NOT select text)
3. Wait for article extraction to complete
4. Click "Save as Article"
5. Verify success message: "Article Saved! 🎉"
6. Open Anytype Desktop
7. Find the newly created Note
8. **Critical Verification:**
   - Note contains full article content in Markdown
   - Headers, lists, formatting preserved
   - Metadata (if any) is present
9. Take screenshot

**Done when:**
- Article save works as before
- Full content is extracted and converted to Markdown
- No regression from previous behavior

**Verify:**
- Visual inspection in Anytype
- Compare with previous article saves

**Evidence to record:**
- Screenshot of Anytype Note with full article
- Confirmation that Markdown formatting is preserved

**Files touched:**
- None (verification only)

---

### T11: Manual Verification - Bookmark Save (Regression Test)
**Goal:** Ensure basic bookmark save still works

**Steps:**
1. Navigate to https://github.com
2. Open extension popup
3. Edit title: "GitHub Homepage"
4. Add note: "Test bookmark"
5. Add tag: "websites"
6. Click "Save Bookmark"
7. Verify success message: "Bookmark Saved! 🎉"
8. Open Anytype Desktop
9. Find the bookmark
10. **Critical Verification:**
    - Title is "GitHub Homepage"
    - Note is "Test bookmark"
    - Tag "websites" is applied
    - No full content extracted

**Done when:**
- Bookmark save works correctly
- No full content extraction for bookmarks

**Verify:**
- Visual inspection in Anytype

**Evidence to record:**
- Screenshot of saved bookmark
- Confirmation of correct fields

**Files touched:**
- None (verification only)

---

## Docs

### T12: Update spec.md with Evidence
**Goal:** Document all verification results in spec.md

**Steps:**
1. Open `specs/036-fix-highlight-save/spec.md`
2. Scroll to ## EVIDENCE section
3. Add subsections:
   - ### Automated Tests
   - ### Manual Verification
   - ### Screenshots
4. Document:
   - Unit test results (T6)
   - Integration test results (T7)
   - Full test suite results (T8)
   - Manual test results (T9, T10, T11)
   - Screenshots from manual tests
5. Add AC verification summary:
   - AC-U1: ✅ Verified in T9
   - AC-U2: ✅ Verified in T9
   - AC-U3: ✅ Verified in T10
   - AC-U4: ✅ Verified in T9

**Done when:**
- All evidence is documented
- Screenshots are embedded
- AC verification is complete

**Verify:**
- Review spec.md for completeness

**Evidence to record:**
- Updated spec.md with complete evidence section

**Files touched:**
- `specs/036-fix-highlight-save/spec.md`

---

## Tracking

### T13: Update SPEC.md
**Goal:** Point SPEC.md to this bug fix spec

**Steps:**
1. Open `SPEC.md`
2. Update "Current focus" to point to `specs/036-fix-highlight-save/`
3. Link to spec.md, plan.md, tasks.md
4. Set Status to "In progress"

**Done when:**
- SPEC.md points to current spec

**Verify:**
- Read SPEC.md to confirm

**Evidence to record:**
- Updated SPEC.md content

**Files touched:**
- `SPEC.md`

---

### T14: Update SPECS.md
**Goal:** Add this bug to the Maintenance/Unplanned Work section

**Steps:**
1. Open `SPECS.md`
2. Scroll to "## Maintenance / Unplanned Work" section
3. Add new row:
   ```markdown
   | N/A | Fix Highlight Save Function | `specs/036-fix-highlight-save/` | Bug | P0 | Done | N/A | [Evidence](specs/036-fix-highlight-save/spec.md#evidence) | AC-U1, AC-U2, AC-U3, AC-U4 |
   ```
4. Update "Last Updated" timestamp
5. Save file

**Done when:**
- SPECS.md includes this bug fix
- Status is "Done" (after all tasks complete)

**Verify:**
- Read SPECS.md to confirm entry

**Evidence to record:**
- Updated SPECS.md with new entry

**Files touched:**
- `SPECS.md`

---

**End of Tasks**
