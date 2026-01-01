# Tasks: Project Setup & Architecture

## Setup

### T1: Initialize Project Structure
**Goal:** Create the base directory structure and initialize npm project

**Steps:**
1. Create directory structure:
   - `src/background/`
   - `src/content/`
   - `src/popup/`
   - `src/lib/utils/`
   - `src/types/`
   - `public/icons/`
   - `.github/workflows/`
2. Initialize npm project: `npm init -y`
3. Update package.json with project metadata (name, description, version, author)

**Done when:**
- All directories exist
- package.json is created with correct metadata

**Verify:**
- Run `ls -la src/` and verify all subdirectories exist
- Run `cat package.json` and verify metadata is correct

**Evidence to record:**
- Directory structure screenshot or tree output
- package.json content

**Files touched:**
- package.json (new)
- Directory structure (new)

---

### T2: Install and Configure TypeScript
**Goal:** Set up TypeScript with strict mode configuration

**Steps:**
1. Install TypeScript: `npm install -D typescript @types/chrome`
2. Create tsconfig.json with strict mode enabled
3. Configure compiler options:
   - `strict: true`
   - `target: ES2020`
   - `module: ESNext`
   - `moduleResolution: bundler`
   - Path aliases: `@/*` → `src/*`
4. Test compilation: `npx tsc --noEmit`

**Done when:**
- TypeScript is installed
- tsconfig.json exists with all required strict mode flags
- `tsc --noEmit` runs without errors (even with empty project)

**Verify:**
- Run `npx tsc --version` to confirm TypeScript is installed
- Run `cat tsconfig.json` to verify configuration
- Run `npx tsc --noEmit` and verify zero errors

**Evidence to record:**
- TypeScript version output
- tsconfig.json content
- Successful compilation output

**Files touched:**
- package.json (modified - add TypeScript dependency)
- tsconfig.json (new)

---

### T3: Install and Configure Vite
**Goal:** Set up Vite build pipeline with Chrome extension plugin

**Steps:**
1. Install Vite and plugin: `npm install -D vite @crxjs/vite-plugin`
2. Create vite.config.ts with:
   - Import `@crxjs/vite-plugin`
   - Configure plugin with manifest path
   - Set output directory to `dist/`
   - Enable source maps for development
3. Add build scripts to package.json:
   - `"dev": "vite"`
   - `"build": "vite build"`
4. Test build: `npm run build`

**Done when:**
- Vite and plugin are installed
- vite.config.ts exists with correct configuration
- `npm run build` completes successfully (even with minimal files)

**Verify:**
- Run `npm run build` and verify `dist/` directory is created
- Check that manifest.json is copied to dist/
- Verify source maps are generated in development mode

**Evidence to record:**
- Successful build output
- Contents of dist/ directory
- vite.config.ts content

**Files touched:**
- package.json (modified - add Vite dependencies and scripts)
- vite.config.ts (new)

---

## Core Implementation

### T4: Create Manifest V3 Configuration
**Goal:** Create valid Manifest V3 manifest.json

**Steps:**
1. Create src/manifest.json with:
   - `manifest_version: 3`
   - Basic metadata (name, version, description)
   - Permissions: storage, activeTab, contextMenus
   - Host permissions: http://localhost/*
   - Background service worker configuration
   - Browser action with popup
   - Icons configuration
2. Validate manifest structure against Chrome Extension docs

**Done when:**
- src/manifest.json exists with all required fields
- Manifest follows Manifest V3 specification
- All paths reference correct files (even if not created yet)

**Verify:**
- Run `cat src/manifest.json` and verify structure
- Load extension in Chrome/Brave and check for manifest errors

**Evidence to record:**
- manifest.json content
- Screenshot of extension loaded without manifest errors

**Files touched:**
- src/manifest.json (new)

---

### T5: Implement Service Worker
**Goal:** Create basic service worker entry point

**Steps:**
1. Create src/background/service-worker.ts
2. Add installation handler with console log
3. Add message listener for future communication
4. Ensure TypeScript types are correct (use chrome.* APIs)

**Done when:**
- service-worker.ts exists with installation and message handlers
- TypeScript compilation passes
- No `any` types used

**Verify:**
- Run `npm run type-check` and verify zero errors
- Load extension and check service worker console for "loaded" message
- Inspect service worker in chrome://extensions/

**Evidence to record:**
- service-worker.ts content
- Screenshot of service worker console output

**Files touched:**
- src/background/service-worker.ts (new)

---

### T6: Implement Popup UI
**Goal:** Create basic popup HTML, CSS, and TypeScript

**Steps:**
1. Create src/popup/popup.html with basic structure
2. Create src/popup/popup.css with minimal styling
3. Create src/popup/popup.ts with DOM ready handler
4. Link CSS and TS in HTML
5. Ensure popup opens and displays correctly

**Done when:**
- All three popup files exist
- Popup HTML is valid and well-formed
- CSS provides basic styling
- TypeScript compiles without errors

