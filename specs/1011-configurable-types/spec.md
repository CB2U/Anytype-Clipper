# Spec: Configurable Object Types

**Roadmap Anchor:** [roadmap.md 10.11](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L1118-L1124)  
**Priority:** P2  
**Type:** Feature  
**Target Area:** UI & Integration (v1.1 Post-MVP)  
**Target Acceptance Criteria:** FR2.9, FR2.10, FR2.11, FR2.12, FR13.1, FR13.18, NFR4.1, US-OT1, US-OT2

---

## Problem Statement

Currently, the extension uses hardcoded Object Types for different capture modes. Users cannot:
1. Configure which Object Type to use for Articles, Highlights, or Bookmarks
2. Select a different Object Type on-the-fly in the popup
3. Use custom Object Types they've created in Anytype

This limits flexibility for users who want to organize their captures using custom taxonomies or specific Object Types beyond the built-in options (Bookmark, Highlight, Article, Note, Task).

---

## Goals and Non-Goals

### Goals
- Allow users to configure default Object Type for each capture mode (Article, Highlight, Bookmark)
- Display Object Type selector dropdown in popup for on-the-fly selection
- Remember last-used Object Type per capture mode as the new default
- Support custom Anytype Object Types beyond built-in types
- Integrate Object Type configuration into the Options page
- Maintain backward compatibility with existing captures

### Non-Goals
- Automatic Object Type detection based on content analysis
- Object Type templates or custom field mapping
- Bulk re-typing of existing captures
- Object Type creation from within the extension
- Relationship-based Object Type suggestions
- Multi-Object Type captures (one capture creating multiple Object Types)

---

## User Stories

### US-OT1: Configure Default Object Types for Capture Modes

**As a** knowledge worker who organizes different content types in specific ways,  
**I want to** set default Object Types for each capture mode (Article, Highlight, Bookmark),  
**So that** my captures are automatically organized according to my workflow without manual selection each time.

**Acceptance:**
- Can configure default Object Type for Articles in Settings (e.g., "Research Paper", "Blog Post", "Documentation")
- Can configure default Object Type for Highlights in Settings (e.g., "Quote", "Insight", "Reference")
- Can configure default Object Type for Bookmarks in Settings (e.g., "Bookmark", "Resource", "Tool")
- Settings page shows dropdown for each capture mode with available Anytype Object Types
- Extension remembers last-used Object Type per capture mode
- Default Object Types are applied automatically when capturing content
- Can override default by selecting different Object Type in popup

### US-OT2: Select Object Type On-the-Fly in Popup

**As a** researcher capturing diverse content,  
**I want to** select the Object Type in the popup before saving,  
**So that** I can categorize content appropriately based on context without changing my default settings.

**Acceptance:**
- Popup displays Object Type selector dropdown alongside Space selector
- Dropdown shows all available Anytype Object Types (built-in and custom)
- Default Object Type for current capture mode is pre-selected
- Can change Object Type before clicking "Save"
- Last-used Object Type for this capture mode becomes the new default
- Object Type selection works for all capture modes (Article, Highlight, Bookmark)
- Custom Object Types created in Anytype appear in the dropdown

---

## Scope

### In-Scope
- Object Type selector dropdown in popup UI
- Fetch available Object Types from Anytype API
- Default Object Type configuration per capture mode in Options page
- Last-used Object Type tracking per capture mode
- Support for custom Anytype Object Types
- Storage of Object Type preferences in `chrome.storage.local`
- Backward compatibility with existing captures (use built-in defaults)
- Object Type validation before capture
- Error handling for invalid or deleted Object Types

### Out-of-Scope
- Automatic Object Type detection based on content
- Object Type creation from extension
- Custom field mapping per Object Type
- Object Type templates
- Bulk re-typing of existing captures
- Object Type-specific capture workflows
- Relationship suggestions based on Object Type
- Object Type hierarchy or inheritance
- Multi-Object Type captures

---

## Requirements

### Functional Requirements

#### FR-1: Object Type Selector in Popup
- Display Object Type dropdown in popup below Space selector
- Fetch available Object Types from Anytype API on popup open
- Show loading state while fetching Object Types
- Handle API errors gracefully (show cached Object Types or built-in defaults)
- Pre-select default Object Type for current capture mode
- Allow user to change Object Type before saving
- Update last-used Object Type when user saves capture
- Show Object Type icon/emoji if available from API

