# Implementation Plan: Metadata Extraction

## Architecture Overview

### Key Components

#### 1. MetadataExtractor (Core Module)
**Responsibility:** Orchestrate metadata extraction from web pages using multiple strategies

**Location:** `src/lib/extractors/metadata-extractor.ts`

**Key Methods:**
- `extractMetadata(document: Document, url: string): Promise<PageMetadata>`
- `extractOpenGraph(document: Document): OpenGraphMetadata`
- `extractTwitterCards(document: Document): TwitterCardMetadata`
- `extractSchemaOrg(document: Document): SchemaOrgMetadata`
- `extractStandardMeta(document: Document): StandardMetadata`
- `mergeMetadata(...sources: Partial<PageMetadata>[]): PageMetadata`

**Dependencies:**
- DOM parsing utilities
- URL normalization utilities
- Date parsing utilities

#### 2. OpenGraphExtractor
**Responsibility:** Extract Open Graph meta tags

**Location:** `src/lib/extractors/opengraph-extractor.ts`

**Key Methods:**
- `extract(document: Document): OpenGraphMetadata`
- `getMetaProperty(document: Document, property: string): string | null`

#### 3. TwitterCardExtractor
**Responsibility:** Extract Twitter Card meta tags

**Location:** `src/lib/extractors/twitter-card-extractor.ts`

**Key Methods:**
- `extract(document: Document): TwitterCardMetadata`
- `getMetaName(document: Document, name: string): string | null`

#### 4. SchemaOrgExtractor
**Responsibility:** Parse Schema.org JSON-LD structured data

**Location:** `src/lib/extractors/schema-org-extractor.ts`

**Key Methods:**
- `extract(document: Document): SchemaOrgMetadata`
- `parseJsonLd(scriptContent: string): any`
- `extractArticleData(jsonLd: any): SchemaOrgMetadata`

#### 5. ReadingTimeCalculator
**Responsibility:** Calculate reading time from article content

**Location:** `src/lib/extractors/reading-time-calculator.ts`

**Key Methods:**
- `calculate(content: string): number`
- `countWords(content: string): number`

#### 6. LanguageDetector
**Responsibility:** Detect page language from HTML attributes

**Location:** `src/lib/extractors/language-detector.ts`

**Key Methods:**
- `detect(document: Document): string`
- `normalizeLanguageCode(lang: string): string`

#### 7. FaviconExtractor
**Responsibility:** Extract favicon URLs from page

**Location:** `src/lib/extractors/favicon-extractor.ts`

**Key Methods:**
- `extract(document: Document, baseUrl: string): string | null`
- `findBestFavicon(links: HTMLLinkElement[]): string | null`

### Module Boundaries

```
src/lib/extractors/
├── metadata-extractor.ts       # Main orchestrator
├── opengraph-extractor.ts      # OG tags
├── twitter-card-extractor.ts   # Twitter Cards
├── schema-org-extractor.ts     # Schema.org JSON-LD
├── reading-time-calculator.ts  # Reading time
├── language-detector.ts        # Language detection
└── favicon-extractor.ts        # Favicon extraction

src/lib/utils/
├── url-normalizer.ts           # URL normalization
├── date-parser.ts              # Date parsing and validation
└── html-decoder.ts             # HTML entity decoding

src/types/
└── metadata.d.ts               # TypeScript interfaces
```

### Message/Call Flow

1. **Bookmark Capture Flow:**
   ```
   User clicks "Save Bookmark"
   → BookmarkCaptureService.capture()
   → MetadataExtractor.extractMetadata(document, url)
   → [OpenGraphExtractor, TwitterCardExtractor, SchemaOrgExtractor, StandardMetaExtractor]
   → MetadataExtractor.mergeMetadata() [fallback chain]
   → LanguageDetector.detect()
   → FaviconExtractor.extract()
   → Return PageMetadata
   → AnytypeApiClient.createObject(bookmark + metadata)
   ```

2. **Article Capture Flow:**
   ```
   User clicks "Clip Article"
   → ArticleCaptureService.capture()
   → MetadataExtractor.extractMetadata(document, url)
   → ReadingTimeCalculator.calculate(articleContent)
   → Return PageMetadata with reading time
   → AnytypeApiClient.createObject(article + metadata)
   ```

### Alternatives Considered

#### Alternative 1: Single Monolithic Extractor
**Rejected:** Would violate single responsibility principle and make testing difficult. Separate extractors allow for better modularity and easier maintenance.

#### Alternative 2: External Metadata API (e.g., Clearbit, Embedly)
**Rejected:** Violates privacy requirements (PRIV-1, SEC-8). All extraction must happen locally.

#### Alternative 3: Browser Extension API for Metadata
**Rejected:** No standard browser API exists for metadata extraction. Must parse DOM manually.

