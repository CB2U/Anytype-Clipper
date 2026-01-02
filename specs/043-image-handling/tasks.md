# Tasks: Image Handling

**Epic:** 4.3 - Image Handling  
**Spec:** [spec.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/043-image-handling/spec.md)  
**Plan:** [plan.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/specs/043-image-handling/plan.md)

---

## Setup

### T1: Create module structure and type definitions

**Goal:** Set up file structure and TypeScript interfaces for image handling

**Steps:**
1. Create `src/lib/extractors/image-detector.ts`
2. Create `src/lib/extractors/image-optimizer.ts`
3. Create `src/lib/extractors/image-handler.ts`
4. Create `src/types/image.d.ts` with interfaces:
   - `ImageInfo`
   - `ProcessedImage`
   - `ImageHandlingPreference`
   - `ImageHandlingSettings`
5. Add exports to module index files

**Done when:**
- [x] All files created with proper TypeScript structure
- [x] Type definitions match plan.md data contracts
- [x] TypeScript compiles without errors
- [x] No ESLint warnings

**Verify:**
- Run `npm run build` - should compile successfully
- Run `npm run lint` - should pass with zero warnings

**Evidence to record:**
- TypeScript compilation output
- File structure screenshot

**Files touched:**
- `src/lib/extractors/image-detector.ts` (new)
- `src/lib/extractors/image-optimizer.ts` (new)
- `src/lib/extractors/image-handler.ts` (new)
- `src/types/image.d.ts` (new)

---

## Core Implementation

### T2: Implement ImageDetector module

**Goal:** Extract images from HTML and identify featured images from metadata

**Steps:**
1. Implement `extractImages(html: string): ImageInfo[]`
   - Parse HTML for `<img>` tags
   - Extract URL, alt text, dimensions
   - Handle relative and absolute URLs
2. Implement `detectFeaturedImage(metadata: Metadata): string | null`
   - Check og:image property
   - Check article:image property
   - Return first found or null
3. Implement `estimateImageSize(url: string): number | null`
   - Parse URL for common size indicators
   - Return estimated size or null
4. Implement `getImageDimensions(imageData: ArrayBuffer): Dimensions`
   - Use Canvas API to load image
   - Extract width and height
   - Return dimensions object

**Done when:**
- [x] All functions implemented with proper error handling
- [x] HTML parsing handles edge cases (malformed HTML, data URLs)
- [x] Featured image detection works with og:image and article:image
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Unit tests pass (see T9)
- Manual test: Extract images from sample HTML

**Evidence to record:**
- Unit test results
- Sample HTML extraction output

**Files touched:**
- `src/lib/extractors/image-detector.ts`

---

### T3: Implement ImageOptimizer module

**Goal:** Fetch images, optimize to WebP, and handle CORS errors

**Steps:**
1. Implement `fetchImage(url: string, timeout: number): Promise<ArrayBuffer | null>`
   - Use fetch API with timeout
   - Handle CORS errors gracefully
   - Return image data or null on error
2. Implement `optimizeToWebP(imageData: ArrayBuffer, quality: number): Promise<ArrayBuffer>`
   - Use Canvas API to load image
   - Convert to WebP format at specified quality
   - Preserve aspect ratio
   - Timeout after 2s, return original if timeout
3. Implement `convertToBase64(imageData: ArrayBuffer, mimeType: string): string`
   - Convert ArrayBuffer to base64 string
   - Format as data URL with correct MIME type
   - Return data URL string
4. Implement `handleCORSError(error: Error): void`
   - Log sanitized error (domain only, no full URL)
   - Return null to trigger fallback

**Done when:**
- [x] All functions implemented with proper error handling
- [x] CORS errors handled without throwing
- [x] WebP optimization works with 2s timeout
- [x] Base64 conversion produces valid data URLs
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Unit tests pass (see T10)
- Manual test: Fetch and optimize sample image

**Evidence to record:**
- Unit test results
- WebP optimization benchmark (time per image)

**Files touched:**
- `src/lib/extractors/image-optimizer.ts`

---

### T4: Implement ImageHandler module

**Goal:** Orchestrate image processing with size thresholds and limits

