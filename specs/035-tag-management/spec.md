# Spec: Tag Management Integration

**Title:** Tag Management Integration  
**Roadmap Anchor:** N/A (Unplanned Feature)  
**Priority:** P1  
**Type:** Feature  
**Target Area:** Popup UI + API Client  
**Target Acceptance Criteria:** AC-U1, AC-U2, AC-U3, AC-U4, AC-U5

---

## Problem Statement

Currently, the Anytype Clipper extension allows users to add tags to bookmarks and highlights by typing them into a text input field. However, users cannot:
- See which tags already exist in their Anytype workspace
- Select from existing tags to maintain consistency
- Create new tags with proper validation and error handling
- Get real-time feedback when tags are created

This leads to:
- Tag duplication and inconsistency (e.g., "javascript" vs "JavaScript" vs "JS")
- Poor user experience due to lack of autocomplete/suggestions
- Inability to discover existing organizational structures
- Manual tag management required in Anytype Desktop after capture

The Anytype API provides endpoints for listing and creating tags (`/v1/spaces/:space_id/properties/:property_id/tags`), but initial implementation attempts revealed:
- Tag listing returns results in a `data` array (not `tags`)
- Tag creation requires capitalized field names (`Name`, `Color`)
- Property IDs for tags may vary (e.g., "tag" vs "tags") across Anytype versions/spaces.

---

## Goals and Non-Goals

### Goals
- Integrate Anytype tag listing API to fetch existing tags
- Display existing tags as suggestions/autocomplete in the popup UI
- Allow users to select multiple existing tags
- Enable inline tag creation with proper API integration
- Provide visual feedback for tag operations (loading, success, errors)
- Maintain backward compatibility with current tag input behavior
- Support both bookmark and highlight capture workflows

### Non-Goals
- Tag editing or deletion (can be done in Anytype Desktop)
- Tag color customization in the extension (use API defaults)
- Tag analytics or usage statistics
- Bulk tag operations
- Tag hierarchies or relationships
- Custom tag property configuration (auto-detect from object type)

---

## User Stories

**US1: As a user capturing a bookmark, I want to see my existing tags so I can maintain consistent organization.**
- Given I open the popup to save a bookmark
- When I focus on the tags input field
- Then I should see a dropdown/autocomplete list of my existing tags
- And I can select one or more tags from the list

**US2: As a user, I want to create a new tag inline so I don't have to switch to Anytype Desktop.**
- Given I'm entering tags for a bookmark or highlight
- When I type a tag name that doesn't exist and press Enter
- Then a new tag should be created via the API
- And the tag should be immediately available for selection
- And I should see confirmation that the tag was created

**US3: As a user, I want clear feedback when tag operations fail so I can take appropriate action.**
- Given I'm creating a new tag or loading existing tags
- When an API error occurs (network, rate limit, etc.)
- Then I should see a clear error message
- And I should be able to retry or proceed without tags

**US4: As a user capturing highlights, I want the same tag management experience as bookmarks.**
- Given I'm saving a highlight from the context menu or popup
- When I interact with the tags field
- Then I should have the same tag listing and creation capabilities as bookmarks

---

## Scope

### In-Scope
- API client methods for listing tags (`GET /v1/spaces/:space_id/properties/:property_id/tags`)
- API client methods for creating tags (`POST /v1/spaces/:space_id/properties/:property_id/tags`)
- UI component for tag autocomplete/dropdown in popup
- Tag selection (multi-select) functionality
- Inline tag creation with validation
- Error handling for tag API operations
- Loading states and visual feedback
- Integration with existing bookmark and highlight capture flows
- Auto-detection of tag property ID for the current object type
- Pagination support for tag listing (if workspace has many tags)

### Out-of-Scope
- Tag editing or deletion
- Tag color picker in extension UI
- Tag usage statistics or analytics
- Bulk tag operations
- Tag import/export
- Custom tag property configuration UI
- Tag filtering or search beyond autocomplete
- Tag synchronization across multiple spaces (use current space only)

---

## Requirements

### Functional Requirements

**FR1: Tag Listing**
- The extension MUST fetch existing tags from the Anytype API for the current space
- The extension MUST display tags in an autocomplete/dropdown interface
- The extension MUST support pagination if the tag list exceeds API limits
- The extension MUST cache tag lists to minimize API calls (cache per space, invalidate on new tag creation)
- The extension MUST handle empty tag lists gracefully (show "No tags yet" message)

**FR2: Tag Selection**
- Users MUST be able to select multiple tags from the existing tag list
- Users MUST be able to remove selected tags before saving
- The UI MUST visually distinguish selected tags from available tags
- The extension MUST preserve tag selection when switching between bookmark and highlight modes

