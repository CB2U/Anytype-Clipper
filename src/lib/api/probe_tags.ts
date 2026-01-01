
// Probe Script to discover correct multi_select format
// Usage: ANYTYPE_API_KEY="..." npx ts-node src/lib/api/probe_tags.ts

{
    const BASE_URL = 'http://localhost:31009';
    const API_KEY = process.env.ANYTYPE_API_KEY;

    async function probe() {
        if (!API_KEY) {
            console.error('ANYTYPE_API_KEY required');
            return;
        }

        console.log('Fetching spaceId...');
        const spacesRes = await fetch(`${BASE_URL}/v1/spaces`, {
            headers: { 'Authorization': `Bearer ${API_KEY}`, 'X-Anytype-Api-Key': API_KEY }
        });
        const spaces = await spacesRes.json();
        const spaceId = (Array.isArray(spaces) ? spaces[0] : (spaces.spaces?.[0] || spaces.data?.[0]))?.id;

        if (!spaceId) {
            console.error('No spaceId found');
            return;
        }

        const testCases = [
            { name: 'Direct Array in text', payload: { key: 'tag', text: ['test-tag'] } },
            { name: 'Array in links', payload: { key: 'tag', links: ['test-tag'] } },
            { name: 'Array in text_array', payload: { key: 'tag', text_array: ['test-tag'] } },
            { name: 'Array in multi_select', payload: { key: 'tag', multi_select: ['test-tag'] } },
            { name: 'Raw array value (if supported)', payload: { key: 'tag', value: ['test-tag'] } }
        ];

        for (const testCase of testCases) {
            console.log(`\n--- Testing: ${testCase.name} ---`);
            const body = {
                spaceId,
                name: `Test Tag ${testCase.name}`,
                type_key: 'bookmark',
                properties: [
                    { key: 'source', text: 'https://example.com' },
                    testCase.payload
                ]
            };

            try {
                const res = await fetch(`${BASE_URL}/v1/spaces/${spaceId}/objects`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${API_KEY}`,
                        'X-Anytype-Api-Key': API_KEY
                    },
                    body: JSON.stringify(body)
                });

                console.log(`Status: ${res.status}`);
                const data = await res.json();
                console.log(`Response: ${JSON.stringify(data)}`);

                if (res.ok) {
                    console.log(`✅ SUCCESS with ${testCase.name}!`);
                    break;
                }
            } catch (e: any) {
                console.log(`Error: ${e.message}`);
            }
        }
    }

    probe().catch(console.error);
}
