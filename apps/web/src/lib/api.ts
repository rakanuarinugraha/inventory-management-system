const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

interface ApiOptions extends RequestInit {
  json?: unknown;
}

class ApiClient {
  private getAccessToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("accessToken");
  }

  private getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem("refreshToken");
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
  }

  private clearTokens() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  }

  private handleAuthRedirect() {
    if (typeof window === "undefined") return;
    this.clearTokens();
    window.location.href = "/login";
  }

  async request<T = unknown>(endpoint: string, options: ApiOptions = {}): Promise<T> {
    const { json, headers: customHeaders, ...rest } = options;

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(customHeaders as Record<string, string>),
    };

    const token = this.getAccessToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      headers,
      body: json ? JSON.stringify(json) : rest.body,
    });

    if (res.status === 401) {
      const refreshed = await this.tryRefreshToken();
      if (refreshed) {
        const newToken = this.getAccessToken();
        if (newToken) {
          headers["Authorization"] = `Bearer ${newToken}`;
          const retryRes = await fetch(`${API_BASE_URL}${endpoint}`, {
            ...rest,
            headers,
            body: json ? JSON.stringify(json) : rest.body,
          });
          if (!retryRes.ok) {
            const error = await retryRes.json().catch(() => ({ message: "Request failed" }));
            throw new ApiError(error.message || "Request failed", retryRes.status, error);
          }
          return retryRes.json();
        }
      }
      this.handleAuthRedirect();
      throw new ApiError("Session expired", 401);
    }

    if (!res.ok) {
      const error = await res.json().catch(() => ({ message: "Request failed" }));
      throw new ApiError(error.message || "Request failed", res.status, error);
    }

    if (res.status === 204) return undefined as T;
    return res.json();
  }

  private async tryRefreshToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) return false;

    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!res.ok) return false;

      const data = await res.json();
      this.setTokens(data.accessToken, data.refreshToken);
      return true;
    } catch {
      return false;
    }
  }

  login(email: string, password: string) {
    return this.request<{
      user: { id: string; name: string; email: string; role: string; isActive: boolean };
      accessToken: string;
      refreshToken: string;
    }>("/api/auth/login", { method: "POST", json: { email, password } });
  }

  get<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "GET" });
  }

  post<T = unknown>(endpoint: string, json?: unknown) {
    return this.request<T>(endpoint, { method: "POST", json });
  }

  put<T = unknown>(endpoint: string, json?: unknown) {
    return this.request<T>(endpoint, { method: "PUT", json });
  }

  patch<T = unknown>(endpoint: string, json?: unknown) {
    return this.request<T>(endpoint, { method: "PATCH", json });
  }

  delete<T = unknown>(endpoint: string) {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export class ApiError extends Error {
  statusCode: number;
  data?: unknown;

  constructor(message: string, statusCode: number, data?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.data = data;
  }
}

export const api = new ApiClient();
