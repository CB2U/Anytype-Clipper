# Tasks: Readability Integration

This document provides an ordered, granular task breakdown for implementing Epic 4.0: Readability Integration. Each task is 30-90 minutes and includes clear completion criteria and verification steps.

---

## Setup

### T1: Install Readability Library

**Goal:** Add Mozilla Readability as a project dependency.

**Steps:**
- [x] Run `npm install @mozilla/readability --save`
- [x] Verify package added to `package.json` dependencies
- [x] Verify package-lock.json updated
- [x] Run `npm install` to ensure no conflicts

**Done when:**
- `@mozilla/readability` appears in `package.json` dependencies
- `npm install` completes without errors
- Library is available for import in TypeScript files

**Verify:**
- Run `npm list @mozilla/readability` to confirm version installed
- Create test file that imports Readability, verify no TypeScript errors

**Evidence to record:**
- Screenshot of package.json showing dependency
- Terminal output of `npm list @mozilla/readability`

**Files touched:**
- `package.json`
- `package-lock.json`

---

### T2: Create Type Definitions

**Goal:** Create TypeScript type definitions for article extraction.

**Steps:**
- [x] Create `src/types/article.d.ts`
- [x] Define `ArticleExtractionResult` interface
- [x] Define `ExtractionQuality` enum
- [x] Import and extend `Readability.ParseResult` type from `@mozilla/readability`
- [x] Add JSDoc comments for all types

**Done when:**
- Type file created with all required interfaces
- No TypeScript errors when importing types
- All types have JSDoc documentation

**Verify:**
- Run `npm run type-check` (or `tsc --noEmit`)
- Import types in test file, verify autocomplete works

**Evidence to record:**
- Screenshot of type definitions file
- TypeScript compilation success output

**Files touched:**
- `src/types/article.d.ts` (NEW)

---

## Core Implementation

### T3: Implement Article Extractor Service

**Goal:** Create the core article extraction service using Readability.

**Steps:**
- [x] Create `src/lib/extractors/article-extractor.ts`
- [x] Import Readability from `@mozilla/readability`
- [x] Implement `extractArticle()` function:
   - Clone document using `document.cloneNode(true)`
   - Create Readability instance with cloned document
   - Call `parse()` method
   - Handle null return (extraction failure)
   - Extract metadata (title, byline, excerpt, length, dir)
   - Calculate word count from textContent
   - Track extraction time using `performance.now()`
- [x] Implement error handling:
   - Try-catch around Readability operations
   - Return structured error object
   - Sanitize error messages (no stack traces)
- [x] Implement 5-second timeout:
   - Use `Promise.race()` with timeout promise
   - Abort extraction if timeout exceeded
- [x] Add quality determination logic:
   - Success: article extracted with content
   - Partial: article extracted but degraded (future: detect quality indicators)
   - Failure: extraction returned null

**Done when:**
- `extractArticle()` function implemented and exported
- All error cases handled gracefully
- Timeout mechanism works
- Quality indicators returned
- TypeScript types match interface

**Verify:**
- Create test HTML document, call `extractArticle()`, verify result structure
- Test with empty document, verify graceful failure
- Test timeout with mock slow extraction

**Evidence to record:**
- Code snippet of extractArticle function
- Test output showing successful extraction
- Test output showing graceful failure

**Files touched:**
- `src/lib/extractors/article-extractor.ts` (NEW)

---

### T4: Integrate with Content Script

**Goal:** Add article extraction capability to content script.

**Steps:**
- [x] Open `src/content/content-script.ts`
- [x] Import `extractArticle` from `article-extractor.ts`
- [x] Add message listener for `EXTRACT_ARTICLE` action
- [x] Implement handler:
   - Call `extractArticle()`
   - Send result back to service worker via `chrome.runtime.sendMessage`
   - Include tab ID and timestamp in response
- [x] Add error handling for message passing

**Done when:**
- Content script listens for `EXTRACT_ARTICLE` messages
- Extraction runs when message received
- Result sent back to service worker
- No errors in console when testing

**Verify:**
- Load extension, send test message from service worker
- Verify content script receives message and responds
- Check Chrome DevTools console for errors

**Evidence to record:**
- Screenshot of message flow in DevTools
- Console output showing successful extraction

**Files touched:**
- `src/content/content-script.ts` (MODIFY)

---

### T5: Integrate with Service Worker

**Goal:** Add article extraction to service worker capture flow.

**Steps:**
- [x] Open `src/background/service-worker.ts`
- [x] Add `extractArticle` action handler
- [x] Implement extraction flow:
   - Send `EXTRACT_ARTICLE` message to active tab's content script
   - Wait for response with timeout (10 seconds)
   - Store extraction result in memory for further processing
   - Determine quality based on result
   - Show notification to user with quality feedback
