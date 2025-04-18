// jest.setup.js
// This file configures Jest's test environment

// Set up proper handling for import.meta.env
Object.defineProperty(globalThis, 'import', {
    value: {
        meta: {
            env: {
                VITE_API_URL: 'http://localhost:8000/v1',
                // Add any other environment variables needed for tests
            }
        }
    },
    writable: false
});

// Import Jest DOM extensions for DOM testing assertions
import '@testing-library/jest-dom';

// Set up any global test configuration here 