#### FR-2: Default Object Type Configuration
- Add Object Type configuration section to Options page
- Display three Object Type dropdowns:
  - Default Object Type for Articles
  - Default Object Type for Highlights
  - Default Object Type for Bookmarks
- Fetch available Object Types from Anytype API
- Show built-in Object Types (Bookmark, Highlight, Article, Note, Task)
- Show custom Object Types created by user in Anytype
- Allow "Use last-used" option (remembers last selection per mode)
- Save configuration to `chrome.storage.local`
- Persist across browser sessions

#### FR-3: Last-Used Object Type Tracking
- Track last-used Object Type per capture mode separately
- Update last-used Object Type when user saves capture
- Use last-used Object Type as default for next capture of same mode
- Store in `chrome.storage.local` under `settings.lastUsedObjectTypes`
- Structure: `{ article: string, highlight: string, bookmark: string }`

#### FR-4: Custom Object Type Support
- Fetch all Object Types from Anytype API (built-in and custom)
- Display custom Object Types in dropdowns
- Validate Object Type ID before capture
- Handle deleted Object Types gracefully (fallback to built-in default)
- Cache Object Types list for offline use
- Refresh Object Types list when Options page is opened

#### FR-5: Backward Compatibility
- Use built-in defaults for users who haven't configured Object Types
- Default mappings:
  - Article → "Article" Object Type
  - Highlight → "Highlight" Object Type (or "Note" if not available)
  - Bookmark → "Bookmark" Object Type
- Migrate existing settings schema to include Object Type preferences
- No breaking changes to existing capture flows

### Non-Functional Requirements

#### NFR-1: Performance
- Object Type fetching must complete within 2s
- Popup must not be delayed by Object Type loading (show cached)
- Object Type dropdown must render within 100ms
- Settings save must complete within 200ms

#### NFR-2: Usability
- Clear labels for Object Type selectors
- Inline help text explaining Object Types
- Visual distinction between built-in and custom Object Types
- Keyboard navigation support in dropdowns
- Screen reader compatible (ARIA labels)

#### NFR-3: Reliability
- Handle API errors gracefully (use cached Object Types)
- Validate Object Type ID before capture
- Fallback to built-in default if configured Object Type is deleted
- Cache Object Types list for offline use
- Atomic save operations for settings

#### NFR-4: Compatibility
- Must work with Anytype API v1.x
- Must support all Anytype Object Types (built-in and custom)
- Must handle Object Type schema changes gracefully
- Must maintain backward compatibility with existing captures

### Constraints

#### CONST-1: API Dependency
- Requires Anytype API endpoint to fetch Object Types
- Must handle API unavailability (use cached data)
- Must validate Object Type IDs before capture

#### CONST-2: Storage
- Object Type preferences must fit within `chrome.storage.local` quota
- Object Types list should be cached to reduce API calls
- Settings schema must be versioned for migrations

#### CONST-3: UX Consistency
- Object Type selector must match existing Space selector design
- Options page layout must accommodate new configuration section
- No breaking changes to existing popup workflow

---

## Acceptance Criteria

### AC-1: Object Type Selector in Popup
**Verification approach:** Manual test - open popup, verify Object Type dropdown appears, verify default Object Type pre-selected, change Object Type, save capture, verify Object Type applied

### AC-2: Default Object Type Configuration
**Verification approach:** Manual test - open Options page, configure default Object Types for each mode, save settings, create captures, verify correct Object Type used

### AC-3: Last-Used Object Type Tracking
**Verification approach:** Manual test - capture Article with custom Object Type, capture another Article, verify last-used Object Type pre-selected

### AC-4: Custom Object Type Support
**Verification approach:** Manual test - create custom Object Type in Anytype, refresh extension, verify custom Object Type appears in dropdowns

### AC-5: Backward Compatibility
**Verification approach:** Manual test - fresh install, verify built-in defaults used, existing install, verify no breaking changes

### AC-6: Object Type Validation
**Verification approach:** Manual test - configure Object Type, delete it in Anytype, attempt capture, verify fallback to default

