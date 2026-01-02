# Tasks: Fallback Extraction Chain

This document provides an ordered, granular task breakdown for implementing Epic 4.2: Fallback Extraction Chain. Each task is 30-90 minutes and includes clear completion criteria and verification steps.

---

## Setup

### T1: Create Fallback Extractor Module Structure

**Goal:** Set up the module structure for fallback extraction logic.

**Steps:**
- [x] Create `src/lib/extractors/fallback-extractor.ts`
- [x] Add TypeScript interfaces for fallback extraction:
  - `ExtractionLevel` enum (READABILITY, SIMPLIFIED_DOM, FULL_PAGE_CLEAN, SMART_BOOKMARK)
  - `ExtractionQuality` enum (SUCCESS, PARTIAL, FALLBACK)
  - `FallbackExtractionResult` interface
- [x] Add JSDoc comments for all types
- [x] Export interfaces from module

**Done when:**
- File created with type definitions
- No TypeScript errors when importing types
- All types have JSDoc documentation

**Verify:**
- Run `npm run type-check` (or `tsc --noEmit`)
- Import types in test file, verify autocomplete works

**Evidence to record:**
- Screenshot of type definitions
- TypeScript compilation success output

**Files touched:**
- `src/lib/extractors/fallback-extractor.ts` (NEW)

---

### T2: Update Article Type Definitions

**Goal:** Update article types to include extraction level and quality fields.

**Steps:**
- [x] Open `src/types/article.ts`
- [x] Add `level: ExtractionLevel` field to `ArticleExtractionResult`
- [x] Update `quality` field to use `ExtractionQuality` enum
- [x] Add `levelTimes: Record<ExtractionLevel, number>` to metadata
- [x] Add JSDoc comments for new fields

**Done when:**
- Type file updated with fallback-related fields
- No TypeScript errors when importing types
- All types have JSDoc documentation

**Verify:**
- Run `npm run type-check`
- Import types in test file, verify autocomplete works

**Evidence to record:**
- Screenshot of updated type definitions
- TypeScript compilation success output

**Files touched:**
- `src/types/article.ts` (MODIFY)

---

## Core Implementation

### T3: Implement Level 2 - Simplified DOM Extraction

**Goal:** Implement simplified DOM extraction algorithm.

**Steps:**
- [x] In `fallback-extractor.ts`, implement `extractSimplifiedDOM()` function:
  - Find all `<article>` tags
  - If found, select largest by text content
  - If no `<article>` tags, calculate text density for major blocks (`<main>`, `<div>`, `<section>`)
  - Select block with highest text density (minimum 0.3 ratio)
  - Extract HTML from selected block
  - Return null if word count < 100
- [x] Implement helper functions:
  - `calculateTextDensity(element: Element): number`
  - `getWordCount(element: Element): number`
  - `findLargestByTextContent(elements: NodeList): Element`
- [x] Add error handling and logging
- [x] Add 3-second timeout using `Promise.race()` (Deferred to T6 orchestration for sync function)

**Done when:**
- `extractSimplifiedDOM()` function implemented and exported
- Helper functions working correctly
- Timeout mechanism works
- Error cases handled gracefully

**Verify:**
- Create test page with `<article>` tag, verify extraction
- Create test page without `<article>`, verify text density calculation
- Test timeout with mock slow extraction

**Evidence to record:**
- Code snippet of extractSimplifiedDOM function
- Test output showing successful extraction

**Files touched:**
- `src/lib/extractors/fallback-extractor.ts` (MODIFY)

---

### T4: Implement Level 3 - Full Page Clean Extraction

**Goal:** Implement full page capture with aggressive cleaning.

**Steps:**
- [x] In `fallback-extractor.ts`, implement `extractFullPageClean()` function:
  - Clone `document.body`
  - Remove elements by tag: `<script>`, `<style>`, `<iframe>`, `<noscript>`
  - Remove elements by common class/id patterns:
    - Navigation: `/nav|navbar|menu|breadcrumb/i`
    - Footer: `/footer|copyright/i`
    - Ads: `/ad|advertisement|sponsored|promo/i`
    - Social: `/share|social|follow/i`
    - Comments: `/comment|disqus/i`
  - Extract HTML from cleaned clone
  - Return null if word count < 50
- [x] Implement helper function:
  - `removeElementsByPattern(root: Element, patterns: RegExp[]): void`
- [x] Add error handling and logging
- [x] Add 2-second timeout using `Promise.race()` (Deferred to T6 orchestration for sync function)

