# Spec: Metadata Extraction

## Header

- **Title:** Metadata Extraction
- **Roadmap Anchor:** [roadmap.md 3.2](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L375-L401)
- **Priority:** P1
- **Type:** Feature
- **Target Area:** Content extraction, metadata parsing
- **Target Acceptance Criteria:** AC10, FR3.3, FR10.1, FR10.2, FR10.3, FR10.4, FR10.5

---

## Problem Statement

Currently, the Anytype Clipper Extension captures basic bookmark information (URL, title) but lacks rich metadata extraction from web pages. Users need comprehensive metadata (author, published date, featured images, reading time, language, canonical URLs) to better organize and contextualize captured content in Anytype. Without this metadata, bookmarks and articles lack important context that aids in search, filtering, and understanding the content's provenance.

---

## Goals and Non-Goals

### Goals

- Extract Open Graph metadata (og:title, og:description, og:image)
- Extract article metadata (article:author, article:published_time)
- Extract Twitter Card metadata (twitter:card, twitter:creator)
- Extract Schema.org Article metadata
- Calculate reading time estimate based on word count (200 WPM)
- Detect page language from HTML lang attribute
- Extract canonical URL when different from current URL
- Capture site favicon in multiple sizes

### Non-Goals

- Archive.org snapshot links (post-MVP, Epic 10.4)
- Related links extraction (post-MVP, Epic 10.4)
- Page modification date from last-modified header (post-MVP, Epic 10.4)
- Custom metadata extraction rules or user-configurable extractors
- AI-powered content analysis or summarization
- Metadata validation or correction

---

## User Stories

### US1: Researcher Capturing Academic Articles

**As a** researcher building a knowledge base,  
**I want** author names and publication dates automatically extracted from articles,  
**So that** I can properly cite sources and track when information was published without manual data entry.

**Acceptance:**
- Author extracted from schema.org, Open Graph, or article meta tags
- Published date captured in ISO format
- Metadata appears in Anytype object properties
- Missing metadata handled gracefully (empty fields, not errors)

### US2: Content Curator Organizing Visual Content

**As a** content curator collecting design inspiration,  
**I want** featured images and site favicons automatically captured,  
**So that** I can visually browse my collection and quickly identify sources.

**Acceptance:**
- Featured image (og:image) captured and stored
- Multiple favicon sizes captured when available
- Images stored as URLs or embedded based on size
- Fallback to page title when no featured image exists

### US3: Multilingual Knowledge Worker

**As a** multilingual knowledge worker,  
**I want** page language automatically detected,  
**So that** I can filter and organize content by language in my Anytype workspace.

**Acceptance:**
- Language extracted from HTML lang attribute
- Language stored in ISO 639-1 format (e.g., "en", "es", "fr")
- Defaults to "unknown" when language not specified
- Works for both single-language and multi-language pages

---

## Scope

### In-Scope

- Open Graph meta tag extraction (og:title, og:description, og:image, og:url, og:site_name)
- Article meta tag extraction (article:author, article:published_time, article:modified_time, article:section, article:tag)
- Twitter Card extraction (twitter:card, twitter:creator, twitter:site, twitter:title, twitter:description, twitter:image)
- Schema.org JSON-LD extraction (Article, NewsArticle, BlogPosting types)
- Reading time calculation (word count / 200 WPM)
- Page language detection (html lang attribute)
- Canonical URL extraction (link rel="canonical")
- Favicon extraction (link rel="icon", multiple sizes)
- Fallback strategies when metadata is missing or malformed
- Metadata normalization (dates to ISO format, URLs to absolute)
- Integration with existing bookmark and article capture flows

### Out-of-Scope

- Archive.org Wayback Machine snapshot links (Epic 10.4)
- Related links extraction (Epic 10.4)
- Page modification date from HTTP headers (Epic 10.4)
- Custom metadata extraction rules
- User-configurable metadata mappings
- Metadata validation against external sources
- OCR or image-based metadata extraction
- Video metadata extraction
- PDF metadata extraction
- RSS/Atom feed metadata

---

## Requirements

### Functional Requirements

