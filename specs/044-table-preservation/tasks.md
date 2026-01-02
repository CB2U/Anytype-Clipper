# Tasks: Table Preservation

## Setup

### T1: Create Type Definitions
**Goal:** Define TypeScript interfaces for table processing [x]

**Steps:**
1. Create `src/types/table.d.ts`
2. Define `TableType` enum (Simple, Complex, Data)
3. Define `TableMetadata` interface
4. Define `TableClassificationResult` interface
5. Define `TableConversionResult` interface
6. Export all types

**Done When:**
- All type definitions created
- TypeScript compiles with no errors
- Types exported from `src/types/index.ts`

**Verify:**
- Run `npm run type-check`
- Verify no TypeScript errors

**Evidence to Record:**
- TypeScript compilation output
- Link to `table.d.ts` file

**Files Touched:**
- `src/types/table.d.ts` (new)
- `src/types/index.ts` (modify to export)

---

### T2: Create Test Fixtures
**Goal:** Prepare HTML fixtures for testing table extraction [x]

**Steps:**
1. Create `tests/fixtures/tables/` directory
2. Create `simple-table.html` (3 cols, 8 rows, Wikipedia-style infobox)
3. Create `complex-table.html` (12 cols, merged headers, financial report)
4. Create `data-table.html` (4 cols, 15 rows, CSV-like dataset)
5. Create `mixed-tables.html` (2 simple + 1 complex table)
6. Create `malformed-table.html` (missing `<thead>`, irregular rows)
7. Create `article-with-simple-table.html` (full article with simple table)
8. Create `article-with-complex-table.html` (full article with complex table)
9. Create `article-with-data-table.html` (full article with data table)

**Done When:**
- All 9 fixtures created
- Fixtures contain valid (or intentionally malformed) HTML
- Fixtures cover diverse table scenarios

**Verify:**
- Open each fixture in browser to verify HTML is valid
- Verify fixtures match test scenarios in plan.md

**Evidence to Record:**
- List of created fixtures
- Screenshot of one fixture in browser

**Files Touched:**
- `tests/fixtures/tables/*.html` (9 new files)

---

---

## Settings & Configuration

### T2.5: Add JSON Setting
**Goal:** Add `includeJSONForDataTables` setting [x]

**Steps:**
1. Open `src/options/options.html`
2. Add checkbox: "Includes JSON for Data Tables"
3. Open `src/options/options.ts`
4. Handle save/load of this setting
5. Open `src/lib/storage-manager.ts` (or similar) to ensure it propagates

**Done When:**
- Setting appears in Options UI
- Setting persists across reloads
- Setting is accessible to Converter

**Verify:**
- Open Options page, toggle, reload, check state

**Files Touched:**
- `src/options/options.html`
- `src/options/options.ts`

---

## Core Implementation

### T3: Implement TableDetector
**Goal:** Create module to detect `<table>` elements in HTML [x]

**Steps:**
1. Create `src/lib/extractors/table-detector.ts`
2. Implement `detectTables(html: string): HTMLTableElement[]`
3. Use DOMParser to parse HTML
4. Query for all `<table>` elements
5. Return array of HTMLTableElement
6. Handle empty HTML gracefully (return empty array)

**Done When:**
- `TableDetector` class implemented
- Exports `detectTables()` function
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `table-detector.ts` file
- TypeScript/ESLint output

**Files Touched:**
- `src/lib/extractors/table-detector.ts` (new)

---

### T4: Implement TableClassifier
**Goal:** Create module to classify tables by complexity [x]

**Steps:**
1. Create `src/lib/extractors/table-classifier.ts`
2. Implement `classify(table: HTMLTableElement): TableClassificationResult`
3. Extract table metadata:
   - Row count (count `<tr>` elements)
   - Column count (count `<th>` or `<td>` in first row)
   - Has header (check for `<thead>` or first row with `<th>`)
   - Has merged cells (check for `colspan` or `rowspan` attributes)
   - Has nested tables (query for nested `<table>`)
   - Is uniform structure (all rows have same column count)
   - Cell types (analyze cell content: numeric, text, mixed)
