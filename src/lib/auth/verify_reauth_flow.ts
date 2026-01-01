// Mock Chrome Storage
const storageMock = new Map<string, any>();
const chromeMock = {
    storage: {
        local: {
            get: async (keys: string | string[] | null) => {
                if (typeof keys === 'string') {
                    return { [keys]: storageMock.get(keys) };
                }
                return Object.fromEntries(storageMock);
            },
            set: async (items: Record<string, any>) => {
                Object.entries(items).forEach(([k, v]) => storageMock.set(k, v));
            },
            remove: async (keys: string | string[]) => {
                if (typeof keys === 'string') storageMock.delete(keys);
                else if (Array.isArray(keys)) keys.forEach(k => storageMock.delete(k));
            }
        }
    }
};
(global as any).chrome = chromeMock;

import { AuthManager, AuthStatus } from './auth-manager';
import { StorageManager } from '../storage/storage-manager';

/**
 * Verifies the Re-authentication Flow
 * Ensures that a 401 response triggers a disconnect
 */
export async function verifyReauthFlow() {
    console.log('🧪 Starting Re-auth Flow Verification...');

    // 1. Setup: Simulate Authenticated State
    console.log('1. Setting up authenticated state...');
    const storage = StorageManager.getInstance();
    await storage.set('auth', { apiKey: 'test-key', isAuthenticated: true });

    const auth = AuthManager.getInstance();
    await auth.init(); // Load state

    if (auth.getState().status !== AuthStatus.Authenticated) {
        console.error('❌ Failed to set up initial authenticated state');
        return;
    }
    console.log('   ✅ Initial state: Authenticated');

    // 2. Mock Global Fetch to return 401 Unauthorized
    console.log('2. Mocking 401 Unauthorized response...');
    const originalFetch = global.fetch;
    global.fetch = async () => {
        return {
            ok: false,
            status: 401,
            text: async () => 'Token expired',
            json: async () => ({ error: 'Token expired' })
        } as Response;
    };

    // 3. Trigger Validation (which should fail with 401 and disconnect)
    console.log('3. Triggering validateSession()...');
    try {
        const isValid = await auth.validateSession();

        // 4. Verification
        console.log('4. Verifying results...');
        if (!isValid) {
            console.log('   ✅ validateSession returned false');

            const finalState = auth.getState();
            if (finalState.status === AuthStatus.Unauthenticated) {
                console.log('   ✅ State transitioned to Unauthenticated');
            } else {
                console.error('   ❌ State did NOT transition to Unauthenticated. Status:', finalState.status);
            }

            const storageData = await storage.get('auth');
            if (!storageData || !storageData.apiKey) {
                console.log('   ✅ Storage was cleared');
            } else {
                console.error('   ❌ Storage was NOT cleared:', storageData);
            }

        } else {
            console.error('   ❌ validateSession unexpectedly returned true');
        }

    } catch (error) {
        console.error('   ❌ Unexpected error during validation:', error);
    } finally {
        // Restore fetch
        global.fetch = originalFetch;
    }

    console.log('🎉 Re-auth Flow Verification Complete.');
}

// Run directly
verifyReauthFlow().catch(console.error);
