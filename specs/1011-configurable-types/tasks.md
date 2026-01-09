# Tasks: Configurable Object Types

## Setup

### T1: Extend Settings Schema with Object Type Fields
**Goal:** Add Object Type configuration fields to settings schema

**Steps:**
1. Open `src/types/settings.ts`
2. Create `SettingsV2` interface extending `SettingsV1`
3. Add `objectTypes` field with structure:
   - `defaults: { article, highlight, bookmark }`
   - `lastUsed: { article, highlight, bookmark }`
   - `cached: ObjectTypeInfo[]`
   - `lastFetchedAt: number`
4. Create `ObjectTypeInfo` interface with fields:
   - `id`, `name`, `icon`, `isBuiltIn`, `isDeleted`
5. Update `SETTINGS_VERSION` constant to 2
6. Export new types

**Done when:**
- [ ] `SettingsV2` interface created with all required fields
- [ ] `ObjectTypeInfo` interface created
- [ ] TypeScript compilation passes
- [ ] No `any` types used
- [ ] All types exported

**Verify:**
- Run `npm run build`
- Check TypeScript compilation output
- Verify no type errors

**Evidence to record:**
- TypeScript compilation output
- File size and line count
- Screenshot of type definitions

**Files touched:**
- `src/types/settings.ts`

---

### T2: Add Object Type Constants
**Goal:** Define built-in Object Type IDs and defaults

**Steps:**
1. Open `src/types/settings-constants.ts`
2. Add built-in Object Type ID constants:
   - `BUILT_IN_ARTICLE_TYPE_ID`
   - `BUILT_IN_HIGHLIGHT_TYPE_ID`
   - `BUILT_IN_BOOKMARK_TYPE_ID`
   - `BUILT_IN_NOTE_TYPE_ID`
   - `BUILT_IN_TASK_TYPE_ID`
3. Add default Object Type configuration
4. Add cache expiry constant (24 hours)
5. Export constants

**Done when:**
- [ ] All built-in Object Type IDs defined
- [ ] Default configuration created
- [ ] Cache expiry constant added
- [ ] TypeScript compilation passes

**Verify:**
- Run `npm run build`
- Check constants are importable
- Verify values are correct

**Evidence to record:**
- Constants defined
- TypeScript compilation output

**Files touched:**
- `src/types/settings-constants.ts`

---

## Core Implementation

### T3: Implement Settings Migration v1 → v2
**Goal:** Migrate existing settings to include Object Type fields

**Steps:**
1. Open `src/lib/storage/settings-manager-v2.ts`
2. Implement `migrateV1toV2(v1Settings)` function
3. Add Object Type defaults to migrated settings
4. Initialize `lastUsed` to null for all modes
5. Initialize `cached` to empty array
6. Set `lastFetchedAt` to 0
7. Update `migrateSettings()` to call v1→v2 migration
8. Add migration logging (sanitized)
9. Add error handling with fallback to defaults

**Done when:**
- [ ] Migration function implemented
- [ ] All Object Type fields initialized
- [ ] Error handling added
- [ ] Logging added (no sensitive data)
- [ ] Unit tests written
- [ ] TypeScript compilation passes

**Verify:**
- Run unit tests
- Test migration with mock v1 settings
- Verify no data loss

**Evidence to record:**
- Unit test results
- Migration test output
- Code coverage

**Files touched:**
- `src/lib/storage/settings-manager-v2.ts`
- `tests/unit/settings-manager.test.ts`

---

### T4: Add Object Type Methods to Settings Manager
**Goal:** Add methods for managing Object Type settings

**Steps:**
1. Open `src/lib/storage/settings-manager-v2.ts`
2. Implement `getDefaultObjectType(mode)` - returns default for mode
3. Implement `setDefaultObjectType(mode, typeId)` - sets default for mode
4. Implement `getLastUsedObjectType(mode)` - returns last-used for mode
5. Implement `updateLastUsedObjectType(mode, typeId)` - updates last-used
6. Implement `getCachedObjectTypes()` - returns cached Object Types
7. Implement `setCachedObjectTypes(types)` - caches Object Types list
8. Implement `isCacheStale()` - checks if cache is older than 24 hours
9. Add JSDoc comments for all methods
10. Add error handling and validation

**Done when:**
- [ ] All methods implemented
- [ ] JSDoc comments added
- [ ] Error handling added
- [ ] Input validation added
- [ ] Unit tests written
- [ ] TypeScript compilation passes

