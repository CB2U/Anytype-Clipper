# Implementation Plan: Project Setup & Architecture

## Goal

Establish a production-ready TypeScript project foundation for the Anytype Clipper Extension with Manifest V3 compliance, strict type checking, automated linting, and a modern build pipeline. This epic creates the scaffolding that all subsequent development will build upon.

## Architecture Overview

### Build Tool Selection: Vite

**Decision:** Use Vite 5.x as the build tool

**Rationale:**
- Faster development builds with HMR (Hot Module Replacement)
- Native ESM support with better tree-shaking
- Simpler configuration than Webpack
- Excellent TypeScript support out of the box
- Growing ecosystem with good extension plugin support (@crxjs/vite-plugin)

**Alternatives Considered:**
- Webpack 5: More mature extension ecosystem but slower builds and more complex configuration
- Rollup: Good for libraries but less suited for extension development

### Module Architecture

```
anytype-clipper/
├── src/
│   ├── background/
│   │   └── service-worker.ts          # Main service worker entry point
│   ├── content/
│   │   └── content-script.ts          # Content script entry point
│   ├── popup/
│   │   ├── popup.html                 # Popup UI structure
│   │   ├── popup.ts                   # Popup logic
│   │   └── popup.css                  # Popup styles
│   ├── lib/
│   │   └── utils/
│   │       └── constants.ts           # Shared constants
│   ├── types/
│   │   └── index.d.ts                 # Global type definitions
│   └── manifest.json                  # Extension manifest template
├── public/
│   └── icons/                         # Extension icons (16, 32, 48, 128)
├── dist/                              # Build output (gitignored)
├── .github/
│   └── workflows/
│       └── ci.yml                     # GitHub Actions CI pipeline
├── .gitignore
├── .eslintrc.cjs
├── .prettierrc
├── tsconfig.json
├── vite.config.ts
├── package.json
└── README.md
```

### Key Components

**Service Worker (`src/background/service-worker.ts`):**
- Entry point for background logic
- Handles extension lifecycle events
- Will be extended in future epics for API client, queue manager, etc.

**Content Script (`src/content/content-script.ts`):**
- Injected into web pages (on activation, not always)
- Will handle text selection, page content extraction in future epics

**Popup UI (`src/popup/`):**
- Browser action popup interface
- Basic HTML/CSS/TS structure
- Will be extended with Space/Type selectors in Epic 7.0

**Shared Libraries (`src/lib/`):**
- Utilities and helpers shared across modules
- Constants and configuration
- Type-safe wrappers for Chrome APIs

## Proposed Changes

### Build Configuration

#### [NEW] [vite.config.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/vite.config.ts)

Configure Vite with:
- `@crxjs/vite-plugin` for Manifest V3 support
- TypeScript compilation
- Asset handling for HTML, CSS, images
- Source map generation for development
- Minification and optimization for production
- Output directory: `dist/`

#### [NEW] [tsconfig.json](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/tsconfig.json)

TypeScript configuration with:
- `strict: true` and all strict mode flags enabled
- `target: ES2020` for modern JavaScript features
- `module: ESNext` for native ESM
- `moduleResolution: bundler` for Vite compatibility
- Path aliases: `@/*` → `src/*`
- Include: `src/**/*`
- Exclude: `node_modules`, `dist`

#### [NEW] [package.json](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/package.json)

Dependencies:
- `typescript: ^5.3.0`
- `vite: ^5.0.0`
- `@crxjs/vite-plugin: ^2.0.0`
- `@types/chrome: ^0.0.260`

DevDependencies:
- `eslint: ^8.56.0`
- `@typescript-eslint/parser: ^6.19.0`
- `@typescript-eslint/eslint-plugin: ^6.19.0`
- `eslint-config-prettier: ^9.1.0`
- `prettier: ^3.2.0`

