/**
 * Mock implementation of the API service for testing.
 */

// Mock API service for testing
const apiService = {
  get: jest.fn().mockImplementation(() => Promise.resolve({})),
  post: jest.fn().mockImplementation(() => Promise.resolve({})),
  put: jest.fn().mockImplementation(() => Promise.resolve({})),
  delete: jest.fn().mockImplementation(() => Promise.resolve({})),
  handleResponse: jest.fn().mockImplementation((response) => Promise.resolve(response))
};

export default apiService;

export class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
} 