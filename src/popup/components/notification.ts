/**
 * Notification UI Component
 * 
 * Renders notifications with color-coded styling, icons, and accessibility features.
 */

import type { Notification } from '../../types/notifications';

/**
 * Notification icons (SVG paths)
 */
const ICONS = {
    success: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
    error: 'M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z',
    warning: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
    info: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
};

/**
 * Notification color classes
 */
const COLOR_CLASSES = {
    success: 'notification-success',
    error: 'notification-error',
    warning: 'notification-warning',
    info: 'notification-info',
};

/**
 * Create notification element
 * 
 * @param notification - Notification data
 * @param onDismiss - Dismiss callback
 * @param onAction - Action callback
 * @returns Notification DOM element
 */
export function createNotificationElement(
    notification: Notification,
    onDismiss: (id: string) => void,
    onAction: (id: string, action: string) => void
): HTMLElement {
    const container = document.createElement('div');
    container.className = `notification ${COLOR_CLASSES[notification.type]}`;
    container.setAttribute('role', 'alert');
    container.setAttribute('aria-live', notification.severity === 'high' ? 'assertive' : 'polite');
    container.setAttribute('aria-atomic', 'true');
    container.setAttribute('data-notification-id', notification.id);

    // Icon
    const icon = document.createElement('div');
    icon.className = 'notification-icon';
    icon.innerHTML = `
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="${ICONS[notification.type]}" />
    </svg>
  `;

    // Content
    const content = document.createElement('div');
    content.className = 'notification-content';

    const title = document.createElement('div');
    title.className = 'notification-title';
    title.textContent = notification.title;

    content.appendChild(title);

    if (notification.message) {
        const message = document.createElement('div');
        message.className = 'notification-message';
        message.textContent = notification.message;
        content.appendChild(message);
    }

    // Link
    if (notification.link) {
        const link = document.createElement('a');
        link.className = 'notification-link';
        link.href = notification.link.url;
        link.textContent = notification.link.label;
        if (notification.link.external) {
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
        }
        content.appendChild(link);
    }

    // Actions
    if (notification.actions && notification.actions.length > 0) {
        const actionsContainer = document.createElement('div');
        actionsContainer.className = 'notification-actions';

        for (const action of notification.actions) {
            const button = document.createElement('button');
            button.className = action.primary ? 'notification-action-primary' : 'notification-action';
            button.textContent = action.label;
            button.setAttribute('aria-label', `${action.label} for ${notification.title}`);
            button.addEventListener('click', (e) => {
                e.preventDefault();
                onAction(notification.id, action.action);
            });
            actionsContainer.appendChild(button);
        }

        content.appendChild(actionsContainer);
    }

    // Close button
    const closeButton = document.createElement('button');
    closeButton.className = 'notification-close';
    closeButton.setAttribute('aria-label', `Dismiss ${notification.title}`);
    closeButton.innerHTML = `
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M6 18L18 6M6 6l12 12" />
    </svg>
  `;
    closeButton.addEventListener('click', () => {
        onDismiss(notification.id);
    });

    // Assemble
    container.appendChild(icon);
    container.appendChild(content);
    container.appendChild(closeButton);

    // Keyboard navigation
    container.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            onDismiss(notification.id);
        }
    });

    return container;
}

/**
 * Notification Container Manager
 * 
 * Manages the notification container in the popup UI
 */
export class NotificationContainer {
    private container: HTMLElement;
    private position: 'top' | 'bottom';

    constructor(position: 'top' | 'bottom' = 'top') {
        this.position = position;
        this.container = this.createContainer();
    }

    /**
     * Create notification container element
     */
    private createContainer(): HTMLElement {
        const container = document.createElement('div');
        container.id = 'notification-container';
        container.className = `notification-container notification-container-${this.position}`;
        container.setAttribute('aria-label', 'Notifications');
        return container;
    }

    /**
     * Mount container to DOM
     * 
     * @param parent - Parent element (defaults to body)
     */
    public mount(parent?: HTMLElement): void {
        const target = parent || document.body;

        if (this.position === 'top') {
            target.insertBefore(this.container, target.firstChild);
        } else {
            target.appendChild(this.container);
        }
    }

    /**
     * Add notification to container
     * 
     * @param notification - Notification data
     * @param onDismiss - Dismiss callback
     * @param onAction - Action callback
     */
    public addNotification(
        notification: Notification,
        onDismiss: (id: string) => void,
        onAction: (id: string, action: string) => void
    ): void {
        const element = createNotificationElement(notification, onDismiss, onAction);

        // Add to container
        if (this.position === 'top') {
            this.container.appendChild(element);
        } else {
            this.container.insertBefore(element, this.container.firstChild);
        }

        // Trigger fade-in animation
        requestAnimationFrame(() => {
            element.classList.add('notification-visible');
        });
    }

    /**
     * Remove notification from container
     * 
     * @param id - Notification ID
     */
    public removeNotification(id: string): void {
        const element = this.container.querySelector(`[data-notification-id="${id}"]`);
        if (!element) return;

        // Fade out animation
        element.classList.add('notification-dismissing');

        // Remove after animation
        setTimeout(() => {
            element.remove();
        }, 300);
    }

    /**
     * Clear all notifications
     */
    public clearAll(): void {
        const notifications = this.container.querySelectorAll('.notification');
        notifications.forEach((notification) => {
            notification.classList.add('notification-dismissing');
        });

        setTimeout(() => {
            this.container.innerHTML = '';
        }, 300);
    }

    /**
     * Get container element
     */
    public getElement(): HTMLElement {
        return this.container;
    }

    /**
     * Update position
     * 
     * @param position - New position
     */
    public setPosition(position: 'top' | 'bottom'): void {
        this.position = position;
        this.container.className = `notification-container notification-container-${position}`;
    }
}
