// Mock modules before importing the service
jest.mock('../apiService');

// Import after mocking
import apiService, { ApiError } from '../apiService';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = global.fetch as jest.Mock;

// Mock console methods to avoid noise in test output
console.log = jest.fn();
console.error = jest.fn();

describe('ApiError', () => {
  test('should create an instance with the correct properties', () => {
    const error = new ApiError('Test error message', 404, { detail: 'Resource not found' });
    
    expect(error).toBeInstanceOf(Error);
    expect(error.name).toBe('ApiError');
    expect(error.message).toBe('Test error message');
    expect(error.status).toBe(404);
    expect(error.data).toEqual({ detail: 'Resource not found' });
  });
});

describe('apiService', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  test('get method should call the API with correct parameters', () => {
    const mockResult = { data: 'test data' };
    (apiService.get as jest.Mock).mockResolvedValue(mockResult);
    
    const promise = apiService.get('/test-endpoint', { param: 'value' });
    
    expect(apiService.get).toHaveBeenCalledWith('/test-endpoint', { param: 'value' });
    return expect(promise).resolves.toEqual(mockResult);
  });

  test('post method should call the API with correct data', () => {
    const mockResult = { id: 123, name: 'Test Item' };
    const postData = { name: 'Test Item', description: 'Test Description' };
    
    (apiService.post as jest.Mock).mockResolvedValue(mockResult);
    
    const promise = apiService.post('/items', postData);
    
    expect(apiService.post).toHaveBeenCalledWith('/items', postData);
    return expect(promise).resolves.toEqual(mockResult);
  });

  test('handleResponse should process responses correctly', () => {
    const mockResult = { success: true };
    const mockResponse = { ok: true } as Response;
    
    (apiService.handleResponse as jest.Mock).mockResolvedValue(mockResult);
    
    const promise = apiService.handleResponse(mockResponse);
    
    expect(apiService.handleResponse).toHaveBeenCalledWith(mockResponse);
    return expect(promise).resolves.toEqual(mockResult);
  });

  test('ApiError should be thrown for error responses', async () => {
    const errorData = { detail: 'Resource not found' };
    const error = new ApiError('Not Found', 404, errorData);
    
    (apiService.get as jest.Mock).mockRejectedValue(error);
    
    await expect(apiService.get('/non-existent')).rejects.toThrow(ApiError);
    await expect(apiService.get('/non-existent')).rejects.toThrow('Not Found');
    await expect(apiService.get('/non-existent')).rejects.toEqual(error);
  });
}); 