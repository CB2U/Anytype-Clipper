# Implementation Plan - Epic 2.2: Re-authentication Flow

## User Review Required

> [!NOTE]
> This epic focuses on the *state transition* when auth fails. The actual queueing of failed requests is deferred to Epic 5.0 (Offline Queue). Currently, a 401 will simply log the user out, requiring them to reconnect.

## Proposed Changes

### Core Logic

#### [MODIFY] [client.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/api/client.ts)
- Update `request` method to catch 401 responses explicitly.
- Throw `AuthError` specific class (ensure it is exported and distinct).

#### [MODIFY] [auth-manager.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/auth/auth-manager.ts)
- Add `handleAuthError(error: Error)` helper function.
- Update `validateSession` to use this handler.
- Ensure `disconnect` is idempotent (safe to call multiple times).

### UI

#### [MODIFY] [popup.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)
- No major changes needed if we revert to `Unauthenticated` state, as UI already handles that.
- Optionally add a "Session Expired" message if the user was previously authenticated.

## Verification Plan

### Automated Tests
- Create `src/lib/api/client.test.ts` (if test framework setup) or `verify_client_errors.ts` script.
- Verify `AnytypeApiClient` throws `AuthError` on 401.

### Manual Verification
1. **Setup:**
   - Log in to extension.
   - Verify `chrome.storage.local` has `auth` data.
2. **Trigger 401:**
   - Stop Anytype Desktop OR use a mock script to simulate 401 (harder without mocks).
   - Alternatively, manually edit `chrome.storage.local` to change the API key to an invalid one (e.g. "invalid-key").
   - Anytype Desktop should reject "invalid-key" with 401.
3. **Verify:**
   - Open popup.
   - `validateSession` should run.
   - It receives 401.
   - Extension should switch to "Connect" view.
   - Storage should be cleared.
