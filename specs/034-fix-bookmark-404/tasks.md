# Tasks: Fix Bookmark Creation 404 Error

## Setup
## Setup
- [x] T1: Create `src/lib/api/probe_endpoints.ts` to check probable endpoints <!-- id: 0 -->
- [x] T1b: Create `src/lib/api/probe_payload.ts` to check payload structure (Object vs Array) <!-- id: 5 -->
- [x] T1d: Create `src/lib/api/list_relations.ts` to discover valid property keys <!-- id: 11 -->

## Implementation
- [x] T2: Update `AnytypeApiClient.createObject` in `src/lib/api/client.ts` with correct endpoint <!-- id: 1 -->
- [x] T2b: Update `AnytypeApiClient.createObject` in `src/lib/api/client.ts` with correct payload structure <!-- id: 6 -->
- [x] T2e: Update `AnytypeApiClient.createObject` with top-level `name`, `body`, `type_key` <!-- id: 10 -->
- [x] T2f: Update `AnytypeApiClient.createObject` with Safe-List & Tag-to-Body strategy <!-- id: 12 -->

## Verification
- [x] T3: Build extension (`npm run build`) <!-- id: 2 -->
- [x] T4: Manual Verification: User confirms "Save Bookmark" works <!-- id: 3 -->

## Documentation
- [x] T5: Update `specs/034-fix-bookmark-404/spec.md` with Evidence <!-- id: 4 -->
