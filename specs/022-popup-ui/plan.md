# Implementation Plan - Popup UI Polish

## Architecture
- **CSS Architecture:** Refactor `src/popup/popup.css` to use CSS Variables (Custom Properties) for:
    - Colors (`--bg-primary`, `--text-primary`, `--accent-color`)
    - Spacing (`--spacing-sm`, `--spacing-md`)
    - Borders (`--radius-md`)
- **HTML Structure:** Review `src/popup/popup.html` and add wrapper classes where necessary for flex/grid layouts.

## Proposed Changes

### [CSS] src/popup/popup.css
- [MODIFY] Define `:root` variables.
- [MODIFY] Reset styles (box-sizing, margins).
- [MODIFY] Style `.container` for better padding/width.
- [MODIFY] Style `input`, `textarea`, `select` with uniform design.
- [MODIFY] Style `.btn` classes (primary, secondary, danger).
- [MODIFY] Style `.status-message` animations.

### [HTML] src/popup/popup.html
- [MODIFY] Add semantic containers if missing (e.g., `.form-group`).
- [MODIFY] Ensure classes match new CSS structure.

## Verification Plan

### Automated
- `npm run build` to ensure no CSS syntax errors.

### Manual Verification
1. **Visual Check:**
    - Open Extension.
    - Verify fonts, colors, and keylines match "Modern" aesthetic.
    - Check Hover states on buttons.
    - Check Focus states on inputs.
2. **Flow Check:**
    - "Connect" screen looks good.
    - "Save Bookmark" screen looks good.
    - "Loading" screen looks good.
