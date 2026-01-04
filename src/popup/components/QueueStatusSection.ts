import { QueueItem, QueueStatus } from '../../types/queue';
import { QueueItemList } from './QueueItemList';

export interface QueueStatusSectionProps {
    items: QueueItem[];
    onRetry: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export class QueueStatusSection {
    private container: HTMLElement;
    private isExpanded: boolean = true;
    private props: QueueStatusSectionProps;
    private itemList: QueueItemList;

    constructor(container: HTMLElement, props: QueueStatusSectionProps) {
        this.container = container;
        this.props = props;
        this.itemList = new QueueItemList();

        // Check if we have a persisted expansion state
        const saved = localStorage.getItem('anytype_queue_expanded');
        if (saved !== null) {
            this.isExpanded = saved === 'true';
        }
    }

    public updateProps(newProps: QueueStatusSectionProps) {
        this.props = newProps;
        this.render();
    }

    private toggleExpanded() {
        this.isExpanded = !this.isExpanded;
        localStorage.setItem('anytype_queue_expanded', String(this.isExpanded));
        this.render();
    }

    public render() {
        if (this.props.items.length === 0) {
            this.container.innerHTML = '';
            this.container.classList.add('hidden');
            return;
        }

        this.container.classList.remove('hidden');
        this.container.className = 'queue-status-section';

        const pendingCount = this.props.items.filter(
            item => item.status === QueueStatus.Queued || item.status === QueueStatus.Sending
        ).length;

        this.container.innerHTML = `
      <div class="queue-header" id="queue-toggle">
        <div style="display: flex; align-items: center;">
          <h2>Queue Status</h2>
          ${pendingCount > 0 ? `<span class="pending-count">${pendingCount}</span>` : ''}
        </div>
        <svg class="chevron ${this.isExpanded ? 'expanded' : ''}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M6 9l6 6 6-6"></path>
        </svg>
      </div>
      <div class="queue-content ${this.isExpanded ? '' : 'hidden'}" id="queue-items-container">
      </div>
    `;

        const toggleBtn = this.container.querySelector('#queue-toggle');
        toggleBtn?.addEventListener('click', () => this.toggleExpanded());

        if (this.isExpanded) {
            const itemsContainer = this.container.querySelector('#queue-items-container') as HTMLElement;
            if (itemsContainer) {
                this.itemList.render(itemsContainer, {
                    items: this.props.items,
                    onRetry: this.props.onRetry,
                    onDelete: this.props.onDelete
                });
            }
        }
    }
}