Scripts:
- `dev`: `vite` - Development server with HMR
- `build`: `vite build` - Production build
- `lint`: `eslint src --ext .ts,.tsx` - Run ESLint
- `format`: `prettier --write "src/**/*.{ts,tsx,css,html}"` - Format code
- `type-check`: `tsc --noEmit` - Type check without emitting files

---

### Code Quality Configuration

#### [NEW] [.eslintrc.cjs](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/.eslintrc.cjs)

ESLint configuration with:
- `@typescript-eslint/parser` for TypeScript parsing
- `@typescript-eslint/eslint-plugin` for TypeScript rules
- `eslint-config-prettier` to disable conflicting rules
- Rules:
  - `@typescript-eslint/no-explicit-any: error` - Enforce no `any` types
  - `@typescript-eslint/no-unused-vars: error` - No unused variables
  - `no-console: warn` - Warn on console usage (will be error in production)

#### [NEW] [.prettierrc](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/.prettierrc)

Prettier configuration with:
- `semi: true` - Require semicolons
- `singleQuote: true` - Use single quotes
- `tabWidth: 2` - 2 spaces for indentation
- `trailingComma: 'es5'` - Trailing commas where valid in ES5
- `printWidth: 100` - Line width limit

---

### Extension Structure

#### [NEW] [src/manifest.json](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/manifest.json)

Manifest V3 configuration:
- `manifest_version: 3`
- `name: "Anytype Clipper"`
- `version: "0.1.0"`
- `description: "Capture web content directly into your local Anytype workspace"`
- `permissions: ["storage", "activeTab", "contextMenus"]`
- `host_permissions: ["http://localhost/*"]` - For Anytype API
- `background: { service_worker: "src/background/service-worker.ts", type: "module" }`
- `action: { default_popup: "src/popup/popup.html" }`
- `content_scripts: []` - Will be configured in Epic 3.1
- `icons: { "16": "icons/icon16.png", "32": "icons/icon32.png", "48": "icons/icon48.png", "128": "icons/icon128.png" }`

#### [NEW] [src/background/service-worker.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/background/service-worker.ts)

Basic service worker structure:
```typescript
// Service worker entry point
console.log('Anytype Clipper service worker loaded');

// Extension installation handler
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Keep service worker alive (will be enhanced in future epics)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Message handling will be implemented in future epics
  console.log('Received message:', message);
  sendResponse({ success: true });
  return true; // Keep channel open for async response
});
```

#### [NEW] [src/popup/popup.html](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.html)

Basic popup structure:
```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Anytype Clipper</title>
  <link rel="stylesheet" href="./popup.css">
</head>
<body>
  <div class="container">
    <h1>Anytype Clipper</h1>
    <p>Extension loaded successfully!</p>
  </div>
  <script type="module" src="./popup.ts"></script>
</body>
</html>
```

#### [NEW] [src/popup/popup.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.ts)

Basic popup logic:
```typescript
// Popup UI entry point
console.log('Popup loaded');

// Will be extended with Space/Type selectors in Epic 7.0
document.addEventListener('DOMContentLoaded', () => {
  console.log('Popup DOM ready');
});
```

#### [NEW] [src/popup/popup.css](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/popup/popup.css)

Basic popup styles:
```css
body {
  width: 320px;
  min-height: 200px;
  margin: 0;
  padding: 16px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.container {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

h1 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

p {
  margin: 0;
  font-size: 14px;
  color: #666;
}
```

#### [NEW] [src/content/content-script.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/content/content-script.ts)

Placeholder content script:
```typescript
// Content script entry point
// Will be extended with text selection and page extraction in Epic 3.1
console.log('Anytype Clipper content script loaded');
```

#### [NEW] [src/lib/utils/constants.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/lib/utils/constants.ts)

Shared constants:
```typescript
// Application constants
export const APP_NAME = 'AnytypeClipper';
export const DEFAULT_ANYTYPE_PORT = 31009;
export const MAX_QUEUE_SIZE = 1000;
export const MAX_CAPTURE_SIZE_MB = 5;
```

#### [NEW] [src/types/index.d.ts](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/src/types/index.d.ts)

