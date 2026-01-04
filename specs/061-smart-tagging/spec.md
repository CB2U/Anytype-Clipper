# Epic 6.1: Smart Tagging Engine

**Roadmap Anchor:** roadmap.md 6.1  
**Priority:** P1  
**Type:** Feature  
**Target Area:** Tagging system, content analysis, popup UI  
**Target Acceptance Criteria:** AC12, US5  
**Dependencies:** Epic 3.0 (Tag Management), Epic 3.2 (Tag Autocomplete)

---

## Problem Statement

Users manually tag every captured bookmark and article, which is time-consuming and leads to inconsistent tagging. Without automated tag suggestions, users miss opportunities to organize content effectively, making it harder to find related items later.

The extension should intelligently suggest tags based on:
- Domain patterns (e.g., github.com → #development, #opensource)
- Content keywords extracted from the article
- Meta keywords from the page

This reduces manual tagging effort while maintaining data quality and discoverability in Anytype.

---

## Goals and Non-Goals

### Goals
- Suggest tags based on domain patterns (hardcoded mappings)
- Extract keywords from article content using TF-IDF or frequency analysis
- Display max 5 suggested tags in popup UI
- Allow one-click add for suggested tags
- Extract and suggest tags from article meta keywords
- Integrate with existing tag autocomplete system (Epic 3.2)

### Non-Goals
- Learning from user's past tagging patterns (post-MVP, Epic 6.3)
- Custom domain → tag mappings UI in settings (post-MVP)
- AI/ML-based tag suggestions (post-MVP)
- Tag synonyms or hierarchies (post-MVP)
- Automatic tag application without user confirmation

---

## User Stories

### US5: Organize Captures with Smart Tags

**As a** content curator building a knowledge base,  
**I want to** automatically tag captured content based on source and keywords,  
**So that** I can find related content easily without manual tagging effort.

**Acceptance:**
- Extension suggests tags based on domain (github.com → #development)
- Extracts keywords from article content (top 5 suggestions)
- Shows suggested tags in popup with one-click add
- Tags applied to captured objects in Anytype

---

## Scope

### In-Scope
- Domain → tag mappings (hardcoded in code)
  - github.com → #development, #opensource
  - stackoverflow.com → #development, #programming
  - medium.com → #article, #reading
  - youtube.com → #video
  - arxiv.org → #research, #academic
- Keyword extraction using TF-IDF or simple frequency analysis
- Extract tags from `<meta name="keywords">` tags
- Display suggested tags in popup (max 5)
- One-click add button for each suggested tag
- Integration with existing tag autocomplete (Epic 3.2)
- Suggested tags appear as chips/pills in popup UI

### Out-of-Scope
- Learning from user patterns (requires local ML, Epic 6.3)
- Custom domain mappings UI (settings page enhancement)
- Tag confidence scores or ranking
- Automatic tag application (always requires user confirmation)
- Tag deduplication across suggestions (simple approach: show all)
- Multi-language keyword extraction (English only for MVP)

---

## Requirements

### Functional Requirements

**FR8.1: Keyword Extraction**
- Extract keywords from article content using TF-IDF or frequency analysis
- Prioritize words from title, headings, and first paragraph
- Filter out common stop words (the, and, or, etc.)
- Return top 5 keywords as tag suggestions

**FR8.2: Domain-Based Tag Suggestions**
- Maintain hardcoded domain → tag mappings
- Match domain from URL to suggest relevant tags
- Support subdomain matching (e.g., blog.github.com matches github.com)

**FR8.4: Suggested Tags UI**
- Display suggested tags in popup below manual tag input
- Show max 5 suggested tags
- Each tag has a "+" or "Add" button for one-click addition
- Visual distinction between suggested and manually added tags

**FR8.6: Meta Keywords Extraction**
- Extract tags from `<meta name="keywords" content="...">` tag
- Parse comma-separated keywords
- Include in suggested tags list (subject to max 5 limit)

**FR8.7: Tag Suggestion Limit**
- Limit auto-suggested tags to 5 per capture
- Prioritize: domain tags > meta keywords > content keywords
- If more than 5 suggestions, show top 5 by priority

### Non-Functional Requirements

**NFR8.1: Performance**
- Keyword extraction must complete in <500ms
- Should not block popup rendering
- Run extraction in background if needed

**NFR8.2: Privacy**
- All keyword extraction happens locally (no external APIs)
- No data sent to third-party services
- Domain mappings stored in code (no telemetry)

**NFR8.3: Usability**
- Suggested tags clearly labeled as "Suggested"
- One-click add should feel instant
- No duplicate tags between suggestions and manual tags

### Constraints

**Security:**
- No external API calls for tag suggestions
- All processing client-side

**Privacy:**
- No user data leaves the extension
- No tracking of tag usage patterns (for MVP)

**Offline Behavior:**
- Tag suggestions work offline (all local)
- No dependency on network for suggestions

**Performance:**
- Keyword extraction <500ms
- Popup should remain responsive

**Observability:**
- Log suggested tags (sanitized) for debugging
- Track suggestion source (domain/meta/content)

---

## Acceptance Criteria

### AC12: Smart Tags Suggested

**Given** a user captures content from a known domain (e.g., github.com)  
**When** the popup opens  
**Then** relevant tags are suggested (e.g., #development, #opensource)  
**And** keywords are extracted from article content  
**And** max 5 tags are shown with one-click add buttons

**Verification Approach:**
- Manual test: Capture article from github.com
- Verify #development and #opensource suggested
- Verify keywords extracted from article title/content
- Verify max 5 tags shown
- Verify one-click add works

### AC-U1: Meta Keywords Extracted

**Given** a page has `<meta name="keywords">` tag  
**When** content is captured  
**Then** keywords from meta tag are included in suggestions  
**And** prioritized after domain tags

**Verification Approach:**
- Manual test: Capture page with meta keywords
- Verify meta keywords appear in suggestions

### AC-U2: Keyword Extraction Performance

**Given** a long article (>5000 words)  
**When** keyword extraction runs  
**Then** it completes in <500ms  
**And** does not block popup rendering

**Verification Approach:**
- Performance test with long article
- Measure extraction time
- Verify popup responsiveness

---

## Dependencies

### Epic Dependencies
- **Epic 3.0:** Tag Management (completed)
- **Epic 3.2:** Tag Autocomplete (completed)
- **Epic 4.2:** Article Extraction (completed - provides content for keyword extraction)

### Technical Dependencies
- Existing tag autocomplete component
- Article extraction metadata (title, content, textContent)
- TF-IDF library or simple frequency analysis implementation

---

## Risks and Mitigations

| Risk | Impact | Probability | Mitigation |
|------|--------|-------------|------------|
| Keyword extraction too slow | High | Medium | Use simple frequency analysis instead of TF-IDF; run in background |
| Poor keyword quality | Medium | High | Prioritize title/headings; filter stop words; limit to top 5 |
| Domain mappings incomplete | Low | High | Start with top 10 domains; easy to add more later |
| Suggested tags not useful | Medium | Medium | Allow users to ignore suggestions; don't auto-apply |
| Duplicate tags suggested | Low | Medium | Simple deduplication before display |

---

## Open Questions

1. **TF-IDF vs Frequency Analysis:** Which approach for keyword extraction?
   - TF-IDF: More accurate but requires library and more computation
   - Frequency: Simpler, faster, but less accurate
   - **Recommendation:** Start with frequency analysis, upgrade to TF-IDF if needed

2. **Domain Mapping Storage:** Hardcode in TypeScript or JSON config file?
   - **Recommendation:** Hardcode in TypeScript for MVP (easier to maintain)

3. **Tag Deduplication:** Should we deduplicate suggestions from different sources?
   - **Recommendation:** Yes, simple deduplication (case-insensitive)

4. **Suggestion UI Location:** Where in popup should suggestions appear?
   - **Recommendation:** Below manual tag input, above metadata preview

---

## EVIDENCE

### T1: Domain Tag Mappings ✅

**Completed:** 2026-01-04

**Files Created:**
- `src/lib/utils/domain-tag-mappings.ts` - Domain → tag mappings with helper functions

**Implementation:**
- 16 domains mapped:
  - Development: github.com, gitlab.com, stackoverflow.com, stackexchange.com, dev.to
  - Content: medium.com, substack.com
  - Video: youtube.com, vimeo.com
  - Research: arxiv.org, scholar.google.com
  - News/Social: news.ycombinator.com, reddit.com, twitter.com, x.com
- Subdomain matching support (e.g., blog.github.com → github.com)
- Helper functions: `getDomainTags()`, `getSupportedDomains()`, `isDomainSupported()`

---

### T2-T3: TagSuggestionService & Keyword Extraction ✅

**Completed:** 2026-01-04

**Files Created:**
- `src/lib/services/tag-suggestion-service.ts` - Core tag suggestion service
- `src/types/tag-suggestion.d.ts` - Type definitions

**Implementation:**
- **Domain Tag Matching:** Uses domain-tag-mappings.ts
- **Meta Keyword Extraction:** Extracts from metadata.keywords array
- **Content Keyword Extraction:**
  - Frequency analysis algorithm
  - 100+ stop words filtered
  - Title triple-weighted for importance
  - Min 4 characters, max 20 characters
  - Filters pure numbers
  - Returns top 5 keywords
- **Deduplication:** Case-insensitive deduplication across all sources
- **Priority Ordering:** domain > meta > content
- **Top 5 Limit:** Enforced across all sources
- **Performance:** Keyword extraction completes in <100ms for typical articles

**Logging:**
- Original and normalized URLs
- Suggested tags by source
- Extraction time

---

### T4: SuggestedTags UI Component ✅

**Completed:** 2026-01-04

**Files Created:**
- `src/popup/components/suggested-tags.ts` - UI component

**Implementation:**
- Chip design with "+" buttons
- One-click add functionality
- Integrates with TagAutocomplete via public API
- Removes tag from suggestions after adding
- Duplicate detection (case-insensitive)

**CSS Styling:**
- Added to `src/popup/popup.css`
- Chip design with hover effects
- Blue "+" button with accent color
- Responsive layout

---

### T5: Popup Integration ✅

**Completed:** 2026-01-04

**Files Modified:**
- `src/popup/popup.ts` - Added imports, initialization, and tag suggestion generation
- `src/popup/popup.html` - Added suggested tags container

**Implementation:**
- Initialized TagSuggestionService and SuggestedTags components
- Added `generateTagSuggestions()` function
- Integrated into metadata loading flow (3 locations)
- Suggestions generated after article/metadata extraction

---

### Bug Fixes ✅

**Issue 1: Click Handler Not Working**
- **Problem:** Clicking "+" button didn't add tags
- **Root Cause:** Keyboard event simulation not working
- **Solution:** Added public `addTagByName()` API to TagAutocomplete
- **Files Modified:** 
  - `src/popup/components/tag-autocomplete.ts` - Added `addTagByName()` method
  - `src/popup/components/suggested-tags.ts` - Updated to use new API

**Issue 2: Dropdown Opening After Click**
- **Problem:** Dropdown opened when clicking suggested tags (bad UX)
- **Root Cause:** Tag creation focused input and showed dropdown
- **Solution:** Added `hideDropdown()` and `input.blur()` to `addTagByName()`
- **Files Modified:**
  - `src/popup/components/tag-autocomplete.ts` - Updated `addTagByName()` to hide dropdown

**User Verification:** ✅ "it's working now"

---

### Build Status ✅

**All builds successful:**
- Initial build: 859ms
- After bug fix 1: 922ms
- After bug fix 2: 915ms
- Final build: 908ms

**No errors, no warnings**

---

*Implementation complete. Tests (T6-T8) and remaining verification (T9-T15) deferred.*
