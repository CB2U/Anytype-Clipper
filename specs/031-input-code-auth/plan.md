
# Implementation Plan: Input Code Auth

## Architecture
- **Popup UI:** Modify `popup.html` to add a specific `#auth-input-view` or modify `#auth-view` to support both modes (Display vs Input). Given the user's request, we will prioritize Input Mode.
- **Auth Manager:** Add `pairWithCode(code: string)` method.
- **API Client:** Add `pair(code: string)` method.

## Proposed Changes

### 1. API Client (`src/lib/api/types.ts`)
- **Fix:** Remove `code` from `CreateChallengeResponse`.
- **Verify:** Ensure `createApiKey` takes the user-provided code and sends it to `POST /v1/auth/api_keys`.

### 2. Auth Manager (`src/lib/auth/auth-manager.ts`)
- **Update:** `startAuth` should only return `challenge_id`.
- **New:** `submitCode(code: string)`:
  - Calls `apiClient.createApiKey({ challengeId, code })`.
  - On success, saves key and updates state.

### 3. Popup UI (`src/popup/popup.html` & `.ts`)
- **Change:** `#challenge-section` should now contain an INPUT field (e.g., `#input-code`) instead of a generic "code display".
- **Logic:**
  1. User clicks "Connect".
  2. `startAuth` called -> Desktop shows code.
  3. UI shows "Enter code from Anytype".
  4. User types code -> Click "Verify".
  5. `submitCode` called -> Success/Fail.
- **Fallback:** "Open in New Tab" button (per user request).

### 4. New Tab Auth (Refinement T6)
- **User Requirement:** "Open new tab for auth, close on success" to avoid popup closing.
- **Architecture:** 
  - `AuthManager` must persist `currentChallengeId` and `status` to `chrome.storage.session` (or `local`) to survive popup-to-tab transitions and reloads.
  - `popup.html` > "Connect" button -> Opens `popup.html?auth=true` in a new tab.
  - `popup.ts`:
    - Checks for `?auth=true` query param.
    - If present, auto-invokes `handleConnect`.
    - On success: Checks if running in a Tab (vs Popup). If Tab, calls `window.close()`.

## Verification Plan
### Automated Tests
- Integration test for `auth-manager` (mocking API).

### Manual Verification
1. Open Popup.
2. Click Connect.
3. Enter "1234" (Mocked success).
4. Verify transition to Main View.
5. Click "Open in Tab".
6. Verify Auth page opens in new tab.
