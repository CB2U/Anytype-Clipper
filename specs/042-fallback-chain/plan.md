# Implementation Plan: Fallback Extraction Chain

## Goal Description

Implement a 4-level waterfall extraction strategy for the Anytype Clipper Extension to ensure robust article capture even when Mozilla Readability fails. This epic extends the article extraction pipeline (BP3: Article Extraction) by adding three fallback levels after Readability, ensuring users always capture something useful.

The fallback chain provides graceful degradation: Readability (best quality) → Simplified DOM extraction → Full page cleaning → Smart bookmark (guaranteed success). Each level provides quality feedback so users understand what was captured.

---

## User Review Required

> [!IMPORTANT]
> **Extraction Strategy**
> This epic implements a 4-level fallback chain that progressively degrades extraction quality. Users will see quality indicators (green/yellow/orange) to understand what was captured. The chain ensures 100% capture success rate by falling back to smart bookmarks when all extraction levels fail.

> [!IMPORTANT]
> **Performance Impact**
> The fallback chain adds up to 10 seconds total extraction time (5s + 3s + 2s timeouts). Most pages will succeed at Level 1 (Readability) within 5 seconds. Only problematic pages (SPAs, JavaScript-heavy sites) will trigger fallback levels.

---

## Proposed Changes

### Component: Fallback Extraction Service

This component implements the core fallback chain logic and extraction algorithms for Levels 2-4.

#### [NEW] [fallback-extractor.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/extractors/fallback-extractor.ts)

Create a new service that implements the fallback extraction chain.

**Key responsibilities:**
- Orchestrate 4-level waterfall extraction
- Implement Level 2 (Simplified DOM extraction)
- Implement Level 3 (Full page capture with cleaning)
- Implement Level 4 (Smart bookmark fallback)
- Track extraction quality and performance
- Handle timeouts and errors gracefully

**Interface:**
```typescript
enum ExtractionLevel {
  READABILITY = 1,
  SIMPLIFIED_DOM = 2,
  FULL_PAGE_CLEAN = 3,
  SMART_BOOKMARK = 4,
}

enum ExtractionQuality {
  SUCCESS = 'success',        // Level 1
  PARTIAL = 'partial',        // Level 2 or 3
  FALLBACK = 'fallback',      // Level 4
}

interface FallbackExtractionResult {
  success: boolean;
  level: ExtractionLevel;
  quality: ExtractionQuality;
  content: {
    html: string | null;
    markdown: string | null;
    title: string;
    metadata: Record<string, any>;
  };
  performance: {
    totalTime: number;
    levelTimes: Record<ExtractionLevel, number>;
  };
  error?: string;
}

async function extractWithFallback(): Promise<FallbackExtractionResult>;
```

**Level 2 Algorithm (Simplified DOM):**
```typescript
function extractSimplifiedDOM(): string | null {
  // 1. Find largest <article> tag
  const articles = document.querySelectorAll('article');
  if (articles.length > 0) {
    const largest = findLargestByTextContent(articles);
    if (largest && getWordCount(largest) >= 100) {
      return largest.innerHTML;
    }
  }
  
  // 2. Calculate text density for major blocks
  const blocks = document.querySelectorAll('main, div, section');
  const densities = blocks.map(block => ({
    element: block,
    density: calculateTextDensity(block),
    wordCount: getWordCount(block),
  }));
  
  // 3. Select block with highest density (minimum 0.3)
  const best = densities
    .filter(d => d.density >= 0.3 && d.wordCount >= 100)
    .sort((a, b) => b.density - a.density)[0];
  
  return best ? best.element.innerHTML : null;
}

function calculateTextDensity(element: Element): number {
  const textLength = element.textContent?.length || 0;
  const htmlLength = element.innerHTML.length;
  return htmlLength > 0 ? textLength / htmlLength : 0;
}
```

**Level 3 Algorithm (Full Page Clean):**
```typescript
function extractFullPageClean(): string | null {
  // 1. Clone document.body
  const clone = document.body.cloneNode(true) as HTMLElement;
  
  // 2. Remove scripts, styles, iframes
  const removeTags = ['script', 'style', 'iframe', 'noscript'];
  removeTags.forEach(tag => {
    clone.querySelectorAll(tag).forEach(el => el.remove());
  });
  
  // 3. Remove by common class/id patterns
  const removePatterns = [
    /nav|navbar|menu|breadcrumb/i,
    /footer|copyright/i,
    /ad|advertisement|sponsored|promo/i,
    /share|social|follow/i,
    /comment|disqus/i,
  ];
  
  clone.querySelectorAll('*').forEach(el => {
    const className = el.className.toString();
    const id = el.id;
    const shouldRemove = removePatterns.some(pattern => 
      pattern.test(className) || pattern.test(id)
    );
    if (shouldRemove) {
      el.remove();
    }
  });
  
  // 4. Check if remaining content is substantial
  const wordCount = getWordCount(clone);
  return wordCount >= 50 ? clone.innerHTML : null;
}
```

