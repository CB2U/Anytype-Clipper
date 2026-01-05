
describe('Metadata Script', () => {
    let onMessageListener: Function;
    let mockExtract: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // Mock Chrome runtime
        chrome.runtime.onMessage.addListener = jest.fn();
        const listeners: Function[] = [];
        (chrome.runtime.onMessage.addListener as jest.Mock).mockImplementation((listener) => {
            listeners.push(listener);
        });

        // Mock MetadataExtractor
        mockExtract = jest.fn();
        const mockMetadataExtractor = {
            extract: mockExtract
        };

        // Mock the class constructor
        jest.doMock('../../../src/lib/extractors/metadata-extractor', () => ({
            MetadataExtractor: jest.fn().mockImplementation(() => mockMetadataExtractor)
        }));

        // Load content script
        jest.isolateModules(() => {
            require('../../../src/content/metadata-script');
        });

        // Capture listener
        onMessageListener = listeners.find(l => typeof l === 'function')!;
    });

    it('should register a message listener', () => {
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        expect(onMessageListener).toBeDefined();
    });

    it('should ignore unrelated messages', () => {
        const result = onMessageListener({ type: 'UNKNOWN' }, {}, jest.fn());
        expect(result).toBeUndefined();
    });

    it('should handle CMD_EXTRACT_METADATA success', async () => {
        const sendResponse = jest.fn();
        const mockMetadata = { title: 'Test', url: 'http://example.com' };

        mockExtract.mockResolvedValue(mockMetadata);

        const result = onMessageListener({ type: 'CMD_EXTRACT_METADATA' }, {}, sendResponse);
        expect(result).toBe(true);

        // Wait for async
        await new Promise(process.nextTick);
        await new Promise(process.nextTick);

        expect(mockExtract).toHaveBeenCalledWith(document, window.location.href);
        expect(sendResponse).toHaveBeenCalledWith({ success: true, data: mockMetadata });
    });

    it('should handle CMD_EXTRACT_METADATA failure', async () => {
        const sendResponse = jest.fn();
        const error = new Error('Extraction failed');

        mockExtract.mockRejectedValue(error);

        onMessageListener({ type: 'CMD_EXTRACT_METADATA' }, {}, sendResponse);

        await new Promise(process.nextTick);
        await new Promise(process.nextTick);

        expect(sendResponse).toHaveBeenCalledWith({
            success: false,
            error: expect.stringContaining('Error: Extraction failed')
        });
    });
});
