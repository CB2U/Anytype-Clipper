/**
 * Unit tests for Error Sanitizer (T8)
 */
import { sanitizeError, containsSensitiveData, SanitizedError } from '../../../src/lib/utils/error-sanitizer';

describe('Error Sanitizer', () => {
    describe('detectErrorType (via sanitizeError)', () => {
        it('should detect auth errors', () => {
            const errors = [
                new Error('HTTP 401 Unauthorized'),
                new Error('Token expired'),
                new Error('API Key invalid')
            ];
            errors.forEach(err => {
                expect(sanitizeError(err).type).toBe('auth');
                expect(sanitizeError(err).message).toBe('Authentication required');
            });
        });

        it('should detect network errors', () => {
            const errors = [
                new Error('Fetch failed'),
                new Error('Network connection lost'),
                new Error('Timeout after 5000ms'),
                new Error('Anytype is not running')
            ];
            errors.forEach(err => {
                expect(sanitizeError(err).type).toBe('network');
                expect(sanitizeError(err).message).toBe('Anytype is not running');
            });
        });

        it('should detect validation errors', () => {
            const errors = [
                new Error('Validation failed for object'),
                new Error('Invalid URL format'),
                new Error('Missing required field')
            ];
            errors.forEach(err => {
                expect(sanitizeError(err).type).toBe('validation');
                expect(sanitizeError(err).message).toBe('Invalid input');
            });
        });

        it('should detect api errors', () => {
            const errors = [
                new Error('HTTP 500 Internal Server Error'),
                new Error('Bad Gateway 502'),
                new Error('API Error: unknown')
            ];
            errors.forEach(err => {
                expect(sanitizeError(err).type).toBe('api');
                expect(sanitizeError(err).message).toBe('Anytype API error');
            });
        });

        it('should default to unknown', () => {
            const err = new Error('Something weird happened');
            expect(sanitizeError(err).type).toBe('unknown');
            expect(sanitizeError(err).message).toBe('An unexpected error occurred');
        });
    });

    describe('containsSensitiveData', () => {
        it('should detect API keys', () => {
            expect(containsSensitiveData('X-Anytype-Api-Key: abc-123')).toBe(true);
            expect(containsSensitiveData('Token: secret-token')).toBe(true);
            expect(containsSensitiveData('Authorization: Bearer xyz')).toBe(true);
        });

        it('should detect file paths', () => {
            expect(containsSensitiveData('/Users/chris/documents')).toBe(true);
            expect(containsSensitiveData('C:\\Users\\admin\\file.txt')).toBe(true);
        });

        it('should not false positive on safe strings', () => {
            expect(containsSensitiveData('Hello world')).toBe(false);
            expect(containsSensitiveData('Error: Connection failed')).toBe(false);
        });
    });

    describe('sanitizeMessage (via name)', () => {
        it('should redact sensitive data in error name', () => {
            const err = new Error('foo');
            err.name = 'Error with Token: secret-123';

            const sanitized = sanitizeError(err);
            expect(sanitized.name).toContain('[REDACTED]');
            expect(sanitized.name).not.toContain('secret-123');
        });

        it('should truncate very long error names', () => {
            const longName = 'A'.repeat(300);
            const err = new Error('foo');
            err.name = longName;

            const sanitized = sanitizeError(err);
            expect(sanitized.name.length).toBeLessThan(205); // 200 + '...'
            expect(sanitized.name).toMatch(/\.\.\.$/);
        });

        it('should handle empty error name', () => {
            const err = new Error('foo');
            err.name = '';
            const sanitized = sanitizeError(err);
            expect(sanitized.name).toBe('Error');
        });
    });
});
