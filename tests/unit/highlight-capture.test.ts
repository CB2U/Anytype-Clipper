import { extractContext } from '../../src/content/utils';

describe('extractContext', () => {
    const fullText = "This is a long sentence used for testing the context extraction logic of our clipper extension.";

    test('extracts context from middle of text', () => {
        const quote = "testing the context";
        const result = extractContext(quote, fullText, 10, 10);

        expect(result.quote).toBe(quote);
        expect(result.contextBefore).toBe("used for");
        expect(result.contextAfter).toBe("extractio");
    });

    test('handles selection at start of text', () => {
        const quote = "This is a";
        const result = extractContext(quote, fullText, 10, 10);

        expect(result.contextBefore).toBe("");
        expect(result.contextAfter).toBe("long sent");
    });

    test('handles selection at end of text', () => {
        const quote = "extension.";
        const result = extractContext(quote, fullText, 10, 10);

        expect(result.contextBefore).toBe("r clipper");
        expect(result.contextAfter).toBe("");
    });

    test('handles short text with full context', () => {
        const quote = "long";
        const result = extractContext(quote, fullText, 5, 5);
        expect(result.contextBefore).toBe("is a");
        expect(result.contextAfter).toBe("sent"); // " sent" trimmed
    });

    test('returns empty context if quote not found', () => {
        const result = extractContext("not found", fullText);
        expect(result.contextBefore).toBe("");
        expect(result.contextAfter).toBe("");
    });
});
