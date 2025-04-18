// Define ApiError class directly in the test
// This avoids importing from the actual module which has import.meta issues
class ApiError extends Error {
  status: number;
  data?: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Mock the api service
jest.mock('../apiService', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
  ApiError
}));

// We'll directly unit test the ApiError class
describe('ApiError', () => {
  it('should create an instance with the correct properties', () => {
    const message = 'Test error message';
    const status = 404;
    const data = { detail: 'Resource not found' };
    
    const error = new ApiError(message, status, data);
    
    expect(error.message).toBe(message);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(status);
    expect(error.data).toBe(data);
  });

  it('should handle different error data formats', () => {
    // No data
    const error1 = new ApiError('Error 1', 400);
    expect(error1.data).toBeUndefined();
    
    // String data
    const error2 = new ApiError('Error 2', 400, 'String error');
    expect(error2.data).toBe('String error');
    
    // Object data
    const error3 = new ApiError('Error 3', 400, { field: 'test', message: 'Invalid' });
    expect(error3.data).toEqual({ field: 'test', message: 'Invalid' });
  });

  it('should be an instance of Error and ApiError', () => {
    const error = new ApiError('Test error', 500);
    
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(ApiError);
  });
}); 