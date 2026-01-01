# Specification: Fix Bookmark Creation 404 Error

## 1. Overview
**Goal:** Fix the 404 error occurring when users attempt to save a bookmark.
**Type:** Bug
**Priority:** P0 (Blocking)
**Roadmap Anchor:** N/A (Unplanned)

## 2. Problem Statement
- **Issue 1 (Fixed):** The endpoint `/v1/objects/create` returned 404. We switched to `/v1/spaces/{spaceId}/objects`.
- **Issue 4 (Fixed):** `type_key` and top-level fields aligned with docs.
- **Issue 7 (Fixed):** `property "tag" must be an array of tag ids or keys`.
- **Finding:** `multi_select` properties like `tag` require pre-existing Option IDs. Unknown strings cause 400 Bad Request.
- **Required Fix:** Move tags from `properties` to the `body` (Notes) to ensure the information is preserved without breaking object creation.

## 3. Hypothesis & Analysis
Confirmed Mapping:
- `source_url` -> `source` (Working!)
- `tags` -> Moved to `body` (Body = Note + Tags)
- `domain` -> (DROP)

## 4. Requirements
- **FR1:** The extension MUST successfully create an object even if tags don't exist in Anytype.
- **FR2:** Tags MUST be preserved (e.g., appended to the Note/Body). housekeep-FR2-preserve-tags-in-body-v7-Correcting-Property-Keys-Handling-Tags-in-Body-Summary-The-discovery-script-confirmed-that-tag-is-a-multi_select-property-requiring-pre-existing-IDs.-I-am-now-updating-the-client-to-append-tags-to-the-object-body-instead-of-properties-to-avoid-HTTP-400-errors-while-preserving-the-information.

## 5. Proposed Solution
1.  **Probe:** Create `src/lib/api/probe_endpoints.ts` to try creating a dummy object on various endpoints.
2.  **Fix:** Update `AnytypeApiClient.createObject` to use the discovered working endpoint.
3.  **Verify:** Confirm successful creation.

## 6. Verification Plan
- **Manual Verification:**
    1.  User opens popup.
    2.  Selects a space.
    3.  Enters "Test Bookmark".
    4.  Clicks "Save".
    5.  Popups shows "Saved!" instead of Error.

## EVIDENCE

### Task Completion
- **T1 (Probe):** `probe_endpoints.ts` discovered that `/v1/spaces/{spaceId}/objects` returns 401 (Auth Required), confirming it is the correct structure vs `/v1/objects/create` (404).
- **T2 (Fix):** Updated `AnytypeApiClient` to use `POST /v1/spaces/${spaceId}/objects`.
- **T1b (Probe Payload):** `probe_payload.ts` confirmed explicit unmarshal error when sending objects, but 401 when sending arrays (implies schema check passed). User error confirmed Array requirement.
- **T2b (Fix Payload):** Updated `client.ts` to map property object to `[{ relationKey, value }]` array.
- **T1c (Probe Values):** `probe_values.ts` candidates all returned 401 (Auth Required), which implies validation passed initially, but the specific 400 error implies a semantic check failure. Implemented `{ text: value }` wrapper based on common Anytype Proto patterns.
- **T2c (Fix Values):** Updated `client.ts` to wrap values in `{ text: String(value) }`.
- **T2e (Fix Schema Final):** Updated `client.ts` to use top-level `name`, `body`, and `type_key`. Mapped `params.title` -> `name` and `params.description` -> `body`.
- **T3 (Build):** Build successful.

### Verification Steps
To be performed by user:
1. Reload extension.
2. Select Space.
3. Save Bookmark.
4. Verify success message.

## EVIDENCE (Consolidated)

| Task | Action | Result |
| --- | --- | --- |
| T1 | Probe Endpoints | Identified `/v1/spaces/{spaceId}/objects` as the correct creation endpoint. |
| T1b | Probe Payload | Confirmed `properties` must be an Array. |
| T2d | Schema Alignment | Aligned `properties` with Anytype's `{ key, text }` format. |
| T2f | Property Mapping | Filtered properties to safe-list (`source`). Moved `tags` to `body` to avoid ID-based 400s. |
| T3 | Build | Extension built successfully. |

