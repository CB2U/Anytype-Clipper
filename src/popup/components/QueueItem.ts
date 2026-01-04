import { QueueItem as IQueueItem, QueueStatus } from '../../types/queue';
import { formatRelativeTime } from '../../lib/utils/timestamp-formatter';

export interface QueueItemProps {
    item: IQueueItem;
    onRetry: (id: string) => Promise<void>;
    onDelete: (id: string) => Promise<void>;
}

export class QueueItem {
    private isProcessing: boolean = false;

    public render(container: HTMLElement, props: QueueItemProps) {
        const { item, onRetry, onDelete } = props;

        const itemEl = document.createElement('div');
        itemEl.className = 'queue-item';
        itemEl.dataset.id = item.id;

        const title = item.type === 'highlight'
            ? (item.payload as any).pageTitle
            : (item.payload as any).title;

        const statusLabel = this.getStatusLabel(item.status);
        const statusClass = `badge-${item.status}`;
        const showRetry = item.status === QueueStatus.Failed;
        const showDelete = item.status === QueueStatus.Failed || item.status === QueueStatus.Sent;
        const timeStr = formatRelativeTime(item.timestamps.created);

        let retryInfo = '';
        if (item.retryCount > 0) {
            retryInfo = `<span style="margin-left: 8px;">• Retry ${item.retryCount}</span>`;
        }

        itemEl.innerHTML = `
      <div class="item-main">
        <div class="item-info">
          <div class="item-title" title="${this.escapeHtml(title || 'Untitled')}">
            ${this.escapeHtml(title || 'Untitled')}
          </div>
          <div class="item-meta">
            <span class="status-badge ${statusClass}">
              ${item.status === QueueStatus.Sending ? '<span class="spinner-tiny"></span>' : ''}
              ${statusLabel}
            </span>
            <span>${timeStr}</span>
            ${retryInfo}
          </div>
        </div>
        <div class="item-type-icon" title="${item.type}">
          ${this.getTypeIcon(item.type)}
        </div>
      </div>
      ${item.error && item.status === QueueStatus.Failed ? `<div class="error-text">${this.escapeHtml(item.error)}</div>` : ''}
      ${(showRetry || showDelete) ? `
        <div class="item-actions">
          ${showRetry ? `
            <button class="btn-icon-text retry-btn" ${this.isProcessing ? 'disabled' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <path d="M23 4v6h-6"></path>
                <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
              </svg>
              Retry
            </button>
          ` : ''}
          ${showDelete ? `
            <button class="btn-icon-text danger delete-btn" ${this.isProcessing ? 'disabled' : ''}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="3 6 5 6 21 6"></polyline>
                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
              </svg>
              Delete
            </button>
          ` : ''}
        </div>
      ` : ''}
    `;

        if (showRetry) {
            const retryBtn = itemEl.querySelector('.retry-btn');
            retryBtn?.addEventListener('click', async (e) => {
                e.stopPropagation();
                this.isProcessing = true;
                this.updateButtons(itemEl);
                try {
                    await onRetry(item.id);
                } finally {
                    this.isProcessing = false;
                }
            });
        }

        if (showDelete) {
            const deleteBtn = itemEl.querySelector('.delete-btn');
            deleteBtn?.addEventListener('click', async (e) => {
                e.stopPropagation();
                if (confirm('Are you sure you want to remove this item from the queue?')) {
                    this.isProcessing = true;
                    this.updateButtons(itemEl);
                    try {
                        await onDelete(item.id);
                    } finally {
                        this.isProcessing = false;
                    }
                }
            });
        }

        container.appendChild(itemEl);
    }

    private updateButtons(element: HTMLElement) {
        const buttons = element.querySelectorAll('button');
        buttons.forEach(btn => {
            btn.disabled = this.isProcessing;
        });
    }

    private getStatusLabel(status: QueueStatus): string {
        switch (status) {
            case QueueStatus.Queued: return 'Queued';
            case QueueStatus.Sending: return 'Sending';
            case QueueStatus.Sent: return 'Sent';
            case QueueStatus.Failed: return 'Failed';
            default: return status;
        }
    }

    private getTypeIcon(type: string): string {
        switch (type) {
            case 'bookmark': return '🔖';
            case 'highlight': return '🖋️';
            case 'article': return '📄';
            default: return '📦';
        }
    }

    private escapeHtml(str: string): string {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }
}
