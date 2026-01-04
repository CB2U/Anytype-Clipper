import { QueueStatusSection } from '../../src/popup/components/QueueStatusSection';
import { QueueStatus, QueueItem } from '../../src/types/queue';

// Mock chrome API
const mockSendMessage = jest.fn();
(global as any).chrome = {
    runtime: {
        sendMessage: mockSendMessage,
    },
    storage: {
        onChanged: {
            addListener: jest.fn(),
        },
        local: {
            get: jest.fn(),
            set: jest.fn(),
        }
    }
};

// Mock localStorage
const localStorageMock = (function () {
    let store: any = {};
    return {
        getItem: function (key: string) { return store[key] || null; },
        setItem: function (key: string, value: string) { store[key] = value.toString(); },
        clear: function () { store = {}; }
    };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

describe('QueueStatusSection', () => {
    let container: HTMLElement;
    const mockItems: QueueItem[] = [
        {
            id: '1',
            type: 'bookmark',
            status: QueueStatus.Queued,
            payload: { title: 'Test Bookmark' } as any,
            timestamps: { created: Date.now() },
            retryCount: 0
        },
        {
            id: '2',
            type: 'article',
            status: QueueStatus.Failed,
            payload: { title: 'Test Article' } as any,
            timestamps: { created: Date.now() - 1000 },
            retryCount: 3,
            error: 'API Error'
        }
    ];

    beforeEach(() => {
        container = document.createElement('div');
        document.body.appendChild(container);
        mockSendMessage.mockClear();
        localStorageMock.clear();
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    it('should render items when queue is not empty', () => {
        const onRetry = jest.fn();
        const onDelete = jest.fn();
        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry,
            onDelete
        });
        section.render();

        expect(container.classList.contains('hidden')).toBe(false);
        expect(container.querySelector('h2')?.textContent).toContain('Queue Status');
        expect(container.querySelector('.pending-count')?.textContent).toBe('1'); // Only 1 is Queued/Sending
    });

    it('should be hidden when queue is empty', () => {
        const section = new QueueStatusSection(container, {
            items: [],
            onRetry: jest.fn(),
            onDelete: jest.fn()
        });
        section.render();

        expect(container.classList.contains('hidden')).toBe(true);
        expect(container.innerHTML).toBe('');
    });

    it('should toggle expanded state', () => {
        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry: jest.fn(),
            onDelete: jest.fn()
        });
        section.render();

        const toggle = container.querySelector('#queue-toggle');
        expect(container.querySelector('.queue-content')?.classList.contains('hidden')).toBe(false);

        toggle?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
        expect(container.querySelector('.queue-content')?.classList.contains('hidden')).toBe(true);
        expect(localStorage.getItem('anytype_queue_expanded')).toBe('false');
    });

    it('should render correct number of items in the list', () => {
        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry: jest.fn(),
            onDelete: jest.fn()
        });
        section.render();

        const itemElements = container.querySelectorAll('.queue-item');
        expect(itemElements.length).toBe(2);
        expect(itemElements[0].querySelector('.item-title')?.textContent).toContain('Test Bookmark');
        expect(itemElements[1].querySelector('.item-title')?.textContent).toContain('Test Article');
    });

    it('should show retry and delete buttons only for failed items', () => {
        const section = new QueueStatusSection(container, {
            items: mockItems,
            onRetry: jest.fn(),
            onDelete: jest.fn()
        });
        section.render();

        const items = container.querySelectorAll('.queue-item');

        // Item 1 (Queued) - No actions
        expect(items[0].querySelector('.retry-btn')).toBeNull();
        expect(items[0].querySelector('.delete-btn')).toBeNull();

        // Item 2 (Failed) - Retry and Delete
        expect(items[1].querySelector('.retry-btn')).not.toBeNull();
        expect(items[1].querySelector('.delete-btn')).not.toBeNull();
    });
});
