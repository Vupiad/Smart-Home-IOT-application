/**
 * API Client - Wrapper cho fetch requests
 * 
 * Tự động:
 * - Attach session cookies
 * - Handle errors
 * - Add default headers
 */

import { API_BASE_URL } from "../constants/api";

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private buildUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}`;
  }

  private buildHeaders(headers: Record<string, string> = {}): Record<string, string> {
    return {
      "Content-Type": "application/json",
      ...headers,
    };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "GET",
      headers: this.buildHeaders(),
      credentials: "include", // Gửi cookies cùng request
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    body?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "POST",
      headers: this.buildHeaders(),
      credentials: "include", // Gửi cookies cùng request
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    body?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "PUT",
      headers: this.buildHeaders(),
      credentials: "include", // Gửi cookies cùng request
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    body?: Record<string, any>,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "PATCH",
      headers: this.buildHeaders(),
      credentials: "include",
      body: body ? JSON.stringify(body) : undefined,
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(this.buildUrl(endpoint), {
      method: "DELETE",
      headers: this.buildHeaders(),
      credentials: "include", // Gửi cookies cùng request
      ...options,
    });

    return this.handleResponse<T>(response);
  }

  /**
   * Handle response & errors
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // Nếu status là 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMessage = data.detail || data.message || response.statusText || "Unknown error";
      throw new Error(errorMessage);
    }

    return data;
  }
}

// Default API client instance
export const apiClient = new ApiClient();
