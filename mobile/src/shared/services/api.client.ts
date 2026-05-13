const RAW_API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();

const API_BASE_URL = (RAW_API_BASE_URL && RAW_API_BASE_URL.length > 0
  ? RAW_API_BASE_URL
  : "http://192.168.1.85:8000/api/v1"
).replace(/\/$/, "");

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
};

async function parseError(response: Response): Promise<Error> {
  try {
    const payload = (await response.json()) as { detail?: string };
    if (payload.detail) {
      return new Error(payload.detail);
    }
  } catch {
    // ignore parse error and fallback to status text
  }

  return new Error(`Request failed: ${response.status} ${response.statusText}`);
}

export async function apiRequest<T>(
  path: string,
  options?: RequestOptions,
): Promise<T> {
  const method = options?.method ?? "GET";
  const hasBody = options?.body !== undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    credentials: "include",
    headers: hasBody ? { "Content-Type": "application/json" } : undefined,
    body: hasBody ? JSON.stringify(options?.body) : undefined,
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export const apiConfig = {
  baseUrl: API_BASE_URL,
};
