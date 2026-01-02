# Specification: Image Handling

**Roadmap Anchor:** [4.3](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/docs/roadmap.md#epic-43-image-handling)  
**Priority:** P1  
**Type:** Feature  
**Target Area:** Article Extraction / Content Processing  
**Target Acceptance Criteria:** FR5.6, AC10, PERF-6, NFR1.7, NET-3

---

## Problem Statement

When capturing articles to Anytype, images are a critical part of the content. However, embedding all images as base64 data URLs can create excessively large objects, while keeping all images as external URLs risks broken links if the source site removes the images or goes offline. Additionally, CORS restrictions may prevent fetching some images, and large unoptimized images can slow down the capture process.

Users need a smart image handling strategy that:
- Preserves important images reliably by embedding them
- Keeps object sizes manageable by linking to large images
- Handles CORS errors gracefully
- Optimizes images for storage efficiency
- Respects user preferences for different use cases

---

## Goals and Non-Goals

### Goals

- Implement smart image embedding based on file size threshold (500KB)
- Always embed critical images (hero/featured) regardless of size
- Optimize embedded images to WebP format at 85% quality
- Handle CORS errors gracefully with fallback to external URLs
- Limit embedded images per article to prevent oversized objects
- Provide user-configurable preferences for image handling
- Complete image processing within performance budget (2s per image)

### Non-Goals

- Upload images to Anytype storage (post-MVP, requires API support)
- Screenshot capture of pages (covered in Epic 3.0 FR3.5)
- Image recognition or AI-based image analysis
- Support for animated GIFs or video content
- Image editing or cropping functionality
- Lazy loading or progressive image loading

---

## User Stories

### US1: Preserve Important Images in Articles

**As a** researcher capturing technical articles,  
**I want** important images (diagrams, screenshots, charts) to be embedded in my Anytype objects,  
**So that** I can reference them even if the original source goes offline.

**Acceptance:**
- Featured/hero images always embedded regardless of size
- Images under 500KB embedded as base64 data URLs
- Images over 500KB kept as external URLs to prevent bloat
- Embedded images optimized to WebP format
- Article remains readable with all critical images intact

---

### US2: Handle Image Loading Failures Gracefully

**As a** user capturing articles from various sources,  
**I want** the extension to handle CORS errors and image loading failures gracefully,  
**So that** my capture doesn't fail just because one image couldn't be fetched.

**Acceptance:**
- CORS errors detected and handled without blocking capture
- Failed images fall back to external URL references
- User sees clear indication of which images were embedded vs linked
- Capture completes successfully even if some images fail to load
- No sensitive error information exposed in logs

---

### US3: Control Image Embedding Behavior

**As a** power user with specific workflow needs,  
**I want** to configure how images are handled during capture,  
**So that** I can optimize for my use case (always embed for offline access, never embed for speed, etc.).

**Acceptance:**
- Settings page offers image handling preference: Always / Smart / Never embed
- "Always" mode embeds all images regardless of size (with 20 image limit)
- "Smart" mode uses 500KB threshold (default)
- "Never" mode keeps all images as external URLs
- Preference persists across browser sessions
- Preference applies to all future captures

---

## Scope

### In-Scope

- **Smart Embedding Logic:**
  - Images <500KB: Convert to base64 data URLs
  - Images >500KB: Keep as external URLs
  - Critical images (hero/featured): Always embed
  
- **Image Optimization:**
  - Convert embedded images to WebP format at 85% quality
  - Preserve original format if WebP conversion fails
  - Optimize within 2s per image performance budget
  
- **CORS Handling:**
  - Detect CORS errors during image fetch
  - Fall back to external URL if CORS blocked
  - Log CORS failures for debugging (sanitized)
  
- **Image Limits:**
  - Maximum 20 embedded images per article
  - Prioritize featured/hero images first
  - Additional images kept as external URLs
  
- **User Preferences:**
  - Always embed (all images, max 20)
  - Smart embed (default, 500KB threshold)
  - Never embed (all external URLs)
  - Preference stored in chrome.storage.local

- **Image Detection:**
  - Extract images from article HTML
  - Identify featured/hero images from metadata (og:image, article:image)
  - Detect image dimensions and file size
  
### Out-of-Scope

- Upload images to Anytype storage (post-MVP, requires API support)
- Screenshot capture (covered in Epic 3.0)
- Image recognition or classification
- Animated GIF support (treat as static images)
- Video or multimedia content
- Image editing, cropping, or filters
- Progressive image loading
- Image CDN integration
- Archive.org image preservation

---

## Requirements

### Functional Requirements

#### FR-1: Size-Based Embedding

- **FR-1.1:** Detect image file size before embedding
- **FR-1.2:** Embed images <500KB as base64 data URLs
- **FR-1.3:** Keep images >500KB as external URLs
- **FR-1.4:** Apply size threshold based on user preference setting

#### FR-2: Critical Image Handling

- **FR-2.1:** Identify featured/hero images from Open Graph metadata (og:image)
- **FR-2.2:** Identify featured images from article metadata (article:image)
- **FR-2.3:** Always embed critical images regardless of size
- **FR-2.4:** Prioritize critical images within 20 image limit

#### FR-3: Image Optimization

- **FR-3.1:** Convert embedded images to WebP format at 85% quality
- **FR-3.2:** Preserve original format if WebP conversion fails
- **FR-3.3:** Maintain aspect ratio during optimization
- **FR-3.4:** Complete optimization within 2s per image (PERF-6)

#### FR-4: CORS Error Handling

- **FR-4.1:** Detect CORS errors when fetching images
- **FR-4.2:** Fall back to external URL if CORS blocked
- **FR-4.3:** Log CORS failures with sanitized error messages
- **FR-4.4:** Continue capture process despite CORS failures

#### FR-5: Image Limits

- **FR-5.1:** Limit embedded images to 20 per article
- **FR-5.2:** Prioritize featured/hero images first
- **FR-5.3:** Embed remaining images up to limit based on document order
- **FR-5.4:** Keep additional images as external URLs

#### FR-6: User Preferences

- **FR-6.1:** Provide "Always embed" mode (all images, max 20)
- **FR-6.2:** Provide "Smart embed" mode (500KB threshold, default)
- **FR-6.3:** Provide "Never embed" mode (all external URLs)
- **FR-6.4:** Store preference in chrome.storage.local
- **FR-6.5:** Apply preference to all captures
- **FR-6.6:** Allow preference change in options page

### Non-Functional Requirements

#### NFR-1: Performance

- **NFR-1.1:** Image optimization completes within 2s per image (PERF-6)
- **NFR-1.2:** Image processing does not block article extraction
- **NFR-1.3:** Failed image fetches timeout within 5s
- **NFR-1.4:** Total image processing time does not exceed 30s per article

#### NFR-2: Reliability

- **NFR-2.1:** CORS errors handled gracefully without blocking capture (NET-3)
- **NFR-2.2:** Image fetch failures do not cause capture to fail
- **NFR-2.3:** Malformed image data handled without crashes
- **NFR-2.4:** Network timeouts handled with fallback to external URLs

#### NFR-3: Privacy & Security

- **NFR-3.1:** No external API calls for image processing (SEC-8)
- **NFR-3.2:** Image URLs sanitized before logging (SEC-4)
- **NFR-3.3:** No image data sent to third-party services
- **NFR-3.4:** User preference stored locally only (PRIV-1)

#### NFR-4: Compatibility

- **NFR-4.1:** Support common image formats (JPEG, PNG, GIF, WebP, SVG)
- **NFR-4.2:** Handle data URLs in source HTML
- **NFR-4.3:** Handle relative and absolute image URLs
- **NFR-4.4:** Preserve SVG images without WebP conversion

---

## Acceptance Criteria

### AC-1: Size-Based Embedding Works Correctly

**Given** an article with images of various sizes  
**When** user captures the article with "Smart" mode  
**Then** images <500KB are embedded as base64 data URLs  
**And** images >500KB are kept as external URLs  
**And** embedded images are optimized to WebP format

**Verification approach:** Unit test with mock images of different sizes

---

### AC-2: Featured Images Always Embedded

**Given** an article with og:image metadata pointing to a 2MB image  
**When** user captures the article  
**Then** the featured image is embedded despite exceeding 500KB threshold  
**And** the image is optimized to WebP format  
**And** the embedded image appears in the Anytype object

**Verification approach:** Integration test with sample article containing large og:image

---

### AC-3: CORS Errors Handled Gracefully

**Given** an article with images from a CORS-restricted domain  
**When** user captures the article  
**Then** CORS errors are detected and logged  
**And** failed images fall back to external URLs  
**And** capture completes successfully  
**And** no sensitive error information is exposed

**Verification approach:** Integration test with mock CORS-blocked image server

---

### AC-4: Image Limit Enforced

**Given** an article with 30 images all under 500KB  
**When** user captures the article with "Smart" mode  
**Then** only the first 20 images are embedded  
**And** remaining 10 images are kept as external URLs  
**And** featured/hero images are prioritized within the 20 limit

**Verification approach:** Unit test with article containing 30+ images

---

### AC-5: User Preferences Applied

**Given** user sets image handling to "Never embed"  
**When** user captures an article with images  
**Then** all images are kept as external URLs  
**And** no images are embedded regardless of size  
**And** capture completes quickly without image processing

**Verification approach:** Integration test with different preference settings

---

### AC-6: Performance Budget Met

**Given** an article with 10 images requiring optimization  
**When** user captures the article  
**Then** each image is optimized within 2s  
**And** total image processing time does not exceed 30s  
**And** article extraction is not blocked by image processing

**Verification approach:** Performance test with timed image optimization

---

### AC-7: WebP Optimization Works

**Given** an article with JPEG and PNG images  
**When** user captures the article  
**Then** embedded images are converted to WebP at 85% quality  
**And** file size is reduced compared to original  
**And** aspect ratio is preserved  
**And** images render correctly in Anytype

**Verification approach:** Unit test verifying WebP conversion and quality

---

### AC-8: SVG Images Preserved

**Given** an article with SVG diagrams  
**When** user captures the article  
**Then** SVG images are embedded without WebP conversion  
**And** SVG markup is preserved correctly  
**And** SVG images render correctly in Anytype

**Verification approach:** Unit test with SVG image handling

---

## Dependencies

### Epic Dependencies

- **Epic 4.1 (Markdown Conversion):** Image handling integrates with Markdown converter to embed base64 data URLs or external URLs in Markdown image syntax
- **Epic 3.2 (Metadata Extraction):** Featured image detection relies on og:image and article:image metadata extraction

### Technical Dependencies

- **Canvas API:** Required for image optimization and WebP conversion
- **Fetch API:** Required for fetching image data from URLs
- **chrome.storage.local:** Required for storing user preferences
- **Turndown:** Markdown converter must support image embedding syntax

### External Dependencies

- None (all processing done locally)

---

## Risks and Mitigations

### Risk 1: WebP Conversion Performance

**Risk:** WebP conversion may be slower than 2s per image on low-end hardware  
**Impact:** High - violates performance budget (PERF-6)  
**Likelihood:** Medium  
**Mitigation:**
- Implement timeout for WebP conversion (2s max)
- Fall back to original format if conversion times out
- Process images asynchronously to avoid blocking
- Test on low-end hardware during verification

### Risk 2: CORS Restrictions

**Risk:** Many sites block CORS, preventing image fetch  
**Impact:** Medium - reduces embedded image count  
**Likelihood:** High  
**Mitigation:**
- Implement robust CORS error detection
- Fall back to external URLs immediately on CORS error
- Document CORS limitations in user guide
- Consider future enhancement: proxy service (post-MVP)

### Risk 3: Memory Usage with Large Images

**Risk:** Processing multiple large images may cause memory issues  
**Impact:** High - could crash service worker  
**Likelihood:** Low  
**Mitigation:**
- Enforce 20 image limit strictly
- Process images sequentially, not in parallel
- Release image data from memory after processing
- Monitor memory usage during testing

### Risk 4: Malformed Image Data

**Risk:** Corrupted or malformed images may cause processing errors  
**Impact:** Medium - could block capture  
**Likelihood:** Medium  
**Mitigation:**
- Wrap all image processing in try-catch blocks
- Validate image data before processing
- Fall back to external URL on processing errors
- Log errors for debugging (sanitized)

---

## Open Questions

None at this time. All requirements are clear and aligned with PRD FR5.6.

---

## EVIDENCE

*(This section will be populated during implementation with verification results)*

