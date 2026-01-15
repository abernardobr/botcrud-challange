/**
 * HTTP Client
 * Axios-based HTTP client for API requests
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiConfig, ApiResponse, ApiError } from '../types';

/**
 * HTTP Client class - Wrapper around Axios with error handling
 */
export class HttpClient {
  private client: AxiosInstance;
  private debug: boolean;

  constructor(config: ApiConfig) {
    this.debug = config.debug ?? false;

    this.client = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout ?? 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        ...config.headers,
      },
      paramsSerializer: (params) => {
        // Custom serializer to handle filter as JSON string
        const parts: string[] = [];
        for (const key of Object.keys(params)) {
          const value = params[key];
          if (value === undefined || value === null) continue;

          if (key === 'filter' && typeof value === 'object') {
            // Stringify filter objects
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
          } else if (typeof value === 'object') {
            // For other objects, stringify them too
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(JSON.stringify(value))}`);
          } else {
            parts.push(`${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`);
          }
        }
        return parts.join('&');
      },
    });

    // Request interceptor for debugging
    this.client.interceptors.request.use(
      (config) => {
        if (this.debug) {
          console.log(`[BotCRUD API] ${config.method?.toUpperCase()} ${config.url}`);
        }
        return config;
      },
      (error) => {
        if (this.debug) {
          console.error('[BotCRUD API] Request error:', error.message);
        }
        return Promise.reject(error);
      }
    );

    // Response interceptor for debugging
    this.client.interceptors.response.use(
      (response) => {
        if (this.debug) {
          console.log(`[BotCRUD API] Response ${response.status}:`, response.data);
        }
        return response;
      },
      (error) => {
        if (this.debug) {
          console.error('[BotCRUD API] Response error:', error.response?.data || error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get the Axios instance
   */
  getClient(): AxiosInstance {
    return this.client;
  }

  /**
   * Extract data from API response
   */
  extractData<T>(response: AxiosResponse<ApiResponse<T>>): T {
    if (response.data.statusCode !== 200) {
      throw new ApiClientError(
        response.data.message || 'Unknown error',
        response.data.statusCode
      );
    }
    return response.data.data;
  }

  /**
   * Handle API errors
   */
  handleError(error: any): never {
    if (axios.isAxiosError(error)) {
      const response = error.response;
      if (response?.data) {
        const apiError = response.data as ApiError;
        throw new ApiClientError(
          apiError.message || error.message,
          apiError.statusCode || response.status,
          apiError.error
        );
      }
      throw new ApiClientError(
        error.message,
        response?.status || 500
      );
    }
    throw new ApiClientError(
      error.message || 'Unknown error',
      500
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return this.extractData(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return this.extractData(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return this.extractData(response);
    } catch (error) {
      return this.handleError(error);
    }
  }

  /**
   * DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return this.extractData(response);
    } catch (error) {
      return this.handleError(error);
    }
  }
}

/**
 * Custom API Client Error
 */
export class ApiClientError extends Error {
  public statusCode: number;
  public errorType?: string;

  constructor(message: string, statusCode: number, errorType?: string) {
    super(message);
    this.name = 'ApiClientError';
    this.statusCode = statusCode;
    this.errorType = errorType;

    // Maintains proper stack trace for where error was thrown
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiClientError);
    }
  }

  /**
   * Check if error is a not found error
   */
  isNotFound(): boolean {
    return this.statusCode === 404;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(): boolean {
    return this.statusCode === 400;
  }

  /**
   * Check if error is a conflict error
   */
  isConflict(): boolean {
    return this.statusCode === 409;
  }
}
