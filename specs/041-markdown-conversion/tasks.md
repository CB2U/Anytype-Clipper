# Tasks: Markdown Conversion

This document provides an ordered, granular task breakdown for implementing Epic 4.1: Markdown Conversion. Each task is 30-90 minutes and includes clear completion criteria and verification steps.

---

## Setup

### T1: Install Turndown Library

**Goal:** Add Turndown as a project dependency.

**Steps:**
- [x] Run `npm install turndown --save`
- [x] Verify package added to `package.json` dependencies
- [x] Verify package-lock.json updated
- [x] Run `npm install` to ensure no conflicts

**Done when:**
- `@mozilla/readability` appears in `package.json` dependencies (Verified: turndown v7.2.2)
- `npm install` completes without errors
- Library is available for import in TypeScript files

**Verify:**
- Run `npm list turndown` to confirm version installed
- Create test file that imports TurndownService, verify no TypeScript errors

**Evidence to record:**
- Screenshot of package.json showing dependency
- Terminal output of `npm list turndown`

**Files touched:**
- `package.json`
- `package-lock.json`

---

### T2: Create Type Definitions

**Goal:** Update TypeScript type definitions for Markdown conversion.

**Steps:**
- [x] Open `src/types/article.ts`
- [x] Add `markdown: string` field to article interface
- [x] Add `conversionTime: number` to metadata interface
- [x] Create `MarkdownConversionResult` interface
- [x] Add JSDoc comments for all new types

**Done when:**
- Type file updated with Markdown-related fields
- No TypeScript errors when importing types
- All types have JSDoc documentation

**Verify:**
- Run `npm run type-check` (or `tsc --noEmit`)
- Import types in test file, verify autocomplete works

**Evidence to record:**
- Screenshot of updated type definitions
- TypeScript compilation success output (with expected error in consumer)

**Files touched:**
- `src/types/article.ts` (MODIFY)

---

## Core Implementation

### T3: Implement Markdown Converter Service

**Goal:** Create the core Markdown conversion service using Turndown.

