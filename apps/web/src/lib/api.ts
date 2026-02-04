const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

export class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private getSupabaseToken: (() => Promise<string | null>) | null = null;

  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl;
    // Initialize token from localStorage if available (for backward compatibility)
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth_token');
    }
  }

  /**
   * Set a static token (for backward compatibility)
   */
  setToken(token: string | null) {
    this.token = token;
    if (typeof window !== 'undefined') {
      if (token) {
        localStorage.setItem('auth_token', token);
      } else {
        localStorage.removeItem('auth_token');
      }
    }
  }

  /**
   * Set a function to get Supabase token dynamically
   */
  setSupabaseTokenGetter(getter: () => Promise<string | null>) {
    this.getSupabaseToken = getter;
  }

  private async getAuthToken(): Promise<string | null> {
    // If we have a Supabase token getter, use it
    if (this.getSupabaseToken) {
      return await this.getSupabaseToken();
    }
    // Otherwise, use the static token
    return this.token;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    // Get the auth token (either Supabase or static)
    const authToken = await this.getAuthToken();
    if (authToken) {
      headers['Authorization'] = `Bearer ${authToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({
        message: 'An error occurred',
      }));
      throw new Error(error.message || 'Request failed');
    }

    return response.json();
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data !== undefined ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