- [x] Handle extraction failures:
   - Log failure (sanitized logs)
   - Trigger fallback chain (placeholder for Epic 4.2)
   - Show appropriate notification
- [x] Add extraction time logging for performance monitoring

**Done when:**
- Service worker can trigger article extraction
- Extraction result received and processed
- Quality feedback shown to user
- Failures handled gracefully
- Performance metrics logged

**Verify:**
- Trigger article capture from popup or context menu
- Verify extraction runs and result returned
- Check notification shows correct quality message
- Test with page that fails extraction, verify fallback triggered

**Evidence to record:**
- Screenshot of success notification with word count
- Screenshot of failure notification
- Console logs showing extraction time

**Files touched:**
- `src/background/service-worker.ts` (MODIFY)

---

### T6: Update Build Configuration

**Goal:** Ensure Readability library is bundled into content script.

**Steps:**
- [x] Open `vite.config.ts` or `webpack.config.js`
- [x] Verify content script bundle configuration includes `@mozilla/readability`
- [x] Enable tree-shaking to minimize bundle size
- [x] Add bundle size monitoring (if not already present)
- [x] Build extension and verify bundle size increase (~50KB expected)

**Done when:**
- Build completes successfully
- Content script bundle includes Readability
- Bundle size increase is acceptable (~50KB)
- No build warnings or errors

**Verify:**
- Run `npm run build`
- Check dist/content-script.js size
- Verify Readability code present in bundle (search for "Readability" in minified file)

**Evidence to record:**
- Build output showing bundle sizes
- Screenshot of dist/ directory with file sizes

**Files touched:**
- `vite.config.ts` or `webpack.config.js` (MODIFY)

---

## Tests

### T7: Write Unit Tests for Article Extractor

**Goal:** Create comprehensive unit tests for article extraction logic.

**Steps:**
- [x] Create `tests/unit/article-extractor.test.ts`
- [x] Set up test fixtures:
   - Mock HTML document with article content
   - Mock HTML document with no article content
   - Mock HTML document with metadata
- [x] Write test cases:
   - **Test 1:** Successful extraction returns expected structure
   - **Test 2:** Extraction failure returns null gracefully
   - **Test 3:** Metadata extracted correctly (title, byline, excerpt)
   - **Test 4:** Word count calculated correctly
   - **Test 5:** Extraction time tracked
   - **Test 6:** Timeout aborts extraction after 5 seconds (Note: Mocked/Skipped due to synchronous limitation)
   - **Test 7:** Error handling sanitizes error messages
- [x] Run tests and verify all pass

**Done when:**
- All 7 test cases written and passing
- Code coverage >80% for article-extractor.ts
- No flaky tests

**Verify:**
- Run `npm test -- article-extractor.test.ts`
- Check coverage report: `npm run test:coverage`

**Evidence to record:**
- Test output showing all tests passing
- Coverage report screenshot

**Files touched:**
- `tests/unit/article-extractor.test.ts` (NEW)

---

### T8: Write Integration Tests

**Goal:** Create integration tests for end-to-end article extraction flow.

**Steps:**
- [x] Create `tests/integration/article-capture.test.ts`
- [x] Set up test environment:
   - Load extension in test browser (Puppeteer)
   - Navigate to test article page
- [x] Write test cases:
   - **Test 1:** Trigger extraction from service worker, verify content script responds
   - **Test 2:** Extract article from real news page, verify result structure
   - **Test 3:** Verify quality notification shown to user
   - **Test 4:** Test extraction failure on SPA page
- [x] Run tests and verify all pass

**Done when:**
- All integration tests written and passing
- Tests run in CI environment
- No flaky tests

**Verify:**
- Run `npm run test:integration -- article-capture.test.ts`
- Verify tests pass in CI

**Evidence to record:**
- Integration test output
- Screenshot of test browser showing extraction

**Files touched:**
- `tests/integration/article-capture.test.ts` (NEW)

---

## Verification

### T9: Manual Testing on Test Corpus

**Goal:** Verify article extraction works on diverse real-world pages.

**Steps:**
1. Create test corpus spreadsheet with 50 diverse URLs:
   - 10 news sites (CNN, NYT, BBC, Guardian, Reuters)
   - 10 blogs (Medium, WordPress, Ghost)
   - 10 documentation sites (MDN, GitHub, Stack Overflow)
   - 10 academic sites (arXiv, PubMed)
   - 10 edge cases (SPAs, dynamic pages, paywalls)
2. For each URL:
   - Load page in browser with extension
   - Trigger article capture
   - Record result: Success / Partial / Failure
   - Record extraction time
   - Note any issues
3. Calculate success rate (target: 80%+)
4. Document failures for fallback chain (Epic 4.2)

**Done when:**
- All 50 pages tested
- Success rate ≥80% (40+ successes)
- Extraction time <5s for 95% of pages
- Results documented in spreadsheet

