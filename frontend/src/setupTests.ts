// Setup file for Jest tests

// Fix for TypeScript not recognizing global.import
declare global {
  var import: {
    meta: {
      env: {
        VITE_API_URL: string;
        // Add any other environment variables your app uses here
      }
    }
  };
}

// Mock Vite's import.meta.env
global.import = {
  meta: {
    env: {
      VITE_API_URL: 'http://localhost:8000/v1',
      // Add any other environment variables your app uses here
    }
  }
};

// Mock fetch API
global.fetch = jest.fn();

// Additional setup code can go here 