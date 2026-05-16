import { API_BASE_URL } from '../../constants';
import type { ApiResponse } from '../../types/auth';
import { clearStoredSession, loadStoredSession, persistSession } from '../auth/authStorage';
import { normalizeAuthSession } from '../../utils/session';
import type { AuthSession } from '../../types/auth';

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: object;
  token?: string;
  _retryWithRefresh?: boolean;
};

let onSessionExpired: (() => void) | null = null;
let refreshingPromise: Promise<AuthSession | null> | null = null;

export function setSessionExpiredHandler(handler: (() => void) | null) {
  onSessionExpired = handler;
}

function isAuthEndpoint(path: string) {
  const normalized = path.toLowerCase();
  return normalized.includes('/auth/login') ||
    normalized.includes('/auth/register') ||
    normalized.includes('/auth/google-signin') ||
    normalized.includes('/auth/refresh-token');
}

async function attemptRefreshToken(): Promise<AuthSession | null> {
  if (refreshingPromise) {
    return refreshingPromise;
  }

  refreshingPromise = (async () => {
    const current = await loadStoredSession();
    if (!current?.refreshToken) {
      return null;
    }

    const refreshResponse = await fetch(`${API_BASE_URL}/Auth/refresh-token`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        accessToken: current.accessToken,
        refreshToken: current.refreshToken,
      }),
    });

    const raw = await refreshResponse.text();
    let parsed: ApiResponse<AuthSession> | null = null;
    if (raw) {
      try {
        parsed = JSON.parse(raw) as ApiResponse<AuthSession>;
      } catch {
        parsed = null;
      }
    }

    if (!refreshResponse.ok || !parsed?.succeeded || !parsed.data) {
      return null;
    }

    const normalizedSession = normalizeAuthSession(parsed.data) ?? parsed.data;
    await persistSession(normalizedSession);
    return normalizedSession;
  })().finally(() => {
    refreshingPromise = null;
  });

  return refreshingPromise;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method ?? 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        ...(options.token
          ? {
              Authorization: `Bearer ${options.token}`,
            }
          : null),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch (error) {
    throw error instanceof Error ? error : new Error('Network request failed.');
  }

  if (
    response.status === 401 &&
    options.token &&
    !options._retryWithRefresh &&
    !isAuthEndpoint(path)
  ) {
    const nextSession = await attemptRefreshToken();
    if (nextSession?.accessToken) {
      return apiRequest<T>(path, {
        ...options,
        token: nextSession.accessToken,
        _retryWithRefresh: true,
      });
    }

    await clearStoredSession();
    onSessionExpired?.();
    throw new Error('Session expired. Please sign in again.');
  }

  const raw = await response.text();
  let data: ApiResponse<T> | null = null;

  if (raw) {
    try {
      data = JSON.parse(raw) as ApiResponse<T>;
    } catch {
      data = null;
    }
  }

  const fallbackMessage = response.ok
    ? 'Unexpected response format from server.'
    : `Request failed (${response.status}).`;

  if (!response.ok || !data?.succeeded) {
    throw new Error(data?.errors?.[0] || data?.message || fallbackMessage);
  }

  return data;
}
