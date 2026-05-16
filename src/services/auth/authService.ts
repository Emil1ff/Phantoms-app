import { apiRequest } from '../api/httpClient';
import type {
  ApiResponse,
  AuthSession,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  LoginRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../types/auth';
import { normalizeAuthSession } from '../../utils/session';

export type LoginPayload = LoginRequest;

export async function register(
  payload: RegisterRequest,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Auth/register', {
    method: 'POST',
    body: payload,
  });
}

export async function loginWithEmail(
  payload: LoginRequest,
): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>('/Auth/login', {
    method: 'POST',
    body: payload,
  });

  if (!response.data) {
    throw new Error('Session data is missing.');
  }

  return normalizeAuthSession(response.data) ?? response.data;
}

export async function googleSignIn(idToken: string): Promise<AuthSession> {
  const response = await apiRequest<AuthSession>('/Auth/google-signin', {
    method: 'POST',
    body: { idToken },
  });

  if (!response.data) {
    throw new Error('Google sign-in data is missing.');
  }

  return normalizeAuthSession(response.data) ?? response.data;
}

export async function forgotPassword(payload: ForgotPasswordRequest) {
  return apiRequest<never>('/Auth/forgot-password', {
    method: 'POST',
    body: payload,
  });
}

export async function resetPassword(payload: ResetPasswordRequest) {
  return apiRequest<never>('/Auth/reset-password', {
    method: 'POST',
    body: payload,
  });
}

export async function refreshToken(payload: RefreshTokenRequest) {
  const response = await apiRequest<AuthSession>('/Auth/refresh-token', {
    method: 'POST',
    body: payload,
  });

  if (!response.data) {
    throw new Error('Refresh token data is missing.');
  }

  return normalizeAuthSession(response.data) ?? response.data;
}

export async function changePassword(payload: ChangePasswordRequest, token: string) {
  return apiRequest<never>('/Auth/change-password', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function revokeToken(token: string) {
  return apiRequest<never>('/Auth/revoke-token', {
    method: 'POST',
    token,
  });
}

export function mapAuthError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Something went wrong.';
}