#### Chosen Approach: Modular Extractors with Fallback Chain
**Rationale:**
- Each extractor has single responsibility
- Easy to test in isolation
- Fallback chain ensures robustness
- Extensible for future metadata sources
- Maintains privacy (all local)

---

## Data Contracts

### TypeScript Interfaces

#### PageMetadata
```typescript
interface PageMetadata {
  // Core metadata
  title: string;
  description: string | null;
  author: string | null;
  publishedDate: string | null; // ISO 8601
  modifiedDate: string | null; // ISO 8601
  
  // URLs
  url: string; // Current URL
  canonicalUrl: string | null;
  featuredImage: string | null;
  favicon: string | null;
  
  // Content metadata
  language: string; // ISO 639-1 code
  readingTime: number | null; // Minutes
  siteName: string | null;
  
  // Categorization
  section: string | null;
  tags: string[];
  
  // Source tracking
  extractionSource: 'opengraph' | 'twitter' | 'schema.org' | 'standard' | 'fallback';
  extractedAt: string; // ISO 8601 timestamp
}
```

#### OpenGraphMetadata
```typescript
interface OpenGraphMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  url: string | null;
  siteName: string | null;
  type: string | null;
}
```

#### TwitterCardMetadata
```typescript
interface TwitterCardMetadata {
  card: string | null;
  title: string | null;
  description: string | null;
  image: string | null;
  creator: string | null;
  site: string | null;
}
```

#### SchemaOrgMetadata
```typescript
interface SchemaOrgMetadata {
  type: string | null; // Article, NewsArticle, BlogPosting
  headline: string | null;
  author: string | null;
  datePublished: string | null;
  dateModified: string | null;
  image: string | null;
  publisher: string | null;
  description: string | null;
}
```

---

## Storage and Persistence

### Anytype Object Properties

Metadata will be stored as properties on Bookmark and Article objects:

```typescript
interface BookmarkWithMetadata {
  // Existing properties
  url: string;
  title: string;
  tags: string[];
  createdAt: string;
  sourceApp: string;
  
  // New metadata properties
  author?: string;
  publishedDate?: string;
  description?: string;
  featuredImage?: string;
  favicon?: string;
  language?: string;
  siteName?: string;
  canonicalUrl?: string;
}

interface ArticleWithMetadata extends BookmarkWithMetadata {
  // Article-specific
  content: string; // Markdown
  readingTime?: number; // Minutes
  section?: string;
}
```

**Note:** Exact Anytype property names need clarification (see Open Questions in spec.md).

---

## External Integrations

**None.** All metadata extraction happens locally in the browser content script. No external API calls permitted per SEC-8.

---

## UX and Operational States

### Extraction States

1. **Success:** All metadata extracted successfully
   - Display success notification with metadata preview
   - Show extraction source (OG, Twitter, Schema.org)

2. **Partial Success:** Some metadata missing
   - Display success notification
   - Log missing fields to debug log
   - Use fallback values (empty strings, null)

3. **Fallback:** Primary sources failed, using standard meta tags
   - Display success notification with warning
   - Log fallback usage
   - Extract from title tag, meta description, etc.

4. **Minimal:** No metadata available
   - Display success notification
   - Use page title and URL only
   - Log metadata extraction failure

### User-Visible Metadata

In popup UI, show extracted metadata preview:
```
┌─────────────────────────────────┐
│ Save Bookmark                   │
├─────────────────────────────────┤
│ Title: [Extracted title]        │
│ Author: [Extracted author]      │
│ Published: [Date]               │
│ Reading time: [X min read]      │
│ Language: [en]                  │
│                                 │
│ [Featured image preview]        │
│                                 │
│ Tags: [suggested tags]          │
│ Notes: [user input]             │
│                                 │
│ [Save to Anytype]               │
└─────────────────────────────────┘
```

---

## Testing Plan

### Unit Tests

#### Test File: `tests/unit/metadata-extractor.test.ts`

**Test Cases:**
1. `extractMetadata()` with complete Open Graph tags
2. `extractMetadata()` with Twitter Cards fallback
3. `extractMetadata()` with Schema.org JSON-LD
4. `extractMetadata()` with malformed metadata
5. `extractMetadata()` with no metadata (fallback to standard)
6. `mergeMetadata()` with multiple sources (priority order)

**Run Command:**
```bash
npm test -- tests/unit/metadata-extractor.test.ts
```

#### Test File: `tests/unit/opengraph-extractor.test.ts`

**Test Cases:**
1. Extract all OG properties from valid HTML
2. Handle missing OG tags gracefully
3. Handle malformed OG tags
4. Extract og:image with relative URL (convert to absolute)
5. Extract multiple og:image tags (use first)

**Run Command:**
```bash
npm test -- tests/unit/opengraph-extractor.test.ts
```

