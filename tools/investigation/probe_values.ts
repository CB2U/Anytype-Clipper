
// Probe Script to discover correct Property Value structure
// Usage: npx ts-node src/lib/api/probe_values.ts

const BASE_URL = 'http://localhost:31009';
const MOCK_SPACE_ID = 'mock-space-id';

// Candidates for how "value" should be structured inside { relationKey: "...", value: ??? }
const CANDIDATES = [
    {
        name: 'Simple string (Current - Failed)',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: 'Probe Title' }
            ]
        }
    },
    {
        name: 'Wrapper { type: "string", value: "..." }',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: { type: 'string', value: 'Probe Title' } }
            ]
        }
    },
    {
        name: 'Wrapper { text: "..." } (Protobuf-ish)',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: { text: 'Probe Title' } }
            ]
        }
    },
    {
        name: 'Wrapper { shortText: "..." }',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: { shortText: 'Probe Title' } }
            ]
        }
    },
    {
        name: 'Wrapper { longText: "..." }',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: { longText: 'Probe Title' } }
            ]
        }
    },
    {
        name: 'Wrapper { kind: "string", value: "..." }',
        payload: {
            typeId: 'Bookmark',
            properties: [
                { relationKey: 'title', value: { kind: 'string', value: 'Probe Title' } }
            ]
        }
    }
];

async function probe() {
    console.log(`Probing value schemas on ${BASE_URL}/v1/spaces/${MOCK_SPACE_ID}/objects...`);

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

            // If we get "unauthorized" (401), it means the JSON unmarshaling SUCCEEDED (it passed the schema check).
            // If we get 400 with "could not determine...", it failed.
            if (response.status === 401) {
                console.log('  [!] POTENTIAL MATCH (401 implies valid schema)');
            }
        } catch (e: any) {
            console.log(`  -> Error: ${e.message}`);
        }
        console.log('---');
    }
}

probe().catch(console.error);