#### FR-1: Open Graph Extraction
Extract Open Graph metadata from meta tags in page head:
- `og:title` - Page title
- `og:description` - Page description
- `og:image` - Featured image URL
- `og:url` - Canonical URL
- `og:site_name` - Site name
- `og:type` - Content type (article, website, etc.)

#### FR-2: Article Metadata Extraction
Extract article-specific metadata:
- `article:author` - Author name(s)
- `article:published_time` - Publication date (ISO 8601)
- `article:modified_time` - Last modified date (ISO 8601)
- `article:section` - Article section/category
- `article:tag` - Article tags (array)

#### FR-3: Twitter Card Extraction
Extract Twitter Card metadata:
- `twitter:card` - Card type (summary, summary_large_image, etc.)
- `twitter:creator` - Content creator Twitter handle
- `twitter:site` - Website Twitter handle
- `twitter:title` - Title (fallback if og:title missing)
- `twitter:description` - Description (fallback if og:description missing)
- `twitter:image` - Image URL (fallback if og:image missing)

#### FR-4: Schema.org JSON-LD Extraction
Parse JSON-LD structured data for Article types:
- `@type` - Article, NewsArticle, BlogPosting, etc.
- `headline` - Article headline
- `author` - Author object (name, url)
- `datePublished` - Publication date
- `dateModified` - Modification date
- `image` - Featured image URL or array
- `publisher` - Publisher object (name, logo)
- `description` - Article description

#### FR-5: Reading Time Calculation
- Count words in article body (exclude navigation, ads, footer)
- Calculate reading time: `words / 200 WPM`
- Round to nearest minute
- Format as "X min read" or "< 1 min read"
- Store as integer (minutes) in metadata

#### FR-6: Language Detection
- Extract language from `<html lang="...">` attribute
- Normalize to ISO 639-1 two-letter code (e.g., "en", "es")
- Handle language variants (e.g., "en-US" → "en")
- Default to "unknown" if not specified
- Store in metadata as `language` property

#### FR-7: Canonical URL Extraction
- Extract from `<link rel="canonical" href="...">` tag
- Validate URL format
- Convert relative URLs to absolute
- Use canonical URL for deduplication if different from current URL
- Fall back to current URL if canonical not found

#### FR-8: Favicon Extraction
- Extract from `<link rel="icon" href="...">` tags
- Support multiple sizes (16x16, 32x32, 64x64, etc.)
- Prefer larger sizes (64x64 or higher)
- Support both .ico and .png formats
- Convert relative URLs to absolute
- Store best available favicon URL in metadata

#### FR-9: Metadata Normalization
- Normalize dates to ISO 8601 format (YYYY-MM-DDTHH:mm:ssZ)
- Convert relative URLs to absolute URLs
- Trim whitespace from text fields
- Handle HTML entities in text fields (decode to plain text)
- Validate URL formats before storing
- Handle missing or malformed metadata gracefully

#### FR-10: Fallback Strategy
- If Open Graph missing, fall back to Twitter Cards
- If Twitter Cards missing, fall back to standard meta tags
- If meta tags missing, fall back to Schema.org JSON-LD
- If all metadata missing, extract from page structure (title tag, first h1, etc.)
- Never fail capture due to missing metadata

### Non-Functional Requirements

#### NFR-1: Performance
- Metadata extraction must complete within 500ms for typical pages
- Extraction must not block article content extraction
- DOM parsing must be efficient (single pass when possible)
- JSON-LD parsing must handle large payloads (up to 100KB)

#### NFR-2: Reliability
- Handle malformed metadata gracefully (invalid dates, broken URLs)
- Validate extracted data before storing
- Log extraction errors without failing capture
- Provide default values for missing required fields

#### NFR-3: Compatibility
- Support all major metadata standards (Open Graph, Twitter Cards, Schema.org)
- Handle legacy meta tag formats (name="description", name="author")
- Work with both HTML4 and HTML5 documents
- Parse JSON-LD in both script tags and inline formats

#### NFR-4: Privacy
- No external API calls for metadata validation
- No telemetry on metadata extraction success/failure
- Metadata extraction happens locally in content script

