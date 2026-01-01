# Implementation Plan: Highlight Capture

## 1. Architecture Overview

### Key Components

1. **Content Script (`src/content/highlight-capture.ts`)**
   - Injected on-demand when user triggers "Send selection to Anytype"
   - Captures selected text using `window.getSelection()`
   - Extracts context (50 chars before/after)
   - Sends data to background service worker

2. **Context Menu Handler (`src/background/service-worker.ts`)**
   - Registers "Send selection to Anytype" menu item
   - Shows only when text is selected
   - Triggers content script injection and capture flow

3. **Popup UI Extension (`src/popup/popup.ts`)**
   - Reuse existing popup for tags/notes input
   - Add highlight-specific fields (quote preview, context preview)
   - Display source URL and page title

4. **API Client Extension (`src/lib/api/client.ts`)**
   - Reuse existing `createObject` method
   - Map highlight properties to Anytype object schema

### Message Flow

```
User selects text → Right-click menu → Context menu handler
                                            ↓
                                    Inject content script
                                            ↓
                                    Capture selection + context
                                            ↓
                                    Send to background worker
                                            ↓
                                    Open popup with data
                                            ↓
                                    User adds tags/notes
                                            ↓
                                    Create Anytype object
```

### Alternatives Considered

**Alternative 1:** Persistent content script on all pages
- **Rejected:** Performance impact (PERF-5 violation)
- **Chosen:** On-demand injection only when user triggers capture

**Alternative 2:** Capture full paragraph instead of fixed 50 chars
- **Rejected:** Inconsistent context length, harder to preview
- **Chosen:** Fixed 50 chars before/after for predictability

## 2. Data Contracts

### Content Script → Background Message

```typescript
interface HighlightCaptureMessage {
  type: 'CAPTURE_HIGHLIGHT';
  data: {
    quote: string;           // Selected text
    contextBefore: string;   // 50 chars before
    contextAfter: string;    // 50 chars after
    url: string;             // Page URL
    pageTitle: string;       // document.title
    timestamp: string;       // ISO timestamp
  };
}
```

### Anytype Highlight Object Schema

```typescript
interface HighlightObject {
  type_key: 'highlight';     // or 'note' depending on Anytype schema
  name: string;              // First 50 chars of quote
  body: string;              // Full quote + context formatted
  properties: Array<{
    relationKey: string;
    value: { text: string };
  }>;
  // Properties:
  // - source: URL
  // - page_title: Page title
  // - created_at: Timestamp
  // - tags: User-provided tags (moved to body if multi_select)
}
```

## 3. Storage and Persistence

No new storage schema required. Reuse existing:
- Queue storage for offline captures
- Settings storage for user preferences (Space, Type)

## 4. External Integrations

### Chrome APIs
- `chrome.contextMenus.create()` - Register context menu item
- `chrome.scripting.executeScript()` - Inject content script on-demand
- `chrome.runtime.sendMessage()` - Content script → background communication
- `chrome.tabs.query()` - Get active tab for URL/title

### Anytype API
- `POST /v1/spaces/{spaceId}/objects` - Create highlight object
- Reuse existing `AnytypeApiClient.createObject` method

## 5. UX and Operational States

### States
1. **Idle:** No selection, context menu hidden
2. **Selection Active:** Text selected, context menu shows "Send selection to Anytype"
3. **Capturing:** Content script injected, extracting quote + context
4. **Preview:** Popup open with quote/context preview, awaiting user input
5. **Saving:** Creating Anytype object
6. **Success:** Notification shown, popup closes
7. **Error:** Error message in popup, retry option

### Error Scenarios
- **No text selected:** Disable context menu item
- **Content script injection fails:** Show error, offer manual paste
- **Context extraction fails:** Use quote only, empty context
- **API call fails:** Queue for retry (existing queue system)

## 6. Testing Plan

### Unit Tests

**Test File:** `tests/unit/highlight-capture.test.ts` (new file)

Tests to write:
- `extractContext()` function with edge cases:
  - Selection at document start (no "before" context)
  - Selection at document end (no "after" context)
  - Selection < 50 chars total
  - Selection with special characters (quotes, newlines)
- `sanitizeText()` function for HTML escaping
- `normalizeUrl()` function (reuse existing tests)

**Run command:** `npm test -- highlight-capture.test.ts`

### Integration Tests

**Test File:** `tests/integration/highlight-flow.test.ts` (new file)

Tests to write:
- Full highlight capture flow:
  1. Mock content script message
  2. Verify popup opens with correct data
  3. Mock user input (tags, notes)
  4. Verify API call with correct payload
  5. Verify success notification

**Run command:** `npm test -- highlight-flow.test.ts`

### Manual Testing

**Test Scenario 1: Basic Highlight Capture**
1. Build extension: `npm run build`
2. Load unpacked extension in Brave
3. Navigate to https://example.com
4. Select a paragraph of text (100+ characters)
5. Right-click → "Send selection to Anytype"
6. Verify popup shows:
   - Quote preview (selected text)
   - Context preview (50 chars before/after with "..." markers)
   - Source URL: https://example.com
   - Page title: "Example Domain"
7. Add tags: "test", "highlight"
8. Add note: "Testing highlight capture"
9. Click "Save"
10. Open Anytype Desktop
11. Verify highlight object created with all properties

**Test Scenario 2: Edge Case - Selection at Document Start**
1. Navigate to any page
2. Select the first sentence (at document start)
3. Right-click → "Send selection to Anytype"
4. Verify context shows only "after" text (no "before")
5. Save and verify in Anytype

**Test Scenario 3: Performance - No Page Impact**
1. Open Chrome DevTools → Performance tab
2. Navigate to a complex page (e.g., GitHub repo)
3. Start performance recording
4. Select text and trigger highlight capture
5. Stop recording
6. Verify:
   - No layout thrashing
   - Content script execution < 50ms
   - No console errors

## 7. AC Verification Mapping

| AC | Verification Method | Test Location |
|----|---------------------|---------------|
| AC3 | Manual test scenario 1 | Manual testing steps above |
| AC3.1 | Manual test scenario 2 + unit tests | `highlight-capture.test.ts` |
| AC3.2 | Manual test scenario 3 | Performance testing |
| AC3.3 | Manual test across page types | Test on static HTML, React SPA, iframe |
| FR4.1 | Integration test | `highlight-flow.test.ts` |
| FR4.2 | Unit tests | `highlight-capture.test.ts` |
| FR4.3 | Integration test | `highlight-flow.test.ts` |
| FR4.4 | Integration test + manual verification | Both |
| FR4.5 | Manual test | Scenario 1 |
| PERF-5 | Manual performance test | Scenario 3 |

## 8. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Content script fails on complex pages | Wrap in try-catch, fallback to error message |
| Selection API not available | Check `window.getSelection` exists before use |
| Context extraction breaks on edge cases | Comprehensive unit tests, graceful degradation |
| Performance regression | Lazy injection, timeout after 100ms, performance monitoring |

## 9. Rollout and Migration Notes

- No data migration required
- No breaking changes to existing features
- Feature is additive (new context menu item)
- Can be rolled out immediately after testing

## 10. Observability and Debugging

### What can be logged
- Highlight capture initiated (timestamp, URL)
- Quote length, context length
- Content script injection success/failure
- API call success/failure (sanitized)

### What must never be logged
- Full quote text (may contain sensitive data)
- Full context text
- API keys
- User's personal notes

### Debug Approach
- Use existing debug log system
- Log capture flow stages: "initiated", "extracted", "previewing", "saving", "success"
- Include sanitized error messages
- Performance metrics: content script execution time

