
// Simple Mock for Verification without Jest
import { ExtensionMessage, MessageResponse } from '../types/messages';
import { AnytypeApiClient } from '../lib/api/client';

// 1. Mock API Client 
const mockGetSpaces = async () => ({ spaces: [{ id: 'space-1', name: 'Mock Space' }] });
const mockCreateObject = async (spaceId: string, params: any) => ({ id: 'new-obj', typeId: 'Bookmark', ...params });

// Monkey patch the class prototype - quick and dirty for verification script
(AnytypeApiClient.prototype as any).getSpaces = mockGetSpaces;
(AnytypeApiClient.prototype as any).createObject = mockCreateObject;


// 2. Mock Chrome Runtime
let registeredListener: ((msg: any, sender: any, sendResponse: any) => boolean) | null = null;
(globalThis as any).chrome = {
    runtime: {
        onMessage: {
            addListener: (fn: any) => {
                registeredListener = fn;
            }
        },
        onInstalled: { addListener: () => { } }
    },
    storage: { local: { get: () => ({}), set: () => { } } }
};

// 3. Import System Under Test
// We intentionally import the service worker to trigger listener registration
// Using dynamic import to ensure mocks are applied first
async function loadServiceWorker() {
    await import('./service-worker');
}

// 4. Test Runner
async function runTest() {
    console.log('🧪 Starting Service Worker Verification...');

    // Load SW after mocks
    await loadServiceWorker();

    if (!registeredListener) {
        console.error('❌ No listener registered!');
        return;
    }

    // Test A: Get Spaces
    console.log('Test A: CMD_GET_SPACES');
    await new Promise<void>(resolve => {
        registeredListener!(
            { type: 'CMD_GET_SPACES' },
            {},
            (response: MessageResponse) => {
                if (response.success && (response.data as any)[0].name === 'Mock Space') {
                    console.log('   ✅ Success');
                } else {
                    console.error('   ❌ Failed', response);
                }
                resolve();
            }
        );
    });

    // Test B: Capture Bookmark
    console.log('Test B: CMD_CAPTURE_BOOKMARK');
    await new Promise<void>(resolve => {
        registeredListener!(
            {
                type: 'CMD_CAPTURE_BOOKMARK',
                payload: {
                    spaceId: 'space-1',
                    params: { title: 'Test', tags: ['a'] }
                }
            },
            {},
            (response: MessageResponse) => {
                if (response.success && (response.data as any).id === 'new-obj') {
                    console.log('   ✅ Success');
                } else {
                    console.error('   ❌ Failed', response);
                }
                resolve();
            }
        );
    });
}

runTest().catch(console.error);
