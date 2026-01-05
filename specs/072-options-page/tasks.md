# Tasks: Options Page

**Epic:** 7.2 Options Page  
**Spec:** [spec.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/072-options-page/spec.md)  
**Plan:** [plan.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/072-options-page/plan.md)

---

## Setup

### T1: Create Settings Schema and Types
**Goal:** Define TypeScript interfaces for settings structure and validation

**Steps:**
1. Create `src/types/settings.d.ts`
2. Define `Settings` interface with version field
3. Define `SettingsV1` interface matching plan.md schema
4. Define validation types and constants
5. Export all types

**Done when:**
- [x] `settings.d.ts` created with all required types
- [x] TypeScript compilation passes
- [x] No `any` types used

**Verify:**
- Run `npm run build` - should compile without errors
- Check types are exported and importable

**Evidence to record:**
- TypeScript compilation output
- Screenshot of types file

**Files touched:**
- `src/types/settings.d.ts` [NEW]

---

### T2: Implement Settings Manager
**Goal:** Create centralized settings management module with validation and migration

**Steps:**
1. Create `src/lib/storage/settings-manager.ts`
2. Implement `loadSettings()` function
3. Implement `saveSettings()` function
4. Implement `getDefaultSettings()` function
5. Implement `validateSettings()` function
6. Implement `migrateSettings()` function (stub for future)
7. Add error handling for storage operations
8. Add JSDoc comments

**Done when:**
- [x] Settings manager module created
- [x] All functions implemented with proper error handling
- [x] JSDoc comments added
- [x] TypeScript strict mode passes
- [x] No console logs of sensitive data

**Verify:**
- Run `npm run build` - should compile without errors
- Check JSDoc comments are complete

**Evidence to record:**
- Build output
- Code snippet showing validation logic

**Files touched:**
- `src/lib/storage/settings-manager.ts` [NEW]

---

## Core Implementation

### T3: Create Options Page HTML Structure
**Goal:** Build options page HTML with all form sections

**Steps:**
1. Create `src/options/options.html`
2. Add page header with title and description
3. Add "Default Spaces" section with 5 dropdowns
4. Add "Retry Behavior" section with max attempts input
5. Add "Deduplication" section with checkbox
6. Add "API Configuration" section with port input and test button
7. Add "Image Handling" section with radio buttons
8. Add "Privacy" section with privacy mode checkbox
9. Add "Data Management" section with clear data button
10. Add confirmation dialog for clear data
11. Add save button and status messages
12. Add proper ARIA labels for accessibility

**Done when:**
- [x] HTML structure complete with all sections
- [x] Form inputs have proper labels and IDs
- [x] ARIA labels added for screen readers
- [x] Confirmation dialog included
- [x] No inline styles (use classes)

**Verify:**
- Open options.html in browser - should render all sections
- Check HTML validation (W3C validator)

**Evidence to record:**
- Screenshot of options page structure
- HTML validation results

**Files touched:**
- `src/options/options.html` [NEW]

---

### T4: Create Options Page Styles
**Goal:** Style options page for usability and visual consistency

**Steps:**
1. Create `src/options/options.css`
2. Add page layout styles (grid/flexbox)
3. Add section styles with clear visual separation
4. Add form input styles (consistent with popup)
5. Add button styles (primary, secondary, danger)
6. Add error/success message styles
7. Add loading state styles
8. Add confirmation dialog styles
9. Add responsive layout (min 320px width)
10. Add focus states for keyboard navigation

**Done when:**
- [x] CSS file created with all styles
- [x] Page is visually consistent with popup
- [x] Responsive design works on small screens
- [x] Focus states visible for keyboard navigation
- [x] No inline styles in HTML

**Verify:**
- Open options page - should be visually polished
- Test keyboard navigation - focus states visible
- Resize window - layout adapts

**Evidence to record:**
- Screenshot of styled options page
- Screenshot of keyboard focus states

**Files touched:**
- `src/options/options.css` [NEW]

---

### T5: Implement Options Page Logic
**Goal:** Implement TypeScript logic for options page interactions

**Steps:**
1. Create `src/options/options.ts`
2. Implement page initialization (load settings, fetch Spaces)
3. Implement Space fetching from API with caching
4. Implement form population from loaded settings
5. Implement form validation (port, max attempts)
6. Implement "Test Connection" button handler
7. Implement "Refresh Spaces" button handler
8. Implement "Save Settings" button handler
9. Implement "Clear All Data" button with confirmation
10. Implement error/success notifications
11. Add loading states for async operations
12. Add JSDoc comments

**Done when:**
- [x] Options page logic implemented
- [x] All event handlers working
- [x] Form validation prevents invalid inputs
- [x] Loading states shown during async operations
- [x] Error handling for all API calls
- [x] TypeScript strict mode passes

**Verify:**
- Load options page - settings and Spaces load
- Change settings and save - success notification shown
- Enter invalid port - error shown, save disabled
- Test connection - success/failure message shown

**Evidence to record:**
- Screenshot of working options page
- Screenshot of validation errors
- Screenshot of success notification

