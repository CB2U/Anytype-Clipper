# Specification: Challenge Code Authentication

## Header

- **Title:** Challenge Code Authentication
- **Roadmap anchor reference:** 2.0
- **Priority:** P0
- **Type:** Feature
- **Target area:** Authentication / Onboarding
- **Target Acceptance Criteria:** AC1, FR1.1, FR1.2, FR1.3, FR1.4, AUTH-1, AUTH-2

## Problem Statement

Users need a secure way to connect the extension to their local Anytype Desktop application. Anytype uses a "Challenge Code" flow where the client (extension) requests a code, displays it to the user, and the user matches it in the Desktop app to approve the connection. The extension then receives an API key.

## Goals and Non-Goals

### Goals

- Implement the Challenge Code flow:
    1. Extension requests challenge.
    2. Extension receives 4-digit code.
    3. Extension polls for API key (or waits for user confirmation in desktop).
    4. Extension receives and stores API key.
- Store API key securely in `chrome.storage.local` (via Storage Manager).
- Manage authentication state (Authenticated vs Unauthenticated).
- Provide minimal UI for this flow in the popup.

### Non-Goals

- Re-authentication (handling 401s automatically) - Deferred to Epic 2.2.
- Token refresh (if applicable) - Deferred to Epic 2.1.
- "Disconnect" button UI - Deferred to Epic 2.1.
- Advanced Popup UI styling - Basic functional UI is sufficient; full polish is Epic 7.0.

## User Stories

### US1: First Run Connection
**As a** new user,
**I want** to see a 4-digit code when I open the extension,
**So that** I can enter/confirm it in Anytype and authorize the extension.

## Scope

### In-Scope

- **AuthManager Class:** Logic for challenge request and key exchange.
- **Api Client Updates:** Ensure endpoints for challenge/key are ready.
- **Storage:** Persist keys using `StorageManager`.
- **UI:** "Connect to Anytype" screen displaying the code and status.

### Out-of-Scope

- Sync storage.
- Settings page.
- Disconnect logic.

## Requirements

### Functional Requirements

- **FR1.1:** Initiate auth flow on first run (or when no key exists).
- **FR1.2:** Call `POST /v1/auth/challenges` to get code.
- **FR1.3:** Call `POST /v1/auth/api_keys` to exchange challenge for key.
- **FR1.4:** Store key in `StorageManager` (`auth.apiKey`).
- **FR-AUTH-1:** If auth fails or times out, allow retry.

### Non-Functional Requirements

- **NFR3.1:** Keys stored in local storage only.
- **NFR-UI-1:** Code must be clearly visible.

### Constraints Checklist

- ✅ **Privacy:** Local storage only.
- ✅ **Security:** Host permissions only for localhost.

## Acceptance Criteria

### AC1: Successful Auth Flow
**Verification approach:** Manual Test
1. Start Anytype Desktop.
2. Open Extension Popup.
3. Click "Connect".
4. Verify 4-digit code appears.
5. Confirm in Anytype Desktop.
6. Verify Extension updates to "Connected" state.
7. Verify functionality (e.g. check `StorageManager` has key).

### AC-AUTH-STORAGE
**Verification approach:** Code/Console Check
1. Complete Auth.
2. Check `StorageManager.get('auth')`.
3. Verify `isAuthenticated: true` and `apiKey` is present.

## Dependencies

- **Epic 1.1:** API Client (Done).
- **Epic 1.2:** Storage Manager (Done).
- **External:** Anytype Desktop running on localhost.

## Risks and Mitigations

- **Risk:** User doesn't have Anytype running.
- **Mitigation:** Show error/help message if connection fails (NetworkError handled by API Client).

## Open Questions

- Does `POST /v1/auth/api_keys` block until approved, or do we poll?
    - *Assumption:* Based on typical flows, we might request specific endpoint or just try to create key.
    - *Clarification from PRD:* "POST /v1/auth/api_keys to exchange code for key".
    - *Strategy:* We will attempt to create the key. If it waits for the desktop approval, the request might hang or need polling. We'll start with a direct request logic as per typical Anytype API docs (based on general knowledge of such flows). Usually: Request Challenge -> Get Code -> Request Key (with challenge ID) -> Wait for response.

## EVIDENCE

### Task Completion Summary

**Implementation (T1-T4): ✅ Complete**
- T1: Updated `AnytypeApiClient` with `createChallenge` and `createApiKey` methods.
- T2: Implemented `AuthManager` singleton state machine.
- T3: Created authentication view in `popup.html` and `.css` with modern styling.
- T4: Implemented `popup.ts` logic to drive the auth flow.

**Verification (T5): ✅ Verified Logic**
- Created `src/lib/auth/verify_auth.ts`.
- `AuthManager` correctly initializes and attempts connection.
- Type checks passed.

**Tracking (T6-T7): ✅ Complete**
- SPECS.md updated to Done.
- Evidence consolidated here.

---

### AC1: Successful Auth Flow ✅

**Verification Approach:** Manual Verification (User Verified)

**Result:** PASS
- User confirmed "Connect" button works.
- Code was displayed.
- Connection established.

**API Adjustments Required:**
During verification, two issues were fixed:
1. `POST /v1/auth/challenges` requires an empty JSON object `{}` body, not empty body.
2. The payload must include `app_name: "Anytype Clipper"` (snake_case), not `appName`.

**Evidence:**
- `src/lib/auth/auth-manager.ts`:
  ```typescript
  // Polls for key exchange
  for (let i = 0; i < maxAttempts; i++) { ... }
  ```
- `src/popup/popup.ts`:
  ```typescript
  if (state.status === AuthStatus.WaitingForUser) {
      // Show Code logic
  }
  ```

### AC-AUTH-STORAGE ✅

**Verification Approach:** Code Review

**Result:** PASS
- Key is stored in `chrome.storage.local` under 'auth' key.

**Evidence:**
- `src/lib/auth/auth-manager.ts`:
  ```typescript
  await this.storage.set('auth', {
      apiKey: response.apiKey,
      isAuthenticated: true
  });
  ```
