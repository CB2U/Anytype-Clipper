# Specification: Markdown Conversion

## Header

- **Title:** Epic 4.1: Markdown Conversion
- **Roadmap anchor reference:** [roadmap.md 4.1](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L431-L455)
- **Priority:** P0
- **Type:** Feature
- **Target area:** Article Extraction / Content Processing
- **Target Acceptance Criteria:** FR5.2, FR5.3, FR5.4, AC4, AC16

---

## Problem Statement

Users need article content saved to Anytype in Markdown format for readability, editability, and compatibility with Anytype's Markdown-based editor. Currently, Epic 4.0 (Readability Integration) extracts article content as HTML, but Anytype works best with Markdown.

HTML content is difficult to edit in Anytype and doesn't render properly in the Markdown editor. Converting extracted HTML to clean, well-formatted Markdown ensures articles are readable, editable, and properly structured in Anytype.

---

## Goals and Non-Goals

### Goals

- Convert extracted HTML to Markdown using Turndown library
- Preserve semantic structure: headings (h1-h6), lists, code blocks, blockquotes, links
- Detect and preserve code block language hints for syntax highlighting
- Handle nested structures correctly (lists within lists, quotes within quotes)
- Complete conversion within 2 seconds for typical articles
- Produce clean, readable Markdown that renders correctly in Anytype

### Non-Goals

- Table conversion (covered in Epic 4.4: Table Preservation)
- Image handling and embedding (covered in Epic 4.3: Image Handling)
- Custom Markdown extensions or non-standard syntax (post-MVP)
- Markdown validation or linting (post-MVP)
- Support for complex HTML structures like forms or interactive elements

---

## User Stories

### Primary User Story (US1)

**As a** researcher building a knowledge base in Anytype,  
**I want to** save articles with proper Markdown formatting,  
**So that** I can read and edit them easily in Anytype without losing structure or formatting.

**Acceptance:**
- Articles saved with Markdown formatting
- Headings, lists, quotes, and links preserved
- Code blocks include language hints for syntax highlighting
- Content is readable and editable in Anytype
- Conversion completes within 2 seconds

---

## Scope

### In-Scope