**Steps:**
1. Implement `processImages(html: string, metadata: Metadata, settings: ImageHandlingSettings): Promise<ProcessedImage[]>`
   - Extract images using ImageDetector
   - Detect featured image
   - Apply user preference ('always', 'smart', 'never')
   - Prioritize featured images
   - Apply 20 image limit
   - Process each image (fetch, optimize, embed or link)
   - Return array of ProcessedImage objects
2. Implement `applyImageLimit(images: ImageInfo[], limit: number, featured: string | null): ImageInfo[]`
   - Ensure featured image is first if present
   - Limit to specified number (default 20)
   - Return limited array
3. Implement `prioritizeFeaturedImages(images: ImageInfo[], featuredUrl: string | null): ImageInfo[]`
   - Mark featured image with `isFeatured: true`
   - Move featured image to front of array
   - Return prioritized array
4. Implement `shouldEmbedImage(image: ImageInfo, settings: ImageHandlingSettings): boolean`
   - Check user preference
   - Apply size threshold for 'smart' mode
   - Always embed featured images
   - Return boolean decision

**Done when:**
- [x] All functions implemented with proper error handling
- [x] Image limit enforced correctly
- [x] Featured images prioritized
- [x] User preferences applied correctly
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Unit tests pass (see T11)
- Manual test: Process article with 30 images, verify only 20 embedded

**Evidence to record:**
- Unit test results
- Image limit enforcement test output

**Files touched:**
- `src/lib/extractors/image-handler.ts`

---

### T5: Extend SettingsManager for image preferences

**Goal:** Add storage and retrieval for image handling settings

**Steps:**
1. Add `imageHandlingSettings` to storage schema in `src/types/storage.d.ts`
2. Implement `getImageHandlingSettings(): Promise<ImageHandlingSettings>`
   - Retrieve from chrome.storage.local
   - Return defaults if not set
3. Implement `setImageHandlingSettings(settings: ImageHandlingSettings): Promise<void>`
   - Validate settings object
   - Store in chrome.storage.local
4. Add default values:
   - preference: 'smart'
   - sizeThreshold: 512000 (500KB)
   - maxEmbeddedImages: 20
   - webpQuality: 85
   - fetchTimeout: 5000

**Done when:**
- [x] Settings schema added to types
- [x] Get/set functions implemented
- [x] Default values provided
- [x] Settings persist across browser restarts
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Unit tests pass
- Manual test: Set preference, restart browser, verify persisted

**Evidence to record:**
- Settings persistence test results

**Files touched:**
- `src/types/storage.d.ts`
- `src/lib/storage/storage-manager.ts`

---

## Integration

### T6: Integrate ImageHandler with MarkdownConverter

**Goal:** Embed processed images in Markdown output

**Steps:**
1. Update `MarkdownConverter.convert()` to accept `ProcessedImage[]` parameter
2. Before Turndown conversion, replace image URLs with processed versions:
   - For embedded images: Replace with base64 data URL
   - For external images: Keep original URL
3. Preserve alt text in Markdown image syntax
4. Handle SVG images without WebP conversion
5. Add image processing to article capture flow in `ArticleExtractor`

**Done when:**
- [x] Images embedded correctly in Markdown output
- [x] Base64 data URLs render in Anytype
- [x] External URLs preserved correctly
- [x] SVG images handled without conversion
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Integration tests pass (see T12)
- Manual test: Capture article, verify images in Anytype

**Evidence to record:**
- Markdown output with embedded images
- Anytype screenshot showing rendered images

**Files touched:**
- `src/lib/converters/markdown-converter.ts`
- `src/lib/extractors/article-extractor.ts`

---

### T7: Add image handling preference to Options page

**Goal:** Allow users to configure image handling preference

**Steps:**
1. Add image handling section to `src/options/options.html`
2. Add dropdown for preference: Always / Smart / Never
3. Add description text explaining each option
4. Implement preference save/load in `src/options/options.ts`
5. Add visual feedback on save

**Done when:**
- [x] Options page displays image handling section
- [x] Dropdown shows current preference
- [x] Preference saves to storage on change
- [x] Visual feedback confirms save
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Manual test: Change preference, reload options page, verify persisted
- Manual test: Change preference, capture article, verify applied

**Evidence to record:**
- Options page screenshot
- Preference application test results

**Files touched:**
- `src/options/options.html`
- `src/options/options.ts`
- `src/options/options.css`

---

### T8: Add image processing feedback to popup

**Goal:** Show user how many images were embedded vs external

