# Tasks: Challenge Code Authentication

## Setup

### T1: Verify/Update API Client
**Goal:** Ensure `AnytypeApiClient` has necessary methods.
**Steps:**
1. Check `src/lib/api/client.ts`.
2. Add `createChallenge()` method.
3. Add `createApiKey(challengeId)` method.
**Verify:** Code compiles.

## Core Implementation

### T2: Implement AuthManager
**Goal:** Create the logic for managing the auth flow.
**Steps:**
1. Create `src/lib/auth/auth-manager.ts` (using lib for shared logic, or background? Plan said background, but `lib/auth` is better for import in popup).
2. Implement `startAuth` (get challenge).
3. Implement `finalizeAuth` (poll for key).
4. Integrate `StorageManager` to save result.
**Verify:** Unit test/script to run the flow (mocking API).

### T3: Update Popup UI (HTML/CSS)
**Goal:** Create a simple Auth View in the popup.
**Steps:**
1. Update `src/popup/popup.html`: Add `#auth-view` and `#main-view` containers.
2. Add "Connect" button and "Code" display area to `#auth-view`.
3. Add CSS to toggle visibility.
**Verify:** Open popup, see new elements (or blank if hidden).

### T4: Update Popup Logic
**Goal:** Wire up the UI to `AuthManager`.
**Steps:**
1. Update `src/popup/popup.ts`.
2. check auth state on load.
3. Switch views.
4. Handle "Connect" click -> call `AuthManager` -> display code -> await key.
**Verify:** Manual test of flow.

## Verification

### T5: Manual Verification
**Goal:** Run through the full flow with Anytype Desktop (or Mock).
**Steps:**
1. Build extension.
2. Load in browser.
3. Click extension icon.
4. Verify "Connect" screen.
5. Click Connect, see code.
6. Verify Storage updates.

## Tracking

### T6: Update Tracking
**Goal:** Update `SPECS.md` and `SPEC.md`.

### T7: Final Evidence
**Goal:** Record evidence in `spec.md`.
