# Epic 6.2: Append Mode - Implementation Plan

**Epic:** 6.2 Append Mode  
**Dependencies:** Epic 6.0 (URL Deduplication), Epic 3.1 (Highlight Capture)  
**Estimated Effort:** 8-12 hours

---

## Architecture Overview

### Components

```
┌─────────────────────────────────────────────────────────────┐
│                         Popup UI                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Duplicate Detection Dialog                            │ │
│  │  [Skip] [Create Anyway] [Append to Existing] ← NEW    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                   Service Worker                             │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  AppendService (NEW)                                   │ │
│  │  - appendToObject(objectId, content, metadata)         │ │
│  │  - formatAppendedContent(content, metadata)            │ │
│  │  - fetchObjectContent(objectId)                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  DeduplicationService (MODIFY)                         │ │
│  │  - Add support for returning duplicate object ID       │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Anytype Local API                         │
│  - GET /v1/spaces/{space_id}/objects/{object_id}            │
│  - PATCH /v1/spaces/{space_id}/objects/{object_id}          │
└─────────────────────────────────────────────────────────────┘
```

---

## Proposed Changes

### 1. AppendService (NEW)

**File:** `src/lib/services/append-service.ts`

**Purpose:** Handle appending content to existing Anytype objects

**Methods:**

```typescript
class AppendService {
  /**
   * Append content to existing object
   * @param spaceId - Anytype space ID
   * @param objectId - Object to append to
   * @param content - New content to append
   * @param metadata - Source metadata (URL, title, timestamp)
   * @returns Updated object or error
   */
  async appendToObject(
    spaceId: string,
    objectId: string,
    content: string,
    metadata: AppendMetadata
  ): Promise<AppendResult>

  /**
   * Format appended content with timestamp and source
   * @param content - Content to append
   * @param metadata - Source metadata
   * @returns Formatted markdown section
   */
  formatAppendedContent(
    content: string,
    metadata: AppendMetadata
  ): string

  /**
   * Fetch existing object content
   * @param spaceId - Anytype space ID
   * @param objectId - Object ID
   * @returns Object content or error
   */
  private async fetchObjectContent(
    spaceId: string,
    objectId: string
  ): Promise<string>
}
```

**Implementation Strategy:**
1. **Fetch-Modify-Update Approach** (safest for MVP)
   - Fetch existing object content via GET API
   - Append formatted content locally
   - Update object via PATCH API
2. **Format:** Markdown section with horizontal rule, timestamp, source link
3. **Error Handling:** Graceful degradation, user-friendly error messages

---

### 2. Duplicate Detection Dialog (MODIFY)

**File:** `src/popup/popup.ts` or `src/popup/components/duplicate-dialog.ts`

**Changes:**
- Add third button: "Append to Existing"
- Pass duplicate object ID to append handler
- Show loading state during append operation
- Display success/error messages

**UI Mockup:**
```
┌─────────────────────────────────────────────────────┐
│  Duplicate Detected                                  │
│                                                       │
│  This URL already exists in your Anytype:            │
│  "Article Title" (created 2 days ago)                │
│                                                       │
│  What would you like to do?                          │
│                                                       │
│  [Skip]  [Create Anyway]  [Append to Existing]      │
└─────────────────────────────────────────────────────┘
```

---

### 3. DeduplicationService (MODIFY)

**File:** `src/lib/services/deduplication-service.ts`

**Changes:**
- Return duplicate object ID in `DuplicateCheckResult`
- Modify `checkForDuplicates()` to include object ID in response

**Type Updates:**
```typescript
interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateObjectId?: string; // NEW
  duplicateTitle?: string;
  duplicateCreatedAt?: string;
}
```

---

### 4. Type Definitions (NEW)

**File:** `src/types/append.d.ts`

```typescript
export interface AppendMetadata {
  url: string;
  pageTitle: string;
  timestamp: string; // ISO 8601
  captureType: 'bookmark' | 'article' | 'highlight';
}

export interface AppendResult {
  success: boolean;
  objectId?: string;
  error?: string;
}

export interface AppendOptions {
  spaceId: string;
  objectId: string;
  content: string;
  metadata: AppendMetadata;
}
```

---

### 5. Service Worker Integration (MODIFY)

**File:** `src/service-worker.ts`

**Changes:**
- Add `CMD_APPEND_TO_OBJECT` message handler
- Integrate AppendService
- Handle append errors and return to popup

**Message Handler:**
```typescript
case 'CMD_APPEND_TO_OBJECT': {
  const { spaceId, objectId, content, metadata } = message;
  const appendService = new AppendService();
  const result = await appendService.appendToObject(
    spaceId,
    objectId,
    content,
    metadata
  );
  return { success: result.success, data: result, error: result.error };
}
```

---

## Data Flow

### Append Flow (Duplicate Detected)

```
1. User captures bookmark/article
   ↓
2. DeduplicationService.checkForDuplicates()
   → Returns: { isDuplicate: true, duplicateObjectId: "abc123", ... }
   ↓
3. Popup shows duplicate dialog with 3 buttons
   ↓
4. User clicks "Append to Existing"
   ↓
5. Popup sends CMD_APPEND_TO_OBJECT to service worker
   {
     spaceId: "space_id",
     objectId: "abc123",
     content: "New article content or highlight",
     metadata: {
       url: "https://example.com",
       pageTitle: "Example Article",
       timestamp: "2026-01-04T18:00:00Z",
       captureType: "article"
     }
   }
   ↓
6. AppendService.appendToObject()
   a. Fetch existing object content
   b. Format new content with timestamp and source
   c. Append to existing content
   d. Update object via PATCH API
   ↓
7. Return result to popup
   ↓
8. Popup shows success/error message
```