**Verify:**
- Run `npm run build` and verify popup files are bundled
- Load extension and click icon to open popup
- Verify popup displays "Anytype Clipper" heading

**Evidence to record:**
- Screenshot of popup UI
- popup.html, popup.css, popup.ts content

**Files touched:**
- src/popup/popup.html (new)
- src/popup/popup.css (new)
- src/popup/popup.ts (new)

---

### T7: Create Content Script Placeholder
**Goal:** Create placeholder content script for future development

**Steps:**
1. Create src/content/content-script.ts
2. Add console log to verify script loads
3. Add TypeScript types for chrome.* APIs
4. Note: Content script will NOT be registered in manifest yet (Epic 3.1)

**Done when:**
- content-script.ts exists with basic structure
- TypeScript compilation passes
- File is ready for future integration

**Verify:**
- Run `npm run type-check` and verify zero errors
- Verify file exists: `cat src/content/content-script.ts`

**Evidence to record:**
- content-script.ts content

**Files touched:**
- src/content/content-script.ts (new)

---

### T8: Create Shared Utilities
**Goal:** Set up shared constants and type definitions

**Steps:**
1. Create src/lib/utils/constants.ts with:
   - APP_NAME
   - DEFAULT_ANYTYPE_PORT
   - MAX_QUEUE_SIZE
   - MAX_CAPTURE_SIZE_MB
2. Create src/types/index.d.ts as placeholder for future types
3. Ensure TypeScript can import from both files

**Done when:**
- Both files exist with correct exports
- TypeScript compilation passes
- Constants can be imported in other modules

**Verify:**
- Run `npm run type-check` and verify zero errors
- Test import in service-worker.ts: `import { APP_NAME } from '@/lib/utils/constants'`

**Evidence to record:**
- constants.ts content
- Successful import verification

**Files touched:**
- src/lib/utils/constants.ts (new)
- src/types/index.d.ts (new)

---

## Tests

**Note:** Test infrastructure will be set up in Epic 8.0. This epic focuses on build and linting verification.

---

## Docs

### T9: Configure ESLint and Prettier
**Goal:** Set up code quality and formatting tools

**Steps:**
1. Install ESLint and plugins:
   - `npm install -D eslint @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint-config-prettier`
2. Create .eslintrc.cjs with TypeScript configuration
3. Install Prettier: `npm install -D prettier`
4. Create .prettierrc with formatting rules
5. Add scripts to package.json:
   - `"lint": "eslint src --ext .ts,.tsx"`
   - `"format": "prettier --write \"src/**/*.{ts,tsx,css,html}\""`
6. Run lint and format on existing code

**Done when:**
- ESLint and Prettier are installed and configured
- `npm run lint` passes with zero warnings
- `npm run format` formats all files consistently

**Verify:**
- Run `npm run lint` and verify zero errors/warnings
- Run `npm run format` and verify files are formatted
- Verify .eslintrc.cjs and .prettierrc exist

**Evidence to record:**
- Successful lint output
- .eslintrc.cjs and .prettierrc content

**Files touched:**
- package.json (modified - add ESLint/Prettier dependencies and scripts)
- .eslintrc.cjs (new)
- .prettierrc (new)

---

### T10: Create README
**Goal:** Write comprehensive README with setup instructions

**Steps:**
1. Create README.md with sections:
   - Project description
   - Prerequisites (Node.js 18+, npm 8+)
   - Installation instructions
   - Development workflow
   - Build instructions
   - Loading extension in browser
   - Project structure overview
   - Link to constitution.md and PRD.md
2. Ensure instructions are clear and tested

**Done when:**
- README.md exists with all required sections
- Instructions are accurate and complete
- Links to other documentation work

**Verify:**
- Follow README instructions from scratch to verify they work
- Check that all links resolve correctly

**Evidence to record:**
- README.md content
- Verification that setup instructions work

**Files touched:**
- README.md (new)

---

### T11: Create .gitignore
**Goal:** Configure Git to ignore build artifacts and dependencies

**Steps:**
1. Create .gitignore with patterns:
   - node_modules/
   - dist/
   - .DS_Store
   - *.log
   - .env
   - .vscode/
   - .idea/
2. Verify no ignored files are tracked

**Done when:**
- .gitignore exists with all required patterns
- Git status shows only source files

**Verify:**
- Run `git status` and verify node_modules/ and dist/ are not listed
- Run `cat .gitignore` to verify content

**Evidence to record:**
- .gitignore content
- Git status output

**Files touched:**
- .gitignore (new)

---

## Verification

### T12: Create Placeholder Icons
**Goal:** Add placeholder extension icons

**Steps:**
1. Create simple placeholder icons (16x16, 32x32, 48x48, 128x128)
2. Save as PNG in public/icons/
3. Can use simple "AT" text or Anytype logo
4. Ensure icons are referenced correctly in manifest.json

**Done when:**
- All four icon sizes exist in public/icons/
- Icons display correctly in browser toolbar and extensions page

**Verify:**
- Load extension and verify icon appears in toolbar
- Check chrome://extensions/ for icon display

