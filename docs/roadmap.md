# Roadmap: Anytype Clipper Extension

**Version:** 1.0 
**Status:** Active 
**Last Updated:** 2026-01-01 
**PRD Reference:** PRD.md v2.0 
**Constitution Reference:** constitution.md v1.0

---

## Overview

This roadmap breaks down the Anytype Clipper Extension development into **Epics** organized by **Breakpoints (BP)**. Each epic is sized to become one spec folder and can be triggered with:

```bash
/speckit specify "reference roadmap.md file for X.Y"
```

---

## MVP Decisions (Locked)

### In Scope for MVP (v1.0)

- ✅ Challenge code authentication flow
- ✅ Bookmark capture with metadata
- ✅ Highlight capture with context
- ✅ Article capture with 4-level fallback extraction
- ✅ Offline queue with exponential backoff retry
- ✅ URL-based deduplication
- ✅ Basic smart tagging (domain patterns)
- ✅ Image handling (smart embedding <500KB)
- ✅ Table preservation (Markdown + HTML)
- ✅ Code block language detection
- ✅ Popup UI with Space/Type selectors
- ✅ Context menu integration
- ✅ Options page with core settings
- ✅ Success/error notifications
  
  ### Out of Scope for MVP
- ❌ Reading list / "Read later" mode (v1.1)
- ❌ Keyboard shortcuts (v1.1)
- ❌ Checkpoint-based recovery for large articles (v1.1)
- ❌ Template system (v1.1)
- ❌ Debug log viewer (v1.1)
- ❌ Visual selection tool (v1.2+)
- ❌ Analytics dashboard (v1.2+)
- ❌ Collaboration features (v1.2+)

---

## Non-Negotiables Summary

From constitution.md - these apply to ALL epics:

### Security (SEC-1 to SEC-8)

- API keys in `chrome.storage.local` only
- Localhost-only API calls (default port: 31009)
- No sensitive data in logs
- Sanitized error messages
- Minimal permissions
- Input validation required
- CSP enforcement
- No external API calls
  
  ### Data Integrity (DATA-1 to DATA-7)
- Atomic operations for captures <2MB
- Checkpoint recovery for captures >2MB
- Queue survives restarts
- 1000 item queue limit with FIFO
- Unique ID + timestamp + retry count required
- Failed captures queued, not dropped
- URL normalization required
  
  ### Privacy (PRIV-1 to PRIV-5)
- Local storage only
- No telemetry/analytics
- Privacy mode support
- "Clear All Data" option
- Transparent data capture
  
  ### Performance (PERF-1 to PERF-7)
- Popup opens <300ms
- Article extraction <5s
- Queue doesn't block UI
- 5MB capture limit
- No page load impact
- Image optimization <2s per image
- Duplicate detection <1s
  
  ### Reliability (REL-1 to REL-6)
- Graceful API downtime handling
- Service worker recovery
- Health check before requests
- Exponential backoff (1s, 5s, 30s, 5m, max 10 attempts)
- API response validation
- Clear error messages with next steps

---

## Breakpoint Map

### BP0: Foundation (Weeks 1-2)

- 1.0 Project Setup & Architecture
- 1.1 API Client Foundation
- 1.2 Storage Manager
  
  ### BP1: Authentication (Weeks 3-4)
- 2.0 Challenge Code Authentication
- 2.1 API Key Management
- 2.2 Re-authentication Flow
  
  ### BP2: Basic Capture (Weeks 5-6)
- 3.0 Bookmark Capture
- 3.1 Highlight Capture
- 3.2 Metadata Extraction
  
  ### BP3: Article Extraction (Weeks 7-8)
- 4.0 Readability Integration
- 4.1 Markdown Conversion
- 4.2 Fallback Extraction Chain
- 4.3 Image Handling
- 4.4 Table Preservation
  
  ### BP4: Queue & Reliability (Weeks 9-10)
- 5.0 Offline Queue System
- 5.1 Retry Logic with Backoff
- 5.2 Health Check & Recovery
- 5.3 Queue UI & Status
  
  ### BP5: Deduplication & Tagging (Weeks 11-12)
- 6.0 URL Deduplication
- 6.1 Smart Tagging Engine
- 6.2 Append Mode
  
  ### BP6: UI & Integration (Weeks 13-14)
- 7.0 Popup UI
- 7.1 Context Menu Integration
- 7.2 Options Page
- 7.3 Notifications System
  
  ### BP7: Testing & Polish (Weeks 15-16)
- 8.0 Unit Test Suite
- 8.1 Integration Tests
- 8.2 E2E Test Suite
- 8.3 Manual Testing & Bug Fixes
- 8.4 Documentation
  
  ### BP8: MVP Release (Week 17)
- 9.0 Release Preparation
- 9.1 Packaging & Distribution

---

## Epics

### Epic 1.0: Project Setup & Architecture

**Goal:** Establish TypeScript project structure, build pipeline, and core architecture patterns.
**Scope:**

- **In:**
  - TypeScript configuration (strict mode)
  - Build pipeline (Vite/Webpack)
  - Manifest V3 structure
  - Module architecture (background, content, popup, lib)
  - ESLint + Prettier configuration
  - Git repository setup
  - CI/CD pipeline basics
- **Out:**
  - Any feature implementation
  - Test infrastructure (covered in 8.0)
  - Documentation beyond README skeleton
    **Dependencies:** None
    **Exit Criteria:**
