# Implementation Plan: Epic 8.1 Integration Tests

## Stabilization Phase (T17-T20)

### 1. Fix Storage Quota TypeError (T17)
- **Problem:** `StorageManager.checkQuota()` returns `void`, but tests expect an object.
- **Solution:** Update `StorageManager.checkQuota()` to return `Promise<{ bytesInUse: number; limit: number; percentUsed: number; }>`.
- **Verification:** `tests/integration/storage/quota-management.test.ts` should pass.

### 2. Address Integration Test Timeouts (T18-T20)
- **Problem:** 13/17 suites failing with 5000ms timeouts.
- **Solution:**
    - Increase `testTimeout` to 10000ms in `jest.integration.config.js`.
    - Investigate specific long-running tests (e.g., `challenge-flow.test.ts`) for potential infinite loops or unresolved promises.
- **Verification:** Run `npm run test:integration` and verify timeouts are resolved.

## Testing Plan
...

### 1. Auth Flow Integration
- **File:** `tests/integration/auth/`
- **Focus:** Fixing timeouts in `challenge-flow.test.ts`.
- **Verification:** API key present in `chrome.storage.local`.

### 2. Capture Flow Integration
- **File:** `tests/integration/capture/`
- **Focus:** Fixing timeouts in `bookmark-flow.test.ts` and `article-flow.test.ts`.
- **Verification:** Mock API `POST` bodies contain expected metadata and markdown.

### 3. Queue + Retry Integration
- **File:** `tests/integration/queue/`
- **Focus:** Verifying that `offline-queue.test.ts` correctly handles store/load.

### 4. Deduplication Integration
- **File:** `tests/integration/deduplication/`
- **Focus:** URL normalization edge cases.

### 5. Storage Integration
- **File:** `tests/integration/storage/`
- **Focus:** Resolving the `bytesInUse` TypeError.

---

## AC Verification Mapping

| AC | Test File | Verification Method |
|----|-----------|---------------------|
| AC-INT-1 | `auth/challenge-flow.test.ts` | Assert API key in storage after flow |
| AC-INT-2 | `capture/*.test.ts` | Assert objects created for each type |
| AC-INT-3 | `queue/service-worker-recovery.test.ts` | Assert queue persists after restart |
| AC-INT-4 | `deduplication/*.test.ts` | Assert duplicate detection and append |
| AC-INT-5 | All integration tests | Measure total execution time (<10s) |

---

## Risks and Mitigations

### Risk: Flaky Tests Due to Async Timing
**Mitigation:**
- Explicitly await all `storage.set` and `apiClient` calls.
- Use `jest.runAllTimers()` for backoff verification.

### Risk: Quota Math Complexity
**Mitigation:**
- Use fixed, large constants for `QUOTA_BYTES` in tests to ensure consistent percentages.

---

## Rollout and Migration Notes
- No code migration required.
- Stabilization will be reflected in `SPECS.md` status updates.

---

## Observability and Debugging

### Debugging Tools
- `DEBUG=true npm run test:integration`
- The `StorageManager` already logs validation failures; these will be key to fixing data contract mismatches.
