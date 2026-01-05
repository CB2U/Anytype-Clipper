# Implementation Plan: Epic 8.0 Unit Test Suite

## Architecture Overview

### Key Components and Responsibilities

1. **Jest Configuration (`jest.config.js`)**
   - Test environment setup (jsdom)
   - Coverage thresholds and reporting
   - Module name mapping for path aliases
   - Test file patterns

2. **Test Setup (`tests/setup.ts`)**
   - Global mocks for chrome APIs
   - Mock storage implementation
   - Test utilities and helpers

3. **Mock Fixtures (`tests/fixtures/`)**
   - Mock Anytype API responses
   - Sample page content for extractors
   - Test data generators

4. **Unit Tests (`tests/unit/`)**
   - Organized by module (api, storage, extractors, converters, services, utils)
   - Follow naming convention: `<module>.test.ts`

### Module Boundaries

```
tests/
├── setup.ts                    # Global test setup
├── fixtures/
│   ├── mock-api.ts            # Mock Anytype API
│   ├── mock-storage.ts        # Mock chrome.storage
│   ├── sample-pages/          # HTML samples for extractors
│   └── api-responses/         # Sample API response data
└── unit/
    ├── api/                   # API client tests
    ├── storage/               # Storage manager tests
    ├── extractors/            # Extractor tests
    ├── converters/            # Converter tests
    ├── services/              # Service tests
    └── utils/                 # Utility tests
```

### Existing Test Coverage Analysis

Based on codebase analysis, the following tests already exist:

| Module | Existing Tests | Coverage Status |
|--------|----------------|-----------------|
| queue-manager | ✅ `queue-manager.test.ts` | Needs review |
| retry-scheduler | ✅ `retry-scheduler.test.ts` | Needs review |
| badge-manager | ✅ `badge-manager.test.ts` | Needs review |
| article-extractor | ✅ `article-extractor.test.ts` | Needs enhancement |
| metadata-extractor | ✅ `metadata-extractor.test.ts` | Needs enhancement |
| markdown-converter | ✅ `markdown-converter.test.ts` | Needs enhancement |
| table-converter | ✅ `table-converter.test.ts` | Needs enhancement |
| url-normalizer | ✅ `url-normalizer.test.ts` | Needs enhancement |
| deduplication-service | ✅ `deduplication-service.test.ts` | Needs review |
| bookmark-capture-service | ✅ `bookmark-capture-service.test.ts` | Needs review |
| notification-service | ✅ `notification-service.test.ts` | Needs review |
| tag-service | ✅ `tag-service.test.ts` | Needs review |
| api/client | ✅ `client.test.ts` | Needs enhancement |
| storage-manager | ❌ Missing | To be created |
| settings-manager | ❌ Missing | To be created |
| health check | ❌ Missing | To be created |
| error sanitizer | ✅ `error-sanitizer.test.ts` | Needs review |

### Alternatives Considered

1. **Vitest instead of Jest**: Faster, but jest-chrome compatibility is better with Jest
2. **Coverage tool (c8 vs Istanbul)**: Istanbul via Jest is simpler, integrated
3. **Test organization (flat vs nested)**: Nested by module is cleaner for large codebase

**Chosen approach:** Enhance existing Jest setup with coverage thresholds, add missing tests, improve existing tests for edge cases and error scenarios.

---

## Data Contracts

### Mock API Response Types

```typescript
// tests/fixtures/mock-api.ts
interface MockApiConfig {
  defaultSpaceId: string;
  defaultSpaceName: string;
  mockObjects: MockObject[];
  errorResponses: Map<string, ApiError>;
}

interface MockObject {
  id: string;
  type: string;
  name: string;
  properties: Record<string, unknown>;
}

// Mock factory functions
function createMockSpace(overrides?: Partial<Space>): Space;
function createMockObject(type: 'bookmark' | 'article' | 'highlight', overrides?: Partial<Object>): Object;
function createMockApiError(code: number, message: string): ApiError;
```

---

## External Integrations

### Chrome API Mocking (via jest-chrome)

```typescript
// tests/setup.ts
import { chrome } from 'jest-chrome';

// Storage mock
chrome.storage.local.get.mockImplementation((keys, callback) => {
  // Return mock storage data
});

chrome.storage.local.set.mockImplementation((items, callback) => {
  // Store in mock
});

// Runtime mock for messaging
chrome.runtime.sendMessage.mockImplementation((message, callback) => {
  // Return mock response
});
```

---

## Testing Plan

### Test Categories

1. **Unit Tests (this epic):** Isolated function tests with mocked dependencies
2. **Integration Tests (8.1):** Component interaction tests
3. **E2E Tests (8.2):** Full browser automation tests

### Unit Test Structure

Each test file should follow this pattern:

```typescript
describe('ModuleName', () => {
  describe('functionName', () => {
    it('should handle normal case', () => { /* ... */ });
    it('should handle empty input', () => { /* ... */ });
    it('should handle null/undefined', () => { /* ... */ });
    it('should throw on invalid input', () => { /* ... */ });
    it('should handle edge case X', () => { /* ... */ });
  });
});
```

### Coverage Requirements

| Metric | Threshold | Measured By |
|--------|-----------|-------------|
| Branches | 80% | Istanbul |
| Functions | 80% | Istanbul |
| Lines | 80% | Istanbul |
| Statements | 80% | Istanbul |

---

## AC Verification Mapping

| Acceptance Criteria | Verification Method | Test Location |
|--------------------|--------------------|---------------|
| AC-UT-1: Coverage >80% | `npm test -- --coverage` | Coverage report |
| AC-UT-2: Public functions tested | Code review of exports vs tests | All test files |
| AC-UT-3: Edge cases covered | Test file review | describe blocks |
| AC-UT-4: Error scenarios | Test file review | error handling tests |
| AC-UT-5: Tests <5s | `npm test` timing | CI output |
| AC-UT-6: CI integration | GitHub Actions workflow | `.github/workflows/` |
| AC-UT-7: Mock API | Review mock-api.ts | `tests/fixtures/` |

---

## Rollout and Migration Notes

### Rollout Strategy

1. **Phase 1:** Configure Jest coverage thresholds (start at 70%)
2. **Phase 2:** Create missing tests for core modules
3. **Phase 3:** Enhance existing tests with edge cases
4. **Phase 4:** Raise threshold to 80%
5. **Phase 5:** Enable CI enforcement

### Migration Notes

- No breaking changes to existing tests
- Existing tests may need updates to pass coverage thresholds
- Some tests may need refactoring for better isolation

---

## Observability and Debugging

### What Can Be Logged

- Test execution times per file
- Coverage percentages per module
- Failed test names and assertions
- CI build status

### What Must Never Be Logged

- Real API keys or tokens (even in test code)
- Personal data or PII
- Production URLs or endpoints
- Actual user content

---

## Implementation Steps Summary

1. Enhance Jest configuration with coverage thresholds
2. Create test setup file with global mocks
3. Create mock Anytype API fixture
4. Add missing tests for storage manager
5. Add missing tests for settings manager
6. Add missing tests for health check module
7. Enhance existing tests with edge cases
8. Enhance existing tests with error scenarios
9. Verify coverage threshold is met
10. Configure GitHub Actions for CI test runs
