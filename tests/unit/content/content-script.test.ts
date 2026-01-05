
describe('Content Script', () => {
    let onMessageListener: Function;
    let mockGetExtensionSettings: jest.Mock;
    let mockExtractArticle: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // 1. Setup Mock Implementations
        mockGetExtensionSettings = jest.fn().mockResolvedValue({});
        const mockStorageManager = {
            getInstance: jest.fn().mockReturnValue({
                getExtensionSettings: mockGetExtensionSettings
            })
        };

        mockExtractArticle = jest.fn();

        // 2. Mock Chrome Runtime Listener
        chrome.runtime.onMessage.addListener = jest.fn();
        const listeners: Function[] = [];
        (chrome.runtime.onMessage.addListener as jest.Mock).mockImplementation((listener) => {
            listeners.push(listener);
        });

        // 3. Inject Mocks using doMock
        jest.doMock('../../../src/lib/extractors/article-extractor', () => ({
            extractArticle: mockExtractArticle
        }));

        jest.doMock('../../../src/lib/storage/storage-manager', () => ({
            StorageManager: mockStorageManager
        }));

        // 4. Load Content Script
        jest.isolateModules(() => {
            require('../../../src/content/content-script');
        });

        // 5. Capture Listener
        onMessageListener = listeners.find(l => typeof l === 'function')!;
    });

    it('should register a message listener', () => {
        expect(chrome.runtime.onMessage.addListener).toHaveBeenCalled();
        expect(onMessageListener).toBeDefined();
    });

    it('should ignore unrelated messages', () => {
        const result = onMessageListener({ type: 'UNKNOWN_CMD' }, {}, jest.fn());
        expect(result).toBeUndefined();
    });

    it('should handle CMD_EXTRACT_ARTICLE success', async () => {
        const sendResponse = jest.fn();
        const mockResult = { quality: 0.9, content: 'test' };

        mockExtractArticle.mockResolvedValue(mockResult);

        // Invoke listener
        const result = onMessageListener({ type: 'CMD_EXTRACT_ARTICLE' }, {}, sendResponse);
        expect(result).toBe(true);

        // Wait for async operations
        await new Promise(process.nextTick);
        await new Promise(process.nextTick);

        expect(mockExtractArticle).toHaveBeenCalledWith(document, { includeJSONForDataTables: false });
        expect(sendResponse).toHaveBeenCalledWith(mockResult);
    });

    it('should handle CMD_EXTRACT_ARTICLE with settings', async () => {
        mockGetExtensionSettings.mockResolvedValue({ includeJSONForDataTables: true });
        const sendResponse = jest.fn();
        mockExtractArticle.mockResolvedValue({});

        onMessageListener({ type: 'CMD_EXTRACT_ARTICLE' }, {}, sendResponse);

        await new Promise(process.nextTick);
        await new Promise(process.nextTick);

        expect(mockExtractArticle).toHaveBeenCalledWith(document, { includeJSONForDataTables: true });
    });

    it('should handle CMD_EXTRACT_ARTICLE failure', async () => {
        const sendResponse = jest.fn();
        const error = new Error('Extraction failed');

        mockExtractArticle.mockRejectedValue(error);

        onMessageListener({ type: 'CMD_EXTRACT_ARTICLE' }, {}, sendResponse);

        await new Promise(process.nextTick);
        await new Promise(process.nextTick);

        expect(sendResponse).toHaveBeenCalledWith({
            success: false,
            error: expect.stringContaining('Error: Extraction failed')
        });
    });
});
