import { QueueItem as IQueueItem } from '../../types/queue';
import { QueueItem } from './QueueItem';

export interface QueueItemListProps {
    items: IQueueItem[];
    onRetry: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export class QueueItemList {
    public render(container: HTMLElement, props: QueueItemListProps) {
        container.innerHTML = '';

        if (props.items.length === 0) {
            container.innerHTML = '<div class="empty-state">No pending captures</div>';
            return;
        }

        // Sort items by created timestamp, newest first
        const sortedItems = [...props.items].sort((a, b) => b.timestamps.created - a.timestamps.created);

        // To prevent performance issues, we could limit the number of items or use virtual scrolling
        // For now, we'll just render all but keep an eye on performance as per Risk 1.
        const displayItems = sortedItems;

        displayItems.forEach(item => {
            const queueItem = new QueueItem();
            queueItem.render(container, {
                item,
                onRetry: props.onRetry,
                onDelete: props.onDelete
            });
        });
    }
}
