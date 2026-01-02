# Implementation Plan: Readability Integration

## Goal Description

Integrate Mozilla Readability library into the Anytype Clipper Extension to enable clean article extraction from web pages. This epic provides the foundation for article capture by implementing the primary extraction method that removes ads, navigation, and other clutter while preserving article structure and metadata.

This is the first step in the article extraction pipeline (BP3: Article Extraction). Subsequent epics will add Markdown conversion (4.1), fallback strategies (4.2), image handling (4.3), and table preservation (4.4).

---

## User Review Required

> [!IMPORTANT]
> **Build Pipeline Modification**
> This epic requires adding the `@mozilla/readability` npm package (~50KB minified) to the content script bundle. This will increase the content script size. The library is essential for article extraction and is used by Firefox Reader View and many other tools.

> [!IMPORTANT]
> **Content Script Injection Strategy**
> Readability requires access to the page DOM. The content script must be injected into the page context with appropriate permissions. Per constitution PERF-5, content scripts should be injected on activation only (not on every page load) to avoid performance impact.

---

## Proposed Changes

### Component: Content Extraction Library

This component adds the Readability library and creates a wrapper service for article extraction.

#### [NEW] [package.json](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/package.json)

Add `@mozilla/readability` dependency:

```json
{
  "dependencies": {
    "@mozilla/readability": "^0.5.0"
  }
}
```

**Rationale:** Use the official Mozilla Readability package for article extraction.

---

#### [NEW] [article-extractor.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/extractors/article-extractor.ts)

Create a new service that wraps Readability and provides article extraction functionality.

**Key responsibilities:**
- Clone the document DOM to avoid modifying the live page
- Initialize Readability with the cloned document
- Call `parse()` to extract article content
- Handle extraction failures gracefully (return null)
- Extract and return metadata (title, byline, excerpt, length, dir)
- Track extraction time for performance monitoring
- Provide quality indicators (success/partial/failure)

**Interface:**
```typescript
interface ArticleExtractionResult {
  success: boolean;
  quality: 'success' | 'partial' | 'failure';
  article: {
    title: string;
    byline: string | null;
    excerpt: string | null;
    content: string; // cleaned HTML
    textContent: string; // plain text
    length: number; // character count
    dir: string; // ltr/rtl
  } | null;
  metadata: {
    extractionTime: number; // milliseconds
    wordCount: number;
  };
  error?: string;
}

function extractArticle(): ArticleExtractionResult;
```

**Error handling:**
- Catch and log any Readability errors
- Return structured error object with sanitized message
- Never expose sensitive data in error messages (SEC-4)

**Performance:**
- Set 5-second timeout for extraction (PERF-2)
- Log extraction start/end time
- Abort if timeout exceeded

---

#### [MODIFY] [content-script.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/content/content-script.ts)

Add message handler for article extraction requests from the service worker.

**Changes:**
- Import `extractArticle` from `article-extractor.ts`
- Add message listener for `EXTRACT_ARTICLE` action
- Call `extractArticle()` when requested
- Send result back to service worker via `chrome.runtime.sendMessage`

**Message flow:**
1. Service worker sends `EXTRACT_ARTICLE` message to content script
2. Content script calls `extractArticle()`
3. Content script sends result back to service worker
4. Service worker processes result (creates Anytype object or triggers fallback)

---

### Component: Service Worker Integration

This component integrates article extraction into the capture flow.

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Add article extraction to the capture flow.

**Changes:**
- Add `extractArticle` action handler
- Send `EXTRACT_ARTICLE` message to content script
- Receive extraction result from content script
- Store extracted article data for further processing (Markdown conversion in Epic 4.1)
- Handle extraction failures (trigger fallback chain in Epic 4.2)
- Show quality feedback notification to user

**Quality feedback messages:**
- Success: "Article captured (X words)" (green notification)
- Partial: "Article captured (simplified)" (yellow notification)
- Failure: Trigger fallback chain (Epic 4.2)

---

### Component: Type Definitions

#### [NEW] [article.d.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/types/article.d.ts)

Create TypeScript type definitions for article extraction.

**Types:**
- `ArticleExtractionResult` (as defined above)
- `ReadabilityArticle` (from `@mozilla/readability`)
- `ExtractionQuality` enum: `SUCCESS | PARTIAL | FAILURE`