### AC-7: Settings Persistence
**Verification approach:** Manual test - configure Object Types, restart browser, verify settings retained

### AC-8: API Error Handling
**Verification approach:** Manual test - close Anytype, open popup, verify cached Object Types shown

---

## Dependencies

### Epic Dependencies
- Epic 1.2: Storage Manager (settings persistence)
- Epic 7.0: Popup UI (Object Type selector integration)
- Epic 7.2: Options Page (Object Type configuration)
- Epic 1.1: API Client Foundation (Object Type fetching)

### Technical Dependencies
- Anytype API endpoint for fetching Object Types
- `chrome.storage.local` API
- Settings schema v2 (with Object Type preferences)
- Storage manager module
- API client module

### API Requirements
- **[NEEDS CLARIFICATION: Object Types API endpoint]** - What is the Anytype API endpoint to fetch available Object Types? Does it return both built-in and custom Object Types?
- **[NEEDS CLARIFICATION: Object Type schema]** - What fields are returned for each Object Type (ID, name, icon, type, etc.)?
- **[NEEDS CLARIFICATION: Object Type validation]** - How should the extension validate that an Object Type ID is still valid before creating a capture?

---

## Risks and Mitigations

### Risk 1: Object Type API Unavailable
**Impact:** High - users cannot select Object Types  
**Likelihood:** Medium - API may be unavailable  
**Mitigation:**
- Cache Object Types list in `chrome.storage.local`
- Show cached Object Types with warning if API fails
- Provide "Refresh Object Types" button in Options page
- Fallback to built-in defaults if cache is empty

### Risk 2: Deleted Object Type
**Impact:** Medium - capture may fail if configured Object Type is deleted  
**Likelihood:** Low - users rarely delete Object Types  
**Mitigation:**
- Validate Object Type ID before capture
- Fallback to built-in default if validation fails
- Show warning notification if fallback occurs
- Provide option to update default Object Type in settings

### Risk 3: Settings Schema Migration
**Impact:** Medium - existing settings may be incompatible  
**Likelihood:** High - new settings fields required  
**Mitigation:**
- Version settings schema (v1 → v2)
- Implement migration logic in settings manager
- Use built-in defaults for missing Object Type preferences
- Test migration with existing user data

### Risk 4: UX Complexity
**Impact:** Low - popup may feel cluttered with two dropdowns  
**Likelihood:** Medium - users may find it confusing  
**Mitigation:**
- Use clear labels and help text
- Pre-select sensible defaults
- Consider collapsible "Advanced" section for Object Type selector
- Provide inline help explaining Object Types

---

### API Requirements

**API Endpoint Confirmed:**
- **Endpoint:** `GET /v1/spaces/{space_id}/types`
- **Description:** Retrieves a paginated list of types available within the specified space
- **Returns:** Both built-in types (e.g., 'Page', 'Note', 'Task') and custom user-created types
- **Pagination:** Supports offset and limit parameters (default limit: 100, max: 1000)
- **Filtering:** Supports dynamic filtering via query parameters (e.g., `?name[contains]=task`)

**Type Schema (from OpenAPI spec):**
```typescript
interface Type {
  id: string;              // Unique ID across spaces (e.g., "bafyreigyb6l5szohs32ts26ku2j42yd65e6hqy2u3gtzgdwqv6hzftsetu")
  key: string;             // Type key, can be same across spaces for known types (e.g., "page", "note", "bookmark")
  name: string;            // Display name (e.g., "Page", "Note", "Bookmark")
  plural_name: string;     // Plural display name (e.g., "Pages", "Notes", "Bookmarks")
  icon: Icon | null;       // Icon (emoji, file, or named icon)
  layout: TypeLayout;      // Layout type (basic, profile, action, note, bookmark, set, collection, participant)
  archived: boolean;       // Whether the type is archived/deleted
  object: string;          // Data model (always "type")
  properties: Property[];  // Properties linked to the type
}
```

**Object Creation with Type:**
- When creating an object via `POST /v1/spaces/{space_id}/objects`, use the `type_key` field
- The `type_key` is required and should be the `key` field from the Type object (e.g., "page", "bookmark")
- Example: `{ "type_key": "bookmark", "name": "My Bookmark", ... }`

