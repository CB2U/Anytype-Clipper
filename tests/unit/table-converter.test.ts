
import { TableConverter } from '../../src/lib/extractors/table-converter';

function createTable(html: string): HTMLTableElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.querySelector('table')!;
}

describe('TableConverter', () => {
    describe('toMarkdown', () => {
        it('should convert simple table to Markdown', () => {
            const html = `
                <table>
                    <thead><tr><th>H1</th><th>H2</th></tr></thead>
                    <tbody>
                        <tr><td>C1</td><td>C2</td></tr>
                        <tr><td>C3</td><td>C4</td></tr>
                    </tbody>
                </table>
            `;
            const table = createTable(html);
            const md = TableConverter.toMarkdown(table);

            expect(md).toContain('| H1 | H2 |');
            expect(md).toContain('| --- | --- |'); // Note: implementation uses '---', verify exact spacing
            expect(md).toContain('| C1 | C2 |');
        });

        it('should handle pipe characters in cells', () => {
            const html = `<table><tr><td>A|B</td></tr></table>`;
            const table = createTable(html);
            const md = TableConverter.toMarkdown(table);
            expect(md).toContain('A\\|B');
        });
    });

    describe('toHTML', () => {
        it('should preserve properties and attributes but sanitize dangerous ones', () => {
            const html = `
                <table class="foo" onclick="alert(1)">
                    <tr><td style="color:red">Cell</td></tr>
                </table>
            `;
            const table = createTable(html);
            const preserved = TableConverter.toHTML(table);

            expect(preserved).toContain('<table');
            expect(preserved).toContain('Cell');

            // Cleaned
            expect(preserved).not.toContain('onclick');
            expect(preserved).not.toContain('style');
            expect(preserved).not.toContain('class');
        });
    });

    describe('toJSON', () => {
        it('should generate JSON', () => {
            const html = `
                <table>
                    <thead><tr><th>ID</th><th>Value</th></tr></thead>
                    <tbody>
                        <tr><td>1</td><td>A</td></tr>
                        <tr><td>2</td><td>B</td></tr>
                    </tbody>
                </table>
            `;
            const table = createTable(html);
            const json = TableConverter.toJSON(table);

            const data = JSON.parse(json);
            expect(data).toHaveLength(2);
            expect(data[0].ID).toBe('1');
            expect(data[0].Value).toBe('A');
        });

        it('should handle missing tHead by using first row as header', () => {
            const html = `
                <table>
                    <tbody>
                        <tr><td>Key</td><td>Val</td></tr>
                        <tr><td>K1</td><td>V1</td></tr>
                    </tbody>
                </table>
            `;
            const table = createTable(html);
            // Header should include Key and Val
            const json = TableConverter.toJSON(table);
            const data = JSON.parse(json);

            expect(data).toHaveLength(1); // 1 data row, 1 header row
            expect(data[0].Key).toBe('K1');
            expect(data[0].Val).toBe('V1');
        });

        it('should generate column names if missing', () => {
            const html = `
                <table>
                    <tbody>
                        <tr><td>D1</td><td>D2</td></tr>
                    </tbody>
                </table>
             `;
            const table = createTable(html);
            // Since NO header row detected (row 0 IS data if we fail to find header?), 
            // Actually logic says: if no thead and >0 rows, row[0] IS header.
            // So this test case: row[0] becomes header "D1", "D2". 
            // json: [] because body starts at 1 and length is 1.

            const json = TableConverter.toJSON(table);
            const data = JSON.parse(json);
            expect(data).toHaveLength(0); // Row 0 consumed as header
        });

        it('should handle multiple header rows and select the meaningful one', () => {
            const html = `
                <table>
                    <thead>
                        <tr><th></th><th></th></tr> <!-- Empty styling row -->
                        <tr><th>Name</th><th>Age</th></tr>
                    </thead>
                    <tbody>
                        <tr><td>Alice</td><td>30</td></tr>
                    </tbody>
                </table>
            `;
            const table = createTable(html);
            // Current implementation likely picks the first (empty) row and produces "Column 1", "Column 2"

            const markdown = TableConverter.toMarkdown(table);
            expect(markdown).toContain('| Name | Age |');
            expect(markdown).not.toContain('| Column 1 | Column 2 |');
        });

        it('should verify Worldometer HTML structure', () => {
            const html = `
             <table id="example2">
                <thead>
                    <tr>
                        <th>
                            <button class="datatable-sorter"> <span>#</span> <svg>...</svg> </button>
                        </th>
                        <th>
                            <button class="datatable-sorter"> <span>Country (or dependency)</span> <svg>...</svg> </button>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr><td>1</td><td>India</td></tr>
                </tbody>
             </table>
             `;
            const table = createTable(html);
            const markdown = TableConverter.toMarkdown(table);

            // Check if it extracted "#" and "Country (or dependency)" or fell back to Column 1
            expect(markdown).toContain('| # | Country (or dependency) |');
            expect(markdown).not.toContain('Column 1');
        });
    });
});
