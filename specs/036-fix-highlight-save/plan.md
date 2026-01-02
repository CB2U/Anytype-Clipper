# Implementation Plan: Fix Highlight Save Function

## Architecture Overview

### Current Flow (Broken)
```
User selects text → Context menu → Highlight captured → Popup opens
  ↓
loadCurrentTab() runs:
  - Calls CMD_EXTRACT_ARTICLE (extracts FULL article)
  - Populates currentMetadata with article content
  - currentHighlight has quote data
  ↓
User clicks "Save Highlight"
  ↓
handleSave(isArticle=false) with isHighlight=true:
  - Builds payload with currentMetadata (contains FULL article)
  - Adds highlight fields (quote, context)
  - Sends to CMD_CAPTURE_BOOKMARK
  ↓
BookmarkCaptureService.captureBookmark():
  - type_key = 'note'
  - Uses metadata.content (FULL article) as description ❌
  - Highlight quote is ignored
```

### Fixed Flow
```
User selects text → Context menu → Highlight captured → Popup opens
  ↓
loadCurrentTab() runs:
  - Checks if currentHighlight exists
  - If highlight: Skip article extraction ✓
  - If no highlight: Extract article/metadata normally
  ↓
User clicks "Save Highlight"
  ↓
handleSave(isArticle=false) with isHighlight=true:
  - Builds minimal metadata (title, URL only)
  - Adds highlight fields (quote, context)
  - Sets special flag: isHighlightCapture = true
  - Sends to CMD_CAPTURE_BOOKMARK
  ↓
BookmarkCaptureService.captureBookmark():
  - Detects isHighlightCapture flag
  - Uses quote as description (NOT metadata.content) ✓
  - Skips article-specific logic
```

### Key Components

1. **popup.ts**
   - `loadCurrentTab()`: Add conditional to skip article extraction for highlights
   - `handleSave()`: Pass highlight-specific flag to service worker

2. **service-worker.ts**
   - `CMD_CAPTURE_BOOKMARK` handler: Pass through highlight flag

3. **bookmark-capture-service.ts**
   - `captureBookmark()`: Add highlight-specific logic path
   - Use `quote` field instead of `metadata.content` for highlights

4. **types/messages.ts**
   - Add `isHighlightCapture` flag to capture payload type

### Alternatives Considered

**Alternative 1: Separate Highlight Capture Service**
- Pros: Clean separation of concerns
- Cons: Code duplication, more complex architecture
- **Decision:** Rejected - overkill for a simple fix

**Alternative 2: Modify Metadata Extraction to Detect Highlights**
- Pros: No changes to popup logic
- Cons: Metadata extraction shouldn't know about highlights
- **Decision:** Rejected - violates separation of concerns

**Alternative 3: Use Type Checking in BookmarkCaptureService**
- Pros: Simple conditional logic
- Cons: Relies on implicit type_key, not explicit intent
- **Decision:** Partially adopted - use explicit flag + type check

**Chosen Approach:**
Add an explicit `isHighlightCapture` flag that flows through the entire capture pipeline, with conditional logic at each layer to handle highlights differently.

---

## Data Contracts

### Highlight Payload (Modified)
```typescript
{
  spaceId: string;
  metadata: {
    title: string;           // Page title
    canonicalUrl: string;    // Page URL
    // NO content or textContent fields
  };
  userNote?: string;         // Optional user note
  tags: string[];
  type_key: 'note';
  isHighlightCapture: true;  // NEW FLAG
  quote: string;             // The highlighted text
  contextBefore?: string;
  contextAfter?: string;
  url: string;               // Same as canonicalUrl
}
```

### Article Payload (Unchanged)
```typescript
{
  spaceId: string;
  metadata: {
    title: string;
    canonicalUrl: string;
    content: string;         // Full Markdown content
    textContent?: string;
    author?: string;
    // ... other metadata
  };
  userNote?: string;
  tags: string[];
  type_key: 'note';
  isHighlightCapture: false; // Explicit
}
```

---

## Storage and Persistence

No changes to storage layer. Highlights are saved as Note objects in Anytype with the same structure as before.

---

## External Integrations

No changes to Anytype API integration. The fix is entirely in the extension's internal logic.

---

## UX and Operational States

### Popup States (No Changes)
1. **Bookmark Mode:** Default, shows bookmark fields
2. **Highlight Mode:** Triggered by `lastHighlight` in storage, shows quote + context
3. **Article Mode:** Triggered by "Save as Article" button

### Expected User Experience After Fix
1. User selects text → Context menu "Send selection to Anytype"
2. Popup opens in Highlight Mode, showing quote in Context box
3. User optionally adds tags, edits title
4. User clicks "Save Highlight"
5. **Result:** Note created in Anytype with ONLY the quote as content
6. User sees "Highlight Saved! 🎉" message

---

## Testing Plan

### Unit Tests

