# Implementation Plan: Storage Manager

## Architecture Overview

The `StorageManager` will be a singleton class located in `src/lib/storage/storage-manager.ts`. It will wrap `chrome.storage.local` and use Zod schemas (or just TS interfaces since we just added Zod in 1.1) to define the data structure.

Since we added Zod in Epic 1.1, we can use it for optional runtime validation of stored data, ensuring integrity.

### Components

1.  **`src/lib/storage/schema.ts`**: Defines the shapes of all storable data.
    - `StorageSchema`: Root interface map.
    - `AppSettings`: Interface for user settings.
    - `AuthData`: Interface for API keys/tokens.
    - `QueueData`: Interface for offline queue (placeholder for now).

2.  **`src/lib/storage/storage-manager.ts`**: The main class.
    - `get<K>(key: K): Promise<StorageSchema[K]>`
    - `set<K>(key: K, value: StorageSchema[K]): Promise<void>`
    - `clear(): Promise<void>`
    - `checkQuota(): Promise<QuotaStatus>`

3.  **`src/lib/storage/defaults.ts`**: Default values for settings.

## Data Contracts

### Storage Schema

```typescript
interface StorageSchema {
  settings: AppSettings;
  auth: AuthData;
  // Future: queue, cache, etc.
}

interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  apiPort: number;
  defaultSpaceId?: string;
}

interface AuthData {
  apiKey?: string;
  isAuthenticated: boolean;
}
```

## Storage and Persistence

- **Backend:** `chrome.storage.local`
- **Serialization:** JSON (handled natively by chrome.storage)

## Testing Plan

Since Jest is not set up, we will use a manual verification script `verify-storage.ts` that can be imported/run or check via the extension console.
We previously used manual verification instructions. We will continue this.

### Manual Verification Steps
1.  Instantiate `StorageManager`.
2.  Save some data.
3.  Read it back.
4.  Check browser DevTools > Application > Storage > Local Storage (extension).

## AC Verification Mapping

| AC | Implementation | Verification |
| -- | -- | -- |
| AC-STORE-1 | `StorageManager.ts` generics | `npm run type-check` |
| AC-STORE-2 | `checkQuota()` method | Call and observe log |
| AC-STORE-3 | `chrome.storage.local` import | Code review |
| AC-STORE-4 | `clear()` method | Execute and check DevTools |

## Risks and Mitigations

- **Concurrency:** `chrome.storage` is async. We rely on Promise chain. Atomic updates (read-modify-write) might need a mutex if we write heavily, but for MVP settings/auth, simple async set is fine. Queue will need careful handling in its own epic.

## Rollout and Migration Notes

- Initial schema version is v1.
- Future schemas might need a `_version` field for migration. We will add `_version` to the root schema now to be safe.
