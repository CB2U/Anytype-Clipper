# Specification: Table Preservation

## Header

- **Title:** Table Preservation
- **Roadmap Anchor:** [roadmap.md 4.4](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L511-L531)
- **Priority:** P1
- **Type:** Feature
- **Target Area:** Content extraction and conversion
- **Target Acceptance Criteria:** AC11, AC-T3
- **Configuration:** New setting `includeJSONForDataTables` (boolean)

---

### Evidence
- **Unit Tests**:
  - `TableMapper.map` correctly handles simple and complex tables.
  - `TableClassifier` correctly identifies data tables handles formatted numbers.
- **Integration Tests**:
  - `table-extraction.test.ts` verifies end-to-end table preservation.
  - `worldometer-repro.test.ts` (passed) verified Data Table classification and conversion.
- **Debug Verification**:
  - Validated Worldometers header extraction using local HTML fixture; headers were correctly extracted in Node/JSDOM environment.
  - Implemented `DataTableFormat` options (Markdown, JSON, Both) in Settings and Converters.
- **Manual Verification**:
  - See `tests/manual/options-verification.md` for Options testing plan.

## Problem Statement

When capturing articles with tables, the current Markdown conversion process (Epic 4.1) does not intelligently handle table complexity. Tables are either lost entirely or converted to plain text, losing their structural information. Users need tables to be preserved in a readable format that maintains data relationships and renders correctly in Anytype.

Tables vary widely in complexity:
- **Simple tables:** Basic data grids with uniform columns and rows
- **Complex tables:** Multi-level headers, merged cells, nested structures
- **Data tables:** Structured data that could be represented as JSON/CSV

Without intelligent table preservation, users lose critical information when clipping technical documentation, research papers, financial reports, and data-heavy articles.

---

## Goals and Non-Goals

### Goals

- Detect and classify tables by complexity during article extraction
- Convert simple tables to Markdown table syntax for native Anytype rendering
- Preserve complex tables as HTML blocks within Markdown to maintain structure
- Extract data from data tables as JSON/CSV with HTML fallback for reference
- Ensure table classification is accurate and fast (<100ms per table)
- Maintain table readability in Anytype's Markdown renderer

### Non-Goals

- Interactive table editing within the extension (post-MVP)
- Table styling preservation (colors, borders, fonts) beyond basic structure
- Automatic table data analysis or visualization (post-MVP)
- User-configurable table strategy preferences (post-MVP, see roadmap)
- OCR or image-based table extraction
- Real-time table preview during capture

---

## User Stories

### US1: Capture Technical Documentation with Simple Tables

**As a** developer capturing API documentation,  
**I want** simple parameter tables to be converted to clean Markdown tables,  
**So that** I can read them natively in Anytype without HTML clutter.

**Acceptance:**
- Tables with ≤6 columns, no merged cells, <20 rows convert to Markdown
- Markdown tables render correctly in Anytype
- Column alignment preserved where possible
- Headers clearly distinguished from data rows

---

### US2: Preserve Complex Financial Tables

**As a** financial analyst saving quarterly reports,  
**I want** complex tables with merged headers and multi-level structures to be preserved as HTML,  
**So that** I don't lose critical data relationships and can reference the exact layout.

**Acceptance:**
- Tables with >6 columns, merged cells, or ≥20 rows preserved as HTML
- HTML blocks render within Markdown in Anytype
- All cell content and structure preserved
- No data loss during conversion

---

### US3: Extract Structured Data Tables

**As a** researcher capturing datasets,  
**I want** data tables to be extracted as JSON/CSV with HTML fallback,  
**So that** I can programmatically process the data or reference it in readable format.

**Acceptance:**
- Tables identified as data tables (uniform structure, numeric/categorical data)
- JSON/CSV representation generated and included
- HTML fallback provided for visual reference
- Both representations included in captured article

---

## Scope

### In-Scope

- Table detection in extracted HTML content
- Table complexity classification algorithm
- Simple table → Markdown table conversion
- Complex table → HTML block preservation
- Data table → JSON/CSV + HTML conversion
- Integration with existing Markdown converter (Turndown)
- Table classification performance optimization
- Unit tests for table detection and classification
- Integration tests for table conversion flows