4. Apply classification rules:
   - **Simple:** ≤6 cols, no merges, <20 rows, no nested tables
   - **Complex:** >6 cols OR merged cells OR ≥20 rows OR nested tables
   - **Data:** Uniform structure, ≥3 rows, primarily numeric/categorical
5. Return classification result with confidence and reason

**Done When:**
- `TableClassifier` class implemented
- Classification rules match spec.md
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `table-classifier.ts` file
- TypeScript/ESLint output

**Files Touched:**
- `src/lib/extractors/table-classifier.ts` (new)

---

### T5: Implement TableConverter - Markdown
**Goal:** Implement simple table to Markdown conversion [x]

**Steps:**
1. Create `src/lib/extractors/table-converter.ts`
2. Implement `toMarkdown(table: HTMLTableElement): string`
3. Extract headers from `<thead>` or first `<tr>` with `<th>`
4. Extract data rows from `<tbody>` or remaining `<tr>` elements
5. Clean cell content:
   - Strip HTML tags
   - Normalize whitespace
   - Escape pipe characters (`|` → `\|`)
6. Format as Markdown table:
   - Header row: `| Header 1 | Header 2 |`
   - Separator row: `|----------|----------|`
   - Data rows: `| Cell 1 | Cell 2 |`
7. Handle empty cells (empty string between pipes)
8. Return formatted Markdown string

**Done When:**
- `toMarkdown()` function implemented
- Handles headers, data rows, empty cells
- Escapes special characters
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `table-converter.ts` file
- Sample Markdown output

**Files Touched:**
- `src/lib/extractors/table-converter.ts` (new)

---

### T6: Implement TableConverter - HTML
**Goal:** Implement complex table to HTML preservation [x]

**Steps:**
1. Add `toHTML(table: HTMLTableElement): string` to `table-converter.ts`
2. Clone table element to avoid modifying original
3. Clean HTML:
   - Remove `<script>` tags
   - Remove `<style>` tags
   - Remove event handlers (onclick, onload, etc.)
   - Remove inline styles (optional, for cleaner output)
4. Serialize table to HTML string
5. Return cleaned HTML string

**Done When:**
- `toHTML()` function implemented
- HTML cleaned of scripts, styles, event handlers
- Preserves table structure exactly
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to `table-converter.ts` file
- Sample HTML output

**Files Touched:**
- `src/lib/extractors/table-converter.ts` (modify)

---

### T7: Implement TableConverter - Data Logic
**Goal:** Implement Data Table logic (Markdown + Optional JSON) and Fix Headers [x]
 
**Steps:**
1. Update `table-converter.ts`
2. Implement `toJSON(table)`
3. **Fix Header Bug:**
   - In `toMarkdown` AND `toJSON`:
   - Check `table.tHead` rows.
   - If missing, grab `table.rows[0]`.
   - Ensure header text is extracted even if empty (generate "Col 1" etc if needed)
4. Ensure Data tables return Markdown string by default
5. Make sure JSON generation is separate function
 
**Done When:**
- Data tables convert to Markdown similar to Simple tables
- `toJSON` produces valid JSON
- **Headers appear even if table has no `<thead>`**
 
**Verify:**
- Unit test with table missing `<thead>`
- Verify "Column names are not populating" bug is gone
 
**Files Touched:**
- `src/lib/extractors/table-converter.ts` (modify)
 
---

### T8: Integrate with Turndown
**Goal:** Add custom Turndown rule for table processing [x]

