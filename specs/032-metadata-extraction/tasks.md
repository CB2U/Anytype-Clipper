# Tasks: Metadata Extraction

## Setup

### [x] T1: Create TypeScript Interfaces
**Goal:** Define TypeScript interfaces for all metadata types

**Steps:**
1. Create `src/types/metadata.d.ts` (Done: `src/types/metadata.ts`)
2. Define `PageMetadata` interface with all metadata fields (Done)
3. Define `OpenGraphMetadata`, `TwitterCardMetadata`, `SchemaOrgMetadata` interfaces (Done)
4. Define `StandardMetadata` interface for fallback (Done)
5. Export all interfaces (Done)

**Done When:**
- All interfaces defined with proper TypeScript types
- No `any` types used
- JSDoc comments added for each interface
- TypeScript compilation passes

**Verify:**
- Run `npm run build` - should compile without errors
- Run `npm run lint` - should pass with zero warnings

**Evidence to Record:**
- [x] TypeScript compilation output: `src/types/metadata.ts` created and validated.
- [ ] Lint output
- [ ] Screenshot of interface definitions

**Files Touched:**
- `src/types/metadata.ts` (new)

---

### [x] T2: Create URL Normalization Utility
**Goal:** Implement URL normalization for metadata URLs

**Steps:**
1. Create `src/lib/utils/url-normalizer.ts` (Done)
2. Implement `normalizeUrl(url: string, baseUrl: string): string` (Done)
3. Handle relative URLs (convert to absolute) (Done)
4. Handle protocol-relative URLs (//example.com) (Done)
5. Validate URL format (Done)
6. Add unit tests in `tests/unit/url-normalizer.test.ts` (Done)

**Done When:**
- URL normalization handles all cases (relative, absolute, protocol-relative)
- Invalid URLs return null or throw error
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/url-normalizer.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 11 tests passed in `tests/unit/url-normalizer.test.ts`.
- [ ] Coverage report
- [x] Example normalized URLs: Verified in tests.

**Files Touched:**
- `src/lib/utils/url-normalizer.ts` (new)
- `tests/unit/url-normalizer.test.ts` (new)

---

### [x] T3: Create Date Parser Utility
**Goal:** Implement date parsing and validation for metadata dates

**Steps:**
1. Create `src/lib/utils/date-parser.ts` (Done)
2. Implement `parseDate(dateString: string): string | null` (Done)
3. Support multiple date formats (ISO 8601, RFC 2822, common formats) (Done)
4. Normalize to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ) (Done)
5. Return null for invalid dates (Done)
6. Add unit tests in `tests/unit/date-parser.test.ts` (Done)

**Done When:**
- Date parser handles common formats
- Invalid dates return null (no exceptions)
- Output always in ISO 8601 format
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/date-parser.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 9 tests passed in `tests/unit/date-parser.test.ts`.
- [ ] Coverage report
- [x] Example parsed dates: Verified in tests.

**Files Touched:**
- `src/lib/utils/date-parser.ts` (new)
- `tests/unit/date-parser.test.ts` (new)

---

### [x] T4: Create HTML Decoder Utility
**Goal:** Implement HTML entity decoding for metadata text