Global type definitions:
```typescript
// Global type definitions
// Will be extended with Anytype API types in Epic 1.1
```

---

### Repository Configuration

#### [NEW] [.gitignore](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/.gitignore)

Ignore patterns:
```
node_modules/
dist/
.DS_Store
*.log
.env
.vscode/
.idea/
```

#### [NEW] [README.md](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/README.md)

Project overview and setup instructions:
- Project description
- Prerequisites (Node.js 18+, npm 8+)
- Installation: `npm install`
- Development: `npm run dev`
- Building: `npm run build`
- Linting: `npm run lint`
- Loading extension in browser
- Project structure overview
- Contributing guidelines (reference to constitution.md)

---

### CI/CD Pipeline

#### [NEW] [.github/workflows/ci.yml](file:///mnt/Storage/Documents/Projects/AnyType-Clipper/.github/workflows/ci.yml)

GitHub Actions workflow:
- Trigger on push to main and pull requests
- Steps:
  1. Checkout code
  2. Setup Node.js 18
  3. Install dependencies (`npm ci`)
  4. Run type checking (`npm run type-check`)
  5. Run linting (`npm run lint`)
  6. Run build (`npm run build`)
  7. Upload build artifacts (optional)

---

### Placeholder Assets

#### [NEW] public/icons/

Create placeholder icons (16x16, 32x32, 48x48, 128x128):
- Simple "AT" logo or Anytype branding
- PNG format with transparency
- Will be replaced with final designs later

## Verification Plan

### Automated Tests

**Note:** Test infrastructure will be set up in Epic 8.0. For this epic, verification is primarily manual and build-based.

1. **Type Checking**
   - Command: `npm run type-check`
   - Expected: Zero TypeScript errors
   - Verifies: Strict mode configuration, no `any` types

2. **Linting**
   - Command: `npm run lint`
   - Expected: Zero ESLint errors or warnings
   - Verifies: Code quality rules, TypeScript plugin integration

3. **Build**
   - Command: `npm run build`
   - Expected: Successful build with output in `dist/`
   - Verifies: Vite configuration, manifest generation, asset bundling

4. **CI Pipeline**
   - Trigger: Push to main branch or create pull request
   - Expected: All steps pass (type-check, lint, build)
   - Verifies: Automated quality checks, reproducible builds

### Manual Verification

1. **Extension Loading**
   - Steps:
     1. Run `npm run build`
     2. Open Chrome/Brave
     3. Navigate to `chrome://extensions/`
     4. Enable "Developer mode"
     5. Click "Load unpacked"
     6. Select `dist/` directory
   - Expected: Extension loads without errors, icon appears in toolbar
   - Verifies: AC-SETUP-3 (Manifest V3 validation)

2. **Popup Functionality**
   - Steps:
     1. Load extension (as above)
     2. Click extension icon in toolbar
   - Expected: Popup opens showing "Anytype Clipper" heading and success message
   - Verifies: Popup HTML/CSS/TS integration, basic UI rendering

3. **Service Worker**
   - Steps:
     1. Load extension
     2. Navigate to `chrome://extensions/`
     3. Click "Inspect views: service worker"
   - Expected: DevTools opens, console shows "Anytype Clipper service worker loaded"
   - Verifies: Service worker loads and executes

4. **Development Workflow**
   - Steps:
     1. Run `npm run dev`
     2. Load extension from `dist/`
     3. Edit `src/popup/popup.html` (change heading text)
     4. Reload extension
   - Expected: Changes appear in popup without manual rebuild
   - Verifies: AC-SETUP-7 (Developer experience), HMR functionality

5. **Fresh Clone Setup**
   - Steps:
     1. Clone repository to new directory
     2. Run `npm install`
     3. Run `npm run dev`
     4. Run `npm run build`
     5. Run `npm run lint`
   - Expected: All commands succeed without errors
   - Verifies: AC-SETUP-7 (Developer onboarding), complete setup process

