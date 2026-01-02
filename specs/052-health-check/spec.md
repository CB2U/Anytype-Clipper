# Specification: Health Check & Recovery

## Header

- **Title:** Health Check & Recovery
- **Roadmap Anchor:** [roadmap.md 5.2](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L589-L612)
- **Priority:** P0
- **Type:** Feature
- **Target Area:** Reliability and service worker recovery
- **Target Acceptance Criteria:** FR6.7, NFR2.2, NFR2.4, NFR2.5, REL-2, REL-3, REL-5

---

## Problem Statement

The offline queue system (Epic 5.0) and retry logic (Epic 5.1) successfully persist and retry captures, but currently lack proactive health checking and robust service worker recovery mechanisms. This creates several reliability issues:

1. **No Health Check Before Requests:** The system attempts API calls without first verifying Anytype is available, leading to unnecessary failures and queue additions.
2. **Service Worker Termination Handling:** When the service worker terminates (common in Manifest V3), items in "sending" status are left in limbo without automatic recovery.
3. **No API Response Validation:** Responses from the Anytype API are not systematically validated, potentially causing silent failures or data corruption.
4. **Network Error Handling:** Network errors are not consistently handled, leading to unclear error states.

Users need a reliable health check and recovery system that:
- Proactively checks Anytype availability before making requests
- Detects and recovers from service worker termination
- Validates all API responses before processing
- Handles network errors gracefully with clear fallback to queue

Without these mechanisms, the extension is less reliable and users may experience unexpected failures or data loss.

---

## Goals and Non-Goals

### Goals

- Implement health check ping to localhost:31009 before capture requests
- Integrate health check with queue decision logic (send now vs queue)
- Detect service worker termination and reset stuck "sending" items to "queued"
- Implement graceful recovery from service worker termination
- Validate API responses before processing (schema validation)
- Handle network errors consistently with queue fallback
- Provide foundation for health-aware retry scheduling
- Support custom port configuration for health checks

### Non-Goals

- Queue UI components (covered in Epic 5.3)
- Checkpoint-based recovery for large articles (post-MVP, Epic 10.2)
- Health check statistics and monitoring dashboard (post-MVP)
- Configurable health check timeout (post-MVP, Epic 7.2)
- Advanced API response caching (post-MVP)

---

## User Stories

### US3 (Partial): Build Offline Queue During Research Session

**As a** power user doing deep research,  
**I want to** have the extension intelligently detect when Anytype is unavailable before attempting captures,  
**So that** I get immediate feedback and don't experience unnecessary delays or failures.

**Acceptance:**
- Extension checks Anytype availability before capture attempts
- If unavailable, capture is immediately queued without API attempt
- If available, capture proceeds normally
- Service worker termination doesn't leave captures in broken states
- Network errors are handled gracefully with clear user feedback

**Note:** This epic (5.2) implements the health check and recovery mechanisms that enable intelligent queue decisions and robust error handling.

---

## Scope

### In-Scope

- Health check function integration with capture flows
- Pre-request health check in BookmarkCaptureService
- Service worker startup recovery logic
- Reset "sending" items to "queued" on startup
- API response validation using TypeScript types
- Network error handling and categorization
- Integration with existing health.ts implementation
- Custom port support for health checks
- Unit tests for health check integration
- Integration tests for service worker recovery
- Manual verification of recovery scenarios

### Out-of-Scope

- Health check UI indicators (Epic 5.3)
- Health check statistics tracking (post-MVP)
- Configurable health check settings (Epic 7.2)
- Advanced retry strategies based on health (post-MVP)
- Health check caching or optimization (post-MVP)
- Debug log integration (Epic 10.6)

---

## Requirements

### Functional Requirements

#### FR-H1: Health Check Before Requests
- **Description:** Check Anytype availability using `checkHealth()` before attempting capture requests
- **Priority:** P0
- **Rationale:** Prevents unnecessary API failures and provides immediate queue feedback
- **Dependencies:** Existing `src/lib/api/health.ts`

#### FR-H2: Health-Aware Queue Decision
- **Description:** Integrate health check into capture flow to decide: send now vs queue immediately
- **Priority:** P0
- **Rationale:** Improves user experience with faster feedback
- **Dependencies:** FR-H1, Epic 5.0 (QueueManager)

#### FR-H3: Service Worker Startup Recovery
- **Description:** On service worker startup, detect and reset "sending" items to "queued" status
- **Priority:** P0
- **Rationale:** Prevents items from being stuck in "sending" state after termination
- **Dependencies:** Epic 5.0 (QueueManager)

