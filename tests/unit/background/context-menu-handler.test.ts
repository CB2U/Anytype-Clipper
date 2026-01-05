
import { registerContextMenus, handleContextMenuClick, MENU_IDS } from '../../../src/background/context-menu-handler';

describe('ContextMenuHandler', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('registerContextMenus', () => {
        it('should remove existing menus and create 3 new ones', () => {
            (chrome.contextMenus.removeAll as jest.Mock).mockImplementation((cb) => cb());

            registerContextMenus();

            expect(chrome.contextMenus.removeAll).toHaveBeenCalled();
            expect(chrome.contextMenus.create).toHaveBeenCalledTimes(3);

            expect(chrome.contextMenus.create).toHaveBeenCalledWith(
                expect.objectContaining({ id: MENU_IDS.SEND_SELECTION }),
                expect.any(Function)
            );
            expect(chrome.contextMenus.create).toHaveBeenCalledWith(
                expect.objectContaining({ id: MENU_IDS.CLIP_ARTICLE }),
                expect.any(Function)
            );
            expect(chrome.contextMenus.create).toHaveBeenCalledWith(
                expect.objectContaining({ id: MENU_IDS.BOOKMARK_PAGE }),
                expect.any(Function)
            );
        });

        it('should log error if creation fails', () => {
            (chrome.contextMenus.removeAll as jest.Mock).mockImplementation((cb) => cb());

            // Mock create to call callback
            (chrome.contextMenus.create as jest.Mock).mockImplementation((_, cb) => {
                if (cb) cb();
                return 1;
            });

            // Mock runtime.lastError
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            Object.defineProperty(chrome.runtime, 'lastError', {
                get: () => ({ message: 'Mock Error' }),
                configurable: true
            });

            registerContextMenus();

            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();

            // Reset lastError
            Object.defineProperty(chrome.runtime, 'lastError', { value: undefined });
        });
    });

    describe('handleContextMenuClick', () => {
        const mockTab = { id: 123, url: 'http://example.com', title: 'Example' } as chrome.tabs.Tab;
        const mockInfo = { menuItemId: '', selectionText: 'Selected Text' } as chrome.contextMenus.OnClickData;

        it('should handle SEND_SELECTION', async () => {
            const info = { ...mockInfo, menuItemId: MENU_IDS.SEND_SELECTION };
            await handleContextMenuClick(info, mockTab);

            expect(chrome.tabs.sendMessage).toHaveBeenCalledWith(123, {
                command: 'CAPTURE_HIGHLIGHT',
                payload: {
                    quote: 'Selected Text',
                    pageUrl: 'http://example.com',
                    pageTitle: 'Example'
                }
            });
        });

        it('should error if SEND_SELECTION has no selection text', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const info = { ...mockInfo, menuItemId: MENU_IDS.SEND_SELECTION, selectionText: undefined };
            await handleContextMenuClick(info, mockTab);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No selection text'));
            expect(chrome.tabs.sendMessage).not.toHaveBeenCalled();
            consoleSpy.mockRestore();
        });

        it('should handle CLIP_ARTICLE by opening popup', async () => {
            const info = { ...mockInfo, menuItemId: MENU_IDS.CLIP_ARTICLE };
            await handleContextMenuClick(info, mockTab);

            expect(chrome.action.openPopup).toHaveBeenCalled();
        });

        it('should handle BOOKMARK_PAGE by opening popup', async () => {
            const info = { ...mockInfo, menuItemId: MENU_IDS.BOOKMARK_PAGE };
            await handleContextMenuClick(info, mockTab);

            expect(chrome.action.openPopup).toHaveBeenCalled();
        });

        it('should handle unknown menu item', async () => {
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });
            const info = { ...mockInfo, menuItemId: 'unknown-id' };
            await handleContextMenuClick(info, mockTab);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown menu item'));
            consoleSpy.mockRestore();
        });

        it('should ignore click if no tab', async () => {
            const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
            const info = { ...mockInfo, menuItemId: MENU_IDS.SEND_SELECTION };
            await handleContextMenuClick(info, undefined);

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No valid tab'));
            consoleSpy.mockRestore();
        });

        it('should show notification on unhandled error', async () => {
            const info = { ...mockInfo, menuItemId: MENU_IDS.SEND_SELECTION };
            (chrome.tabs.sendMessage as jest.Mock).mockRejectedValue(new Error('Send failed'));

            await handleContextMenuClick(info, mockTab);

            expect(chrome.notifications.create).toHaveBeenCalledWith(expect.objectContaining({
                type: 'basic',
                title: 'Anytype Clipper Error',
                message: expect.stringContaining('Send failed')
            }));
        });
    });
});
