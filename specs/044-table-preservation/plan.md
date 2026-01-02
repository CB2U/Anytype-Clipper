# Implementation Plan: Table Preservation

## Architecture Overview

### Key Components

#### 1. TableDetector
**Responsibility:** Detect all `<table>` elements in HTML content  
**Location:** `src/lib/extractors/table-detector.ts` (new file)  
**Interface:**
```typescript
interface TableDetector {
  detectTables(html: string): HTMLTableElement[];
}
```

#### 2. TableClassifier
**Responsibility:** Classify tables as Simple, Complex, or Data  
**Location:** `src/lib/extractors/table-classifier.ts` (new file)  
**Interface:**
```typescript
enum TableType {
  Simple = 'simple',
  Complex = 'complex',
  Data = 'data'
}

interface TableClassifier {
  classify(table: HTMLTableElement): TableType;
}
```

#### 3. TableConverter
**Responsibility:** Convert tables to appropriate format (Markdown, HTML, JSON/CSV)  
**Location:** `src/lib/extractors/table-converter.ts` (new file)  
**Interface:**
```typescript
interface TableConverter {
  toMarkdown(table: HTMLTableElement): string;
  toHTML(table: HTMLTableElement): string;
  toJSON(table: HTMLTableElement): string; // Helper for data tables
}
```

#### 4. Settings Integration
**Responsibility:** Provide user preference for JSON output
**Location:** `src/options/options.ts` and `src/lib/storage-manager.ts`
**New Setting:** `includeJSONForDataTables` (default: false)
```

#### 4. Turndown Table Rule
**Responsibility:** Integrate table conversion with Turndown  
**Location:** `src/lib/converters/markdown-converter.ts` (modify existing)  
**Integration Point:** Custom Turndown rule for `<table>` elements

### Module Boundaries

```
src/lib/extractors/
├── table-detector.ts       # NEW: Table detection
├── table-classifier.ts     # NEW: Table classification
├── table-converter.ts      # NEW: Table conversion
└── article-extractor.ts    # EXISTING: No changes needed

src/lib/converters/
└── markdown-converter.ts   # MODIFY: Add Turndown table rule

src/types/
└── table.d.ts              # NEW: Table type definitions
```

### Call Flow

```
Article Extraction (Epic 4.0)
  ↓
HTML Content
  ↓
Markdown Converter (Epic 4.1)
  ↓
Turndown Table Rule (NEW)
  ↓
TableDetector.detectTables() → HTMLTableElement[]
  ↓
For each table:
  TableClassifier.classify() → TableType
  ↓
  Switch on TableType:
    - Simple → TableConverter.toMarkdown()
    - Complex → TableConverter.toHTML()
    - Data → TableConverter.toDataFormats()
  ↓
  Return converted string
  ↓
Turndown continues with other elements
  ↓
