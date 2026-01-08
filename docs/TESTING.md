# Anytype Clipper - Testing Guide

## Running Tests

### Unit Tests

Run all unit tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

### Integration Tests

Run integration tests:
```bash
npm run test:integration
```

### Coverage Reports

Generate coverage report:
```bash
npm run test:coverage
```

View coverage report in browser:
```bash
open coverage/lcov-report/index.html
```

## Test Structure

```
tests/
├── unit/               # Unit tests for individual modules
│   ├── api/           # API client tests
│   ├── queue/         # Queue manager tests
│   ├── storage/       # Storage manager tests
│   ├── extractors/    # Content extractor tests
│   └── converters/    # Markdown converter tests
├── integration/        # Integration tests for workflows
│   ├── auth/          # Authentication flow tests
│   ├── capture/       # Capture workflow tests
│   ├── queue/         # Queue and retry tests
│   └── deduplication/ # Deduplication tests
└── fixtures/          # Test data and mocks
    ├── mock-api.ts    # Mock Anytype API
    └── sample-pages/  # Sample HTML pages for testing
```

## Writing Tests

### Unit Test Example

```typescript
import { QueueManager } from '../src/background/queue-manager';

describe('QueueManager', () => {
  let queueManager: QueueManager;

  beforeEach(() => {
    queueManager = QueueManager.getInstance();
    // Reset state before each test
  });

  it('should enqueue capture request', async () => {
    const request = {
      type: 'bookmark',
      url: 'https://example.com',
      title: 'Example'
    };

    await queueManager.enqueue(request);
    const status = await queueManager.getStatus();

    expect(status.pending).toBe(1);
  });
});
```

### Integration Test Example

```typescript
import { setupMockChrome } from '../fixtures/mock-chrome';

describe('Bookmark Capture Flow', () => {
  beforeEach(() => {
    setupMockChrome();
  });

  it('should capture bookmark and create Anytype object', async () => {
    // Test implementation
  });
});
```

## Test Coverage

Target coverage thresholds:
- **Overall:** >80%
- **API Client:** >85%
- **Queue Manager:** >90%
- **Storage Manager:** >85%
- **Content Extractors:** >80%

## CI/CD Pipeline

Tests run automatically on:
- Push to main branch
- Pull requests
- Manual workflow dispatch

Note: CI workflow is currently disabled during development. It will be re-enabled before v1.0 release.

## Troubleshooting

### Common Issues

**Tests fail with "chrome is not defined"**
- Ensure mock Chrome API is set up in test setup
- Check that `setupMockChrome()` is called in `beforeEach`

**Integration tests timeout**
- Increase timeout in Jest configuration
- Check for async operations that aren't being awaited

**Coverage reports not generated**
- Run `npm run test:coverage` instead of `npm test`
- Check that Jest coverage configuration is correct

## Additional Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Testing Library](https://testing-library.com/)
- [Chrome Extension Testing](https://developer.chrome.com/docs/extensions/mv3/tut_testing/)