**Files touched:**
- `src/options/options.ts` [NEW]

---

### T6: Update Manifest for Options Page
**Goal:** Register options page in manifest.json

**Steps:**
1. Open `src/manifest.json`
2. Add `options_page` field pointing to `options/options.html`
3. Verify no other changes needed

**Done when:**
- [x] `options_page` field added to manifest
- [x] Manifest validates (no JSON errors)

**Verify:**
- Run `npm run build`
- Load extension in browser
- Navigate to `chrome://extensions`
- Verify "Options" link appears for extension

**Evidence to record:**
- Screenshot of extension details showing "Options" link
- Manifest.json snippet

**Files touched:**
- `src/manifest.json` [MODIFY]

---

### T7: Integrate Settings with Popup
**Goal:** Load default Spaces from settings in popup

**Steps:**
1. Open `src/popup/popup.ts`
2. Import SettingsManager
3. Load settings on popup initialization
4. Apply default Spaces to Space selectors
5. Add "Settings" link to popup UI
6. Test integration

**Done when:**
- [x] Popup loads settings on open
- [x] Default Spaces pre-selected in dropdowns
- [x] "Settings" link opens options page
- [x] No errors in console

**Verify:**
- Configure default Spaces in options
- Open popup
- Verify default Spaces pre-selected

**Evidence to record:**
- Screenshot of popup with default Spaces selected
- Code snippet showing settings integration

**Files touched:**
- `src/popup/popup.ts` [MODIFY]
- `src/popup/popup.html` [MODIFY]

---

### T8: Integrate Settings with Service Worker
**Goal:** Apply settings to service worker behavior

**Steps:**
1. Open `src/background/service-worker.ts`
2. Import SettingsManager
3. Load settings on service worker startup
4. Apply retry behavior from settings
5. Apply image handling preference from settings
6. Apply privacy mode from settings
7. Listen for settings changes (storage.onChanged)
8. Update behavior when settings change

**Done when:**
- [x] Service worker loads settings on startup
- [x] Retry behavior respects configured max attempts
- [x] Image handling respects configured strategy
- [x] Privacy mode disables URL tracking when enabled
- [x] Settings changes applied without restart

**Verify:**
- Change max attempts to 5 in options
- Create failed capture
- Verify max 5 retry attempts
- Change image strategy to "never"
- Clip article with images
- Verify images not embedded

**Evidence to record:**
- Service worker console logs showing settings loaded
- Screenshot of retry behavior with custom max attempts

**Files touched:**
- `src/background/service-worker.ts` [MODIFY]

---

### T9: Integrate Settings with API Client
**Goal:** Use configured port for API calls

**Steps:**
1. Open `src/background/api-client.ts`
2. Import SettingsManager
3. Load API port from settings
4. Use configured port for all API calls
5. Update health check to use configured port
6. Handle port changes gracefully

**Done when:**
- [x] API client uses port from settings
- [x] Health check uses configured port
- [x] Port changes applied immediately
- [x] No hardcoded port numbers (except default)

**Verify:**
- Change port to 31010 in options
- Attempt capture
- Verify API call uses port 31010 (check network logs)

**Evidence to record:**
- Network logs showing API call to custom port
- Code snippet showing port loading

**Files touched:**
- `src/background/api-client.ts` [MODIFY]

---

## Tests

### T10: Write Settings Manager Unit Tests
**Goal:** Test settings manager functions

**Steps:**
1. Create `tests/unit/settings-manager.test.ts`
2. Write test: loads default settings on first run
3. Write test: validates settings schema
4. Write test: handles corrupted settings
5. Write test: saves settings to storage
6. Write test: migrates settings (stub for future)
7. Run tests and verify all pass

**Done when:**
- [ ] Unit tests created
- [ ] All tests passing
- [ ] Coverage >80% for settings manager
- [ ] Tests use proper mocks for chrome.storage

**Verify:**
- Run `npm test -- settings-manager.test.ts`
- All tests pass

**Evidence to record:**
- Test output showing all tests passing
- Coverage report for settings manager

**Files touched:**
- `tests/unit/settings-manager.test.ts` [NEW]

---

### T11: Write Settings Validation Unit Tests
**Goal:** Test validation functions

**Steps:**
1. Create `tests/unit/settings-validation.test.ts`
2. Write test: validates port number range
3. Write test: validates max retry attempts
4. Write test: validates image strategy
5. Write test: rejects invalid settings
6. Run tests and verify all pass

**Done when:**
- [ ] Unit tests created
- [ ] All tests passing
- [ ] Edge cases covered (0, negative, out of range)

**Verify:**
- Run `npm test -- settings-validation.test.ts`
- All tests pass

**Evidence to record:**
- Test output showing all tests passing

**Files touched:**
- `tests/unit/settings-validation.test.ts` [NEW]

---

### T12: Write Options Page Integration Tests
**Goal:** Test options page end-to-end

**Steps:**
1. Create `tests/integration/options-page.test.ts`
2. Write test: loads and displays current settings
3. Write test: saves settings to storage
4. Write test: fetches Spaces from API
5. Write test: tests port connection
6. Write test: clears all data
7. Write test: validates form inputs
8. Run tests and verify all pass

