const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080/api/v1";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  authenticated?: boolean;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, headers = {}, authenticated = true } = opts;

  if (authenticated && typeof window !== "undefined") {
    const token = localStorage.getItem("access_token");
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401) {
    const refreshed = await attemptRefresh();
    if (refreshed) {
      return request<T>(path, opts);
    }
    if (typeof window !== "undefined") {
      window.location.href = "/login";
    }
    throw new Error("Unauthorized");
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(err.error || `Request failed: ${res.status}`);
  }

  return res.json();
}

async function attemptRefresh(): Promise<boolean> {
  const refreshToken = localStorage.getItem("refresh_token");
  if (!refreshToken) return false;

  try {
    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    if (data.refresh_token) {
      localStorage.setItem("refresh_token", data.refresh_token);
    }
    return true;
  } catch {
    return false;
  }
}

export const api = {
  get: <T>(path: string, authenticated = true) =>
    request<T>(path, { authenticated }),
  post: <T>(path: string, body?: unknown, authenticated = true) =>
    request<T>(path, { method: "POST", body, authenticated }),
  put: <T>(path: string, body?: unknown, authenticated = true) =>
    request<T>(path, { method: "PUT", body, authenticated }),
  patch: <T>(path: string, body?: unknown, authenticated = true) =>
    request<T>(path, { method: "PATCH", body, authenticated }),
  delete: <T>(path: string, authenticated = true) =>
    request<T>(path, { method: "DELETE", authenticated }),
};
