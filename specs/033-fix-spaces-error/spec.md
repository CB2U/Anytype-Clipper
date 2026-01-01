# Specification: Fix Spaces Loading Error

## 1. Overview
**Goal:** Fix the "Error loading spaces" issue in the popup where the Space selector fails to populate despite the Anytype API being available.

**Type:** Bug  
**Priority:** P0 (Blocking)  
**Roadmap Anchor:** N/A (Maintenance)

## 2. Problem Statement
The user reports that when opening the Clipper extension popup, the "Save to Space" dropdown displays "Error loading spaces". 
- The Anytype desktop app is running.
- The user can reach `localhost:31009` (returns 404, validating connectivity).
- No visible errors in the console (implying handled exception).

The current implementation in `popup.ts` catches errors during `CMD_GET_SPACES` and displays the generic error message. We need to identify why the API request is failing or returning an unexpected format, and fix it.

## 3. Hypothesis & Analysis
Possible causes:
1.  **Auth Header Missing/Invalid:** The `AnytypeApiClient` might not be attaching the API key correctly for the `/v1/spaces` call, or the key is missing from storage.
2.  **Schema Mismatch:** The API might be returning a response format different from what `AnytypeApiClient` expects (e.g., `data` wrapper vs flat list), causing validation to fail.
3.  **Port Mismatch:** Although the user says `31009` is reachable, the extension might be trying a different port if not configured correctly.
4.  **CORS:** (Unlikely for extension, but possible if Permissions are wrong).

Given "No console errors" in the inspector (as reported by user, though `console.error` exists in the catch block), it's possible the error is happening in the Background worker and not propagating fully, or the user missed the red text in the busy console.

## 4. Requirements

### Functional
- **FR1:** The Space selector MUST populate with the list of Spaces from the running Anytype instance.
- **FR2:** If the API call fails, the error message in the console/UI MUST be descriptive (e.g., "Auth failed", "Network error", "Invalid response").
- **FR3:** Connectivity must work with the default API port (31009).

## 5. Proposed Solution
1.  **Enhanced Logging:** Add detailed logging in `AnytypeApiClient` and `popup.ts` to reveal the exact error object (Network vs Auth vs Parsing).
2.  **Verify API Client:** strict check of the `/v1/spaces` response handling.
3.  **Fix:** Adjust the client code to match the actual API behavior (likely a schema adjustment or auth header fix).
4.  **Retry logic:** Ensure `loadSpaces` retries once if it fails due to a transient issue (optional, but good for P0).

## 6. Verification Plan
- **Manual Verification:**
    1.  Open Anytype Desktop.
    2.  Open Extension Popup.
    3.  Verify "Save to Space" dropdown lists spaces (e.g., "Personal", "Work").
    4.  Verify no "Error loading spaces" message.

## EVIDENCE

### Task Completion
- **T1 (Debug Script):** Created `src/lib/api/verify_spaces_standalone.ts`. Run result: `HTTP 401` confirmed connectivity to `localhost:31009` but indicated missing auth.
- **T2 (Schema Fix):** Updated `getSpaces` in `src/lib/api/client.ts` to handle:
  - `Space[]` (Array)
  - `{ spaces: Space[] }` (Standard)
  - `{ data: Space[] }` (Common alternative)
- **T3/T4 (Error Handling):** Added logging to Service Worker and exposed specific error messages (including Auth/401) in Popup UI.
- **T5 (Build):** Build successful (`vite build`).

### Verification Steps
To be performed by user:
1. Load unpacked extension.
2. Open Popup.
3. If "Authentication failed" appears -> Reconnect.
4. If Spaces list appears -> Fixed.

**Result (2026-01-01):** User confirmed "I now see my anytype spaces listed in the dropdown." Fix verified.
