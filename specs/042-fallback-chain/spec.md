# Specification: Fallback Extraction Chain

## Header

- **Title:** Epic 4.2: Fallback Extraction Chain
- **Roadmap anchor reference:** [roadmap.md 4.2](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#L458-L480)
- **Priority:** P0
- **Type:** Feature
- **Target area:** Article Extraction / Content Processing
- **Target Acceptance Criteria:** FR5.1, FR5.10, FR5.11, AC9, ERR-7, REL-8

---

## Problem Statement

Mozilla Readability (Epic 4.0) successfully extracts article content from traditional news sites and blogs, but fails on modern Single Page Applications (SPAs), JavaScript-heavy sites, and pages with non-standard layouts. When Readability fails, users currently receive no content at all, resulting in a poor experience.

Users need a robust fallback strategy that gracefully degrades when Readability fails, ensuring they always capture *something* useful—even if it's not perfect article extraction. The extension should try progressively simpler extraction methods before falling back to a smart bookmark with enhanced metadata.

---

## Goals and Non-Goals

### Goals

- Implement a 4-level waterfall extraction strategy
- Provide quality indicators for each extraction level (green/yellow/orange)
- Allow users to manually retry extraction if initial attempt fails
- Ensure at least a smart bookmark is created even when all extraction levels fail
- Maintain performance: complete fallback chain within 10 seconds total
- Achieve 95%+ capture success rate (including smart bookmarks)

### Non-Goals

- User-configurable fallback preferences (post-MVP)
- Custom extraction rules per domain (post-MVP)
- Machine learning-based content detection (post-MVP)
- Real-time preview of extraction quality (post-MVP)
- Automatic retry on failure (manual retry only for MVP)

---

## User Stories

### Primary User Story (US1 - from PRD)

**As a** researcher building a knowledge base in Anytype,  
**I want to** capture articles even from complex or JavaScript-heavy sites,  
**So that** I don't lose valuable content when Readability fails.

**Acceptance:**
- Extension tries 4 extraction levels in order
- Each level provides progressively simpler extraction
- Quality indicator shows which level succeeded
- Smart bookmark created if all levels fail
- User can manually retry extraction
- Success notification indicates extraction quality

---

## Scope

### In-Scope

- **Level 1: Readability (Primary)** - Already implemented in Epic 4.0
- **Level 2: Simplified DOM Extraction**
  - Find largest `<article>` tag
  - Calculate text density for all major content blocks
  - Extract block with highest text-to-HTML ratio
  - Preserve basic structure (paragraphs, headings)
- **Level 3: Full Page Capture with Cleaning**
  - Capture entire page body
  - Strip scripts, styles, navigation, footer
  - Remove common ad containers and social widgets
  - Preserve main content area
- **Level 4: Smart Bookmark with Enhanced Metadata**
  - Fall back to bookmark capture (Epic 3.0)
  - Include enhanced metadata from Epic 3.2
  - Mark as "extraction failed" for user awareness
- Quality indicators:
  - Success (green): "Article captured (X words)"
  - Fallback 1/2 (yellow): "Article captured (simplified)"
  - Fallback 3 (orange): "Saved as bookmark - extraction failed"
- Manual retry option in popup/notification
- Performance monitoring for each extraction level
- Error logging with sanitized messages

### Out-of-Scope

- User-configurable fallback order (post-MVP)
- Domain-specific extraction rules (post-MVP)
- Automatic retry on failure (manual only for MVP)
- Visual preview of extraction result (post-MVP)
- Extraction quality scoring algorithm (post-MVP)
- Checkpoint-based recovery for large articles (Epic 5.0)

---

## Requirements

### Functional Requirements

#### FR-1: Waterfall Extraction Strategy
Implement a 4-level waterfall approach that tries each extraction method in sequence until one succeeds.

**Rationale:** Progressive degradation ensures users always capture something useful, even on problematic pages.

**Details:**
- Try Level 1 (Readability) first
- If Level 1 returns null or fails, try Level 2 (Simplified DOM)
- If Level 2 fails, try Level 3 (Full Page Clean)
- If Level 3 fails, fall back to Level 4 (Smart Bookmark)
- Stop at first successful extraction
- Track which level succeeded for quality indicator

#### FR-2: Level 2 - Simplified DOM Extraction
Extract content using DOM analysis when Readability fails.

**Algorithm:**
1. Find all `<article>` tags, select largest by text content
2. If no `<article>` tags, calculate text density for all major blocks:
   - `<main>`, `<div>`, `<section>` with substantial text
   - Text density = text length / HTML length
3. Select block with highest text density (minimum 0.3 ratio)
4. Extract content from selected block
5. Preserve basic structure: paragraphs, headings, lists
6. Convert to Markdown using Turndown (Epic 4.1)

**Success criteria:** Returns non-null content with at least 100 words

#### FR-3: Level 3 - Full Page Capture with Cleaning
Capture entire page body with aggressive cleaning when DOM extraction fails.

**Algorithm:**
1. Clone document.body
2. Remove elements by tag: `<script>`, `<style>`, `<iframe>`, `<noscript>`
3. Remove elements by common class/id patterns:
   - Navigation: `nav`, `navbar`, `menu`, `breadcrumb`
   - Footer: `footer`, `copyright`
   - Ads: `ad`, `advertisement`, `sponsored`, `promo`
   - Social: `share`, `social`, `follow`
   - Comments: `comment`, `disqus`
4. Extract remaining content
5. Convert to Markdown using Turndown (Epic 4.1)

**Success criteria:** Returns non-null content with at least 50 words

#### FR-4: Level 4 - Smart Bookmark Fallback
Create enhanced bookmark when all extraction levels fail.

**Details:**
- Use bookmark capture flow from Epic 3.0
- Include enhanced metadata from Epic 3.2:
  - Open Graph tags
  - Schema.org metadata
  - Twitter Cards
  - Page description
  - Featured image
- Add property: `extractionFailed: true`
- Add note: "Article extraction failed. Saved as bookmark."

**Success criteria:** Always succeeds (bookmark creation)

#### FR-5: Extraction Quality Indicators
Provide visual feedback on extraction quality.

**Quality levels:**
- **Success (green):** Level 1 succeeded - "Article captured (X words)"
- **Partial (yellow):** Level 2 or 3 succeeded - "Article captured (simplified)"
- **Fallback (orange):** Level 4 used - "Saved as bookmark - extraction failed"

**Display locations:**
- Success notification
- Popup UI status
- Anytype object property (quality level)

#### FR-6: Manual Retry Option
Allow users to manually retry extraction if initial attempt fails.

**Details:**
- Show "Retry extraction" button in notification for failed captures
- Show "Retry extraction" option in popup for queued items
- Retry runs full fallback chain again
- Limit to 3 manual retries per URL (prevent infinite loops)
- Track retry count in queue item metadata

#### FR-7: Performance Monitoring
Track and log extraction time for each level.

**Details:**
- Log start/end time for each level
- Total extraction time must be ≤10 seconds
- Set timeout per level:
  - Level 1: 5 seconds (from Epic 4.0)
  - Level 2: 3 seconds
  - Level 3: 2 seconds
  - Level 4: instant (bookmark creation)
- Abort level if timeout exceeded, proceed to next level

### Non-Functional Requirements

#### NFR-1: Performance
Total extraction time (all levels) must not exceed 10 seconds.

**Measurement:** Log total extraction time, warn if >10s.

#### NFR-2: Reliability (REL-8)
Graceful degradation ensures capture always succeeds.

**Details:**
- At least one level must always succeed (Level 4 guaranteed)
- No crashes or exceptions on any page type
- Sanitized error messages logged
- User always receives feedback on what was captured

#### NFR-3: Memory Efficiency
Limit memory usage during fallback extraction.

**Details:**
- Clean up DOM clones after each level
- Limit maximum article size to 5MB (inherited from Epic 4.0)
- Process levels sequentially (not parallel) to reduce memory pressure

#### NFR-4: Compatibility
Work across diverse page types.

**Target pages:**
- SPAs (React, Vue, Angular apps)
- JavaScript-heavy sites (Twitter, Gmail, Google Docs)
- Paywalled content (partial extraction)
- Dynamic content (infinite scroll, lazy loading)
- Non-standard layouts (landing pages, portfolios)

**Success criteria:** 95%+ capture rate (including smart bookmarks)

#### NFR-5: Privacy
All extraction happens client-side.

**Details:**
- No external API calls
- No telemetry
- No content sent to third parties

### Constraints

From constitution.md (roadmap.md lines 56-99):

#### Security Constraints
- **SEC-4:** Sanitized error messages (no sensitive data in logs)
- **SEC-6:** Input validation required (validate DOM before processing)

#### Performance Constraints
- **PERF-2:** Article extraction <5s (Level 1 only)
- Total fallback chain <10s (all levels)

#### Reliability Constraints
- **REL-6:** Clear error messages with next steps
- **REL-8:** Graceful degradation (this epic's primary goal)
- **ERR-7:** Fallback chain ensures capture always succeeds

---

## Acceptance Criteria

### AC-1: Fallback Chain Executes in Order
**Given** Readability fails on a page,  
**When** I trigger article capture,  
**Then** the extension tries Level 2, then Level 3, then Level 4 in sequence.

**Verification approach:** Mock Readability failure, verify logs show each level attempted in order.

---

### AC-2: Level 2 Extracts from Article Tag
**Given** a page with an `<article>` tag containing main content,  
**When** Readability fails and Level 2 runs,  
**Then** content is extracted from the `<article>` tag.

**Verification approach:** Test on page with `<article>` tag, verify extracted content matches article content.

---

### AC-3: Level 2 Uses Text Density
**Given** a page without `<article>` tags,  
**When** Level 2 runs,  
**Then** it selects the block with highest text density.

**Verification approach:** Test on page with multiple divs, verify highest density block selected.

---

### AC-4: Level 3 Removes Scripts and Styles
**Given** a page with scripts, styles, and ads,  
**When** Level 3 runs,  
**Then** extracted content excludes scripts, styles, navigation, and ads.

**Verification approach:** Inspect extracted HTML, verify no `<script>`, `<style>`, or ad elements present.

---

### AC-5: Level 4 Creates Smart Bookmark
**Given** all extraction levels fail,  
**When** Level 4 runs,  
**Then** a bookmark is created with enhanced metadata and `extractionFailed: true`.

**Verification approach:** Force all levels to fail, verify bookmark created with metadata.

---

### AC-6: Quality Indicator Shows Correct Level
**Given** extraction succeeds at Level 2,  
**When** user views notification,  
**Then** it shows "Article captured (simplified)" in yellow.

**Verification approach:** Test each level, verify correct quality indicator displayed.

---

### AC-7: Manual Retry Option Available
**Given** extraction failed (Level 4 used),  
**When** user views notification,  
**Then** "Retry extraction" button is shown.

**Verification approach:** Trigger failed extraction, verify retry button in notification.

---

### AC-8: Manual Retry Runs Full Chain
**Given** user clicks "Retry extraction",  
**When** retry executes,  
**Then** full fallback chain runs again from Level 1.

**Verification approach:** Click retry, verify logs show all levels attempted again.

---

### AC-9: Fallback Chain Completes Within 10 Seconds (PRD AC9)
**Given** a typical page requiring fallback extraction,  
**When** the fallback chain runs,  
**Then** it completes within 10 seconds.

**Verification approach:** Log total extraction time, verify ≤10s for 95% of test cases.

---

### AC-10: 95% Capture Success Rate
**Given** a test corpus of 100 diverse web pages,  
**When** extraction runs on each,  
**Then** at least 95 captures succeed (including smart bookmarks).

**Verification approach:** Automated test suite on curated test corpus.

---

### AC-11: Extraction Quality Stored in Anytype
**Given** an article captured at Level 2,  
**When** I view the object in Anytype,  
**Then** it has a property indicating extraction quality (e.g., `quality: "simplified"`).

**Verification approach:** Manual test - capture article, verify property in Anytype.

---

## Dependencies

### Epic Dependencies

- **Epic 4.0 (Readability Integration):** Completed - provides Level 1 extraction
- **Epic 4.1 (Markdown Conversion):** Completed - converts extracted HTML to Markdown
- **Epic 3.0 (Bookmark Capture):** Completed - provides Level 4 fallback
- **Epic 3.2 (Metadata Extraction):** Completed - provides enhanced metadata for smart bookmarks
- **Epic 1.1 (API Client Foundation):** Completed - provides API client for creating objects

### Technical Dependencies

- **DOM API:** Access to document.body, element selection, text content extraction
- **Content script infrastructure:** Ability to run extraction in page context
- **Markdown converter:** From Epic 4.1 for converting extracted HTML
- **Metadata extractor:** From Epic 3.2 for enhanced bookmark metadata

### Blocked By

- **Epic 4.0 (Readability Integration):** Must be completed (Level 1)
- **Epic 4.1 (Markdown Conversion):** Must be completed (convert extracted content)

### Blocks

- **Epic 4.3 (Image Handling):** Will integrate with fallback extraction for image processing
- **Epic 4.4 (Table Preservation):** Will integrate with fallback extraction for table handling

---

## Risks and Mitigations

### Risk 1: All Extraction Levels Fail on Some Pages
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:** 
- Level 4 (smart bookmark) always succeeds
- Enhanced metadata provides value even without article content
- User can manually retry or capture as bookmark

### Risk 2: Fallback Chain Takes >10 Seconds
**Likelihood:** Medium  
**Impact:** Medium  
**Mitigation:**
- Set strict timeouts per level (5s, 3s, 2s)
- Abort level if timeout exceeded
- Process levels sequentially to avoid parallel overhead
- Monitor performance in testing

### Risk 3: Level 2/3 Extract Too Much Noise
**Likelihood:** High  
**Impact:** Medium  
**Mitigation:**
- Implement aggressive cleaning in Level 3
- Use text density threshold (minimum 0.3) in Level 2
- Provide quality indicator so user knows extraction was simplified
- Allow manual retry for better results

### Risk 4: DOM Cloning Causes Memory Issues
**Likelihood:** Low  
**Impact:** Medium  
**Mitigation:**
- Clone only necessary elements (not entire document)
- Clean up clones immediately after extraction
- Set 5MB limit on article size (NFR1.4 from Epic 4.0)
- Process levels sequentially (not parallel)

### Risk 5: Retry Button Causes Infinite Loops
**Likelihood:** Low  
**Impact:** Low  
**Mitigation:**
- Limit to 3 manual retries per URL
- Track retry count in queue item metadata
- Disable retry button after 3 attempts
- Clear retry count after successful extraction

---

## Open Questions

None at this time. All requirements are clear from PRD and roadmap.

---

## EVIDENCE

This section will be populated during implementation with verification evidence for each task and acceptance criterion.

### Task Evidence

(To be filled during implementation)

### Acceptance Criteria Verification

(To be filled during implementation)
