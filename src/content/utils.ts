/**
 * Extracts context (50 chars before/after) for a given text selection within a container.
 */
export function extractContext(selectionText: string, fullText: string, beforeCount = 50, afterCount = 50) {
    const offset = fullText.indexOf(selectionText);

    let contextBefore = '';
    let contextAfter = '';

    if (offset !== -1) {
        contextBefore = fullText.substring(Math.max(0, offset - beforeCount), offset);
        contextAfter = fullText.substring(
            offset + selectionText.length,
            Math.min(fullText.length, offset + selectionText.length + afterCount)
        );
    }

    return {
        quote: selectionText,
        contextBefore: contextBefore.trim(),
        contextAfter: contextAfter.trim()
    };
}