**Type Validation:**
- To validate a type exists, check if `archived` is `false` in the Type object
- Deleted types have `archived: true` or the Type object is `null`
- The extension should filter out archived types when displaying options

---

## Open Questions

~~All open questions have been resolved by examining the OpenAPI specification.~~

No remaining open questions.

---

## EVIDENCE

### Task Evidence

#### T1: Extend Settings Schema with Object Type Fields ✅
**Completed:** 2026-01-08

**Changes:**
- Extended [`settings.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/types/settings.ts) with `SettingsV2` interface
- Added `ObjectTypeInfo` interface matching Anytype API schema
- Added `Icon` type union (EmojiIcon, FileIcon, NamedIcon)
- Added `TypeLayout` type for Object Type layouts
- Updated `Settings` type alias to `SettingsV2`

**Verification:**
```bash
npm run build
# ✓ built in 916ms - TypeScript compilation passed
```

**Files Modified:**
- `src/types/settings.ts` (+80 lines)

---

#### T2: Add Object Type Constants ✅
**Completed:** 2026-01-08

**Changes:**
- Added built-in Object Type keys to [`settings-constants.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/types/settings-constants.ts)
  - `BUILT_IN_OBJECT_TYPE_KEYS.ARTICLE = 'page'`
  - `BUILT_IN_OBJECT_TYPE_KEYS.HIGHLIGHT = 'note'`
  - `BUILT_IN_OBJECT_TYPE_KEYS.BOOKMARK = 'bookmark'`
- Added `DEFAULT_OBJECT_TYPES` configuration
- Added `OBJECT_TYPES_CACHE_EXPIRY_MS = 24 hours`

**Verification:**
```bash
npm run build
# ✓ built in 916ms - Constants properly exported
```

**Files Modified:**
- `src/types/settings-constants.ts` (+27 lines)

---

#### T3: Implement Settings Migration v1 → v2 ✅
**Completed:** 2026-01-08

**Changes:**
- Implemented `migrateV1toV2()` function in [`settings-manager-v2.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/storage/settings-manager-v2.ts)
- Updated `migrateSettings()` to handle v1→v2 migration
- Migration adds `objectTypes` field with:
  - Built-in defaults (article: 'page', highlight: 'note', bookmark: 'bookmark')
  - Empty last-used tracking
  - Empty cache
  - lastFetchedAt: 0
- Added error handling with fallback to defaults
- Added migration logging

**Verification:**
```bash
npm run build
# ✓ built in 953ms - Migration logic compiles successfully
```

**Files Modified:**
- `src/lib/storage/settings-manager-v2.ts` (+50 lines)

---

#### T4: Add Object Type Methods to Settings Manager ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Type management methods to [`settings-manager-v2.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/storage/settings-manager-v2.ts):
  - `getDefaultObjectType(mode)` - returns default or last-used Object Type key
  - `setDefaultObjectType(mode, typeKey)` - sets default for mode
  - `getLastUsedObjectType(mode)` - returns last-used Object Type key
  - `updateLastUsedObjectType(mode, typeKey)` - updates last-used tracking
  - `getCachedObjectTypes()` - returns cached Object Types array
  - `setCachedObjectTypes(types)` - caches Object Types (filters archived)
  - `isCacheStale()` - checks if cache is older than 24 hours
- Added `getDefaultSettingsV2()` helper function
- All methods include JSDoc comments and error handling

**Verification:**
```bash
npm run build
# ✓ built in 953ms - All methods compile successfully
```

**Files Modified:**
- `src/lib/storage/settings-manager-v2.ts` (+135 lines)

---

#### T5: Add Object Types API Methods to API Client ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Types API types to [`types.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/api/types.ts):
  - `ListTypesOptions` interface
  - `ListTypesResponse` interface
