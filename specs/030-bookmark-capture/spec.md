# Specification: Epic 3.0 - Bookmark Capture

## 1. Overview
**Goal:** Enable users to capture the current tab URL as a bookmark in Anytype, including metadata (title, domain) and user-added context (tags, notes).

**Roadmap Anchor:** 3.0
**PRD Reference:** FR3.1, FR3.2, FR3.3, FR3.4, AC2, US1
**Status:** Planning

## 2. Problem Statement
Users currently cannot save web pages to Anytype without manual copy-pasting. They need a quick "Save as Bookmark" action from the browser that works offline (via queue, though queue is Epic 5.0, current focus is direct capture or fail-fast).

## 3. User Stories
- **US1:** As a user, I want to click the extension icon and save the current page as a bookmark so I can read it later.
- **US2:** As a user, I want to select which Anytype Space to save the bookmark to.
- **US3:** As a user, I want to add tags and a note to the bookmark before saving.
- **US4:** As a user, I want to receive visual confirmation when the bookmark is successfully saved.

## 4. Requirements

### Functional
- **FR3.1:** Capture Tab Info: URL, Title, Favicon (using `chrome.tabs`).
- **FR3.2:** User Input: Allow adding `tags` (comma separated) and `note` (text area).
- **FR3.3:** Object Creation: Create an object in Anytype with:
    - **Type:** Bookmark (or default "Page/Note" if Bookmark type doesn't exist yet in user's schema, strictly "Bookmark" per PRD).
    - **Properties:**
        - `title`: Page Title
        - `source_url`: Page URL
        - `description`: User note
        - `tags`: User tags
        - `domain`: Extracted from URL (e.g., "github.com")
- **FR3.4:** Notifications: Show "Saved!" state in popup.
- **FR2.1/2.2:** Space Selection: Fetch and display list of Spaces from `GET /v1/spaces`.
- **FR2.5:** Persistence: Remember the last selected Space.

### Non-Functional
- **NFR1.1:** Popup opens <300ms.
- **NFR3.3:** Minimal permissions (use `activeTab` to get URL/Title).

## 5. Scope
**In Scope:**
- Popup UI: Authentication check -> Main View.
- Main View: Space Selector, Title (editable), Note Input, Tag Input, Save Button.
- Background: Handling "CAPTURE" message and calling API.
- API: `createObject` endpoint implementation.

**Out of Scope:**
- Offline Queue (Epic 5.0) - for now, if API fails, show error.
- Rich Metadata (Open Graph, etc.) (Epic 3.2).
- Screenshots (Post-MVP).
- PDF/File capture.

## 6. Implementation Notes
- **API Client:** Needs `createObject(spaceId: string, objectData: any)` method.
- **Object Schema:** We will attempt to use a standard "Bookmark" layout if standard in Anytype, or a generic object with specific fields.
    - *Assumption:* We will try to map to standard fields.
- **State Management:** Popup needs to handle state: `Loading` (init), `AuthRequired` (if token invalid), `Ready` (form), `Saving` (spinner), `Success` (check), `Error` (msg).

## 7. Risks
- **Object Layout:** "Bookmark" layout might not exist in every user's space. Fallback to "Note" or "Basic".
- **Validation:** API might reject invalid fields.

## EVIDENCE

### Task Completion Summary

**Implementation (T1): ✅ Complete**
- Added `CreateObjectParams` and related types in `src/lib/api/types.ts`.
- Implemented `createObject` in `src/lib/api/client.ts`.
- **Verification:**
    - Created `src/lib/api/verify_create_object.ts` to mock API calls.
    - Confirmed correct payload construction (typeId='Bookmark', properties mapped).
    - Confirmed correct response mapping.

    - Confirmed correct response mapping.

**Background Implementation (T2): ✅ Complete**
- Defined message types in `src/types/messages.ts`.
- Implemented message handler in `src/background/service-worker.ts` to proxy requests to `AnytypeApiClient`.
- Handled `CMD_GET_SPACES` and `CMD_CAPTURE_BOOKMARK`.
- Error handling ensures exceptions (including AuthError) are returned to the sender.

**Popup UI - Space Selection (T3): ✅ Complete**
- Added Space Selector dropdown to `popup.html`.
- Implemented `CMD_GET_SPACES` call in `popup.ts`.
- Implemented persistent selection using `chrome.storage.local`.
- Added loading and error states for space fetching.

**Bookmark Form (T4): ✅ Complete**
- Added Title, Note, Tags inputs to `popup.html`.
- Implemented `chrome.tabs.query` to auto-fill title.
- Implemented `CMD_CAPTURE_BOOKMARK` message sending.
- Added visual feedback (Save/Saving.../Saved).

**Verification (T5): ✅ Complete via Script**
- Created `src/background/verify_message_handler.ts` to simulate Extension Messaging layer.
- Verified `CMD_GET_SPACES` proxies correctly to API client.
- Verified `CMD_CAPTURE_BOOKMARK` proxies correctly with payload.
- *Note:* UI interaction verification requires manual testing or E2E (Epic 8.2). Logic verified via integration test.
