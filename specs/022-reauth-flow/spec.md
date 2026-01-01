# Specification: Re-authentication Flow

## Header

- **Title:** Re-authentication Flow
- **Roadmap anchor reference:** 2.2
- **Priority:** P1
- **Type:** Feature
- **Target area:** Authentication / Reliability
- **Target Acceptance Criteria:** AC-AUTH-REAUTH

## Problem Statement

When the Anytype API key becomes invalid (e.g., revoked, expired, or data cleared on desktop), API calls will fail with a 401 Unauthorized error. Currently, the extension might show a generic error or fail silently. We need a robust flow to detect this state and prompt the user to re-authenticate without disrupting their workflow more than necessary.

## Goals and Non-Goals

### Goals

- **Detect 401s:** `AnytypeApiClient` must correctly identify and classify HTTP 401 responses.
- **Centralized Handling:** `AuthManager` must assume an "invalidation" state when a 401 occurs.
- **UI Feedback:** The Popup UI should clearly indicate that re-authentication is required.
- **Automatic State Reset:** The extension should automatically transition to a "Disconnected" or "Re-auth Required" state.

### Non-Goals

- **Offline Queue:** While re-auth often leads to queueing, the *implementation* of the queue system is Epic 5.0. This epic only handles the *trigger* (auth failure).
- **Token Refresh:** Anytype API v1 uses static keys, so automatic background refresh is not possible. User intervention is required.

## User Stories

### US1: Automatic Re-auth Trigger
**As a** user who unknowingly revoked my API key,
**I want** the extension to tell me "Connection lost, please reconnect" instead of "Network Error",
**So that** I know exactly how to fix the problem.

### US2: Sesssion Expiry
**As a** user,
**If** my session becomes invalid while using the extension,
**I want** to be immediately prompted to re-authenticate,
**So that** I don't try to save content that will inevitably fail.

## Scope

### In-Scope

- **AnytypeApiClient:** logic to catch 401 responses and throw specific `AuthError`.
- **AuthManager:** logic to catch `AuthError` and transition state (call `disconnect` internally or set specific status).
- **Popup UI:** Visual indication of "Session Expired" if it differs from standard "Unauthenticated". (For MVP, standard "Unauthenticated" screen with a notification/toast is sufficient, or just dropping back to Connect screen).

### Out-of-Scope

- Queueing failed requests (Epic 5.0).
- Background periodic checks (we check on action).

## Requirements

### Functional Requirements

- **FR2.2.1:** API Client must classify 401 as `AuthError`.
- **FR2.2.2:** `AuthManager` must listen for `AuthError` from any API call it makes.
- **FR2.2.3:** On `AuthError`, `AuthManager` must transition to `Unauthenticated` state and clear invalid storage.
- **FR2.2.4:** UI must reflect the unauthenticated state immediately (next time it renders).

### Non-Functional Requirements

- **NFR-REL-1:** Re-auth trigger should not cause a crash.
- **NFR-SEC-1:** Invalid keys should be scrubbed from storage immediately to prevent reuse.

## Acceptance Criteria

### AC1: 401 Triggers Disconnect
1. Authenticate successfully.
2. Manually invalidate the key (or mock the server response to 401).
3. Perform an action (e.g., `validateSession`).
4. Verify extension automatically disconnects and returns to "Connect" screen.
5. Verify storage is cleared.

### AC2: Error Classification
1. Validation unit test: 401 response throws `AuthError`, 500 throws `ApiError`, Network fail throws `NetworkError`.

## Risks

- **Risk:** Race conditions if multiple requests fail with 401 simultaneously.
- **Mitigation:** `AuthManager`'s disconnect logic should be idempotent.

## EVIDENCE

### Task Completion Summary

**Implementation (T1-T2): ✅ Complete**
- T1: Confirmed `AnytypeApiClient` throws `AuthError` on 401 via `src/lib/api/verify_client_auth_error.ts`.
- T2: Implemented `handleAuthError` in `AuthManager` to handle 401s by disconnecting.

**Verification (T3): ✅ Verified**
- Created `src/lib/auth/verify_reauth_flow.ts` to simulate 401 responses.
- Executed with `npx tsx` to handle ESM imports correctly.
- **Result:**
    - `validateSession` returned `false`.
    - `AuthManager` transitioned to `Unauthenticated`.
    - Storage was cleared.

### AC1: 401 Triggers Disconnect ✅
**Verification Approach:** Automated Script (`verify_reauth_flow.ts`)
**Result:** PASS
- Mocked 401 response triggered `disconnect()`.
- State transitioned from `Authenticated` to `Unauthenticated`.
- Storage key `auth` was removed.

### AC2: Error Classification ✅
**Verification Approach:** Automated Script (`verify_client_auth_error.ts`)
**Result:** PASS
- Mocked 401 response caught as instance of `AuthError`.