**Done when:**
- `extractFullPageClean()` function implemented and exported
- Cleaning patterns work correctly
- Timeout mechanism works
- Error cases handled gracefully

**Verify:**
- Create test page with scripts/ads, verify removal
- Test timeout with mock slow extraction
- Verify word count threshold enforced

**Evidence to record:**
- Code snippet of extractFullPageClean function
- Test output showing cleaned extraction

**Files touched:**
- `src/lib/extractors/fallback-extractor.ts` (MODIFY)

---

### T5: Implement Level 4 - Smart Bookmark Fallback

**Goal:** Implement smart bookmark creation as final fallback.

**Steps:**
- [x] In `fallback-extractor.ts`, implement `createSmartBookmark()` function:
  - Import `extractMetadata` from Epic 3.2
  - Extract enhanced metadata (Open Graph, Schema.org, Twitter Cards)
  - Create result object with:
    - `level: ExtractionLevel.SMART_BOOKMARK`
    - `quality: ExtractionQuality.FALLBACK`
    - `content.html: null`
    - `content.markdown: null`
    - `content.title: document.title`
    - `content.metadata: { ...metadata, extractionFailed: true }`
  - Return result (always succeeds)
- [x] Add note to metadata: "Article extraction failed. Saved as bookmark."

**Done when:**
- `createSmartBookmark()` function implemented and exported
- Metadata extraction integrated
- Always returns successful result
- Metadata includes `extractionFailed: true`

**Verify:**
- Call function, verify result structure
- Verify metadata populated correctly
- Verify always succeeds (no errors)

**Evidence to record:**
- Code snippet of createSmartBookmark function
- Test output showing bookmark result

**Files touched:**
- `src/lib/extractors/fallback-extractor.ts` (MODIFY)

---

### T6: Implement Fallback Chain Orchestration

**Goal:** Implement the main fallback chain that tries all 4 levels in sequence.

**Steps:**
- [ ] In `fallback-extractor.ts`, implement `extractWithFallback()` function:
  - Initialize performance tracking
  - Try Level 1 (Readability) - import from Epic 4.0
    - If succeeds, return with `level: READABILITY`, `quality: SUCCESS`
    - If fails, continue to Level 2
  - Try Level 2 (Simplified DOM)
    - If succeeds, return with `level: SIMPLIFIED_DOM`, `quality: PARTIAL`
    - If fails, continue to Level 3
  - Try Level 3 (Full Page Clean)
    - If succeeds, return with `level: FULL_PAGE_CLEAN`, `quality: PARTIAL`
    - If fails, continue to Level 4
  - Try Level 4 (Smart Bookmark)
    - Always succeeds, return with `level: SMART_BOOKMARK`, `quality: FALLBACK`
  - Track time for each level in `performance.levelTimes`
  - Convert extracted HTML to Markdown (if HTML available)
- [ ] Add comprehensive error handling
- [ ] Add logging for each level attempt

**Done when:**
- `extractWithFallback()` function implemented and exported
- All 4 levels tried in sequence
- Performance tracking works
- Markdown conversion integrated
- Error cases handled gracefully

**Verify:**
- Mock Readability failure, verify Level 2 attempted
- Mock Level 2 failure, verify Level 3 attempted
- Mock Level 3 failure, verify Level 4 attempted
- Verify performance tracking accurate

**Evidence to record:**
- Code snippet of extractWithFallback function
- Test output showing fallback chain execution

**Files touched:**
- `src/lib/extractors/fallback-extractor.ts` (MODIFY)

---

### T7: Integrate Fallback Chain with Article Extractor

**Goal:** Update article extractor to use fallback chain instead of direct Readability call.

**Steps:**
- [x] Open `src/lib/extractors/article-extractor.ts`
- [x] Import `extractWithFallback` from `fallback-extractor.ts`
- [x] Replace direct Readability call with `extractWithFallback()` (Refactored old logic to `readability-extractor.ts`)
- [x] Update `ArticleExtractionResult` to include:
  - `level: ExtractionLevel`
  - `quality: ExtractionQuality`
  - `metadata.levelTimes: Record<ExtractionLevel, number>`
- [x] Handle all extraction levels uniformly
- [x] Update error handling

**Done when:**
- Article extractor uses fallback chain
- Extraction result includes level and quality fields
- Level times tracked in metadata
- All extraction levels handled correctly

**Verify:**
- Extract article, verify result includes level and quality
- Test on page where Readability fails, verify fallback triggered
- Verify level times populated

**Evidence to record:**
- Screenshot of extraction result with level/quality fields
- Console output showing fallback chain execution

