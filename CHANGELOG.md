# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
- **Notifications System (Epic 7.3):**
    - Real-time notification system with color-coded feedback (green/red/yellow/blue).
    - Success notifications for bookmark, article, and highlight captures with auto-dismiss (5s).
    - Error notifications with sanitized messages and actionable next steps (manual dismiss).
    - Queue status notifications when captures are saved offline.
    - Full ARIA support with live regions for screen readers.
    - Keyboard navigation (Escape to dismiss, Tab navigation, Enter for actions).
    - High contrast mode and reduced motion support for accessibility.
    - Security-compliant error sanitization (removes API keys, tokens, stack traces, PII).
    - Notification positioning (top/bottom) support.
- **Queue UI & Status (Epic 5.3):**
    - New `QueueStatusSection` in the popup for real-time queue visibility.
    - Extension icon badge counter showing pending capture count.
    - Support for manual retry and deletion of queue items.
    - Color-coded status badges (Queued, Sending, Sent, Failed).
    - Relative timestamp display for queue items.
    - Multi-component UI architecture for queue management.
- **Tag Management Integration:**
    - New `TagService` for managing and caching Anytype tags.
    - Custom `TagAutocomplete` UI component with keyboard navigation.
    - Support for inline tag creation directly from the extension.
    - Automated tag property ID resolution for Bookmark and Note types.
    - Persistence and caching of tags in `chrome.storage.local`.
- **API Client Extensions:**
    - `listTags` and `createTag` methods added to `AnytypeApiClient`.
- **Infrastructure:**
    - Extension storage schema updated to support tag caching and mappings.
    - Performance optimizations with a 5-minute tag cache TTL.
- **Offline Queue System (Epic 5.0):**
    - Implementation of `QueueManager` for persistent capture queuing.
    - Automatic fallback to offline queue on connectivity failures (NetworkError, 401, 502-504).
    - Queue persistence using `chrome.storage.local` with FIFO eviction (1000 items).
    - UI feedback in popup when content is saved offline.
    - Unit and integration test suites for queue logic and persistence.
- **Table Preservation:**
    - Intelligent classification of tables (Simple, Complex, Data).
    - Conversion of simple tables to clean Markdown.
    - HTML preservation for complex tables (merged cells, nested).
    - JSON/CSV extraction for data tables.

### Fixed
- **Tag Assignment:** Fixed critical bugs preventing tags from being saved (API payload structure).
- **API Client:** Added `PATCH` support (required for updates) and fixed ID extraction.
- **Service Worker:** Implemented reliable "Create then Update" flow for bookmarks.