### Out-of-Scope

- User-configurable option for Data Table JSON representation
- Table styling preservation (CSS, colors, borders) - not supported by Anytype Markdown
- Interactive table editing - post-MVP feature
- Table data visualization - post-MVP feature
- OCR or image-based table extraction - not in PRD scope
- Real-time table preview - performance constraint
- Custom CSS selectors for table exclusion - covered in FR13.17 (post-MVP)

---

## Requirements

### Functional Requirements

#### FR-T1: Table Detection
- **Description:** Detect all `<table>` elements in extracted HTML content
- **Priority:** P0
- **Rationale:** Foundation for all table processing
- **Dependencies:** Epic 4.0 (Readability Integration), Epic 4.1 (Markdown Conversion)

#### FR-T2: Table Classification
- **Description:** Classify each table as Simple, Complex, or Data based on:
  - **Simple:** ≤6 columns, no merged cells (colspan/rowspan), <20 rows, no nested tables
  - **Complex:** >6 columns, merged cells, ≥20 rows, or nested tables
  - **Data:** Uniform structure, primarily numeric/categorical data, ≥3 rows
- **Priority:** P0
- **Rationale:** Determines conversion strategy per table
- **Dependencies:** FR-T1

#### FR-T3: Simple Table Conversion
- **Description:** Convert simple tables to Markdown table syntax
- **Format:**
  ```markdown
  | Header 1 | Header 2 | Header 3 |
  |----------|----------|----------|
  | Cell 1   | Cell 2   | Cell 3   |
  | Cell 4   | Cell 5   | Cell 6   |
  ```
- **Priority:** P0
- **Rationale:** Native Anytype rendering for clean, readable tables
- **Dependencies:** FR-T2

#### FR-T4: Complex Table Preservation
- **Description:** Preserve complex tables as HTML blocks within Markdown
- **Format:**
  ```markdown
  <table>
    <thead>...</thead>
    <tbody>...</tbody>
  </table>
  ```
- **Priority:** P0
- **Rationale:** Maintains structure for tables that can't be represented in Markdown
- **Dependencies:** FR-T2

#### FR-T5: Data Table Extraction
- **Description:** Convert data tables to Markdown by default, with optional JSON representation
- **Default Format:** Markdown table (same as FR-T3)
- **Optional Format:** JSON block appended if `includeJSONForDataTables` setting is enabled
- **Priority:** P1
- **Rationale:** Markdown is best for general readability; JSON is useful for programmatic access when needed
- **Dependencies:** FR-T2, FR-T3, new User Setting

#### FR-T6: Turndown Integration
- **Description:** Integrate table conversion logic with Turndown Markdown converter
- **Priority:** P0
- **Rationale:** Seamless integration with existing conversion pipeline
- **Dependencies:** Epic 4.1 (Markdown Conversion), FR-T3, FR-T4, FR-T5

### Non-Functional Requirements

#### NFR-T1: Performance
- **Description:** Table classification must complete within 100ms per table
- **Priority:** P0
- **Rationale:** Avoid blocking article extraction (NFR1.2: <5s total)
- **Measurement:** Unit test benchmarks
- **Dependencies:** None

#### NFR-T2: Accuracy
- **Description:** Table classification must be ≥95% accurate on test corpus
- **Priority:** P1
- **Rationale:** Incorrect classification leads to poor user experience
- **Measurement:** Integration tests with diverse table samples
- **Dependencies:** None

#### NFR-T3: Robustness
- **Description:** Handle malformed tables gracefully (missing headers, irregular rows)
- **Priority:** P1
- **Rationale:** Real-world HTML is often invalid or inconsistent
- **Measurement:** Edge case tests
- **Dependencies:** None

### Constraints Checklist

- ✅ **Security:** No external API calls, all processing local
- ✅ **Privacy:** No table data logged or transmitted
- ✅ **Offline Behavior:** Fully offline, no network dependencies
- ✅ **Performance:** Classification <100ms per table, total extraction <5s
- ✅ **Observability:** Log table classification decisions (count, types) at debug level