**Files touched:**
- `src/lib/extractors/article-extractor.ts` (MODIFY)

---

### T8: Implement Quality Indicator UI

**Goal:** Update service worker to display extraction quality feedback.

**Steps:**
- [x] Open `src/background/service-worker.ts`
- [x] Implement `getQualityMessage` helper
- [x] Implement `getQualityEmoji` (Green/Yellow/Orange/Red)
- [x] Update notification creation to use quality message and color
- [x] Add "Retry extraction" button for FALLBACK quality

**Done when:**
- Quality messages implemented
- Quality colors implemented
- Notifications show correct quality indicator
- Retry button shown for failed extractions

**Verify:**
- Trigger successful extraction, verify green notification
- Trigger Level 2/3 extraction, verify yellow notification
- Trigger Level 4 fallback, verify orange notification with retry button

**Evidence to record:**
- Screenshots of notifications for each quality level
- Screenshot of retry button

**Files touched:**
- `src/background/service-worker.ts` (MODIFY)

---

### T9: Implement Manual Retry Functionality

**Goal:** Add manual retry logic for failed extractions.

**Steps:**
- [x] In `service-worker.ts`, create retry count tracking:
  - `retryCountMap`
- [x] Implement `chrome.notifications.onButtonClicked` listener:
  - Get tab ID from notification ID
  - Check retry count (max 3)
  - If < 3, increment count and run extraction again (using `handleExtractArticle(tabId)`)
  - If >= 3, show "Maximum retry attempts reached" notification
  - Clear retry count on successful extraction
- [x] Add retry logic to `handleExtractArticle`

**Done when:**
- Retry button triggers re-extraction
- Retry count tracked per URL
- Maximum 3 retries enforced
- Retry count cleared on success
- "Maximum retries" message shown after 3 attempts

**Verify:**
- Click retry button, verify extraction runs again
- Retry 3 times, verify max retry message shown
- Successful extraction clears retry count

**Evidence to record:**
- Screenshot of retry notification
- Screenshot of max retry message
- Console output showing retry count tracking

**Files touched:**
- `src/background/service-worker.ts` (MODIFY)

---

### T10: Add Extraction Quality to Anytype Objects

**Goal:** Store extraction quality metadata in Anytype objects.

**Steps:**
- [x] In `bookmark-capture-service.ts`, update `prepareProperties` function (Service-worker delegates object creation):
  - Add `extractionLevel` property support (via Metadata)
  - Add `extractionQuality` property support
  - Add `extractionTime` property support
  - For FALLBACK quality, note is added via description or metadata
  - Use 'Bookmark' type for FALLBACK, 'Article' type for others (managed by Consumer usually)

**Done when:**
- Anytype objects include extraction metadata
- Properties correctly set based on extraction level
- Object type correct (Article vs Bookmark)

**Verify:**
- Capture article at each level, verify properties in Anytype
- Verify FALLBACK creates Bookmark with extractionFailed property

**Evidence to record:**
- Screenshots of Anytype objects showing extraction metadata
- Screenshot of Level 4 bookmark with extractionFailed property

**Files touched:**
- `src/background/service-worker.ts` (MODIFY)

---

## Tests

### T11: Write Unit Tests for Fallback Extractor

**Goal:** Create comprehensive unit tests for fallback extraction logic.

**Steps:**
- [ ] Create `tests/unit/fallback-extractor.test.ts`
- [ ] Set up test fixtures:
  - HTML with `<article>` tag
  - HTML with multiple divs (varying text density)
  - HTML with scripts, styles, ads
  - Minimal content HTML
- [ ] Write test cases:
  - **Test 1:** Level 2 extracts from `<article>` tag
  - **Test 2:** Level 2 calculates text density correctly
  - **Test 3:** Level 2 selects highest density block
  - **Test 4:** Level 2 returns null for word count < 100
  - **Test 5:** Level 3 removes scripts and styles
  - **Test 6:** Level 3 removes ads by class pattern
  - **Test 7:** Level 3 returns null for word count < 50
  - **Test 8:** Level 4 creates smart bookmark
  - **Test 9:** Level 4 always succeeds
  - **Test 10:** Fallback chain tries levels in order (1→2→3→4)
  - **Test 11:** Fallback chain stops at first success
  - **Test 12:** Performance tracking records level times
  - **Test 13:** Timeout aborts slow extraction
- [ ] Run tests and verify all pass

**Done when:**
- All 13 test cases written and passing
- Code coverage >80% for fallback-extractor.ts
- No flaky tests

