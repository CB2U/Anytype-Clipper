# Tasks: Storage Manager

## Setup

### T1: Define Storage Schemas
**Goal:** Create TypeScript interfaces for all storable data.
**Steps:**
1. Create `src/lib/storage/schema.ts`.
2. Define `AppSettings`, `AuthData` interfaces.
3. Define `StorageSchema` mapping interface.
4. Add `_version` field for future migrations.
**Verify:** `npm run type-check` works.

### T2: Define Default Values
**Goal:** Create default values for settings to ensure fallback.
**Steps:**
1. Create `src/lib/storage/defaults.ts`.
2. Export default objects matching schema.

## Core Implementation

### T3: Implement Storage Manager Class
**Goal:** Create the `StorageManager` class wrapper.
**Steps:**
1. Create `src/lib/storage/storage-manager.ts`.
2. Implement `get`, `set`, `remove`, `clear`.
3. Ensure types match `StorageSchema`.
4. Use `chrome.storage.local`.
**Verify:** Code compiles.

### T4: Implement Quota Monitoring
**Goal:** specific method to check usage.
**Steps:**
1. Add `getUsageBytes()` to `StorageManager`.
2. Add `checkQuota()` that logs warning if >80%.
3. Use `chrome.storage.local.getBytesInUse`.
**Verify:** Call method (will be 0 initially) and verify no errors.

### T5: Create Library Exports
**Goal:** Export symbols from `src/lib/storage/index.ts`.
**Steps:**
1. Re-export `StorageManager` (singleton instance?), `StorageSchema`, etc.
**Verify:** Imports work cleanly.

## Verification

### T6: Manual Verification Script
**Goal:** Create a temporary script to run in background/console to verify behavior.
**Steps:**
1. Create `src/lib/storage/verify_manual.ts` (or similar).
2. Write functions to test save/load/clear.
3. Instructions on how to run (e.g., import in background.ts temporarily or just code review).
**Note:** Since we don't have a reliable runner yet, we might just rely on code review + type check + simple integration in background for a test run.
**Revised Step:** Create a verified evidence block by temporarily modifying `background.ts` to run a smoke test on reload.

## Tracking

### T7: Update Tracking
**Goal:** Update `SPECS.md` and `SPEC.md`.
**Steps:**
1. Update `SPECS.md` with "In Progress" -> "Done".
2. Update `SPEC.md` current focus.
3. Add evidence to `spec.md`.

### T8: Final Evidence Consolidation
**Goal:** Populate `spec.md` EVIDENCE section.