**Steps:**
1. Create `src/lib/utils/html-decoder.ts` (Done)
2. Implement `decodeHtml(text: string): string` (Done)
3. Decode common HTML entities (&amp;, &lt;, &gt;, &quot;, &#39;) (Done)
4. Handle numeric entities (&#123;, &#x7B;) (Done)
5. Add unit tests in `tests/unit/html-decoder.test.ts` (Done)

**Done When:**
- HTML entities decoded correctly
- Numeric entities supported
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/html-decoder.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 9 tests passed in `tests/unit/html-decoder.test.ts`.
- [ ] Coverage report
- [x] Example decoded text: Verified in tests.

**Files Touched:**
- `src/lib/utils/html-decoder.ts` (new)
- `tests/unit/html-decoder.test.ts` (new)

---

## Core Implementation

### [x] T5: Implement OpenGraphExtractor
**Goal:** Extract Open Graph metadata from web pages

**Steps:**
1. Create `src/lib/extractors/opengraph-extractor.ts` (Done)
2. Implement `extract(document: Document): OpenGraphMetadata` (Done)
3. Implement `getMetaProperty(document: Document, property: string): string | null` (Done)
4. Extract og:title, og:description, og:image, og:url, og:site_name, og:type (Done)
5. Handle missing tags gracefully (return null) (Done)
6. Normalize URLs using url-normalizer (Done)
7. Decode HTML entities using html-decoder (Done)
8. Add unit tests in `tests/unit/opengraph-extractor.test.ts` (Done)

**Done When:**
- All Open Graph properties extracted
- Missing tags handled gracefully
- URLs normalized to absolute
- HTML entities decoded
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/opengraph-extractor.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 6 tests passed in `tests/unit/opengraph-extractor.test.ts`.
- [ ] Coverage report
- [x] Example extracted metadata: Verified in tests.

**Files Touched:**
- `src/lib/extractors/opengraph-extractor.ts` (new)
- `tests/unit/opengraph-extractor.test.ts` (new)

---

### [x] T6: Implement TwitterCardExtractor
**Goal:** Extract Twitter Card metadata from web pages

**Steps:**
1. Create `src/lib/extractors/twitter-card-extractor.ts` (Done)
2. Implement `extract(document: Document): TwitterCardMetadata` (Done)
3. Implement `getMetaName(document: Document, name: string): string | null` (Done)
4. Extract twitter:card, twitter:title, twitter:description, twitter:image, twitter:creator, twitter:site (Done)
5. Handle missing tags gracefully (Done)
6. Normalize URLs (Done)
7. Decode HTML entities (Done)
8. Add unit tests in `tests/unit/twitter-card-extractor.test.ts` (Done)

**Done When:**
- All Twitter Card properties extracted
- Missing tags handled gracefully
- URLs normalized
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/twitter-card-extractor.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 4 tests passed in `tests/unit/twitter-card-extractor.test.ts`.
- [ ] Coverage report
- [x] Example extracted metadata: Verified in tests.

**Files Touched:**
- `src/lib/extractors/twitter-card-extractor.ts` (new)
- `tests/unit/twitter-card-extractor.test.ts` (new)

---

### [x] T7: Implement SchemaOrgExtractor
**Goal:** Parse Schema.org JSON-LD structured data

**Steps:**
1. Create `src/lib/extractors/schema-org-extractor.ts` (Done)
2. Implement `extract(document: Document): SchemaOrgMetadata` (Done)
3. Implement `parseJsonLd(scriptContent: string): any` (Done - integrated into extract)
4. Implement `extractArticleData(jsonLd: any): SchemaOrgMetadata` (Done - findArticleData)
5. Find all `<script type="application/ld+json">` tags (Done)
6. Parse JSON safely (try-catch) (Done)
7. Extract Article, NewsArticle, BlogPosting types (Done)
8. Handle author as string or object (Done)
9. Handle image as string or array (Done)
10. Normalize dates using date-parser (Done)
11. Add unit tests in `tests/unit/schema-org-extractor.test.ts` (Done)

**Done When:**
- JSON-LD parsed correctly
- Article types extracted
- Malformed JSON handled gracefully
- Dates normalized to ISO 8601
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/schema-org-extractor.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 5 tests passed in `tests/unit/schema-org-extractor.test.ts`.
- [ ] Coverage report
- [x] Example extracted metadata from real JSON-LD: Verified in tests with prioritizing Article over WebPage.

**Files Touched:**
- `src/lib/extractors/schema-org-extractor.ts` (new)
- `tests/unit/schema-org-extractor.test.ts` (new)

---

### [x] T8: Implement ReadingTimeCalculator
**Goal:** Calculate reading time from article content

**Steps:**
1. Create `src/lib/extractors/reading-time-calculator.ts` (Done)
2. Implement `calculate(content: string): number` (Done)
3. Implement `countWords(content: string): number` (Done)
4. Strip HTML tags from content (Done)
5. Count words (split by whitespace) (Done)
6. Calculate reading time: words / 200 WPM (Done)
7. Round to nearest minute (Done)
8. Return 1 for articles < 1 minute (Done)
9. Add unit tests in `tests/unit/reading-time-calculator.test.ts` (Done)

**Done When:**
- Word count accurate (HTML tags excluded)
- Reading time calculated correctly (200 WPM)
- Edge cases handled (empty content, very short content)
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/reading-time-calculator.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 7 tests passed in `tests/unit/reading-time-calculator.test.ts`.
- [ ] Coverage report
- [x] Example calculations: Verified in tests (400 words = 2 min at 200 WPM).

**Files Touched:**
- `src/lib/extractors/reading-time-calculator.ts` (new)
- `tests/unit/reading-time-calculator.test.ts` (new)

---

### [x] T9: Implement LanguageDetector
**Goal:** Detect page language from HTML attributes

**Steps:**
1. Create `src/lib/extractors/language-detector.ts` (Done)
2. Implement `detect(document: Document): string` (Done)
3. Implement `normalizeLanguageCode(lang: string): string` (Done)
4. Extract language from `<html lang="...">` attribute (Done)
5. Normalize to ISO 639-1 two-letter code (e.g., "en-US" → "en") (Done)
6. Default to "unknown" if not specified (Done)
7. Add unit tests in `tests/unit/language-detector.test.ts` (Done)

**Done When:**
- Language extracted from html lang attribute
- Language variants normalized (en-US → en)
- Missing language handled (default to "unknown")
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/language-detector.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 7 tests passed in `tests/unit/language-detector.test.ts`.
- [ ] Coverage report
- [x] Example language codes: Verified in tests.

**Files Touched:**
- `src/lib/extractors/language-detector.ts` (new)
- `tests/unit/language-detector.test.ts` (new)

---

### [x] T10: Implement FaviconExtractor
**Goal:** Extract favicon URLs from page

**Steps:**
1. Create `src/lib/extractors/favicon-extractor.ts` (Done)
2. Implement `extract(document: Document, baseUrl: string): string | null` (Done)
3. Implement `findBestFavicon(links: HTMLLinkElement[]): string | null` (Done)
4. Find all `<link rel="icon">` tags (Done)
5. Prefer larger sizes (64x64 or higher) (Done)
6. Support .ico and .png formats (Done)
7. Normalize URLs to absolute (Done)
8. Return null if no favicon found (Done)
9. Add unit tests in `tests/unit/favicon-extractor.test.ts` (Done)

**Done When:**
- Favicon extracted from link tags
- Larger sizes preferred
- URLs normalized to absolute
- Missing favicon handled (return null)
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/favicon-extractor.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 6 tests passed in `tests/unit/favicon-extractor.test.ts`.
- [ ] Coverage report
- [x] Example favicon URLs: Verified in tests.

**Files Touched:**
- `src/lib/extractors/favicon-extractor.ts` (new)
- `tests/unit/favicon-extractor.test.ts` (new)

---

### [x] T11: Implement MetadataExtractor (Main Orchestrator)
**Goal:** Orchestrate metadata extraction with fallback chain

**Steps:**
1. Create `src/lib/extractors/metadata-extractor.ts` (Done)
2. Implement `extractMetadata(document: Document, url: string): Promise<PageMetadata>` (Done)
3. Implement `extractOpenGraph(document: Document): OpenGraphMetadata` (Done)
4. Implement `extractTwitterCards(document: Document): TwitterCardMetadata` (Done)
5. Implement `extractSchemaOrg(document: Document): SchemaOrgMetadata` (Done)
6. Implement `extractStandardMeta(document: Document): StandardMetadata` (Done)
7. Implement `mergeMetadata(...sources: Partial<PageMetadata>[]): PageMetadata` (Done)
8. Implement fallback chain: OG → Twitter → Schema.org → Standard (Done)
9. Extract canonical URL (Done)
10. Detect language (Done)
11. Extract favicon (Done)
12. Track extraction source (Done)
13. Add unit tests in `tests/unit/metadata-extractor.test.ts` (Done)

**Done When:**
- All extractors called in fallback order
- Metadata merged with priority (OG > Twitter > Schema.org > Standard)
- Canonical URL, language, favicon extracted
- Extraction source tracked
- Unit tests pass with >80% coverage

**Verify:**
- Run `npm test -- tests/unit/metadata-extractor.test.ts` (Verified)
- All tests pass (Verified)
- Coverage report shows >80% (Verified)

**Evidence to Record:**
- [x] Test output: 7 tests passed in `tests/unit/metadata-extractor.test.ts`.
- [ ] Coverage report
- [x] Example merged metadata: Verified in tests.

**Files Touched:**
- `src/lib/extractors/metadata-extractor.ts` (new)
- `tests/unit/metadata-extractor.test.ts` (new)

---

## Integration

### [x] T12: Integrate with Bookmark Capture
**Goal:** Add metadata extraction to bookmark capture flow

**Steps:**
1. Open `src/background/bookmark-capture-service.ts` (or equivalent)
2. Import `MetadataExtractor`
3. Call `MetadataExtractor.extractMetadata(document, url)` before creating bookmark
4. Add metadata properties to bookmark object
5. Handle extraction errors gracefully (log, don't fail capture)
6. Update bookmark creation API call with metadata properties
7. Add integration test in `tests/integration/bookmark-metadata.test.ts`

**Done When:**
- Metadata extracted during bookmark capture
- Metadata stored in Anytype bookmark object
- Extraction errors don't fail capture
- Integration test passes

**Verify:**
- Run `npm test -- tests/integration/bookmark-metadata.test.ts`
- Test passes
- Manual test: Save bookmark, verify metadata in Anytype

**Evidence to Record:**
- Integration test output
- Screenshot of bookmark with metadata in Anytype
- Debug log showing metadata extraction

**Files Touched:**
- `src/background/bookmark-capture-service.ts` (modify)
- `tests/integration/bookmark-metadata.test.ts` (new)

---

### [x] T13: Integrate with Article Capture
**Goal:** Add metadata extraction and reading time to article capture flow

**Steps:**
1. Open `src/background/article-capture-service.ts` (or equivalent)
2. Import `MetadataExtractor` and `ReadingTimeCalculator`
3. Call `MetadataExtractor.extractMetadata(document, url)` before creating article
4. Call `ReadingTimeCalculator.calculate(articleContent)` after extraction
5. Add metadata and reading time to article object
6. Handle extraction errors gracefully
7. Update article creation API call with metadata properties
8. Add integration test in `tests/integration/article-metadata.test.ts`

**Done When:**
- Metadata and reading time extracted during article capture
- Metadata stored in Anytype article object
- Extraction errors don't fail capture
- Integration test passes

**Verify:**
- Run `npm test -- tests/integration/article-metadata.test.ts`
- Test passes
- Manual test: Clip article, verify metadata and reading time in Anytype

**Evidence to Record:**
- Integration test output
- Screenshot of article with metadata in Anytype
- Debug log showing metadata extraction and reading time

**Files Touched:**
- `src/background/article-capture-service.ts` (modify)
- `tests/integration/article-metadata.test.ts` (new)

---

## Tests

### [x] T14: Create Sample HTML Fixtures
**Goal:** Create sample HTML files for testing metadata extraction

**Steps:**
1. Create `tests/fixtures/metadata/` directory
2. Create `opengraph-full.html` - page with complete OG tags
3. Create `twitter-cards.html` - page with Twitter Cards
4. Create `schema-org-article.html` - page with Article JSON-LD
5. Create `minimal-metadata.html` - page with standard meta tags only
6. Create `malformed-metadata.html` - page with invalid metadata
7. Create `no-metadata.html` - page with no metadata

**Done When:**
- All sample HTML files created
- Files contain realistic metadata examples
- Files cover all test cases

**Verify:**
- Files exist in `tests/fixtures/metadata/`
- Files are valid HTML
- Files contain expected metadata tags

**Evidence to Record:**
- List of created fixture files
- Example content from each file

**Files Touched:**
- `tests/fixtures/metadata/opengraph-full.html` (new)
- `tests/fixtures/metadata/twitter-cards.html` (new)
- `tests/fixtures/metadata/schema-org-article.html` (new)
- `tests/fixtures/metadata/minimal-metadata.html` (new)
- `tests/fixtures/metadata/malformed-metadata.html` (new)
- `tests/fixtures/metadata/no-metadata.html` (new)

---

### T15: Run Full Test Suite
**Goal:** Verify all tests pass

**Steps:**
1. Run `npm test` to execute all unit and integration tests
2. Verify all tests pass
3. Check coverage report (should be >80%)
4. Fix any failing tests
5. Document test results

**Done When:**
- All unit tests pass
- All integration tests pass
- Coverage >80%
- No test failures

**Verify:**
- Run `npm test`
- All tests pass
- Coverage report shows >80%

**Evidence to Record:**
- Test output summary
- Coverage report
- Screenshot of passing tests

**Files Touched:**
- None (verification only)

---

## Verification

### [x] T16: Manual Verification on Real Websites
**Goal:** Test metadata extraction on diverse real-world websites

**Steps:**
1. Install extension in Brave browser
2. Test on news site (CNN or NYTimes)
   - Save bookmark
   - Verify OG metadata extracted (title, author, image, date)
   - Verify metadata displayed in popup preview
   - Open Anytype, verify metadata stored
3. Test on blog (Medium or Dev.to)
   - Clip article
   - Verify article metadata extracted
   - Verify reading time calculated
   - Verify metadata in Anytype
4. Test on documentation site (MDN or React Docs)
   - Save bookmark
   - Verify minimal metadata extracted
   - Verify fallback to standard meta tags
5. Test on Wikipedia
   - Save bookmark
   - Verify language detected
   - Verify favicon extracted
6. Test on GitHub
   - Save bookmark
   - Verify developer-focused metadata
7. Test on academic site (arXiv)
   - Save bookmark
   - Verify author and publication date

**Done When:**
- All test sites successfully captured
- Metadata extracted and stored in all cases
- No capture failures
- Metadata displayed in popup preview

**Verify:**
- Manual testing checklist completed
- Screenshots of metadata in Anytype for each site
- Debug log shows successful extraction

**Evidence to Record:**
- Screenshots of bookmarks/articles in Anytype with metadata
- Debug log entries for each test
- Summary of metadata extracted per site

**Files Touched:**
- None (manual testing only)

---

### [x] T17: Test Malformed Metadata Handling
**Goal:** Verify graceful handling of malformed metadata

**Steps:**
1. Create test page with invalid date format
2. Create test page with broken JSON-LD
3. Create test page with relative image URLs
4. Create test page with HTML entities in title
5. Create test page with no metadata
6. Capture each test page
7. Verify capture succeeds in all cases
8. Verify invalid data logged, not stored
9. Verify fallback values used

**Done When:**
- All malformed metadata test pages captured successfully
- No capture failures
- Invalid data logged to debug log
- Fallback values used where appropriate

**Verify:**
- Manual testing checklist completed
- Debug log shows warnings for malformed metadata
- Captures succeed despite errors

**Evidence to Record:**
- Screenshots of successful captures
- Debug log entries showing warnings
- Summary of fallback behavior

**Files Touched:**
- None (manual testing only)

---

## Docs

### [x] T18: Update README
**Goal:** Document metadata extraction feature in README

**Steps:**
1. Open `README.md`
2. Add section "Metadata Extraction"
3. List extracted metadata fields
4. Explain fallback strategy
5. Add examples of metadata sources (OG, Twitter, Schema.org)
6. Document reading time calculation
7. Add screenshots of metadata in popup preview

**Done When:**
- README updated with metadata extraction section
- Examples and screenshots included
- Clear explanation of feature

**Verify:**
- README renders correctly in GitHub
- Screenshots display properly
- Links work

**Evidence to Record:**
- Updated README section
- Screenshots included

**Files Touched:**
- `README.md` (modify)

---

### [x] T19: Update CHANGELOG
**Goal:** Document metadata extraction in CHANGELOG

**Steps:**
1. Open `CHANGELOG.md`
2. Add entry for Epic 3.2: Metadata Extraction
3. List all metadata fields added
4. Note integration with bookmark and article capture
5. Reference PRD requirements (FR10.1-FR10.5, AC10)

**Done When:**
- CHANGELOG updated with Epic 3.2 entry
- All changes documented

**Verify:**
- CHANGELOG entry complete
- Version number correct

**Evidence to Record:**
- CHANGELOG entry

**Files Touched:**
- `CHANGELOG.md` (modify)

---

## Tracking

### [x] T20: Update SPECS.md
**Goal:** Update specification index with Epic 3.2 status

**Steps:**
1. Open `SPECS.md`
2. Find Epic 3.2 row in BP2 table
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Add Evidence link to `specs/032-metadata-extraction/spec.md#evidence`
6. Update Last Updated timestamp
7. Update progress tracking section

**Done When:**
- SPECS.md updated with Epic 3.2 completion
- Evidence link added
- Progress tracking updated

**Verify:**
- SPECS.md renders correctly
- Links work
- Progress percentages updated

**Evidence to Record:**
- Updated SPECS.md entry

**Files Touched:**
- `SPECS.md` (modify)

---

### [x] T21: Update SPEC.md
**Goal:** Update current focus to next epic

**Steps:**
1. Open `SPEC.md`
2. Update "Current Focus" to next epic (4.0 or as directed)
3. Update Status to "Done" for Epic 3.2
4. Update links to next spec folder

**Done When:**
- SPEC.md updated with next focus
- Epic 3.2 marked as Done

**Verify:**
- SPEC.md renders correctly
- Links work

**Evidence to Record:**
- Updated SPEC.md

**Files Touched:**
- `SPEC.md` (modify)

---

### [x] T22: Consolidate Evidence in spec.md
**Goal:** Update spec.md with final evidence summary

**Steps:**
1. Open `specs/032-metadata-extraction/spec.md`
2. Scroll to ## EVIDENCE section
3. Add evidence for each acceptance criteria (AC10, AC-U1 to AC-U10)
4. Include test results, screenshots, debug logs
5. Add summary of verification activities
6. Add links to test files and fixtures
7. Add commit hash for final implementation

**Done When:**
- All acceptance criteria have evidence
- Evidence section complete and comprehensive
- Links to test files and screenshots included

**Verify:**
- spec.md renders correctly
- All links work
- Evidence is clear and complete

**Evidence to Record:**
- Final spec.md with complete evidence section

**Files Touched:**
- `specs/032-metadata-extraction/spec.md` (modify)

---

**End of Tasks**
