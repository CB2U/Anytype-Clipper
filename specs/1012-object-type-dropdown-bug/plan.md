# Implementation Plan: Object Type Dropdown Disabled State Bug

## Goal

Fix the Object Type dropdown in the popup to be disabled by default when the "Override default" checkbox is unchecked. The dropdown should only be enabled when the user explicitly checks the checkbox.

---

## User Review Required

> [!IMPORTANT]
> **No Breaking Changes**
> This fix only affects the initial disabled state of the Object Type dropdown. All existing functionality (checkbox toggle, Object Type selection, save behavior) remains unchanged.

---

## Proposed Changes

### Popup Logic

#### [MODIFY] [popup.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)

**Changes to `loadObjectTypes()` function (lines 170-233):**

Currently, line 194 unconditionally enables the dropdown:
```typescript
mainElements.objectTypeSelector.disabled = false;
```

**Fix:** Check the checkbox state before enabling the dropdown:
```typescript
// Only enable dropdown if override checkbox is checked
const isOverrideChecked = mainElements.overrideObjectType?.checked || false;
mainElements.objectTypeSelector.disabled = !isOverrideChecked;
```

This ensures the dropdown respects the checkbox state when Object Types are loaded, rather than always enabling it.

**Why this works:**
- The checkbox starts unchecked (default HTML state)
- `loadObjectTypes()` is called after DOM is ready
- The checkbox event listener (lines 1087-1092) already handles toggle behavior correctly
- This fix simply makes `loadObjectTypes()` respect the current checkbox state instead of overriding it

---

## Verification Plan

### Manual Verification

**Test 1: Dropdown Disabled on Popup Open**
1. Open popup on any page
2. Expected: Dropdown is disabled (grayed out)
3. Expected: Checkbox is unchecked
4. Expected: Dropdown shows default Object Type but cannot be clicked

**Test 2: Checkbox Enables Dropdown**
1. Open popup
2. Check "Override default" checkbox
3. Expected: Dropdown becomes enabled
4. Uncheck checkbox
5. Expected: Dropdown becomes disabled again

**Test 3: All Capture Modes**
1. Test on regular page (bookmark mode) - dropdown disabled by default
2. Test on article page (article mode) - dropdown disabled by default
3. Capture highlight (highlight mode) - dropdown disabled by default

**Test 4: Object Type Selection Still Works**
1. Open popup
2. Check "Override default" checkbox
3. Select different Object Type from dropdown
4. Save capture
5. Expected: Selected Object Type is used (not default)

**Test 5: Default Object Type Still Works**
1. Open popup
2. Leave checkbox unchecked
3. Save capture
4. Expected: Default Object Type for mode is used

### Edge Cases to Test

- Popup opens while Object Types are still loading (dropdown should stay disabled)
- Popup opens with cached Object Types (dropdown should be disabled)
- Popup opens when API is unavailable (dropdown should be disabled)
- User toggles checkbox multiple times rapidly (should work correctly)

---

## Rollout and Migration Notes

No migration needed. This is a pure UI bug fix with no data or settings changes.

---

## Observability and Debugging

**What can be logged:**
- Checkbox state when `loadObjectTypes()` is called
- Dropdown disabled state after population

**What must never be logged:**
- User's Object Type selections
- API responses containing Object Types
