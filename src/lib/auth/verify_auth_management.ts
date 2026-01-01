import { AuthManager, AuthStatus } from './auth-manager';
import { StorageManager } from '../storage/storage-manager';

/**
 * Validates AuthManager Management Logic (Disconnect/Validation)
 */
export async function verifyAuthManagement() {
    console.log('🔐 Starting AuthManager Management Verification...');
    const auth = AuthManager.getInstance();
    const storage = StorageManager.getInstance();

    // 1. Test Disconnect
    console.log('\n1. Testing Disconnect...');

    // Simulate authenticated state manually
    await storage.set('auth', { apiKey: 'test-key', isAuthenticated: true });
    await auth.init();

    let state = auth.getState();
    if (state.status === AuthStatus.Authenticated) {
        console.log('   ✅ Initialized as Authenticated (Simulated)');
    } else {
        console.error('   ❌ Failed to simulate authenticated state');
    }

    // Perform disconnect
    await auth.disconnect();
    state = auth.getState();
    const storageData = await storage.get('auth');

    if (state.status === AuthStatus.Unauthenticated && !storageData) {
        console.log('   ✅ Disconnect successful (State reset & Storage cleared)');
    } else {
        console.error('   ❌ Disconnect failed', { state, storageData });
    }

    // 2. Test Validate Session (Mock/Dry Run)
    console.log('\n2. Testing ValidateSession (Dry Run)...');
    // Since we are unauthenticated now, it should return false immediately
    const isValid = await auth.validateSession();
    if (isValid === false) {
        console.log('   ✅ validateSession returned false for unauthenticated state');
    } else {
        console.error('   ❌ validateSession unexpectedly returned true');
    }

    console.log('\n🎉 AuthManager Management Verification Complete.');
}
