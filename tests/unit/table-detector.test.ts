
import { TableDetector } from '../../src/lib/extractors/table-detector';

describe('TableDetector', () => {
    it('should detect a single table in HTML', () => {
        const html = '<div><table><tr><td>A</td></tr></table></div>';
        const tables = TableDetector.detectTables(html);
        expect(tables).toHaveLength(1);
        expect(tables[0].tagName).toBe('TABLE');
    });

    it('should detect multiple tables in HTML', () => {
        const html = `
            <div>
                <table><tr><td>1</td></tr></table>
                <p>Text</p>
                <table><tr><td>2</td></tr></table>
            </div>
        `;
        const tables = TableDetector.detectTables(html);
        expect(tables).toHaveLength(2);
    });

    it('should handle HTML with no tables', () => {
        const html = '<div><p>No tables here</p></div>';
        const tables = TableDetector.detectTables(html);
        expect(tables).toHaveLength(0);
    });

    it('should handle empty input', () => {
        const tables = TableDetector.detectTables('');
        expect(tables).toHaveLength(0);
    });

    it('should ignore nested tables in initial detection', () => {
        const html = `
            <table>
                <tr>
                    <td>
                        <table><tr><td>Nested</td></tr></table>
                    </td>
                </tr>
            </table>
        `;
        const tables = TableDetector.detectTables(html);

        // Should only return the outer table
        expect(tables).toHaveLength(1);
        expect(tables[0].innerHTML).toContain('Nested');

        // Check filtering logic directly?
        // If we didn't filter, we'd get 2 tables.
    });

    it('should handle complex nested structures', () => {
        const html = `
            <table>
                <tr><td>Outer 1</td></tr>
            </table>
            <table>
                <tr>
                    <td>
                        <table><tr><td>Nested</td></tr></table>
                    </td>
                    <td>
                        <div>
                             <table><tr><td>Deep Nested</td></tr></table>
                        </div>
                    </td>
                </tr>
            </table>
        `;
        const tables = TableDetector.detectTables(html);

        // Expected: First table (Outer 1), Second table (with nested ones). Total 2.
        expect(tables).toHaveLength(2);

        // Verify contents
        expect(tables[0].textContent).toContain('Outer 1');
        expect(tables[1].textContent).toContain('Nested');
        expect(tables[1].textContent).toContain('Deep Nested');
    });
});
