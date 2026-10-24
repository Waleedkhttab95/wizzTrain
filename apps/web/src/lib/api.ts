import type { ApiErrorResponse } from '@wizzapp/shared';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1';

const TOKEN_KEY = 'wizzapp.token';

/**
 * The API is a separate service and authenticates with a Bearer token, so the
 * token lives in localStorage and every request carries it explicitly. That
 * keeps the web app a pure static client — no server-side session to keep in
 * sync with a token the API issued.
 */
export const tokenStore = {
  get(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return window.localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },
  set(token: string): void {
    try {
      window.localStorage.setItem(TOKEN_KEY, token);
    } catch {
      /* private browsing — the session simply won't survive a reload */
    }
  },
  clear(): void {
    try {
      window.localStorage.removeItem(TOKEN_KEY);
    } catch {
      /* nothing to clean up */
    }
  },
};

/** A failed request, carrying the API's unified error body (spec §10). */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    /** Arabic, ready to display — the API localises its own messages. */
    override readonly message: string,
    /** Present when request validation failed: one message per field. */
    readonly fieldMessages: string[] = [],
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** A resource that simply hasn't been created yet, rather than a real failure. */
  get isNotFound(): boolean {
    return this.status === 404;
  }

  get isUnauthorized(): boolean {
    return this.status === 401;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  query?: Record<string, string | number | undefined>;
  /** Skip the Authorization header — only login needs this. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== '') url.searchParams.set(key, String(value));
  }
  return url.toString();
}

/** Fires when a request comes back 401, so the app can bounce to login. */
type UnauthorizedHandler = () => void;
let onUnauthorized: UnauthorizedHandler | null = null;
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null): void {
  onUnauthorized = handler;
}

export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, query, anonymous = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  if (!anonymous) {
    const token = tokenStore.get();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
      cache: 'no-store',
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') throw error;
    // Network-level failure: the API is down, or CORS rejected us.
    throw new ApiError(0, 'تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت');
  }

  if (response.status === 204) return undefined as T;

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiErrorResponse>;
    const raw = error.message;
    const list = Array.isArray(raw) ? raw : [];
    const message = list[0] ?? (typeof raw === 'string' ? raw : 'حدث خطأ غير متوقع');

    if (response.status === 401 && !anonymous) {
      tokenStore.clear();
      onUnauthorized?.();
    }

    throw new ApiError(response.status, message, list);
  }

  return payload as T;
}

/**
 * Multipart POST. FormData sets its own boundary-carrying content-type, so
 * this deliberately skips the JSON header the rest of the client sends.
 */
async function uploadRequest<T>(path: string, body: FormData): Promise<T> {
  const headers: Record<string, string> = {};
  const token = tokenStore.get();
  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;
  try {
    response = await fetch(buildUrl(path), { method: 'POST', headers, body });
  } catch {
    throw new ApiError(0, 'تعذّر الاتصال بالخادم، تأكد من اتصالك بالإنترنت');
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    const error = (payload ?? {}) as Partial<ApiErrorResponse>;
    const raw = error.message;
    const list = Array.isArray(raw) ? raw : [];
    const message = list[0] ?? (typeof raw === 'string' ? raw : 'تعذّر رفع الملف');

    if (response.status === 401) {
      tokenStore.clear();
      onUnauthorized?.();
    }
    throw new ApiError(response.status, message, list);
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, query?: RequestOptions['query'], signal?: AbortSignal) =>
    request<T>(path, { query, signal }),
  post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  del: (path: string) => request<void>(path, { method: 'DELETE' }),
  upload: <T>(path: string, body: FormData) => uploadRequest<T>(path, body),
};
