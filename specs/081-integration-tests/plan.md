# Implementation Plan: Epic 8.1 Integration Tests

## Architecture Overview

### Test Organization

Integration tests will be organized in `tests/integration/` directory with the following structure:

```
tests/integration/
├── auth/
│   ├── challenge-flow.test.ts
│   └── reauth-flow.test.ts
├── capture/
│   ├── bookmark-flow.test.ts
│   ├── highlight-flow.test.ts
│   └── article-flow.test.ts
├── queue/
│   ├── offline-queue.test.ts
│   ├── retry-logic.test.ts
│   └── service-worker-recovery.test.ts
├── deduplication/
│   ├── url-deduplication.test.ts
│   └── append-mode.test.ts
└── storage/
    ├── api-storage-integration.test.ts
    └── quota-management.test.ts
```

### Key Testing Principles

1. **Real Chrome Storage:** Use `jest-chrome` to provide real `chrome.storage.local` behavior
2. **Mock API Calls:** Use `tests/fixtures/mock-api.ts` for predictable API responses
3. **Module Integration:** Load actual production modules, not mocks (except for network calls)
4. **Async Handling:** Explicitly await all promises and use `jest.useFakeTimers` where needed
5. **Isolation:** Reset modules and storage between tests for deterministic results

### Test Execution Flow

Each integration test follows this pattern:

1. **Setup:** Initialize required modules with real dependencies
2. **Mock External:** Mock only network calls (fetch) and Chrome APIs
3. **Execute:** Run the full flow through multiple modules
4. **Verify:** Assert on final state in storage, API calls made, and side effects
5. **Teardown:** Clear storage and reset modules

---

## Data Contracts

### Mock API Responses

Reuse `tests/fixtures/mock-api.ts` from Epic 8.0:

- `mockAuthChallenge()` - Returns 4-digit challenge code
- `mockAuthApiKey()` - Returns API key response
- `mockSpaces()` - Returns list of spaces
- `mockObjectCreate()` - Returns created object response
- `mockObjectSearch()` - Returns search results for deduplication
- `mockObjectUpdate()` - Returns updated object response

### Storage Schema

Integration tests will verify these storage keys:

- `auth` - Authentication data (API key, expiration)
- `queue` - Queue items array
- `settings` - Extension settings
- `lastUsedSpace` - Last selected space ID
- `vault` - Large content offloaded from queue

---

## Testing Plan

### 1. Auth Flow Integration Tests

**File:** `tests/integration/auth/challenge-flow.test.ts`

**Test Cases:**
- Complete auth flow: challenge → code → API key → storage
- API key validation on module initialization
- Invalid API key handling

**Modules Integrated:**
- `AnytypeApiClient`
- `StorageManager`
- Auth state management

**Verification:**
- API key stored in `chrome.storage.local`
- Subsequent API calls include Authorization header
- Invalid keys trigger re-auth

---

**File:** `tests/integration/auth/reauth-flow.test.ts`

**Test Cases:**
- 401 response triggers re-auth
- Captures queued during re-auth
- Queue resumes after successful re-auth

**Modules Integrated:**
- `AnytypeApiClient`
- `QueueManager`
- `StorageManager`
- `BookmarkCaptureService`

**Verification:**
- 401 detected and re-auth triggered
- Captures added to queue during re-auth
- Queue processes after re-auth completes

---

### 2. Capture Flow Integration Tests

**File:** `tests/integration/capture/bookmark-flow.test.ts`

**Test Cases:**
- End-to-end bookmark capture with metadata
- Tag suggestions integration
- Success notification

**Modules Integrated:**
- `BookmarkCaptureService`
- `MetadataExtractor`
- `TagService`
- `AnytypeApiClient`
- `StorageManager`

**Verification:**
- Metadata extracted correctly
- Tags suggested and applied
- API call made with correct payload
- Success state returned

---

**File:** `tests/integration/capture/highlight-flow.test.ts`

**Test Cases:**
- Text selection → context extraction → API call
- Highlight with tags
- Append mode for multiple highlights

**Modules Integrated:**
- Content script utilities
- `extractContext`
- `AnytypeApiClient`
- `AppendService` (for multi-highlight)

**Verification:**
- Context extracted (before/after)
- Highlight object created
- Append mode works for subsequent highlights

---

**File:** `tests/integration/capture/article-flow.test.ts`

**Test Cases:**
- Article extraction → markdown conversion → image handling → API call
- Fallback chain execution
- Large content handling

**Modules Integrated:**
- `ArticleExtractor`
- `MarkdownConverter`
- `ImageHandler`
- `BookmarkCaptureService`
- `QueueManager` (for large content)

**Verification:**
- Article extracted and converted
- Images handled per settings
- Large content offloaded to vault
- API call made with processed content

---

### 3. Queue + Retry Integration Tests

**File:** `tests/integration/queue/offline-queue.test.ts`