**Level 4 Algorithm (Smart Bookmark):**
```typescript
async function createSmartBookmark(): Promise<FallbackExtractionResult> {
  // Use bookmark capture from Epic 3.0 + metadata from Epic 3.2
  const metadata = await extractMetadata(); // From Epic 3.2
  
  return {
    success: true,
    level: ExtractionLevel.SMART_BOOKMARK,
    quality: ExtractionQuality.FALLBACK,
    content: {
      html: null,
      markdown: null,
      title: document.title,
      metadata: {
        ...metadata,
        extractionFailed: true,
        note: 'Article extraction failed. Saved as bookmark.',
      },
    },
    performance: { totalTime: 0, levelTimes: {} },
  };
}
```

**Timeout Handling:**
```typescript
async function runWithTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number
): Promise<T | null> {
  return Promise.race([
    fn(),
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// Usage:
const level2Result = await runWithTimeout(extractSimplifiedDOM, 3000);
```

---

### Component: Article Extractor Integration

This component integrates the fallback chain into the existing article extraction flow.

#### [MODIFY] [article-extractor.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/extractors/article-extractor.ts)

Update the article extractor to use the fallback chain.

**Changes:**
- Import `extractWithFallback` from `fallback-extractor.ts`
- Replace direct Readability call with fallback chain orchestration
- Update `ArticleExtractionResult` interface to include `level` and `quality` fields
- Pass Readability result as Level 1 to fallback chain
- Handle all extraction levels uniformly

**Updated Interface:**
```typescript
interface ArticleExtractionResult {
  success: boolean;
  level: ExtractionLevel;           // NEW
  quality: ExtractionQuality;       // NEW (replaces old 'quality' field)
  article: {
    title: string;
    byline: string | null;
    excerpt: string | null;
    content: string;
    markdown: string;
    textContent: string;
    length: number;
    dir: string;
  } | null;
  metadata: {
    extractionTime: number;
    conversionTime: number;
    wordCount: number;
    levelTimes: Record<ExtractionLevel, number>;  // NEW
  };
  error?: string;
}
```

**Extraction Flow:**
```typescript
async function extractArticle(): Promise<ArticleExtractionResult> {
  const startTime = performance.now();
  
  // Run fallback chain
  const result = await extractWithFallback();
  
  // Convert to Markdown if HTML content available
  let markdown = null;
  if (result.content.html) {
    const conversionResult = await convertToMarkdown(result.content.html);
    markdown = conversionResult.markdown;
  }
  
  return {
    success: result.success,
    level: result.level,
    quality: result.quality,
    article: markdown ? {
      title: result.content.title,
      byline: result.content.metadata.author || null,
      excerpt: result.content.metadata.description || null,
      content: result.content.html || '',
      markdown: markdown,
      textContent: extractPlainText(result.content.html || ''),
      length: getWordCount(result.content.html || ''),
      dir: 'ltr',
    } : null,
    metadata: {
      extractionTime: performance.now() - startTime,
      conversionTime: 0,
      wordCount: getWordCount(result.content.html || ''),
      levelTimes: result.performance.levelTimes,
    },
  };
}
```

---

### Component: Quality Indicator UI

This component displays extraction quality feedback to users.

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Update notification messages to reflect extraction quality.

**Quality feedback messages:**
```typescript
function getQualityMessage(result: ArticleExtractionResult): string {
  const wordCount = result.metadata.wordCount;
  
  switch (result.quality) {
    case ExtractionQuality.SUCCESS:
      return `Article captured (${wordCount} words)`;
    case ExtractionQuality.PARTIAL:
      return `Article captured (simplified)`;
    case ExtractionQuality.FALLBACK:
      return `Saved as bookmark - extraction failed`;
    default:
      return 'Capture completed';
  }
}

function getQualityColor(quality: ExtractionQuality): string {
  switch (quality) {
    case ExtractionQuality.SUCCESS: return 'green';
    case ExtractionQuality.PARTIAL: return 'yellow';
    case ExtractionQuality.FALLBACK: return 'orange';
    default: return 'gray';
  }
}
```

**Notification with retry option:**
```typescript
async function showCaptureNotification(result: ArticleExtractionResult) {
  const message = getQualityMessage(result);
  const color = getQualityColor(result.quality);
  
  const buttons = [];
  if (result.quality === ExtractionQuality.FALLBACK) {
    buttons.push({
      title: 'Retry extraction',
      action: 'retry',
    });
  }
  
  await chrome.notifications.create({
    type: 'basic',
    iconUrl: `/icons/icon-${color}.png`,
    title: 'Anytype Clipper',
    message: message,
    buttons: buttons,
  });
}
```

