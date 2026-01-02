# Manual Verification for Table Options

## Pre-requisites
- Load the extension unpacked from `dist/`.
- Ensure you have the `worldometers-debug.html` or visit [Worldometers Population](https://www.worldometers.info/world-population/population-by-country/).

## Test Cases

### 1. Default Behavior (Markdown Only)
1. Open Extension Options.
2. Ensure "Data Table Output Format" is set to **Markdown (Default)** (or select it).
3. Save "Worldometers Population" page.
4. Verify in Anytype:
   - Note contains a visible Markdown table.
   - Note DOES NOT contain a JSON code block.

### 2. JSON Only
1. Open Extension Options.
2. Select **JSON (Raw Data)**.
3. Save click "Save Settings" (if button exists, currently auto-save or verify manually).
4. Save "Worldometers Population" page.
5. Verify in Anytype:
   - Note contains a `json` code block with table data.
   - Note DOES NOT contain the Markdown table (except potential simple tables if misclassified, but Worldometers is Data).

### 3. Both (JSON + Markdown)
1. Open Extension Options.
2. Select **Both (JSON + Markdown)**.
3. Save "Worldometers Population" page.
4. Verify in Anytype:
   - Note contains BOTH the `json` code block AND the Markdown table below it.

### 4. Blank Header Regression Check
- While verifying Markdown table (in Case 1 or 3), checking if headers are present: `#`, `Country`, etc.
- If blank, note the failure.