**Verify:**
- Run unit tests
- Check code coverage >80%
- Verify all methods work correctly

**Evidence to record:**
- Unit test results
- Code coverage report
- Method signatures

**Files touched:**
- `src/lib/storage/settings-manager-v2.ts`
- `tests/unit/settings-manager.test.ts`

---

### T5: Add Object Types API Methods to API Client
**Goal:** Add methods to fetch and validate Object Types from Anytype API

**Steps:**
1. Open `src/lib/api/client.ts`
2. Implement `fetchObjectTypes()` method:
   - Make GET request to Object Types endpoint
   - Parse response into `ObjectTypeInfo[]`
   - Handle API errors gracefully
   - Add timeout (5s)
   - Return cached types on error
3. Implement `validateObjectType(id)` method:
   - Make GET request to validate Object Type
   - Return boolean (exists or not)
   - Handle API errors
4. Add JSDoc comments
5. Add error handling and logging

**Done when:**
- [ ] `fetchObjectTypes()` implemented
- [ ] `validateObjectType()` implemented
- [ ] API error handling added
- [ ] Timeout handling added
- [ ] JSDoc comments added
- [ ] Unit tests written
- [ ] TypeScript compilation passes

**Verify:**
- Run unit tests with mock API
- Test with real Anytype API (if available)
- Verify error handling works

**Evidence to record:**
- Unit test results
- API response examples
- Error handling test results

**Files touched:**
- `src/lib/api/client.ts`
- `tests/unit/api-client.test.ts`

**Note:** This task requires clarification on the actual Anytype API endpoints for Object Types. If endpoints are unknown, implement with placeholder endpoints and add `[TODO: Update endpoint]` comments.

---

### T6: Add Object Type Selector to Popup HTML
**Goal:** Add Object Type dropdown to popup UI

**Steps:**
1. Open `src/popup/popup.html`
2. Add Object Type selector section below Space selector:
   - Label: "Object Type"
   - Select element with id `object-type-select`
   - Loading state placeholder
   - Help text explaining Object Types
3. Add ARIA labels for accessibility
4. Add loading spinner element
5. Add error message element for API failures

**Done when:**
- [ ] Object Type selector added to HTML
- [ ] ARIA labels added
- [ ] Loading state elements added
- [ ] Error message elements added
- [ ] HTML validates

**Verify:**
- Open popup.html in browser
- Check layout and styling
- Verify accessibility with screen reader

**Evidence to record:**
- Screenshot of popup with Object Type selector
- HTML validation results

**Files touched:**
- `src/popup/popup.html`

---

### T7: Add Object Type Styles to Popup CSS
**Goal:** Style Object Type selector to match existing UI

**Steps:**
1. Open `src/popup/popup.css`
2. Add styles for Object Type selector:
   - Match Space selector styling
   - Add loading state styles
   - Add error state styles
   - Add focus states for keyboard navigation
3. Ensure responsive design (min-width 320px)
4. Add high contrast mode support

**Done when:**
- [ ] Object Type selector styled
- [ ] Loading state styled
- [ ] Error state styled
- [ ] Focus states added
- [ ] Responsive design verified
- [ ] High contrast mode supported

**Verify:**
- Open popup in browser
- Test at various widths (320px, 768px, 1920px)
- Test keyboard navigation
- Test high contrast mode

**Evidence to record:**
- Screenshots at different widths
- Screenshot of focus states
- Screenshot of high contrast mode

**Files touched:**
- `src/popup/popup.css`

---

### T8: Implement Object Type Logic in Popup
**Goal:** Add Object Type fetching, selection, and saving logic to popup

**Steps:**
1. Open `src/popup/popup.ts`
2. Add `fetchAndPopulateObjectTypes()` function:
   - Call `apiClient.fetchObjectTypes()`
   - Cache Object Types using settings manager
   - Populate dropdown with Object Types
   - Show built-in types first, then custom types
   - Handle API errors (show cached types)
3. Add `getDefaultObjectTypeForMode(mode)` function:
   - Determine capture mode (article/highlight/bookmark)
   - Get default Object Type from settings
   - Return default or last-used Object Type
4. Add `handleObjectTypeChange()` function:
   - Update selected Object Type
   - Validate Object Type ID
5. Update `saveCapture()` function:
   - Include selected Object Type ID
   - Update last-used Object Type
   - Handle validation errors
