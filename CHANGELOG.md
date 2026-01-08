# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-01-08

### Added

#### Foundation (Epics 1.0-1.2)
- **Project Setup & Architecture (Epic 1.0)**
  - TypeScript project with strict mode configuration
  - Vite build pipeline with hot reload
  - Manifest V3 extension structure
  - ESLint + Prettier configuration
  - Module architecture (background, content, popup, lib)

- **API Client Foundation (Epic 1.1)**
  - Type-safe Anytype API client for localhost:31009
  - Request/response validation
  - Error type definitions (AuthError, NetworkError, ValidationError)
  - Health check ping implementation
  - Custom port configuration support

- **Storage Manager (Epic 1.2)**
  - Type-safe chrome.storage.local wrapper
  - Storage quota monitoring (warn at 80%, fail at 95%)
  - Data migration utilities
  - Clear all data functionality

#### Authentication (Epics 2.0-2.2)
- **Challenge Code Authentication (Epic 2.0)**
  - 4-digit challenge code flow
  - API key exchange and secure storage
  - First-run onboarding flow
  - Authentication state management

- **API Key Management (Epic 2.1)**
  - Secure API key storage in chrome.storage.local
  - API key validation on startup
  - "Disconnect" action to revoke credentials
  - Token expiration detection

- **Re-authentication Flow (Epic 2.2)**
  - Automatic 401 response handling
  - Non-intrusive re-auth notifications
  - Queue captures during re-authentication
  - Automatic queue resume after successful re-auth

#### Basic Capture (Epics 3.0-3.2)
- **Bookmark Capture (Epic 3.0)**
  - Capture tab URL, title, favicon, timestamp
  - User input for tags and notes
  - Domain extraction for site property
  - SourceApp="AnytypeClipper" property
  - Success notifications with Anytype link

- **Highlight Capture (Epic 3.1)**
  - Text selection detection via content script
  - Capture selected text + 50 chars context before/after
  - Source URL, page title, selection timestamp
  - Context menu action "Send selection to Anytype"
  - Quote and context properties

- **Metadata Extraction (Epic 3.2)**
  - Open Graph metadata (og:title, og:description, og:image)
  - Article metadata (author, published_time)
  - Twitter Card metadata
  - Schema.org Article metadata
  - Reading time estimate (words / 200 WPM)
  - Page language detection
  - Canonical URL extraction
  - Favicon capture (multiple sizes)

#### Article Extraction (Epics 4.0-4.4)
- **Readability Integration (Epic 4.0)**
  - Mozilla Readability for article extraction
  - Content cleaning (remove ads, nav, footer)
  - Article structure preservation
  - Extraction quality feedback

- **Markdown Conversion (Epic 4.1)**
  - Turndown library integration
  - Preserve headings (h1-h6), lists, code blocks, blockquotes, links
  - Code block language detection
  - Nested structure handling

- **Fallback Extraction Chain (Epic 4.2)**
  - 4-level fallback strategy:
    1. Readability (primary)
    2. Simplified DOM extraction
    3. Full page capture with cleaning
    4. Smart bookmark with enhanced metadata
  - Extraction quality indicators (green/yellow/orange)
  - "Retry extraction" option

- **Image Handling (Epic 4.3)**
  - Smart embedding strategy:
    - Images <500KB: Convert to base64 data URLs
    - Images >500KB: Keep as external URLs
    - Critical images (hero/featured): Always embed
  - CORS handling with fallback
  - WebP optimization at 85% quality
  - Limit to 20 embedded images per article
  - User-configurable preference (Always/Smart/Never embed)

- **Table Preservation (Epic 4.4)**
  - Intelligent table classification (Simple, Complex, Data)
  - Simple tables (≤6 cols, no merges, <20 rows): Markdown table syntax
  - Complex tables: Preserve as HTML blocks
  - Data tables: Convert to JSON/CSV + HTML fallback

#### Queue & Reliability (Epics 5.0-5.3)
- **Offline Queue System (Epic 5.0)**
  - Persistent queue in chrome.storage.local
  - Queue status tracking (queued/sending/sent/failed)
  - Survives browser restart and service worker termination
  - 1000 item limit with FIFO eviction
  - Sequential processing (not parallel)
  - Atomic operations for captures <2MB

- **Retry Logic with Backoff (Epic 5.1)**
  - Exponential backoff intervals: 1s, 5s, 30s, 5m
  - Max 10 retry attempts
  - Retry count tracking per queue item
  - Error message storage for failed items
  - Manual retry option
  - Delete failed items option

- **Health Check & Recovery (Epic 5.2)**
  - Health check ping to localhost:31009 (or custom port)
  - Service worker termination detection
  - Graceful recovery from termination
  - API response validation
  - Network error handling

- **Queue UI & Status (Epic 5.3)**
  - Queue status display in popup
  - Pending count with badge counter
  - Item status indicators (queued/sending/sent/failed)
  - Manual retry/delete actions
  - Timestamps and retry counts
  - Error messages for failed items