- TypeScript compiles with strict mode
- Build produces valid extension package
- ESLint + Prettier configured and passing
- Module structure matches PRD Appendix (Technical Architecture)
- Manifest V3 validates
- CI pipeline runs build successfully
  **Targets:** NFR6.1, NFR6.2, NFR6.7, NFR6.8

---

### Epic 1.1: API Client Foundation

**Goal:** Create type-safe Anytype API client with error handling and request/response validation.
**Scope:**

- **In:**
  - TypeScript interfaces for Anytype API (auth, spaces, objects)
  - HTTP client wrapper for localhost API
  - Request/response validation
  - Error type definitions (AuthError, NetworkError, ValidationError)
  - Health check ping implementation
  - Custom port configuration support
- **Out:**
  - Authentication logic (covered in 2.0)
  - Retry logic (covered in 5.1)
  - Queue integration (covered in 5.0)
    **Dependencies:** 1.0
    **Exit Criteria:**
- API client can make requests to localhost:31009
- Custom port configuration works
- Health check detects Anytype availability
- All API responses validated before processing
- Error types properly thrown and catchable
- TypeScript types match Anytype API v1.x
  **Targets:** FR1.2, FR1.3, NFR2.4, NFR5.6, CODE-1, CODE-4

---

### Epic 1.2: Storage Manager

**Goal:** Create abstraction layer for chrome.storage.local with schema validation and quota management.
**Scope:**

- **In:**
  - Storage schema TypeScript interfaces
  - Get/set/delete operations with type safety
  - Storage quota monitoring (warn at 80%, fail at 95%)
  - Data migration utilities
  - Clear all data functionality
- **Out:**
  - Queue-specific storage logic (covered in 5.0)
  - Settings UI (covered in 7.2)
  - Debug log storage (covered in post-MVP)
    **Dependencies:** 1.0
    **Exit Criteria:**
- Type-safe storage operations work
- Quota monitoring triggers warnings
- Clear all data removes all extension data
- Storage survives browser restart
- No data stored in chrome.storage.sync
  **Targets:** NFR3.1, STORE-1, STORE-4, DATA-3, PRIV-4

---

### Epic 2.0: Challenge Code Authentication

**Goal:** Implement first-run authentication using Anytype challenge code flow.
**Scope:**

- **In:**
  - POST /v1/auth/challenges to get 4-digit code
  - Display code in popup UI
  - POST /v1/auth/api_keys to exchange code for key
  - Store API key in chrome.storage.local
  - Authentication state management
  - First-run onboarding flow
- **Out:**
  - Re-authentication (covered in 2.2)
  - Token refresh (covered in 2.1)
  - Disconnect action (covered in 2.1)
    **Dependencies:** 1.1, 1.2
    **Exit Criteria:**
- User can complete challenge code flow
- 4-digit code displays correctly
- API key stored securely in local storage
- Authentication state persists across restarts
- Clear onboarding instructions shown
  **Targets:** FR1.1, FR1.2, FR1.3, FR1.4, AC1, AUTH-1, AUTH-2

---

### Epic 2.1: API Key Management

**Goal:** Implement API key storage, validation, and revocation.
**Scope:**

- **In:**
  - Secure API key storage in chrome.storage.local
  - API key validation on startup
  - "Disconnect" action to revoke and clear credentials
  - Token expiration detection (if supported)
  - Token refresh flow (if Anytype supports)
- **Out:**
  - Initial authentication (covered in 2.0)
  - Re-authentication triggers (covered in 2.2)
    **Dependencies:** 2.0
    **Exit Criteria:**
- API key stored only in chrome.storage.local
- Disconnect action clears all credentials
- Token expiration detected (if applicable)
- Token refresh works (if Anytype supports)
- No API keys logged to console
  **Targets:** FR1.4, FR1.5, FR1.8, AUTH-2, AUTH-5, AUTH-6, SEC-1, SEC-3

---

### Epic 2.2: Re-authentication Flow

**Goal:** Handle 401 responses and trigger automatic re-authentication without blocking user.
**Scope:**

- **In:**
  - 401 response detection
  - Automatic re-authentication trigger
  - Non-intrusive notification when re-auth needed
  - Queue captures during re-auth
  - Resume queue after successful re-auth
- **Out:**
  - Initial authentication (covered in 2.0)
  - Queue implementation (covered in 5.0)
    **Dependencies:** 2.0, 2.1
    **Exit Criteria:**
- 401 responses trigger re-auth flow
- User sees non-intrusive notification
- Captures queued during re-auth
- Queue resumes after successful re-auth
- No captures lost during re-auth
  **Targets:** FR1.6, FR1.7, AUTH-3, AUTH-4, REL-1

---

### Epic 3.0: Bookmark Capture

**Goal:** Capture current tab as bookmark with metadata and tags.
**Scope:**

- **In:**
  - Capture tab URL, title, favicon, timestamp
  - User input for tags and notes
  - Create Anytype object with bookmark properties
  - Success notification with link to Anytype
  - Domain extraction (site property)
  - SourceApp="AnytypeClipper" property
- **Out:**
  - Screenshot capture (optional, post-MVP)
  - PDF link extraction (post-MVP)
  - Archive.org snapshot (post-MVP)
  - Deduplication (covered in 6.0)
    **Dependencies:** 2.0, 1.1, 1.2
    **Exit Criteria:**