**Steps:**
1. Open `src/lib/converters/markdown-converter.ts`
2. Import `TableDetector`, `TableClassifier`, `TableConverter`
3. Instantiate table processing modules
4. Add custom Turndown rule for `<table>` elements:
   - Filter: `'table'`
   - Replacement function:
     - Classify table using `TableClassifier`
     - Switch on `TableType`:
       - Simple → `TableConverter.toMarkdown()`
       - Complex → `TableConverter.toHTML()`
       - Data → Format with JSON/CSV + HTML
     - Return converted string
5. Handle errors gracefully (fallback to HTML if conversion fails)

**Done When:**
- Turndown rule added to existing converter
- Table processing integrated seamlessly
- Error handling implemented
- TypeScript compiles with no errors
- ESLint passes

**Verify:**
- Run `npm run type-check`
- Run `npm run lint`

**Evidence to Record:**
- Link to modified `markdown-converter.ts`
- Code snippet of Turndown rule

**Files Touched:**
- `src/lib/converters/markdown-converter.ts` (modify)

---

## Tests

### T9: Unit Tests - TableDetector
**Goal:** Write unit tests for table detection [x]

**Steps:**
1. Create `tests/unit/table-detector.test.ts`
2. Test: Detect single table in HTML
3. Test: Detect multiple tables in HTML
4. Test: Handle HTML with no tables (return empty array)
5. Test: Handle malformed HTML gracefully
6. Test: Ignore nested tables in initial detection
7. Run tests and verify all pass

**Done When:**
- All 5+ tests written
- Tests cover happy path and edge cases
- All tests pass
- Coverage ≥80% for `table-detector.ts`

**Verify:**
- Run `npm test tests/unit/table-detector.test.ts`
- Run `npm run test:coverage` and check coverage report

**Evidence to Record:**
- Test output (all passing)
- Coverage report for `table-detector.ts`

**Files Touched:**
- `tests/unit/table-detector.test.ts` (new)

---

### T10: Unit Tests - TableClassifier
**Goal:** Write unit tests for table classification [x]

**Steps:**
1. Create `tests/unit/table-classifier.test.ts`
2. Test: Classify simple table (3 cols, 5 rows)
3. Test: Classify complex table (>6 cols)
4. Test: Classify complex table (merged cells)
5. Test: Classify complex table (≥20 rows)
6. Test: Classify data table (uniform, numeric)
7. Test: Edge case (6 cols exactly, 19 rows exactly)
8. Test: Performance benchmark (<100ms per table)
9. Run tests and verify all pass

**Done When:**
- All 7+ tests written
- Tests cover all classification rules
- Performance benchmark passes
- All tests pass
- Coverage ≥80% for `table-classifier.ts`

**Verify:**
- Run `npm test tests/unit/table-classifier.test.ts`
- Run `npm run test:coverage` and check coverage report

**Evidence to Record:**
- Test output (all passing)
- Performance benchmark result
- Coverage report for `table-classifier.ts`

**Files Touched:**
- `tests/unit/table-classifier.test.ts` (new)

---

### T11: Unit Tests - TableConverter
**Goal:** Write unit tests for table conversion [x]

**Steps:**
1. Create `tests/unit/table-converter.test.ts`
2. Test: Convert simple table to Markdown
3. Test: Convert complex table to HTML
4. Test: Convert data table to JSON/CSV + HTML
5. Test: Handle missing headers
6. Test: Handle irregular row lengths
7. Test: Strip HTML tags from cell content
8. Test: Normalize whitespace in cells
9. Test: Escape pipe characters in Markdown tables
10. Run tests and verify all pass

**Done When:**
- All 8+ tests written
- Tests cover all conversion functions
- All tests pass
- Coverage ≥80% for `table-converter.ts`

**Verify:**
- Run `npm test tests/unit/table-converter.test.ts`
- Run `npm run test:coverage` and check coverage report

**Evidence to Record:**
- Test output (all passing)
- Sample Markdown/HTML/JSON output from tests
- Coverage report for `table-converter.ts`

**Files Touched:**
- `tests/unit/table-converter.test.ts` (new)

---

