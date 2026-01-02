# Implementation Plan: Health Check & Recovery

## Goal

Implement health check integration and service worker recovery mechanisms to improve reliability of the offline queue system. This includes proactive health checking before capture requests, service worker startup recovery to reset stuck items, API response validation, and consistent network error handling.

---

## User Review Required

> [!IMPORTANT]
> **Service Worker Startup Behavior**
> The implementation will add a recovery step to the service worker initialization that resets all "sending" items to "queued" status. This ensures that items stuck in "sending" state due to service worker termination are automatically recovered. This recovery runs before the retry scheduler resumes, ensuring clean state.

> [!IMPORTANT]
> **Health Check Integration**
> Health checks will be integrated into the capture flow in `BookmarkCaptureService`. Before attempting an API call, the service will check Anytype availability. If unavailable, the capture will be immediately queued without attempting the API call. This improves user experience by providing faster feedback and avoiding unnecessary API failures.

---

## Proposed Changes

### Core Implementation

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

**Changes:**
- Add `recoverStuckItems()` function to reset "sending" items to "queued" on startup
- Call `recoverStuckItems()` in `initialize()` function before `retryScheduler.resumeRetries()`
- Add logging for recovery operations at info level

**Rationale:** Service worker termination (common in Manifest V3) can leave items in "sending" status. Recovery on startup ensures these items are retried.

---

#### [MODIFY] [bookmark-capture-service.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/capture/bookmark-capture-service.ts)

**Changes:**
- Import `checkHealth` from `../api/health`
- Add health check before API call in `captureBookmark()` method
- If health check fails, immediately queue the capture without attempting API call
- Add logging for health check results at debug level
- Support custom port from settings (if available)

**Rationale:** Proactive health checking prevents unnecessary API failures and provides immediate queue feedback to users.

---

#### [MODIFY] [queue-manager.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/queue-manager.ts)

**Changes:**
- Add `resetSendingToQueued()` method to reset all "sending" items to "queued"
- Add logging for reset operations

**Rationale:** Provides clean API for service worker recovery logic.

---

### Testing

#### [NEW] [health-check-integration.test.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/tests/unit/health-check-integration.test.ts)

**Purpose:** Unit tests for health check integration in capture flow

**Test Cases:**
- Health check returns true → capture proceeds with API call
- Health check returns false → capture is immediately queued
- Health check uses configured port
- Health check timeout is 2 seconds
- Health check never throws (always returns boolean)

---

#### [NEW] [service-worker-recovery.test.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/tests/integration/service-worker-recovery.test.ts)

**Purpose:** Integration tests for service worker recovery

**Test Cases:**
- "Sending" items are reset to "queued" on startup
- Recovery runs before retry scheduler
- No data loss during recovery
- Multiple "sending" items are all recovered

---

### Documentation

#### [MODIFY] [README.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/README.md)

**Changes:**
- Add section on health check and recovery mechanisms
- Document service worker recovery behavior
- Explain health check integration

---

## Verification Plan

### Automated Tests

#### Unit Tests

**Command to run:**
```bash
npm test -- tests/unit/health-check-integration.test.ts
```

**Expected outcome:**
- All health check integration tests pass
- Health check decision logic verified
- Port configuration validated

---

#### Integration Tests

**Command to run:**
```bash
npm test -- tests/integration/service-worker-recovery.test.ts
```

**Expected outcome:**
- Service worker recovery tests pass
- "Sending" items reset to "queued"
- No data loss during recovery

---

### Manual Verification

#### MV-1: Health Check Integration

**Steps:**
1. Close Anytype Desktop completely
2. Open extension popup
3. Try to save a bookmark
4. Observe immediate "Saved offline!" message without delay
5. Check queue status shows 1 pending item
6. Open Anytype Desktop
7. Wait for automatic retry
8. Verify bookmark created successfully

**Expected outcome:**
- Immediate queue feedback when Anytype is closed
- No 2-second delay from failed API attempt
- Automatic retry succeeds when Anytype opens

---

#### MV-2: Service Worker Recovery

**Steps:**
1. Queue a bookmark (close Anytype first)
2. Open browser DevTools → Application → Service Workers
3. Find "Anytype Clipper" service worker
4. Click "Stop" to terminate the service worker
5. Wait a few seconds
6. Open extension popup (this will restart the service worker)
7. Check browser console for recovery logs
8. Verify queued item is still present and in "queued" status

**Expected outcome:**
- Service worker recovery logs appear in console
- Queued item remains intact
- No items stuck in "sending" status

---

#### MV-3: Custom Port Support

**Steps:**
1. Configure custom Anytype port in settings (if settings page exists)
2. Verify health check uses custom port
3. Test with invalid port (e.g., 999) → should default to 31009
4. Test with valid custom port → should use configured port

**Expected outcome:**
- Health check respects port configuration
- Invalid ports default to 31009
- Custom ports work correctly

---

## Rollout and Migration Notes

- No data migration required
- No breaking changes to existing queue items
- Service worker recovery is backward compatible
- Health check integration is opt-in (existing code paths still work)

---

## Observability and Debugging

### Logging

**Health Check:**
- Debug level: Health check results (true/false)
- Debug level: Port configuration
- Error level: Health check errors (should never happen)

**Service Worker Recovery:**
- Info level: Recovery start and completion
- Info level: Number of items recovered
- Debug level: Individual item recovery

**API Response Validation:**
- Error level: Validation failures
- Debug level: Validation success

### Debugging

**Health Check Issues:**
- Check browser console for health check logs
- Verify Anytype Desktop is running
- Check port configuration in settings
- Test health check manually: `await checkHealth(31009, 2000)`

**Service Worker Recovery Issues:**
- Check browser console for recovery logs
- Verify service worker startup sequence
- Check queue status before and after recovery
- Test recovery manually by stopping service worker

---

**End of Implementation Plan**
