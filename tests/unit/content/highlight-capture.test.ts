
// Use doMock to handle immediate execution on import
describe('Highlight Capture Script', () => {
    let mockGetSelection: jest.Mock;
    let mockSelection: any;
    let mockRange: any;
    let sendMessageSpy: jest.Mock;

    beforeEach(() => {
        jest.clearAllMocks();
        jest.resetModules();

        // Mock Chrome runtime
        sendMessageSpy = jest.fn();
        global.chrome = {
            runtime: {
                sendMessage: sendMessageSpy
            }
        } as any;

        // Mock Window Selection
        mockRange = {
            commonAncestorContainer: {
                textContent: 'Full text content surrounding the quote'
            },
            startOffset: 0,
            endOffset: 0
        };

        mockSelection = {
            rangeCount: 1,
            toString: jest.fn().mockReturnValue('quote'),
            getRangeAt: jest.fn().mockReturnValue(mockRange)
        };

        mockGetSelection = jest.fn().mockReturnValue(mockSelection);

        // Define getSelection as a writable property before mocking
        Object.defineProperty(window, 'getSelection', {
            writable: true,
            value: mockGetSelection
        });

        // Mock extractContext utility
        jest.doMock('../../../src/content/utils', () => ({
            extractContext: jest.fn().mockReturnValue({
                contextBefore: 'Full text content surrounding the ',
                contextAfter: ''
            })
        }));
    });

    it('should capture highlight and send message', () => {
        // Load the script
        jest.isolateModules(() => {
            require('../../../src/content/highlight-capture');
        });

        expect(sendMessageSpy).toHaveBeenCalledWith({
            type: 'CAPTURE_HIGHLIGHT',
            data: expect.objectContaining({
                contextBefore: 'Full text content surrounding the ',
                pageTitle: '', // JSDOM default
                url: 'http://localhost/', // JSDOM default
            })
        });
    });

    it('should do nothing if no selection', () => {
        mockGetSelection.mockReturnValue(null);

        jest.isolateModules(() => {
            require('../../../src/content/highlight-capture');
        });

        expect(sendMessageSpy).not.toHaveBeenCalled();
    });

    it('should do nothing if selection empty', () => {
        mockSelection.toString.mockReturnValue('');

        jest.isolateModules(() => {
            require('../../../src/content/highlight-capture');
        });

        expect(sendMessageSpy).not.toHaveBeenCalled();
    });
});
