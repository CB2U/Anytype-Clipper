# Epic 6.1: Smart Tagging Engine - Implementation Plan

## 1. Architecture Overview

The Smart Tagging Engine will consist of three main components:

### 1.1 TagSuggestionService
**Responsibility:** Generate tag suggestions from multiple sources
**Location:** `src/lib/services/tag-suggestion-service.ts`

**Methods:**
- `suggestTags(metadata: PageMetadata, url: string): Promise<string[]>`
  - Orchestrates all suggestion sources
  - Deduplicates and limits to top 5
  - Returns prioritized list of tag suggestions

- `getDomainTags(url: string): string[]`
  - Matches URL domain against hardcoded mappings
  - Returns domain-specific tags

- `extractMetaKeywords(metadata: PageMetadata): string[]`
  - Extracts keywords from meta tags
  - Parses comma-separated values

- `extractContentKeywords(content: string, title: string): string[]`
  - Performs frequency analysis on content
  - Filters stop words
  - Prioritizes title and heading words
  - Returns top 5 keywords

### 1.2 Domain Mappings
**Responsibility:** Store domain → tag mappings
**Location:** `src/lib/utils/domain-tag-mappings.ts`

**Structure:**
```typescript
export const DOMAIN_TAG_MAPPINGS: Record<string, string[]> = {
  'github.com': ['development', 'opensource'],
  'stackoverflow.com': ['development', 'programming'],
  'medium.com': ['article', 'reading'],
  'youtube.com': ['video'],
  'arxiv.org': ['research', 'academic'],
  // ... more mappings
};
```

### 1.3 Suggested Tags UI Component
**Responsibility:** Display suggested tags in popup
**Location:** `src/popup/components/SuggestedTags.ts`

**Features:**
- Renders suggested tags as chips/pills
- "+" button for one-click add
- Integrates with existing TagAutocomplete component
- Visual distinction from manually added tags

### Call Flow

```
Popup.loadCurrentTab()
  ↓
Extract metadata (existing)
  ↓
TagSuggestionService.suggestTags(metadata, url)
  ├─→ getDomainTags(url)
  ├─→ extractMetaKeywords(metadata)
  └─→ extractContentKeywords(content, title)
  ↓
Deduplicate & prioritize
  ↓
Return top 5 suggestions
  ↓
SuggestedTags.render(suggestions)
  ↓
User clicks "+" to add tag
  ↓
TagAutocomplete.addTag(tagName)
```

### Alternatives Considered

**TF-IDF vs Frequency Analysis:**
- **TF-IDF:** More accurate, requires library (natural, tf-idf-js)
- **Frequency Analysis:** Simpler, faster, no dependencies
- **Decision:** Start with frequency analysis for MVP, can upgrade later

**Domain Mappings Storage:**
- **JSON config:** Easier to edit, requires loading
- **TypeScript object:** Type-safe, easier to maintain in code
- **Decision:** TypeScript object for MVP

**UI Location:**
- **Above tag input:** More prominent
- **Below tag input:** Less intrusive, natural flow
- **Decision:** Below tag input, above metadata preview

---

## 2. Data Contracts

### TagSuggestion Interface
```typescript
interface TagSuggestion {
  tag: string;
  source: 'domain' | 'meta' | 'content';
  confidence?: number; // Optional for future use
}
```

### SuggestTagsResult
```typescript
interface SuggestTagsResult {
  suggestions: string[];
  sources: Record<string, 'domain' | 'meta' | 'content'>;
}
```

---

## 3. Storage and Persistence

**No new storage required.**
- Domain mappings: Hardcoded in code
- Suggestions: Generated on-demand, not persisted
- User's tag choices: Already handled by existing tag system

---

## 4. External Integrations

**None.**
- All processing is local
- No external APIs
- No third-party libraries (for MVP)

---

## 5. UX and Operational States

### States

1. **Loading:** Metadata extraction in progress
2. **Suggestions Ready:** Tags suggested, displayed in UI
3. **Tag Added:** User clicked "+", tag added to manual tags
4. **No Suggestions:** No domain match, no keywords found

### UI Mockup (Text)

