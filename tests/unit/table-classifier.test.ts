
import { TableClassifier } from '../../src/lib/extractors/table-classifier';
import { TableType } from '../../src/types/table';

function createTable(html: string): HTMLTableElement {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    return doc.querySelector('table')!;
}

describe('TableClassifier', () => {
    it('should classify simple table (3 cols, 5 rows)', () => {
        const html = `
            <table>
                <tr><td>A</td><td>B</td><td>C</td></tr>
                <tr><td>A</td><td>B</td><td>C</td></tr>
                <tr><td>A</td><td>B</td><td>C</td></tr>
                <tr><td>A</td><td>B</td><td>C</td></tr>
                <tr><td>A</td><td>B</td><td>C</td></tr>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Simple);
    });

    it('should classify complex table (>6 cols)', () => {
        const html = `
            <table>
                <tr>
                    <td>1</td><td>2</td><td>3</td><td>4</td><td>5</td><td>6</td><td>7</td>
                </tr>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Complex);
        expect(result.reason).toContain('Too wide');
    });

    it('should classify complex table (merged cells)', () => {
        const html = `
            <table>
                <tr><td colspan="2">Merged</td></tr>
                <tr><td>1</td><td>2</td></tr>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Complex);
        expect(result.reason).toContain('merged cells');
    });

    it('should classify complex table (>= 20 rows)', () => {
        // Create 20 rows
        let rows = '';
        for (let i = 0; i < 20; i++) rows += '<tr><td>A</td></tr>';
        const html = `<table>${rows}</table>`;

        const table = createTable(html);
        const result = TableClassifier.classify(table);

        // Note: It might be classified as Data if data-like logic triggers? 
        // Text 'A' is not numeric. So expected Complex.
        expect(result.type).toBe(TableType.Complex);
        expect(result.reason).toContain('Too many rows');
    });

    it('should classify data table (uniform, numeric)', () => {
        const html = `
            <table>
                <thead><tr><th>ID</th><th>Val</th></tr></thead>
                <tbody>
                    <tr><td>1</td><td>100</td></tr>
                    <tr><td>2</td><td>200</td></tr>
                    <tr><td>3</td><td>300</td></tr>
                </tbody>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Data);
        expect(result.reason).toContain('Data table detected');
    });

    it('should classify nested tables as complex', () => {
        const html = `
            <table>
                <tr>
                    <td>
                        <table><tr><td>Nested</td></tr></table>
                    </td>
                </tr>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Complex);
        expect(result.reason).toContain('nested tables');
    });

    it('should classify data table with formatted numbers', () => {
        const html = `
            <table>
                <thead><tr><th>Item</th><th>Price</th><th>Qty</th></tr></thead>
                <tbody>
                    <tr><td>A</td><td>1,234.50</td><td>100</td></tr>
                    <tr><td>B</td><td>2,345.00</td><td>200</td></tr>
                    <tr><td>C</td><td>3,456.00</td><td>300</td></tr>
                </tbody>
            </table>
        `;
        const table = createTable(html);
        const result = TableClassifier.classify(table);
        expect(result.type).toBe(TableType.Data);
        expect(result.reason).toContain('Data table detected');
    });

    it('should measure performance', () => {
        const html = `<table><tr><td>1</td></tr></table>`;
        const table = createTable(html);

        const start = performance.now();
        TableClassifier.classify(table);
        const end = performance.now();

        expect(end - start).toBeLessThan(100); // 100ms budget
    });
});
