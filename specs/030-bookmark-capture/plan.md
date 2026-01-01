# Implementation Plan - Epic 3.0: Bookmark Capture

## User Review Required
> [!IMPORTANT]
> **Object Schema:** We will implement the `createObject` call with a generic payload structure suitable for known Anytype layouts (`title`, `description`, `source_url`). The exact mapping depends on the user's specific Anytype configuration, but we will use best-effort standard fields.

## Proposed Changes

### 1. API Client (`src/lib/api/`)
#### [MODIFY] `client.ts`
- Add `createObject(spaceId: string, params: CreateObjectParams): Promise<AnytypeObject>` method.
- Define `CreateObjectParams` interface.

### 2. Chrome Extension Background (`src/background/`)
#### [MODIFY] `message_handler.ts` (or similar, create if missing)
- Implement `handleMessage` to support `CMD_GET_SPACES` and `CMD_CAPTURE_BOOKMARK`.
- Integrate `AnytypeApiClient` calls.

### 3. Popup UI (`src/popup/`)
#### [MODIFY] `popup.ts` / `popup.html`
- Implement state machine for switching views (Auth vs Main).
- Implement `MainView`:
    - `loadSpaces()` on init.
    - Render Form (Title, Note, Tags, Space Select).
    - Handle Save button click -> `runtime.sendMessage`.
    - Handle success/error feedback.

#### [NEW] `src/popup/components/bookmark-form.ts` (Optional)
- Separate form logic if `popup.ts` gets too large.

### 4. Storage (`src/lib/storage/`)
#### [MODIFY] `storage-manager.ts`
- Add support for saving `lastSelectedSpaceId` in `config` area.

## Verification Plan

### Automated Tests
- **Unit Tests:**
    - Test `AnytypeApiClient.createObject` payload construction.
    - Test `createObject` error handling (e.g. invalid space ID).

### Manual Verification
1. **Setup:**
   - Ensure Anytype Desktop is running and authenticated.
   - Open a browser tab (e.g., `https://example.com`).
2. **Space Loading:**
   - Open Popup. Verify "Loading..." then Space dropdown populates.
3. **Capture:**
   - Fill Title: "Example Domain".
   - Fill Note: "Test bookmark".
   - Click "Save".
   - Verify "Saved" message appears.
   - Verify object appears in Anytype Desktop in the selected Space.
4. **Persistence:**
   - Close Popup.
   - Change selected Space.
   - Save another bookmark.
   - Close and reopen Popup. Verify last Space is pre-selected.