### Constraints

#### Security Constraints
- **SEC-6:** All extracted metadata must be validated and sanitized before storage
- **SEC-8:** No external API calls permitted for metadata enrichment
- Extracted URLs must be validated to prevent XSS attacks
- HTML entities in metadata must be properly decoded

#### Data Integrity Constraints
- Metadata must be stored atomically with bookmark/article object
- Missing metadata must not prevent object creation
- Invalid metadata must be logged but not stored
- Metadata extraction failures must not fail the entire capture

#### Performance Constraints
- **PERF-2:** Metadata extraction must not add more than 500ms to capture time
- DOM queries must be optimized (use querySelectorAll once, cache results)
- JSON-LD parsing must handle large payloads without blocking
- Reading time calculation must be efficient for long articles

---

## Acceptance Criteria

### AC10: Metadata Extraction (from PRD)
Images are embedded or linked based on size and user preference.

**Verification approach:** Manual test: clip article with images, verify <500KB embedded, >500KB linked

### AC-U1: Open Graph Metadata Extracted
**Given** a web page with Open Graph meta tags  
**When** user captures the page as a bookmark or article  
**Then** og:title, og:description, og:image, og:url, og:site_name are extracted and stored in Anytype object properties

**Verification approach:** Unit test with mock HTML containing OG tags; manual test on news sites (CNN, NYTimes)

### AC-U2: Article Metadata Extracted
**Given** a web page with article meta tags  
**When** user captures the page  
**Then** article:author, article:published_time are extracted and stored

**Verification approach:** Unit test with mock HTML; manual test on blog posts (Medium, Dev.to)

### AC-U3: Twitter Card Metadata Extracted
**Given** a web page with Twitter Card meta tags  
**When** user captures the page  
**Then** twitter:creator, twitter:card are extracted and stored

**Verification approach:** Unit test with mock HTML; manual test on Twitter-optimized sites

### AC-U4: Schema.org JSON-LD Extracted
**Given** a web page with Schema.org Article JSON-LD  
**When** user captures the page  
**Then** author, datePublished, headline are extracted from structured data

**Verification approach:** Unit test with mock JSON-LD; manual test on Google-optimized news sites

### AC-U5: Reading Time Calculated
**Given** an article with 1000 words  
**When** user captures the article  
**Then** reading time is calculated as "5 min read" (1000 / 200 = 5)

**Verification approach:** Unit test with known word counts; manual test on long-form articles

### AC-U6: Language Detected
**Given** a web page with `<html lang="en-US">`  
**When** user captures the page  
**Then** language is stored as "en"

**Verification approach:** Unit test with various lang attributes; manual test on multilingual sites

### AC-U7: Canonical URL Extracted
**Given** a web page with canonical link tag  
**When** user captures the page  
**Then** canonical URL is used for deduplication and stored in metadata

**Verification approach:** Unit test with mock HTML; manual test on AMP pages with canonical links

### AC-U8: Favicon Extracted
**Given** a web page with multiple favicon sizes  
**When** user captures the page  
**Then** largest available favicon (preferably 64x64+) is stored

**Verification approach:** Unit test with mock HTML; manual test on sites with multiple favicon sizes

### AC-U9: Fallback Strategy Works
**Given** a web page with no Open Graph tags but has Twitter Cards  
**When** user captures the page  
**Then** metadata is extracted from Twitter Cards as fallback

**Verification approach:** Unit test with mock HTML missing OG tags; manual test on Twitter-only sites

### AC-U10: Malformed Metadata Handled
**Given** a web page with invalid date format in article:published_time  
**When** user captures the page  
**Then** capture succeeds, invalid date is logged, field left empty

**Verification approach:** Unit test with malformed metadata; error handling verification

---

## Dependencies

### Epic Dependencies
- **Epic 3.0 (Bookmark Capture):** Metadata extraction extends bookmark capture with rich metadata
- **Epic 3.1 (Highlight Capture):** Metadata may be captured for highlight context
- **Epic 4.0 (Readability Integration):** Article extraction will use metadata for enhanced context