### T12: Integration Tests - Table Extraction
**Goal:** Write end-to-end integration tests for table extraction [x]

**Steps:**
1. Create `tests/integration/table-extraction.test.ts`
2. Test: Extract article with simple table → Verify Markdown table in output
3. Test: Extract article with complex table → Verify HTML block in output
4. Test: Extract article with data table → Verify JSON/CSV + HTML in output
5. Test: Mixed article (2 simple + 1 complex) → Verify each converted correctly
6. Test: Turndown integration (tables + headings + lists) → Verify no interference
7. Use fixtures from T2
8. Run tests and verify all pass

**Done When:**
- All 5+ integration tests written
- Tests use fixtures from `tests/fixtures/tables/`
- All tests pass
- End-to-end flow verified

**Verify:**
- Run `npm test tests/integration/table-extraction.test.ts`
- Verify fixtures are loaded correctly

**Evidence to Record:**
- Test output (all passing)
- Sample Markdown output from integration tests

**Files Touched:**
- `tests/integration/table-extraction.test.ts` (new)

---

### T13: Manual Verification - Simple Table
**Goal:** Manually verify simple table rendering in Anytype [x]

**Steps:**
1. Start Anytype Desktop
2. Open extension popup
3. Navigate to article with simple table (e.g., Wikipedia infobox)
4. Click "Clip Article"
5. Open captured article in Anytype
6. Verify table renders as Markdown table (native rendering)
7. Verify headers are bold/distinct
8. Verify column alignment is reasonable
9. Take screenshot

**Done When:**
- Article clipped successfully
- Table renders as Markdown in Anytype
- Screenshot captured

**Verify:**
- Visual inspection in Anytype
- Compare with expected Markdown table format

**Evidence to Record:**
- Screenshot of rendered table in Anytype
- Markdown source from captured article

**Files Touched:**
- None (manual test)

---

### T14: Manual Verification - Complex Table
**Goal:** Manually verify complex table rendering in Anytype [x]

**Steps:**
1. Start Anytype Desktop
2. Open extension popup
3. Navigate to financial report with complex table (merged cells, >6 cols)
4. Click "Clip Article"
5. Open captured article in Anytype
6. Verify table renders as HTML block
7. Verify all cells and structure preserved
8. Verify no data loss
9. Take screenshot

**Done When:**
- Article clipped successfully
- Table renders as HTML in Anytype
- Screenshot captured

**Verify:**
- Visual inspection in Anytype
- Compare with original table in browser

**Evidence to Record:**
- Screenshot of rendered table in Anytype
- HTML source from captured article

**Files Touched:**
- None (manual test)

---

### T15: Manual Verification - Data Table
**Goal:** Manually verify data table rendering in Anytype [x]

**Steps:**
1. Start Anytype Desktop
2. Open extension popup
3. Navigate to article with data table (CSV-like dataset)
4. Click "Clip Article"
5. Open captured article in Anytype
6. Verify JSON representation is present and valid
7. Verify CSV representation is present (if included)
8. Verify HTML fallback is in collapsible section
9. Expand collapsible section and verify table renders
10. Take screenshots

**Done When:**
- Article clipped successfully
- JSON, CSV, and HTML all present
- Screenshots captured

**Verify:**
- Visual inspection in Anytype
- Validate JSON syntax
- Verify CSV format

**Evidence to Record:**
- Screenshot of JSON representation
- Screenshot of HTML fallback
- JSON/CSV source from captured article

**Files Touched:**
- None (manual test)

---

### T16: Manual Verification - Mixed Tables
**Goal:** Manually verify mixed tables article rendering in Anytype [x]

**Steps:**
1. Start Anytype Desktop
2. Open extension popup
3. Navigate to article with multiple tables (simple + complex)
4. Click "Clip Article"
5. Open captured article in Anytype
6. Verify each table converted correctly based on complexity
7. Verify tables don't interfere with other content (headings, paragraphs, images)
8. Take screenshot

