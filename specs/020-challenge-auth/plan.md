# Implementation Plan: Challenge Code Authentication

## Architecture Overview

### Components

1.  **`src/background/auth-manager.ts`**:
    - Singleton class.
    - Manages Auth State (Init, Requesting, WaitingForUser, Authenticated, Error).
    - Interfaces with `AnytypeApiClient` (Epic 1.1) and `StorageManager` (Epic 1.2).
    - Exposes method `startAuth()` -> returns Challenge Code.
    - Exposes method `finalizeAuth(challengeId)` -> returns API Key.

2.  **`src/popup/popup.ts`** (and `.html`):
    - Needs a view switcher: `AuthView` vs `MainView`.
    - `AuthView` handles the "Connect" button and Code display.

3.  **`src/lib/api/client.ts` updates**:
    - Ensure methods for `createChallenge` and `createApiKey` are implemented.

### Data Flow

1.  **Popup** checks `StorageManager.get('auth')`.
2.  If `!isAuthenticated`, show `AuthView`.
3.  User clicks "Connect".
4.  **Popup** calls `AuthManager.startAuth()`.
5.  **AuthManager** calls `ApiClient.createChallenge()`.
6.  `ApiClient` returns `{ challengeId, code }`.
7.  **AuthManager** returns code to **Popup**.
8.  **Popup** displays code.
9.  **Popup** calls `AuthManager.finalizeAuth(challengeId)` (immediately or polling? Plan: immediate await, assuming server holds connection or we poll. Let's assume standard `await` for now, or short polling if Anytype requires it. Use a retry loop in `finalizeAuth`).
10. **AuthManager** calls `ApiClient.createApiKey(challengeId)`.
11. If success, save key to `StorageManager` and return success.
12. **Popup** shows "Success" and switches to `MainView`.

## Data Contracts

### Auth Storage
Defined in Epic 1.2:
```typescript
interface AuthData {
  apiKey?: string;
  isAuthenticated: boolean;
}
```

### API Types
Already defined in Epic 1.1 `src/lib/api/types.ts`:
```typescript
interface ChallengeResponse {
  id: string;
  code: string;
}
interface ApiKeyResponse {
  key: string;
}
```

## Testing Plan

### Manual Verification
Since we interact with a local desktop app, automated E2E is hard without a mock.
We will mock the `ApiClient` responses for unit-level verification of the UI flow if needed, but primarily we target manual verification with the actual app or a simple mock server if the app isn't available.

## AC Verification Mapping

| AC | Implementation | Verification |
| -- | -- | -- |
| AC1 | `AuthManager.ts`, `popup.ts` | Manual run through flow |
| AC-AUTH-STORAGE | `AuthManager.ts` stores key | Check storage in DevTools |

## Risks and Mitigations

- **Risk:** API implementation details (blocking vs polling).
- **Mitigation:** Implement `finalizeAuth` with a retry mechanism (e.g. try every 1s for 30s) if the API returns "pending" or 404 until approved.