---

## Acceptance Criteria

### AC11: Tables Preserved Based on Complexity
**Source:** PRD AC11

**Criteria:**
1. Simple tables (≤6 cols, no merges, <20 rows) convert to Markdown tables
2. Complex tables (>6 cols, merges, ≥20 rows) preserved as HTML blocks
3. Data tables convert to Markdown table by default; JSON included if setting enabled
4. All table types render correctly in Anytype
5. Table classification is accurate (≥95% on test corpus)

**Verification Approach:**
- **Unit Tests:** Table detection, classification algorithm, conversion functions
- **Integration Tests:** End-to-end table conversion for each type
- **Manual Tests:** Clip articles with diverse tables, verify rendering in Anytype

**Test Scenarios:**
1. **Simple Table:** Wikipedia infobox (3 cols, 8 rows) → Markdown table
2. **Complex Table:** Financial quarterly report (12 cols, merged headers) → HTML block
3. **Data Table:** CSV-like dataset (4 cols, 15 rows, numeric data) → Markdown table (+ JSON if enabled)
4. **Mixed Article:** Article with 2 simple + 1 complex table → Correct conversion for each
5. **Malformed Table:** Missing `<thead>`, irregular row lengths → Graceful fallback

---

### AC-T1: Simple Table Markdown Conversion
**Criteria:**
- Tables with ≤6 columns, no colspan/rowspan, <20 rows convert to Markdown
- Headers extracted from `<thead>` or first `<tr>`
- Cell content cleaned (strip HTML tags, normalize whitespace)
- Pipe-delimited format with header separator row
- Empty cells represented as empty strings between pipes

**Verification Approach:**
- Unit test: `TableConverter.toMarkdown()` with simple table HTML
- Integration test: Clip article with simple table, verify Markdown output
- Manual test: Verify rendering in Anytype

---

### AC-T2: Complex Table HTML Preservation
**Criteria:**
- Tables with >6 columns, colspan/rowspan, ≥20 rows, or nested tables preserved as HTML
- HTML cleaned (remove scripts, styles, event handlers)
- HTML block wrapped in Markdown code fence or raw HTML block
- All cell content and structure preserved exactly

**Verification Approach:**
- Unit test: `TableConverter.toHTML()` with complex table HTML
- Integration test: Clip article with complex table, verify HTML output
- Manual test: Verify rendering in Anytype

---

### AC-T3: Data Table Conversion Strategy
**Criteria:**
- Tables identified as data tables (uniform structure, ≥3 rows, primarily numeric/categorical)
- **Default Behavior:** Convert to Markdown table (same as Simple Table)
- **With Option Enabled:** Append JSON representation below the Markdown table
- JSON format: Array of objects with headers as keys
- **Bug Fix:** Ensure column headers are populated correctly even if `<thead>` is missing (fallback to first row)

**Verification Approach:**
- Unit test: `TableConverter.toDataFormats()` (or updated method) with and without flag
- Integration test: Clip article with data table, verify Markdown output
- Manual test: Toggle setting in Options, verify output in Anytype

---

### AC-T4: Table Classification Accuracy
**Criteria:**
- Classification algorithm achieves ≥95% accuracy on test corpus
- Test corpus includes 50+ tables: 20 simple, 20 complex, 10 data
- Edge cases handled: missing headers, irregular rows, nested tables
- Classification completes within 100ms per table

**Verification Approach:**
- Unit test: `TableClassifier.classify()` with labeled test corpus
- Performance benchmark: Measure classification time for 100 tables
- Integration test: End-to-end classification in article extraction flow

---

### AC-T5: Turndown Integration
**Criteria:**
- Table conversion integrated with Turndown via custom rule
- Tables processed before other Markdown conversion
- Table conversion does not interfere with other Turndown rules
- Final Markdown output includes all tables in correct format

**Verification Approach:**
- Integration test: Clip article with tables + other content (headings, lists, images)
- Verify tables converted correctly without affecting other elements
- Manual test: Verify complete article rendering in Anytype

---

## Dependencies

### Epic Dependencies
- **4.0 Readability Integration:** Provides extracted HTML content
- **4.1 Markdown Conversion:** Turndown library and conversion pipeline