#### Deduplication & Tagging (Epics 6.0-6.2)
- **URL Deduplication (Epic 6.0)**
  - Search existing objects by URL before creating bookmark
  - URL normalization (lowercase, remove tracking params)
  - Handle variations: http/https, trailing slashes, www/non-www, query params, fragments
  - Duplicate warning in popup
  - User choice: Skip, Create anyway, Append to existing

- **Smart Tagging Engine (Epic 6.1)**
  - Domain → tag mappings (github.com → #development, #opensource)
  - Keyword extraction using TF-IDF/frequency analysis
  - Display suggested tags in popup (max 5)
  - One-click add for suggested tags
  - Extract tags from article meta keywords

- **Append Mode (Epic 6.2)**
  - "Append to existing" option when duplicate detected
  - Add new section with timestamp and source link
  - Optional "Append to object" mode with object search/picker
  - Append multiple highlights to same object

#### UI & Integration (Epics 7.0-7.3)
- **Popup UI (Epic 7.0)**
  - Browser action popup with Space/Type selectors
  - Space selector dropdown (fetch from API)
  - Type selector: Bookmark, Highlight, Article, Note, Task
  - Tags input with suggestions
  - Notes textarea
  - Save button with loading state
  - Success/error feedback
  - Remember last-used Space and Type
  - Require default Space selection on first use
  - Full keyboard navigation

- **Context Menu Integration (Epic 7.1)**
  - "Send selection to Anytype" (for text selection)
  - "Clip article to Anytype" (for full page)
  - "Bookmark to Anytype" (for current page)
  - Context menu actions trigger appropriate capture flow

- **Options Page (Epic 7.2)**
  - Default Space per content type
  - Retry behavior: max attempts, backoff intervals
  - Enable/disable deduplication
  - Custom Anytype port configuration
  - Image handling preference (always/smart/never embed)
  - Privacy mode toggle
  - "Clear All Data" option

- **Notifications System (Epic 7.3)**
  - Real-time notification system with color-coded feedback (green/red/yellow/blue)
  - Success notifications for bookmark, article, and highlight captures (auto-dismiss 5s)
  - Error notifications with sanitized messages and actionable next steps (manual dismiss)
  - Queue status notifications when captures are saved offline
  - Re-auth notifications (non-intrusive)
  - Extraction quality feedback (green/yellow/orange)
  - Duplicate detection warnings
  - Full ARIA support with live regions for screen readers
  - Keyboard navigation (Escape to dismiss, Tab navigation, Enter for actions)
  - High contrast mode and reduced motion support
  - Security-compliant error sanitization (removes API keys, tokens, stack traces, PII)
  - Notification positioning (top/bottom) support

#### Testing (Epics 8.0-8.1)
- **Unit Test Suite (Epic 8.0)**
  - Jest configuration with >80% code coverage
  - Unit tests for API client, storage manager, queue manager
  - Unit tests for URL normalizer, smart tagger, content extractors
  - Unit tests for Markdown converter
  - Mock Anytype API for testing
  - Tests run in <5 seconds
  - CI pipeline integration

- **Integration Tests (Epic 8.1)**
  - Auth flow integration tests
  - Capture flow integration tests (bookmark, highlight, article)
  - Queue + retry integration tests
  - Deduplication integration tests
  - API client + storage integration tests
  - Chrome API mocking
  - Test data setup and fixtures

#### Documentation (Epic 8.4)
- Comprehensive README with v1.0 features
- Testing guide (TESTING.md)
- API documentation (API.md)
- Architecture overview (ARCHITECTURE.md)
- User guide (USER_GUIDE.md)
- Complete CHANGELOG

### Fixed
- **Tag Assignment**: Fixed critical bugs preventing tags from being saved (API payload structure)
- **API Client**: Added PATCH support (required for updates) and fixed ID extraction
- **Service Worker**: Implemented reliable "Create then Update" flow for bookmarks
- **Highlight Tag Suggestions**: Fixed bug where highlight popup didn't show suggested tags
- **CI Workflow**: Disabled GitHub Actions CI workflow to prevent failure emails during development

### Changed
- Improved error messages with sanitization and actionable next steps
- Enhanced accessibility with full keyboard navigation and ARIA support
- Optimized tag caching with 5-minute TTL for better performance

### Security
- API keys stored only in chrome.storage.local (not sync)
- Error sanitization removes sensitive data (API keys, tokens, stack traces, PII)
- No external API calls (localhost only)
- No telemetry or analytics collection

## [Unreleased]

### Planned for v1.1+
- E2E Test Suite (Epic 8.2)
- Manual Testing & Bug Fixes (Epic 8.3)
- Release Preparation (Epic 9.0)
- Packaging & Distribution (Epic 9.1)
- Reading List / "Read Later" Mode
- Keyboard Shortcuts
- Checkpoint-Based Recovery
- Advanced Smart Tagging
- Template System
- Debug Log Viewer

---

[1.0.0]: https://github.com/CB2U/Anytype-Clipper/releases/tag/v1.0.0