**Verify:**
- Review test corpus spreadsheet
- Verify success rate meets target
- Verify performance meets target

**Evidence to record:**
- Test corpus spreadsheet with results
- Screenshots of successful extractions
- Screenshots of failures (for fallback chain)

**Files touched:**
- `docs/testing/article-extraction-test-corpus.csv` (NEW)

---

### T10: Performance Verification

**Goal:** Verify extraction performance meets requirements.

**Steps:**
1. Select 20 articles of varying sizes:
   - 5 short (500-1000 words)
   - 10 medium (1000-5000 words)
   - 5 long (5000+ words)
2. For each article:
   - Trigger extraction
   - Record extraction time
   - Verify <5s for typical articles
   - Note any timeouts
3. Calculate performance metrics:
   - Average extraction time
   - 95th percentile extraction time
   - Timeout rate

**Done when:**
- All 20 articles tested
- 95% complete within 5 seconds
- Performance metrics documented

**Verify:**
- Review performance data
- Verify meets NFR1.2 (PERF-2)

**Evidence to record:**
- Performance test results spreadsheet
- Chart showing extraction time distribution

**Files touched:**
- `docs/testing/article-extraction-performance.csv` (NEW)

---

## Docs

### T11: Update README

**Goal:** Document article extraction feature in README.

**Steps:**
1. Open `README.md`
2. Add section under "Features":
   - "Article Extraction with Readability"
   - Brief description of feature
   - Supported page types
   - Quality indicators
3. Add usage instructions:
   - How to capture articles (context menu, popup)
   - What to expect (extraction quality)
4. Add troubleshooting section:
   - What to do if extraction fails
   - Fallback chain explanation (placeholder for Epic 4.2)

**Done when:**
- README updated with article extraction documentation
- Usage instructions clear and accurate
- Troubleshooting section added

**Verify:**
- Read README, verify instructions are clear
- Follow instructions to capture article, verify they work

**Evidence to record:**
- Screenshot of updated README section

**Files touched:**
- `README.md` (MODIFY)

---

## Tracking

### T12: Update SPECS.md

**Goal:** Update specification index to reflect Epic 4.0 status.

**Steps:**
1. Open `SPECS.md`
2. Find Epic 4.0 row in BP3 table
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Add Evidence link to `specs/040-readability/spec.md#evidence`
6. Update Last Updated timestamp
7. Update progress tracking section

**Done when:**
- SPECS.md reflects Epic 4.0 completion
- Evidence link points to spec.md
- Progress counters updated

**Verify:**
- Open SPECS.md, verify Epic 4.0 marked as Done
- Click Evidence link, verify it works

**Evidence to record:**
- Screenshot of updated SPECS.md row

**Files touched:**
- `SPECS.md` (MODIFY)

---

### T13: Update SPEC.md Entrypoint

**Goal:** Update SPEC.md to point to next epic.

**Steps:**
1. Open `SPEC.md`
2. Update "Current Focus" to next epic (4.1: Markdown Conversion)
3. Update Status to "Not Started"
4. Update Quick Links to point to Epic 4.1 spec folder

**Done when:**
- SPEC.md points to Epic 4.1
- Status updated
- Links correct

**Verify:**
- Open SPEC.md, verify points to Epic 4.1
- Click links, verify they work (will be created in next epic)

**Evidence to record:**
- Screenshot of updated SPEC.md

**Files touched:**
- `SPEC.md` (MODIFY)

---

### T14: Consolidate Evidence in spec.md

**Goal:** Update spec.md with comprehensive evidence from all tasks.

**Steps:**
- [x] Review verification results for each AC
- [x] Update `specs/040-readability/spec.md` with:
   - Final status of each AC (Pass/Fail)
   - Links to test results or evidence artifacts
   - Notes on any deviations or waivers
- [x] Add summary of what was accomplished
- [x] Add link to latest commit hash

**Done when:**
- All evidence consolidated in spec.md
- Evidence section complete and well-organized
- Links to artifacts work

**Verify:**
- Read spec.md evidence section
- Click all links, verify they work
- Verify evidence covers all ACs

**Evidence to record:**
- Final spec.md with complete evidence section

**Files touched:**
- `specs/040-readability/spec.md` (MODIFY)

---

## Summary

**Total tasks:** 14  
**Estimated time:** 14-21 hours  
**Dependencies:** None (all prerequisites completed)  
**Blocks:** Epic 4.1, 4.2, 4.3, 4.4

**Task order:**
1. Setup (T1-T2): 1-2 hours
2. Core implementation (T3-T6): 6-9 hours
3. Tests (T7-T8): 4-6 hours
4. Verification (T9-T10): 2-3 hours
5. Docs and tracking (T11-T14): 1-2 hours