#### Test File: `tests/unit/twitter-card-extractor.test.ts`

**Test Cases:**
1. Extract Twitter Card metadata
2. Handle missing Twitter tags
3. Extract twitter:creator with @ symbol
4. Fallback to OG tags when Twitter tags missing

**Run Command:**
```bash
npm test -- tests/unit/twitter-card-extractor.test.ts
```

#### Test File: `tests/unit/schema-org-extractor.test.ts`

**Test Cases:**
1. Parse valid Article JSON-LD
2. Parse NewsArticle JSON-LD
3. Parse BlogPosting JSON-LD
4. Handle malformed JSON gracefully
5. Handle missing JSON-LD script tags
6. Extract author from object vs string
7. Extract image from array vs string

**Run Command:**
```bash
npm test -- tests/unit/schema-org-extractor.test.ts
```

#### Test File: `tests/unit/reading-time-calculator.test.ts`

**Test Cases:**
1. Calculate reading time for 200 words (1 min)
2. Calculate reading time for 1000 words (5 min)
3. Calculate reading time for 50 words (< 1 min)
4. Handle empty content
5. Exclude HTML tags from word count
6. Handle non-English characters

**Run Command:**
```bash
npm test -- tests/unit/reading-time-calculator.test.ts
```

#### Test File: `tests/unit/language-detector.test.ts`

**Test Cases:**
1. Detect language from html lang="en"
2. Normalize language variant (en-US → en)
3. Handle missing lang attribute (default to "unknown")
4. Handle invalid lang attribute

**Run Command:**
```bash
npm test -- tests/unit/language-detector.test.ts
```

#### Test File: `tests/unit/favicon-extractor.test.ts`

**Test Cases:**
1. Extract favicon from link rel="icon"
2. Prefer larger favicon sizes (64x64 over 16x16)
3. Handle relative favicon URLs (convert to absolute)
4. Handle missing favicon (return null)
5. Handle multiple favicon formats (.ico, .png)

**Run Command:**
```bash
npm test -- tests/unit/favicon-extractor.test.ts
```

### Integration Tests

#### Test File: `tests/integration/bookmark-metadata.test.ts`

**Test Cases:**
1. Create bookmark with full metadata from real HTML
2. Verify metadata stored in Anytype object
3. Test fallback chain (OG → Twitter → Standard)
4. Test canonical URL used for deduplication

**Run Command:**
```bash
npm test -- tests/integration/bookmark-metadata.test.ts
```

**Setup Required:**
- Mock Anytype API client
- Sample HTML files with various metadata formats
- Verify API payload includes metadata properties

### Manual Verification

#### MV-1: Test on Real Websites

**Sites to Test:**
1. **News Site (CNN, NYTimes):** Full Open Graph + Schema.org
2. **Blog (Medium, Dev.to):** Article metadata + Twitter Cards
3. **Documentation (MDN, React Docs):** Minimal metadata
4. **Wikipedia:** Standard meta tags only
5. **GitHub:** Developer-focused metadata
6. **Academic (arXiv):** Author + publication date

**Steps:**
1. Install extension in Brave browser
2. Navigate to each test site
3. Click "Save Bookmark" or "Clip Article"
4. Verify metadata extracted in popup preview
5. Open Anytype and verify metadata stored correctly
6. Check debug log for any extraction errors

**Expected Results:**
- All metadata fields populated when available
- Fallback chain works when primary source missing
- No capture failures due to metadata errors
- Metadata displayed in popup preview

#### MV-2: Test Malformed Metadata

**Test Cases:**
1. Page with invalid date format
2. Page with broken JSON-LD
3. Page with relative image URLs
4. Page with HTML entities in title
5. Page with no metadata at all

**Expected Results:**
- Capture succeeds in all cases
- Invalid data logged, not stored
- Fallback values used when needed
- No user-facing errors

---

## AC Verification Mapping

### AC10: Metadata Extraction (from PRD)
**Verification:**
- **Unit Tests:** `metadata-extractor.test.ts` - Test extraction from various sources
- **Integration Tests:** `bookmark-metadata.test.ts` - Verify metadata stored in Anytype
- **Manual Test:** MV-1 - Test on real websites (news, blogs, docs)

### AC-U1: Open Graph Metadata Extracted
**Verification:**
- **Unit Tests:** `opengraph-extractor.test.ts` - Test OG tag extraction
- **Manual Test:** MV-1 - Test on CNN, NYTimes (sites with full OG tags)

### AC-U2: Article Metadata Extracted
**Verification:**
- **Unit Tests:** `metadata-extractor.test.ts` - Test article:author, article:published_time
- **Manual Test:** MV-1 - Test on Medium, Dev.to (blog posts)