**FR3: Tag Creation**
- Users MUST be able to create new tags inline by typing a name and pressing Enter or clicking "Create"
- The extension MUST validate tag names before creation (non-empty, reasonable length)
- The extension MUST call the Anytype API to create new tags
- Newly created tags MUST immediately appear in the tag list
- The extension MUST handle tag creation errors (rate limiting, network errors, validation errors)

**FR4: Property ID Resolution**
- The extension MUST determine the correct property ID for tags based on the object type being created
- The extension MUST support a fallback mechanism (e.g., trying "tags" if "tag" returns 404)
- The extension SHOULD cache property ID mappings to avoid repeated lookups
- The extension MUST handle cases where tag properties don't exist for an object type

**FR5: Integration with Capture Flows**
- Tag management MUST work in the bookmark capture flow
- Tag management MUST work in the highlight capture flow
- Tag management MUST work in any future capture flows (articles, notes, etc.)
- Selected tags MUST be included in the object creation payload

### Non-Functional Requirements

**NFR1: Performance**
- Tag list fetching MUST complete within 2 seconds
- Tag autocomplete MUST respond to user input within 100ms
- Tag creation MUST complete within 3 seconds
- The UI MUST remain responsive during tag operations (no blocking)

**NFR2: Reliability**
- Tag API failures MUST NOT block bookmark/highlight capture
- Users MUST be able to proceed with capture even if tag operations fail
- The extension MUST retry failed tag operations with exponential backoff
- Tag list cache MUST survive popup close/reopen

**NFR3: Usability**
- Tag autocomplete MUST support keyboard navigation (arrow keys, Enter, Escape)
- Tag autocomplete MUST support mouse/touch interaction
- The UI MUST provide clear visual feedback for loading, success, and error states
- Tag input MUST be accessible (ARIA labels, keyboard navigation)

**NFR4: Security**
- Tag API calls MUST use the authenticated API client
- Tag data MUST NOT be logged to console (may contain sensitive information)
- Tag operations MUST respect the same security constraints as other API calls (localhost only, HTTPS)

### Constraints Checklist

- ✅ **Security:** Use authenticated API client, localhost-only calls
- ✅ **Privacy:** No external API calls, tag data stays local
- ✅ **Offline behavior:** Graceful degradation if API unavailable (allow manual tag entry)
- ✅ **Performance:** Non-blocking UI, caching, < 2s load time
- ✅ **Observability:** Log tag operations for debugging (without sensitive data)

---

## Acceptance Criteria

### AC-U1: Tag List Display
**Given** a user opens the popup to save a bookmark or highlight  
**When** they focus on the tags input field  
**Then** they should see a dropdown/autocomplete list of existing tags from their current space  
**And** the list should load within 2 seconds  
**And** the list should show tag names and colors  
**Verification approach:** Manual testing with a workspace containing 10+ tags

### AC-U2: Tag Selection
**Given** the tag autocomplete dropdown is displayed  
**When** the user clicks or presses Enter on a tag  
**Then** the tag should be added to the selected tags list  
**And** the tag should be visually distinguished (e.g., chip/badge)  
**And** the user should be able to remove the tag by clicking an "X" icon  
**Verification approach:** Manual testing with multi-tag selection

### AC-U3: Inline Tag Creation
**Given** a user types a tag name that doesn't exist in the autocomplete list  
**When** they press Enter or click a "Create new tag" button  
**Then** a new tag should be created via the API  
**And** the tag should immediately appear in the selected tags list  
**And** the tag should be available in the autocomplete list for future use  
**And** the user should see a success message (e.g., "Tag 'javascript' created")  
**Verification approach:** Manual testing + API call verification

### AC-U4: Error Handling
**Given** a tag API operation fails (network error, rate limit, etc.)  
**When** the error occurs  
**Then** the user should see a clear, actionable error message  
**And** the user should be able to retry the operation  
**And** the user should be able to proceed with capture without tags  
**Verification approach:** Manual testing with simulated API failures (disconnect Anytype, rate limiting)

### AC-U5: Integration with Capture Flows
**Given** a user has selected tags using the tag management UI  
**When** they save a bookmark or highlight  
**Then** the selected tags should be included in the object creation payload  
**And** the tags should appear on the created object in Anytype Desktop  
**Verification approach:** End-to-end testing with verification in Anytype Desktop

---

## Dependencies

### Epic Dependencies
- None (unplanned feature, no roadmap dependencies)

### Technical Dependencies
- **API Client Foundation (Epic 1.1):** Required for making tag API calls
- **Storage Manager (Epic 1.2):** Required for caching tag lists
- **Popup UI (Epic 7.0):** Required for integrating tag UI components
- **Bookmark Capture (Epic 3.0):** Integration point for bookmark tags
- **Highlight Capture (Epic 3.1):** Integration point for highlight tags