- Turndown library integration (via npm package `turndown`)
- Convert HTML to Markdown after Readability extraction
- Preserve semantic structure:
  - Headings (h1-h6) → Markdown headings (#, ##, ###, etc.)
  - Paragraphs → Markdown paragraphs (double newline)
  - Ordered lists (ol/li) → Markdown numbered lists (1., 2., 3.)
  - Unordered lists (ul/li) → Markdown bullet lists (-, *, +)
  - Blockquotes → Markdown blockquotes (>)
  - Links (a href) → Markdown links ([text](url))
  - Emphasis (strong, em, b, i) → Markdown emphasis (**, *, _)
- Code block handling:
  - Detect code blocks (pre/code tags)
  - Preserve language hints from class attributes (e.g., `class="language-javascript"`)
  - Convert to fenced code blocks with language identifier (```javascript)
- Nested structure handling:
  - Lists within lists (indentation)
  - Blockquotes within blockquotes (nested >)
  - Mixed content (lists in quotes, etc.)
- Performance monitoring (conversion time)
- Error handling and logging

### Out-of-Scope

- Table conversion (Epic 4.4)
- Image processing (Epic 4.3)
- Custom Turndown rules for non-standard HTML (post-MVP)
- Markdown beautification or formatting preferences (post-MVP)
- GFM (GitHub Flavored Markdown) extensions like task lists (post-MVP)
- HTML sanitization (handled by Readability in Epic 4.0)

---

## Requirements

### Functional Requirements

#### FR-1: Library Integration
Integrate Turndown library into the extension build pipeline and make it available to content scripts.

**Rationale:** Turndown is the industry-standard library for HTML-to-Markdown conversion, widely used and well-maintained.

#### FR-2: HTML to Markdown Conversion
Convert extracted HTML from Readability to Markdown using Turndown's `turndown()` method.

**Details:**
- Accept HTML string from Readability extraction result
- Pass HTML to Turndown instance
- Return Markdown string
- Handle empty or null input gracefully

#### FR-3: Heading Preservation
Preserve heading hierarchy (h1-h6) as Markdown headings (#, ##, ###, etc.).

**Rationale:** Headings provide document structure and navigation in Anytype.

#### FR-4: List Preservation
Preserve ordered and unordered lists with proper nesting.

**Details:**
- Ordered lists (ol/li) → Markdown numbered lists (1., 2., 3.)
- Unordered lists (ul/li) → Markdown bullet lists (-)
- Nested lists → Indented Markdown lists (2 spaces per level)
- Mixed list types handled correctly

#### FR-5: Code Block Handling
Detect and preserve code blocks with language hints for syntax highlighting.

**Details:**
- Detect code blocks from `<pre><code>` tags
- Extract language from class attribute (e.g., `class="language-javascript"`)
- Convert to fenced code blocks with language identifier (```javascript)
- Handle inline code (`<code>` without `<pre>`) → Markdown backticks (`)
- Preserve code content exactly (no formatting changes)

**Rationale:** Code blocks with language hints enable syntax highlighting in Anytype.

#### FR-6: Blockquote Preservation
Preserve blockquotes with proper nesting.

**Details:**
- Single blockquotes → Markdown blockquotes (>)
- Nested blockquotes → Multiple > symbols (>>)
- Preserve content within blockquotes (paragraphs, lists, etc.)

#### FR-7: Link Preservation
Preserve hyperlinks with text and URL.

**Details:**
- Convert `<a href="url">text</a>` to `[text](url)`
- Handle relative URLs (preserve as-is)
- Handle anchor links (preserve #fragment)
- Handle mailto: and tel: links

#### FR-8: Emphasis Preservation
Preserve text emphasis (bold, italic).

**Details:**
- Strong/bold (`<strong>`, `<b>`) → Markdown bold (**)
- Emphasis/italic (`<em>`, `<i>`) → Markdown italic (*)
- Combined emphasis → Markdown combined (***text***)

#### FR-9: Nested Structure Handling
Handle nested HTML structures correctly.

**Details:**
- Lists within blockquotes
- Blockquotes within lists
- Code blocks within lists
- Multiple levels of nesting

**Rationale:** Real-world articles often have complex nested structures.

#### FR-10: Performance Monitoring
Track and log conversion time to ensure it completes within 2 seconds.

**Rationale:** Slow conversion degrades user experience.

### Non-Functional Requirements

#### NFR-1: Performance
Markdown conversion must complete within 2 seconds for typical articles (500-5000 words).

**Measurement:** Log conversion start/end time, fail if >2s.

#### NFR-2: Reliability
Handle conversion failures gracefully:
- Return error object on failure
- Log sanitized error messages
- Fall back to plain text if conversion fails

#### NFR-3: Memory Efficiency
Limit memory usage during conversion:
- Process HTML in single pass
- Clean up intermediate objects after conversion
- Limit maximum article size to 5MB (inherited from Epic 4.0)

#### NFR-4: Compatibility
Produce Markdown compatible with Anytype's Markdown renderer:
- Standard Markdown syntax
- Fenced code blocks (```)
- No custom extensions

#### NFR-5: Privacy
Conversion happens entirely client-side:
- No external API calls
- No telemetry
- No content sent to third parties

### Constraints

From constitution.md:

#### Security Constraints
- **SEC-4:** Sanitized error messages (no sensitive data in logs)
- **SEC-6:** Input validation required (validate HTML before processing)

#### Performance Constraints
- **PERF-2:** Article extraction <5s (total pipeline including conversion)
- Conversion itself must be <2s to leave time for other processing

#### Reliability Constraints
- **REL-6:** Clear error messages with next steps
- **REL-8:** Graceful degradation (fallback to plain text if conversion fails)

---

## Acceptance Criteria

### AC-1: Turndown Library Integrated
**Given** the extension is built,  
**When** I inspect the content script bundle,  
**Then** the Turndown library is included and functional.

**Verification approach:** Check build output, verify Turndown class is available in content script.

---

### AC-2: HTML Converts to Markdown
**Given** extracted HTML from Readability,  
**When** I run Markdown conversion,  
**Then** it returns valid Markdown text.

**Verification approach:** Unit test with sample HTML, verify Markdown output is valid.

---

### AC-3: Headings Preserved
**Given** HTML with heading tags (h1-h6),  
**When** conversion runs,  
**Then** Markdown output contains corresponding heading syntax (#, ##, ###, etc.).

**Verification approach:** Test with HTML containing all heading levels, verify Markdown output.

---

### AC-4: Lists Preserved
**Given** HTML with ordered and unordered lists,  
**When** conversion runs,  
**Then** Markdown output contains properly formatted lists with correct nesting.

**Verification approach:** Test with nested lists, verify indentation and numbering correct.

---

### AC-5: Code Blocks with Language Hints
**Given** HTML with code blocks containing language class attributes,  
**When** conversion runs,  
**Then** Markdown output contains fenced code blocks with language identifiers.

**Verification approach:** Test with `<pre><code class="language-javascript">`, verify output is ```javascript.

---

### AC-6: Blockquotes Preserved
**Given** HTML with blockquote tags,  
**When** conversion runs,  
**Then** Markdown output contains blockquotes with > syntax.

**Verification approach:** Test with nested blockquotes, verify multiple > symbols.

---

### AC-7: Links Preserved
**Given** HTML with anchor tags,  
**When** conversion runs,  
**Then** Markdown output contains links in [text](url) format.

**Verification approach:** Test with various link types (http, https, relative, anchor).

---

### AC-8: Emphasis Preserved
**Given** HTML with bold and italic tags,  
**When** conversion runs,  
**Then** Markdown output contains ** and * syntax.

**Verification approach:** Test with strong, em, b, i tags, verify Markdown emphasis.

---

### AC-9: Nested Structures Handled
**Given** HTML with nested structures (lists in quotes, etc.),  
**When** conversion runs,  
**Then** Markdown output preserves nesting correctly.

**Verification approach:** Test with complex nested HTML, verify Markdown structure.

---

### AC-10: Conversion Completes Within 2 Seconds
**Given** a typical article (500-5000 words),  
**When** Markdown conversion runs,  
**Then** it completes within 2 seconds.

**Verification approach:** Log conversion time, verify <2s for 95% of test cases.

---

### AC-11: Article Renders Correctly in Anytype (AC4 from PRD)
**Given** an article saved to Anytype with Markdown formatting,  
**When** I view it in Anytype,  
**Then** headings, lists, quotes, and links render correctly.

**Verification approach:** Manual test - clip article, verify rendering in Anytype.

---

### AC-12: Code Blocks Preserve Language Detection (AC16 from PRD)
**Given** an article with code blocks,  
**When** saved to Anytype,  
**Then** language is specified in Markdown and syntax highlighting works.

**Verification approach:** Manual test - clip article with code, verify language in Anytype.

---

## Dependencies

### Epic Dependencies

- **Epic 4.0 (Readability Integration):** Completed - provides extracted HTML content
- **Epic 1.1 (API Client Foundation):** Completed - provides API client for creating objects

### Technical Dependencies

- **Turndown library:** `turndown` npm package (v7.0.0+)
- **Readability output:** HTML content from Epic 4.0
- **Content script infrastructure:** Ability to run conversion in content script context
- **Build pipeline:** Webpack/Vite must bundle Turndown into content script

### Blocked By

- **Epic 4.0 (Readability Integration):** Must be completed to provide HTML input

### Blocks

- **Epic 4.2 (Fallback Extraction Chain):** Needs Markdown conversion for all extraction levels
- **Epic 4.3 (Image Handling):** Will integrate with Markdown conversion for image embedding
- **Epic 4.4 (Table Preservation):** Will integrate with Markdown conversion for table handling

---

## Risks and Mitigations

### Risk 1: Turndown Produces Invalid Markdown for Complex HTML
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:** 
- Test with diverse HTML samples during development
- Implement custom Turndown rules for edge cases
- Fall back to plain text if conversion produces invalid Markdown

### Risk 2: Conversion Takes >2 Seconds on Large Articles
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Set timeout at 2s, abort if exceeded
- Warn user if article is very large (>10,000 words)
- Consider streaming conversion for large articles (post-MVP)

### Risk 3: Turndown Library Size Increases Bundle Size
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- Turndown is ~20KB minified, acceptable for content script
- Use tree-shaking to minimize bundle size
- Monitor bundle size in CI

### Risk 4: Language Detection Fails for Code Blocks
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- Implement fallback language detection from code content patterns
- Default to no language identifier if detection fails
- Document supported language class formats

---

## Open Questions

None at this time. All requirements are clear from PRD and roadmap.

---

## EVIDENCE

### Unit Tests
- `tests/unit/markdown-converter.test.ts`: 15/15 tests passing. Coverage: 100%.
- `tests/unit/article-extractor.test.ts`: Updated to verify markdown field. 5/5 tests passing.
- Test logs: `npm test` passed.

### Integration Tests
- `tests/integration/article-capture.test.ts`: Verified conversion logic against real browser DOM serialization. 2/2 tests passing.
- Verified that `content-script` bundle includes `turndown`.

### Verification Artifacts
- **Test Corpus**: [CSV Table](../../docs/testing/markdown-conversion-test-corpus.csv)
- **Performance**: [CSV Table](../../docs/testing/markdown-conversion-performance.csv)

### Implementation Details
- Added `turndown` v7.2.2.
- Created `MarkdownConverter` service with:
  - Custom rule for fenced code blocks (AC16).
  - 2-second timeout protection.
  - Fallback to plain text on failure.
- Updated `ArticleExtractor` to utilize markdown in `Anytype` objects.
- Updated Service Worker to provide correct notifications.
- Updated README and project tracking documentation.

