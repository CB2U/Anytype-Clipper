# Implementation Plan: Markdown Conversion

## Goal Description

Integrate Turndown library into the Anytype Clipper Extension to convert extracted HTML content from Readability into clean, well-formatted Markdown. This epic extends the article extraction pipeline (BP3: Article Extraction) by adding Markdown conversion as the second step after Readability extraction.

This conversion is essential for Anytype compatibility, as Anytype uses a Markdown-based editor. Converting HTML to Markdown ensures articles are readable, editable, and properly structured in Anytype.

---

## User Review Required

> [!IMPORTANT]
> **Build Pipeline Modification**
> This epic requires adding the `turndown` npm package (~20KB minified) to the content script bundle. This will increase the content script size slightly. The library is essential for HTML-to-Markdown conversion and is widely used in the industry.

> [!IMPORTANT]
> **Integration with Epic 4.0**
> This epic depends on Epic 4.0 (Readability Integration) being completed. The Markdown converter will receive HTML content from the Readability extraction result and convert it to Markdown before saving to Anytype.

---

## Proposed Changes

### Component: Markdown Conversion Library

This component adds the Turndown library and creates a wrapper service for HTML-to-Markdown conversion.

#### [MODIFY] [package.json](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/package.json)

Add `turndown` dependency:

```json
{
  "dependencies": {
    "turndown": "^7.0.0"
  }
}
```

**Rationale:** Use the official Turndown package for HTML-to-Markdown conversion.

---

#### [NEW] [markdown-converter.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/converters/markdown-converter.ts)

Create a new service that wraps Turndown and provides HTML-to-Markdown conversion functionality.

**Key responsibilities:**
- Initialize Turndown with appropriate options
- Configure custom rules for code block language detection
- Convert HTML string to Markdown
- Handle conversion failures gracefully
- Track conversion time for performance monitoring
- Preserve semantic structure (headings, lists, quotes, links, code blocks)

**Interface:**
```typescript
interface MarkdownConversionResult {
  success: boolean;
  markdown: string | null;
  metadata: {
    conversionTime: number; // milliseconds
    characterCount: number;
  };
  error?: string;
}

function convertToMarkdown(html: string): MarkdownConversionResult;
```

**Turndown Configuration:**
```typescript
const turndownService = new TurndownService({
  headingStyle: 'atx',        // Use # for headings
  hr: '---',                   // Horizontal rule
  bulletListMarker: '-',       // Use - for bullet lists
  codeBlockStyle: 'fenced',    // Use ``` for code blocks
  fence: '```',                // Fence marker
  emDelimiter: '*',            // Use * for emphasis
  strongDelimiter: '**',       // Use ** for strong
  linkStyle: 'inlined',        // Use [text](url) for links
  linkReferenceStyle: 'full',  // Full reference links
});
```

**Custom Rules:**
- **Code block language detection:** Extract language from `class="language-*"` attributes
- **Preserve line breaks:** Handle `<br>` tags appropriately
- **Handle nested lists:** Ensure proper indentation

**Error handling:**
- Catch and log any Turndown errors
- Return structured error object with sanitized message
- Fall back to plain text if conversion fails
- Never expose sensitive data in error messages (SEC-4)

**Performance:**
- Set 2-second timeout for conversion
- Log conversion start/end time
- Abort if timeout exceeded

---

### Component: Article Extractor Integration

This component integrates Markdown conversion into the article extraction flow.

#### [MODIFY] [article-extractor.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/extractors/article-extractor.ts)

Update the article extractor to convert HTML to Markdown after Readability extraction.

**Changes:**
- Import `convertToMarkdown` from `markdown-converter.ts`
- After successful Readability extraction, convert `article.content` (HTML) to Markdown
- Store both HTML and Markdown in the result (for fallback purposes)
- Update `ArticleExtractionResult` interface to include `markdown` field
- Handle conversion failures gracefully (use HTML or plain text as fallback)

**Updated Interface:**
```typescript
interface ArticleExtractionResult {
  success: boolean;
  quality: 'success' | 'partial' | 'failure';
  article: {
    title: string;
    byline: string | null;
    excerpt: string | null;
    content: string;      // HTML (original from Readability)
    markdown: string;     // Markdown (converted)
    textContent: string;  // Plain text (fallback)
    length: number;
    dir: string;
  } | null;
  metadata: {
    extractionTime: number;
    conversionTime: number;  // NEW: Markdown conversion time
    wordCount: number;
  };
  error?: string;
}
```

**Conversion Flow:**
1. Readability extracts HTML content
2. Pass HTML to `convertToMarkdown()`
3. If conversion succeeds, use Markdown for Anytype object
4. If conversion fails, fall back to plain text
5. Log conversion time for performance monitoring

---

### Component: Service Worker Integration

This component updates the service worker to use Markdown content when creating Anytype objects.

#### [MODIFY] [service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Update article capture flow to use Markdown content.

**Changes:**
- When creating Anytype article object, use `article.markdown` instead of `article.textContent`
- Update notification messages to indicate Markdown formatting
- Handle cases where Markdown conversion failed (use fallback)

**Quality feedback messages:**
- Success: "Article captured with Markdown formatting (X words)"
- Partial: "Article captured (simplified Markdown)"
- Fallback: "Article captured as plain text (Markdown conversion failed)"

---

### Component: Type Definitions

#### [MODIFY] [article.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/types/article.ts)

Update TypeScript type definitions to include Markdown field.

**Changes:**
- Add `markdown: string` field to article interface
- Add `conversionTime: number` to metadata interface
- Update JSDoc comments

---

### Component: Build Configuration

#### [MODIFY] [vite.config.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/vite.config.ts)

Ensure Turndown library is bundled into the content script.

**Changes:**
- Verify content script bundle includes `turndown`
- Enable tree-shaking to minimize bundle size
- Monitor bundle size (should be ~20KB increase)

---

## Verification Plan

### Automated Tests

#### Unit Tests

**Test file:** `tests/unit/markdown-converter.test.ts` (NEW)

**Test cases:**
1. **Successful conversion:** HTML with headings, lists, quotes → verify Markdown output
2. **Heading preservation:** HTML with h1-h6 → verify # syntax
3. **List preservation:** HTML with ol/ul → verify numbered/bullet lists
4. **Code block with language:** HTML with `<pre><code class="language-js">` → verify ```js
5. **Blockquote preservation:** HTML with blockquote → verify > syntax
6. **Link preservation:** HTML with anchor tags → verify [text](url)
7. **Emphasis preservation:** HTML with strong/em → verify **/\* syntax
8. **Nested structures:** HTML with nested lists/quotes → verify correct nesting
9. **Empty input:** Empty HTML → verify graceful handling
10. **Conversion failure:** Invalid HTML → verify error handling
11. **Performance timeout:** Mock slow conversion → verify timeout at 2 seconds

