# Epic: Popup UI Polish (Epic 7.0)

**Priority:** P1 (User Requested)
**Type:** Feature / Polish
**Status:** Done
**Roadmap Anchor:** 7.0 (Popup UI)

## Problem
The current "Save Bookmark" popup uses basic browser-default styling (User Quote: "looks terrible"). It lacks consistent spacing, hierarchy, and a modern aesthetic. It does not match the premium feel expected of an Anytype companion.

## Goal
Revamp the Popup UI (`popup.html` and `popup.css`) to be modern, clean, and consistent. Implement a "Premium" feel using:
- Modern typography (Inter/system-ui).
- Consistent spacing and padding.
- Input fields with proper focus states and borders.
- Primary/Secondary button hierarchy.
- Dark mode optimized (since the base is currently dark).
- Glassmorphism/Translucency where appropriate.

## User Stories
1. **As a user**, I want a visually pleasing interface so that I enjoy using the extension.
2. **As a user**, I want clear visual hierarchy so I know what information is important (Title, Space).
3. **As a user**, I want interactive feedback (hover states, focus rings) so the app feels responsive.

## Functional Requirements
- **FR7.1:** The UI MUST use a cohesive color palette (Anytype-inspired: Dark Gray/Black backgrounds, Vivid Blue accents).
- **FR7.2:** Form inputs (Text, Select, Textarea) MUST have consistent styling (border, padding, border-radius).
- **FR7.3:** Buttons MUST have clear primary (Save) and secondary (Disconnect) styles.
- **FR7.4:** The layout MUST handle long content gracefully (ellipses for spaces, scroll for notes if needed).
- **FR7.5:** Loading states MUST be visually distinct (e.g., spinner or pulse).

## Non-Functional Requirements
- **NFR1.1:** Use Vanilla CSS (no frameworks like Tailwind unless requested - user specified "expert UI Designer" but did not request framework change).
- **NFR1.2:** CSS Variables MUST be used for colors and spacing to ensure consistency.

## Acceptance Criteria
- **AC-U1:** Global typography is set to a modern sans-serif stack.
- **AC-U2:** "Save to Space" dropdown looks custom/styled, not default OS select.
- **AC-U3:** "Save Bookmark" button spans full width or is prominent with hover effects.
- **AC-U4:** Input fields have subtle borders that highlight on focus.
- **AC-U5:** Spacing between elements is consistent (e.g., 12px or 16px grid).

## Risks
- **Risk:** Custom styling of `<select>` elements is difficult in pure CSS.
- **Mitigation:** Use a wrapper div strategy or accept minor OS-select limitations while styling the trigger box as much as possible.

## EVIDENCE
### Verified UI Polish
- **Visual Verification:**
  ![Final UI](/home/chris/.gemini/antigravity/brain/59ea45bb-b6d8-4b5b-a47f-5c86511a0330/uploaded_image_1767292947560.png)
- **Implementation:**
  - `popup.css`: Complete refactor using CSS variables for Dark Theme (`#191919`).
  - `popup.html`: Semantic restructuring for proper alignment.
- **Status:** Verified by User (2026-01-01).