**Steps:**
1. Update capture success notification to include image stats
2. Format: "Article captured with X embedded images (Y kept as links)"
3. Add to popup UI after successful capture
4. Handle edge cases (0 images, all external, all embedded)

**Done when:**
- [x] Success notification includes image stats
- [x] Stats accurate based on ProcessedImage[] results
- [x] Edge cases handled gracefully
- [x] TypeScript strict mode passes
- [x] No ESLint warnings

**Verify:**
- Manual test: Capture article with images, verify stats shown
- Manual test: Capture article with no images, verify no stats shown

**Evidence to record:**
- Popup screenshot with image stats

**Files touched:**
- `src/popup/popup.ts`
- `src/background/service-worker.ts`

---

## Tests

### T9: Write unit tests for ImageDetector

**Goal:** Verify image extraction and featured image detection

**Steps:**
1. Create `tests/unit/image-detector.test.ts`
2. Test `extractImages()`:
   - HTML with multiple <img> tags
   - HTML with relative and absolute URLs
   - HTML with data URLs
   - HTML with missing alt text
   - Malformed HTML
3. Test `detectFeaturedImage()`:
   - Metadata with og:image
   - Metadata with article:image
   - Metadata with both (og:image takes precedence)
   - Metadata with neither
4. Test `estimateImageSize()`:
   - URLs with size indicators
   - URLs without size indicators
5. Test `getImageDimensions()`:
   - Various image dimensions
   - Invalid image data

**Done when:**
- [x] All test cases implemented
- [x] Tests pass with >80% coverage
- [x] Edge cases covered
- [x] No test failures

**Verify:**
- Run `npm run test:unit` - all tests pass
- Run `npm run test:coverage` - >80% coverage for image-detector.ts

**Evidence to record:**
- Test output
- Coverage report

**Files touched:**
- `tests/unit/image-detector.test.ts` (new)

---

### T10: Write unit tests for ImageOptimizer

**Goal:** Verify image fetching, optimization, and CORS handling

**Steps:**
1. Create `tests/unit/image-optimizer.test.ts`
2. Test `fetchImage()`:
   - Successful fetch
   - CORS error (mock)
   - Network timeout
   - Invalid URL
3. Test `optimizeToWebP()`:
   - JPEG to WebP conversion
   - PNG to WebP conversion
   - Quality setting (85%)
   - Aspect ratio preservation
   - Timeout handling (>2s)
4. Test `convertToBase64()`:
   - Valid image data
   - Correct MIME type
   - Valid data URL format
5. Test `handleCORSError()`:
   - Error logged (sanitized)
   - Returns null

**Done when:**
- [x] All test cases implemented
- [x] Tests pass with >80% coverage
- [x] CORS errors mocked correctly
- [x] No test failures

**Verify:**
- Run `npm run test:unit` - all tests pass
- Run `npm run test:coverage` - >80% coverage for image-optimizer.ts

**Evidence to record:**
- Test output
- Coverage report

**Files touched:**
- `tests/unit/image-optimizer.test.ts` (new)

---

### T11: Write unit tests for ImageHandler

**Goal:** Verify image processing orchestration and limits

**Steps:**
1. Create `tests/unit/image-handler.test.ts`
2. Test `processImages()`:
   - 'smart' mode with mixed image sizes
   - 'always' mode (all embedded, max 20)
   - 'never' mode (all external)
   - Featured image prioritization
   - 20 image limit enforcement
3. Test `applyImageLimit()`:
   - Array with <20 images (no change)
   - Array with >20 images (limited to 20)
   - Featured image always included
4. Test `prioritizeFeaturedImages()`:
   - Featured image moved to front
   - Featured image marked correctly
5. Test `shouldEmbedImage()`:
   - Size threshold logic
   - Featured image always embedded
   - User preference applied

**Done when:**
- [x] All test cases implemented
- [x] Tests pass with >80% coverage
- [x] Image limit logic verified
- [x] No test failures

**Verify:**
- Run `npm run test:unit` - all tests pass
- Run `npm run test:coverage` - >80% coverage for image-handler.ts

**Evidence to record:**
- Test output
- Coverage report

**Files touched:**
- `tests/unit/image-handler.test.ts` (new)

---

### T12: Write integration tests for article capture with images

**Goal:** Verify end-to-end image processing in article capture flow

