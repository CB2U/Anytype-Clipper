# Specification: API Key Management

## Header

- **Title:** API Key Management
- **Roadmap anchor reference:** 2.1
- **Priority:** P1
- **Type:** Feature
- **Target area:** Authentication / Security
- **Target Acceptance Criteria:** AC-AUTH-MGMT

## Problem Statement

While Epic 2.0 handled the initial acquisition of the API key, we need robust management of this credential. This includes validating the key on extension startup (to ensure it hasn't been revoked/expired), providing a way for the user to disconnect (logout/revoke), and ensuring the key is stored securely without unintended exposure.

## Goals and Non-Goals

### Goals

- **Validation on Startup:** The extension should verify the stored API key is still valid when it starts (e.g., by making a lightweight API call).
- **Disconnect Flow:** Users must be able to remove the stored API key, effectively "disconnecting" the extension.
- **Secure Persistence:** Reinforce that keys are stored only in `local` storage (not sync) and are never logged.
- **Status Visibility:** The popup should clearly indicate the connection status and allow disconnection.

### Non-Goals

- **Token Refresh:** Anytype API v1 currently uses long-lived API keys, so OAuth-style refresh is not applicable yet.
- **Complex Settings UI:** A simple "Disconnect" button in the popup is sufficient for now; a full Settings page is Epic 7.2.

## User Stories

### US1: Disconnect
**As a** user who wants to secure my machine or switch Anytype accounts,
**I want** to disconnect the extension from the local Anytype app,
**So that** it no longer has access to my data.

### US2: Auto-Validation
**As a** user,
**I want** the extension to detect if my connection is broken (e.g. key revoked) automatically,
**So that** I am prompted to reconnect instead of seeing silent failures.

## Scope

### In-Scope

- **AuthManager Updates:**
    - `disconnect()` method.
    - `validateSession()` method (ping API).
- **Popup UI Updates:**
    - "Disconnect" / "Logout" button when authenticated.
    - Handling invalid session state on startup.
- **Security Check:** ensure `console.log` does not leak keys.

### Out-of-Scope

- Full constraints on multi-user switching (scoped to single local user).
- Remote revocation (revoking from the Desktop app side is handled by Desktop, we just handle the local reaction).

## Requirements

### Functional Requirements

- **FR2.1.1:** Storage must support `cancel` or `clear` for auth data.
- **FR2.1.2:** `AuthManager` must expose `disconnect()` which clears storage and internal state.
- **FR2.1.3:** On extension load (or popup open), `AuthManager` should verify connection (e.g., `GET /v1/spaces` or dedicated `GET /v1/auth/status`).
- **FR2.1.4:** Popup must show "Disconnect" option when state is `Authenticated`.

### Non-Functional Requirements

- **NFR-SEC-1:** No API keys in logs.
- **NFR-SEC-2:** Keys in `chrome.storage.local` only.

## Acceptance Criteria

### AC1: Disconnect works
1. Authenticate extension.
2. Click "Disconnect".
3. Verify view returns to "Connect" state.
4. Verify key is removed from `chrome.storage.local`.

### AC2: Validation on Startup
1. Authenticate extension.
2. Manually corrupt the key in storage (or stop Anytype).
3. Re-open extension.
4. Verify it detects proper status (Error or explicit Disconnected state) and prompts for action.
   *(Note: network failure != invalid key, but 401 response == invalid key)*

## Risks

- **Risk:** "Ping" on startup might slow down popup.
- **Mitigation:** Do it asynchronously; show "Connected" (optimistic) or "Checking..." state. Optimistic is preferred for speed, falling back to error if request fails.

## EVIDENCE

### Task Completion Summary

**Implementation (T1-T2): ✅ Complete**
- T1: Implemented `disconnect` and `validateSession` in `AuthManager`. Added `getSpaces` to `AnytypeApiClient` for session validation.
- T2: Added "Disconnect" button to Popup UI. Fixed initial defects in UI code.

**Verification (T3): ✅ Verified**
- Verified secure storage (cleared on disconnect).
- Created `src/lib/auth/verify_auth_management.ts` for logic verification.
- Verified no sensitive logs are output.

### AC1: Disconnect works ✅
**Verification Approach:** Code Review & Logic Test
**Result:** PASS
- `disconnect()` successfully clears `chrome.storage.local`.
- In-memory state is reset to `Unauthenticated`.
- UI updates to show "Connect" screen (via `handleDisconnect`).

### AC2: Validation on Startup ✅
**Verification Approach:** Code Review
**Result:** PASS
- `AuthManager.init()` calls `validateSession()` asynchronously.
- `validateSession()` calls `getSpaces()`.
- If 401 is returned (simulated), `disconnect()` is triggered automatically.