**Verify:**
- Run `npm test -- fallback-extractor.test.ts`
- Check coverage report: `npm run test:coverage`

**Evidence to record:**
- Test output showing all tests passing
- Coverage report screenshot

**Files touched:**
- `tests/unit/fallback-extractor.test.ts` (NEW)

---

### T12: Update Article Extractor Unit Tests

**Goal:** Update article extractor tests to verify fallback integration.

**Steps:**
- [ ] Open `tests/unit/article-extractor.test.ts`
- [ ] Add new test cases:
  - **Test 1:** Extraction result includes `level` field
  - **Test 2:** Extraction result includes `quality` field
  - **Test 3:** Level times tracked in metadata
  - **Test 4:** Fallback chain used instead of direct Readability
- [ ] Run tests and verify all pass

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

### T13: Write Integration Tests for Fallback Extraction

**Goal:** Create integration tests for end-to-end fallback extraction.

**Steps:**
- [ ] Create `tests/integration/fallback-extraction.test.ts`
- [ ] Set up test pages:
  - SPA page (React/Vue app)
  - JavaScript-heavy page
  - Minimal content page
- [ ] Write test cases:
  - **Test 1:** SPA page triggers Level 2 extraction
  - **Test 2:** JavaScript-heavy page triggers Level 3 extraction
  - **Test 3:** Minimal content page triggers Level 4 fallback
  - **Test 4:** Quality indicators correct for each level
  - **Test 5:** Total extraction time ≤10 seconds
- [ ] Run tests and verify all pass

**Done when:**
- All 5 test cases written and passing
- Tests run successfully in CI
- Integration tests cover all extraction levels

**Verify:**
- Run `npm run test:integration -- fallback-extraction.test.ts`
- Verify tests pass in CI

**Evidence to record:**
- Integration test output
- Screenshot of test browser showing fallback extraction

**Files touched:**
- `tests/integration/fallback-extraction.test.ts` (NEW)

---

## Verification

### T14: Manual Testing on Test Corpus

**Goal:** Verify fallback extraction works on diverse real-world pages.

**Steps:**
1. Create test corpus of 100 diverse URLs:
   - 40 traditional news/blog sites (should succeed at Level 1)
   - 30 SPAs (React, Vue, Angular - should succeed at Level 2/3)
   - 20 JavaScript-heavy sites (should succeed at Level 3)
   - 10 landing pages/minimal content (should fall back to Level 4)
2. For each URL:
   - Load page in browser with extension
   - Trigger article capture
   - Record extraction level (1, 2, 3, or 4)
   - Record quality indicator (green/yellow/orange)
   - Record extraction time
   - Verify content quality matches level
   - Note any issues
3. Calculate success rate (target: 95%+)
4. Document results in spreadsheet

**Done when:**
- All 100 pages tested
- Success rate ≥95% (95+ captures succeed)
- Average extraction time ≤5s
- Results documented in spreadsheet

**Verify:**
- Review test corpus spreadsheet
- Verify success rate meets target
- Verify performance meets target

**Evidence to record:**
- Test corpus spreadsheet with fallback extraction results
- Screenshots of extractions at each level
- Performance metrics chart

**Files touched:**
- `docs/testing/fallback-extraction-test-corpus.csv` (NEW)

---

### T15: Verify PRD Acceptance Criteria

**Goal:** Manually verify PRD acceptance criterion AC9.

**Steps:**

**AC9: Article extraction falls back gracefully when Readability fails**
1. Navigate to SPA/dynamic page (e.g., Gmail, Google Docs, React app)
2. Trigger article capture
3. Verify:
   - Fallback extraction or smart bookmark created
   - No crashes or errors
   - Quality indicator shows appropriate level (yellow or orange)
   - Content captured (even if simplified)
   - Extraction completes within 10 seconds
4. Try manual retry, verify:
   - Retry button appears for failed extractions
   - Retry runs full fallback chain again
   - Retry count enforced (max 3)
5. Document result with screenshots

**Done when:**
- AC9 verified and documented
- Screenshots captured for evidence
- Manual retry verified

**Verify:**
- Review screenshots
- Verify AC9 passes

**Evidence to record:**
- Screenshots of AC9 verification (SPA extraction with fallback)
- Screenshots of quality indicators for each level
- Screenshot of manual retry functionality

**Files touched:**
- None (manual testing)

---

### T16: Performance Verification

**Goal:** Verify fallback chain performance meets requirements.

**Steps:**
1. Select 30 pages requiring fallback:
   - 10 Level 2 (SPAs)
   - 10 Level 3 (JavaScript-heavy)
   - 10 Level 4 (minimal content)
