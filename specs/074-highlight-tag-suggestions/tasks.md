# Tasks: Highlight Tag Suggestions Bug Fix

**Epic:** 074-highlight-tag-suggestions  
**Status:** In Progress

---

## Core Implementation

### T1: Add metadata extraction for highlight captures
**Goal:** Extract page metadata during highlight capture flow to enable tag suggestions

**Steps:**
1. Locate the highlight detection block in `src/popup/popup.ts` (lines 171-197)
2. After populating highlight fields (line 196), add metadata extraction call
3. Use `CMD_EXTRACT_METADATA` message to extract page metadata
4. Store result in `currentMetadata` variable
5. Add try-catch to prevent errors from blocking highlight capture

**Done when:**
- Metadata extraction call added after line 196
- `currentMetadata` is populated for highlight captures
- Error handling prevents tag suggestion failures from blocking capture

**Verify:**
- Open DevTools console
- Capture a highlight
- Check console for metadata extraction logs
- Verify `currentMetadata` is not null

**Evidence to record:**
- Console screenshot showing metadata extraction
- Code diff showing the change

**Files touched:**
- `src/popup/popup.ts`

---

### T2: Call generateTagSuggestions() for highlights
**Goal:** Generate and display tag suggestions for highlight captures

**Steps:**
1. After metadata extraction in T1, add call to `generateTagSuggestions()`
2. Ensure the call happens before the early return (line 197)
3. Use await to ensure suggestions are generated before popup displays
4. Wrap in try-catch to handle errors gracefully

**Done when:**
- `generateTagSuggestions()` is called during highlight capture flow
- Tag suggestions appear in highlight popup
- Errors are caught and logged without blocking capture

**Verify:**
- Capture a highlight from github.com
- Check that suggested tags appear in popup
- Verify tags include domain-based suggestions (development, opensource)

**Evidence to record:**
- Screenshot of highlight popup with suggested tags
- Console logs showing tag suggestion generation
- Code diff

**Files touched:**
- `src/popup/popup.ts`

---

## Verification

### T3: Manual verification - AC-U1 (Tag Suggestions Display)
**Goal:** Verify tag suggestions appear in highlight popup

**Steps:**
1. Navigate to https://github.com/anyproto/anytype-ts
2. Select a paragraph of text
3. Right-click → "Send selection to Anytype"
4. Observe popup

**Done when:**
- Suggested tags section appears below tags input
- Domain tags (development, opensource) are shown
- Tags are clickable and add to input field

**Verify:**
- Visual inspection of popup
- Click suggested tags to verify they're added
- Check that tags appear in tag chips

**Evidence to record:**
- Screenshot of highlight popup with suggested tags visible
- Screenshot after clicking a suggested tag showing it added to input

**Files touched:**
- None (manual test)

---

### T4: Manual verification - AC-U2 (Tag Suggestion Sources)
**Goal:** Verify tag suggestions come from multiple sources

**Steps:**
1. Navigate to https://stackoverflow.com/questions/1234567/any-question
2. Select text and capture as highlight
3. Open DevTools console
4. Filter for `[TagSuggestion]` logs
5. Inspect tag sources

**Done when:**
- Console shows tag suggestions generated
- Domain tags appear (development, programming)
- Content keywords extracted
- Sources object shows categorization

**Verify:**
- Console log inspection
- Verify domain, meta, and content sources present

**Evidence to record:**
- Console screenshot showing tag suggestion logs
- Screenshot showing sources breakdown

**Files touched:**
- None (manual test)

---

### T5: Manual verification - AC-U3 (Graceful Degradation)
**Goal:** Verify highlight capture works even if tag suggestions fail

**Steps:**
1. Simulate tag suggestion failure (or test on page with minimal metadata)
2. Capture a highlight
3. Verify popup still opens and functions

**Done when:**
- Popup opens successfully
- No error messages shown to user
- Manual tag input works
- Save Highlight button functional

**Verify:**
- Visual inspection
- Test manual tag entry
- Test save functionality

**Evidence to record:**
- Screenshot of working popup (even without suggestions)
- Console logs showing graceful error handling

**Files touched:**
- None (manual test)

---

