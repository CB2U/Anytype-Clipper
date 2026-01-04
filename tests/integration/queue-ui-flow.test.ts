import { QueueStatusSection } from '../../src/popup/components/QueueStatusSection';
import { QueueStatus, QueueItem } from '../../src/types/queue';

// This integration test focuses on the coordination between components 
// and the simulated background message flow.

describe('Queue UI Integration Flow', () => {
    let container: HTMLElement;
    let mockSendMessage: jest.Mock;

    const mockItems: QueueItem[] = [
        {
            id: 'item-1',
            type: 'bookmark',
            status: QueueStatus.Failed,
            payload: { title: 'Failed Item' } as any,
            timestamps: { created: Date.now() },
            retryCount: 1,
            error: 'Network Error'
        }
    ];

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockSendMessage = jest.fn();
        (global as any).chrome = {
            runtime: {
                sendMessage: mockSendMessage,
            }
        };
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should call CMD_RETRY_QUEUE_ITEM when retry button is clicked', async () => {
        const handleRetry = async (id: string) => {
            await chrome.runtime.sendMessage({
                type: 'CMD_RETRY_QUEUE_ITEM',
                payload: { id }
            });
        };

        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry: handleRetry,
            onDelete: jest.fn()
        });
        section.render();

        const retryBtn = container.querySelector('.retry-btn') as HTMLButtonElement;
        expect(retryBtn).not.toBeNull();

        await retryBtn.click();

        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'CMD_RETRY_QUEUE_ITEM',
            payload: { id: 'item-1' }
        });
    });

    it('should call CMD_DELETE_QUEUE_ITEM when delete button is clicked and confirmed', async () => {
        const handleDelete = async (id: string) => {
            await chrome.runtime.sendMessage({
                type: 'CMD_DELETE_QUEUE_ITEM',
                payload: { id }
            });
        };

        // Mock confirm
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);

        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry: jest.fn(),
            onDelete: handleDelete
        });
        section.render();

        const deleteBtn = container.querySelector('.delete-btn') as HTMLButtonElement;
        expect(deleteBtn).not.toBeNull();

        await deleteBtn.click();

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockSendMessage).toHaveBeenCalledWith({
            type: 'CMD_DELETE_QUEUE_ITEM',
            payload: { id: 'item-1' }
        });

        confirmSpy.mockRestore();
    });
});