6. Update `init()` function:
   - Call `fetchAndPopulateObjectTypes()` (async, non-blocking)
   - Pre-select default Object Type
7. Add event listeners for Object Type dropdown
8. Add error handling and logging

**Done when:**
- [ ] All functions implemented
- [ ] Object Types fetched and populated
- [ ] Default Object Type pre-selected
- [ ] Last-used Object Type updated on save
- [ ] Error handling added
- [ ] Event listeners added
- [ ] TypeScript compilation passes

**Verify:**
- Open popup manually
- Verify Object Type dropdown populated
- Verify default pre-selected
- Save capture and verify Object Type applied
- Test with API unavailable (cached types)

**Evidence to record:**
- Screenshot of popup with Object Types
- Screenshot of API error handling
- Capture created with custom Object Type

**Files touched:**
- `src/popup/popup.ts`

---

### T9: Add Object Type Configuration to Options Page HTML
**Goal:** Add Object Type configuration section to Options page

**Steps:**
1. Open `src/options/options.html`
2. Add "Object Types" section after "Default Spaces" section:
   - Section heading: "Default Object Types"
   - Help text explaining Object Types
   - Three dropdowns:
     - "Default Object Type for Articles" (id: `article-object-type`)
     - "Default Object Type for Highlights" (id: `highlight-object-type`)
     - "Default Object Type for Bookmarks" (id: `bookmark-object-type`)
   - "Refresh Object Types" button
   - Loading state elements
   - Error message elements
3. Add ARIA labels for accessibility

**Done when:**
- [ ] Object Types section added
- [ ] Three dropdowns added
- [ ] Refresh button added
- [ ] ARIA labels added
- [ ] Loading/error elements added
- [ ] HTML validates

**Verify:**
- Open options.html in browser
- Check layout and styling
- Verify accessibility

**Evidence to record:**
- Screenshot of Options page with Object Types section

**Files touched:**
- `src/options/options.html`

---

### T10: Add Object Type Styles to Options Page CSS
**Goal:** Style Object Type configuration section

**Steps:**
1. Open `src/options/options.css`
2. Add styles for Object Types section:
   - Match existing section styling
   - Style three dropdowns
   - Style Refresh button
   - Add loading state styles
   - Add error state styles
3. Ensure responsive design

**Done when:**
- [ ] Object Types section styled
- [ ] Dropdowns styled
- [ ] Refresh button styled
- [ ] Loading/error states styled
- [ ] Responsive design verified

**Verify:**
- Open Options page in browser
- Test at various widths
- Verify styling matches existing sections

**Evidence to record:**
- Screenshots of Options page

**Files touched:**
- `src/options/options.css`

---

### T11: Implement Object Type Logic in Options Page
**Goal:** Add Object Type fetching, configuration, and saving logic to Options page

**Steps:**
1. Open `src/options/options.ts`
2. Add `fetchAndPopulateObjectTypes()` function:
   - Call `apiClient.fetchObjectTypes()`
   - Cache Object Types
   - Populate all three dropdowns
   - Show built-in types first, then custom types
   - Handle API errors
3. Add `handleRefreshObjectTypes()` function:
   - Force refresh from API
   - Update cache
   - Re-populate dropdowns
4. Update `populateForm()` function:
   - Load default Object Types from settings
   - Select current defaults in dropdowns
5. Update `saveSettingsHandler()` function:
   - Get selected Object Types from dropdowns
   - Validate Object Type IDs
   - Save to settings
   - Show success message
6. Add event listeners for dropdowns and Refresh button
7. Add error handling and logging

**Done when:**
- [ ] All functions implemented
- [ ] Object Types fetched and populated
- [ ] Current defaults loaded
- [ ] Save functionality works
- [ ] Refresh button works
- [ ] Error handling added
- [ ] TypeScript compilation passes

**Verify:**
- Open Options page manually
- Verify Object Types populated
- Configure defaults and save
- Verify settings persisted
- Test Refresh button
- Test with API unavailable

**Evidence to record:**
- Screenshot of Options page with Object Types
- Screenshot of saved settings
- Settings storage inspection

**Files touched:**
- `src/options/options.ts`

---

## Tests

### T12: Write Unit Tests for Settings Manager
**Goal:** Test Object Type methods in settings manager