### Append Flow (Multiple Highlights)

```
1. User highlights text A on page
   ↓
2. Saves to Anytype (creates new object "obj_1")
   ↓
3. User highlights text B on same page
   ↓
4. DeduplicationService detects duplicate (same URL)
   → Returns: { isDuplicate: true, duplicateObjectId: "obj_1", ... }
   ↓
5. User clicks "Append to Existing"
   ↓
6. AppendService appends highlight B to obj_1
   ↓
7. User highlights text C on same page
   ↓
8. Repeat steps 4-6 for highlight C
   ↓
9. Final object contains: original highlight A + appended highlight B + appended highlight C
```

---

## Append Content Format

### Bookmark/Article Append
```markdown
---

## 2026-01-04T18:00:00Z - Example Article

**Source:** [https://example.com](https://example.com)

[New article content or note]
```

### Highlight Append
```markdown
---

## 2026-01-04T18:00:00Z - Example Article

**Source:** [https://example.com](https://example.com)

> "Highlighted quote text"

**Context:** ...before text... **[HIGHLIGHT]** ...after text...

**Note:** [User's optional note]
```

---

## API Integration

### Anytype Local API Endpoints

**Fetch Object:**
```
GET /v1/spaces/{space_id}/objects/{object_id}

Response:
{
  "id": "abc123",
  "type": "Bookmark",
  "properties": {
    "name": "Article Title",
    "description": "Existing content...",
    ...
  }
}
```

**Update Object:**
```
PATCH /v1/spaces/{space_id}/objects/{object_id}

Body:
{
  "properties": {
    "description": "Existing content...\n\n---\n\n## 2026-01-04T18:00:00Z...",
    ...
  }
}

Response:
{
  "id": "abc123",
  "success": true
}
```

**Open Questions:**
- Does PATCH support partial updates or full replacement?
- Is there a block-based append API?
- What's the rate limit for API calls?

---

## Testing Strategy

### Unit Tests

**File:** `src/lib/services/append-service.test.ts`

**Tests:**
1. `formatAppendedContent()` - Verify markdown format
2. `formatAppendedContent()` - Verify timestamp format (ISO 8601)
3. `formatAppendedContent()` - Verify source link format
4. `appendToObject()` - Mock API success
5. `appendToObject()` - Mock API error
6. `appendToObject()` - Verify content concatenation

**File:** `src/lib/services/deduplication-service.test.ts`

**Tests:**
7. `checkForDuplicates()` - Verify object ID returned
8. `checkForDuplicates()` - Verify no object ID when not duplicate

### Integration Tests

**File:** `tests/integration/append-flow.test.ts`

**Tests:**
9. End-to-end append flow (mock Anytype API)
10. Multiple highlights to same object
11. Append with API error (graceful degradation)

### Manual Tests

**Test 1: Append Bookmark**
1. Capture bookmark from URL A (creates object)
2. Capture bookmark from URL A again
3. Click "Append to Existing"
4. Open object in Anytype
5. Verify appended content with timestamp and source

**Test 2: Multiple Highlights**
1. Highlight text A on page, save (creates object)
2. Highlight text B on same page, append
3. Highlight text C on same page, append
4. Open object in Anytype
5. Verify all 3 highlights present with timestamps

**Test 3: Error Handling**
1. Disconnect Anytype
2. Capture bookmark, detect duplicate
3. Click "Append to Existing"
4. Verify error message shown
5. Verify no data loss

---

## Acceptance Criteria Verification

### AC17: Multiple Highlights Appended
**Verification:** Manual Test 2 (above)

### AC-A1: Append Option Appears
**Verification:**
- Unit test: Duplicate detection returns object ID
- Manual test: Verify button appears in dialog

### AC-A2: Append Preserves Existing Content
**Verification:**
- Unit test: Content concatenation
- Manual test: Verify original content unchanged

### AC-A3: Timestamp and Source Link Present
**Verification:**
- Unit test: `formatAppendedContent()` format
- Manual test: Verify timestamp and link in Anytype

---

## Rollout Plan

### Phase 1: Core Implementation (MVP)
- AppendService with fetch-modify-update
- Duplicate dialog "Append" button
- Basic error handling
- Manual testing

### Phase 2: Polish
- Loading states
- Success/error messages
- Unit tests
- Integration tests

### Phase 3: Future Enhancements (Post-MVP)
- Manual append mode (object picker)
- Custom append templates
- Optimistic locking
- Block-based append API (if available)

---

## Risks & Mitigations

### Risk 1: API Limitations
**Mitigation:** Research API early, implement fetch-modify-update fallback

### Risk 2: Concurrent Modifications
**Mitigation:** Accept risk for MVP, add version checking in Phase 3

### Risk 3: Large Object Performance
**Mitigation:** Show loading state, optimize content fetching

---

## Open Questions for Implementation

1. **API Capabilities:** Does Anytype support block-based append or only full content update?
2. **Content Field:** Which field stores object content? `description`, `content`, or `blocks`?
3. **Markdown Support:** Does Anytype render markdown in object content?
4. **Rate Limits:** Are there API rate limits we need to handle?

**Action:** Research Anytype API documentation and test with sample requests before implementation.