Final Markdown output
```

### Alternatives Considered

#### Alternative 1: Single Table Processor Class
**Approach:** Combine detection, classification, and conversion in one class  
**Pros:** Simpler module structure, fewer files  
**Cons:** Violates single responsibility principle, harder to test, less flexible  
**Decision:** Rejected in favor of separation of concerns

#### Alternative 2: Always Convert to Markdown
**Approach:** Force all tables to Markdown, even complex ones  
**Pros:** Simpler implementation, consistent output format  
**Cons:** Data loss for complex tables, poor user experience  
**Decision:** Rejected per PRD FR5.5 requirement for complexity-based strategy

#### Alternative 3: Always Preserve as HTML
**Approach:** Keep all tables as HTML blocks  
**Pros:** No data loss, simple implementation  
**Cons:** Poor readability for simple tables, doesn't leverage Anytype's Markdown renderer  
**Decision:** Rejected in favor of intelligent classification

**Chosen Approach:** Separation of concerns with intelligent classification wins because:
- Testable: Each component can be unit tested independently
- Flexible: Easy to adjust classification thresholds or add new table types
- Maintainable: Clear boundaries and responsibilities
- Aligned with PRD: Implements FR5.5 exactly as specified

---

## Data Contracts

### TableMetadata
```typescript
interface TableMetadata {
  rowCount: number;
  columnCount: number;
  hasHeader: boolean;
  hasMergedCells: boolean;
  hasNestedTables: boolean;
  isUniformStructure: boolean;
  cellTypes: CellType[]; // numeric, text, mixed
}
```

### TableClassificationResult
```typescript
interface TableClassificationResult {
  type: TableType;
  confidence: number; // 0-1
  metadata: TableMetadata;
  reason: string; // for debugging
}
```

### TableConversionResult
```typescript
interface TableConversionResult {
  format: 'markdown' | 'html' | 'data';
  content: string;
  metadata?: {
    json?: string;
    csv?: string;
    html?: string;
  };
}
```

---

## Storage and Persistence

No new storage requirements. Table conversion is stateless and happens during article extraction.

---

## External Integrations

### Turndown Library
**Integration Point:** Custom rule for `<table>` elements  
**Modification:** Add table rule to existing Turndown instance in `markdown-converter.ts`  
**Example:**
```typescript
turndownService.addRule('tables', {
  filter: 'table',
  replacement: (content, node) => {
    const table = node as HTMLTableElement;
    const type = tableClassifier.classify(table);
    const includeJSON = settings.get('includeJSONForDataTables'); // Need to inject settings
    
    switch (type) {
      case TableType.Simple:
        return tableConverter.toMarkdown(table);
      case TableType.Complex:
        return tableConverter.toHTML(table);
      case TableType.Data:
         let output = tableConverter.toMarkdown(table); // Default to Markdown
         if (includeJSON) {
           const json = tableConverter.toJSON(table);
           output += `\n\n\`\`\`json\n${json}\n\`\`\``;
         }
         return output;
      default:
        return tableConverter.toHTML(table); // fallback
    }
  }
});
```

#### Fix: Column Header Extraction
**Issue:** Headers sometimes missing in Markdown tables.
**Solution:**
- In `toMarkdown()` and `toJSON()`, check `<thead>` first.
- If empty or undefined, use the first `<tr>` as the header row.
- Ensure all cells in header row are treated as keys.
- Handle empty header cells by generating keys like `Column 1`, `Column 2`.

---

## UX and Operational States

### Table Processing States
1. **Detection:** Scanning HTML for `<table>` elements
2. **Classification:** Analyzing table structure and complexity
3. **Conversion:** Converting to appropriate format
4. **Integration:** Inserting into Markdown output

### User-Facing Behavior
- **No UI changes:** Table processing is transparent to user
- **Debug logging:** Log table count and classification decisions at debug level
- **Error handling:** If table processing fails, fallback to HTML preservation
- **Performance:** Table processing should not noticeably delay article extraction

---

## Testing Plan

### Unit Tests

#### Test File: `tests/unit/table-detector.test.ts`
**Coverage:**
- Detect single table in HTML
- Detect multiple tables in HTML
- Handle HTML with no tables
- Handle malformed HTML gracefully
- Ignore nested tables in initial detection (handled by classifier)

**Example Test:**
```typescript
describe('TableDetector', () => {
  it('should detect all tables in HTML', () => {
    const html = '<div><table><tr><td>A</td></tr></table><table><tr><td>B</td></tr></table></div>';
    const tables = tableDetector.detectTables(html);
    expect(tables).toHaveLength(2);
  });
});
```

---

#### Test File: `tests/unit/table-classifier.test.ts`
**Coverage:**
- Classify simple table (≤6 cols, no merges, <20 rows)
- Classify complex table (>6 cols)
- Classify complex table (merged cells)
- Classify complex table (≥20 rows)
- Classify data table (uniform structure, numeric data)
- Handle edge cases (6 cols exactly, 19 rows exactly)
- Performance benchmark (<100ms per table)

**Example Test:**
```typescript
describe('TableClassifier', () => {
  it('should classify simple table correctly', () => {
    const table = createTableElement(3, 5); // 3 cols, 5 rows
    const result = tableClassifier.classify(table);
    expect(result.type).toBe(TableType.Simple);
  });

  it('should classify complex table with merged cells', () => {
    const table = createTableWithMergedCells();
    const result = tableClassifier.classify(table);
    expect(result.type).toBe(TableType.Complex);
  });
});
```

---

#### Test File: `tests/unit/table-converter.test.ts`
**Coverage:**
- Convert simple table to Markdown
- Convert complex table to HTML
- Convert data table to JSON/CSV + HTML
- Handle missing headers
- Handle irregular row lengths
- Strip HTML tags from cell content
- Normalize whitespace in cells
- Escape pipe characters in Markdown tables

**Example Test:**
```typescript
describe('TableConverter', () => {
  it('should convert simple table to Markdown', () => {
    const table = createSimpleTable();
    const markdown = tableConverter.toMarkdown(table);
    expect(markdown).toContain('| Header 1 | Header 2 |');
    expect(markdown).toContain('|----------|----------|');
  });

  it('should preserve complex table as HTML', () => {
    const table = createComplexTable();
    const html = tableConverter.toHTML(table);
    expect(html).toContain('<table>');
    expect(html).toContain('colspan');
  });
});
```

---

### Integration Tests

#### Test File: `tests/integration/table-extraction.test.ts`
**Coverage:**
- End-to-end: Extract article with simple table → Verify Markdown table in output
- End-to-end: Extract article with complex table → Verify HTML block in output
- End-to-end: Extract article with data table → Verify JSON/CSV + HTML in output
- Mixed article: Multiple tables of different types → Verify each converted correctly
- Turndown integration: Tables + other content (headings, lists) → Verify no interference

**Example Test:**
```typescript
describe('Table Extraction Integration', () => {
  it('should extract article with simple table as Markdown', async () => {
    const html = await readFixture('article-with-simple-table.html');
    const markdown = await articleExtractor.extract(html);
    expect(markdown).toContain('| Header 1 | Header 2 |');
    expect(markdown).not.toContain('<table>');
  });

  it('should preserve complex table as HTML', async () => {
    const html = await readFixture('article-with-complex-table.html');
    const markdown = await articleExtractor.extract(html);
    expect(markdown).toContain('<table>');
    expect(markdown).toContain('colspan');
  });
});
```

**Test Fixtures Required:**
- `article-with-simple-table.html`: Wikipedia-style infobox
- `article-with-complex-table.html`: Financial report with merged headers
- `article-with-data-table.html`: CSV-like dataset
- `article-with-mixed-tables.html`: 2 simple + 1 complex table
- `article-with-malformed-table.html`: Missing `<thead>`, irregular rows

---

### Manual Verification Tests

#### Manual Test 1: Simple Table Rendering
**Steps:**
1. Open Anytype Desktop
2. Use extension to clip article with simple table (e.g., Wikipedia infobox)
3. Open captured article in Anytype
4. Verify table renders as Markdown table (native rendering)
5. Verify headers are bold/distinct
6. Verify column alignment is reasonable

**Expected Result:** Table renders cleanly without HTML tags

---

#### Manual Test 2: Complex Table Rendering
**Steps:**
1. Open Anytype Desktop
2. Use extension to clip financial report with complex table (merged cells, >6 cols)
3. Open captured article in Anytype
4. Verify table renders as HTML block
5. Verify all cells and structure preserved
6. Verify no data loss

**Expected Result:** HTML table renders with full structure intact

---

#### Manual Test 3: Data Table Rendering
**Steps:**
1. Open Anytype Desktop
2. Use extension to clip article with data table (CSV-like dataset)
3. Open captured article in Anytype
4. Verify JSON representation is present and valid
5. Verify CSV representation is present (if included)
6. Verify HTML fallback is in collapsible section
7. Expand collapsible section and verify table renders

**Expected Result:** Both JSON and HTML representations are accessible

---

#### Manual Test 4: Mixed Tables Article
**Steps:**
1. Open Anytype Desktop
2. Use extension to clip article with multiple tables (simple + complex)
3. Open captured article in Anytype
4. Verify each table converted correctly based on complexity
5. Verify tables don't interfere with other content (headings, paragraphs, images)

**Expected Result:** Each table converted appropriately, no content corruption

---

## AC Verification Mapping

### AC11: Tables Preserved Based on Complexity
**Verification:**
- Unit tests: `table-classifier.test.ts` (classification accuracy)
- Integration tests: `table-extraction.test.ts` (end-to-end conversion)
- Manual tests: All 4 manual tests above
- **Evidence:** Test results + screenshots from Anytype

---

### AC-T1: Simple Table Markdown Conversion
**Verification:**
- Unit test: `table-converter.test.ts` → `toMarkdown()` tests
- Integration test: `table-extraction.test.ts` → simple table fixture
- Manual test: Manual Test 1
- **Evidence:** Test results + Markdown output sample

---

### AC-T2: Complex Table HTML Preservation
**Verification:**
- Unit test: `table-converter.test.ts` → `toHTML()` tests
- Integration test: `table-extraction.test.ts` → complex table fixture
- Manual test: Manual Test 2
- **Evidence:** Test results + HTML output sample

---

### AC-T3: Data Table JSON/CSV Extraction
**Verification:**
- Unit test: `table-converter.test.ts` → `toDataFormats()` tests
- Integration test: `table-extraction.test.ts` → data table fixture
- Manual test: Manual Test 3
- **Evidence:** Test results + JSON/CSV output samples

---

### AC-T4: Table Classification Accuracy
**Verification:**
- Unit test: `table-classifier.test.ts` with labeled test corpus (50+ tables)
- Performance benchmark: Measure classification time for 100 tables
- **Evidence:** Test results showing ≥95% accuracy, <100ms per table

---

### AC-T5: Turndown Integration
**Verification:**
- Integration test: `table-extraction.test.ts` → mixed content fixture
- Manual test: Manual Test 4
- **Evidence:** Test results showing tables + other content render correctly

---

## Risks and Mitigations

### Risk: Markdown Table Rendering in Anytype
**Mitigation:** Manual Test 1 will verify early. If rendering fails, adjust Markdown syntax or fallback to HTML.

### Risk: HTML Block Rendering in Anytype
**Mitigation:** Manual Test 2 will verify early. If HTML is sanitized, document limitations and provide JSON/CSV alternative.

### Risk: Table Classification Accuracy
**Mitigation:** Build comprehensive test corpus (50+ tables) and tune thresholds. Target ≥95% accuracy.

### Risk: Performance Impact
**Mitigation:** Benchmark classification (<100ms per table). Optimize if needed. Set total budget <500ms for all tables.

### Risk: Malformed HTML Tables
**Mitigation:** Use DOMParser for robust parsing. Handle missing tags gracefully. Test with real-world malformed tables.

---

## Rollout and Migration Notes

### Rollout Strategy
- **Phase 1:** Implement and test table detection and classification
- **Phase 2:** Implement table conversion (Markdown, HTML, JSON/CSV)
- **Phase 3:** Integrate with Turndown
- **Phase 4:** Manual verification in Anytype
- **Phase 5:** Merge to main

### Migration Notes
- No data migration required (stateless conversion)
- No breaking changes to existing APIs
- Backward compatible: Articles without tables unaffected

### Feature Flag
Not required. Table processing is transparent and has no user-facing toggle (post-MVP feature).

---

## Observability and Debugging

### What Can Be Logged
- Table count per article (debug level)
- Classification decisions per table (type, reason) (debug level)
- Conversion format per table (debug level)
- Performance metrics (classification time, conversion time) (debug level)
- Errors during table processing (error level)

### What Must Never Be Logged
- Full table content (privacy, verbosity)
- User data from tables (privacy)
- API keys or sensitive metadata (security)

### Debug Output Example
```
[DEBUG] Table processing: Detected 3 tables in article
[DEBUG] Table 1: Classified as Simple (3 cols, 8 rows, no merges) → Markdown
[DEBUG] Table 2: Classified as Complex (12 cols, merged headers) → HTML
[DEBUG] Table 3: Classified as Data (4 cols, 15 rows, uniform) → JSON/CSV
[DEBUG] Table processing completed in 245ms
```

---

**End of Implementation Plan**
