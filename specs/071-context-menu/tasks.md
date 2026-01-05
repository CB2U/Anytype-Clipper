# Epic 7.1: Context Menu Integration - Tasks

## Task Checklist

### Setup
- [x] T1: Create context-menu-handler module ✅

### Core Implementation  
- [x] T2: Register context menu items ✅
- [x] T3: Implement selection capture handler ✅
- [x] T4: Implement article capture handler ✅
- [x] T5: Implement bookmark capture handler ✅
- [x] T6: Add manifest permissions ✅ (already present)

### Testing
- [x] T7: Manual verification - All menu items appear ✅
- [x] T8: Manual verification - Selection menu visibility ✅
- [x] T9: Manual verification - Highlight capture works ✅
- [x] T10: Manual verification - Article capture works ✅
- [x] T11: Manual verification - Bookmark capture works ✅

### Documentation
- [x] T12: Update SPECS.md ✅
- [x] T13: Update SPEC.md ✅
- [x] T14: Update spec.md with evidence ✅

---

## Detailed Tasks

### T1: Create context-menu-handler module

**Goal:** Create new module to centralize context menu logic

**Steps:**
1. Create `src/background/context-menu-handler.ts`
2. Define menu item IDs as constants
3. Create `registerContextMenus()` function
4. Create `handleContextMenuClick(info, tab)` router function
5. Export public API

**Done When:**
- File created with TypeScript types
- Functions defined with proper signatures
- No lint errors

**Verify:**
- Run `npm run build`
- Check for TypeScript errors

**Evidence:**
- File path and line count
- Build success confirmation

**Files Touched:**
- `src/background/context-menu-handler.ts` (NEW)

**Estimated Time:** 30 minutes

---

### T2: Register context menu items

**Goal:** Register three context menu items on extension install/update

**Steps:**
1. Implement `registerContextMenus()` in context-menu-handler.ts
2. Register "send-selection-to-anytype" (contexts: ['selection'])
3. Register "clip-article-to-anytype" (contexts: ['page'])
4. Register "bookmark-to-anytype" (contexts: ['page'])
5. Add error handling for registration failures
6. Import and call from service-worker.ts installation handler
7. Consolidate with existing "send-selection-to-anytype" if present

**Done When:**
- Three menu items registered
- Registration called on install/update
- Error handling in place
- No duplicate menu items

**Verify:**
- Install extension
- Right-click on page
- Verify all three menu items appear
- Select text, verify "Send selection" appears

**Evidence:**
- Screenshot of context menu with all items
- Console logs showing successful registration

**Files Touched:**
- `src/background/context-menu-handler.ts`
- `src/background/service-worker.ts`

**Estimated Time:** 45 minutes

---

### T3: Implement selection capture handler

**Goal:** Handle "Send selection to Anytype" context menu click

**Steps:**
1. Implement `handleSelectionCapture(info, tab)` in context-menu-handler.ts
2. Extract selection text from `info.selectionText`
3. Get page URL and title from tab
4. Inject content script if needed to get context
5. Send message to service worker's existing highlight handler
6. Show success/error notification

**Done When:**
- Function captures selection text
- Integrates with existing highlight capture logic
- Notifications shown
- Error handling in place

**Verify:**
- Select text on page
- Right-click → "Send selection to Anytype"
- Verify highlight captured with quote and context
- Check Anytype for created object

**Evidence:**
- Screenshot of captured highlight in Anytype
- Console logs showing capture flow

**Files Touched:**
- `src/background/context-menu-handler.ts`

**Estimated Time:** 45 minutes

---

### T4: Implement article capture handler

**Goal:** Handle "Clip article to Anytype" context menu click

**Steps:**
1. Implement `handleArticleCapture(info, tab)` in context-menu-handler.ts
2. Get tab URL and ID
3. Send message to trigger article extraction
4. Reuse existing CMD_EXTRACT_ARTICLE flow
5. Open popup with extracted article or auto-save
6. Show extraction quality notification

**Done When:**
- Function triggers article extraction
- Integrates with existing article capture logic
- Quality indicator shown
- Error handling in place

**Verify:**
- Right-click on article page → "Clip article to Anytype"
- Verify article extracted with Readability
- Check Markdown formatting preserved
- Verify object created in Anytype

**Evidence:**
- Screenshot of captured article in Anytype
- Extraction quality indicator screenshot

**Files Touched:**
- `src/background/context-menu-handler.ts`

**Estimated Time:** 30 minutes

---

### T5: Implement bookmark capture handler

**Goal:** Handle "Bookmark to Anytype" context menu click

**Steps:**
1. Implement `handleBookmarkCapture(info, tab)` in context-menu-handler.ts
2. Get tab URL, title, and favicon
3. Extract metadata using existing metadata extractor
4. Send message to trigger bookmark capture
5. Reuse existing CMD_CAPTURE_BOOKMARK flow
6. Show success notification

**Done When:**
- Function captures bookmark data
- Integrates with existing bookmark capture logic
- Notifications shown
- Error handling in place

**Verify:**
- Right-click on page → "Bookmark to Anytype"
- Verify bookmark created with URL, title, metadata
- Check Anytype for created object

**Evidence:**
- Screenshot of captured bookmark in Anytype
- Console logs showing capture flow

**Files Touched:**
- `src/background/context-menu-handler.ts`

**Estimated Time:** 30 minutes

---

### T6: Add manifest permissions

**Goal:** Add contextMenus permission to manifest.json

**Steps:**
1. Open `manifest.json`
2. Add `"contextMenus"` to permissions array
3. Verify no other permissions needed
4. Test extension reload

**Done When:**
- Permission added to manifest
- Extension reloads without errors
- Context menus work

**Verify:**
- Reload extension
- Check chrome://extensions for permission
- Test context menu items

