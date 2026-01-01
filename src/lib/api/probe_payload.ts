
// Probe Script to discover correct CreateObject payload structure
// Usage: npx ts-node src/lib/api/probe_payload.ts

const BASE_URL = 'http://localhost:31009';
const MOCK_SPACE_ID = 'mock-space-id'; // We rely on the API validating JSON *before* checking Space ID, or returning 404/400 specific to Space.
// Actually, if we get 401, we know we need auth.
// The user got 400, meaning they PASSED auth (or it failed open?) and hit the unmarshal error.
// We will try sending requests. If we get 401, we might need an API Key.
// But the error message "json: cannot unmarshal..." suggests the server parsed the body.

const CANDIDATES = [
    {
        name: 'Array of {relationKey, value}',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: 'Probe Title' },
                { relationKey: 'url', value: 'http://example.com' }
            ]
        }
    },
    {
        name: 'Array of {key, value}',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { key: 'title', value: 'Probe Title' },
                { key: 'url', value: 'http://example.com' }
            ]
        }
    },
    {
        name: 'Array of {relationId, value}',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationId: 'title', value: 'Probe Title' },
                { relationId: 'url', value: 'http://example.com' }
            ]
        }
    },
    {
        name: 'Array of unknown format (strings)',
        payload: {
            typeId: 'Bookmark',
            properties: ["title:Probe Title"]
        }
    }
];

async function probe() {
    console.log(`Probing payload schemas on ${BASE_URL}/v1/spaces/${MOCK_SPACE_ID}/objects...`);

    for (const attempt of CANDIDATES) {
        const url = `${BASE_URL}/v1/spaces/${MOCK_SPACE_ID}/objects`;
        try {
            console.log(`Testing ${attempt.name}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(attempt.payload)
            });

            console.log(`  -> Status: ${response.status} ${response.statusText}`);
            const text = await response.text();
            console.log(`  -> Body: ${text}`);

            if (response.status === 400 && !text.includes('unmarshal object')) {
                // If we moved past "unmarshal object", we made progress!
                console.log('  [!] POTENTIAL MATCH (Different error means schema parsing likely succeeded)');
            }
        } catch (e: any) {
            console.log(`  -> Error: ${e.message}`);
        }
        console.log('---');
    }
}

probe().catch(console.error);
