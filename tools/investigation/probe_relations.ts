
// Probe Script to discover valid relations in a space
// Usage: npx ts-node src/lib/api/probe_relations.ts

{
    const BASE_URL = 'http://localhost:31009';

    async function probe() {
        console.log(`Fetching spaces to get a valid spaceId...`);

        try {
            const spacesResponse = await fetch(`${BASE_URL}/v1/spaces`, {
                method: 'GET',
            });

            if (!spacesResponse.ok) {
                console.log(`Failed to fetch spaces: ${spacesResponse.status}`);
                return;
            }

            const spacesData = await spacesResponse.json();
            const spaces = Array.isArray(spacesData) ? spacesData : (spacesData.spaces || spacesData.data || []);

            if (spaces.length === 0) {
                console.log(`No spaces found.`);
                return;
            }

            const spaceId = spaces[0].id;
            console.log(`Using spaceId: ${spaceId}`);

            const endpoints = [
                `/v1/spaces/${spaceId}/relations`,
                `/v1/relations`
            ];

            for (const endpoint of endpoints) {
                const url = `${BASE_URL}${endpoint}`;
                try {
                    console.log(`Testing GET ${endpoint}...`);
                    const response = await fetch(url, {
                        method: 'GET',
                    });

                    console.log(`  -> Status: ${response.status} ${response.statusText}`);
                    const text = await response.text();
                    console.log(`  -> Body: ${text.substring(0, 500)}...`);
                } catch (e: any) {
                    console.log(`  -> Error: ${e.message}`);
                }
            }
        } catch (e: any) {
            console.log(`Error: ${e.message}`);
        }
    }

    probe().catch(console.error);
}