### T6: Manual verification - Performance check
**Goal:** Verify popup performance not degraded

**Steps:**
1. Navigate to long article (Wikipedia, 5000+ words)
2. Select text and capture highlight
3. Measure popup open time
4. Check responsiveness

**Done when:**
- Popup opens within 300ms
- Tag suggestions appear within 1 second total
- Popup remains responsive

**Verify:**
- Stopwatch or DevTools Performance tab
- Visual responsiveness check

**Evidence to record:**
- Performance measurement screenshot
- Note on popup responsiveness

**Files touched:**
- None (manual test)

---

### T7: Manual verification - Cross-capture consistency
**Goal:** Verify tag suggestions work consistently across all capture types

**Steps:**
1. Navigate to https://github.com/anyproto/anytype-ts
2. Test bookmark capture (click extension icon)
3. Test highlight capture (select text → context menu)
4. Test article capture (click "Save as Article")
5. Compare suggested tags across all three

**Done when:**
- All three capture types show suggested tags
- Domain tags consistent across all types
- UI appearance consistent

**Verify:**
- Visual comparison of popups
- Check suggested tags match

**Evidence to record:**
- Three screenshots showing suggested tags for each capture type
- Note on consistency

**Files touched:**
- None (manual test)

---

## Tracking

### T8: Update SPECS.md
**Goal:** Update spec index with new bug fix entry

**Steps:**
1. Open `SPECS.md`
2. Add new row to "Maintenance / Unplanned Work" section
3. Fill in: Roadmap Anchor (N/A), Title, Spec Folder, Type (Bug), Priority (P1), Status (Implementing), Next Task, Evidence link

**Done when:**
- New row added to SPECS.md
- All columns filled correctly
- Evidence link points to spec.md#evidence

**Verify:**
- SPECS.md renders correctly in markdown viewer
- Link to evidence section works

**Evidence to record:**
- Git diff of SPECS.md

**Files touched:**
- `SPECS.md`

---

### T9: Update roadmap.md maintenance section
**Goal:** Add entry to roadmap for tracking

**Steps:**
1. Open `docs/roadmap.md`
2. Find or create "Maintenance / Unplanned Work" section
3. Add bullet: "Bug: Highlight text popup missing suggested tags - P1 - [specs/074-highlight-tag-suggestions/](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/074-highlight-tag-suggestions/)"

**Done when:**
- Entry added to roadmap.md
- Link to spec folder works

**Verify:**
- Roadmap.md renders correctly
- Link navigation works

**Evidence to record:**
- Git diff of roadmap.md

**Files touched:**
- `docs/roadmap.md`

---

### T10: Update spec.md with evidence
**Goal:** Consolidate all verification evidence in spec.md

**Steps:**
1. Open `specs/074-highlight-tag-suggestions/spec.md`
2. Update ## EVIDENCE section with:
   - Task completion evidence (T1-T2)
   - Acceptance criteria verification (AC-U1, AC-U2, AC-U3)
   - Screenshots and console logs
   - Performance measurements
3. Mark all ACs as verified

**Done when:**
- EVIDENCE section complete
- All tasks documented
- All ACs verified with evidence
- Screenshots embedded

**Verify:**
- spec.md renders correctly
- All evidence links/images work

**Evidence to record:**
- Final spec.md with complete evidence section

**Files touched:**
- `specs/074-highlight-tag-suggestions/spec.md`

---

### T11: Update SPEC.md pointer (if exists)
**Goal:** Update current work pointer to this spec

**Steps:**
1. Check if `SPEC.md` exists in project root
2. If yes, update "Current focus" to point to this spec
3. Update status to "Implementing"

**Done when:**
- SPEC.md updated (or skipped if doesn't exist)

**Verify:**
- SPEC.md points to correct spec folder

**Evidence to record:**
- Git diff of SPEC.md (or note that file doesn't exist)

**Files touched:**
- `SPEC.md` (if exists)

---

## Summary

**Total Tasks:** 11
- Core Implementation: 2
- Verification: 5
- Tracking: 4

**Estimated Time:** 2-3 hours
- Implementation: 30-60 minutes
- Manual Testing: 60-90 minutes
- Documentation: 30 minutes