---

### Component: Manual Retry Functionality

This component implements manual retry for failed extractions.

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Add retry logic for failed extractions.

**Retry handling:**
```typescript
// Track retry counts per URL
const retryCountMap = new Map<string, number>();

chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
  if (buttonIndex === 0) { // Retry button
    const url = getCurrentTabUrl();
    const retryCount = retryCountMap.get(url) || 0;
    
    if (retryCount >= 3) {
      await chrome.notifications.create({
        type: 'basic',
        iconUrl: '/icons/icon-orange.png',
        title: 'Anytype Clipper',
        message: 'Maximum retry attempts reached (3)',
      });
      return;
    }
    
    // Increment retry count
    retryCountMap.set(url, retryCount + 1);
    
    // Run extraction again
    const result = await extractArticle();
    
    // Clear retry count on success
    if (result.quality !== ExtractionQuality.FALLBACK) {
      retryCountMap.delete(url);
    }
    
    await showCaptureNotification(result);
  }
});
```

---

### Component: Anytype Object Properties

This component adds extraction quality metadata to Anytype objects.

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Add extraction quality properties to Anytype objects.

**Object properties:**
```typescript
async function createAnytypeObject(result: ArticleExtractionResult) {
  const properties = {
    title: result.article?.title || document.title,
    url: normalizeUrl(window.location.href),
    sourceApp: 'AnytypeClipper',
    createdAt: new Date().toISOString(),
    
    // NEW: Extraction quality metadata
    extractionLevel: result.level,
    extractionQuality: result.quality,
    extractionTime: result.metadata.extractionTime,
  };
  
  if (result.quality === ExtractionQuality.FALLBACK) {
    properties.extractionFailed = true;
    properties.note = 'Article extraction failed. Saved as bookmark.';
  }
  
  await apiClient.createObject({
    type: result.quality === ExtractionQuality.FALLBACK ? 'Bookmark' : 'Article',
    properties: properties,
    content: result.article?.markdown || '',
  });
}
```

---

## Verification Plan

### Automated Tests

#### Unit Tests

**Test file:** `tests/unit/fallback-extractor.test.ts` (NEW)

**Test cases:**
1. **Level 2 - Article tag extraction:** Mock page with `<article>` tag, verify content extracted
2. **Level 2 - Text density calculation:** Mock page with multiple divs, verify highest density selected
3. **Level 2 - Minimum word count:** Mock page with short content, verify null returned
4. **Level 3 - Script removal:** Mock page with scripts, verify scripts removed from output
5. **Level 3 - Ad removal:** Mock page with ad classes, verify ads removed
6. **Level 3 - Minimum word count:** Mock page with minimal content, verify null returned
7. **Level 4 - Smart bookmark:** Verify bookmark created with metadata
8. **Timeout handling:** Mock slow extraction, verify timeout at specified duration
9. **Fallback chain order:** Mock failures, verify levels attempted in order (1→2→3→4)
10. **Performance tracking:** Verify `levelTimes` recorded for each level

**Run command:**
```bash
npm test -- fallback-extractor.test.ts
```

**Expected coverage:** >80% for fallback-extractor.ts

---

**Test file:** `tests/unit/article-extractor.test.ts` (MODIFY)

**New test cases to add:**
1. **Fallback integration:** Verify article extractor uses fallback chain
2. **Level and quality fields:** Verify result includes `level` and `quality` fields
3. **Level times tracked:** Verify `levelTimes` in metadata

**Run command:**
```bash
npm test -- article-extractor.test.ts
```

---

#### Integration Tests

**Test file:** `tests/integration/fallback-extraction.test.ts` (NEW)

**Test cases:**
1. **SPA page (Level 2):** Load React/Vue app, verify Level 2 extraction succeeds
2. **JavaScript-heavy page (Level 3):** Load Twitter/Gmail, verify Level 3 extraction succeeds
3. **Minimal content page (Level 4):** Load landing page, verify Level 4 bookmark created
4. **Quality indicators:** Verify correct quality shown for each level
5. **Performance:** Verify total extraction time ≤10s

**Run command:**
```bash
npm run test:integration -- fallback-extraction.test.ts
```

---

### Manual Verification

#### Test Corpus

Create a test corpus of 100 diverse web pages covering:
- Traditional news sites (should succeed at Level 1)
- SPAs (React, Vue, Angular - should succeed at Level 2/3)
- JavaScript-heavy sites (Twitter, Gmail - should succeed at Level 3)
- Landing pages (minimal content - should fall back to Level 4)
- Paywalled content (partial extraction - Level 2/3)

**Verification steps:**
1. Load extension in browser
2. Navigate to each test page
3. Trigger article capture
4. Record extraction level and quality
5. Verify content quality matches level
6. Verify total extraction time ≤10s