- User can save bookmark from popup
- All bookmark properties captured correctly
- Tags and notes saved with bookmark
- Success notification shows with Anytype link
- Bookmark appears in selected Space
  **Targets:** FR3.1, FR3.2, FR3.3, FR3.4, AC2, US1

---

### Epic 3.1: Highlight Capture

**Goal:** Capture selected text with context via content script and context menu.
**Scope:**

- **In:**
  - Content script injection (on activation)
  - Text selection detection
  - Capture selected text + 50 chars before/after
  - Source URL, page title, timestamp
  - Create Anytype object with Quote/Context/URL
  - Context menu action "Send selection to Anytype"
- **Out:**
  - Multiple highlights per page (post-MVP)
  - Visual indicators (post-MVP)
  - Annotation layer (post-MVP)
  - Append mode (covered in 6.2)
    **Dependencies:** 2.0, 1.1, 1.2
    **Exit Criteria:**
- User can select text and right-click to capture
- Quote and context captured correctly
- Source URL and page title included
- Highlight object created in Anytype
- Content script doesn't impact page performance
  **Targets:** FR4.1, FR4.2, FR4.3, FR4.4, FR4.5, AC3, US2, PERF-5

---

### Epic 3.2: Metadata Extraction

**Goal:** Extract rich metadata from web pages (Open Graph, Schema.org, Twitter Cards).
**Scope:**

- **In:**
  - Extract og:title, og:description, og:image
  - Extract article:author, article:published_time
  - Extract twitter:card, twitter:creator
  - Extract schema.org Article metadata
  - Reading time estimate (words / 200 WPM)
  - Page language detection
  - Canonical URL extraction
  - Favicon capture (multiple sizes)
- **Out:**
  - Archive.org snapshot (post-MVP)
  - Related links extraction (post-MVP)
  - Page modification date (post-MVP)
    **Dependencies:** 3.0
    **Exit Criteria:**
- Metadata extracted from common sites (news, blogs)
- Author and published date captured when available
- Reading time estimate accurate
- Featured image captured
- Canonical URL used when available
  **Targets:** FR3.3, FR10.1, FR10.2, FR10.3, FR10.4, FR10.5, AC10

---

### Epic 4.0: Readability Integration

**Goal:** Integrate Mozilla Readability for article content extraction.
**Scope:**

- **In:**
  - Mozilla Readability library integration
  - Article extraction from current page
  - Content cleaning (remove ads, nav, footer)
  - Preserve article structure (headings, paragraphs)
  - Extract article metadata (title, byline, excerpt)
  - Extraction quality feedback
- **Out:**
  - Fallback strategies (covered in 4.2)
  - Markdown conversion (covered in 4.1)
  - Image handling (covered in 4.3)
    **Dependencies:** 3.0, 1.1
    **Exit Criteria:**
- Readability extracts articles from 80%+ of test sites
- Ads, navigation, and footer removed
- Article structure preserved
- Extraction completes within 5 seconds
- Quality feedback shown to user
  **Targets:** FR5.1, FR5.10, NFR1.2, PERF-2, US1

---

### Epic 4.1: Markdown Conversion

**Goal:** Convert extracted HTML to Markdown using Turndown with proper formatting.
**Scope:**

- **In:**
  - Turndown library integration
  - Preserve headings (h1-h6)
  - Preserve lists (ordered, unordered)
  - Preserve code blocks with language detection
  - Preserve blockquotes
  - Preserve links
  - Handle nested structures
- **Out:**
  - Table conversion (covered in 4.4)
  - Image handling (covered in 4.3)
    **Dependencies:** 4.0
    **Exit Criteria:**
- HTML converts to valid Markdown
- Headings, lists, quotes, links preserved
- Code blocks include language hints
- Nested structures handled correctly
- Conversion completes within 2 seconds
  **Targets:** FR5.2, FR5.3, FR5.4, AC4, AC16

---

### Epic 4.2: Fallback Extraction Chain

**Goal:** Implement 4-level fallback strategy when Readability fails.
**Scope:**

- **In:**
  - **Level 1:** Readability (primary)
  - **Level 2:** Simplified DOM extraction (largest article tag, highest text density)
  - **Level 3:** Full page capture with cleaning (strip scripts, styles, nav, footer)
  - **Level 4:** Smart bookmark with enhanced metadata
  - Extraction quality indicators (green/yellow/orange)
  - "Retry extraction" option for failed captures
- **Out:**
  - User-configurable fallback preferences (post-MVP)
    **Dependencies:** 4.0, 4.1, 3.2
    **Exit Criteria:**
- Fallback chain executes in order
- Each level attempts extraction before falling back
- Quality indicator shows which level succeeded
- Smart bookmark created if all levels fail
- User can manually retry extraction
  **Targets:** FR5.1, FR5.10, FR5.11, AC9, ERR-7, REL-8

---

### Epic 4.3: Image Handling

**Goal:** Implement smart image embedding strategy based on size and user preference.
**Scope:**

- **In:**
  - Images <500KB: Convert to base64 data URLs
  - Images >500KB: Keep as external URLs
  - Critical images (hero/featured): Always embed
  - CORS handling with fallback to external URLs
  - WebP optimization at 85% quality
  - Limit to 20 embedded images per article
  - User-configurable preference: Always/Smart/Never embed
- **Out:**
  - Upload to Anytype (post-MVP, requires API support)
  - Screenshot capture (post-MVP)
    **Dependencies:** 4.1
    **Exit Criteria:**