**Evidence to record:**
- Screenshot of extension icon in toolbar
- Screenshot of extensions page showing icon

**Files touched:**
- public/icons/icon16.png (new)
- public/icons/icon32.png (new)
- public/icons/icon48.png (new)
- public/icons/icon128.png (new)

---

### T13: Set Up CI Pipeline
**Goal:** Create GitHub Actions workflow for automated builds

**Steps:**
1. Create .github/workflows/ci.yml
2. Configure workflow to run on push and pull requests
3. Add steps:
   - Checkout code
   - Setup Node.js 18
   - Install dependencies (npm ci)
   - Run type checking (npm run type-check)
   - Run linting (npm run lint)
   - Run build (npm run build)
4. Test workflow by pushing to GitHub

**Done when:**
- ci.yml exists with all required steps
- Workflow runs successfully on push
- All checks pass (type-check, lint, build)

**Verify:**
- Push to GitHub and verify workflow runs
- Check GitHub Actions tab for successful run
- Verify all steps complete without errors

**Evidence to record:**
- ci.yml content
- Screenshot of successful GitHub Actions run

**Files touched:**
- .github/workflows/ci.yml (new)

---

### T14: Manual Verification - Extension Loading
**Goal:** Verify extension loads correctly in browser

**Steps:**
1. Run `npm run build`
2. Open Chrome/Brave
3. Navigate to chrome://extensions/
4. Enable "Developer mode"
5. Click "Load unpacked"
6. Select dist/ directory
7. Verify no errors in console
8. Click extension icon to open popup
9. Inspect service worker console

**Done when:**
- Extension loads without manifest errors
- Popup opens and displays correctly
- Service worker console shows "loaded" message

**Verify:**
- Screenshot of extensions page showing loaded extension
- Screenshot of popup UI
- Screenshot of service worker console

**Evidence to record:**
- All verification screenshots
- Any errors or warnings encountered

**Files touched:**
- None (manual verification only)

---

### T15: Manual Verification - Development Workflow
**Goal:** Verify development workflow with hot reload

**Steps:**
1. Run `npm run dev`
2. Load extension from dist/ in browser
3. Edit src/popup/popup.html (change heading text)
4. Reload extension in browser
5. Verify changes appear without manual rebuild

**Done when:**
- Development server starts successfully
- Changes are reflected after reload
- No build errors occur

**Verify:**
- Screenshot of development server running
- Screenshot showing changed popup text

**Evidence to record:**
- Development workflow verification screenshots

**Files touched:**
- None (manual verification only)

---

## Tracking

### T16: Update SPECS.md
**Goal:** Update specification index with Epic 1.0 status

**Steps:**
1. Open SPECS.md
2. Update Epic 1.0 row:
   - Status: "Done"
   - Next task: N/A (epic complete)
   - Latest commit: Add commit hash
   - Evidence link: specs/010-project-setup/spec.md#evidence
3. Update progress counters:
   - BP0 (Foundation): 1/3 complete
   - Total MVP: 1/32 complete

**Done when:**
- SPECS.md is updated with correct status
- Progress counters are accurate

**Verify:**
- Run `cat SPECS.md` and verify Epic 1.0 status is "Done"
- Verify progress counters are updated

**Evidence to record:**
- Updated SPECS.md content

**Files touched:**
- SPECS.md (modified)

---

### T17: Update SPEC.md with Evidence
**Goal:** Consolidate all verification evidence in spec.md

**Steps:**
1. Open specs/010-project-setup/spec.md
2. Add ## EVIDENCE section with:
   - Verification results for each acceptance criterion (AC-SETUP-1 through AC-SETUP-7)
   - Screenshots and outputs from manual verification tasks
   - Links to CI pipeline runs
   - Summary of what was tested and results
3. Include evidence from all tasks (T1-T15)

**Done when:**
- EVIDENCE section is complete with all verification results
- All acceptance criteria have corresponding evidence
- Evidence is well-organized and easy to review

**Verify:**
- Review EVIDENCE section for completeness
- Ensure all ACs are covered

**Evidence to record:**
- Completed EVIDENCE section in spec.md

**Files touched:**
- specs/010-project-setup/spec.md (modified)

---

### T18: Update SPEC.md Entrypoint
**Goal:** Update main SPEC.md to point to Epic 1.0

**Steps:**
1. Open SPEC.md in project root
2. Update "Current focus" section:
   - Roadmap anchor: 1.0
   - Spec folder: specs/010-project-setup/
   - Type: Feature
   - Priority: P0
   - Status: Done
   - Next command: /implement_from_spec specs/011-api-client/ (for Epic 1.1)
3. Update links to spec.md, plan.md, tasks.md

**Done when:**
- SPEC.md points to Epic 1.0 spec folder
- Status is marked as "Done"
- Links are correct

**Verify:**
- Run `cat SPEC.md` and verify all fields are updated
- Click links to verify they resolve correctly

**Evidence to record:**
- Updated SPEC.md content

**Files touched:**
- SPEC.md (modified)

