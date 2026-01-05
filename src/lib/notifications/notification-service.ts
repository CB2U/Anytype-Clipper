/**
 * Notification Service
 * 
 * Centralized notification management with queue support and auto-dismiss timers.
 * Implements singleton pattern for global access.
 */

import type { Notification, NotificationEvent } from '../../types/notifications';

/**
 * Event listener callback type
 */
type EventListener = (event: NotificationEvent) => void;

/**
 * Notification Service - Singleton
 * 
 * Manages notification lifecycle including creation, display, dismissal, and queue management.
 */
class NotificationService {
    private static instance: NotificationService;
    private notifications: Map<string, Notification> = new Map();
    private listeners: EventListener[] = [];
    private timers: Map<string, NodeJS.Timeout> = new Map();
    private readonly MAX_VISIBLE = 3;

    private constructor() {
        // Private constructor for singleton
    }

    /**
     * Get singleton instance
     */
    public static getInstance(): NotificationService {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }

    /**
     * Create and display a notification
     * 
     * @param notification - Notification to create
     * @returns The notification ID
     * 
     * @example
     * ```typescript
     * const service = NotificationService.getInstance();
     * service.createNotification({
     *   id: crypto.randomUUID(),
     *   type: 'success',
     *   severity: 'low',
     *   title: 'Bookmark saved',
     *   autoDismiss: 5000,
     *   timestamp: Date.now(),
     * });
     * ```
     */
    public createNotification(notification: Notification): string {
        // Enforce max visible limit
        if (this.notifications.size >= this.MAX_VISIBLE) {
            // Remove oldest notification
            const oldestId = Array.from(this.notifications.keys())[0];
            this.dismissNotification(oldestId);
        }

        // Add notification
        this.notifications.set(notification.id, notification);

        // Emit create event
        this.emit({
            type: 'notification:create',
            payload: notification,
        });

        // Set up auto-dismiss timer if specified
        if (notification.autoDismiss && notification.autoDismiss > 0) {
            const timer = setTimeout(() => {
                this.dismissNotification(notification.id);
            }, notification.autoDismiss);
            this.timers.set(notification.id, timer);
        }

        return notification.id;
    }

    /**
     * Dismiss a notification
     * 
     * @param id - Notification ID to dismiss
     * 
     * @example
     * ```typescript
     * const service = NotificationService.getInstance();
     * service.dismissNotification('notification-id');
     * ```
     */
    public dismissNotification(id: string): void {
        // Clear timer if exists
        const timer = this.timers.get(id);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(id);
        }

        // Remove notification
        const existed = this.notifications.delete(id);

        // Emit dismiss event only if notification existed
        if (existed) {
            this.emit({
                type: 'notification:dismiss',
                payload: { id },
            });
        }
    }

    /**
     * Clear all notifications
     * 
     * @example
     * ```typescript
     * const service = NotificationService.getInstance();
     * service.clearAll();
     * ```
     */
    public clearAll(): void {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();

        // Get all IDs before clearing
        const ids = Array.from(this.notifications.keys());

        // Clear notifications
        this.notifications.clear();

        // Emit dismiss events for all
        for (const id of ids) {
            this.emit({
                type: 'notification:dismiss',
                payload: { id },
            });
        }
    }

    /**
     * Get all active notifications
     * 
     * @returns Array of active notifications
     */
    public getNotifications(): Notification[] {
        return Array.from(this.notifications.values());
    }

    /**
     * Get a specific notification by ID
     * 
     * @param id - Notification ID
     * @returns The notification or undefined if not found
     */
    public getNotification(id: string): Notification | undefined {
        return this.notifications.get(id);
    }

    /**
     * Get notification count
     * 
     * @returns Number of active notifications
     */
    public getCount(): number {
        return this.notifications.size;
    }

    /**
     * Subscribe to notification events
     * 
     * @param listener - Event listener callback
     * @returns Unsubscribe function
     * 
     * @example
     * ```typescript
     * const service = NotificationService.getInstance();
     * const unsubscribe = service.subscribe((event) => {
     *   if (event.type === 'notification:create') {
     *     console.log('New notification:', event.payload);
     *   }
     * });
     * 
     * // Later, unsubscribe
     * unsubscribe();
     * ```
     */
    public subscribe(listener: EventListener): () => void {
        this.listeners.push(listener);
        return () => {
            const index = this.listeners.indexOf(listener);
            if (index > -1) {
                this.listeners.splice(index, 1);
            }
        };
    }

    /**
     * Emit an event to all listeners
     * 
     * @param event - Event to emit
     */
    private emit(event: NotificationEvent): void {
        for (const listener of this.listeners) {
            try {
                listener(event);
            } catch (error) {
                console.error('Error in notification listener:', error);
            }
        }
    }

    /**
     * Trigger a notification action
     * 
     * @param id - Notification ID
     * @param action - Action identifier
     * 
     * @example
     * ```typescript
     * const service = NotificationService.getInstance();
     * service.triggerAction('notification-id', 'retry');
     * ```
     */
    public triggerAction(id: string, action: string): void {
        const notification = this.notifications.get(id);
        if (!notification) {
            return;
        }

        // Emit action event
        this.emit({
            type: 'notification:action',
            payload: { id, action },
        });
    }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();
export default notificationService;
