
// Probe Script to discover correct Anytype API endpoints
// Usage: npx ts-node src/lib/api/probe_endpoints.ts

const BASE_URL = 'http://localhost:31009';

const CANDIDATES = [
    '/v1/objects/create', // Current (known 404)
    '/v1/objects',
    '/v1/object',
    '/v1/spaces/mock-space-id/objects',
    '/api/v1/objects',
    '/v1/cmd/create_object'
];

async function probe() {
    console.log(`Probing endpoints on ${BASE_URL}...`);

    for (const endpoint of CANDIDATES) {
        const url = `${BASE_URL}${endpoint}`;
        try {
            console.log(`Testing POST ${endpoint}...`);
            const response = await fetch(url, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ test: 'probe' })
            });

            console.log(`  -> Status: ${response.status} ${response.statusText}`);

            if (response.status !== 404) {
                console.log(`  [!] FOUND CANDIDATE: ${endpoint} returned ${response.status}`);
            }
        } catch (e: any) {
            console.log(`  -> Error: ${e.message}`);
        }
    }
}

probe().catch(console.error);