### Technical Dependencies
- **Turndown:** Markdown conversion library (already integrated)
- **DOMParser:** HTML parsing (browser API, no external dependency)
- **TypeScript:** Type definitions for table structures

### Data Dependencies
- Extracted HTML content from Readability or fallback extractors
- Table HTML must be valid enough to parse (handle malformed gracefully)

---

## Risks and Mitigations

### Risk 1: Markdown Table Rendering in Anytype
**Description:** Anytype may not support all Markdown table features (alignment, complex formatting)  
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Test Markdown table rendering in Anytype early
- Use simplest Markdown table syntax (pipes and dashes)
- Fallback to HTML if Markdown rendering fails
- Document limitations in user guide

---

### Risk 2: HTML Block Rendering in Anytype
**Description:** Anytype may sanitize or block HTML tables for security  
**Likelihood:** Low  
**Impact:** High  
**Mitigation:**
- Test HTML table rendering in Anytype early
- Use minimal HTML (no scripts, styles, event handlers)
- Provide alternative representation (JSON/CSV) for data tables
- Document HTML rendering limitations

---

### Risk 3: Table Classification Accuracy
**Description:** Classification algorithm may misclassify edge cases (e.g., 6-column table with one merged cell)  
**Likelihood:** Medium  
**Impact:** Low  
**Mitigation:**
- Build comprehensive test corpus with edge cases
- Tune classification thresholds based on test results
- Provide debug logging for classification decisions
- Allow manual retry if user is unsatisfied (FR5.11)

---

### Risk 4: Performance Impact
**Description:** Complex table processing may slow down article extraction  
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Optimize classification algorithm (avoid DOM traversal overhead)
- Cache classification results per table
- Set performance budget: <100ms per table, <500ms total for all tables
- Benchmark with articles containing 10+ tables

---

### Risk 5: Malformed HTML Tables
**Description:** Real-world tables may have invalid HTML (missing tags, irregular structure)  
**Likelihood:** High  
**Impact:** Low  
**Mitigation:**
- Use browser's DOMParser for robust HTML parsing
- Handle missing `<thead>`, `<tbody>` gracefully
- Normalize irregular row lengths (pad with empty cells)
- Fallback to HTML preservation if parsing fails
- Test with real-world malformed tables

---

## Open Questions

None. All requirements are clear and aligned with PRD FR5.5 and AC11.

---

## EVIDENCE

*This section will be populated during implementation with verification evidence for each acceptance criterion.*

### AC11: Tables Preserved Based on Complexity
- Verified by `tests/integration/table-extraction.test.ts`
- Success: Simple tables convert to Markdown, Complex to HTML, Data to JSON/CSV + Markdown (fallback).
- Automated tests pass.

### AC-T1: Simple Table Markdown Conversion
- Verified by `tests/unit/table-converter.test.ts` and `tests/integration/table-extraction.test.ts` (simple table case).
- Output contains correct Markdown table syntax with pipes and separator row.

### AC-T2: Complex Table HTML Preservation
- Verified by `tests/unit/table-converter.test.ts` and `tests/integration/table-extraction.test.ts` (complex table case).
- Output preserves HTML structure including merged cells.
- Sanitization verified in unit tests.

### AC-T3: Data Table JSON/CSV Extraction
- Verified by `tests/unit/table-converter.test.ts` and `tests/integration/table-extraction.test.ts` (data table case).
- Output includes JSON, CSV, and Markdown fallback (visible in Anytype).

### AC-T4: Table Classification Accuracy
- Verified by `tests/unit/table-classifier.test.ts`.
- Tests cover Simple, Complex, Data, and Mixed scenarios.
- Performance benchmark passed (<100ms per table).

### AC-T5: Turndown Integration
- Verified by `tests/integration/table-extraction.test.ts`.
- Custom Turndown rule correctly intercepts tables and applies conversion.
- Other Markdown content verified to remain intact.
- **Regression Verified**: Worldometers population table (234 rows) correctly classified as Data Table after fixing numeric detection (handles commas, %, $).

---

**End of Specification**
