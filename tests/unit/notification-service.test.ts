/**
 * Unit tests for NotificationService
 */

import notificationService from '../../src/lib/notifications/notification-service';
import type { Notification } from '../../src/types/notifications';

describe('NotificationService', () => {
    beforeEach(() => {
        // Clear all notifications before each test
        notificationService.clearAll();
    });

    describe('createNotification', () => {
        it('should create a notification', () => {
            const notification: Notification = {
                id: 'test-1',
                type: 'success',
                severity: 'low',
                title: 'Test notification',
                timestamp: Date.now(),
            };

            const id = notificationService.createNotification(notification);

            expect(id).toBe('test-1');
            expect(notificationService.getCount()).toBe(1);
            expect(notificationService.getNotification('test-1')).toEqual(notification);
        });

        it('should enforce max 3 visible notifications', () => {
            // Create 4 notifications
            for (let i = 1; i <= 4; i++) {
                notificationService.createNotification({
                    id: `test-${i}`,
                    type: 'info',
                    severity: 'low',
                    title: `Notification ${i}`,
                    timestamp: Date.now(),
                });
            }

            // Should only have 3 notifications (oldest removed)
            expect(notificationService.getCount()).toBe(3);
            expect(notificationService.getNotification('test-1')).toBeUndefined();
            expect(notificationService.getNotification('test-4')).toBeDefined();
        });

        it('should set up auto-dismiss timer for success notifications', (done) => {
            const notification: Notification = {
                id: 'test-auto',
                type: 'success',
                severity: 'low',
                title: 'Auto-dismiss test',
                autoDismiss: 100, // 100ms for testing
                timestamp: Date.now(),
            };

            notificationService.createNotification(notification);
            expect(notificationService.getCount()).toBe(1);

            // Wait for auto-dismiss
            setTimeout(() => {
                expect(notificationService.getCount()).toBe(0);
                done();
            }, 150);
        });

        it('should not auto-dismiss if autoDismiss is null', (done) => {
            const notification: Notification = {
                id: 'test-manual',
                type: 'error',
                severity: 'high',
                title: 'Manual dismiss test',
                autoDismiss: null,
                timestamp: Date.now(),
            };

            notificationService.createNotification(notification);
            expect(notificationService.getCount()).toBe(1);

            // Wait to ensure it doesn't auto-dismiss
            setTimeout(() => {
                expect(notificationService.getCount()).toBe(1);
                done();
            }, 150);
        });
    });

    describe('dismissNotification', () => {
        it('should dismiss a notification', () => {
            const notification: Notification = {
                id: 'test-dismiss',
                type: 'info',
                severity: 'low',
                title: 'Dismiss test',
                timestamp: Date.now(),
            };

            notificationService.createNotification(notification);
            expect(notificationService.getCount()).toBe(1);

            notificationService.dismissNotification('test-dismiss');
            expect(notificationService.getCount()).toBe(0);
        });

        it('should clear auto-dismiss timer when manually dismissed', (done) => {
            const notification: Notification = {
                id: 'test-timer',
                type: 'success',
                severity: 'low',
                title: 'Timer test',
                autoDismiss: 1000,
                timestamp: Date.now(),
            };

            notificationService.createNotification(notification);

            // Manually dismiss before auto-dismiss
            setTimeout(() => {
                notificationService.dismissNotification('test-timer');
                expect(notificationService.getCount()).toBe(0);
                done();
            }, 100);
        });

        it('should handle dismissing non-existent notification', () => {
            expect(() => {
                notificationService.dismissNotification('non-existent');
            }).not.toThrow();
        });
    });

    describe('clearAll', () => {
        it('should clear all notifications', () => {
            // Create multiple notifications
            for (let i = 1; i <= 3; i++) {
                notificationService.createNotification({
                    id: `test-${i}`,
                    type: 'info',
                    severity: 'low',
                    title: `Notification ${i}`,
                    timestamp: Date.now(),
                });
            }

            expect(notificationService.getCount()).toBe(3);

            notificationService.clearAll();
            expect(notificationService.getCount()).toBe(0);
        });

        it('should clear all timers', (done) => {
            // Create notification with auto-dismiss
            notificationService.createNotification({
                id: 'test-timer',
                type: 'success',
                severity: 'low',
                title: 'Timer test',
                autoDismiss: 1000,
                timestamp: Date.now(),
            });

            notificationService.clearAll();

            // Wait to ensure timer was cleared (notification shouldn't reappear)
            setTimeout(() => {
                expect(notificationService.getCount()).toBe(0);
                done();
            }, 1100);
        });
    });

    describe('getNotifications', () => {
        it('should return all active notifications', () => {
            const notifications: Notification[] = [
                {
                    id: 'test-1',
                    type: 'success',
                    severity: 'low',
                    title: 'Notification 1',
                    timestamp: Date.now(),
                },
                {
                    id: 'test-2',
                    type: 'error',
                    severity: 'high',
                    title: 'Notification 2',
                    timestamp: Date.now(),
                },
            ];

            notifications.forEach(n => notificationService.createNotification(n));

            const active = notificationService.getNotifications();
            expect(active).toHaveLength(2);
            expect(active).toEqual(expect.arrayContaining(notifications));
        });
    });

    describe('subscribe', () => {
        it('should emit create events', (done) => {
            const unsubscribe = notificationService.subscribe((event) => {
                if (event.type === 'notification:create') {
                    expect(event.payload.id).toBe('test-event');
                    unsubscribe();
                    done();
                }
            });

            notificationService.createNotification({
                id: 'test-event',
                type: 'info',
                severity: 'low',
                title: 'Event test',
                timestamp: Date.now(),
            });
        });

        it('should emit dismiss events', (done) => {
            const unsubscribe = notificationService.subscribe((event) => {
                if (event.type === 'notification:dismiss') {
                    expect(event.payload.id).toBe('test-dismiss-event');
                    unsubscribe();
                    done();
                }
            });

            notificationService.createNotification({
                id: 'test-dismiss-event',
                type: 'info',
                severity: 'low',
                title: 'Dismiss event test',
                timestamp: Date.now(),
            });

            notificationService.dismissNotification('test-dismiss-event');
        });

        it('should emit action events', (done) => {
            const unsubscribe = notificationService.subscribe((event) => {
                if (event.type === 'notification:action') {
                    expect(event.payload.id).toBe('test-action');
                    expect(event.payload.action).toBe('retry');
                    unsubscribe();
                    done();
                }
            });

            notificationService.createNotification({
                id: 'test-action',
                type: 'error',
                severity: 'high',
                title: 'Action test',
                timestamp: Date.now(),
            });

            notificationService.triggerAction('test-action', 'retry');
        });

        it('should allow unsubscribing', () => {
            let callCount = 0;
            const unsubscribe = notificationService.subscribe(() => {
                callCount++;
            });

            notificationService.createNotification({
                id: 'test-1',
                type: 'info',
                severity: 'low',
                title: 'Test 1',
                timestamp: Date.now(),
            });

            expect(callCount).toBe(1);

            unsubscribe();

            notificationService.createNotification({
                id: 'test-2',
                type: 'info',
                severity: 'low',
                title: 'Test 2',
                timestamp: Date.now(),
            });

            expect(callCount).toBe(1); // Should not increase after unsubscribe
        });
    });

    describe('triggerAction', () => {
        it('should handle action for non-existent notification', () => {
            expect(() => {
                notificationService.triggerAction('non-existent', 'retry');
            }).not.toThrow();
        });
    });
});
