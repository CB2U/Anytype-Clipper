# Spec: Fix Highlight Save Function

## Header

- **Title:** Fix Highlight Save Function
- **Roadmap Anchor:** N/A
- **Priority:** P0
- **Type:** Bug
- **Target Area:** Highlight capture, bookmark capture service, content extraction
- **Target Acceptance Criteria:** AC-U1, AC-U2, AC-U3

---

## Problem Statement

The "Save Highlight" function is incorrectly saving full article content instead of just the highlighted text. When a user selects text on a page and uses the context menu "Send selection to Anytype", the popup correctly displays the highlighted quote in the Context box. However, when clicking "Save Highlight", the extension saves the entire article content (same as "Save as Article") instead of just the highlighted text with its context.

This regression was introduced after implementing spec 032-metadata-extraction, which added HTML-to-Markdown conversion for article content. The highlight capture flow is incorrectly triggering the article extraction and conversion logic, overwriting the user's selected quote.

### Visual Evidence

**Image 1: Popup showing correct highlight context**
![Popup with highlight context](/home/chris/.gemini/antigravity/brain/4774cf3e-b552-40c8-9e88-9bcce09f6904/uploaded_image_0_1767362042439.png)

**Image 2: Anytype showing incorrect full article content**
![Anytype with full article instead of highlight](/home/chris/.gemini/antigravity/brain/4774cf3e-b552-40c8-9e88-9bcce09f6904/uploaded_image_1_1767362042439.png)

---

## Goals and Non-Goals

### Goals

- Fix the Save Highlight function to save ONLY the highlighted text (quote) with context
- Preserve the highlight-specific data structure (quote, contextBefore, contextAfter)
- Ensure highlights do NOT trigger full article extraction or Markdown conversion
- Maintain proper distinction between highlight saves and article saves
- Ensure tags are still applied correctly to highlight objects

### Non-Goals

- Changing the UI/UX of highlight capture
- Modifying the context menu integration
- Changing how highlights are displayed in the popup
- Altering the article extraction functionality

---

## User Stories

### US1: User Capturing Highlights

**As a** knowledge worker capturing important quotes,  
**I want** to save only the text I highlighted, not the entire article,  
**So that** my Anytype workspace contains focused, relevant quotes rather than duplicate full articles.

**Acceptance:**
- Only the highlighted text is saved as the main content
- Context before/after is preserved for reference
- Full article content is NOT included
- Tags are applied correctly
- The saved object is clearly a highlight, not an article

---

## Scope

### In-Scope

- Fix the `handleSave()` function in `popup.ts` to properly distinguish highlight vs article saves
- Ensure `BookmarkCaptureService.captureBookmark()` does not apply article extraction logic to highlights
- Prevent metadata extraction from overwriting highlight-specific fields
- Verify highlight payload structure is preserved through the capture flow
- Test that highlights save correctly with only quote + context

### Out-of-Scope

- Redesigning the highlight capture UI
- Adding new highlight features (multiple highlights per page, etc.)
- Changing the context extraction algorithm
- Modifying the article extraction functionality
- Changes to the Markdown conversion logic (it should simply not be used for highlights)

---

## Requirements

### Functional Requirements

#### FR-1: Highlight-Specific Capture Path
When `isHighlight` is true in the save flow:
- Do NOT trigger article extraction (`CMD_EXTRACT_ARTICLE`)
- Do NOT apply HTML-to-Markdown conversion
- Use ONLY the highlight payload fields: `quote`, `contextBefore`, `contextAfter`, `url`, `pageTitle`

#### FR-2: Preserve Highlight Data Structure
The highlight object saved to Anytype must contain:
- **Primary content:** The user's selected quote text
- **Metadata:** contextBefore, contextAfter, source URL, page title
- **Tags:** User-selected tags from the popup
- **Type:** Note (type_key: 'note')

#### FR-3: Prevent Article Content Injection
When saving a highlight:
- The `metadata.content` field must NOT be populated with full article HTML/Markdown
- The `metadata.textContent` field must NOT be used as a fallback
- Only the quote should appear as the main body content

#### FR-4: Maintain Article Save Functionality
The "Save as Article" button must continue to work correctly:
- Full article extraction with Readability
- HTML-to-Markdown conversion
- Rich metadata extraction
- No regression in article capture quality

### Non-Functional Requirements

#### NFR-1: Reliability
- Highlight saves must succeed 100% of the time when quote data is present
- No errors or exceptions during highlight save flow
- Graceful handling if highlight data is missing

#### NFR-2: Performance
- Highlight saves should be faster than article saves (no extraction overhead)
- No unnecessary API calls or metadata extraction for highlights

#### NFR-3: Data Integrity
- Quote text must be preserved exactly as selected by the user
- Context must not be truncated or modified
- Tags must be applied correctly

### Constraints

#### Security Constraints
- No changes to authentication or API security
- Maintain existing data validation

#### Data Integrity Constraints
- Highlight data must not be corrupted by article extraction logic
- User's selected text must be preserved verbatim

#### Performance Constraints
- Highlight saves should complete within 2 seconds (faster than articles)

---

## Acceptance Criteria

### AC-U1: Highlight Saves Only Quote
**Given** a user has selected text on a page and triggered highlight capture  
**When** the user clicks "Save Highlight" in the popup  
**Then** the saved Note in Anytype contains ONLY the highlighted quote as the main content  
**And** the full article content is NOT included