**Done when:**
- [ ] Integration tests created
- [ ] All tests passing
- [ ] Tests cover all major user flows
- [ ] Tests use proper mocks for API and storage

**Verify:**
- Run `npm test -- options-page.test.ts`
- All tests pass

**Evidence to record:**
- Test output showing all tests passing

**Files touched:**
- `tests/integration/options-page.test.ts` [NEW]

---

## Verification

### T13: Manual Verification - All Acceptance Criteria
**Goal:** Manually verify all acceptance criteria from spec.md

**Steps:**
1. Perform MV-1: Options Page Access
2. Perform MV-2: Default Space Configuration
3. Perform MV-3: Retry Behavior Configuration
4. Perform MV-4: Custom Port Configuration
5. Perform MV-5: Image Handling Preference
6. Perform MV-6: Privacy Mode
7. Perform MV-7: Clear All Data
8. Perform MV-8: Form Validation
9. Document results for each test
10. Take screenshots for evidence

**Done when:**
- [ ] All manual verification steps completed
- [ ] All acceptance criteria verified
- [ ] Screenshots captured for evidence
- [ ] Any issues documented and fixed

**Verify:**
- All manual tests pass
- No regressions in existing functionality

**Evidence to record:**
- Screenshots for each manual verification step
- Summary of test results (pass/fail)

**Files touched:**
- None (manual testing only)

---

## Docs

### T14: Update README
**Goal:** Document options page in README

**Steps:**
1. Open `README.md`
2. Add "Settings" section describing options page
3. Document all configurable settings
4. Add screenshots of options page
5. Update feature list to include options page

**Done when:**
- [x] README updated with options page documentation
- [x] Screenshots added
- [x] Feature list updated

**Verify:**
- Read README - options page clearly documented

**Evidence to record:**
- README snippet showing new section

**Files touched:**
- `README.md` [MODIFY]

---

### T15: Update CHANGELOG
**Goal:** Document options page in changelog

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry for options page feature
3. List all configurable settings
4. Note any breaking changes (none expected)

**Done when:**
- [x] CHANGELOG updated
- [x] Entry includes all settings
- [x] Version number incremented (if applicable)

**Verify:**
- Read CHANGELOG - options page documented

**Evidence to record:**
- CHANGELOG snippet

**Files touched:**
- `CHANGELOG.md` [MODIFY]

---

## Tracking

### T16: Update SPECS.md
**Goal:** Update spec index with current status

**Steps:**
1. Open `SPECS.md`
2. Update Epic 7.2 row:
   - Status: "Done"
   - Next Task: "N/A"
   - Evidence: link to spec.md#evidence
3. Update completion percentage
4. Commit changes

**Done when:**
- [x] SPECS.md updated
- [x] Status reflects completion
- [x] Evidence link added

**Verify:**
- Read SPECS.md - Epic 7.2 shows "Done"

**Evidence to record:**
- SPECS.md snippet showing updated row

**Files touched:**
- `SPECS.md` [MODIFY]

---

### T17: Update SPEC.md
**Goal:** Update spec entrypoint to point to next epic

**Steps:**
1. Open `SPEC.md`
2. Move Epic 7.2 to "Recent Completions"
3. Update "Active Specification" to Epic 7.3 (or next epic)
4. Update status and completion date
5. Commit changes

**Done when:**
- [x] SPEC.md updated
- [x] Active spec points to next epic
- [x] Completion date recorded

**Verify:**
- Read SPEC.md - shows correct current focus

**Evidence to record:**
- SPEC.md snippet

**Files touched:**
- `SPEC.md` [MODIFY]

---

### T18: Consolidate Evidence in spec.md
**Goal:** Update spec.md with final evidence summary

**Steps:**
1. Open `specs/072-options-page/spec.md`
2. Add task evidence to ## EVIDENCE section
3. Add AC verification results
4. Include screenshots and test outputs
5. Summarize overall verification status
6. Commit changes

**Done when:**
- [x] Evidence section complete
- [x] All tasks documented
- [x] All ACs verified
- [x] Screenshots included

**Verify:**
- Read spec.md#evidence - complete summary

**Evidence to record:**
- Final evidence section

**Files touched:**
- `specs/072-options-page/spec.md` [MODIFY]

---

## Summary

**Total Tasks:** 18  
**Estimated Time:** 12-16 hours

**Task Breakdown:**
- Setup: 2 tasks (T1-T2)
- Core Implementation: 7 tasks (T3-T9)
- Tests: 3 tasks (T10-T12)
- Verification: 1 task (T13)
- Docs: 2 tasks (T14-T15)
- Tracking: 3 tasks (T16-T18)

**Dependencies:**
- T1 must complete before T2
- T2 must complete before T5
- T3-T4 can be done in parallel
- T5 depends on T1-T4
- T6-T9 depend on T2, T5
- T10-T12 can be done in parallel after T2
- T13 depends on all implementation tasks
- T14-T18 depend on T13
