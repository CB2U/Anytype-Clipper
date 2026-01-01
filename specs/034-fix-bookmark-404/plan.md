# Plan: Fix Bookmark Creation 404 Error

## Goal
Identify the correct API endpoint for object creation and update the client to fix the 404 error.

## Technical Approach
1.  **Probe Script:** We cannot just guessed the endpoint. We will write `src/lib/api/probe_endpoints.ts` to try probable REST paths against `localhost:31009`.
    - `POST /v1/objects`
    - `POST /v1/object`
    - `POST /v1/objects/create` (Confirm failure)
    - `POST /v1/spaces/{spaceId}/objects`
2.  **Mock Auth:** The probe script will need an API Key. We'll ask the user to provide one if possible, or we'll assume the user has one from the previous fix (stored in `localStorage`).
    - *Correction:* We can try to read `chrome.storage.local` if we run as an extension context, but for a standalone script, we might need a hardcoded key.
    - *Better approach:* We will ask the user to provide a key, OR we can try to "Create Challenge" again? No, that requires user interaction.
    - *Best approach:* We will try to inspect the `chrome.storage.local` in the browser devtools? No. 
    - *Actually:* The previous `verify_spaces_standalone.ts` failed with 401. This tells us we *hit* the server.
    - If we hit a 404, we *don't* need auth to know the path is wrong (usually). 404 is "Not Found", 401/403 is "Auth Required".
    - So we can probe *without* a key. If we get 401, the path EXISTS. If we get 404, it DOES NOT.
    - **Strategy:** Probe endpoints without a key. Look for 401 (Success/Found) vs 404 (Not Found).


## Technical Approach - Part 2 (Payload Fix)
1.  **Probe:** Use `probe_payload.ts` to send array payloads to `/v1/spaces/{spaceId}/objects`.
    - Try variations: `[{ relation: "title", value: "..." }]`, `[{ relationKey: "title", value: "..." }]`, `[{ key: "title", value: "..." }]`.
    - Inspect error messages (the API seems helpful with unmarshal errors).
2.  **Fix:** Update `AnytypeApiClient.createObject` in `client.ts` to map the `params` object to the discovered Array format.


## Technical Approach - Part 3 (Value Type Fix)
1.  **Probe:** Use `probe_values.ts` to send various value structures inside the array.
    - `{ relationKey: "title", value: { type: "string", value: "foo" } }`
    - `{ relationKey: "title", value: { text: "foo" } }`
    - `{ relationKey: "title", value: { shortText: "foo" } }`
2.  **Fix:** Update `AnytypeApiClient` to wrap values correctly.


## Technical Approach - Part 4 (Final Schema Fix)
1.  **Source:** Verified via [Anytype Docs](https://developers.anytype.io/docs/guides/get-started/objects#create-an-object).
2.  **Schema:**
    - Field name is `key` (not `relationKey`).
    - Value is flattened (e.g., `text: "val"`, `checkbox: true`).
3.  **Fix:** Update `Client` to map:
    ```typescript
    { key: k, text: String(v) }
    ```


## Technical Approach - Part 5 (TypeKey & Top-level Fields)
1.  **Source:** Verified via [Anytype Docs](https://developers.anytype.io/docs/guides/get-started/objects#create-an-object).
2.  **Mapping:**
    - `params.title` -> top-level `name`
    - `params.description` -> top-level `body`
    - `"bookmark"` -> top-level `type_key`
3.  **Properties:** All other `params` stay in `properties` as `{ key, text: String(val) }`.



## Technical Approach - Part 6 (Safe-List & Tag-to-Body Strategy)
1.  **Tag Support:** Verified via `probe_tags.ts` that `multi_select` (Tag) requires pre-existing Option IDs.
2.  **Mapping Strategy:**
    - `"source_url"` -> `"source"` (Confirmed `format: url`)
    - `"tags"` -> Move to `body` (Notes). Append as `\n\nTags: tag1, tag2`.
3.  **Excluded:** `domain`, `author`, etc. 
4.  **Fix:** Update `client.ts` to combine `description` and `tags` into the `body` field of the request.

## Proposed Changes
- **Client:** Update `createObject` to append tags to body and exclude them from properties. housekeep-client-update-tags-to-body-v7-Correcting-Property-Keys-Handling-Tags-in-Body-Summary-The-discovery-script-confirmed-that-tag-is-a-multi_select-property-requiring-pre-existing-IDs.-I-am-now-updating-the-client-to-append-tags-to-the-object-body-instead-of-properties-to-avoid-HTTP-400-errors-while-preserving-the-information.

## Verification
- **Automated:** The `probe_endpoints.ts` script will serve as verification of the endpoint existence.
- **Manual:** User tries to save a bookmark.

## Risks
- If the API requires a specific header to even *route* the request (rare), we might get 404s falsely. But typically 401 is returned by the handler.
