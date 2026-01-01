# Anytype API Integration Notes

This document captures critical technical findings regarding the Anytype API, discovered during the development of the Clipper Extension. These are essential for avoiding common pitfalls.

## 1. Object Creation & ID Extraction
*   **Endpoint:** `POST /v1/spaces/:space_id/objects`
*   **Response Structure:** The API returns the created object wrapped in an `object` property, not at the root.
    ```json
    // Correct
    const id = response.object.id;
    
    // Incorrect
    const id = response.id; // undefined
    ```
*   **Properties Limitation:** The `createObject` endpoint (or at least our client implementation) filters properties strictly. It is recommended to perform a **Create (Basic) -> Update (Properties)** flow for complex properties like Tags.

## 2. Object Updates (The "404" Trap)
*   **Method:** **`PATCH`**
    *   Using `PUT` to `/v1/spaces/:space_id/objects/:object_id` results in a generic `404 Page Not Found` error. You **must** use `PATCH`.
*   **Client Support:** Ensure your HTTP client supports sending a JSON body with `PATCH` requests (`fetch` defaults allow it, but custom wrappers might restrict it).

## 3. Updating Relation Properties (Tags)
*   **Payload Format:** The properties payload **must be an Array** of property objects, not a key-value map.
*   **Relation Key:** For "Object" type relations (like Tags), use the **`objects`** key to provide the list of target IDs. `options`, `value`, or `text` will fail with "could not determine property link value type".

**Correct Payload for Tags:**
```json
// PATCH /v1/spaces/:id/objects/:id
{
  "properties": [
    {
      "key": "tag_property_id",   // e.g., "bafy..."
      "objects": ["tag_id_1", "tag_id_2"] // e.g., ["bafy..."]
    }
  ]
}
```

**Incorrect Payloads (Will Fail):**
*   `{ "tag_property_id": ["tag_id"] }` (Object vs Array)
*   `[{ "key": "...", "options": [...] }]` (Wrong field name for Relations)

## 4. Tag Resolution
*   Tags in Anytype are Objects.
*   To "Tag" an item, you are creating a Relation between the Item Object and the Tag Object.
*   You must resolve the **Tag Name** -> **Tag Object ID** before assigning.
*   You must also discover the **Tag Relation Property ID** for the specific Space (it varies per space).