```
┌─────────────────────────────────────┐
│ Save to Space: [My Space ▼]        │
├─────────────────────────────────────┤
│ Title: [Article Title]              │
│ Note:  [Optional note...]           │
│ Tags:  [#existing #tags]            │
├─────────────────────────────────────┤
│ Suggested Tags:                     │
│ [+ development] [+ opensource]      │
│ [+ javascript] [+ tutorial]         │
├─────────────────────────────────────┤
│ [Save Bookmark] [Save as Article]   │
└─────────────────────────────────────┘
```

---

## 6. Testing Plan

### Unit Tests

**File:** `tests/unit/tag-suggestion-service.test.ts`
**Goal:** Verify tag suggestion logic
**How to run:** `npm test -- tests/unit/tag-suggestion-service.test.ts`

**Test Cases:**
- Domain tag matching (github.com → development, opensource)
- Subdomain matching (blog.github.com → development)
- Meta keyword extraction
- Content keyword extraction (frequency analysis)
- Stop word filtering
- Deduplication
- Top 5 limit enforcement
- Priority ordering (domain > meta > content)

**File:** `tests/unit/domain-tag-mappings.test.ts`
**Goal:** Verify domain mappings are valid
**How to run:** `npm test -- tests/unit/domain-tag-mappings.test.ts`

**Test Cases:**
- All domains have valid tag arrays
- No empty tag arrays
- Tags are lowercase
- No duplicate tags per domain

### Integration Tests

**File:** `tests/integration/tag-suggestions.test.ts`
**Goal:** Test end-to-end suggestion flow
**How to run:** `npm test -- tests/integration/tag-suggestions.test.ts`

**Test Cases:**
- Popup receives suggestions from service
- Suggested tags render in UI
- Click "+" adds tag to manual tags
- No duplicate tags between suggested and manual

### Manual Tests

**Test 1: GitHub Article**
1. Navigate to https://github.com/facebook/react
2. Open extension popup
3. Verify "development" and "opensource" suggested
4. Click "+" on "development"
5. Verify tag added to manual tags
6. Save bookmark
7. Verify tag applied in Anytype

**Test 2: Meta Keywords**
1. Find page with `<meta name="keywords">`
2. Open extension popup
3. Verify meta keywords in suggestions
4. Verify max 5 tags shown

**Test 3: Long Article**
1. Open long article (>5000 words)
2. Open extension popup
3. Verify suggestions appear within 500ms
4. Verify popup remains responsive

---

## 7. AC Verification Mapping

| AC | Verification Method | Test File/Steps |
|----|---------------------|-----------------|
| AC12 | Manual test | Test 1: GitHub Article |
| AC-U1 | Manual test | Test 2: Meta Keywords |
| AC-U2 | Performance test | Test 3: Long Article |

---

## 8. Risks and Mitigations

| Risk | Mitigation |
|------|------------|
| Keyword extraction too slow | Use simple frequency analysis; run in background if needed |
| Poor keyword quality | Prioritize title/headings; filter stop words; user can ignore |
| Domain mappings incomplete | Start with top 10 domains; easy to add more |
| UI clutter | Limit to 5 suggestions; clear visual hierarchy |

---

## 9. Rollout and Migration Notes

**No migration needed.**
- New feature, no existing data to migrate
- Suggestions are optional (user can ignore)
- No breaking changes to existing tag system

**Rollout:**
- Feature can be enabled immediately
- No feature flag needed (low risk)
- Easy to add more domain mappings in future releases

---

## 10. Observability and Debugging

### What Can Be Logged
- Suggested tags (sanitized)
- Suggestion sources (domain/meta/content)
- Keyword extraction time
- Number of suggestions generated before deduplication

### What Must Never Be Logged
- Full article content
- User's manual tag choices (privacy)
- URL parameters (may contain sensitive data)

### Debug Logging
```typescript
console.log('[TagSuggestion] Domain tags:', domainTags);
console.log('[TagSuggestion] Meta keywords:', metaKeywords);
console.log('[TagSuggestion] Content keywords:', contentKeywords);
console.log('[TagSuggestion] Final suggestions:', suggestions);
console.log('[TagSuggestion] Extraction time:', duration, 'ms');
```
