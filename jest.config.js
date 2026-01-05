/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Test file patterns - only run unit tests by default
    testMatch: [
        '**/tests/unit/**/*.test.ts',
        '**/src/**/*.test.ts',
    ],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.ts',
        '!src/**/*.d.ts',
        '!src/**/types.ts',
        '!src/**/index.ts',
        '!src/manifest.json',
    ],
    coveragePathIgnorePatterns: [
        '/node_modules/',
        '/tests/',
        '/dist/',
        '\\.test\\.ts$',
        '/src/types/',
        '/src/popup/',        // UI components - out of scope for Epic 8.0
        '/src/options/',      // UI components - out of scope for Epic 8.0
        '/src/lib/utils/domain-tag-mappings.ts',  // Static data file
        '/src/lib/utils/markdown-converter.ts',   // Legacy converter (replaced by turndown)
        '/src/lib/services/tag-suggestion-service.ts',  // Tested via integration
        '/src/lib/storage/verify_manual.ts',  // Manual testing utility
        '/src/lib/extractors/readability-extractor.ts',  // Requires DOM context - Epic 8.1
        '/src/lib/auth/verify_auth_management.ts',  // Manual verification script
        '/src/lib/auth/verify_reauth_flow.ts',  // Manual verification script
    ],
    coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
    coverageThreshold: {
        // Module-specific thresholds for targeted business logic (Epic 8.0)
        './src/lib/api/**/*.ts': {
            branches: 80,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/background/**/*.ts': {
            branches: 75,
            functions: 80,
            lines: 80,
            statements: 80,
        },
        './src/lib/extractors/**/*.ts': {
            branches: 70,
            functions: 80,
            lines: 85,
            statements: 85,
        },
        './src/lib/utils/**/*.ts': {
            branches: 85,
            functions: 90,
            lines: 90,
            statements: 90,
        },
        './src/lib/notifications/**/*.ts': {
            branches: 80,
            functions: 95,
            lines: 95,
            statements: 95,
        },
        './src/lib/services/**/*.ts': {
            branches: 80,
            functions: 80,
            lines: 90,
            statements: 90,
        },
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
