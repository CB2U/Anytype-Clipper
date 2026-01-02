

export class TableConverter {
    /**
     * Converts a simple table to Markdown format.
     */
    static toMarkdown(table: HTMLTableElement): string {
        const rows = Array.from(table.rows);
        if (rows.length === 0) return '';

        let markdown = '';
        const headers: string[] = [];

        // Header Logic: Use smart detection
        let headerRow = this.findBestHeaderRow(table);
        let bodyStartIndex = 0;

        // If we found a header row, determining body start index is tricky because
        // headerRow might be in tHead (not in table.rows sometimes?) or in table.rows.
        // But usually table.rows includes everything.
        // Let's rely on rows.indexOf().

        if (headerRow) {
            const index = rows.indexOf(headerRow);
            if (index !== -1) {
                bodyStartIndex = index + 1;
            } else {
                // headerRow is in tHead but NOT in rows array? 
                // (Rare, but if tHead is detached? Unlikely in standard DOM)
                // If so, we assume body starts at 0? 
                // Actually, if headerRow provided but not in rows, it implies 
                // we extracted it from tHead separately. 
                // We should proceed with bodyStartIndex = 0 if header isn't one of the data rows.
                // BUT, if we picked rows[0] as header, index IS 0, so start at 1. Correct.
            }
        } else {
            // No header found via smart detection?
            // Fallback to first row if it exists?
            if (rows.length > 0) {
                headerRow = rows[0];
                bodyStartIndex = 1;
            }
        }

        if (headerRow) {
            const cells = Array.from(headerRow.cells);
            headers.push(...cells.map((c, i) => {
                const text = this.cleanCell(c.textContent || '');
                return text || `Column ${i + 1}`;
            }));
        }

        // If we still have no headers (empty table?), return empty
        if (headers.length === 0) return '';

        // Construct header line
        markdown += '| ' + headers.join(' | ') + ' |\n';
        // Construct separator line
        markdown += '| ' + headers.map(() => '---').join(' | ') + ' |\n';

        // Process data rows
        for (let i = bodyStartIndex; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.cells);
            const rowContent = cells.map(c => this.cleanCell(c.textContent || ''));

            // Pad row if needed
            while (rowContent.length < headers.length) rowContent.push('');

            markdown += '| ' + rowContent.join(' | ') + ' |\n';
        }

        return markdown;
    }

    /**
     * Preserves table as sanitized HTML.
     */
    static toHTML(table: HTMLTableElement): string {
        const clone = table.cloneNode(true) as HTMLTableElement;
        this.sanitizeElement(clone);
        return clone.outerHTML;
    }

    /**
     * Converts table to JSON string.
     */
    static toJSON(table: HTMLTableElement): string {
        const rows = Array.from(table.rows);
        if (rows.length === 0) return '[]';

        const keys: string[] = [];
        let bodyStartIndex = 0;

        let headerRow = this.findBestHeaderRow(table);

        if (headerRow) {
            const index = rows.indexOf(headerRow);
            if (index !== -1) {
                bodyStartIndex = index + 1;
            }
        } else {
            if (rows.length > 0) {
                headerRow = rows[0];
                bodyStartIndex = 1;
            }
        }

        if (headerRow) {
            const cells = Array.from(headerRow.cells);
            keys.push(...cells.map((c, i) => {
                const text = (c.textContent || '').trim();
                return text || `Column ${i + 1}`;
            }));
        } else {
            // Fallback if truly no rows?
            if (rows.length > 0) {
                const maxCols = Math.max(...rows.map(r => r.cells.length));
                for (let i = 0; i < maxCols; i++) keys.push(`Column ${i + 1}`);
                // If we didn't pick rows[0] as header, treat it as data?
                // Wait, if no headerRow found, we shouldn't skip row 0.
                // But above we forced headerRow = rows[0] if !headerRow.
                // So we are covered.
            }
        }

        const data: any[] = [];
        for (let i = bodyStartIndex; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.cells);
            const rowObj: any = {};

            for (let k = 0; k < keys.length; k++) {
                const key = keys[k];
                const val = (cells[k]?.textContent || '').trim();
                rowObj[key] = val;
            }
            data.push(rowObj);
        }

        return JSON.stringify(data, null, 2);
    }

    /**
     * Smartly finds the best header row.
     * Priorities:
     * 1. Last row of <thead> that has non-empty text.
     * 2. Any row of <thead> that has non-empty text.
     * 3. First row of <tbody> if NO <thead> exists (handled by caller fallback usually, but here we focus on explicit structure).
     */
    private static findBestHeaderRow(table: HTMLTableElement): HTMLTableRowElement | undefined {
        // Check tHead
        if (table.tHead && table.tHead.rows.length > 0) {
            const rows = Array.from(table.tHead.rows);
            // Reverse iterate to find last row with text
            for (let i = rows.length - 1; i >= 0; i--) {
                const row = rows[i];
                if (this.hasHiddenText(row)) continue; // Skip hidden rows? (requires computed style, unreliable in Service Worker/JSDOM context usually)
                // Check for text content
                const hasText = Array.from(row.cells).some(c => this.cleanCell(c.textContent || '').length > 0);
                if (hasText) return row;
            }
            // If no rows have text, return the last one anyway (maybe icons?)
            return rows[rows.length - 1];
        }

        // If no tHead, do NOT proactively pick rows[0] here, allow caller to fallback.
        // Why? Because caller might want to generate "Column 1" if table has NO header.
        return undefined;
    }

    private static hasHiddenText(row: HTMLTableRowElement): boolean {
        // Rudimentary check for visibility attributes
        if (row.hasAttribute('hidden')) return true;
        const style = row.getAttribute('style');
        if (style && (style.includes('display: none') || style.includes('visibility: hidden'))) return true;
        return false;
    }

    private static cleanCell(content: string): string {
        // Strip newlines, normalize whitespace
        const text = content.replace(/[\r\n]+/g, ' ').trim();
        // Escape pipes
        return text.replace(/\|/g, '\\|');
    }

    private static sanitizeElement(el: Element) {
        const attrsToRemove = ['onclick', 'onload', 'onmouseover', 'style', 'class', 'id', 'width', 'height'];
        for (const attr of attrsToRemove) {
            el.removeAttribute(attr);
        }
        const scripts = el.querySelectorAll('script');
        scripts.forEach(s => s.remove());
        const styles = el.querySelectorAll('style');
        styles.forEach(s => s.remove());
        const allElements = el.querySelectorAll('*');
        allElements.forEach(child => {
            Array.from(child.attributes).forEach(attr => {
                if (attr.name.startsWith('on')) {
                    child.removeAttribute(attr.name);
                }
            });
            child.removeAttribute('style');
        });
    }


}
