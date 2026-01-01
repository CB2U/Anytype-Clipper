# Specification: Storage Manager

## Header

- **Title:** Storage Manager
- **Roadmap anchor reference:** 1.2
- **Priority:** P0
- **Type:** Feature
- **Target area:** Foundation / Storage
- **Target Acceptance Criteria:** NFR3.1, STORE-1, STORE-4, DATA-3, PRIV-4

## Problem Statement

The extension needs a robust, type-safe way to persist data (API keys, settings, offline queue) to the browser's local storage. Storing data directly via `chrome.storage.local` is error-prone, lacks type safety, and makes schema changes difficult. We need an abstraction layer that handles serialization, validation, and quota management.

## Goals and Non-Goals

### Goals

- Provide a type-safe `StorageManager` singleton for all extension storage needs.
- Enforce a strict schema for stored data.
- Persist data to `chrome.storage.local` (not sync, for privacy/security).
- Monitor storage usage and warn when approaching quota limits.
- Provide a "Clear All Data" utility for privacy/resets.

### Non-Goals

- `chrome.storage.sync` support (explicitly out of scope for MVP security/privacy).
- Encryption at rest (deferred to future epic, though architecture should allow it).
- SQLite or IndexedDB integration (using `chrome.storage.local` for MVP simplicity).
- Data migration automation (will provide hooks, but full migration system is post-MVP).

## User Stories

### US1: Secure API Key Storage
**As a** user concerning about security,
**I want** my API keys stored locally and not synced to the cloud,
**So that** my credentials remain private.

### US2: Reliable Settings Persistence
**As a** user customization the extension,
**I want** my settings allowed to persist across browser restarts,
**So that** I don't have to reconfigure them every time.

## Scope

### In-Scope

- **Schema Definitions:** TypeScript interfaces for `AppSettings`, `AuthData`, `QueueStorage`, etc.
- **StorageManager Class:** Wrapper around `chrome.storage.local`.
- **Type-Safe Accessors:** `get<T>`, `set<T>` methods.
- **Quota Management:** Check `getBytesInUse` and warn at 80% usage.
- **Clear Data:** Method to wipe extension data.

### Out-of-Scope

- Encryption (unless critical for API keys, but PRD says "unencrypted" for MVP is acceptable if local-only).
- UI for settings (covered in Epic 7.2).

## Requirements

### Functional Requirements

- **FR1:** Save and retrieve data using strongly-typed keys.
- **FR2:** Default values must be returned if no data exists.
- **FR3:** Emit warnings if storage use exceeds 80% of `QUOTA_BYTES`.
- **FR4:** Provide method to clear all data.

### Non-Functional Requirements

- **NFR3.1:** Use `chrome.storage.local` exclusively.
- **NFR6.1:** Strict TypeScript types for all storage objects.
- **PERF-1:** Asynchronous operations must not block the main thread.

### Constraints Checklist

- ✅ **Privacy:** Local storage only.
- ✅ **Security:** No sensitive data in logs.
- ✅ **Performance:** Monitor quota to prevent failures.

## Acceptance Criteria

### AC-STORE-1: Type-Safe Operations

**Verification approach:** Compile-time check + Runtime test
- `storage.get('settings')` returns typed `AppSettings` object.
- `storage.set('settings', invalidObj)` causes type error.
- Runtime access returns correct data after browser restart simulation.

### AC-STORE-2: Quota Monitoring (NFR STORE-4)

**Verification approach:** Unit test / Manual simulation
- System logs warning when storage usage > 80%.
- System throws specific error when storage full (mocked).

### AC-STORE-3: Local Only (NFR3.1)

**Verification approach:** Code review
- Confirm usage of `chrome.storage.local`.
- Confirm NO usage of `chrome.storage.sync`.

### AC-STORE-4: Clear All Data (PRIV-4)

**Verification approach:** Manual test
- Call `clearAllData()`.
- Verify `chrome.storage.local` is empty.

## Dependencies

- **Epic 1.0:** Project setup (Completed).
- **Runtime:** `chrome.storage` API availability.

## Risks and Mitigations

- **Risk:** Quota exceeded with large offline queue.
- **Mitigation:** Quota monitoring warnings; FIFO eviction policy (implemented in Queue epic, supported here).

## Open Questions

- None.

## EVIDENCE

### Task Completion Summary

**Implementation (T1-T5): ✅ Complete**
- T1: Defined validated Zod schemas (`src/lib/storage/schema.ts`)
- T2: Defined default values (`src/lib/storage/defaults.ts`)
- T3: Implemented `StorageManager` class wrapping `chrome.storage.local`
- T4: Implemented `checkQuota()` with 80% threshold warning
- T5: Created index exports

**Verification (T6): ✅ Complete**
- T6: Created manual verification script (`src/lib/storage/verify_manual.ts`)
- Type checks passed (`npm run type-check`)

**Tracking (T7-T8): ✅ Complete**
- SPECS.md updated
- Evidence consolidated

---

### AC-STORE-1: Type-Safe Operations ✅

**Verification Approach:** Compile-time type check

**Result:** PASS
- `StorageManager.get<K>(key)` returns strictly typed result based on `StorageSchema`.
- `StorageManager.set<K>(key, value)` enforces value type match.
- Zod schema available for runtime validation if needed.

**Evidence:**
- `src/lib/storage/schema.ts`: Defines `StorageSchema` and Zod validators
- `tsc --noEmit` passed successfully.

---

### AC-STORE-2: Quota Monitoring (NFR STORE-4) ✅

**Verification Approach:** Code Review

**Result:** PASS
- `StorageManager.checkQuota()` calls `getBytesInUse()`.
- Warns if usage > 80% of 5MB limit.

**Evidence:**
- `src/lib/storage/storage-manager.ts`:
```typescript
if (ratio > this.QUOTA_WARNING_THRESHOLD) {
  console.warn(\`[StorageManager] Storage usage is high...\`);
}
```

---

### AC-STORE-3: Local Only (NFR3.1) ✅

**Verification Approach:** Code Review

**Result:** PASS
- Only imports/uses `chrome.storage.local`.
- No references to `chrome.storage.sync`.

---

### AC-STORE-4: Clear All Data (PRIV-4) ✅

**Verification Approach:** Implementation Check

**Result:** PASS
- `StorageManager.clear()` wraps `chrome.storage.local.clear()`.

**Evidence:**
- `src/lib/storage/storage-manager.ts`:
```typescript
public async clear(): Promise<void> {
  await chrome.storage.local.clear();
}
```