**Steps:**
1. Open `tests/unit/settings-manager.test.ts`
2. Add test suite for Object Type methods:
   - Test `getDefaultObjectType(mode)`
   - Test `setDefaultObjectType(mode, typeId)`
   - Test `getLastUsedObjectType(mode)`
   - Test `updateLastUsedObjectType(mode, typeId)`
   - Test `getCachedObjectTypes()`
   - Test `setCachedObjectTypes(types)`
   - Test `isCacheStale()`
3. Add test suite for v1→v2 migration:
   - Test successful migration
   - Test migration with missing fields
   - Test migration error handling
4. Add edge case tests:
   - Invalid mode
   - Invalid Object Type ID
   - Empty cache
   - Stale cache

**Done when:**
- [ ] All methods tested
- [ ] Migration tested
- [ ] Edge cases tested
- [ ] Code coverage >80%
- [ ] All tests pass

**Verify:**
- Run `npm test`
- Check coverage report
- Verify all tests pass

**Evidence to record:**
- Test results
- Code coverage report

**Files touched:**
- `tests/unit/settings-manager.test.ts`

---

### T13: Write Unit Tests for API Client
**Goal:** Test Object Type API methods

**Steps:**
1. Open `tests/unit/api-client.test.ts`
2. Add test suite for `fetchObjectTypes()`:
   - Test successful fetch
   - Test API error handling
   - Test timeout handling
   - Test response parsing
3. Add test suite for `validateObjectType()`:
   - Test valid Object Type
   - Test invalid Object Type
   - Test API error handling
4. Mock Anytype API responses
5. Add edge case tests

**Done when:**
- [ ] All methods tested
- [ ] API mocked correctly
- [ ] Edge cases tested
- [ ] Code coverage >80%
- [ ] All tests pass

**Verify:**
- Run `npm test`
- Check coverage report
- Verify all tests pass

**Evidence to record:**
- Test results
- Code coverage report

**Files touched:**
- `tests/unit/api-client.test.ts`

---

### T14: Write Integration Tests for Object Type Flow
**Goal:** Test end-to-end Object Type selection and capture

**Steps:**
1. Create `tests/integration/object-type-flow.test.ts`
2. Add test: "User configures default Object Types"
   - Open Options page
   - Fetch Object Types
   - Configure defaults
   - Save settings
   - Verify settings persisted
3. Add test: "User selects Object Type in popup"
   - Open popup
   - Fetch Object Types
   - Select custom Object Type
   - Save capture
   - Verify Object Type applied
4. Add test: "Last-used Object Type remembered"
   - Capture with custom Object Type
   - Open popup again
   - Verify last-used pre-selected
5. Add test: "Fallback to default on deleted Object Type"
   - Configure Object Type
   - Simulate Object Type deletion
   - Attempt capture
   - Verify fallback to default
6. Mock Anytype API and storage

**Done when:**
- [ ] All integration tests written
- [ ] API and storage mocked
- [ ] All tests pass
- [ ] Code coverage >80%

**Verify:**
- Run `npm test`
- Check integration test results
- Verify all scenarios covered

**Evidence to record:**
- Integration test results
- Code coverage report

**Files touched:**
- `tests/integration/object-type-flow.test.ts`

---

## Docs

### T15: Update README with Object Type Feature
**Goal:** Document Object Type configuration in user guide

**Steps:**
1. Open `README.md`
2. Add section: "Configuring Object Types"
   - Explain what Object Types are
   - How to configure defaults in Options page
   - How to select Object Type in popup
   - How last-used Object Types work
3. Add screenshots:
   - Options page with Object Type configuration
   - Popup with Object Type selector
4. Update feature list to include Object Type configuration

**Done when:**
- [ ] Documentation section added
- [ ] Screenshots added
- [ ] Feature list updated
- [ ] Documentation clear and concise

**Verify:**
- Review README for clarity
- Verify screenshots are clear
- Check for typos

**Evidence to record:**
- Updated README section
- Screenshots

**Files touched:**
- `README.md`

---

### T16: Update CHANGELOG
**Goal:** Document Object Type feature in changelog

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry for v1.1:
   - "Added: Configurable Object Types per capture mode"
   - "Added: Object Type selector in popup"
   - "Added: Last-used Object Type tracking"
   - "Added: Support for custom Anytype Object Types"
3. Document breaking changes (if any)
4. Document migration notes

**Done when:**
- [ ] Changelog entry added
- [ ] All changes documented
- [ ] Breaking changes noted (if any)

