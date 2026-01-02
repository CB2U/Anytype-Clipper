import {
    TableType,
    TableClassificationResult,
    TableMetadata
} from '../../types/table';

export class TableClassifier {
    static classify(table: HTMLTableElement): TableClassificationResult {
        const metadata = this.extractMetadata(table);
        const { rowCount, columnCount, hasMergedCells, hasNestedTables } = metadata;

        let type: TableType;
        let reason: string;
        let confidence = 1.0;

        // 1. Structural Complexity Check
        if (hasNestedTables) {
            type = TableType.Complex;
            reason = 'Contains nested tables';
        } else if (hasMergedCells) {
            type = TableType.Complex;
            reason = 'Contains merged cells';
        } else {
            // 2. Data Table Check
            // Heuristic: Uniform structure, >= 3 rows, check for numeric content
            const isDataCandidate = rowCount >= 3 && metadata.isUniformStructure;
            const numericRatio = this.calculateNumericRatio(table);

            if (isDataCandidate && numericRatio > 0.6) {
                type = TableType.Data;
                reason = `Data table detected (Numeric ratio: ${numericRatio.toFixed(2)})`;
            } else {
                // 3. Size Check (Simple vs Complex)
                const isLarge = rowCount >= 20;
                const isWide = columnCount > 6;

                if (isLarge || isWide) {
                    type = TableType.Complex;
                    reason = isLarge ? 'Too many rows for Markdown' : 'Too wide for Markdown';
                } else {
                    type = TableType.Simple;
                    reason = 'Simple structure fits Markdown';
                }
            }
        }

        return {
            type,
            confidence,
            metadata,
            reason
        };
    }

    private static extractMetadata(table: HTMLTableElement): TableMetadata {
        const rows = Array.from(table.rows);
        const rowCount = rows.length;

        let columnCount = 0;
        let hasHeader = false;
        let hasMergedCells = false;
        let isUniformStructure = true;
        const cellTypes: string[] = []; // Not strictly used for logic here but good for metadata

        // Check for nested tables using querySelector, excluding itself
        // Actually table.querySelector('table') is sufficient
        const hasNestedTables = !!table.querySelector('table');

        // Analyze rows for columns and merges
        if (rowCount > 0) {
            // Check first row for column count
            const firstRowCells = Array.from(rows[0].cells);
            columnCount = firstRowCells.length;

            // Check header
            const thead = table.tHead;
            hasHeader = !!thead || (firstRowCells.length > 0 && firstRowCells[0].tagName === 'TH');

            // Scan all rows
            for (const row of rows) {
                const cells = Array.from(row.cells);

                // Check uniform structure (ignoring merged cells logic for a moment, 
                // but if merged cells exist, uniformity is separate concern)
                if (cells.length !== columnCount) {
                    isUniformStructure = false;
                }

                for (const cell of cells) {
                    if (cell.rowSpan > 1 || cell.colSpan > 1) {
                        hasMergedCells = true;
                    }
                }
            }
        }

        return {
            rowCount,
            columnCount,
            hasHeader,
            hasMergedCells,
            hasNestedTables,
            isUniformStructure,
            cellTypes
        };
    }

    private static calculateNumericRatio(table: HTMLTableElement): number {
        const rows = Array.from(table.rows);
        let totalCells = 0;
        let numericCells = 0;

        // Skip header usually?
        // Let's analyze all cells, or skip first row if it looks like header
        let startIndex = 0;
        if (table.tHead || (rows.length > 0 && rows[0].cells[0]?.tagName === 'TH')) {
            startIndex = 1;
        }

        for (let i = startIndex; i < rows.length; i++) {
            const cells = Array.from(rows[i].cells);
            for (const cell of cells) {
                const text = cell.textContent?.trim() || '';
                if (text) {
                    totalCells++;
                    // Remove commas, spaces, %, and $ for numeric check
                    const cleanText = text.replace(/[,\s%$]/g, '');
                    // Check if numeric (ignoring empty strings after processing)
                    if (cleanText && !isNaN(Number(cleanText))) {
                        numericCells++;
                    }
                }
            }
        }

        return totalCells > 0 ? numericCells / totalCells : 0;
    }
}
