/**
 * Mock Anytype API Fixture
 * 
 * Provides realistic mock responses for Anytype API endpoints
 * for use in unit and integration tests.
 */

/**
 * Mock Space type
 */
export interface MockSpace {
    id: string;
    name: string;
    icon?: string;
    isArchived?: boolean;
}

/**
 * Mock Object type
 */
export interface MockObject {
    id: string;
    type: string;
    name: string;
    spaceId: string;
    properties: Record<string, unknown>;
    createdAt: number;
    updatedAt: number;
}

/**
 * Mock API Error type
 */
export interface MockApiError {
    code: number;
    message: string;
    details?: string;
}

/**
 * Mock API Response wrapper
 */
export interface MockApiResponse<T> {
    success: boolean;
    data?: T;
    error?: MockApiError;
}

/**
 * Default mock space data
 */
export const DEFAULT_MOCK_SPACES: MockSpace[] = [
    { id: 'space-1', name: 'Personal', icon: '🏠' },
    { id: 'space-2', name: 'Work', icon: '💼' },
    { id: 'space-3', name: 'Research', icon: '🔬' },
];

/**
 * Create a mock space with optional overrides
 */
export function createMockSpace(overrides: Partial<MockSpace> = {}): MockSpace {
    return {
        id: `space-${Date.now()}`,
        name: 'Test Space',
        icon: '📁',
        isArchived: false,
        ...overrides,
    };
}

/**
 * Create a mock bookmark object
 */
export function createMockBookmark(overrides: Partial<MockObject> = {}): MockObject {
    const now = Date.now();
    return {
        id: `bookmark-${now}`,
        type: 'bookmark',
        name: 'Test Bookmark',
        spaceId: 'space-1',
        createdAt: now,
        updatedAt: now,
        properties: {
            url: 'https://example.com/test',
            description: 'Test bookmark description',
            source: 'https://example.com',
            ...overrides.properties,
        },
        ...overrides,
    };
}

/**
 * Create a mock article object
 */
export function createMockArticle(overrides: Partial<MockObject> = {}): MockObject {
    const now = Date.now();
    return {
        id: `article-${now}`,
        type: 'article',
        name: 'Test Article',
        spaceId: 'space-1',
        createdAt: now,
        updatedAt: now,
        properties: {
            url: 'https://example.com/article',
            content: '# Test Article\n\nThis is test content.',
            author: 'Test Author',
            publishedDate: new Date().toISOString(),
            readingTime: 5,
            ...overrides.properties,
        },
        ...overrides,
    };
}

/**
 * Create a mock highlight object
 */
export function createMockHighlight(overrides: Partial<MockObject> = {}): MockObject {
    const now = Date.now();
    return {
        id: `highlight-${now}`,
        type: 'highlight',
        name: 'Test Highlight',
        spaceId: 'space-1',
        createdAt: now,
        updatedAt: now,
        properties: {
            quote: 'This is the highlighted text.',
            context: 'surrounding context for the highlighted text',
            url: 'https://example.com/page',
            pageTitle: 'Test Page',
            ...overrides.properties,
        },
        ...overrides,
    };
}

/**
 * Create a mock object based on type
 */
export function createMockObject(
    type: 'bookmark' | 'article' | 'highlight',
    overrides: Partial<MockObject> = {}
): MockObject {
    switch (type) {
        case 'bookmark':
            return createMockBookmark(overrides);
        case 'article':
            return createMockArticle(overrides);
        case 'highlight':
            return createMockHighlight(overrides);
    }
}

/**
 * Create a mock API error
 */
export function createMockApiError(code: number, message: string, details?: string): MockApiError {
    return { code, message, details };
}

/**
 * Common error responses
 */
export const MOCK_ERRORS = {
    unauthorized: createMockApiError(401, 'Unauthorized', 'Invalid or expired API key'),
    notFound: createMockApiError(404, 'Not Found', 'Resource not found'),
    serverError: createMockApiError(500, 'Internal Server Error', 'An unexpected error occurred'),
    badRequest: createMockApiError(400, 'Bad Request', 'Invalid request payload'),
    rateLimited: createMockApiError(429, 'Too Many Requests', 'Rate limit exceeded'),
};

/**
 * Create a success response
 */
export function createSuccessResponse<T>(data: T): MockApiResponse<T> {
    return { success: true, data };
}

/**
 * Create an error response
 */
export function createErrorResponse(error: MockApiError): MockApiResponse<never> {
    return { success: false, error };
}

/**
 * Mock fetch implementation for Anytype API
 * 
 * @example
 * ```typescript
 * global.fetch = createMockFetch({
 *   '/v1/spaces': createSuccessResponse(DEFAULT_MOCK_SPACES),
 *   '/v1/auth/challenges': createSuccessResponse({ code: '1234' }),
 * });
 * ```
 */
export function createMockFetch(
    responses: Record<string, MockApiResponse<unknown>>
): typeof fetch {
    return jest.fn().mockImplementation((url: string, _options?: RequestInit) => {
        const urlPath = new URL(url, 'http://localhost:31009').pathname;

        const response = responses[urlPath];
        if (response) {
            return Promise.resolve({
                ok: response.success,
                status: response.success ? 200 : (response.error?.code ?? 500),
                json: () => Promise.resolve(response.success ? response.data : response.error),
                text: () => Promise.resolve(JSON.stringify(response.success ? response.data : response.error)),
            });
        }

        // Default: 404 for unknown endpoints
        return Promise.resolve({
            ok: false,
            status: 404,
            json: () => Promise.resolve(MOCK_ERRORS.notFound),
            text: () => Promise.resolve(JSON.stringify(MOCK_ERRORS.notFound)),
        });
    }) as typeof fetch;
}

/**
 * Mock network error (Anytype not running)
 */
export function createNetworkErrorFetch(): typeof fetch {
    return jest.fn().mockImplementation(() => {
        return Promise.reject(new Error('fetch failed: ECONNREFUSED'));
    }) as typeof fetch;
}

/**
 * Mock timeout error
 */
export function createTimeoutFetch(timeoutMs = 5000): typeof fetch {
    return jest.fn().mockImplementation(() => {
        return new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs);
        });
    }) as typeof fetch;
}

/**
 * Sample API response data for testing
 */
export const SAMPLE_RESPONSES = {
    // Auth endpoints
    authChallenge: { code: '1234' },
    authApiKey: { apiKey: 'test-api-key-12345' },

    // Spaces endpoint
    spaces: DEFAULT_MOCK_SPACES,

    // Object creation
    createObject: createMockBookmark(),

    // Search results
    searchResults: {
        objects: [createMockBookmark({ name: 'Search Result 1' })],
        total: 1,
    },
};