- Added `fetchObjectTypes(spaceId, options)` method to [`client.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/api/client.ts):
  - Fetches Object Types from `GET /v1/spaces/{spaceId}/types`
  - Handles pagination automatically (fetches all pages)
  - Filters out archived types
  - 5-second timeout
  - Returns empty array on error (caller uses cached types)
  - Safety limit: stops after 10,000 results

**Verification:**
```bash
npm run build
# ✓ built in 958ms - API client compiles successfully
```

**Files Modified:**
- `src/lib/api/types.ts` (+32 lines)
- `src/lib/api/client.ts` (+68 lines)

---

#### T6: Add Object Type Selector to Popup HTML ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Type selector dropdown to [`popup.html`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.html)
- Added help text with tooltip for user guidance
- Added error message container for offline/cache warnings
- Positioned selector between Space selector and form fields
- Added ARIA labels for accessibility

**Verification:**
```bash
npm run build
# ✓ built in 992ms - HTML changes compiled successfully
```

**Files Modified:**
- `src/popup/popup.html` (+14 lines)

---

#### T7: Add Object Type Styles to Popup CSS ✅
**Completed:** 2026-01-08

**Changes:**
- Added CSS styles for Object Type selector to [`popup.css`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.css)
- Styled help text icon with cursor:help
- Styled field-error message with warning colors
- Consistent with existing dark theme design

**Verification:**
```bash
npm run build
# ✓ built in 992ms - CSS changes compiled successfully
```

**Files Modified:**
- `src/popup/popup.css` (+29 lines)

---

#### T8: Implement Object Type Logic in Popup ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Type DOM element references to [`popup.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)
- Implemented `loadObjectTypes()` function:
  - Fetches Object Types from service worker
  - Populates dropdown with icons and names
  - Shows error message if using cached types
  - Handles empty/error states
- Implemented `setDefaultObjectType()` function:
  - Determines capture mode (article/highlight/bookmark)
  - Gets default Object Type from settings
  - Sets dropdown value automatically
- Integrated with save flow:
  - Gets selected Object Type from dropdown
  - Passes to capture service
  - Updates last-used Object Type after successful save
- Added space change listener to reload Object Types
- Added service worker command handlers in [`service-worker.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts):
  - `CMD_GET_OBJECT_TYPES` - fetches and caches types
  - `CMD_GET_DEFAULT_OBJECT_TYPE` - gets default for mode
  - `CMD_UPDATE_LAST_USED_OBJECT_TYPE` - updates tracking

**Verification:**
```bash
npm run build
# ✓ built in 978ms - All popup logic compiles successfully
```

**Files Modified:**
- `src/popup/popup.ts` (+120 lines)
- `src/background/service-worker.ts` (+44 lines)

---

#### T9: Add Object Type Configuration to Options Page HTML ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Type configuration section to [`options.html`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/options/options.html)
- Added dropdowns for default Object Types (bookmark, highlight, article)
- Added help text elements to display last-used types
- Added "Refresh Object Types" button
- Positioned after Default Spaces section for logical grouping

**Verification:**
```bash
npm run build
# ✓ built in 995ms - HTML changes compiled successfully
```

**Files Modified:**
- `src/options/options.html` (+33 lines)

---

#### T10: Add Object Type Styles to Options Page CSS ✅
**Completed:** 2026-01-08

**Changes:**
- No CSS changes needed - existing styles work perfectly
- Options page CSS already supports form groups, dropdowns, and help text
- Consistent with existing design system

**Verification:**
```bash
npm run build
# ✓ built in 995ms - No CSS changes required
```

**Files Modified:**
- None (existing styles sufficient)

---

#### T11: Implement Object Type Logic in Options Page ✅
**Completed:** 2026-01-08

**Changes:**
- Added Object Type DOM element references to [`options.ts`](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/options/options.ts)
- Implemented `fetchObjectTypes()` function:
  - Fetches Object Types from service worker
  - Uses first available space
  - Handles errors gracefully
- Implemented `populateObjectTypeDropdowns()` function:
  - Populates all three dropdowns with icons and names
  - Preserves selected values during refresh
- Implemented `displayLastUsedObjectTypes()` function:
  - Shows last-used type for each mode
  - Grayed out text for visual distinction
- Updated `saveSettingsHandler()` to save Object Type defaults
- Added refresh button event listener
- Added status message function for Object Types

**Verification:**
```bash
npm run build
# ✓ built in 964ms - All options logic compiles successfully
```

**Files Modified:**
- `src/options/options.ts` (+130 lines)

---

### Acceptance Criteria Verification
_Verification will be recorded here after implementation and manual testing_

