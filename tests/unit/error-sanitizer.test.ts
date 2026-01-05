/**
 * Unit tests for Error Sanitizer
 */

import { sanitizeError, containsSensitiveData } from '../../src/lib/utils/error-sanitizer';

describe('ErrorSanitizer', () => {
    describe('sanitizeError', () => {
        it('should detect auth errors', () => {
            const error = new Error('401 Unauthorized');
            const result = sanitizeError(error);

            expect(result.type).toBe('auth');
            expect(result.message).toBe('Authentication required');
            expect(result.nextSteps).toContain('Re-authenticate');
        });

        it('should detect network errors', () => {
            const error = new Error('Anytype is not running');
            const result = sanitizeError(error);

            expect(result.type).toBe('network');
            expect(result.message).toBe('Anytype is not running');
            expect(result.nextSteps).toContain('Start Anytype Desktop');
        });

        it('should detect validation errors', () => {
            const error = new Error('Validation failed: title is required');
            const result = sanitizeError(error);

            expect(result.type).toBe('validation');
            expect(result.message).toBe('Invalid input');
            expect(result.nextSteps).toContain('check your input');
        });

        it('should detect API errors', () => {
            const error = new Error('API Error: 500 Internal Server Error');
            const result = sanitizeError(error);

            expect(result.type).toBe('api');
            expect(result.message).toBe('Anytype API error');
            expect(result.nextSteps).toContain('try again');
        });

        it('should handle unknown errors', () => {
            const error = new Error('Something weird happened');
            const result = sanitizeError(error);

            expect(result.type).toBe('unknown');
            expect(result.message).toBe('An unexpected error occurred');
            expect(result.nextSteps).toContain('try again');
        });

        it('should remove API keys from error messages', () => {
            const error = new Error('Failed with api_key=sk_test_123456');
            error.name = 'Error with api_key=sk_test_123456';

            const result = sanitizeError(error);

            expect(result.name).not.toContain('sk_test_123456');
            expect(result.name).toContain('[REDACTED]');
        });

        it('should remove tokens from error messages', () => {
            const error = new Error('Token: bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
            error.name = 'Error with bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';

            const result = sanitizeError(error);

            expect(result.name).not.toContain('eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9');
            expect(result.name).toContain('[REDACTED]');
        });

        it('should remove file paths from error messages', () => {
            const error = new Error('File not found');
            error.name = 'Error at /home/username/project/file.ts';

            const result = sanitizeError(error);

            expect(result.name).not.toContain('/home/username');
            expect(result.name).toContain('[REDACTED]');
        });

        it('should remove stack traces', () => {
            const error = new Error('Test error');
            error.stack = `Error: Test error
    at Object.<anonymous> (/path/to/file.ts:10:15)
    at Module._compile (node:internal/modules/cjs/loader:1254:14)`;
            error.name = error.stack;

            const result = sanitizeError(error);

            expect(result.name).not.toContain('at Object.<anonymous>');
            expect(result.name).not.toContain('/path/to/file.ts');
        });

        it('should limit message length', () => {
            const longMessage = 'A'.repeat(300);
            const error = new Error(longMessage);
            error.name = longMessage;

            const result = sanitizeError(error);

            expect(result.name.length).toBeLessThanOrEqual(203); // 200 + '...'
            expect(result.name).toContain('...');
        });
    });

    describe('containsSensitiveData', () => {
        it('should detect API keys', () => {
            expect(containsSensitiveData('api_key=sk_test_123')).toBe(true);
            expect(containsSensitiveData('api-key: abc123')).toBe(true);
            expect(containsSensitiveData('apikey=xyz')).toBe(true);
        });

        it('should detect tokens', () => {
            expect(containsSensitiveData('token=abc123')).toBe(true);
            expect(containsSensitiveData('bearer eyJhbGci')).toBe(true);
            expect(containsSensitiveData('authorization: Bearer xyz')).toBe(true);
        });

        it('should detect file paths', () => {
            expect(containsSensitiveData('C:\\Users\\john\\project')).toBe(true);
            expect(containsSensitiveData('/home/jane/project')).toBe(true);
            expect(containsSensitiveData('/Users/bob/project')).toBe(true);
        });

        it('should detect stack traces', () => {
            expect(containsSensitiveData('at Object.<anonymous> (file.ts:10:15)')).toBe(true);
            expect(containsSensitiveData('at Module._compile (loader.js:1254:14)')).toBe(true);
        });

        it('should detect URLs with query params', () => {
            expect(containsSensitiveData('https://example.com?token=abc')).toBe(true);
            expect(containsSensitiveData('http://api.com?key=123')).toBe(true);
        });

        it('should not flag safe messages', () => {
            expect(containsSensitiveData('Anytype is not running')).toBe(false);
            expect(containsSensitiveData('Network error occurred')).toBe(false);
            expect(containsSensitiveData('Invalid input')).toBe(false);
        });
    });
});
