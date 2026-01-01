
# Epic: Input Code Authentication (Unplanned)

**Priority:** P0 (Blocker)
**Type:** Feature / Change
**Status:** Done

## Problem
The initial implementation (Epic 2.0) assumed the Extension could generate and display a pairing code. However, API documentation confirms that `POST /v1/auth/challenges` triggers the **Desktop App** to display the code. The API response *does not* contain the code. Therefore, the user *must* input the code seen on the Desktop into the Extension. This "Input Code" flow is the only supported method.

## Goal
Update the authentication flow to match the actual API behavior:
1. Extension initiates challenge -> Desktop displays code.
2. User enters code in Extension.
3. Extension exchanges code + challenge_id for API key.

## Scope
**In-Scope:**
- **Refactor:** Remove "Display Code" logic from `AnytypeApiClient` types and `AuthManager`.
- **UI:** Switch `popup.html` auth view to an Input Field paradigm.
- **Logic:** Implement `submitPairingCode` which calls `createApiKey`.
- **API:** Correct `CreateChallengeResponse` type (remove `code` property).

**Out-of-Scope:**
- "Display Code" flow (confirmed impossible via current API).

## User Stories
1. **As a user**, I want to click "Connect" and see a place to enter a code, so I can pair with my Desktop app which is displaying a code.
2. **As a user**, I want to be able to open the auth page in a new tab if I need more time, so I don't lose my context if the popup closes.

## Functional Requirements
- **FR31.1:** Popup MUST display a 4-digit numeric input field upon "Connect" (or via a "Enter Code" toggle).
- **FR31.2:** Extension MUST submit the entered code to the Anytype API.
- **FR31.3:** On success, Extension MUST store the returned API key/Credentials.
- **FR31.4:** Extension MUST support opening the auth view in a full tab (page).

## Acceptance Criteria
- **AC-U1:** "Connect" flow shows input field.
- **AC-U2:** Submitting valid code results in "Authenticated" state.
- **AC-U3:** Invalid code shows error message.
- **AC-U4:** "Open in Tab" button opens the auth interface in a new browser tab.

## Risks & Open Questions
- **Q1:** What is the exact API endpoint to *send* a code? 
    - *Assumption:* `POST /v1/auth/pair { code: "..." }`? Or does `createChallenge` work bi-directionally?
    - *Mitigation:* I will inspect the API client code. If unknown, I will assume a strict schema and allow the user to correct the endpoint during implementation or via clarification.

## EVIDENCE

### T1: Fix API Client Types
- Removed `code` from `CreateChallengeResponse` in `src/lib/api/types.ts`.
- Confirmed with `grep` that `code` is no longer expected in the response type.

### T2: Update AuthManager Logic
- Refactored `src/lib/auth/auth-manager.ts`
- Removed `finalizeAuth` and `challengeCode`.
- Implemented `submitCode(code)` to handle manual code entry.

### T5: Verification
- `npm run build` completed successfully (Exit Code 0).
- Validated Typescript compilation for modified `types.ts`, `auth-manager.ts`, and `popup.ts`.

### T6: Refinement (New Tab & Persistence)
- **Persistence:** Updated `AuthManager` to persist `challengeId` to storage. Updated `schema.ts`.
- **New Tab Flow:** Updated `popup.ts`:
  - "Connect" now opens `popup.html?tab=true&autoConnect=true`.
  - Init logic detects `autoConnect` and triggers `startAuth`.
  - Init logic restores `WaitingForUser` from storage if `challengeId` exists.
  - Success in Tab Mode closes the tab (`window.close()`).
- **Bug Fix:** Restored missing event listener for `btnSave`.

### T6: Final Bug Fixes (Casing & API Key Injection)
- **Snake_case Support:**
  - Client normalize response: `challengeId` vs `challenge_id`.
  - Client request body: mapped `challengeId` -> `challenge_id`.
  - Client response normalization: `apiKey` vs `api_key`.
- **API Key Injection:**
  - `AnytypeApiClient`: Added `setApiKey` and `X-Anytype-Api-Key` header injection.
  - `AuthManager`: Sets API key on client immediately after login and on restore.
  - `service-worker.ts`: Syncs API Key from storage to Background Client instance on init and change.
- **Verification:** User confirmed successful login loop resolution.

## Current Status
**Complete.** Feature is fully implemented and verified.
