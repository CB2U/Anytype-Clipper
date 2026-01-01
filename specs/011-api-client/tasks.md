# Tasks: API Client Foundation

## Overview

This document contains the ordered task breakdown for implementing Epic 1.1: API Client Foundation. Each task includes a goal, steps, done-when criteria, verification steps, and evidence to record.

---

## Setup

### T1: Install Zod Dependency ✅

**Goal:** Add Zod runtime validation library to project dependencies

**Steps:**
1. Run `npm install zod`
2. Verify installation in package.json
3. Run `npm run type-check` to ensure no conflicts

**Done When:**
- Zod added to package.json dependencies
- TypeScript compilation succeeds
- No dependency conflicts

**Verify:**
- Run `npm list zod` - should show installed version
- Run `npm run type-check` - should pass

**Evidence to Record:**
- Zod version installed
- Screenshot of successful type-check

**Files Touched:**
- package.json
- package-lock.json

---

## Core Implementation

### T2: Create Error Class Hierarchy ✅

**Goal:** Implement error types (ApiError, AuthError, NetworkError, ValidationError)

**Steps:**
1. Create `src/lib/api/errors.ts`
2. Implement `ApiError` base class with status, message, originalError
3. Implement `AuthError` extending ApiError
4. Implement `NetworkError` extending ApiError
5. Implement `ValidationError` extending ApiError
6. Add helper function `classifyHttpError(status: number)` to determine error type
7. Export all error classes

**Done When:**
- All error classes implemented with proper inheritance
- Error classes include status code, message, originalError properties
- Helper function classifies HTTP status codes correctly
- TypeScript strict mode passes
- No `any` types used

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Manually verify error classes are instanceof-checkable

**Evidence to Record:**
- Error class implementation complete
- Type-check and lint passing

**Files Touched:**
- src/lib/api/errors.ts (new file)

---

### T3: Define TypeScript Interfaces for API ✅

**Goal:** Create TypeScript interfaces for Anytype API endpoints (auth, spaces, objects)

**Steps:**
1. Create `src/lib/api/types.ts`
2. Define authentication interfaces:
   - `CreateChallengeRequest`, `CreateChallengeResponse`
   - `CreateApiKeyRequest`, `CreateApiKeyResponse`
3. Define spaces interfaces:
   - `ListSpacesResponse`, `Space`
4. Define objects interfaces:
   - `CreateObjectRequest`, `CreateObjectResponse`
   - `SearchObjectsRequest`, `SearchObjectsResponse`, `AnytypeObject`
5. Add JSDoc comments for each interface
6. Export all interfaces

**Done When:**
- All interfaces defined per plan.md data contracts
- JSDoc comments added
- TypeScript strict mode passes
- No `any` types used (use `unknown` for flexible properties)

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Review interfaces match plan.md data contracts

**Evidence to Record:**
- TypeScript interfaces complete
- Type-check passing

**Files Touched:**
- src/lib/api/types.ts (new file)

---

### T4: Implement Zod Validation Schemas ✅

**Goal:** Create Zod schemas for runtime validation of API responses

**Steps:**
1. Create `src/lib/api/validators.ts`
2. Define Zod schemas matching TypeScript interfaces from T3:
   - `createChallengeResponseSchema`
   - `createApiKeyResponseSchema`
   - `listSpacesResponseSchema`
   - `createObjectResponseSchema`
   - `searchObjectsResponseSchema`
3. Implement validation helper function `validateResponse<T>(data: unknown, schema: ZodSchema<T>): T`
4. Add clear error messages for validation failures
5. Export schemas and validation helper

**Done When:**
- Zod schemas match TypeScript interfaces
- Validation helper throws `ValidationError` on failure
- Error messages indicate which field failed validation
- TypeScript strict mode passes

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Test validation helper with valid and invalid data

**Evidence to Record:**
- Zod schemas implemented
- Validation helper working

**Files Touched:**
- src/lib/api/validators.ts (new file)

---

### T5: Implement HTTP Client Wrapper ✅

**Goal:** Create AnytypeApiClient class with GET, POST, PUT, DELETE methods

**Steps:**
1. Create `src/lib/api/client.ts`
2. Implement `AnytypeApiClient` class with:
   - Constructor accepting port (default: 31009)
   - Private method `buildUrl(endpoint: string): string`
   - Private method `request<T>(method, endpoint, body?, headers?): Promise<T>`
   - Public methods: `get()`, `post()`, `put()`, `delete()`
3. Implement request timeout (10s default)
4. Integrate error classification (use errors.ts)
5. Add localhost-only URL validation
6. Add JSDoc comments

