/**
 * Global Jest Test Setup
 * 
 * Configures chrome API mocks and test utilities for all unit tests.
 */

// Mock chrome APIs using jest-chrome
import { chrome } from 'jest-chrome';

// In-memory storage for mock chrome.storage.local
const mockStorage: Record<string, unknown> = {};

// Mock chrome.storage.local
chrome.storage.local.get.mockImplementation((keys, callback) => {
    const result: Record<string, unknown> = {};

    if (keys === null || keys === undefined) {
        Object.assign(result, mockStorage);
    } else if (typeof keys === 'string') {
        if (keys in mockStorage) {
            result[keys] = mockStorage[keys];
        }
    } else if (Array.isArray(keys)) {
        for (const key of keys) {
            if (key in mockStorage) {
                result[key] = mockStorage[key];
            }
        }
    } else if (typeof keys === 'object') {
        for (const key of Object.keys(keys)) {
            result[key] = key in mockStorage ? mockStorage[key] : (keys as Record<string, unknown>)[key];
        }
    }

    if (callback) {
        callback(result);
    }
    return Promise.resolve(result);
});

chrome.storage.local.set.mockImplementation((items, callback) => {
    Object.assign(mockStorage, items);
    if (callback) {
        callback();
    }
    return Promise.resolve();
});

chrome.storage.local.remove.mockImplementation((keys, callback) => {
    const keysToRemove = Array.isArray(keys) ? keys : [keys];
    for (const key of keysToRemove) {
        delete mockStorage[key];
    }
    if (callback) {
        callback();
    }
    return Promise.resolve();
});

chrome.storage.local.clear.mockImplementation((callback) => {
    for (const key of Object.keys(mockStorage)) {
        delete mockStorage[key];
    }
    if (callback) {
        callback();
    }
    return Promise.resolve();
});

// Mock chrome.runtime
chrome.runtime.sendMessage.mockImplementation((_message, _callback) => {
    // Default mock - tests can override as needed
    return Promise.resolve({ success: true });
});

chrome.runtime.getURL.mockImplementation((path: string) => {
    return `chrome-extension://mock-extension-id/${path}`;
});

// Mock chrome.alarms
const mockAlarms: Map<string, chrome.alarms.Alarm> = new Map();

chrome.alarms.create.mockImplementation((name, alarmInfo) => {
    const alarm: chrome.alarms.Alarm = {
        name: name || '',
        scheduledTime: Date.now() + (alarmInfo.delayInMinutes || 0) * 60 * 1000,
        periodInMinutes: alarmInfo.periodInMinutes,
    };
    mockAlarms.set(name || '', alarm);
});

chrome.alarms.get.mockImplementation((name, callback) => {
    const alarm = mockAlarms.get(name ?? '');
    if (callback) {
        callback(alarm);
    }
    return Promise.resolve(alarm);
});

chrome.alarms.clear.mockImplementation((name, callback) => {
    const alarmName = name ?? '';
    const existed = mockAlarms.has(alarmName);
    mockAlarms.delete(alarmName);
    if (callback) {
        callback(existed);
    }
    return Promise.resolve(existed);
});

chrome.alarms.clearAll.mockImplementation((callback) => {
    const existed = mockAlarms.size > 0;
    mockAlarms.clear();
    if (callback) {
        callback(existed);
    }
    return Promise.resolve(existed);
});
// Mock chrome.action (for badge) - jest-chrome doesn't include MV3 action API
(chrome as unknown as Record<string, unknown>).action = {
    setBadgeText: jest.fn().mockImplementation(() => Promise.resolve()),
    setBadgeBackgroundColor: jest.fn().mockImplementation(() => Promise.resolve()),
    setIcon: jest.fn().mockImplementation(() => Promise.resolve()),
    setTitle: jest.fn().mockImplementation(() => Promise.resolve()),
    getBadgeText: jest.fn().mockImplementation(() => Promise.resolve('')),
    getBadgeBackgroundColor: jest.fn().mockImplementation(() => Promise.resolve([0, 0, 0, 0])),
};

// Mock chrome.tabs
chrome.tabs.query.mockImplementation(() => Promise.resolve([]));

// Mock chrome.contextMenus
chrome.contextMenus.create.mockImplementation(() => 1);
chrome.contextMenus.update.mockImplementation(() => Promise.resolve());
chrome.contextMenus.remove.mockImplementation(() => Promise.resolve());
chrome.contextMenus.removeAll.mockImplementation(() => Promise.resolve());

// Utility to reset mock storage between tests
export function resetMockStorage(): void {
    for (const key of Object.keys(mockStorage)) {
        delete mockStorage[key];
    }
}

// Utility to set mock storage data for tests
export function setMockStorage(data: Record<string, unknown>): void {
    Object.assign(mockStorage, data);
}

// Utility to get current mock storage state
export function getMockStorage(): Record<string, unknown> {
    return { ...mockStorage };
}

// Reset mocks before each test
beforeEach(() => {
    resetMockStorage();
    mockAlarms.clear();
    jest.clearAllMocks();
});

// Make chrome available globally
Object.assign(global, { chrome });
