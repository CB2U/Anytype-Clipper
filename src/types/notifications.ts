/**
 * Notification System Types
 * 
 * Defines TypeScript interfaces for the notification system including
 * notification objects, events, and related types.
 */

/**
 * Type of notification to display
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Severity level of the notification
 */
export type NotificationSeverity = 'low' | 'medium' | 'high';

/**
 * Action button in a notification
 */
export interface NotificationAction {
    /** Button text */
    label: string;
    /** Action identifier for handling */
    action: string;
    /** Whether this is the primary action button */
    primary?: boolean;
}

/**
 * Link in a notification (deep link or instruction)
 */
export interface NotificationLink {
    /** URL or instruction text */
    url: string;
    /** Link text to display */
    label: string;
    /** Whether to open in new tab (for external links) */
    external?: boolean;
}

/**
 * Core notification object
 */
export interface Notification {
    /** Unique notification ID (UUID) */
    id: string;
    /** Type of notification */
    type: NotificationType;
    /** Severity level */
    severity: NotificationSeverity;
    /** Main message/title */
    title: string;
    /** Optional detailed message */
    message?: string;
    /** Optional action buttons */
    actions?: NotificationAction[];
    /** Optional link */
    link?: NotificationLink;
    /** Auto-dismiss delay in milliseconds (default 5000 for success, null for manual) */
    autoDismiss?: number | null;
    /** Creation timestamp */
    timestamp: number;
    /** Additional metadata */
    metadata?: Record<string, unknown>;
}

/**
 * Event emitted when creating a notification
 */
export interface NotificationCreateEvent {
    type: 'notification:create';
    payload: Notification;
}

/**
 * Event emitted when dismissing a notification
 */
export interface NotificationDismissEvent {
    type: 'notification:dismiss';
    payload: { id: string };
}

/**
 * Event emitted when a notification action is clicked
 */
export interface NotificationActionEvent {
    type: 'notification:action';
    payload: { id: string; action: string };
}

/**
 * Union type of all notification events
 */
export type NotificationEvent =
    | NotificationCreateEvent
    | NotificationDismissEvent
    | NotificationActionEvent;

/**
 * Notification position in popup UI
 */
export type NotificationPosition = 'top' | 'bottom';
