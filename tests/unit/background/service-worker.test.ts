
import { chrome } from 'jest-chrome';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

describe('Service Worker', () => {
    let messageListener: any;
    let installListener: any;

    beforeEach(() => {
        jest.resetModules();
        jest.clearAllMocks();

        // Mock chrome listeners
        const mockMessageListener = jest.fn((listener) => {
            messageListener = listener;
        });
        Object.defineProperty(chrome.runtime.onMessage, 'addListener', {
            value: mockMessageListener,
            writable: true
        });

        const mockInstallListener = jest.fn((listener) => {
            installListener = listener;
        });
        Object.defineProperty(chrome.runtime.onInstalled, 'addListener', {
            value: mockInstallListener,
            writable: true
        });
    });

    it('should initialize services and listeners on load', async () => {
        const mockQueueManager = {
            resetSendingToQueued: jest.fn().mockResolvedValue(0),
            get: jest.fn(),
            getAll: jest.fn().mockResolvedValue([]),
        };
        const mockBadgeManager = { init: jest.fn() };
        const mockRetryScheduler = { resumeRetries: jest.fn().mockResolvedValue(undefined) };
        const mockApiClient = { setApiKey: jest.fn() };

        jest.doMock('../../../src/lib/api/client', () => ({
            AnytypeApiClient: jest.fn().mockImplementation(() => mockApiClient)
        }));
        jest.doMock('../../../src/lib/capture/bookmark-capture-service', () => ({
            BookmarkCaptureService: { getInstance: jest.fn().mockReturnValue({}) }
        }));
        jest.doMock('../../../src/background/queue-manager', () => ({
            QueueManager: {
                getInstance: jest.fn().mockReturnValue(mockQueueManager),
                shouldQueue: jest.fn().mockReturnValue(false)
            }
        }));
        jest.doMock('../../../src/background/retry-scheduler', () => ({
            RetryScheduler: { getInstance: jest.fn().mockReturnValue(mockRetryScheduler) }
        }));
        jest.doMock('../../../src/background/badge-manager', () => ({
            BadgeManager: { getInstance: jest.fn().mockReturnValue(mockBadgeManager) }
        }));
        jest.doMock('../../../src/background/context-menu-handler', () => ({
            registerContextMenus: jest.fn(),
            handleContextMenuClick: jest.fn(),
        }));
        jest.doMock('../../../src/lib/services/deduplication-service', () => ({
            deduplicationService: { searchByUrl: jest.fn() }
        }));
        jest.doMock('../../../src/lib/services/append-service', () => ({
            AppendService: jest.fn()
        }));

        // Import Service Worker
        await import('../../../src/background/service-worker');

        // Wait for async initialization
        await sleep(20);

        expect(mockBadgeManager.init).toHaveBeenCalled();
        expect(mockQueueManager.resetSendingToQueued).toHaveBeenCalled();
    });

    it('should handle CMD_GET_SPACES', async () => {
        // Setup Mocks
        const mockGetSpaces = jest.fn().mockResolvedValue({ spaces: [{ id: 's1' }] });
        const mockApiClient = {
            getSpaces: mockGetSpaces,
            setApiKey: jest.fn()
        };

        jest.doMock('../../../src/lib/api/client', () => ({
            AnytypeApiClient: jest.fn().mockImplementation(() => mockApiClient)
        }));
        // Mock others to avoid crash
        jest.doMock('../../../src/background/queue-manager', () => ({
            QueueManager: {
                getInstance: jest.fn().mockReturnValue({
                    resetSendingToQueued: jest.fn().mockResolvedValue(0),
                    get: jest.fn(),
                    getAll: jest.fn().mockResolvedValue([]),
                }),
                shouldQueue: jest.fn().mockReturnValue(false)
            }
        }));
        jest.doMock('../../../src/background/badge-manager', () => ({
            BadgeManager: { getInstance: jest.fn().mockReturnValue({ init: jest.fn() }) }
        }));
        jest.doMock('../../../src/background/retry-scheduler', () => ({
            RetryScheduler: { getInstance: jest.fn().mockReturnValue({ resumeRetries: jest.fn() }) }
        }));
        jest.doMock('../../../src/lib/capture/bookmark-capture-service', () => ({
            BookmarkCaptureService: { getInstance: jest.fn().mockReturnValue({}) }
        }));
        jest.doMock('../../../src/background/context-menu-handler', () => ({
            registerContextMenus: jest.fn(), handleContextMenuClick: jest.fn()
        }));
        jest.doMock('../../../src/lib/services/deduplication-service', () => ({ deduplicationService: {} }));
        jest.doMock('../../../src/lib/services/append-service', () => ({ AppendService: jest.fn() }));

        await import('../../../src/background/service-worker');
        await sleep(20);

        const sendResponse = jest.fn();
        const message = { type: 'CMD_GET_SPACES' };

        await messageListener(message, {}, sendResponse);
        await sleep(10);

        expect(mockGetSpaces).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ success: true, data: [{ id: 's1' }] });
    });

    it('should handle CMD_CAPTURE_BOOKMARK', async () => {
        const mockCapture = jest.fn().mockResolvedValue({ success: true, queued: true, itemId: '123' });
        const mockRetrySchedule = jest.fn().mockResolvedValue(undefined);
        const mockQGet = jest.fn().mockResolvedValue({ id: '123' });

        jest.doMock('../../../src/lib/capture/bookmark-capture-service', () => ({
            BookmarkCaptureService: {
                getInstance: jest.fn().mockReturnValue({ captureBookmark: mockCapture })
            }
        }));
        jest.doMock('../../../src/background/queue-manager', () => ({
            QueueManager: {
                getInstance: jest.fn().mockReturnValue({
                    resetSendingToQueued: jest.fn().mockResolvedValue(0),
                    get: mockQGet,
                    getAll: jest.fn().mockResolvedValue([]),
                }),
                shouldQueue: jest.fn().mockReturnValue(false)
            }
        }));
        jest.doMock('../../../src/background/retry-scheduler', () => ({
            RetryScheduler: {
                getInstance: jest.fn().mockReturnValue({
                    resumeRetries: jest.fn(),
                    scheduleRetry: mockRetrySchedule
                })
            }
        }));

        // Mock others
        jest.doMock('../../../src/lib/api/client', () => ({
            AnytypeApiClient: jest.fn().mockImplementation(() => ({ setApiKey: jest.fn() }))
        }));
        jest.doMock('../../../src/background/badge-manager', () => ({
            BadgeManager: { getInstance: jest.fn().mockReturnValue({ init: jest.fn() }) }
        }));
        jest.doMock('../../../src/background/context-menu-handler', () => ({
            registerContextMenus: jest.fn(), handleContextMenuClick: jest.fn()
        }));
        jest.doMock('../../../src/lib/services/deduplication-service', () => ({ deduplicationService: {} }));
        jest.doMock('../../../src/lib/services/append-service', () => ({ AppendService: jest.fn() }));

        await import('../../../src/background/service-worker');
        await sleep(20);

        const payload = {
            spaceId: 's1',
            metadata: { url: 'http://example.com' },
            userNote: 'note',
            tags: [],
            type_key: 'bookmark',
            isHighlightCapture: false
        };
        const message = { type: 'CMD_CAPTURE_BOOKMARK', payload };
        const sendResponse = jest.fn();

        await messageListener(message, {}, sendResponse);
        await sleep(20);

        expect(mockCapture).toHaveBeenCalled();
        expect(sendResponse).toHaveBeenCalledWith({ success: true, data: expect.objectContaining({ queued: true }) });
        expect(mockQGet).toHaveBeenCalledWith('123');
        expect(mockRetrySchedule).toHaveBeenCalled();
    });
});
