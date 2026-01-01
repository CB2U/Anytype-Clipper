# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Added
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

### Fixed
- **Tag Assignment:** Fixed critical bugs preventing tags from being saved (API payload structure).
- **API Client:** Added `PATCH` support (required for updates) and fixed ID extraction.
- **Service Worker:** Implemented reliable "Create then Update" flow for bookmarks.
