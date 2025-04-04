module.exports = {
    // The test environment that will be used for testing
    testEnvironment: 'jsdom',

    // Setup files to run before each test
    setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],

    // File extensions Jest will look for
    moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],

    // Transform files with specific extensions
    transform: {
        '^.+\\.(ts|tsx)$': ['ts-jest', {
            tsconfig: '<rootDir>/tsconfig.test.json'
        }],
        '^.+\\.(js|jsx)$': 'babel-jest',
    },

    // Map module paths for importing
    moduleNameMapper: {
        // Handle CSS imports (if needed)
        '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
        // Handle image imports (if needed)
        '\\.(jpg|jpeg|png|gif|webp|svg)$': '<rootDir>/__mocks__/fileMock.js',
        // Mock Vite's import.meta.env
        '^@/(.*)$': '<rootDir>/src/$1',
    },

    // Automatically mock services directory
    automock: false,
    unmockedModulePathPatterns: ['<rootDir>/node_modules/'],

    // Coverage configuration
    collectCoverageFrom: [
        'src/**/*.{js,jsx,ts,tsx}',
        '!src/**/*.d.ts',
        '!src/**/index.{js,ts}',
    ],

    // Test match patterns
    testMatch: ['<rootDir>/src/**/__tests__/**/*.[jt]s?(x)', '<rootDir>/src/**/*.{spec,test}.[jt]s?(x)'],

    // Provide global variables to Jest
    globals: {
        'import.meta': {
            env: {
                VITE_API_URL: 'http://localhost:8000/v1',
            },
        },
    },

    // Resolve problematic modules
    transformIgnorePatterns: [
        '/node_modules/(?!(@mui|@babel|react)).+\\.js$'
    ],
}; 