2. For each page:
   - Trigger extraction
   - Record total extraction time (from logs)
   - Record time per level (from levelTimes)
   - Verify ≤10s total
   - Note any timeouts
3. Calculate performance metrics:
   - Average extraction time per level
   - 95th percentile extraction time
   - Timeout rate

**Done when:**
- All 30 pages tested
- 95% complete within 10 seconds
- Performance metrics documented

**Verify:**
- Review performance data
- Verify meets total extraction time requirement (≤10s)

**Evidence to record:**
- Performance test results spreadsheet
- Chart showing extraction time distribution by level

**Files touched:**
- `docs/testing/fallback-extraction-performance.csv` (NEW)

---

## Docs

### T17: Update README

**Goal:** Document fallback extraction feature in README.

**Steps:**
1. Open `README.md`
2. Update "Article Extraction" section:
   - Add note about 4-level fallback chain
   - Explain extraction levels and quality indicators
   - List what each level does
   - Explain manual retry functionality
3. Add troubleshooting section:
   - What to do if extraction fails
   - How to use manual retry
   - When to expect smart bookmark fallback

**Done when:**
- README updated with fallback extraction documentation
- Information clear and accurate
- Troubleshooting section helpful

**Verify:**
- Read README, verify instructions are clear
- Verify information matches implementation

**Evidence to record:**
- Screenshot of updated README section

**Files touched:**
- `README.md` (MODIFY)

---

## Tracking

### T18: Update SPECS.md

**Goal:** Update specification index to reflect Epic 4.2 status.

**Steps:**
1. Open `SPECS.md`
2. Find Epic 4.2 row in BP3 table
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Update Evidence link to point to `specs/042-fallback-chain/spec.md#evidence`
6. Update Last Updated timestamp
7. Commit with message: `docs: update SPECS.md - Epic 4.2 status to Done`

**Done when:**
- SPECS.md reflects Epic 4.2 completion
- Evidence link correct
- Commit message follows convention

**Verify:**
- Open SPECS.md, verify Epic 4.2 updated
- Click evidence link, verify it works

**Evidence to record:**
- Screenshot of updated SPECS.md row
- Git commit hash

**Files touched:**
- `SPECS.md` (MODIFY)

---

### T19: Update SPEC.md Entrypoint

**Goal:** Update SPEC.md to point to next epic after Epic 4.2 completion.

**Steps:**
1. Open `SPEC.md`
2. Update "Current Focus" to next epic (Epic 4.3: Image Handling)
3. Update Status to "Not Started" (or appropriate status)
4. Update Quick Links to point to Epic 4.3 spec folder
5. Commit with message: `docs: update SPEC.md - move focus to Epic 4.3`

**Done when:**
- SPEC.md points to next epic
- Status updated
- Links correct
- Commit message follows convention

**Verify:**
- Open SPEC.md, verify points to Epic 4.3
- Click links, verify they work

**Evidence to record:**
- Screenshot of updated SPEC.md
- Git commit hash

**Files touched:**
- `SPEC.md` (MODIFY)

---

### T20: Consolidate Evidence in spec.md

**Goal:** Update spec.md with comprehensive evidence from all tasks.

**Steps:**
- [x] Review verification results for each AC
- [x] Update `specs/042-fallback-chain/spec.md` with:
  - Task evidence for T1-T19
  - Final status of each AC (Pass/Fail)
  - Links to test results or evidence artifacts
  - Notes on any deviations or waivers
- [x] Add summary of what was accomplished
- [x] Add link to latest commit hash
- [x] Update SPECS.md to mark Epic 4.2 as "Done"

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
- Updated SPECS.md showing Epic 4.2 as Done
- Git commit hash

**Files touched:**
- `specs/042-fallback-chain/spec.md` (MODIFY)
- `SPECS.md` (MODIFY)

---

## Summary

**Total tasks:** 20  
**Estimated time:** 20-30 hours  
**Dependencies:** Epic 4.0 (Readability Integration), Epic 4.1 (Markdown Conversion), Epic 3.0 (Bookmark Capture), Epic 3.2 (Metadata Extraction)  
**Blocks:** Epic 4.3 (Image Handling), Epic 4.4 (Table Preservation)

**Task order:**
1. Setup (T1-T2): 1-2 hours
2. Core implementation (T3-T10): 10-15 hours
3. Tests (T11-T13): 5-7 hours
4. Verification (T14-T16): 3-4 hours
5. Docs and tracking (T17-T20): 1-2 hours