---

### Component: Build Configuration

#### [MODIFY] [vite.config.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/vite.config.ts) or [webpack.config.js](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/webpack.config.js)

Ensure Readability library is bundled into the content script.

**Changes:**
- Verify content script bundle includes `@mozilla/readability`
- Enable tree-shaking to minimize bundle size
- Monitor bundle size (should be ~50KB increase)

---

## Verification Plan

### Automated Tests

#### Unit Tests

**Test file:** `tests/unit/article-extractor.test.ts` (NEW)

**Test cases:**
1. **Successful extraction:** Mock DOM with article content, verify extraction returns expected structure
2. **Extraction failure:** Mock DOM with no article content, verify graceful failure (returns null)
3. **Metadata extraction:** Verify title, byline, excerpt, length, dir extracted correctly
4. **Performance timeout:** Mock slow extraction, verify timeout at 5 seconds
5. **Error handling:** Mock Readability error, verify sanitized error message returned

**Run command:**
```bash
npm test -- article-extractor.test.ts
```

---

#### Integration Tests

**Test file:** `tests/integration/article-capture.test.ts` (NEW)

**Test cases:**
1. **End-to-end article extraction:** Load real article page, trigger extraction, verify result
2. **Content script communication:** Verify service worker ↔ content script message passing
3. **Quality feedback:** Verify correct notification shown based on extraction quality

**Run command:**
```bash
npm run test:integration -- article-capture.test.ts
```

---

### Manual Verification

#### Test Corpus

Create a test corpus of 50 diverse web pages covering:
- News sites: CNN, NYT, BBC, The Guardian, Reuters
- Blogs: Medium, WordPress, Ghost
- Documentation: MDN, GitHub, Stack Overflow
- Academic: arXiv, PubMed
- Edge cases: SPAs, dynamic pages, paywalls

**Verification steps:**
1. Load extension in browser
2. Navigate to each test page
3. Trigger article capture (context menu or popup)
4. Verify extraction result:
   - ✅ Success: Article content extracted, ads/nav removed
   - ⚠️ Partial: Some content extracted but degraded
   - ❌ Failure: No content extracted (fallback triggered)
5. Record success rate (target: 80%+)

**Success criteria:**
- At least 40/50 pages extract successfully
- Extraction completes within 5 seconds for 95% of pages
- No crashes or errors on any page

---

#### Manual Test Cases

**TC-1: Extract article from news site**
1. Navigate to https://www.bbc.com/news (any article)
2. Right-click → "Clip article to Anytype"
3. Verify:
   - Article content extracted
   - Ads and navigation removed
   - Headings and paragraphs preserved
   - Success notification shown with word count
   - Extraction completes <5s

**TC-2: Extract article with author and metadata**
1. Navigate to Medium article with author
2. Trigger article capture
3. Verify:
   - Title extracted correctly
   - Byline (author) extracted
   - Excerpt (summary) extracted
   - Word count shown in notification

**TC-3: Handle extraction failure gracefully**
1. Navigate to Twitter feed (SPA, no article content)
2. Trigger article capture
3. Verify:
   - Extraction returns null (no crash)
   - Fallback chain triggered (Epic 4.2)
   - User sees appropriate message

**TC-4: Performance test on large article**
1. Navigate to long-form article (5000+ words)
2. Trigger article capture
3. Verify:
   - Extraction completes within 5 seconds
   - Success notification shown
   - No memory issues or browser slowdown

---

## Rollout and Migration Notes

- No data migration required (new feature)
- No breaking changes to existing capture flows
- Content script injection strategy must be verified (on activation only)
- Monitor bundle size increase (~50KB expected)

---

## Observability and Debugging

### What can be logged

- Extraction start/end time (performance monitoring)
- Extraction quality (success/partial/failure)
- Word count and character count
- Sanitized error messages (no sensitive data)
- Page URL (for debugging, but respect privacy mode)

### What must never be logged

- Full article content (privacy)
- User API keys (security)
- Personal data from page (privacy)
- Unsanitized error messages with stack traces (security)

### Debug information

- Add `DEBUG_ARTICLE_EXTRACTION` flag for verbose logging
- Log extraction steps: clone DOM → parse → extract metadata
- Log Readability internal state (if available)
- Export extraction result as JSON for debugging (options page)