**Evidence:**
- manifest.json diff showing permission added
- Extension loads successfully

**Files Touched:**
- `manifest.json`

**Estimated Time:** 15 minutes

---

### T7: Manual verification - All menu items appear

**Goal:** Verify all three context menu items are registered and visible

**Test Steps:**
1. Install/reload extension
2. Navigate to any web page
3. Right-click anywhere on page
4. Verify "Clip article to Anytype" appears
5. Verify "Bookmark to Anytype" appears
6. Verify menu items have correct labels

**Pass Criteria:**
- All three menu items visible
- Labels are clear and action-oriented
- Menu items appear consistently

**Evidence:**
- Screenshot of context menu showing all items

**Estimated Time:** 10 minutes

---

### T8: Manual verification - Selection menu visibility

**Goal:** Verify "Send selection" only shows when text is selected

**Test Steps:**
1. Navigate to any web page
2. Right-click without selecting text
3. Verify "Send selection to Anytype" is NOT shown
4. Select some text
5. Right-click on selection
6. Verify "Send selection to Anytype" IS shown

**Pass Criteria:**
- Menu item hidden when no selection
- Menu item visible when text selected
- Behavior consistent across pages

**Evidence:**
- Screenshot comparison: with and without selection

**Estimated Time:** 10 minutes

---

### T9: Manual verification - Highlight capture works (AC-CM3)

**Goal:** Verify highlight capture via context menu creates correct object

**Test Steps:**
1. Navigate to article page
2. Select a paragraph of text
3. Right-click → "Send selection to Anytype"
4. Verify popup opens (or auto-saves)
5. Complete capture
6. Open Anytype Desktop
7. Verify object created with:
   - Quote (selected text)
   - Context (surrounding text)
   - URL
   - Page title
   - Timestamp

**Pass Criteria:**
- Highlight captured successfully
- All properties present and correct
- Context includes before/after text
- Success notification shown

**Evidence:**
- Screenshot of Anytype object with all properties

**Estimated Time:** 15 minutes

---

### T10: Manual verification - Article capture works (AC-CM4)

**Goal:** Verify article capture via context menu extracts and formats correctly

**Test Steps:**
1. Navigate to article page (e.g., Medium, blog post)
2. Right-click anywhere → "Clip article to Anytype"
3. Verify extraction starts
4. Verify popup shows extracted content (or auto-saves)
5. Complete capture
6. Open Anytype Desktop
7. Verify object created with:
   - Markdown-formatted content
   - Headings preserved
   - Lists preserved
   - Code blocks preserved
   - Images embedded/linked correctly

**Pass Criteria:**
- Article extracted successfully
- Markdown formatting preserved
- Extraction quality indicator shown
- Object created in Anytype

**Evidence:**
- Screenshot of Anytype object showing formatted content
- Extraction quality notification screenshot

**Estimated Time:** 15 minutes

---

### T11: Manual verification - Bookmark capture works (AC-CM5)

**Goal:** Verify bookmark capture via context menu creates correct object

**Test Steps:**
1. Navigate to any web page
2. Right-click anywhere → "Bookmark to Anytype"
3. Verify popup opens (or auto-saves)
4. Complete capture
5. Open Anytype Desktop
6. Verify object created with:
   - URL
   - Title
   - Favicon (if available)
   - Metadata (description, author, etc.)
   - Timestamp

**Pass Criteria:**
- Bookmark captured successfully
- All metadata present
- Success notification shown
- Object created in Anytype

**Evidence:**
- Screenshot of Anytype bookmark object

**Estimated Time:** 10 minutes

---

### T12: Update SPECS.md

**Goal:** Update specification index with Epic 7.1 status

**Steps:**
1. Open `SPECS.md`
2. Find Epic 7.1 row in BP6 section
3. Update Status to "Done"
4. Update Next Task to "-"
5. Update Evidence link to point to spec.md#evidence

**Done When:**
- SPECS.md updated
- Status reflects completion
- Evidence link correct

**Verify:**
- File saved
- Links work

**Evidence:**
- Git diff showing changes

**Files Touched:**
- `SPECS.md`

**Estimated Time:** 5 minutes

---

### T13: Update SPEC.md

**Goal:** Update current work pointer to next epic

**Steps:**
1. Open `SPEC.md`
2. Update "Active Specification" section
3. Mark Epic 7.1 as Done
4. Point to next epic (7.2 or next in roadmap)

**Done When:**
- SPEC.md updated
- Points to next work
- Status correct

**Verify:**
- File saved
- Links work

**Evidence:**
- Git diff showing changes

**Files Touched:**
- `SPEC.md`

**Estimated Time:** 5 minutes

---

### T14: Update spec.md with evidence

**Goal:** Document implementation evidence in spec.md

**Steps:**
1. Open `specs/071-context-menu/spec.md`
2. Add ## EVIDENCE section if not present
3. Document:
   - Implementation completion date
   - Files modified/created
   - AC verification results
   - Screenshots and test results
   - Any issues encountered and resolved
4. Mark all ACs as verified

**Done When:**
- Evidence section complete
- All ACs documented
- Screenshots embedded

**Verify:**
- Evidence section readable
- All ACs covered

**Evidence:**
- Updated spec.md with evidence section

**Files Touched:**
- `specs/071-context-menu/spec.md`

**Estimated Time:** 20 minutes

---

## Summary

**Total Estimated Time:** ~4.5 hours

**Task Dependencies:**
- T1 → T2 (need handler before registration)
- T2 → T3, T4, T5 (need registration before handlers)
- T3, T4, T5 → T7-T11 (need implementation before testing)
- T7-T11 → T14 (need test results for evidence)

**Critical Path:**
T1 → T2 → T3/T4/T5 → T6 → T7-T11 → T12-T14
