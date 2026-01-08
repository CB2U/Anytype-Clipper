# Anytype Clipper Extension

Capture web content (bookmarks, highlights, articles) directly into your local Anytype workspace via a Brave/Chromium browser extension.

## Features

### Core Capture
- **Bookmark Capture**: Save current page with URL, title, favicon, and metadata
- **Highlight Capture**: Capture selected text with 50 chars of context before/after
- **Article Capture**: Smart extraction using Mozilla Readability with 4-level fallback chain
- **Context Menu Integration**: Right-click actions for quick capture

### Content Processing
- **Smart Article Extraction**: Automatically strips ads, navigation, and clutter
- **Markdown Conversion**: Clean Markdown output preserving headings, lists, code blocks, and quotes
- **Table Preservation**: Intelligent handling - Simple tables as Markdown, Complex as HTML, Data as JSON/CSV
- **Image Handling**: Smart embedding strategy (< 500KB embedded, > 500KB linked)
- **Metadata Extraction**: Captures OpenGraph tags, Schema.org data, author, published date, reading time

### Organization & Tagging
- **Space Selection**: Choose which Anytype Space to save content into
- **Smart Tagging**: Domain-based and keyword-based tag suggestions
- **Tag Management**: Integrated autocomplete with existing Anytype tags
- **Inline Tag Creation**: Create new tags directly within the popup
- **URL Deduplication**: Detects duplicate bookmarks with options to skip, create anyway, or append
- **Append Mode**: Add new content to existing objects with timestamps

### Reliability & Queue
- **Offline Queue**: Persistent capture queue when Anytype is unavailable
- **Retry Logic**: Exponential backoff (1s, 5s, 30s, 5m) with max 10 attempts
- **Queue Status UI**: Real-time visibility of pending, sending, and failed captures
- **Badge Counter**: Extension icon badge showing pending item count
- **Manual Control**: Retry or delete failed/stalled captures from the queue
- **Health Check**: Automatic detection of Anytype availability

### User Experience
- **Notifications System**: Real-time color-coded feedback (green/red/yellow/blue)
- **Options Page**: Comprehensive settings for Spaces, retry behavior, deduplication, API port, image handling, privacy mode
- **Smart Error Handling**: User-friendly error messages with actionable next steps
- **Accessibility**: Full keyboard navigation, ARIA live regions, high contrast mode
- **Privacy-First**: All data stays local, no cloud sync, no telemetry

### Authentication
- **Challenge Code Flow**: Secure connection to local Anytype app
- **API Key Management**: Secure storage in chrome.storage.local
- **Re-authentication**: Automatic handling of 401 responses with queue fallback

## Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Chrome** or **Brave** browser for testing
- **Anytype Desktop** running locally (for full functionality)

## Installation

### For Development

```bash
# Clone the repository
git clone https://github.com/CB2U/anytype-clipper.git
cd anytype-clipper

# Install dependencies
npm install

# Build the extension
npm run build
```

### Loading the Extension

1. Run `npm run build` to create the extension package
2. Open Chrome/Brave and navigate to `chrome://extensions/`
3. Enable \"Developer mode\" (toggle in top right)
4. Click \"Load unpacked\"
5. Select the `dist/` directory from this project

The extension icon should appear in your browser toolbar.

## Development

```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Run type checking
npm run type-check

# Run linting
npm run lint

# Format code
npm run format
```

## Testing

```bash
# Run all unit tests
npm test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

See [TESTING.md](docs/TESTING.md) for detailed testing guide.

## Project Structure

```
anytype-clipper/
├── src/
│   ├── background/          # Service worker and background logic
│   │   ├── service-worker.ts
│   │   ├── queue-manager.ts
│   │   └── storage-manager.ts
│   ├── content/             # Content scripts for page interaction
│   │   ├── content-script.ts
│   │   └── highlight-capture.ts
│   ├── popup/               # Browser action popup UI
│   │   ├── popup.ts
│   │   └── components/
│   ├── lib/                 # Shared utilities and libraries
│   │   ├── api/            # Anytype API client
│   │   ├── extractors/     # Content extraction
│   │   ├── converters/     # Markdown conversion
│   │   ├── services/       # Tag, notification services
│   │   └── utils/          # Utilities
│   ├── types/               # TypeScript type definitions
│   └── manifest.json        # Extension manifest
├── tests/
│   ├── unit/               # Unit tests
│   └── integration/        # Integration tests
├── public/
│   └── icons/              # Extension icons
├── dist/                   # Build output (gitignored)
├── docs/                   # Documentation
│   ├── PRD.md             # Product Requirements Document
│   ├── roadmap.md         # Development roadmap
│   ├── TESTING.md         # Testing guide
│   ├── API.md             # API documentation
│   ├── ARCHITECTURE.md    # Architecture overview
│   └── USER_GUIDE.md      # User guide
├── specs/                  # Specification packages
└── README.md
```

## Documentation

- **[User Guide](docs/USER_GUIDE.md)**: How to use the extension
- **[API Documentation](docs/API.md)**: Developer API reference
- **[Architecture](docs/ARCHITECTURE.md)**: System design and structure
- **[Testing Guide](docs/TESTING.md)**: How to run and write tests
- **[PRD](docs/PRD.md)**: Product Requirements Document
- **[Roadmap](docs/roadmap.md)**: Development roadmap and epic breakdown
- **[SPECS.md](SPECS.md)**: Specification index

## Contributing

This project follows **Spec-Driven Development**. All development must follow the workflow:

1. **Specify**: Write detailed specification
2. **Plan**: Create implementation plan
3. **Tasks**: Break down into granular tasks
4. **Implement**: Write code with tests and documentation

## License

ISC

## 🚀 Current Status

**Latest Epic:** 8.4 Documentation - In Progress 🔄  
**Next:** Epic 9.0 (Release Preparation)

### Recent Completions
- ✅ Epic 8.1: Integration Tests (Complete)
- ✅ Epic 8.0: Unit Test Suite (Complete)
- ✅ Epic 7.3: Notifications System (Complete)
- ✅ Epic 7.2: Options Page (Complete)
- ✅ Epic 7.1: Context Menu Integration (Complete)
- ✅ Epic 6.2: Append Mode (Complete)
- ✅ Epic 6.1: Smart Tagging Engine (Complete)
- ✅ Epic 6.0: URL Deduplication (Complete)
- ✅ Epic 5.0-5.3: Offline Queue System (Complete)
- ✅ Epic 4.0-4.4: Article Extraction (Complete)
- ✅ Epic 3.0-3.2: Basic Capture (Complete)
- ✅ Epic 2.0-2.2: Authentication (Complete)
- ✅ Epic 1.0-1.2: Foundation (Complete)

### MVP Progress
- **Completed:** 22/32 epics (69%)
- **In Progress:** Epic 8.4 (Documentation)
- **Target:** v1.0 MVP Release

See [SPECS.md](SPECS.md) for detailed progress tracking.