#### FR-H4: Graceful Service Worker Termination
- **Description:** Ensure service worker termination doesn't corrupt queue state
- **Priority:** P0
- **Rationale:** Manifest V3 service workers terminate frequently
- **Dependencies:** FR-H3, Epic 5.0

#### FR-H5: API Response Validation
- **Description:** Validate API responses against expected TypeScript types before processing
- **Priority:** P1
- **Rationale:** Prevents silent failures from malformed responses
- **Dependencies:** Existing API client types

#### FR-H6: Network Error Handling
- **Description:** Categorize and handle network errors consistently:
  - Connection refused → Queue
  - Timeout → Queue
  - 401 Unauthorized → Trigger re-auth (Epic 2.2)
  - 4xx Client errors → Mark as failed with error message
  - 5xx Server errors → Queue for retry
- **Priority:** P0
- **Rationale:** Clear error handling improves reliability
- **Dependencies:** FR-H1, Epic 5.0

#### FR-H7: Custom Port Support
- **Description:** Support custom Anytype port configuration for health checks
- **Priority:** P1
- **Rationale:** Users may run Anytype on non-default ports
- **Dependencies:** FR-H1, Epic 1.2 (StorageManager)

#### FR-H8: Health Check Timeout
- **Description:** Use 2-second timeout for health check pings (configurable via function parameter)
- **Priority:** P1
- **Rationale:** Balances responsiveness with reliability
- **Dependencies:** FR-H1

### Non-Functional Requirements

#### NFR-H1: Performance
- **Description:** Health check must complete within performance budgets:
  - Health check ping: <2s (timeout)
  - Service worker startup recovery: <500ms
  - Response validation: <10ms
- **Priority:** P1
- **Rationale:** Health checks should not significantly delay captures
- **Measurement:** Unit test benchmarks
- **Dependencies:** None

#### NFR-H2: Reliability
- **Description:** Health check and recovery must be reliable:
  - Health check never throws (always returns boolean)
  - Service worker recovery always runs on startup
  - "Sending" items always reset to "queued"
  - No data loss during recovery
- **Priority:** P0
- **Rationale:** Critical for offline queue reliability
- **Measurement:** Integration tests
- **Dependencies:** FR-H3, FR-H4

#### NFR-H3: Observability
- **Description:** Health check and recovery operations must be observable:
  - Log health check results at debug level
  - Log service worker recovery at info level
  - Log validation errors at error level
  - Track health check failures
- **Priority:** P1
- **Rationale:** Enables debugging and monitoring
- **Measurement:** Debug logs
- **Dependencies:** None

#### NFR-H4: Testability
- **Description:** Health check and recovery must be testable:
  - Unit tests for health check integration
  - Integration tests for service worker recovery
  - Mock health check for testing
  - Test all error scenarios
- **Priority:** P1
- **Rationale:** High test coverage ensures reliability
- **Measurement:** Code coverage >80%
- **Dependencies:** None

### Constraints Checklist

- ✅ **Security:** No external API calls, all processing local
- ✅ **Privacy:** No sensitive data logged (sanitize error messages)
- ✅ **Offline Behavior:** Health check gracefully handles offline state
- ✅ **Performance:** Health check does not block UI (<2s timeout)
- ✅ **Observability:** Log health check and recovery operations at appropriate levels

---

## Acceptance Criteria

### AC-H1: Health Check Before Requests
**Criteria:**
- Health check is called before capture requests in BookmarkCaptureService
- If health check returns false, capture is immediately queued
- If health check returns true, capture proceeds with API call
- Health check uses configured port (default 31009)
- Health check timeout is 2 seconds

**Verification Approach:**
- Unit test: Mock health check, verify queue decision logic
- Integration test: Mock API unavailable, verify immediate queue
- Manual test: Close Anytype, capture bookmark, verify immediate queue without delay

---

### AC-H2: Service Worker Startup Recovery
**Criteria:**
- On service worker startup, all "sending" items are reset to "queued"
- Recovery runs before retry scheduler resumes
- Recovery is logged at info level
- No data loss during recovery

**Verification Approach:**
- Integration test: Set item to "sending", restart service worker, verify reset to "queued"
- Manual test: Queue item, force service worker termination, verify recovery on restart

---

### AC-H3: API Response Validation
**Criteria:**
- API responses are validated against TypeScript types
- Invalid responses are logged and handled gracefully
- Validation errors trigger queue fallback
- Validation completes within 10ms