- Images <500KB embedded as base64
- Images >500KB kept as external URLs
- Featured images always embedded
- CORS errors handled gracefully
- Image optimization completes <2s per image
- Max 20 images embedded per article
  **Targets:** FR5.6, AC10, PERF-6, NFR1.7, NET-3

---

### Epic 4.4: Table Preservation

**Goal:** Preserve tables as Markdown or HTML based on complexity.
**Scope:**

- **In:**
  - Simple tables (≤6 cols, no merges, <20 rows): Markdown table syntax
  - Complex tables: Preserve as HTML blocks within Markdown
  - Data tables: Convert to JSON/CSV + HTML fallback
  - Table detection and classification
- **Out:**
  - User-configurable table strategy (post-MVP)
    **Dependencies:** 4.1
    **Exit Criteria:**
- Simple tables convert to Markdown tables
- Complex tables preserved as HTML
- Data tables include JSON/CSV representation
- Tables render correctly in Anytype
- Table classification accurate
  **Targets:** FR5.5, AC11

---

### Epic 5.0: Offline Queue System

**Goal:** Implement persistent queue for captures when Anytype is unavailable.
**Scope:**

- **In:**
  - Persist capture requests to chrome.storage.local
  - Queue status tracking (queued/sending/sent/failed)
  - Queue survives browser restart and service worker termination
  - 1000 item limit with FIFO eviction
  - Sequential processing (not parallel)
  - Atomic operations for captures <2MB
- **Out:**
  - Retry logic (covered in 5.1)
  - Queue UI (covered in 5.3)
  - Checkpoint recovery (post-MVP)
    **Dependencies:** 1.2, 2.0
    **Exit Criteria:**
- Captures queued when Anytype unavailable
- Queue persists across browser restarts
- Queue survives service worker termination
- FIFO eviction at 1000 items
- Sequential processing prevents API overload
- Atomic operations for small captures
  **Targets:** FR6.1, FR6.2, FR6.4, FR6.6, FR6.9, FR6.10, AC5, AC8, DATA-1, DATA-3, DATA-4, US3

---

### Epic 5.1: Retry Logic with Backoff

**Goal:** Implement exponential backoff retry logic for queued captures.
**Scope:**

- **In:**
  - Exponential backoff intervals: 1s, 5s, 30s, 5m
  - Max 10 retry attempts
  - Retry count tracking per queue item
  - Error message storage for failed items
  - Manual retry option
  - Delete failed items option
- **Out:**
  - Queue UI (covered in 5.3)
  - Health check (covered in 5.2)
    **Dependencies:** 5.0
    **Exit Criteria:**
- Retry intervals follow exponential backoff
- Max 10 attempts enforced
- Retry count tracked per item
- Failed items marked with error messages
- User can manually retry or delete failed items
- No infinite retry loops
  **Targets:** FR6.3, FR6.5, NFR2.3, REL-4, REL-7

---

### Epic 5.2: Health Check & Recovery

**Goal:** Implement health check ping and service worker recovery mechanisms.
**Scope:**

- **In:**
  - Health check ping to localhost:31009 before requests
  - Service worker termination detection
  - Graceful recovery from termination
  - API response validation
  - Network error handling
- **Out:**
  - Checkpoint recovery (post-MVP)
  - Queue UI (covered in 5.3)
    **Dependencies:** 5.0, 1.1
    **Exit Criteria:**
- Health check detects Anytype availability
- Service worker termination detected
- Recovery mechanisms work after termination
- API responses validated before processing
- Network errors trigger queue fallback
  **Targets:** FR6.7, NFR2.2, NFR2.4, NFR2.5, REL-2, REL-3, REL-5

---

### Epic 5.3: Queue UI & Status

**Goal:** Display queue status in popup with detailed sync information.
**Scope:**

- **In:**
  - Queue status display in popup
  - Pending count with badge counter
  - Item status indicators (queued/sending/sent/failed)
  - Manual retry/delete actions
  - Timestamps and retry counts
  - Error messages for failed items
- **Out:**
  - Export queue as JSON (post-MVP)
  - Statistics dashboard (post-MVP)
  - Debug log viewer (post-MVP)
    **Dependencies:** 5.0, 5.1
    **Exit Criteria:**
- Queue status visible in popup
- Badge counter shows pending count
- User can see status of each queued item
- Manual retry and delete actions work
- Timestamps and retry counts displayed
- Error messages shown for failed items
  **Targets:** FR6.2, FR6.5, AC5, US3

---

### Epic 6.0: URL Deduplication

**Goal:** Detect duplicate bookmarks by URL and offer append option.
**Scope:**

- **In:**
  - Search existing objects by URL before creating bookmark
  - URL normalization (lowercase, remove tracking params)
  - Handle variations: http/https, trailing slashes, www/non-www, query params, fragments
  - Duplicate warning in popup
  - User choice: Skip, Create anyway, Append to existing
- **Out:**
  - Append mode implementation (covered in 6.2)
  - Fuzzy matching (post-MVP)
  - User-configurable deduplication (post-MVP)
    **Dependencies:** 3.0, 1.1
    **Exit Criteria:**
- Duplicate detection searches existing objects
- URL variations handled correctly
- Duplicate warning shown in popup
- User can choose action (skip/create/append)
- Duplicate detection completes <1s
  **Targets:** FR7.1, FR7.2, FR7.3, FR7.6, AC6, AC14, DATA-7, PERF-7, US7

---

### Epic 6.1: Smart Tagging Engine

**Goal:** Suggest tags based on domain patterns and content keywords.
**Scope:**

