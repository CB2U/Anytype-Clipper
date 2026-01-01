# Tasks: Fix Spaces Loading Error

## Setup
## Setup
- [x] T1: Create debug/repro script `src/lib/api/verify_spaces.ts` to inspect raw API response <!-- id: 0 -->

## Implementation
- [x] T2: Modify `AnytypeApiClient.getSpaces` in `src/lib/api/client.ts` to handle variable response schemas (Array vs Object) <!-- id: 1 -->
- [x] T3: Add logging to `src/background/service-worker.ts` for Space fetching <!-- id: 2 -->
- [x] T4: Update `src/popup/popup.ts` to display detailed error messages <!-- id: 3 -->

## Verification
- [x] T5: Build extension (`npm run build`) <!-- id: 4 -->
- [x] T6: Manual Verification: Load extension, check popup, verify Spaces load correctly <!-- id: 5 -->

## Documentation
- [ ] T7: Update `specs/033-fix-spaces-error/spec.md` with Evidence <!-- id: 6 -->
