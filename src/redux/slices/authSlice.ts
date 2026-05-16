import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  clearStoredSession,
  loadStoredSession,
  persistSession,
} from '../../services/auth/authStorage';
import {
  changePassword,
  forgotPassword,
  googleSignIn,
  loginWithEmail,
  mapAuthError,
  refreshToken,
  register,
  resetPassword,
  revokeToken,
  type LoginPayload,
} from '../../services/auth/authService';
import { normalizeAuthSession } from '../../utils/session';
import type {
  AuthSession,
  ChangePasswordRequest,
  ForgotPasswordRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from '../../types/auth';

type AuthStatus = 'bootstrapping' | 'idle' | 'loading';

type AuthState = {
  status: AuthStatus;
  isAuthenticated: boolean;
  session: AuthSession | null;
  error: string | null;
  infoMessage: string | null;
};

const initialState: AuthState = {
  status: 'bootstrapping',
  isAuthenticated: false,
  session: null,
  error: null,
  infoMessage: null,
};

export const bootstrapAuth = createAsyncThunk(
  'auth/bootstrap',
  async (): Promise<AuthSession | null> => {
    const storedSession = await loadStoredSession();
    return normalizeAuthSession(storedSession);
  },
);

export const login = createAsyncThunk<
  AuthSession,
  LoginPayload,
  { rejectValue: string }
>('auth/login', async (payload, { rejectWithValue }) => {
  try {
    const session = await loginWithEmail(payload);
    await persistSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const logout = createAsyncThunk('auth/logout', async () => {
  await clearStoredSession();
});

export const registerUser = createAsyncThunk<
  string,
  RegisterRequest,
  { rejectValue: string }
>('auth/register', async (payload, { rejectWithValue }) => {
  try {
    const response = await register(payload);
    return response.message ?? 'Registration successful.';
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const loginWithGoogle = createAsyncThunk<
  AuthSession,
  string,
  { rejectValue: string }
>('auth/googleSignIn', async (idToken, { rejectWithValue }) => {
  try {
    const session = await googleSignIn(idToken);
    await persistSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const forgotPasswordRequest = createAsyncThunk<
  string,
  ForgotPasswordRequest,
  { rejectValue: string }
>('auth/forgotPassword', async (payload, { rejectWithValue }) => {
  try {
    const response = await forgotPassword(payload);
    return response.message ?? 'Reset token sent.';
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const resetPasswordRequest = createAsyncThunk<
  string,
  ResetPasswordRequest,
  { rejectValue: string }
>('auth/resetPassword', async (payload, { rejectWithValue }) => {
  try {
    const response = await resetPassword(payload);
    return response.message ?? 'Password reset successful.';
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const refreshAuthToken = createAsyncThunk<
  AuthSession,
  RefreshTokenRequest,
  { rejectValue: string }
>('auth/refreshToken', async (payload, { rejectWithValue }) => {
  try {
    const session = await refreshToken(payload);
    await persistSession(session);
    return session;
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const changePasswordRequest = createAsyncThunk<
  string,
  ChangePasswordRequest,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/changePassword', async (payload, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.session?.accessToken;
    if (!token) {
      return rejectWithValue('No active session found.');
    }
    const response = await changePassword(payload, token);
    return response.message ?? 'Password changed successfully.';
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const revokeCurrentToken = createAsyncThunk<
  void,
  void,
  { state: { auth: AuthState }; rejectValue: string }
>('auth/revokeToken', async (_, { getState, rejectWithValue }) => {
  try {
    const token = getState().auth.session?.accessToken;
    if (!token) {
      return rejectWithValue('No active session found.');
    }
    await revokeToken(token);
    await clearStoredSession();
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
    clearInfoMessage(state) {
      state.infoMessage = null;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        state.status = 'idle';
        state.session = action.payload;
        state.isAuthenticated = Boolean(action.payload?.accessToken);
      })
      .addCase(bootstrapAuth.rejected, state => {
        state.status = 'idle';
        state.session = null;
        state.isAuthenticated = false;
      })
      .addCase(login.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'idle';
        state.session = action.payload;
        state.isAuthenticated = true;
        state.infoMessage = 'Signed in successfully.';
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Login failed.';
        state.isAuthenticated = false;
      })
      .addCase(logout.fulfilled, state => {
        state.status = 'idle';
        state.session = null;
        state.isAuthenticated = false;
        state.error = null;
        state.infoMessage = 'Signed out.';
      })
      .addCase(registerUser.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.status = 'idle';
        state.infoMessage = action.payload;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Registration failed.';
      })
      .addCase(loginWithGoogle.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.status = 'idle';
        state.session = action.payload;
        state.isAuthenticated = true;
        state.infoMessage = 'Google sign-in successful.';
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Google sign-in failed.';
      })
      .addCase(forgotPasswordRequest.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(forgotPasswordRequest.fulfilled, (state, action) => {
        state.status = 'idle';
        state.infoMessage = action.payload;
      })
      .addCase(forgotPasswordRequest.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Forgot password failed.';
      })
      .addCase(resetPasswordRequest.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(resetPasswordRequest.fulfilled, (state, action) => {
        state.status = 'idle';
        state.infoMessage = action.payload;
      })
      .addCase(resetPasswordRequest.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Reset password failed.';
      })
      .addCase(refreshAuthToken.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(refreshAuthToken.fulfilled, (state, action) => {
        state.status = 'idle';
        state.session = action.payload;
        state.isAuthenticated = true;
        state.infoMessage = 'Session refreshed.';
      })
      .addCase(refreshAuthToken.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Refresh token failed.';
      })
      .addCase(changePasswordRequest.pending, state => {
        state.status = 'loading';
        state.error = null;
        state.infoMessage = null;
      })
      .addCase(changePasswordRequest.fulfilled, (state, action) => {
        state.status = 'idle';
        state.infoMessage = action.payload;
      })
      .addCase(changePasswordRequest.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Change password failed.';
      })
      .addCase(revokeCurrentToken.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(revokeCurrentToken.fulfilled, state => {
        state.status = 'idle';
        state.session = null;
        state.isAuthenticated = false;
        state.infoMessage = 'Token revoked.';
      })
      .addCase(revokeCurrentToken.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Revoke token failed.';
      });
  },
});

export const { clearAuthError, clearInfoMessage } = authSlice.actions;

export default authSlice.reducer;
