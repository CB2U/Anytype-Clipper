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
    ],
    coverageReporters: ['text', 'text-summary', 'lcov', 'html'],
    coverageThreshold: {
        global: {
            branches: 60,
            functions: 60,
            lines: 60,
            statements: 60,
        },
    },

    // Setup files
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
};