**Success criteria:**
- At least 95/100 pages capture successfully (including smart bookmarks)
- Average extraction time ≤5s
- No crashes or errors on any page

---

#### Manual Test Cases

**TC-1: Verify Level 2 extraction on SPA**
1. Navigate to a React/Vue app (e.g., https://reactjs.org/)
2. Trigger article capture
3. Verify:
   - Extraction succeeds at Level 2
   - Quality indicator shows "Article captured (simplified)" in yellow
   - Content is readable in Anytype
   - Extraction time ≤8s (5s timeout + 3s Level 2)

**TC-2: Verify Level 3 extraction on JavaScript-heavy site**
1. Navigate to a JavaScript-heavy site (e.g., Twitter profile page)
2. Trigger article capture
3. Verify:
   - Extraction succeeds at Level 3
   - Quality indicator shows "Article captured (simplified)" in yellow
   - Scripts and ads removed from content
   - Extraction time ≤10s

**TC-3: Verify Level 4 fallback on minimal content page**
1. Navigate to a landing page with minimal text
2. Trigger article capture
3. Verify:
   - Falls back to Level 4 (smart bookmark)
   - Quality indicator shows "Saved as bookmark - extraction failed" in orange
   - Enhanced metadata captured (Open Graph, etc.)
   - "Retry extraction" button shown in notification

**TC-4: Verify manual retry functionality**
1. Trigger failed extraction (Level 4)
2. Click "Retry extraction" button in notification
3. Verify:
   - Full fallback chain runs again
   - Retry count incremented
   - New notification shown with result
4. Retry 3 times, verify:
   - After 3rd retry, "Maximum retry attempts reached" message shown
   - Retry button disabled

**TC-5: Verify PRD AC9 - Fallback chain on SPA**
1. Navigate to SPA/dynamic page (e.g., Gmail, Google Docs)
2. Trigger article capture
3. Verify:
   - Fallback extraction or smart bookmark created
   - No crashes or errors
   - Quality indicator shows appropriate level
   - Content captured (even if simplified)

**TC-6: Verify extraction quality stored in Anytype**
1. Capture articles at different levels (Level 1, 2, 3, 4)
2. Open each object in Anytype
3. Verify properties include:
   - `extractionLevel`: 1, 2, 3, or 4
   - `extractionQuality`: 'success', 'partial', or 'fallback'
   - `extractionTime`: milliseconds
   - `extractionFailed`: true (for Level 4 only)

---

## AC Verification Mapping

| AC | Verification Method |
|----|---------------------|
| AC-1: Fallback chain executes in order | Unit test: `fallback-extractor.test.ts` (test case 9) |
| AC-2: Level 2 extracts from article tag | Unit test: `fallback-extractor.test.ts` (test case 1) |
| AC-3: Level 2 uses text density | Unit test: `fallback-extractor.test.ts` (test case 2) |
| AC-4: Level 3 removes scripts and styles | Unit test: `fallback-extractor.test.ts` (test cases 4-5) |
| AC-5: Level 4 creates smart bookmark | Unit test: `fallback-extractor.test.ts` (test case 7) |
| AC-6: Quality indicator shows correct level | Integration test: `fallback-extraction.test.ts` (test case 4) |
| AC-7: Manual retry option available | Manual test: TC-4 |
| AC-8: Manual retry runs full chain | Manual test: TC-4 |
| AC-9: Fallback chain completes within 10s | Integration test: `fallback-extraction.test.ts` (test case 5) |
| AC-10: 95% capture success rate | Manual test: Test corpus (100 pages) |
| AC-11: Extraction quality stored in Anytype | Manual test: TC-6 |

---

## Rollout and Migration Notes

- No data migration required (new feature)
- No breaking changes to existing capture flows
- Articles captured before this epic will remain as-is
- Articles captured after this epic will use fallback chain
- Monitor extraction performance and success rates
- Collect user feedback on quality indicators

---

## Observability and Debugging

### What can be logged

- Extraction level attempted (1, 2, 3, 4)
- Extraction level succeeded
- Extraction time per level
- Total extraction time
- Quality indicator shown to user
- Retry count per URL
- Text density calculations (Level 2)
- Word count at each level
- Sanitized error messages

### What must never be logged

- Full article content (privacy)
- User API keys (security)
- Personal data from page (privacy)
- Unsanitized error messages with stack traces (security)
- User's browsing history (privacy)

### Debug information

- Add `DEBUG_FALLBACK_EXTRACTION` flag for verbose logging
- Log extraction steps: Level 1 → Level 2 → Level 3 → Level 4
- Log DOM analysis results (text density, word counts)
- Log timeout events and aborted levels
- Export extraction result as JSON for debugging (options page)