**Steps:**
1. Create `tests/integration/article-with-images.test.ts`
2. Test scenarios:
   - Article with images <500KB (embedded)
   - Article with images >500KB (external)
   - Article with featured image >500KB (embedded)
   - Article with 30 images (only 20 embedded)
   - Article with CORS-restricted images (fallback)
   - Article with no images (no errors)
3. Test user preferences:
   - 'always' mode
   - 'smart' mode
   - 'never' mode
4. Test performance:
   - 15 images processed within 30s
   - Each image optimized within 2s

**Done when:**
- [x] All test scenarios implemented
- [x] Tests pass consistently
- [x] Performance benchmarks met
- [x] No test failures

**Verify:**
- Run `npm run test:integration` - all tests pass
- Performance tests show <2s per image, <30s total

**Evidence to record:**
- Integration test output
- Performance benchmark results

**Files touched:**
- `tests/integration/article-with-images.test.ts` (new)

---

## Verification

### T13: Manual verification with real articles

**Goal:** Verify image handling works with real-world articles

**Steps:**
1. Capture article from Medium with featured image
   - Verify featured image embedded despite size
   - Verify other images follow size threshold
2. Capture article from Dev.to with code screenshots
   - Verify screenshots embedded correctly
   - Verify images render in Anytype
3. Capture article with CORS-restricted images
   - Verify capture completes
   - Verify fallback to external URLs
4. Test preference changes:
   - Set to 'never', capture article, verify all external
   - Set to 'always', capture article, verify all embedded (max 20)
   - Set to 'smart', capture article, verify threshold applied

**Done when:**
- All manual tests completed successfully
- Screenshots captured for evidence
- No unexpected errors or failures

**Verify:**
- Capture 3+ real articles successfully
- Images render correctly in Anytype
- Preferences work as expected

**Evidence to record:**
- Screenshots of captured articles in Anytype
- Image stats from popup notifications
- Preference setting screenshots

**Files touched:**
- None (manual testing only)

---

### T14: Performance verification

**Goal:** Verify image processing meets performance budget

**Steps:**
1. Capture article with 15 images
2. Measure total processing time
3. Measure time per image optimization
4. Verify metrics:
   - Total time <30s
   - Per-image time <2s
   - No UI blocking during processing

**Done when:**
- Performance metrics collected
- All metrics within budget
- No performance regressions

**Verify:**
- Use browser DevTools Performance tab
- Log processing times in console
- Verify against PERF-6 threshold

**Evidence to record:**
- Performance metrics table
- DevTools Performance screenshot

**Files touched:**
- None (performance testing only)

---

## Tracking

### T15: Update SPECS.md

**Goal:** Update specification index with Epic 4.3 status

**Steps:**
1. Open `SPECS.md`
2. Find Epic 4.3 row in BP3 table
3. Update Status to "Done"
4. Update Next Task to "N/A"
5. Update Evidence link to point to spec.md#evidence
6. Update Last Updated timestamp

**Done when:**
- SPECS.md updated correctly
- Evidence link works
- Status reflects completion

**Verify:**
- Open SPECS.md, verify Epic 4.3 marked as Done
- Click Evidence link, verify it navigates to spec.md#evidence

**Evidence to record:**
- SPECS.md diff showing changes

**Files touched:**
- `SPECS.md`

---

### T16: Consolidate evidence in spec.md

**Goal:** Document all verification results in spec.md EVIDENCE section

**Steps:**
1. Open `specs/043-image-handling/spec.md`
2. Navigate to EVIDENCE section
3. Add verification results for each AC:
   - AC-1: Unit test results for size-based embedding
   - AC-2: Integration test results for featured images
   - AC-3: Integration test results for CORS handling
   - AC-4: Unit test results for image limit
   - AC-5: Integration test results for preferences
   - AC-6: Performance test results
   - AC-7: Unit test results for WebP optimization
   - AC-8: Unit test results for SVG preservation
4. Add manual verification results
5. Add performance benchmark results
6. Add screenshots of captured articles

**Done when:**
- All ACs have verification evidence
- Evidence is clear and specific
- Screenshots embedded in spec.md

**Verify:**
- Read spec.md EVIDENCE section
- Verify all ACs covered
- Verify screenshots render correctly

**Evidence to record:**
- Updated spec.md with complete EVIDENCE section

**Files touched:**
- `specs/043-image-handling/spec.md`

---

**End of Tasks**