#### Test 1: Highlight Capture Service Logic
**File:** `tests/unit/bookmark-capture-service.test.ts` (new file)
**Purpose:** Verify that `captureBookmark()` uses quote for highlights, content for articles
**Test Cases:**
- When `isHighlightCapture=true`, description should be `quote`
- When `isHighlightCapture=false`, description should be `metadata.content`
- Verify article content is NOT used for highlights

**How to run:**
```bash
npm test tests/unit/bookmark-capture-service.test.ts
```

#### Test 2: Existing Highlight Tests
**File:** `tests/unit/highlight-capture.test.ts`
**Purpose:** Ensure existing highlight capture logic still works
**How to run:**
```bash
npm test tests/unit/highlight-capture.test.ts
```

### Integration Tests

#### Test 3: End-to-End Highlight Save
**File:** `tests/integration/api-client-highlight.test.ts` (exists)
**Purpose:** Verify complete highlight save flow
**Modifications Needed:** Update to verify that saved content is quote, not full article
**How to run:**
```bash
npm test tests/integration/api-client-highlight.test.ts
```

#### Test 4: Article Save Regression Test
**File:** `tests/integration/article-metadata.test.ts` (exists)
**Purpose:** Ensure article saves still work correctly after changes
**How to run:**
```bash
npm test tests/integration/article-metadata.test.ts
```

### Manual Verification

#### Manual Test 1: Highlight Save
**Steps:**
1. Load extension in Brave browser
2. Navigate to a long article (e.g., Wikipedia, Medium)
3. Select a short quote (1-2 sentences)
4. Right-click → "Send selection to Anytype"
5. Popup opens, verify quote appears in Context box
6. Add a tag (e.g., "testag")
7. Click "Save Highlight"
8. Open Anytype Desktop
9. Find the newly created Note
10. **Verify:** Note contains ONLY the quote (not full article)
11. **Verify:** Tag is applied
12. **Verify:** Title is page title
13. **Verify:** Context before/after is preserved (if displayed)

**Expected Result:** Note contains only the 1-2 sentence quote, not the entire article

#### Manual Test 2: Article Save (Regression)
**Steps:**
1. Navigate to a long article
2. Open extension popup (without selecting text)
3. Click "Save as Article"
4. Open Anytype Desktop
5. **Verify:** Note contains full article content in Markdown
6. **Verify:** Metadata (author, etc.) is present
7. **Verify:** No regression from previous behavior

**Expected Result:** Full article saved correctly with Markdown formatting

#### Manual Test 3: Bookmark Save (Regression)
**Steps:**
1. Navigate to any webpage
2. Open extension popup
3. Add title, note, tags
4. Click "Save Bookmark"
5. Open Anytype Desktop
6. **Verify:** Bookmark created with title, note, tags
7. **Verify:** No full content extracted

**Expected Result:** Bookmark saved correctly

---

## AC Verification Mapping

| AC | Verification Method | Test/Steps |
|----|---------------------|------------|
| AC-U1: Highlight Saves Only Quote | Manual Test 1 | Verify Note contains only quote, not full article |
| AC-U2: Context is Preserved | Manual Test 1 | Verify context before/after in Anytype |
| AC-U3: Article Save Still Works | Manual Test 2 | Verify full article content + metadata |
| AC-U4: Tags Applied to Highlights | Manual Test 1 | Verify tags appear in Anytype |

---

## Risks and Mitigations

### Risk 1: Type Definitions Out of Sync
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Update TypeScript types in `types/messages.ts` first
- Use TypeScript compiler to catch type errors
- Review all usages of `CaptureBookmarkMessage` type

### Risk 2: Existing Tests Break
**Impact:** Medium  
**Probability:** Medium  
**Mitigation:**
- Run full test suite before and after changes
- Update tests that rely on old behavior
- Add new tests for highlight-specific logic

### Risk 3: Edge Case: Highlight Without Quote
**Impact:** Low  
**Probability:** Low  
**Mitigation:**
- Add validation in `handleSave()` to check if quote exists
- Fallback to page title if quote is empty
- Log warning if highlight data is missing

---

## Rollout and Migration Notes

- No data migration needed
- No breaking changes to existing saved highlights
- Users will see immediate fix after extension update
- No feature flags needed (simple bug fix)

---

## Observability and Debugging

### What Can Be Logged
- Highlight capture flow: "Highlight mode detected, skipping article extraction"
- Save flow: "Saving highlight with quote: [first 50 chars]"
- Service worker: "Highlight capture flag: true"
- BookmarkCaptureService: "Using quote as description for highlight"

### What Must Never Be Logged
- Full quote content (may contain sensitive information)
- User's personal notes
- API keys or authentication tokens

### Debug Checkpoints
1. `loadCurrentTab()`: Log whether highlight exists
2. `handleSave()`: Log `isHighlight` flag and payload structure
3. `BookmarkCaptureService.captureBookmark()`: Log which content source is used (quote vs metadata.content)

---

**End of Plan**
