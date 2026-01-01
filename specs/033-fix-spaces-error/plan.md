# Plan: Fix Spaces Loading Error

## Goal
Fix the "Error loading spaces" bug by identifying the schema mismatch between the Extension and the Anytype Desktop API, and implementing a robust response parser.

## Architecture
The `AnytypeApiClient` currently expects `GET /v1/spaces` to return `{ spaces: Space[] }`. 
We suspect the API actually returns a flat `Space[]` array or uses a different property name (e.g., `data`).
We will update `AnytypeApiClient.getSpaces()` to inspect the response and normalize it.

## Proposed Changes

### `src/lib/api/client.ts`
- Update `getSpaces()` to:
    1.  Fetch `unknown` response.
    2.  Check if response is Array -> return `{ spaces: response }`.
    3.  Check if response has `spaces` property -> return it.
    4.  Check if response has `data` property -> return `{ spaces: response.data }`.
    5.  Throw descriptive error if format is unrecognized.

### `src/background/service-worker.ts`
- Add logging of the raw `getSpaces` result before sending to popup, to aid future debugging.
- Ensure `result.spaces` access is safe.

### `src/popup/popup.ts`
- Improve error handling to show the *actual* error message from the background, not just "Error loading spaces".

## Verification Plan

### Automated Tests
- Create `src/lib/api/verify_spaces_schema.ts`:
    - A script that connects to `localhost:31009`.
    - It will need an API Key (we will ask user to paste it or we will try to read from a local config if available, but likely user input is needed).
    - **Alternate Strategy:** We will skip a standalone script requiring auth and rely on the Extension's console logs after applying the fix.

### Manual Verification
1.  **Rebuild Extension:** `npm run build`
2.  **Reload Extension:** In `chrome://extensions`.
3.  **Inspect Background:** Open Service Worker console.
4.  **Open Popup:** Click extension icon.
5.  **Check Output:**
    - verify `Save to Space` dropdown is populated.
    - verify Background Console shows "Spaces fetched: X items".
