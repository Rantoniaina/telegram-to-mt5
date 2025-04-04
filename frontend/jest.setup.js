// jest.setup.js
// This file configures Jest's test environment

// Mock import.meta.env
if (typeof globalThis.import === 'undefined') {
    globalThis.import = {
        meta: {
            env: {
                VITE_API_URL: 'http://localhost:8000/v1',
                // Add any other environment variables needed for tests
            }
        }
    }
}

// Import Jest DOM extensions for DOM testing assertions
import '@testing-library/jest-dom';

// Set up any global test configuration here 