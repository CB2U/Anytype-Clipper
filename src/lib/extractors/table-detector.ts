/**
 * Detects table elements within HTML content.
 */
export class TableDetector {
    /**
     * Detects all top-level `<table>` elements in the provided HTML string.
     * Nested tables are excluded from the result as they are handled within their parent tables.
     * 
     * @param html The HTML string to parse.
     * @returns An array of top-level HTMLTableElement objects.
     */
    static detectTables(html: string): HTMLTableElement[] {
        if (!html) return [];

        try {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const allTables = Array.from(doc.querySelectorAll('table'));

            // Filter out tables that are nested within other tables
            return allTables.filter(table => {
                let parent = table.parentElement;
                while (parent) {
                    if (parent.tagName === 'TABLE') {
                        return false; // It's a nested table
                    }
                    parent = parent.parentElement;
                }
                return true; // It's a top-level table
            });

        } catch (error) {
            console.error('Error detecting tables:', error);
            return [];
        }
    }
}
