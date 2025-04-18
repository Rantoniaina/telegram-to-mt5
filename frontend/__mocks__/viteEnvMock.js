// Mock for Vite's import.meta.env used in tests
module.exports = {
    env: {
        VITE_API_URL: 'http://localhost:8000/v1',
        // Add other environment variables as needed
    }
}; 