**Verify:**
- Review changelog for completeness
- Verify version number correct

**Evidence to record:**
- Changelog entry

**Files touched:**
- `CHANGELOG.md`

---

## Verification

### T17: Manual Verification of All Acceptance Criteria
**Goal:** Verify all acceptance criteria are met

**Steps:**
1. **AC-1: Object Type Selector in Popup**
   - Open popup
   - Verify Object Type dropdown appears
   - Verify default pre-selected
   - Change Object Type
   - Save capture
   - Verify Object Type applied in Anytype

2. **AC-2: Default Object Type Configuration**
   - Open Options page
   - Configure default Object Types for each mode
   - Save settings
   - Create captures of each type
   - Verify correct Object Type used

3. **AC-3: Last-Used Object Type Tracking**
   - Capture Article with custom Object Type
   - Capture another Article
   - Verify last-used Object Type pre-selected

4. **AC-4: Custom Object Type Support**
   - Create custom Object Type in Anytype
   - Refresh extension
   - Verify custom Object Type appears
   - Select and save capture
   - Verify applied

5. **AC-5: Backward Compatibility**
   - Fresh install → verify defaults
   - Existing install → verify no breaking changes

6. **AC-6: Object Type Validation**
   - Configure Object Type
   - Delete in Anytype
   - Attempt capture
   - Verify fallback and warning

7. **AC-7: Settings Persistence**
   - Configure Object Types
   - Restart browser
   - Verify settings retained

8. **AC-8: API Error Handling**
   - Close Anytype
   - Open popup
   - Verify cached Object Types shown

**Done when:**
- [ ] All ACs verified
- [ ] Evidence recorded for each AC
- [ ] Screenshots captured
- [ ] No critical issues found

**Verify:**
- Review all evidence
- Confirm all ACs pass
- Document any issues

**Evidence to record:**
- Screenshots for each AC
- Test results
- Issue list (if any)

**Files touched:**
- `specs/1011-configurable-types/spec.md` (update EVIDENCE section)

---

## Tracking

### T18: Update SPECS.md
**Goal:** Update specification index with implementation status

**Steps:**
1. Open `SPECS.md`
2. Find Epic 10.11 row
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Update Evidence link to `specs/1011-configurable-types/spec.md#evidence`
6. Update Last Updated timestamp

**Done when:**
- [ ] SPECS.md updated
- [ ] Status set to "Done"
- [ ] Evidence link added

**Verify:**
- Review SPECS.md
- Verify link works

**Evidence to record:**
- SPECS.md diff

**Files touched:**
- `SPECS.md`

---

### T19: Update spec.md with Final Evidence
**Goal:** Consolidate all evidence in spec.md EVIDENCE section

**Steps:**
1. Open `specs/1011-configurable-types/spec.md`
2. Update EVIDENCE section with:
   - Task evidence from T1-T18
   - Acceptance criteria verification results
   - Screenshots and test results
   - Code coverage reports
   - Performance benchmarks
3. Add completion timestamp
4. Add final verification summary

**Done when:**
- [ ] All task evidence recorded
- [ ] All AC verification results recorded
- [ ] Screenshots and reports linked
- [ ] Completion timestamp added

**Verify:**
- Review EVIDENCE section for completeness
- Verify all links work
- Check for missing evidence

**Evidence to record:**
- Completed spec.md with full EVIDENCE section

**Files touched:**
- `specs/1011-configurable-types/spec.md`

---

## Summary

**Total Tasks:** 19  
**Estimated Time:** 30-90 minutes per task  
**Total Estimated Time:** 10-30 hours

**Task Groups:**
- Setup: T1-T2 (2 tasks)
- Core Implementation: T3-T11 (9 tasks)
- Tests: T12-T14 (3 tasks)
- Docs: T15-T16 (2 tasks)
- Verification: T17 (1 task)
- Tracking: T18-T19 (2 tasks)

**Dependencies:**
- T3-T4 depend on T1-T2 (settings schema)
- T5 depends on T1 (types)
- T6-T8 depend on T4-T5 (settings manager, API client)
- T9-T11 depend on T4-T5 (settings manager, API client)
- T12-T14 depend on T3-T11 (implementation complete)
- T15-T16 can be done in parallel with T12-T14
- T17 depends on T3-T16 (all implementation and tests complete)
- T18-T19 depend on T17 (verification complete)
