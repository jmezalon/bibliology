import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

/**
 * Create axios instance with default config
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important: Send cookies with requests
});

/**
 * Request interceptor
 * - Add auth token if available
 * - Log requests in development
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[API Request] ${config.method?.toUpperCase()} ${config.url}`);
    }

    return config;
  },
  (error: AxiosError) => {
    console.error('[API Request Error]', error);
    return Promise.reject(error);
  }
);

/**
 * Response interceptor
 * - Handle common errors
 * - Transform responses
 * - Handle authentication errors
 */
apiClient.interceptors.response.use(
  (response) => {
    // Log in development
    if (import.meta.env.DEV) {
      console.log(`[API Response] ${response.status} ${response.config.url}`);
    }

    return response;
  },
  (error: AxiosError) => {
    // Handle network errors
    if (!error.response) {
      console.error('[Network Error]', error.message);
      return Promise.reject({
        message: 'Network error. Please check your connection.',
        status: 0,
      });
    }

    const { response } = error;
    const status = response.status;

    // Log error in development
    if (import.meta.env.DEV) {
      console.error(`[API Error] ${status} ${error.config?.url}`, response.data);
    }

    // Handle specific status codes
    switch (status) {
      case 401:
        // Unauthorized - redirect to login
        console.warn('[Auth] Unauthorized access - redirecting to login');
        // Clear auth state (will be handled by the auth store)
        window.location.href = '/login';
        break;

      case 403:
        // Forbidden
        console.warn('[Auth] Forbidden access');
        break;

      case 404:
        // Not found
        console.warn('[API] Resource not found');
        break;

      case 422:
        // Validation error
        console.warn('[API] Validation error', response.data);
        break;

      case 429:
        // Rate limit exceeded
        console.warn('[API] Rate limit exceeded');
        break;

      case 500:
      case 502:
      case 503:
      case 504:
        // Server errors
        console.error('[API] Server error');
        break;

      default:
        console.error('[API] Unknown error', status);
    }

    return Promise.reject(error);
  }
);

export default apiClient;
