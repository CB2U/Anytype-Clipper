
import { extractContext } from '../../../src/content/utils';

describe('Content Utils', () => {
    describe('extractContext', () => {
        const fullText = 'The quick brown fox jumps over the lazy dog. It was a sunny day.';

        it('should extract context around selection', () => {
            const result = extractContext('jumps over', fullText, 10, 10);

            expect(result.quote).toBe('jumps over');
            expect(result.contextBefore).toBe('brown fox'); // "brown fox " trimmed?
            expect(result.contextAfter).toBe('the lazy'); // " the lazy " trimmed
        });

        it('should handle start of text', () => {
            const result = extractContext('The', fullText, 10, 10);
            expect(result.contextBefore).toBe('');
            expect(result.contextAfter).toBe('quick bro');
        });

        it('should handle end of text', () => {
            const result = extractContext('day.', fullText, 10, 10);
            expect(result.contextAfter).toBe('');
            expect(result.contextBefore).toBe('s a sunny');
        });

        it('should return empty context if not found', () => {
            const result = extractContext('missing', fullText);
            expect(result.contextBefore).toBe('');
            expect(result.contextAfter).toBe('');
        });

        it('should handle small text', () => {
            const text = 'Hi';
            const result = extractContext('Hi', text);
            expect(result.quote).toBe('Hi');
            expect(result.contextBefore).toBe('');
            expect(result.contextAfter).toBe('');
        });
    });
});
