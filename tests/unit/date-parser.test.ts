import { parseDate, isReasonableDate } from '../../src/lib/utils/date-parser';

describe('Date Parser', () => {
    describe('parseDate', () => {
        it('should parse ISO 8601 dates', () => {
            const iso = '2026-01-02T12:00:00Z';
            expect(parseDate(iso)).toBe('2026-01-02T12:00:00.000Z');
        });

        it('should parse simple date strings', () => {
            const date = '2026-01-02';
            expect(parseDate(date)).toBe('2026-01-02T00:00:00.000Z');
        });

        it('should parse RFC 2822 dates', () => {
            const rfc = 'Fri, 02 Jan 2026 12:00:00 GMT';
            expect(parseDate(rfc)).toBe('2026-01-02T12:00:00.000Z');
        });

        it('should handle missing or empty strings', () => {
            expect(parseDate('')).toBeNull();
            expect(parseDate(null)).toBeNull();
            expect(parseDate(undefined)).toBeNull();
        });

        it('should return null for invalid dates', () => {
            expect(parseDate('not-a-date')).toBeNull();
            expect(parseDate('2026-15-40')).toBeNull();
        });
    });

    describe('isReasonableDate', () => {
        it('should return true for valid recent dates', () => {
            const date = new Date().toISOString();
            expect(isReasonableDate(date)).toBe(true);
        });

        it('should return false for future dates', () => {
            const future = new Date();
            future.setFullYear(now().getFullYear() + 10);
            expect(isReasonableDate(future.toISOString())).toBe(false);
        });

        it('should return false for very old dates', () => {
            expect(isReasonableDate('1950-01-01T00:00:00Z')).toBe(false);
        });

        it('should return false for null', () => {
            expect(isReasonableDate(null)).toBe(false);
        });
    });
});

function now() {
    return new Date();
}