### External Dependencies
- Anytype API v1.x with tag endpoints (`/v1/spaces/:space_id/properties/:property_id/tags`)
- Anytype Desktop application running and authenticated

---

## Risks and Mitigations

### Risk 1: Property ID Discovery
**Risk:** The extension may not be able to determine the correct property ID for tags on different object types.  
**Impact:** High - tag management won't work if property ID is incorrect  
**Mitigation:** 
- Implement a robust discovery fallback: if request to `propertyId` fails with 404/400, try common alternatives (e.g., "tags")
- Update and persist working mapping in `chrome.storage.local`
- Hardcode known property IDs for common types (Bookmark, Highlight, Article)
- Document property ID requirements in implementation plan

### Risk 2: Rate Limiting on Tag Creation
**Risk:** Anytype API may rate-limit tag creation, blocking users from creating multiple tags quickly.  
**Impact:** Medium - users may be frustrated if they can't create tags  
**Mitigation:**
- Implement exponential backoff retry logic
- Show clear error messages when rate limited
- Allow users to queue tag creation and retry later
- Cache created tags to avoid duplicate creation attempts

### Risk 3: Large Tag Lists Performance
**Risk:** Workspaces with hundreds of tags may cause performance issues in autocomplete.  
**Impact:** Medium - slow UI, poor user experience  
**Mitigation:**
- Implement pagination for tag fetching
- Use virtual scrolling for large tag lists
- Add client-side filtering/search to narrow results
- Limit initial display to 50 tags, load more on scroll

### Risk 4: Tag API Availability
**Risk:** Tag API endpoints may not be available in all Anytype versions or may change.  
**Impact:** High - feature won't work if API is unavailable  
**Mitigation:**
- Implement graceful degradation to manual tag entry
- Add API version detection and compatibility checks
- Provide clear error messages if API is unavailable
- Document minimum Anytype version requirements

---

## Open Questions

1. **Property ID Discovery:** What is the best approach to discover the tag property ID for different object types? Should we:
   - Hardcode known property IDs for common types (Bookmark, Highlight, Article)?
   - Fetch object type schemas and search for tag properties?
   - Use a default property ID and handle errors gracefully?

2. **Tag Color Handling:** Should the extension:
   - Use default colors from the API when creating tags?
   - Allow users to select colors (adds UI complexity)?
   - Ignore colors entirely and let Anytype Desktop handle it?

3. **Caching Strategy:** How long should tag lists be cached?
   - Cache per session (until popup closes)?
   - Cache with TTL (e.g., 5 minutes)?
   - Invalidate only on new tag creation?

4. **Multi-Space Support:** If a user switches spaces in the popup, should:
   - Tag lists be fetched immediately for the new space?
   - Tag lists be pre-fetched for all spaces on popup open?
   - Tag lists be fetched lazily when the tags field is focused?

---

## EVIDENCE

### Automated Tests
- [x] **Unit Tests (TagService):** Verified caching, API calls, cache invalidation, and **property ID fallback logic**. [tag-service.test.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/tags/tag-service.test.ts)
- [x] **Unit Tests (API Client):** Verified URL construction, query params, and **field capitalization (**Name**, **Color**)**. [client.test.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/api/client.test.ts)
- [x] **Integration Tests:** Verified full flow from service to mocked API including successful tag list parsing from `data` field. [tag-management.test.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/tests/integration/tag-management.test.ts)

### Implementation Files
- **Service:** [tag-service.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/tags/tag-service.ts)
- **API Types:** [types.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/api/types.ts)
- **UI Component:** [tag-autocomplete.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/components/tag-autocomplete.ts)
- **Styles:** [tag-autocomplete.css](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/components/tag-autocomplete.css)
- **Storage:** [schema.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/storage/schema.ts)

### Verification
- [x] **Build Status:** `npm run build` succeeds with zero errors.
- [x] **Test Results:** All tests pass (Jest) covering success, fallback, and error paths.

### API Integration & Final Verification
- [x] **API Quirks Documented:** Critical findings about `PATCH`, `objects` array payload, and creation flow documented in [anytype_api_quirks.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/technical/anytype_api_quirks.md).
- [x] **Manual Verification:** Confirmed by user that Bookmarks and Highlights are successfully saved with tags in Anytype.
- [x] **Bug Fixes:**
    - Resolved `404 Not Found` by implementing `PATCH` support.
    - Resolved `400 Bad Request` by correcting relation property payload to `[{ key: "...", objects: [...] }]`.

---

**End of spec.md**
