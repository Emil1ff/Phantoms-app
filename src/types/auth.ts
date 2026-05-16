export type AuthRole = 'Admin' | 'Client' | string;

export type ApiResponse<T> = {
  succeeded: boolean;
  message: string | null;
  data?: T;
  errors: string[];
};

export type LoginRequest = {
  email: string;
  password: string;
};

export type RegisterRequest = {
  firstName: string;
  lastName: string;
  email: string;
  userName: string;
  password: string;
};

export type ForgotPasswordRequest = {
  email: string;
};

export type ResetPasswordRequest = {
  email: string;
  token: string;
  newPassword: string;
};

export type RefreshTokenRequest = {
  accessToken: string;
  refreshToken: string;
};

export type ChangePasswordRequest = {
  currentPassword: string;
  newPassword: string;
};

export type AuthSession = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiry: string;
  userId: string;
  email: string;
  fullName: string;
  roles: AuthRole[];
  permissions?: string[];
  permission?: string[];
};
