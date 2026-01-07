import { AnytypeApiClient } from './client';
import { AuthError } from './errors';

/**
 * Verifies that AnytypeApiClient correctly throws AuthError on 401
 */
export async function verifyClientAuthError() {
    console.log('🧪 Starting Client AuthError Verification...');

    // Mock global fetch
    const originalFetch = global.fetch;
    global.fetch = async () => {
        return {
            ok: false,
            status: 401,
            text: async () => 'Unauthorized Request',
            json: async () => ({ error: 'Unauthorized' })
        } as Response;
    };

    const client = new AnytypeApiClient(31009);

    try {
        console.log('   Sending request that should fail...');
        await client.getSpaces();
        console.error('   ❌ Request succeeded unexpectedly');
    } catch (error) {
        if (error instanceof AuthError) {
            console.log('   ✅ Caught expected AuthError:', error.message);
            if (error.status === 401) {
                console.log('   ✅ Error status is 401');
            } else {
                console.error('   ❌ Error status mismatch:', error.status);
            }
        } else {
            console.error('   ❌ Caught unexpected error type:', error);
        }
    } finally {
        // Restore fetch
        global.fetch = originalFetch;
    }

    console.log('🎉 Client AuthError Verification Complete.');
}

// Run if called directly
if (require.main === module) {
    verifyClientAuthError().catch(console.error);
}
