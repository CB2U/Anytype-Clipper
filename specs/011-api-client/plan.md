# Implementation Plan: API Client Foundation

## Architecture Overview

The API Client Foundation will be implemented as a modular TypeScript library in `src/lib/api/` with the following key components:

### Component Structure

```
src/lib/api/
├── client.ts           # Main API client class (AnytypeApiClient)
├── types.ts            # TypeScript interfaces for API requests/responses
├── errors.ts           # Error class hierarchy
├── validators.ts       # Runtime validation using Zod
└── health.ts           # Health check implementation
```

### Key Components and Responsibilities

**1. AnytypeApiClient (client.ts)**
- Singleton HTTP client for all Anytype API communication
- Manages base URL construction from port configuration
- Provides typed methods for each API endpoint
- Handles request/response serialization
- Integrates validation and error handling
- Methods: `get()`, `post()`, `put()`, `delete()`

**2. Type Definitions (types.ts)**
- TypeScript interfaces for all API endpoints
- Request/response types for auth, spaces, objects
- Organized by API domain (Auth, Spaces, Objects)
- Exported for use by other modules

**3. Error Hierarchy (errors.ts)**
- `ApiError` - Base error class with status code, message, originalError
- `AuthError` - 401/403 authentication failures
- `NetworkError` - Connection failures, timeouts, DNS errors
- `ValidationError` - Schema validation failures
- Helper functions to classify errors from HTTP responses

**4. Validators (validators.ts)**
- Zod schemas for API request/response validation
- Runtime type guards for type safety
- Validation helper functions
- Clear error messages for validation failures

**5. Health Check (health.ts)**
- `checkHealth()` function to ping Anytype
- Uses `/v1/spaces` endpoint as health check
- 2-second timeout
- Returns boolean (never throws)

### Message/Call Flow

```
Feature Module (e.g., bookmark capture)
    ↓
AnytypeApiClient.post('/v1/objects/create', data)
    ↓
1. Validate request with Zod schema
    ↓
2. Construct URL: http://localhost:{port}/v1/objects/create
    ↓
3. Send HTTP POST with JSON body
    ↓
4. Receive HTTP response
    ↓
5. Validate response with Zod schema
    ↓
6. Return typed response OR throw specific error
```

### Alternatives Considered

**Alternative 1: Use axios or similar HTTP library**
- **Rejected:** Adds unnecessary dependency, browser fetch API is sufficient
- **Chosen:** Use native fetch API (available in service workers)

**Alternative 2: Skip runtime validation (TypeScript only)**
- **Rejected:** TypeScript types don't exist at runtime, can't catch API contract violations
- **Chosen:** Use Zod for runtime validation to catch breaking changes early

**Alternative 3: Implement custom validation logic**
- **Rejected:** Reinventing the wheel, error-prone
- **Chosen:** Use Zod (battle-tested, excellent TypeScript integration)

## Data Contracts

### Authentication Endpoints

**POST /v1/auth/challenges**
```typescript
// Request
interface CreateChallengeRequest {
  // No body required
}

// Response
interface CreateChallengeResponse {
  challengeId: string;
  code: string; // 4-digit code
  expiresAt: number; // Unix timestamp
}
```

**POST /v1/auth/api_keys**
```typescript
// Request
interface CreateApiKeyRequest {
  challengeId: string;
  code: string; // 4-digit code entered by user
}

// Response
interface CreateApiKeyResponse {
  apiKey: string;
  expiresAt?: number; // Optional, if Anytype implements expiration
}
```

### Spaces Endpoints

**GET /v1/spaces**
```typescript
// Request
// No body, requires Authorization header

// Response
interface ListSpacesResponse {
  spaces: Space[];
}

interface Space {
  id: string;
  name: string;
  iconEmoji?: string;
  iconImage?: string;
}
```

### Objects Endpoints

**POST /v1/objects/create**
```typescript
// Request
interface CreateObjectRequest {
  spaceId: string;
  typeId: string;
  properties: Record<string, unknown>; // Flexible for different object types
}

// Response
interface CreateObjectResponse {
  objectId: string;
  url?: string; // Deep link to object in Anytype
}
```

**POST /v1/objects/search**
```typescript
// Request
interface SearchObjectsRequest {
  spaceId: string;
  query?: string;
  filters?: Record<string, unknown>;
  limit?: number;
}

// Response
interface SearchObjectsResponse {
  objects: AnytypeObject[];
  total: number;
}

interface AnytypeObject {
  id: string;
  typeId: string;
  properties: Record<string, unknown>;
  createdAt: number;
  updatedAt: number;
}
```

**Note:** Exact schemas may need refinement based on actual Anytype API. Open question [NEEDS CLARIFICATION: Object schemas] remains.

## Storage and Persistence

**Not applicable for this epic.** API client is stateless and does not persist data. Port configuration will be stored by Epic 1.2 (Storage Manager).

## External Integrations

**Anytype Desktop API (localhost only)**
- Base URL: `http://localhost:{port}` (default port: 31009)
- Protocol: HTTP (HTTPS if Anytype supports TLS on localhost)
- Authentication: Bearer token in Authorization header (after Epic 2.0)
- Content-Type: application/json

