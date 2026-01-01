
/**
 * Anytype Relation Discovery Script
 * 
 * Instructions:
 * 1. Open your Anytype Desktop app.
 * 2. Get your API Key from Settings -> API.
 * 3. Run this script:
 *    ANYTYPE_API_KEY="your-key" npx ts-node src/lib/api/list_relations.ts
 */

{
    const BASE_URL = 'http://localhost:31009';
    // @ts-ignore
    const API_KEY = typeof process !== 'undefined' ? process.env.ANYTYPE_API_KEY : undefined;

    async function run() {
        if (!API_KEY) {
            console.error('Error: ANYTYPE_API_KEY environment variable is required.');
            // @ts-ignore
            if (typeof process !== 'undefined') process.exit(1);
            return;
        }

        console.log('Fetching spaces...');
        const spacesRes = await fetch(`${BASE_URL}/v1/spaces`, {
            headers: {
                'Authorization': `Bearer ${API_KEY}`,
                'X-Anytype-Api-Key': API_KEY
            }
        });

        if (!spacesRes.ok) {
            console.error(`Failed to fetch spaces: ${spacesRes.status} ${spacesRes.statusText}`);
            return;
        }

        const spaces = await spacesRes.json();
        const spaceData = Array.isArray(spaces) ? spaces[0] : (spaces.spaces?.[0] || spaces.data?.[0]);
        const spaceId = spaceData?.id;

        if (!spaceId) {
            console.error('No spaces found.');
            return;
        }

        console.log(`Using space: ${spaceId} (${spaceData.name || 'Unnamed'})`);

        // Try both common endpoints
        const discoveryEndpoints = [
            `/v1/spaces/${spaceId}/relations`,
            `/v1/spaces/${spaceId}/properties`
        ];

        for (const endpoint of discoveryEndpoints) {
            console.log(`\nFetching ${endpoint}...`);
            const res = await fetch(`${BASE_URL}${endpoint}`, {
                headers: {
                    'Authorization': `Bearer ${API_KEY}`,
                    'X-Anytype-Api-Key': API_KEY
                }
            });

            if (res.ok) {
                const data = await res.json();
                console.log(`--- ${endpoint.toUpperCase()} FOUND ---`);
                console.log(JSON.stringify(data, null, 2));
            } else {
                console.log(`Endpoint ${endpoint} failed: ${res.status}`);
            }
        }
    }

    run().catch(console.error);
}
