/** @type {import('ts-jest').JestConfigWithTsJest} */
export default {
    preset: 'jest-puppeteer',
    transform: {
        '^.+\\.ts$': 'ts-jest'
    },
    testMatch: ['**/tests/integration/**/*.test.ts'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
    },
    testTimeout: 10000,
};