**Verification Approach:**
- Unit test: Mock invalid API response, verify validation catches error
- Integration test: Verify validation with real API responses

---

### AC-H4: Network Error Handling
**Criteria:**
- Connection refused errors → Queue
- Timeout errors → Queue
- 401 errors → Trigger re-auth (Epic 2.2)
- 4xx errors → Mark as failed with error message
- 5xx errors → Queue for retry
- All errors are sanitized before logging

**Verification Approach:**
- Unit test: Mock each error type, verify correct handling
- Integration test: Trigger network errors, verify queue behavior

---

### AC-H5: Custom Port Support
**Criteria:**
- Health check uses port from settings (default 31009)
- Port configuration is validated (1024-65535)
- Invalid ports default to 31009
- Port changes are reflected in health checks

**Verification Approach:**
- Unit test: Verify port validation logic
- Integration test: Configure custom port, verify health check uses it
- Manual test: Change port in settings, verify health check works

---

### AC-H6: Graceful Service Worker Termination
**Criteria:**
- Service worker termination doesn't corrupt queue
- "Sending" items are recovered on restart
- Queue processing resumes after recovery
- No duplicate captures from recovery

**Verification Approach:**
- Integration test: Terminate service worker mid-capture, verify recovery
- Manual test: Queue multiple items, restart browser, verify all recovered

---

## Dependencies

### Epic Dependencies
- **1.1 API Client Foundation:** Provides API client and error types
- **1.2 Storage Manager:** Provides storage for port configuration
- **5.0 Offline Queue System:** Provides QueueManager for recovery
- **5.1 Retry Logic with Backoff:** Provides RetryScheduler for integration

### Technical Dependencies
- **src/lib/api/health.ts:** Existing health check implementation
- **chrome.alarms API:** For retry scheduling integration
- **QueueManager:** For queue operations and recovery
- **TypeScript:** Type definitions for response validation

### Data Dependencies
- Queue items from Epic 5.0 (QueueItem schema with status field)
- Port configuration from Epic 1.2 (settings schema)

---

## Risks and Mitigations

### Risk 1: Health Check False Negatives
**Description:** Health check may return false when Anytype is actually available (e.g., slow startup).  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Use 2-second timeout (balances speed and reliability)
- Health check considers any response as "available"
- Retry logic handles false negatives (item will retry)
- Test health check with slow Anytype startup

---

### Risk 2: Health Check False Positives
**Description:** Health check may return true when Anytype is not fully ready (e.g., during startup).  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Health check uses /v1/spaces endpoint (requires full API availability)
- API client handles 503 errors gracefully
- Retry logic handles false positives (item will retry)
- Test health check during Anytype startup

---

### Risk 3: Service Worker Recovery Race Condition
**Description:** Service worker may terminate during recovery, leaving items in inconsistent state.  
**Likelihood:** Very Low  
**Impact:** Medium  
**Mitigation:**
- Recovery is fast (<500ms)
- Recovery runs before retry scheduler
- QueueManager operations are atomic
- Test recovery with forced termination

---

### Risk 4: Performance Impact of Health Checks
**Description:** Health checks may slow down capture flow.  
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- 2-second timeout ensures fast failure
- Health check runs in parallel with metadata extraction (if possible)
- Health check result can be cached briefly (future optimization)
- Benchmark health check performance

---

### Risk 5: Port Configuration Errors
**Description:** Invalid port configuration may break health checks.  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Validate port range (1024-65535)
- Default to 31009 on invalid port
- Log port validation errors
- Test with invalid port configurations

---

## Open Questions

None. All requirements are clear and aligned with PRD FR6.7, NFR2.2, NFR2.4, NFR2.5, REL-2, REL-3, REL-5.

---

## EVIDENCE

### Automated Tests

- **Unit Tests**:
  - `QueueManager.resetSendingToQueued` verified in `tests/unit/queue-manager.test.ts`.
  - `BookmarkCaptureService` health check integration verified in `tests/unit/health-check-integration.test.ts`.
- **Integration Tests**:
  - Service Worker startup recovery verified in `tests/integration/service-worker-recovery.test.ts`.

```bash
# Unit Tests
npm test -- tests/unit/queue-manager.test.ts tests/unit/health-check-integration.test.ts
# Result: 17 passed

# Integration Tests
npm test -- tests/integration/service-worker-recovery.test.ts
# Result: 2 passed
```

### Manual Verification (Pending User Verification)

- [ ] AC-H1: Health Check Proactivity
- [ ] AC-H2: Service Worker Startup Recovery

**End of Specification**