**Steps:**
- [x] Create `src/lib/converters/markdown-converter.ts`
- [x] Import TurndownService from `turndown`
- [x] Configure TurndownService with appropriate options:
   - `headingStyle: 'atx'` (use # for headings)
   - `codeBlockStyle: 'fenced'` (use ``` for code blocks)
   - `bulletListMarker: '-'` (use - for bullets)
   - `emDelimiter: '*'` and `strongDelimiter: '**'`
- [x] Implement custom rule for code block language detection:
   - Extract language from `class="language-*"` attributes
   - Apply to fenced code blocks
- [x] Implement `convertToMarkdown(html: string)` function:
   - Validate input (non-empty string)
   - Call `turndownService.turndown(html)`
   - Track conversion time using `performance.now()`
   - Return structured result with markdown, metadata, and any errors
- [x] Implement error handling:
   - Try-catch around Turndown operations
   - Return structured error object
   - Sanitize error messages (no stack traces)
- [x] Implement 2-second timeout:
   - Use `Promise.race()` with timeout promise
   - Abort conversion if timeout exceeded

**Done when:**
- `convertToMarkdown()` function implemented and exported
- All error cases handled gracefully
- Timeout mechanism works
- Custom rules applied correctly
- TypeScript types match interface

**Verify:**
- Create test HTML string, call `convertToMarkdown()`, verify Markdown output
- Test with empty input, verify graceful handling
- Test with code block HTML, verify language detection
- Test timeout with mock slow conversion

**Evidence to record:**
- Code snippet of convertToMarkdown function
- Test output showing successful conversion
- Test output showing language detection

**Files touched:**
- `src/lib/converters/markdown-converter.ts` (NEW)

---

### T4: Integrate with Article Extractor

**Goal:** Add Markdown conversion to article extraction flow.

**Steps:**
- [x] Open `src/lib/extractors/article-extractor.ts`
- [x] Import `convertToMarkdown` from `markdown-converter.ts`
- [x] Update `ArticleExtractionResult` interface to include `markdown` field (Already done in T2)
- [x] Update `extractArticle()` function:
   - After successful Readability extraction, convert `article.content` (HTML) to Markdown
   - Store Markdown in result: `article.markdown = conversionResult.markdown`
   - Add conversion time to metadata: `metadata.conversionTime = conversionResult.metadata.conversionTime`
   - Handle conversion failures: if conversion fails, use `article.textContent` as fallback
- [x] Add error handling for conversion failures
- [x] Update quality determination to consider conversion success

**Done when:**
- Article extractor calls Markdown converter after Readability
- Extraction result includes `markdown` field
- Conversion time tracked in metadata
- Failures handled gracefully with fallback

**Verify:**
- Extract article, verify result includes `markdown` field
- Verify Markdown content is valid
- Test with HTML that fails conversion, verify fallback to plain text

**Evidence to record:**
- Screenshot of extraction result with Markdown field
- Console output showing conversion time

**Files touched:**
- `src/lib/extractors/article-extractor.ts` (MODIFY)
- `src/types/article.ts` (MODIFY)

---

### T5: Update Service Worker to Use Markdown

**Goal:** Update service worker to save Markdown content to Anytype.

**Steps:**
- [/] Open `src/background/service-worker.ts`
- [ ] Find article capture handler (where Anytype object is created)
- [ ] Update to use `article.markdown` instead of `article.textContent` when creating object
- [ ] Update notification messages:
   - Success: "Article captured with Markdown formatting (X words)"
   - Partial: "Article captured (simplified Markdown)"
   - Fallback: "Article captured as plain text (Markdown conversion failed)"
- [ ] Handle cases where Markdown conversion failed (use fallback)

**Done when:**
- Service worker uses Markdown content for Anytype objects
- Notification messages updated
- Fallback logic implemented

**Verify:**
- Trigger article capture, verify Anytype object created with Markdown
- Check notification shows "Markdown formatting"
- Test with conversion failure, verify fallback to plain text

**Evidence to record:**
- Screenshot of success notification
- Screenshot of Anytype object with Markdown content

**Files touched:**
- `src/background/service-worker.ts` (MODIFY)

---

### T6: Update Build Configuration

**Goal:** Ensure Turndown library is bundled into content script.

**Steps:**
- [ ] Open `vite.config.ts`
- [ ] Verify content script bundle configuration includes `turndown`
- [ ] Enable tree-shaking to minimize bundle size
- [ ] Build extension and verify bundle size increase (~20KB expected)

**Done when:**
- Build completes successfully
- Content script bundle includes Turndown
- Bundle size increase is acceptable (~20KB)
- No build warnings or errors

**Verify:**
- Run `npm run build`
- Check dist/content-script.js size
- Verify Turndown code present in bundle (search for "TurndownService" in minified file)

**Evidence to record:**
- Build output showing bundle sizes
- Screenshot of dist/ directory with file sizes

**Files touched:**
- `vite.config.ts` (MODIFY if needed)

---

## Tests

### T7: Write Unit Tests for Markdown Converter

**Goal:** Create comprehensive unit tests for Markdown conversion logic.

**Steps:**
- [x] Create `tests/unit/markdown-converter.test.ts`
- [x] Set up test fixtures:
   - HTML with headings (h1-h6)
   - HTML with lists (ol, ul, nested)
   - HTML with code blocks (with and without language class)
   - HTML with blockquotes (single and nested)
   - HTML with links
   - HTML with emphasis (strong, em, b, i)
   - HTML with nested structures
- [x] Write test cases:
   - **Test 1:** Successful conversion returns Markdown
   - **Test 2:** Headings converted to # syntax
   - **Test 3:** Ordered lists converted to numbered lists
   - **Test 4:** Unordered lists converted to bullet lists
   - **Test 5:** Nested lists indented correctly
   - **Test 6:** Code blocks with language class → fenced blocks with language
   - **Test 7:** Code blocks without language class → fenced blocks without language
   - **Test 8:** Blockquotes converted to > syntax
   - **Test 9:** Nested blockquotes use >> syntax
   - **Test 10:** Links converted to [text](url) format
   - **Test 11:** Strong/bold converted to ** syntax
   - **Test 12:** Em/italic converted to * syntax
   - **Test 13:** Nested structures preserved correctly
   - **Test 14:** Empty input handled gracefully
   - **Test 15:** Conversion time tracked
- [x] Run tests and verify all pass

**Done when:**
- All 15 test cases written and passing
- Code coverage >80% for markdown-converter.ts
- No flaky tests

**Verify:**
- Run `npm test -- markdown-converter.test.ts`
- Check coverage report: `npm run test:coverage`

**Evidence to record:**
- Test output showing all tests passing
- Coverage report screenshot

**Files touched:**
- `tests/unit/markdown-converter.test.ts` (NEW)

---

### T8: Update Article Extractor Unit Tests

**Goal:** Update existing article extractor tests to verify Markdown conversion.

**Steps:**
- [x] Open `tests/unit/article-extractor.test.ts`
- [x] Add new test cases:
   - **Test 1:** Extraction result includes `markdown` field
   - **Test 2:** Markdown content is valid (not empty, not same as HTML)
   - **Test 3:** Conversion time tracked in metadata
   - **Test 4:** Conversion failure falls back to plain text
- [x] Run tests and verify all pass

**Done when:**
- All new test cases written and passing
- Existing tests still pass
- Code coverage maintained >80%

**Verify:**
- Run `npm test -- article-extractor.test.ts`
- Check coverage report

**Evidence to record:**
- Test output showing all tests passing

**Files touched:**
- `tests/unit/article-extractor.test.ts` (MODIFY)

---

### T9: Update Integration Tests

**Goal:** Update integration tests to verify end-to-end Markdown conversion.

**Steps:**
- [ ] Open `tests/integration/article-capture.test.ts`
- [ ] Add new test cases:
   - **Test 1:** Extract article, verify Markdown field populated
   - **Test 2:** Verify Anytype object created with Markdown content (not HTML)
   - **Test 3:** Extract article with code blocks, verify language in Markdown
- [ ] Run tests and verify all pass

**Done when:**
- All new test cases written and passing
- Existing integration tests still pass
- Tests run successfully in CI

**Verify:**
- Run `npm run test:integration -- article-capture.test.ts`
- Verify tests pass in CI

**Evidence to record:**
- Integration test output
- Screenshot of test browser showing Markdown conversion

**Files touched:**
- `tests/integration/article-capture.test.ts` (MODIFY)

---

## Verification

### T10: Manual Testing on Test Corpus

**Goal:** Verify Markdown conversion works on diverse real-world pages.

**Steps:**
1. Use the same test corpus from Epic 4.0 (50 diverse URLs)
2. For each URL:
   - Load page in browser with extension
   - Trigger article capture
   - Open saved article in Anytype
   - Verify Markdown formatting:
     - Headings rendered correctly
     - Lists formatted properly
     - Links clickable
     - Code blocks with syntax highlighting (if applicable)
     - Blockquotes styled correctly
   - Record result: Success / Partial / Failure
   - Record conversion time
   - Note any formatting issues
3. Calculate success rate (target: 95%+)
4. Document failures for investigation

**Done when:**
- All 50 pages tested
- Success rate ≥95% (47+ successes)
- Conversion time <2s for 95% of pages
- Results documented in spreadsheet

**Verify:**
- Review test corpus spreadsheet
- Verify success rate meets target
- Verify performance meets target

**Evidence to record:**
- Test corpus spreadsheet with Markdown conversion results
- Screenshots of successful Markdown rendering in Anytype
- Screenshots of any formatting issues

**Files touched:**
- `docs/testing/markdown-conversion-test-corpus.csv` (NEW)

---

### T11: Verify PRD Acceptance Criteria

**Goal:** Manually verify PRD acceptance criteria AC4 and AC16.

**Steps:**

**AC4: User can clip full article with Markdown formatting preserved**
1. Navigate to article with headings, lists, quotes, links
2. Trigger article capture
3. Open in Anytype
4. Verify:
   - Headings rendered correctly (h1, h2, h3)
   - Lists formatted properly (bullets and numbers)
   - Blockquotes styled correctly
   - Links clickable
   - Content is editable in Anytype
5. Edit content in Anytype, verify Markdown is editable
6. Document result with screenshots

**AC16: Code blocks in articles preserve language detection**
1. Navigate to article with code blocks (e.g., Stack Overflow, GitHub README)
2. Trigger article capture
3. Open in Anytype
4. Verify:
   - Code blocks use fenced syntax (```)
   - Language identifier present (```javascript, ```python, etc.)
   - Syntax highlighting works in Anytype
   - Code content preserved exactly
5. Document result with screenshots

**Done when:**
- AC4 verified and documented
- AC16 verified and documented
- Screenshots captured for evidence

**Verify:**
- Review screenshots
- Verify both ACs pass

**Evidence to record:**
- Screenshots of AC4 verification (article with formatting in Anytype)
- Screenshots of AC16 verification (code blocks with syntax highlighting)

**Files touched:**
- None (manual testing)

---

### T12: Performance Verification

**Goal:** Verify conversion performance meets requirements.

**Steps:**
1. Select 20 articles of varying sizes:
   - 5 short (500-1000 words)
   - 10 medium (1000-5000 words)
   - 5 long (5000+ words)
2. For each article:
   - Trigger extraction and conversion
   - Record conversion time (from logs)
   - Verify <2s for typical articles
   - Note any timeouts
3. Calculate performance metrics:
   - Average conversion time
   - 95th percentile conversion time
   - Timeout rate

**Done when:**
- All 20 articles tested
- 95% complete within 2 seconds
- Performance metrics documented

**Verify:**
- Review performance data
- Verify meets conversion performance requirement (<2s)

**Evidence to record:**
- Performance test results spreadsheet
- Chart showing conversion time distribution

**Files touched:**
- `docs/testing/markdown-conversion-performance.csv` (NEW)

---

## Docs

### T13: Update README

**Goal:** Document Markdown conversion feature in README.

**Steps:**
1. Open `README.md`
2. Update "Article Extraction" section:
   - Add note about Markdown conversion
   - Explain that articles are saved with Markdown formatting
   - List supported Markdown elements (headings, lists, code blocks, quotes, links)
3. Add troubleshooting note:
   - What to do if Markdown formatting is incorrect
   - Fallback to plain text explanation

**Done when:**
- README updated with Markdown conversion documentation
- Information clear and accurate

**Verify:**
- Read README, verify instructions are clear
- Verify information matches implementation

**Evidence to record:**
- Screenshot of updated README section

**Files touched:**
- `README.md` (MODIFY)

---

## Tracking

### T14: Update SPECS.md

**Goal:** Update specification index to reflect Epic 4.1 status.

**Steps:**
1. Open `SPECS.md`
2. Find Epic 4.1 row in BP3 table
3. Update Status to "In Progress" (will be updated to "Done" after T16)
4. Update Next Task to "T1"
5. Update Last Updated timestamp

**Done when:**
- SPECS.md reflects Epic 4.1 status
- Next task pointer correct

**Verify:**
- Open SPECS.md, verify Epic 4.1 updated

**Evidence to record:**
- Screenshot of updated SPECS.md row

**Files touched:**
- `SPECS.md` (MODIFY)

---

### T15: Update SPEC.md Entrypoint

**Goal:** Keep SPEC.md pointing to Epic 4.1 during implementation.

**Steps:**
1. Open `SPEC.md`
2. Verify "Current Focus" points to Epic 4.1
3. Update Status to "In Progress"
4. Verify Quick Links point to Epic 4.1 spec folder

**Done when:**
- SPEC.md reflects Epic 4.1 in progress
- Status updated
- Links correct

**Verify:**
- Open SPEC.md, verify points to Epic 4.1
- Click links, verify they work

**Evidence to record:**
- Screenshot of updated SPEC.md

**Files touched:**
- `SPEC.md` (MODIFY)

---

### T16: Consolidate Evidence in spec.md

**Goal:** Update spec.md with comprehensive evidence from all tasks.

**Steps:**
- [ ] Review verification results for each AC
- [ ] Update `specs/041-markdown-conversion/spec.md` with:
   - Task evidence for T1-T15
   - Final status of each AC (Pass/Fail)
   - Links to test results or evidence artifacts
   - Notes on any deviations or waivers
- [ ] Add summary of what was accomplished
- [ ] Add link to latest commit hash
- [ ] Update SPECS.md to mark Epic 4.1 as "Done"

**Done when:**
- All evidence consolidated in spec.md
- Evidence section complete and well-organized
- Links to artifacts work
- SPECS.md updated to "Done"

**Verify:**
- Read spec.md evidence section
- Click all links, verify they work
- Verify evidence covers all ACs

**Evidence to record:**
- Final spec.md with complete evidence section
- Updated SPECS.md showing Epic 4.1 as Done

**Files touched:**
- `specs/041-markdown-conversion/spec.md` (MODIFY)
- `SPECS.md` (MODIFY)

---

## Summary

**Total tasks:** 16  
**Estimated time:** 16-24 hours  
**Dependencies:** Epic 4.0 (Readability Integration) must be completed  
**Blocks:** Epic 4.2, 4.3, 4.4

**Task order:**
1. Setup (T1-T2): 1-2 hours
2. Core implementation (T3-T6): 6-9 hours
3. Tests (T7-T9): 5-7 hours
4. Verification (T10-T12): 3-4 hours
5. Docs and tracking (T13-T16): 1-2 hours