**Test Cases:**
- Capture when offline → queue to storage
- Queue persists across module reload
- Sequential processing

**Modules Integrated:**
- `QueueManager`
- `StorageManager`
- `BookmarkCaptureService`
- Health check

**Verification:**
- Items added to queue when offline
- Queue survives `jest.resetModules()`
- Items processed sequentially

---

**File:** `tests/integration/queue/retry-logic.test.ts`

**Test Cases:**
- Failed capture → retry with backoff
- Max retries → mark as failed
- Manual retry

**Modules Integrated:**
- `QueueManager`
- `RetryScheduler`
- `chrome.alarms`

**Verification:**
- Retry intervals follow exponential backoff
- Max retries enforced
- Failed items marked correctly

---

**File:** `tests/integration/queue/service-worker-recovery.test.ts`

**Test Cases:**
- Service worker termination → recovery → queue resume
- Sending items recovered to queued state

**Modules Integrated:**
- `QueueManager`
- `StorageManager`
- Service worker initialization

**Verification:**
- Queue state recovered after restart
- Sending items reset to queued
- Processing resumes correctly

---

### 4. Deduplication Integration Tests

**File:** `tests/integration/deduplication/url-deduplication.test.ts`

**Test Cases:**
- URL normalization → search → duplicate found
- URL variations handled (http/https, www, trailing slash)
- No duplicate found

**Modules Integrated:**
- `DeduplicationService`
- `cleanUrlForDeduplication`
- `AnytypeApiClient`
- `StorageManager`

**Verification:**
- URL normalized correctly
- Search API called with normalized URL
- Duplicate detection accurate

---

**File:** `tests/integration/deduplication/append-mode.test.ts`

**Test Cases:**
- Duplicate detected → append mode → fetch existing → append → update
- Multiple appends to same object

**Modules Integrated:**
- `DeduplicationService`
- `AppendService`
- `AnytypeApiClient`

**Verification:**
- Existing object fetched
- New content appended with timestamp
- Update API called correctly

---

### 5. Storage Integration Tests

**File:** `tests/integration/storage/api-storage-integration.test.ts`

**Test Cases:**
- API call → response validation → storage update
- Sequential write locking
- Schema validation

**Modules Integrated:**
- `AnytypeApiClient`
- `StorageManager`

**Verification:**
- API responses validated before storage
- Sequential writes enforced
- Invalid data rejected

---

**File:** `tests/integration/storage/quota-management.test.ts`

**Test Cases:**
- Storage quota check → warning at 80%
- Quota exceeded handling

**Modules Integrated:**
- `StorageManager`
- `QueueManager`

**Verification:**
- Quota warnings triggered
- Quota exceeded errors handled

---

## AC Verification Mapping

| AC | Test File | Verification Method |
|----|-----------|---------------------|
| AC-INT-1 | `auth/challenge-flow.test.ts` | Assert API key in storage after flow |
| AC-INT-2 | `capture/*.test.ts` | Assert objects created for each type |
| AC-INT-3 | `queue/service-worker-recovery.test.ts` | Assert queue persists after restart |
| AC-INT-4 | `deduplication/*.test.ts` | Assert duplicate detection and append |
| AC-INT-5 | All integration tests | Measure total execution time |
| AC-INT-6 | CI workflow | Verify test step in GitHub Actions |

---

## Risks and Mitigations

### Risk: Flaky Tests Due to Async Timing

**Mitigation:**
- Use `await` for all promises
- Use `jest.useFakeTimers()` for time-dependent tests
- Add explicit `process.nextTick()` waits where needed

### Risk: Chrome API Mocking Gaps

**Mitigation:**
- Enhance `tests/setup.ts` with missing mocks
- Document any Chrome API limitations
- Use real `chrome.storage.local` behavior from jest-chrome

### Risk: Service Worker Restart Simulation Complex

**Mitigation:**
- Use `jest.resetModules()` to simulate restart
- Use `jest.doMock()` for fresh module instances
- Document restart simulation pattern for future tests

---

## Rollout and Migration Notes

- Integration tests will be added to existing `npm test` command
- Separate `npm run test:integration` script for running only integration tests
- CI pipeline will run both unit and integration tests
- No migration needed - this is net new functionality

---

## Observability and Debugging

### Test Output

Each integration test will include:
- Clear test names describing the flow
- Step-by-step console logs (optional, via DEBUG flag)
- Detailed failure messages with actual vs expected state

### Debugging Tools

- `DEBUG=true npm run test:integration` - Enable verbose logging
- `--testNamePattern` - Run specific integration test
- `--bail` - Stop on first failure for faster debugging

---

## Performance Targets

- **Total suite:** <10 seconds
- **Per test file:** <2 seconds
- **Setup/teardown:** <100ms per test

If targets not met, optimize by:
- Reducing test data size
- Parallelizing independent tests
- Caching module initialization
