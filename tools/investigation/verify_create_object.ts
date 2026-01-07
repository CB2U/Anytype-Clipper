import { AnytypeApiClient } from './client';
import { CreateObjectParams, AnytypeObject } from './types';

/**
 * Verifies the API Client Update for Epic 3.0
 * Tests createObject payload construction and response handling
 */
export async function verifyApiClientBuffer() {
    console.log('🧪 Starting API Client Verification...');

    // 1. Mock Fetch
    console.log('1. Mocking fetch...');
    const originalFetch = global.fetch;
    let lastRequest: { url: string; method: string; body: any } | null = null;

    global.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
        lastRequest = {
            url: input.toString(),
            method: init?.method || 'GET',
            body: init?.body ? JSON.parse(init.body as string) : undefined
        };

        // Mock successful creation response
        if (input.toString().includes('/v1/objects/create')) {
            return {
                ok: true,
                status: 200,
                json: async () => ({
                    objectId: 'new-object-id',
                    url: 'anytype://object/new-object-id'
                })
            } as Response;
        }

        return { ok: true, status: 200, json: async () => ({}) } as Response;
    };

    try {
        const client = new AnytypeApiClient();

        // 2. Test createObject
        console.log('2. Testing createObject()...');
        const params: CreateObjectParams = {
            title: 'Test Bookmark',
            description: 'A test note',
            source_url: 'https://example.com',
            domain: 'example.com',
            tags: ['test', 'clip']
        };

        const result = await client.createObject('space-123', params);

        // 3. Verify Request
        console.log('3. Verifying request payload...');
        if (!lastRequest) {
            console.error('❌ No request made');
            return;
        }

        if (lastRequest.url.includes('/v1/objects/create') && lastRequest.method === 'POST') {
            console.log('   ✅ Endpoint and Method correct');
        } else {
            console.error('   ❌ Wrong endpoint or method:', lastRequest);
        }

        const body = lastRequest.body;
        if (body.spaceId === 'space-123' &&
            body.typeId === 'Bookmark' &&
            body.properties.title === 'Test Bookmark' &&
            body.properties.tags.includes('test')) {
            console.log('   ✅ Request Body correct');
        } else {
            console.error('   ❌ Invalid request body:', body);
        }

        // 4. Verify Response Mapping
        console.log('4. Verifying response mapping...');
        if (result.id === 'new-object-id' && result.typeId === 'Bookmark') {
            console.log('   ✅ Response mapped correctly');
        } else {
            console.error('   ❌ Response mapping failed:', result);
        }

    } catch (error) {
        console.error('   ❌ Unexpected error:', error);
    } finally {
        global.fetch = originalFetch;
    }

    console.log('🎉 Verification Complete.');
}

// Run directly
verifyApiClientBuffer().catch(console.error);
