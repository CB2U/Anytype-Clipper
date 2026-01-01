# Anytype Clipper Extension

Capture web content (bookmarks, highlights, articles) directly into your local Anytype workspace via a Brave/Chromium browser extension.

## Features

- **Bookmark Capture**: Save current tab with metadata and tags
- **Highlight Capture**: Capture selected text with context
- **Article Capture**: Extract and save full articles with Markdown formatting
- **Offline Queue**: Captures work even when Anytype is offline
- **Smart Tagging**: Auto-suggest tags based on domain and content
- **Privacy-First**: All data stays local, no cloud sync

## Prerequisites

- **Node.js** 18+ and **npm** 8+
- **Chrome** or **Brave** browser for testing
- **Anytype Desktop** running locally (for full functionality)

## Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/anytype-clipper.git
cd anytype-clipper

# Install dependencies
npm install
```

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

## Loading the Extension

1. Run `npm run build` to create the extension package
2. Open Chrome/Brave and navigate to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked"
5. Select the `dist/` directory from this project

The extension icon should appear in your browser toolbar.

## Project Structure

```
anytype-clipper/
├── src/
│   ├── background/          # Service worker and background logic
│   ├── content/             # Content scripts for page interaction
│   ├── popup/               # Browser action popup UI
│   ├── lib/                 # Shared utilities and libraries
│   ├── types/               # TypeScript type definitions
│   └── manifest.json        # Extension manifest
├── public/
│   └── icons/               # Extension icons
├── dist/                    # Build output (gitignored)
├── docs/                    # Documentation
│   ├── PRD.md              # Product Requirements Document
│   └── roadmap.md          # Development roadmap
├── specs/                   # Specification packages
└── README.md
```

## Documentation

- **[PRD](docs/PRD.md)**: Product Requirements Document
- **[Roadmap](docs/roadmap.md)**: Development roadmap and epic breakdown
- **[Constitution](.specify/memory/constitution.md)**: Development standards and workflow gates
- **[SPECS.md](SPECS.md)**: Specification index

## Contributing

This project follows **Spec-Driven Development**. All development must follow the workflow defined in `constitution.md`:

1. **Specify**: Write detailed specification
2. **Plan**: Create implementation plan
3. **Tasks**: Break down into granular tasks
4. **Implement**: Write code with tests and documentation

See `constitution.md` for complete development standards.

## License

ISC

## Status

🚧 **In Development** - Epic 1.0: Project Setup & Architecture (Complete)

See [SPECS.md](SPECS.md) for current progress.
