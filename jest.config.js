module.exports = {
    preset: 'jest-preset-angular',
    testEnvironment: 'jest-environment-jsdom',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testPathIgnorePatterns: [
        '<rootDir>/node_modules/',
        '<rootDir>/dist/',
        '<rootDir>/src/environments/'
    ],
    testMatch: [
        '**/+(*.)+(spec).+(ts)'
    ],
    transform: {
        '^.+\\.ts$': 'ts-jest',
    },
    transformIgnorePatterns: [
        '/node_modules/(?!flat)/',
    ],
};