**Run command:**
```bash
npm test -- markdown-converter.test.ts
```

**Expected coverage:** >80% for markdown-converter.ts

---

**Test file:** `tests/unit/article-extractor.test.ts` (MODIFY)

**New test cases to add:**
1. **Markdown field populated:** Verify extraction result includes `markdown` field
2. **Markdown conversion success:** Verify HTML converted to Markdown
3. **Markdown conversion failure:** Verify fallback to plain text
4. **Conversion time tracked:** Verify `conversionTime` in metadata

**Run command:**
```bash
npm test -- article-extractor.test.ts
```

---

#### Integration Tests

**Test file:** `tests/integration/article-capture.test.ts` (MODIFY)

**New test cases to add:**
1. **End-to-end Markdown conversion:** Load article page, extract, verify Markdown in result
2. **Anytype object creation:** Verify article saved with Markdown content (not HTML)
3. **Code block language detection:** Extract article with code, verify language in Markdown

**Run command:**
```bash
npm run test:integration -- article-capture.test.ts
```

---

### Manual Verification

#### Test Corpus

Use the same test corpus from Epic 4.0 (50 diverse web pages) and verify Markdown conversion:

**Verification steps:**
1. Load extension in browser
2. Navigate to each test page
3. Trigger article capture
4. Verify Markdown conversion:
   - ✅ Success: HTML converted to Markdown, structure preserved
   - ⚠️ Partial: Some structure lost but readable
   - ❌ Failure: Conversion failed, plain text used
5. Record success rate (target: 95%+)

**Success criteria:**
- At least 47/50 pages convert successfully to Markdown
- Conversion completes within 2 seconds for 95% of pages
- No crashes or errors on any page

---

#### Manual Test Cases

**TC-1: Extract article with headings and lists**
1. Navigate to https://developer.mozilla.org/en-US/docs/Web/JavaScript (any article)
2. Right-click → "Clip article to Anytype"
3. Verify in Anytype:
   - Headings rendered correctly (h1, h2, h3)
   - Lists formatted properly (bullets and numbers)
   - Links clickable
   - Success notification shows "Markdown formatting"

**TC-2: Extract article with code blocks**
1. Navigate to article with code examples (e.g., Stack Overflow answer, GitHub README)
2. Trigger article capture
3. Verify in Anytype:
   - Code blocks use fenced syntax (```)
   - Language identifier present (```javascript, ```python, etc.)
   - Code content preserved exactly
   - Syntax highlighting works in Anytype

**TC-3: Extract article with blockquotes**
1. Navigate to article with quotes (e.g., blog post with pull quotes)
2. Trigger article capture
3. Verify in Anytype:
   - Blockquotes use > syntax
   - Nested quotes use >> syntax
   - Content within quotes preserved

**TC-4: Extract article with nested structures**
1. Navigate to article with complex structure (lists in quotes, quotes in lists)
2. Trigger article capture
3. Verify in Anytype:
   - Nesting preserved correctly
   - Indentation appropriate
   - Readable and editable

**TC-5: Performance test on large article**
1. Navigate to long-form article (5000+ words)
2. Trigger article capture
3. Verify:
   - Conversion completes within 2 seconds
   - Success notification shown
   - No memory issues or browser slowdown

**TC-6: Verify PRD AC4 - Markdown formatting preserved**
1. Clip article with headings, lists, quotes
2. Open in Anytype
3. Verify all formatting renders correctly
4. Edit content in Anytype, verify Markdown is editable

**TC-7: Verify PRD AC16 - Code blocks preserve language**
1. Clip article with code blocks
2. Open in Anytype
3. Verify language specified in Markdown
4. Verify syntax highlighting works

---

## Rollout and Migration Notes

- No data migration required (new feature)
- No breaking changes to existing capture flows
- Articles captured before this epic will remain as plain text
- Articles captured after this epic will use Markdown
- Monitor bundle size increase (~20KB expected)

---

## Observability and Debugging

### What can be logged

- Conversion start/end time (performance monitoring)
- Conversion success/failure status
- Character count before/after conversion
- Sanitized error messages (no sensitive data)
- Page URL (for debugging, but respect privacy mode)

### What must never be logged

- Full article content (privacy)
- User API keys (security)
- Personal data from page (privacy)
- Unsanitized error messages with stack traces (security)

### Debug information

- Add `DEBUG_MARKDOWN_CONVERSION` flag for verbose logging
- Log conversion steps: HTML input → Turndown processing → Markdown output
- Log Turndown configuration and custom rules
- Export conversion result as JSON for debugging (options page)