**Verification approach:** Manual test: Select a short quote from a long article, save as highlight, verify Anytype Note contains only the quote

### AC-U2: Context is Preserved
**Given** a user saves a highlight  
**When** the highlight is saved to Anytype  
**Then** the contextBefore and contextAfter fields are preserved  
**And** they can be displayed or stored as metadata

**Verification approach:** Manual test: Verify context is visible in Anytype or stored in object properties

### AC-U3: Article Save Still Works
**Given** a user clicks "Save as Article"  
**When** the article is saved  
**Then** the full article content is extracted and converted to Markdown  
**And** rich metadata is included  
**And** no regression from previous behavior

**Verification approach:** Manual test: Save an article, verify full content and metadata are present in Anytype

### AC-U4: Tags Applied to Highlights
**Given** a user adds tags to a highlight in the popup  
**When** the highlight is saved  
**Then** the tags are correctly applied to the Note object in Anytype

**Verification approach:** Manual test: Add tags to highlight, verify they appear in Anytype

---

## Dependencies

### Epic Dependencies
- **Epic 3.1 (Highlight Capture):** Original highlight capture implementation
- **Epic 3.2 (Metadata Extraction):** Introduced the regression by adding article extraction logic

### Technical Dependencies
- `popup.ts` - UI and save orchestration
- `service-worker.ts` - Message routing
- `bookmark-capture-service.ts` - Capture logic
- `metadata-script.ts` - Content extraction (should NOT run for highlights)
- Anytype API client

### External Dependencies
- None

---

## Risks and Mitigations

### Risk 1: Breaking Article Saves While Fixing Highlights
**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Add explicit conditional logic to separate highlight vs article flows
- Test both highlight and article saves thoroughly
- Use feature flags or type checks to ensure correct path is taken

### Risk 2: Metadata Extraction Still Triggered
**Impact:** High  
**Probability:** Medium  
**Mitigation:**
- Check the save flow to ensure `CMD_EXTRACT_ARTICLE` is not called when `isHighlight` is true
- Add guards in `BookmarkCaptureService` to skip article-specific logic for highlights
- Log the execution path to verify correct flow

### Risk 3: Highlight Payload Structure Changed
**Impact:** Medium  
**Probability:** Low  
**Mitigation:**
- Review the highlight payload structure from context menu injection
- Ensure `currentHighlight` object is correctly populated
- Verify payload is not overwritten by metadata extraction

---

## Open Questions

None - bug is well-defined and reproducible.

---

## Root Cause Analysis

Based on code review of `popup.ts` and `bookmark-capture-service.ts`:

### Issue 1: Article Extraction Triggered for All Saves
In `popup.ts`, the `loadCurrentTab()` function calls `CMD_EXTRACT_ARTICLE` for the active tab, which populates `currentMetadata` with full article content. This happens BEFORE the user decides whether to save as highlight or article.

### Issue 2: Metadata Overrides Highlight Content
In `handleSave()`, when `isHighlight` is true, the function still uses `currentMetadata` which contains the full article content from the earlier extraction. The highlight-specific fields (`quote`, `contextBefore`, `contextAfter`) are added to the payload, but the `metadata` object already contains `content` and `textContent` from the article extraction.

### Issue 3: BookmarkCaptureService Uses Metadata Content
In `bookmark-capture-service.ts` lines 53-71, when `type_key === 'note'`, the service uses `metadata.content` or `metadata.textContent` as the description/body. For highlights, this should use the `quote` field instead.

### Root Cause Summary
The highlight save flow is not properly isolated from the article extraction logic. The `currentMetadata` object is shared between both flows, and the article content overwrites the highlight-specific quote.

---

## EVIDENCE
 
### Automated Tests
 
#### Unit Tests (T6)
Created `tests/unit/bookmark-capture-service.test.ts` to verify highlight logic isolation.
- `should use quote as description when isHighlightCapture is true`: PASSED
- `should use metadata.content when isHighlightCapture is false`: PASSED
- `should prioritize quote over metadata.content`: PASSED
 
#### Integration Tests (T7)
Updated `tests/integration/api-client-highlight.test.ts` to verify payload structure.
- `createObject handles highlight as correctly formatted note`: PASSED
- Verified `type_key: 'note'` and usage of quote in body.
 
#### Regression Testing (T8)
Ran full test suite (`npm test`):
- **Result:** 19/19 Test Suites Passed
- **Total Tests:** 101/101 Passed
- **Time:** 1.317s
 
### Verification of Acceptance Criteria
 
| AC | Description | Status | Evidence |
|----|-------------|--------|----------|
| **AC-U1** | Highlight saves only quote (not full article) | ✅ Verified | `tests/unit/bookmark-capture-service.test.ts` ensures `description` = `quote` when `isHighlightCapture=true`. |
| **AC-U2** | Context is preserved | ✅ Verified | `tests/integration/api-client-highlight.test.ts` verifies context fields are passed to API. |
| **AC-U3** | Article save still works | ✅ Verified | Existing `tests/integration/article-metadata.test.ts` passed in full suite run. |
| **AC-U4** | Tags applied to highlights | ✅ Verified | `tests/integration/api-client-highlight.test.ts` verifies tags in payload. |

### Manual Verification
- **Test:** Use "Send selection to Anytype" context menu and click "Save Highlight".
- **Result:** ✅ Highlighted text was saved correctly (User Confirmed).
- **Date:** 2026-01-02

**End of Specification**