**Done When:**
- All HTTP methods implemented
- Timeout enforced (10s)
- Errors classified correctly (AuthError, NetworkError, ValidationError)
- Localhost-only URLs enforced
- TypeScript strict mode passes
- No `any` types used

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Review code for localhost-only URLs

**Evidence to Record:**
- HTTP client implemented
- Type-check and lint passing

**Files Touched:**
- src/lib/api/client.ts (new file)

---

### T6: Implement Health Check ✅

**Goal:** Create health check function to detect Anytype availability

**Steps:**
1. Create `src/lib/api/health.ts`
2. Implement `checkHealth(port?: number): Promise<boolean>` function
3. Use `/v1/spaces` endpoint as health check (lightweight)
4. Implement 2-second timeout
5. Return `true` if successful, `false` on any error (don't throw)
6. Add JSDoc comments

**Done When:**
- Health check function implemented
- 2-second timeout enforced
- Returns boolean (never throws)
- Uses `/v1/spaces` endpoint
- TypeScript strict mode passes

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Manual test with Anytype running and stopped

**Evidence to Record:**
- Health check implemented
- Manual test results

**Files Touched:**
- src/lib/api/health.ts (new file)

---

### T7: Add API Client to Module Exports ✅

**Goal:** Export API client, types, errors, and health check from lib/api

**Steps:**
1. Create `src/lib/api/index.ts`
2. Re-export all public APIs:
   - `AnytypeApiClient` from client.ts
   - All interfaces from types.ts
   - All error classes from errors.ts
   - `checkHealth` from health.ts
   - Validation schemas from validators.ts (optional, for advanced users)
3. Add JSDoc comments for module

**Done When:**
- All public APIs exported
- TypeScript strict mode passes
- Module can be imported with `import { ... } from './lib/api'`

**Verify:**
- Run `npm run type-check` - should pass
- Run `npm run lint` - should pass
- Test import in service worker

**Evidence to Record:**
- Module exports complete
- Import working

**Files Touched:**
- src/lib/api/index.ts (new file)

---

## Tests

### T8: Write Unit Tests for Error Classes

**Goal:** Test error class hierarchy and classification

**Steps:**
1. Create `tests/unit/api/errors.test.ts`
2. Write tests:
   - `test('ApiError has status, message, originalError')`
   - `test('AuthError extends ApiError')`
   - `test('NetworkError extends ApiError')`
   - `test('ValidationError extends ApiError')`
   - `test('classifyHttpError returns AuthError for 401')`
   - `test('classifyHttpError returns AuthError for 403')`
   - `test('classifyHttpError returns ApiError for 500')`
3. Run tests and verify all pass

**Done When:**
- All error class tests written
- Tests pass with >80% coverage for errors.ts
- No test failures

**Verify:**
- Run `npm test -- tests/unit/api/errors.test.ts` - should pass
- Run `npm run test:coverage` - errors.ts should have >80% coverage

**Evidence to Record:**
- Test results (all passing)
- Coverage report for errors.ts

**Files Touched:**
- tests/unit/api/errors.test.ts (new file)

---

### T9: Write Unit Tests for Validators

**Goal:** Test Zod schemas and validation helper

**Steps:**
1. Create `tests/unit/api/validators.test.ts`
2. Write tests for each schema:
   - `test('createChallengeResponseSchema validates valid response')`
   - `test('createChallengeResponseSchema rejects invalid response')`
   - `test('listSpacesResponseSchema validates valid response')`
   - `test('listSpacesResponseSchema rejects missing field')`
   - `test('createObjectResponseSchema validates valid response')`
   - `test('validateResponse throws ValidationError on failure')`
   - `test('validateResponse error message indicates failed field')`
3. Run tests and verify all pass

**Done When:**
- All validator tests written
- Tests pass with >80% coverage for validators.ts
- No test failures

**Verify:**
- Run `npm test -- tests/unit/api/validators.test.ts` - should pass
- Run `npm run test:coverage` - validators.ts should have >80% coverage

**Evidence to Record:**
- Test results (all passing)
- Coverage report for validators.ts

**Files Touched:**
- tests/unit/api/validators.test.ts (new file)

---

### T10: Write Unit Tests for HTTP Client

**Goal:** Test AnytypeApiClient methods with mocked fetch

**Steps:**
1. Create `tests/unit/api/client.test.ts`
2. Mock global fetch API
3. Write tests:
   - `test('GET request with valid response')`
   - `test('POST request with JSON body')`
   - `test('PUT request with headers')`
   - `test('DELETE request')`
   - `test('Request timeout after 10 seconds')`
   - `test('Localhost-only URL construction')`
   - `test('401 response throws AuthError')`
   - `test('Network failure throws NetworkError')`
   - `test('Invalid response throws ValidationError')`
4. Run tests and verify all pass

**Done When:**
- All HTTP client tests written
- Tests pass with >80% coverage for client.ts
- No test failures
- Fetch API properly mocked

**Verify:**
- Run `npm test -- tests/unit/api/client.test.ts` - should pass
- Run `npm run test:coverage` - client.ts should have >80% coverage

**Evidence to Record:**
- Test results (all passing)
- Coverage report for client.ts

**Files Touched:**
- tests/unit/api/client.test.ts (new file)

---

### T11: Write Unit Tests for Health Check

**Goal:** Test health check function with mocked responses

**Steps:**
1. Create `tests/unit/api/health.test.ts`
2. Mock global fetch API
3. Write tests:
   - `test('checkHealth returns true when Anytype is running')`
   - `test('checkHealth returns false when Anytype is stopped')`
   - `test('checkHealth completes within 2 seconds')`
   - `test('checkHealth does not throw on failure')`
   - `test('checkHealth uses custom port')`
4. Use fake timers for timeout tests
5. Run tests and verify all pass

**Done When:**
- All health check tests written
- Tests pass with >80% coverage for health.ts
- No test failures
- Timeout behavior verified

**Verify:**
- Run `npm test -- tests/unit/api/health.test.ts` - should pass
- Run `npm run test:coverage` - health.ts should have >80% coverage

**Evidence to Record:**
- Test results (all passing)
- Coverage report for health.ts

**Files Touched:**
- tests/unit/api/health.test.ts (new file)

---

## Verification

### T12: Manual Verification - Health Check with Anytype Running

**Goal:** Verify health check works with real Anytype instance

**Steps:**
1. Ensure Anytype Desktop is running on localhost:31009
2. Run development build: `npm run dev`
3. Load extension in browser (chrome://extensions/)
4. Open browser DevTools, go to service worker console
5. Import and call health check:
   ```javascript
   import { checkHealth } from './lib/api/health.js';
   checkHealth().then(result => console.log('Health check:', result));
   ```
6. Verify console shows `Health check: true`

**Done When:**
- Health check returns `true` with Anytype running
- Response time is under 2 seconds
- No errors thrown

**Verify:**
- Console output shows `Health check: true`
- Response time logged

**Evidence to Record:**
- Screenshot of console output
- Response time measurement

**Files Touched:**
- None (manual verification only)

---

### T13: Manual Verification - Health Check with Anytype Stopped

**Goal:** Verify health check returns false when Anytype is unavailable

**Steps:**
1. Stop Anytype Desktop
2. Repeat steps 2-5 from T12
3. Verify console shows `Health check: false`
4. Verify response time is under 2 seconds (timeout)

**Done When:**
- Health check returns `false` with Anytype stopped
- Response time is under 2 seconds (timeout enforced)
- No errors thrown

**Verify:**
- Console output shows `Health check: false`
- Response time is under 2 seconds

**Evidence to Record:**
- Screenshot of console output
- Response time measurement

**Files Touched:**
- None (manual verification only)

---

### T14: Manual Verification - Custom Port Configuration

**Goal:** Verify API client works with custom port

**Steps:**
1. Configure Anytype to run on custom port (e.g., 31010)
2. Create test script in service worker console:
   ```javascript
   import { AnytypeApiClient } from './lib/api/client.js';
   const client = new AnytypeApiClient(31010);
   client.get('/v1/spaces').then(result => console.log('Spaces:', result));
   ```
3. Verify request succeeds with custom port
4. Check network tab shows request to `http://localhost:31010/v1/spaces`

**Done When:**
- API client accepts custom port
- Request succeeds with custom port
- URL constructed correctly

**Verify:**
- Console output shows successful response
- Network tab shows correct URL

**Evidence to Record:**
- Screenshot of console output
- Screenshot of network tab

**Files Touched:**
- None (manual verification only)

---

## Docs

### T15: Update Type Definitions Index ✅

**Goal:** Add API types to src/types/index.d.ts for global access

**Steps:**
1. Open `src/types/index.d.ts`
2. Add re-exports for API types:
   ```typescript
   export * from '../lib/api/types';
   export * from '../lib/api/errors';
   ```
3. Run type-check to verify

**Done When:**
- API types accessible globally
- TypeScript compilation succeeds
- No circular dependencies

**Verify:**
- Run `npm run type-check` - should pass
- Test import in service worker

**Evidence to Record:**
- Type definitions updated
- Type-check passing

**Files Touched:**
- src/types/index.d.ts

---

### T16: Add JSDoc Comments to Public APIs

**Goal:** Ensure all public APIs have comprehensive JSDoc comments

**Steps:**
1. Review all files in `src/lib/api/`
2. Add JSDoc comments to:
   - All exported classes (AnytypeApiClient, error classes)
   - All exported functions (checkHealth, validateResponse)
   - All exported interfaces
3. Include `@param`, `@returns`, `@throws` tags
4. Add usage examples for complex APIs

**Done When:**
- All public APIs have JSDoc comments
- Comments include param types and return types
- Examples provided for complex APIs
- ESLint passes (no missing JSDoc warnings)

**Verify:**
- Run `npm run lint` - should pass
- Review code for JSDoc completeness

**Evidence to Record:**
- JSDoc comments complete
- Lint passing

**Files Touched:**
- src/lib/api/client.ts
- src/lib/api/errors.ts
- src/lib/api/health.ts
- src/lib/api/validators.ts
- src/lib/api/types.ts

---

## Tracking

### T17: Update SPECS.md

**Goal:** Update specification index with Epic 1.1 status

**Steps:**
1. Open `SPECS.md`
2. Update row for Epic 1.1 (roadmap anchor 1.1):
   - Status: "Done"
   - Next Task: "N/A"
   - Evidence: Link to `specs/011-api-client/spec.md#evidence`
3. Update "Last Updated" timestamp
4. Update progress tracking:
   - BP0 (Foundation): 2/3 complete
   - Total Epics Done: 2
   - Completion: 6% (2/32 complete)
5. Commit changes

**Done When:**
- SPECS.md updated with Epic 1.1 status
- Progress tracking updated
- Changes committed

**Verify:**
- Review SPECS.md for accuracy
- Verify links work

**Evidence to Record:**
- SPECS.md updated
- Commit hash

**Files Touched:**
- SPECS.md

---

### T18: Update SPEC.md

**Goal:** Update spec entrypoint to point to Epic 1.1

**Steps:**
1. Open `SPEC.md`
2. Update "Current focus" section:
   - Roadmap anchor: 1.1
   - Spec folder: specs/011-api-client/
   - Type: Feature
   - Priority: P0
   - Status: Done
   - Next command: `/specify 1.2` (for Epic 1.2: Storage Manager)
3. Update "Links" section to point to Epic 1.1 spec files
4. Commit changes

**Done When:**
- SPEC.md points to Epic 1.1
- Links updated
- Changes committed

**Verify:**
- Review SPEC.md for accuracy
- Verify links work

**Evidence to Record:**
- SPEC.md updated
- Commit hash

**Files Touched:**
- SPEC.md

---

### T19: Update spec.md with Evidence

**Goal:** Consolidate evidence in spec.md EVIDENCE section

**Steps:**
1. Open `specs/011-api-client/spec.md`
2. Update EVIDENCE section with:
   - Task completion summary (T1-T18)
   - AC verification results for each AC (AC-API-1 through AC-API-7)
   - Test coverage report
   - Manual verification results
   - Screenshots from manual tests
3. Add "Next Steps" section pointing to Epic 2.0
4. Commit changes

**Done When:**
- All evidence documented in spec.md
- AC verification results included
- Next steps documented
- Changes committed

**Verify:**
- Review spec.md EVIDENCE section for completeness
- Verify all ACs addressed

**Evidence to Record:**
- spec.md EVIDENCE section complete
- Commit hash

**Files Touched:**
- specs/011-api-client/spec.md

---

## Summary

**Total Tasks:** 19
- Setup: 1 task (T1)
- Core Implementation: 6 tasks (T2-T7)
- Tests: 4 tasks (T8-T11)
- Verification: 3 tasks (T12-T14)
- Docs: 2 tasks (T15-T16)
- Tracking: 3 tasks (T17-T19)

**Estimated Time:** 8-12 hours
- Setup: 30 minutes
- Core Implementation: 4-6 hours
- Tests: 2-3 hours
- Verification: 1 hour
- Docs: 1 hour
- Tracking: 30 minutes

**Dependencies:**
- Epic 1.0 (Project Setup & Architecture) must be complete
- Anytype Desktop must be available for manual testing

**Success Criteria:**
- All 19 tasks completed
- All 7 acceptance criteria verified
- Test coverage >80% for all API modules
- Manual verification successful
- SPECS.md and SPEC.md updated

