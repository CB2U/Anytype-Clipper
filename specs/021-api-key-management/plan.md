# Implementation Plan - API Key Management

## User Review Required

> [!NOTE]
> We will use `GET /v1/spaces` to validate the session, as it's a cheap read operation standard in the API.

## Proposed Changes

### Auth Component

#### [MODIFY] [auth-manager.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/auth/auth-manager.ts)
- Add `disconnect()` method:
    - Clear `auth` key from storage.
    - Reset in-memory state.
    - Notify listeners.
- Add `checkConnection()` (or `validateSession`) method:
    - Attempt a call to `apiClient.getSpaces()`.
    - If 200 OK -> Verified.
    - If 401 Unauthorized -> Call `disconnect()` internally (session invalid).
    - If Network Error -> Keep "Connected" but maybe warn (Offline).

### UI Component

#### [MODIFY] [popup.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)
- In `renderAuthenticatedState` (or equivalent):
    - Add a "Disconnect" button.
    - Bind click event to `authManager.disconnect()`.
- On popup load:
    - Call `authManager.checkConnection()` in background (don't block render).

#### [MODIFY] [popup.html](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.html)
- Add HTML element for the Disconnect button (styled simply for now).

### Verification Plan

#### Automated Tests
- `npm run test` to verify unit tests for `AuthManager` (we will add a test for disconnect).

#### Manual Verification
- **AC1: Disconnect**
    1. Open Popup (Connected).
    2. Click Disconnect.
    3. Check `chrome.storage.local.get('auth')` -> should be empty/undefined.
    4. Popup should show "Connect" screen.
- **AC2: Validation**
    1. Connect successfully.
    2. Edit storage manually to make key invalid (e.g., change last char).
    3. Re-open popup.
    4. Should detect 401 and switch to Disconnect state.