- **In:**
  - Domain → tag mappings (github.com → #development, #opensource)
  - Keyword extraction using TF-IDF or frequency analysis
  - Display suggested tags in popup (max 5)
  - One-click add for suggested tags
  - Extract tags from article meta keywords
- **Out:**
  - Learning from user patterns (post-MVP)
  - Custom domain mappings UI (post-MVP)
    **Dependencies:** 3.0, 3.2
    **Exit Criteria:**
- Tags suggested based on domain
- Keywords extracted from content
- Max 5 tags suggested per capture
- User can add suggested tags with one click
- Meta keywords included in suggestions
  **Targets:** FR8.1, FR8.2, FR8.4, FR8.6, FR8.7, AC12, US5

---

### Epic 6.2: Append Mode

**Goal:** Allow appending new content to existing Anytype objects.
**Scope:**

- **In:**
  - "Append to existing" option when duplicate detected
  - Add new section with timestamp and source link
  - Optional "Append to object" mode with object search/picker
  - Append multiple highlights to same object
- **Out:**
  - Object search UI (post-MVP)
  - Quick-add to collections (post-MVP)
    **Dependencies:** 6.0, 3.1
    **Exit Criteria:**
- User can append to existing object when duplicate detected
- New content added with timestamp and source link
- Multiple highlights can append to same object
- Append mode works from popup
  **Targets:** FR2.4, FR4.9, FR7.4, FR7.5, AC17, US2, US7

---

### Epic 7.0: Popup UI

**Goal:** Create browser action popup with Space/Type selectors and capture controls.
**Scope:**

- **In:**
  - Popup HTML/CSS/TypeScript
  - Space selector dropdown (fetch from API)
  - Type selector: Bookmark, Highlight, Article, Note, Task
  - Tags input with suggestions
  - Notes textarea
  - Save button with loading state
  - Success/error feedback
  - Remember last-used Space and Type
  - Require default Space selection on first use
- **Out:**
  - Queue status (covered in 5.3)
  - Reading list (post-MVP)
  - Recent captures (post-MVP)
    **Dependencies:** 2.0, 1.1
    **Exit Criteria:**
- Popup opens within 300ms
- Space selector shows available Spaces
- Type selector shows all content types
- Tags and notes can be added
- Last-used Space/Type remembered
- User must select default Space on first use
- Full keyboard navigation works
  **Targets:** FR2.1, FR2.2, FR2.3, FR2.5, FR2.6, NFR1.1, NFR4.6, PERF-1

---

### Epic 7.1: Context Menu Integration

**Goal:** Add right-click context menu actions for quick capture.
**Scope:**

- **In:**
  - "Send selection to Anytype" (for text selection)
  - "Clip article to Anytype" (for full page)
  - "Bookmark to Anytype" (for current page)
  - Context menu actions trigger appropriate capture flow
- **Out:**
  - "Add to Reading List" (post-MVP)
  - Additional context menu items (post-MVP)
    **Dependencies:** 3.0, 3.1, 4.0
    **Exit Criteria:**
- Context menu items appear on right-click
- "Send selection" works with text selected
- "Clip article" triggers article extraction
- "Bookmark" saves current page
- Context menu actions respect user permissions
  **Targets:** FR4.5, FR5.9, FR14.1, AC3

---

### Epic 7.2: Options Page

**Goal:** Create settings page for default Space, retry behavior, and preferences.
**Scope:**

- **In:**
  - Default Space per content type
  - Retry behavior: max attempts, backoff intervals
  - Enable/disable deduplication
  - Custom Anytype port configuration
  - Image handling preference (always/smart/never embed)
  - Privacy mode toggle
  - "Clear All Data" option
- **Out:**
  - Screenshot toggle (post-MVP)
  - Domain tag mappings editor (post-MVP)
  - Reading list settings (post-MVP)
  - Keyboard shortcuts (post-MVP)
  - Debug log viewer (post-MVP)
  - Template editor (post-MVP)
    **Dependencies:** 1.2, 7.0
    **Exit Criteria:**
- Options page accessible from popup
- Default Space configurable per content type
- Retry behavior configurable
- Deduplication can be toggled
- Custom port configuration works
- Image handling preference applied
- Privacy mode works
- Clear all data removes all extension data
  **Targets:** FR13.1, FR13.2, FR13.3, FR13.4, FR13.6, FR13.7, FR13.12, FR13.13, AC7, PRIV-4

---

### Epic 7.3: Notifications System

**Goal:** Implement success/error notifications with actionable feedback.
**Scope:**

- **In:**
  - Success notifications with link to Anytype
  - Error notifications with next steps
  - Queued notifications
  - Re-auth notifications (non-intrusive)
  - Extraction quality feedback (green/yellow/orange)
  - Duplicate detection warnings
- **Out:**
  - Badge counter (covered in 5.3)
  - Toast notifications (post-MVP)
    **Dependencies:** 3.0, 5.0, 6.0
    **Exit Criteria:**
- Success notifications show with Anytype link
- Error notifications include actionable next steps
- Queued notifications inform user of offline status
- Re-auth notifications non-intrusive
- Extraction quality feedback clear
- Duplicate warnings visible
  **Targets:** FR3.4, FR5.10, FR6.2, NFR4.3, NFR4.5, ERR-2, ERR-4

---

### Epic 8.0: Unit Test Suite

**Goal:** Achieve >80% unit test coverage for all modules.
**Scope:**

- **In:**
  - Jest configuration
  - Unit tests for API client
  - Unit tests for storage manager
  - Unit tests for queue manager
  - Unit tests for URL normalizer
  - Unit tests for smart tagger
  - Unit tests for content extractors
  - Unit tests for Markdown converter
  - Mock Anytype API for testing
- **Out:**
  - Integration tests (covered in 8.1)
  - E2E tests (covered in 8.2)
    **Dependencies:** All implementation epics (1.0-7.3)
    **Exit Criteria:**
- > 80% code coverage achieved
- All public functions have unit tests
- Edge cases tested
- Error scenarios tested
- Tests run in <5 seconds
- CI pipeline runs tests automatically
  **Targets:** NFR6.3, TEST-1, TEST-2, TEST-5, TEST-6

---

### Epic 8.1: Integration Tests

**Goal:** Test critical paths with integration tests.
**Scope:**

- **In:**
  - Auth flow integration tests
  - Capture flow integration tests (bookmark, highlight, article)
  - Queue + retry integration tests
  - Deduplication integration tests
  - API client + storage integration tests
- **Out:**
  - E2E tests (covered in 8.2)
    **Dependencies:** 8.0
    **Exit Criteria:**
- Critical paths covered with integration tests
- Auth flow tested end-to-end
- Capture flows tested with mock API
- Queue + retry logic tested
- Deduplication tested with real storage
  **Targets:** TEST-3, TEST-6

---

### Epic 8.2: E2E Test Suite

**Goal:** Create Puppeteer E2E tests covering all acceptance criteria.
**Scope:**

- **In:**
  - Puppeteer configuration
  - E2E tests for all PRD acceptance criteria (AC1-AC20)
  - Test fixtures (sample pages, mock API)
  - Browser automation for capture flows
  - Queue recovery tests
  - Service worker termination tests
- **Out:**
  - Manual testing (covered in 8.3)
    **Dependencies:** 8.0, 8.1
    **Exit Criteria:**
- All PRD acceptance criteria (AC1-AC20) covered
- E2E tests run in CI pipeline
- Test fixtures created for diverse page types
- Queue recovery tested
- Service worker termination tested
  **Targets:** NFR6.4, TEST-4, TEST-6, AC1-AC20

---

### Epic 8.3: Manual Testing & Bug Fixes

**Goal:** Perform manual testing on Linux/Brave and fix discovered bugs.
**Scope:**

- **In:**
  - Manual test matrix for Linux/Brave
  - Cross-browser testing (Chrome, Edge, Opera)
  - UI/UX testing
  - Accessibility testing (keyboard nav, screen reader)
  - Performance benchmarking
  - Bug fixes for discovered issues
  - Regression tests for bug fixes
- **Out:**
  - Automated tests (covered in 8.0-8.2)
    **Dependencies:** 8.0, 8.1, 8.2
    **Exit Criteria:**
- Manual testing completed on Linux/Brave
- Cross-browser testing completed
- Accessibility tested (keyboard nav, screen reader)
- Performance benchmarks met (see Section 9 in constitution)
- All critical bugs fixed
- Regression tests added for bug fixes
  **Targets:** NFR1.1-NFR1.8, NFR4.6, NFR4.7, NFR5.1, NFR5.2, TEST-7, TEST-8

---

### Epic 8.4: Documentation

**Goal:** Complete all user-facing and developer documentation.
**Scope:**

- **In:**
  - README with installation instructions
  - User guide with screenshots
  - API documentation (Anytype API wrapper)
  - Architecture overview
  - Testing guide
  - Changelog
  - JSDoc comments for all public APIs
  - Inline comments for complex logic
- **Out:**
  - Video tutorials (post-MVP)
  - FAQ (post-MVP)
    **Dependencies:** All implementation epics (1.0-7.3)
    **Exit Criteria:**
- README complete with installation steps
- User guide includes screenshots for all features
- API documentation reflects current implementation
- Architecture overview matches actual structure
- Testing guide explains how to run tests
- Changelog updated for v1.0
- All public APIs have JSDoc comments
- Complex logic has inline comments
  **Targets:** NFR6.5, NFR6.6, DOC-1, DOC-2, DOC-3, DOC-4, DOC-5, DOC-6, DOC-7

---

### Epic 9.0: Release Preparation

**Goal:** Prepare extension package for distribution.
**Scope:**

- **In:**
  - Version number finalization (v1.0)
  - Build production package
  - Validate manifest
  - Test installation from .zip
  - Create release notes
  - Security review
  - Performance benchmarking
  - Pre-release checklist completion
- **Out:**
  - Chrome Web Store submission (covered in 9.1)
    **Dependencies:** 8.0, 8.1, 8.2, 8.3, 8.4
    **Exit Criteria:**
- Version set to 1.0
- Production build creates valid .zip
- Manifest validates
- Extension installs from .zip successfully
- Release notes complete
- Security review passed
- Performance benchmarks met
- All pre-release checklist items completed
  **Targets:** All NFRs, All PRD acceptance criteria

---

### Epic 9.1: Packaging & Distribution

**Goal:** Package extension and prepare for distribution.
**Scope:**

- **In:**
  - Create .zip package for distribution
  - Prepare Chrome Web Store listing (screenshots, description)
  - Create GitHub release
  - Tag v1.0 in git
  - Announce release
- **Out:**
  - Chrome Web Store submission (requires account)
  - Marketing materials (post-MVP)
    **Dependencies:** 9.0
    **Exit Criteria:**
- .zip package created and tested
- Chrome Web Store listing prepared
- GitHub release created with .zip attachment
- v1.0 tag created in git
- Release announced to stakeholders
  **Targets:** Deliverables Phase 1 (PRD)

---

## Post-MVP Roadmap

### Notification System Enhancements

Future enhancements for the notification system (Epic 7.3):

- **Settings Integration:** Add notification position preference to options page (top/bottom)
- **Notification History:** Optional persistent log of past notifications with timestamps
- **Custom Durations:** User-configurable auto-dismiss timers for different notification types
- **Sound Effects:** Optional audio feedback for notifications (success chime, error alert)
- **Desktop Notifications:** Browser notification API integration for background notifications

### Phase 2: Enhanced Features (v1.1)

#### Epic 10.0: Reading List / "Read Later" Mode

- Quick capture to designated "Reading List" object
- Keyboard shortcut (Ctrl+Shift+S)
- Badge counter for unread items
- Mark as read/unread
- Reading list view in popup
- Auto-archive after X days
- **Targets:** FR9.1-FR9.7, AC13, US4
  
  #### Epic 10.1: Keyboard Shortcuts
- Configurable keyboard shortcuts
- Quick capture to reading list
- Open popup
- Capture selection
- Clip article
- **Targets:** FR14.6, FR9.2, FR13.11
  
  #### Epic 10.2: Checkpoint-Based Recovery
- Checkpoint system for large articles (>2MB)
- Resume from last checkpoint on service worker restart
- "Resume interrupted captures" button
- Checkpoint state storage
- **Targets:** FR6.8, AC15, DATA-2
  
  #### Epic 10.3: Advanced Smart Tagging
- Learn from user's past tagging patterns
- Custom domain → tag mappings UI
- Tag usage statistics
- **Targets:** FR8.3, FR8.5, FR13.9
  
  #### Epic 10.4: Content Enrichment
- Archive.org Wayback Machine snapshot links
- PDF link extraction
- Related links extraction
- Page modification date capture
- **Targets:** FR3.6, FR3.7, FR10.6, FR10.7, FR10.8
  
  #### Epic 10.5: Template System
- User-defined templates for content types
- Template editor with variables
- Custom property mappings
- Pre-filled notes/checklists
- Template selector in popup
- Import/export templates
- **Targets:** FR12.1-FR12.6
  
  #### Epic 10.6: Debug Log Viewer
- Debug log viewer in options page
- Export log as JSON
- Statistics dashboard
- Auto-clear logs >30 days
- **Targets:** FR6.12, FR13.14, AC19
  
  #### Epic 10.7: Sync Status Dashboard
- Detailed sync status in popup
- Timestamps, retry counts, error logs
- Export queue as JSON
- Statistics: total captures, success rate, most-captured domains
- **Targets:** FR6.11
  
  #### Epic 10.8: Multiple Highlights Per Page
- Capture multiple highlights in single session
- Visual indicators for captured content
- Append multiple highlights to same object
- **Targets:** FR4.6, FR4.7, FR4.8, FR4.9, AC17, US2
  
  #### Epic 10.9: Screenshot Capture
- Optional screenshot capture (user-configurable)
- chrome.tabs.captureVisibleTab
- Compress to WebP, limit to 500KB
- Requires <all_urls> permission
- **Targets:** FR3.5, FR13.8
  
  #### Epic 10.10: Privacy Mode
- Disable URL history tracking
- Privacy mode toggle in settings
- **Targets:** FR13.12, AC20, PRIV-3

---

### Phase 3: Advanced Features (v1.2+)

#### Epic 11.0: Visual Selection Tool

- Visual selection tool for page regions
- "Clip visible area" option
- Exclude elements before capture (custom CSS selectors)
- **Targets:** FR11.2, FR11.3, FR11.4, FR13.17
  
  #### Epic 11.1: Selective Capture Modes
- Capture mode selector: Simplified/Full Page/Selection/Bookmark
- Full page capture with cleaning
- Selection-only capture
- **Targets:** FR11.1
  
  #### Epic 11.2: Omnibox Integration
- Omnibox command (type "any" + tab)
- Search/capture from address bar
- **Targets:** FR14.2
  
  #### Epic 11.3: Side Panel UI
- Side panel UI (Chrome 114+)
- Persistent access to extension
- **Targets:** FR14.3
  
  #### Epic 11.4: Search & Discovery
- Search existing Anytype objects before saving
- Suggest related objects to link to
- Quick search in popup
- Recent captures list (last 10)
- **Targets:** FR15.1, FR15.3, FR15.4, FR15.5
  
  #### Epic 11.5: Analytics Dashboard
- Personal analytics dashboard
- Most-captured domains
- Capture frequency over time
- Content type distribution
- Reading list completion rate
- Export analytics as CSV
- **Targets:** FR16.1, FR16.2, FR16.3, FR16.4
  
  #### Maintenance / Unplanned Work

- **Input Code Authentication (P0):** `specs/031-input-code-auth/` - Feature to support manual code entry.
- **Tag Management Integration (P1):** `specs/035-tag-management/` - Completed.

This section tracks bug fixes, chores, and unplanned changes that are not part of the main roadmap.
  #### Epic 11.6: Collaboration Features
- Share captured content to shared Spaces
- Capture with @mentions
- Collaborative highlights
- **Targets:** FR17.1, FR17.2, FR17.3 (requires Anytype API support)

---

## Appendix: Quick Reference

### Triggering Spec-Kit Workflow

To start work on any epic:

```bash
/speckit specify "reference roadmap.md file for [EPIC_NUMBER]"
```

Examples:

```bash
/speckit specify "reference roadmap.md file for 1.0"
/speckit specify "reference roadmap.md file for 4.2"
/speckit specify "reference roadmap.md file for 6.1"
```

### Epic Sizing Guidelines

Each epic should:

- Be completable in 1-2 weeks by one developer
- Result in one spec folder
- Have clear, measurable exit criteria
- Reference specific PRD requirements
- Include dependencies and targets
  
  ### Breakpoint Completion Criteria
  
  **BP0 Complete:** Project builds, modules structured, storage + API client ready 
  **BP1 Complete:** User can authenticate and connect to Anytype 
  **BP2 Complete:** User can capture bookmarks and highlights 
  **BP3 Complete:** User can capture articles with fallbacks 
  **BP4 Complete:** Queue works offline with retry logic 
  **BP5 Complete:** Duplicates detected, tags suggested 
  **BP6 Complete:** UI complete (popup, context menu, options, notifications) 
  **BP7 Complete:** Tests passing, bugs fixed, docs complete 
  **BP8 Complete:** v1.0 released and distributed 
  
  ### PRD Requirements Coverage
  
  | Epic | PRD Requirements                                                                 |
  | ---- | -------------------------------------------------------------------------------- |
  | 1.0  | NFR6.1, NFR6.2, NFR6.7, NFR6.8                                                   |
  | 1.1  | FR1.2, FR1.3, NFR2.4, NFR5.6                                                     |
  | 1.2  | NFR3.1, STORE-1, STORE-4, DATA-3, PRIV-4                                         |
  | 2.0  | FR1.1, FR1.2, FR1.3, FR1.4, AC1, AUTH-1, AUTH-2                                  |
  | 2.1  | FR1.4, FR1.5, FR1.8, AUTH-2, AUTH-5, AUTH-6, SEC-1, SEC-3                        |
  | 2.2  | FR1.6, FR1.7, AUTH-3, AUTH-4, REL-1                                              |
  | 3.0  | FR3.1, FR3.2, FR3.3, FR3.4, AC2, US1                                             |
  | 3.1  | FR4.1, FR4.2, FR4.3, FR4.4, FR4.5, AC3, US2, PERF-5                              |
  | 3.2  | FR3.3, FR10.1, FR10.2, FR10.3, FR10.4, FR10.5, AC10                              |
  | 4.0  | FR5.1, FR5.10, NFR1.2, PERF-2, US1                                               |
  | 4.1  | FR5.2, FR5.3, FR5.4, AC4, AC16                                                   |
  | 4.2  | FR5.1, FR5.10, FR5.11, AC9, ERR-7, REL-8                                         |
  | 4.3  | FR5.6, AC10, PERF-6, NFR1.7, NET-3                                               |
  | 4.4  | FR5.5, AC11                                                                      |
  | 5.0  | FR6.1, FR6.2, FR6.4, FR6.6, FR6.9, FR6.10, AC5, AC8, DATA-1, DATA-3, DATA-4, US3 |
  | 5.1  | FR6.3, FR6.5, NFR2.3, REL-4, REL-7                                               |
  | 5.2  | FR6.7, NFR2.2, NFR2.4, NFR2.5, REL-2, REL-3, REL-5                               |
  | 5.3  | FR6.2, FR6.5, AC5, US3                                                           |
  | 6.0  | FR7.1, FR7.2, FR7.3, FR7.6, AC6, AC14, DATA-7, PERF-7, US7                       |
  | 6.1  | FR8.1, FR8.2, FR8.4, FR8.6, FR8.7, AC12, US5                                     |
  | 6.2  | FR2.4, FR4.9, FR7.4, FR7.5, AC17, US2, US7                                       |
  | 7.0  | FR2.1, FR2.2, FR2.3, FR2.5, FR2.6, NFR1.1, NFR4.6, PERF-1                        |
  | 7.1  | FR4.5, FR5.9, FR14.1, AC3                                                        |
  | 7.2  | FR13.1, FR13.2, FR13.3, FR13.4, FR13.6, FR13.7, FR13.12, FR13.13, AC7, PRIV-4    |
  | 7.3  | FR3.4, FR5.10, FR6.2, NFR4.3, NFR4.5, ERR-2, ERR-4                               |
  | 8.0  | NFR6.3, TEST-1, TEST-2, TEST-5, TEST-6                                           |
  | 8.1  | TEST-3, TEST-6                                                                   |
  | 8.2  | NFR6.4, TEST-4, TEST-6, AC1-AC20                                                 |
  | 8.3  | NFR1.1-NFR1.8, NFR4.6, NFR4.7, NFR5.1, NFR5.2, TEST-7, TEST-8                    |
  | 8.4  | NFR6.5, NFR6.6, DOC-1, DOC-2, DOC-3, DOC-4, DOC-5, DOC-6, DOC-7                  |
  | 9.0  | All NFRs, All PRD acceptance criteria                                            |
  | 9.1  | Deliverables Phase 1 (PRD)                                                       |

---

**End of Roadmap**
This roadmap is designed for Spec-Kit anchors. Each epic can be triggered with `/specify "reference roadmap.md file for X.Y"` to begin the Specify → Plan → Tasks → Implement workflow defined in constitution.md.
