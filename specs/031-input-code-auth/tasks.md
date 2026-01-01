
# Tasks: Input Code Auth

- [x] T1: Fix API Client Types <!-- id: 0 -->
    - Remove `code` from `CreateChallengeResponse`.
    - Ensure `CreateApiKeyRequest` is correct.
- [x] T2: Update `AuthManager` logic <!-- id: 1 -->
    - Store `challenge_id` in memory/storage.
    - Implement `submitCode(code)` method.
- [x] T3: Update Popup UI for Code Entry <!-- id: 2 -->
    - Replace display with Input Field.
    - Add "Verify" button.
    - Implement "Open in Tab" fallback.
- [x] T4: Implement "Open in Tab" fallback <!-- id: 3 -->
    - Ensure `popup.html` can run as a full page or create `auth.html`
- [x] T5: Manual Verification <!-- id: 4 -->
    - Verify UI flow
- [x] T6: Refine Auth Flow (New Tab & Storage) <!-- id: 5 -->
    - **AuthManager:** Persist `challengeId` and `status` to `storage.local` to prevent state loss.
    - **Popup UI:** "Connect" button opens `popup.html?auth=true` in a new tab and closes popup.
    - **New Tab Logic:** Auto-start auth if `?auth=true`. Close tab on success.