**Done When:**
- Article clipped successfully
- All tables converted appropriately
- Screenshot captured

**Verify:**
- Visual inspection in Anytype
- Compare each table with expected format

**Evidence to Record:**
- Screenshot of full article with mixed tables
- Markdown source showing different table formats

**Files Touched:**
- None (manual test)

---

## Docs

### T17: Update README
**Goal:** Document table preservation feature in user guide [x]

**Steps:**
1. Open `README.md`
2. Add section "Table Preservation" under Features
3. Explain table classification strategy:
   - Simple tables → Markdown
   - Complex tables → HTML
   - Data tables → JSON/CSV + HTML
4. Provide examples of each table type
5. Note limitations (no styling preservation)

**Done When:**
- README updated with table preservation section
- Examples provided
- Limitations documented

**Verify:**
- Review README for clarity
- Verify examples are accurate

**Evidence to Record:**
- Link to updated README section

**Files Touched:**
- `README.md` (modify)

---

### T18: Update CHANGELOG
**Goal:** Document table preservation in changelog [x]

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry under `[Unreleased]` or next version
3. Format: `### Added - Table preservation with intelligent classification (Epic 4.4)`
4. List key features:
   - Simple tables converted to Markdown
   - Complex tables preserved as HTML
   - Data tables extracted as JSON/CSV

**Done When:**
- CHANGELOG updated
- Entry follows existing format

**Verify:**
- Review CHANGELOG for consistency

**Evidence to Record:**
- Link to CHANGELOG entry

**Files Touched:**
- `CHANGELOG.md` (modify)

---

## Verification

### T19: Acceptance Criteria Verification
**Goal:** Verify all acceptance criteria met and document evidence [x]

**Steps:**
1. Review AC11 and AC-T1 through AC-T5 in spec.md
2. Collect evidence from tests and manual verification:
   - AC11: Test results + screenshots from T13-T16
   - AC-T1: Unit tests (T11) + integration tests (T12) + manual test (T13)
   - AC-T2: Unit tests (T11) + integration tests (T12) + manual test (T14)
   - AC-T3: Unit tests (T11) + integration tests (T12) + manual test (T15)
   - AC-T4: Unit tests (T10) + performance benchmark
   - AC-T5: Integration tests (T12) + manual test (T16)
3. Update spec.md EVIDENCE section with links and summaries
4. Verify all criteria met

**Done When:**
- All acceptance criteria verified
- Evidence documented in spec.md
- No gaps in verification

**Verify:**
- Review spec.md EVIDENCE section
- Confirm all ACs have evidence

**Evidence to Record:**
- Updated spec.md with complete EVIDENCE section

**Files Touched:**
- `specs/044-table-preservation/spec.md` (modify EVIDENCE section)

---

## Tracking

### T20: Update SPECS.md
**Goal:** Update specification index with table preservation status [x]

**Steps:**
1. Open `SPECS.md`
2. Find row for Epic 4.4 (Table Preservation)
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Update Evidence link to `specs/044-table-preservation/spec.md#evidence`
6. Update Last Updated timestamp
7. Update progress tracking section

**Done When:**
- SPECS.md row updated
- Progress tracking reflects completion

**Verify:**
- Review SPECS.md for accuracy

**Evidence to Record:**
- Link to updated SPECS.md

**Files Touched:**
- `SPECS.md` (modify)

---

### T21: Update SPEC.md
**Goal:** Update current focus to next epic [x]

**Steps:**
1. Open `SPEC.md`
2. Update Current Focus to next epic (5.0 or as directed)
3. Update Quick Links to new spec folder
4. Update Status

**Done When:**
- SPEC.md points to next epic
- Links are correct

**Verify:**
- Review SPEC.md for accuracy

**Evidence to Record:**
- Link to updated SPEC.md

**Files Touched:**
- `SPEC.md` (modify)

---

**End of Tasks**