## UX and Operational States

**Not applicable for this epic.** API client is a library with no UI. Error states will be handled by calling modules.

## Testing Plan

### Unit Tests

**File:** `tests/unit/api-client.test.ts`

**Test Cases:**
1. **HTTP Client Methods**
   - `test('GET request with valid response')`
   - `test('POST request with JSON body')`
   - `test('PUT request with headers')`
   - `test('DELETE request')`
   - `test('Request timeout after 10 seconds')`
   - `test('Localhost-only URL construction')`

2. **Error Handling**
   - `test('401 response throws AuthError')`
   - `test('403 response throws AuthError')`
   - `test('Network failure throws NetworkError')`
   - `test('Timeout throws NetworkError')`
   - `test('Invalid response throws ValidationError')`

3. **Validation**
   - `test('Valid response passes validation')`
   - `test('Invalid response fails validation with clear message')`
   - `test('Missing required field fails validation')`
   - `test('Wrong type fails validation')`

4. **Health Check**
   - `test('Health check returns true when Anytype is running')`
   - `test('Health check returns false when Anytype is stopped')`
   - `test('Health check completes within 2 seconds')`
   - `test('Health check does not throw on failure')`

5. **Port Configuration**
   - `test('Default port 31009 used')`
   - `test('Custom port accepted')`
   - `test('Invalid port rejected (< 1024)')`
   - `test('Invalid port rejected (> 65535)')`
   - `test('Base URL constructed correctly with custom port')`

**Test Setup:**
- Use Jest for unit testing
- Mock fetch API with `jest.mock('node-fetch')` or similar
- Create mock responses for different scenarios
- Use fake timers for timeout tests

**Run Command:**
```bash
npm test -- tests/unit/api-client.test.ts
```

### Integration Tests

**Not applicable for this epic.** Integration tests will be added in Epic 2.0 when authentication is implemented and we can test against a real Anytype instance.

### Manual Verification

**Manual Test 1: Health Check with Anytype Running**
1. Ensure Anytype Desktop is running on localhost:31009
2. Run development build: `npm run dev`
3. Load extension in browser
4. Open browser console
5. Call health check from service worker console:
   ```javascript
   import { checkHealth } from './lib/api/health.js';
   checkHealth().then(result => console.log('Health check:', result));
   ```
6. **Expected:** Console shows `Health check: true`

**Manual Test 2: Health Check with Anytype Stopped**
1. Stop Anytype Desktop
2. Repeat steps 2-5 from Manual Test 1
3. **Expected:** Console shows `Health check: false` (within 2 seconds)

**Manual Test 3: Custom Port Configuration**
1. Configure Anytype to run on custom port (e.g., 31010)
2. Update extension settings to use port 31010
3. Repeat Manual Test 1
4. **Expected:** Health check succeeds with custom port

## AC Verification Mapping

| AC | Verification Method | Test Location |
|----|---------------------|---------------|
| AC-API-1 | `npm run type-check` | TypeScript compiler |
| AC-API-2 | Unit tests | `tests/unit/api-client.test.ts` - HTTP Client Methods |
| AC-API-3 | Unit tests | `tests/unit/api-client.test.ts` - Validation |
| AC-API-4 | Unit tests | `tests/unit/api-client.test.ts` - Error Handling |
| AC-API-5 | Unit tests + Manual | `tests/unit/api-client.test.ts` - Health Check + Manual Tests 1-2 |
| AC-API-6 | Unit tests + Manual | `tests/unit/api-client.test.ts` - Port Configuration + Manual Test 3 |
| AC-API-7 | Code review | Review `client.ts` for localhost-only URLs |

## Risks and Mitigations

### Risk 1: Anytype API Undocumented Behavior
**Mitigation:**
- Start with minimal interface definitions based on PRD
- Add validation to catch unexpected responses
- Document assumptions in code comments
- Add [NEEDS CLARIFICATION] for uncertain schemas

### Risk 2: Zod Bundle Size
**Mitigation:**
- Zod is tree-shakeable and adds ~10KB gzipped
- Acceptable for extension size budget
- Validation can be disabled in production if needed

### Risk 3: Health Check Endpoint Availability
**Mitigation:**
- Use `/v1/spaces` as health check (lightweight, always available)
- Implement 2-second timeout to prevent hanging
- Return false on any error (don't throw)

## Rollout and Migration Notes

**Not applicable for this epic.** This is new code with no migration needed. API client will be used by subsequent epics (2.0, 3.0, etc.).

## Observability and Debugging

### What Can Be Logged
- HTTP method and endpoint (e.g., "POST /v1/objects/create")
- Response status code (e.g., 200, 401, 500)
- Validation errors (which field failed, expected vs actual type)
- Network errors (timeout, connection refused)
- Health check results (true/false)
- Port configuration changes

### What Must Never Be Logged
- API keys or tokens (SEC-3)
- Full request/response bodies (may contain sensitive content)
- User data (URLs, titles, content)
- Challenge codes

### Logging Strategy
- Use `console.debug()` for development logging
- Sanitize all error messages before logging
- Log only metadata (method, endpoint, status code)
- Add structured logging in future epic (debug log viewer)