### AC-U3: Twitter Card Metadata Extracted
**Verification:**
- **Unit Tests:** `twitter-card-extractor.test.ts` - Test Twitter Card extraction
- **Manual Test:** MV-1 - Test on Twitter-optimized sites

### AC-U4: Schema.org JSON-LD Extracted
**Verification:**
- **Unit Tests:** `schema-org-extractor.test.ts` - Test JSON-LD parsing
- **Manual Test:** MV-1 - Test on Google-optimized news sites

### AC-U5: Reading Time Calculated
**Verification:**
- **Unit Tests:** `reading-time-calculator.test.ts` - Test with known word counts
- **Manual Test:** MV-1 - Test on long-form articles, verify accuracy

### AC-U6: Language Detected
**Verification:**
- **Unit Tests:** `language-detector.test.ts` - Test lang attribute parsing
- **Manual Test:** MV-1 - Test on multilingual sites (Wikipedia in different languages)

### AC-U7: Canonical URL Extracted
**Verification:**
- **Unit Tests:** `metadata-extractor.test.ts` - Test canonical link extraction
- **Manual Test:** MV-1 - Test on AMP pages with canonical links

### AC-U8: Favicon Extracted
**Verification:**
- **Unit Tests:** `favicon-extractor.test.ts` - Test favicon extraction
- **Manual Test:** MV-1 - Test on sites with multiple favicon sizes

### AC-U9: Fallback Strategy Works
**Verification:**
- **Unit Tests:** `metadata-extractor.test.ts` - Test fallback chain
- **Manual Test:** MV-2 - Test on pages with missing OG tags

### AC-U10: Malformed Metadata Handled
**Verification:**
- **Unit Tests:** `metadata-extractor.test.ts` - Test with invalid dates, broken JSON
- **Manual Test:** MV-2 - Test on pages with malformed metadata

---

## Risks and Mitigations

### Risk 1: Anytype Property Mapping Unclear
**Mitigation:**
- Document exact property names needed (see Open Questions)
- Test property creation with Anytype API early
- Provide fallback to generic metadata object if needed
- **Action:** Clarify with user before implementation

### Risk 2: Performance Impact
**Mitigation:**
- Optimize DOM queries (single querySelectorAll, cache results)
- Run extraction asynchronously
- Limit JSON-LD parsing to first 100KB
- Performance test on large pages
- **Target:** <500ms extraction time

### Risk 3: Schema.org Complexity
**Mitigation:**
- Focus on Article types only (Article, NewsArticle, BlogPosting)
- Use well-tested JSON parsing
- Extensive unit tests with real-world examples
- Graceful handling of unexpected structures

---

## Rollout and Migration Notes

### Rollout Strategy

**Phase 1: Core Extraction (Week 1)**
- Implement OpenGraphExtractor, TwitterCardExtractor, StandardMetaExtractor
- Implement MetadataExtractor with fallback chain
- Unit tests for all extractors
- Integration with bookmark capture

**Phase 2: Advanced Extraction (Week 1)**
- Implement SchemaOrgExtractor (JSON-LD parsing)
- Implement ReadingTimeCalculator, LanguageDetector, FaviconExtractor
- Unit tests for all utilities
- Integration with article capture

**Phase 3: Testing & Polish (Week 2)**
- Integration tests with Anytype API
- Manual testing on diverse websites
- Performance optimization
- Documentation updates

### Migration Notes

**No migration required.** This is a new feature that extends existing bookmark and article capture. Existing bookmarks will not have metadata, but new captures will include it.

### Backwards Compatibility

- Metadata properties are optional on Anytype objects
- Missing metadata does not break existing functionality
- Old bookmarks without metadata remain functional
- No breaking changes to API client or capture services

---

## Observability and Debugging

### What Can Be Logged

- Metadata extraction source (OG, Twitter, Schema.org, Standard, Fallback)
- Extraction duration (performance monitoring)
- Missing metadata fields (for debugging)
- Fallback chain execution (which extractors ran)
- Malformed metadata warnings (invalid dates, broken URLs)
- JSON-LD parsing errors (syntax errors, unexpected structure)

### What Must Never Be Logged

- Full page content (privacy)
- User-entered notes or tags (privacy)
- API keys or authentication tokens (security)
- Personal information from metadata (PII)
- Complete URLs with query parameters (may contain sensitive data)

### Debug Log Format

```typescript
{
  timestamp: "2026-01-02T12:00:00Z",
  action: "metadata_extraction",
  status: "success" | "partial" | "fallback" | "failed",
  source: "opengraph" | "twitter" | "schema.org" | "standard" | "fallback",
  duration: 245, // ms
  fields: {
    title: true,
    author: false, // missing
    publishedDate: true,
    // ... field availability
  },
  warnings: [
    "Invalid date format in article:published_time",
    "Relative image URL converted to absolute"
  ]
}
```

---

**End of Implementation Plan**