### Technical Dependencies
- Content script injection capability (already implemented in Epic 3.1)
- DOM parsing utilities
- URL normalization utilities (will be created)
- Date parsing and validation utilities (will be created)
- Anytype API client for storing metadata properties (already implemented in Epic 1.1)

### External Dependencies
- None (all extraction happens locally in browser)

---

## Risks and Mitigations

### Risk 1: Inconsistent Metadata Formats
**Impact:** High  
**Probability:** High  
**Mitigation:**
- Implement robust fallback chain (OG → Twitter → Schema.org → HTML)
- Normalize all extracted data to consistent formats
- Extensive testing on diverse websites
- Graceful handling of missing/malformed metadata

### Risk 2: Performance Impact on Large Pages
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Optimize DOM queries (single pass, cache results)
- Limit JSON-LD parsing to first 100KB
- Run extraction asynchronously, don't block capture
- Performance testing on large pages (Wikipedia, documentation sites)

### Risk 3: Schema.org JSON-LD Complexity
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Focus on Article, NewsArticle, BlogPosting types only
- Use well-tested JSON parsing libraries
- Validate JSON structure before parsing
- Extensive unit tests with real-world JSON-LD examples

### Risk 4: Anytype Property Mapping & Schema Stability
**Impact:** High  
**Probability:** High (Confirmed during implementation)  
**Mitigation:**
- **Finding:** Anytype API property keys are often different from standard names (e.g., `source` instead of `source_url`).
- **Finding:** The `article` type key is not supported for creation via the standard API; `note` must be used instead.
- **Finding:** Complex HTML in the `body` field can cause HTTP 500 errors on the Anytype server.
- **Mitigation:** Implemented a robust "Create (Basic) -> Update (Properties)" flow.
- **Mitigation:** Implemented HTML-to-Markdown conversion in the **content script** to avoid `ReferenceError` in service workers and ensure server-side stability.

---

## Technical Findings & API Quirks

1. **Object Type Keys**: Creating an object with `type_key: 'article'` returns an HTTP 500 error. The clipper now uses `type_key: 'note'` for articles, which is recognized and stable.
2. **Payload Structure**: The `spaceId` must be in the URL path but NOT in the `CreateObjectRequest` body. Including it in the body causes validation errors.
3. **Property Mapping**:
   - `source_url` -> `source` (Relation)
   - `author` -> `author` (Text)
   - `published_date` -> `published_at` (Date)
4. **Body Parsing**: The Anytype API is sensitive to HTML in the body. The clipper now performs mandatory HTML-to-Markdown conversion using `turndown` in the content script environment.
5. **DOM Dependency**: `turndown` requires a DOM (`window.document`) to work. Since Service Workers are DOM-less, conversion must happen in the content script before sending metadata to the background.

---

## Open Questions Resolved

1. **Anytype metadata properties?** Resolved. Mapped to `source`, `author`, `published_at`, etc., using the discovery service.
2. **Featured image handling?** Resolved. Stored as URL in the `image` property.
3. **Multiple authors?** Resolved. Captured as a comma-separated string from the extraction layer.
4. **Date format?** Resolved. ISO 8601 strings are used and accepted by the API.

---

## EVIDENCE

### Automated Tests
- **Unit Tests:** 11 suites for extractors and utilities (90 tests total). Added `tests/unit/markdown-converter.test.ts`.
- **Integration Tests:** 
  - `tests/integration/bookmark-metadata.test.ts`: Verified metadata extraction and API mapping.
  - `tests/integration/article-metadata.test.ts`: Verified full-text extraction, Markdown conversion, and API mapping.
  - Total: **96 tests passing**.

### Test Fixtures
- Located in `tests/fixtures/metadata/`:
  - `opengraph-full.html`, `twitter-cards.html`, `schema-org-article.html`, `malformed-metadata.html`, etc.

### Manual Verification
- Verified "Save as Article" creates readable Notes in Anytype with proper Markdown structure (Headings, Lists).
- Verified fix for HTTP 500 error by switching to `type_key: 'note'`.
- Verified fix for `ReferenceError: document is not defined` by moving conversion to content script.

---

**End of Specification**
