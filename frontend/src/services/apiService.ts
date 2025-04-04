// API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/v1';

/**
 * Generic API error class.
 */
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

/**
 * Base API service with common HTTP methods.
 */
const apiService = {
  /**
   * Make a GET request to the API.
   * @param endpoint - API endpoint path
   * @param params - Query parameters
   * @returns Promise resolving to the response data
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const url = new URL(`${API_BASE_URL}${endpoint}`);
    
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          url.searchParams.append(key, String(value));
        }
      });
    }

    console.log(`GET ${url.toString()}`);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      mode: 'cors',
    });

    return this.handleResponse<T>(response);
  },

  /**
   * Make a POST request to the API.
   * @param endpoint - API endpoint path
   * @param data - Request body data
   * @returns Promise resolving to the response data
   */
  async post<T>(endpoint: string, data: any): Promise<T> {
    console.log(`POST ${API_BASE_URL}${endpoint}`, data);
    
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
      mode: 'cors',
    });

    return this.handleResponse<T>(response);
  },

  /**
   * Handle API response and parse JSON data.
   * @param response - Fetch Response object
   * @returns Promise resolving to the parsed response data
   * @throws ApiError if response is not successful
   */
  async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType && contentType.includes('application/json');
    
    let data;
    try {
      data = isJson ? await response.json() : await response.text();
      console.log('Response:', response.status, data);
    } catch (error) {
      console.error('Error parsing response:', error);
      data = 'Error parsing response';
    }

    if (!response.ok) {
      let message = `API error: ${response.status} ${response.statusText}`;
      
      // Handle different error formats from FastAPI
      if (isJson) {
        if (data.detail) {
          message = typeof data.detail === 'string' 
            ? data.detail 
            : JSON.stringify(data.detail);
        } else if (data.message) {
          message = data.message;
        }
      }
      
      throw new ApiError(message, response.status, data);
    }

    return data as T;
  },
};

export default apiService; 