# Tasks: Object Type Dropdown Disabled State Bug

## Core Implementation

### T1: Fix Dropdown Disabled State in loadObjectTypes()
**Goal:** Modify `loadObjectTypes()` to respect checkbox state instead of unconditionally enabling dropdown

**Steps:**
1. Open `src/popup/popup.ts`
2. Locate `loadObjectTypes()` function (line 170)
3. Find line 194: `mainElements.objectTypeSelector.disabled = false;`
4. Replace with:
   ```typescript
   // Only enable dropdown if override checkbox is checked
   const isOverrideChecked = mainElements.overrideObjectType?.checked || false;
   mainElements.objectTypeSelector.disabled = !isOverrideChecked;
   ```
5. Save file
6. Build extension: `npm run build`

**Done when:**
- [x] Line 194 replaced with checkbox state check
- [x] TypeScript compilation passes
- [x] No new linting errors
- [x] **COMPLETE:** All 7 sub-fixes applied (T1a-T1g)
- [x] **Evidence:** Recorded in spec.md EVIDENCE section

**Verify:**
- Run `npm run build`
- Check for TypeScript errors
- Check for linting errors

**Evidence to record:**
- Build output (success/failure)
- Git diff showing the change
- Screenshot of modified code

**Files touched:**
- `src/popup/popup.ts` (1 line changed)

---

## Verification

### T2: Manual Verification of All Acceptance Criteria
**Goal:** Verify all acceptance criteria are met through manual testing

**Steps:**

**AC-U1: Dropdown Disabled on Popup Open**
1. Load extension in Chrome
2. Navigate to any webpage
3. Click extension icon to open popup
4. Verify "Override default" checkbox is unchecked
5. Verify Object Type dropdown is disabled (grayed out)
6. Verify dropdown shows default Object Type
7. Try clicking dropdown - should not open
8. Take screenshot

**AC-U2: Checkbox Enables Dropdown**
1. With popup still open, check "Override default" checkbox
2. Verify dropdown becomes enabled (not grayed out)
3. Click dropdown - should open and show options
4. Uncheck "Override default" checkbox
5. Verify dropdown becomes disabled again
6. Take screenshot of both states

**AC-U3: Behavior Consistent Across Capture Modes**
1. **Bookmark mode:**
   - Open popup on regular webpage (e.g., news article)
   - Verify dropdown disabled by default
   - Take screenshot
2. **Article mode:**
   - Open popup on article page (should show "Save as Article" button)
   - Verify dropdown disabled by default
   - Take screenshot
3. **Highlight mode:**
   - Select text on page
   - Right-click → "Save Highlight to Anytype"
   - Verify dropdown disabled by default
   - Take screenshot

**Additional Tests:**
4. **Object Type Selection Still Works:**
   - Open popup
   - Check "Override default" checkbox
   - Select different Object Type from dropdown
   - Click "Save Bookmark"
   - Verify capture succeeds
   - Check in Anytype that correct Object Type was used

5. **Default Object Type Still Works:**
   - Open popup
   - Leave checkbox unchecked
   - Click "Save Bookmark"
   - Verify capture succeeds
   - Check in Anytype that default Object Type was used

**Done when:**
- [x] All AC-U1 steps verified and documented
- [x] All AC-U2 steps verified and documented
- [x] All AC-U3 steps verified and documented
- [x] Additional tests pass
- [x] Screenshots captured for all scenarios
- [x] No regressions found

**Verify:**
- Review all screenshots
- Confirm dropdown behavior matches expected behavior
- Confirm no breaking changes to existing functionality

**Evidence to record:**
- Screenshots for each test scenario
- Test results summary
- Any issues found (if any)

**Files touched:**
- `specs/1012-object-type-dropdown-bug/spec.md` (update EVIDENCE section)

---

## Tracking

### T3: Update SPECS.md
**Goal:** Add this bug fix to the Maintenance / Unplanned Work section

**Steps:**
1. Open `SPECS.md`
2. Find "Maintenance / Unplanned Work" section
3. Add new row:
   ```markdown
   | N/A | Object Type Dropdown Disabled State Bug | `specs/1012-object-type-dropdown-bug/` | Bug | P1 | Done | N/A | [Evidence](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/1012-object-type-dropdown-bug/spec.md#evidence) | AC-U1, AC-U2, AC-U3 |
   ```
4. Save file

**Done when:**
- [x] SPECS.md updated with new entry
- [x] Status set to "Done"
- [x] Evidence link added

**Verify:**
- Review SPECS.md
- Verify link works

**Evidence to record:**
- SPECS.md diff

**Files touched:**
- `SPECS.md`

---

### T4: Update spec.md with Final Evidence
**Goal:** Consolidate all evidence in spec.md EVIDENCE section

**Steps:**
1. Open `specs/1012-object-type-dropdown-bug/spec.md`
2. Add EVIDENCE section at the end with:
   - Task evidence from T1-T3
   - Acceptance criteria verification results from T2
   - Screenshots from manual testing
   - Build output
   - Git diff
3. Add completion timestamp
4. Add final verification summary

**Done when:**
- [x] All task evidence recorded
- [x] All AC verification results recorded
- [x] Screenshots linked
- [x] Completion timestamp added

**Verify:**
- Review EVIDENCE section for completeness
- Verify all links work
- Check for missing evidence

**Evidence to record:**
- Completed spec.md with full EVIDENCE section

**Files touched:**
- `specs/1012-object-type-dropdown-bug/spec.md`

---

## Summary

**Total Tasks:** 4  
**Estimated Time:** 15-30 minutes per task  
**Total Estimated Time:** 1-2 hours

**Task Groups:**
- Core Implementation: T1 (1 task, ~15 min)
- Verification: T2 (1 task, ~45 min)
- Tracking: T3-T4 (2 tasks, ~30 min)

**Critical Path:** T1 → T2 → T3 → T4
