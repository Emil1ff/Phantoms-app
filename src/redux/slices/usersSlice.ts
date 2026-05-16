import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  assignRole,
  deleteUser,
  getAdminUsers,
  removeRole,
  toggleUserActive,
} from '../../services/admin/adminService';
import type { AdminUser } from '../../types/admin';
import { mapAuthError } from '../../services/auth/authService';
import { bootstrapAuth, logout } from './authSlice';

type UsersState = {
  status: 'idle' | 'loading';
  error: string | null;
  list: AdminUser[];
};

const initialState: UsersState = {
  status: 'idle',
  error: null,
  list: [],
};

type RootStateLike = {
  auth: {
    session: { accessToken?: string; userId?: string } | null;
  };
};

function requireToken(state: RootStateLike) {
  return state.auth.session?.accessToken;
}

export const fetchAdminUsers = createAsyncThunk<
  AdminUser[],
  { page?: number; pageSize?: number; search?: string } | void,
  { state: RootStateLike; rejectValue: string }
>('users/fetchAll', async (params, { getState, rejectWithValue }) => {
  try {
    const token = requireToken(getState());
    if (!token) {
      return rejectWithValue('No session token found.');
    }
    return await getAdminUsers(token, params ?? {});
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const assignUserRole = createAsyncThunk<
  void,
  { userId: string; roleName: string },
  { state: RootStateLike; rejectValue: string }
>('users/assignRole', async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = requireToken(state);
    if (!token) return rejectWithValue('No session token found.');
    if (state.auth.session?.userId && state.auth.session.userId === payload.userId) {
      return rejectWithValue('You cannot change your own roles.');
    }
    await assignRole(payload, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const removeUserRole = createAsyncThunk<
  void,
  { userId: string; roleName: string },
  { state: RootStateLike; rejectValue: string }
>('users/removeRole', async (payload, { getState, rejectWithValue }) => {
  try {
    const state = getState();
    const token = requireToken(state);
    if (!token) return rejectWithValue('No session token found.');
    if (state.auth.session?.userId && state.auth.session.userId === payload.userId) {
      return rejectWithValue('You cannot change your own roles.');
    }
    await removeRole(payload, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const toggleUserActiveThunk = createAsyncThunk<
  void,
  string,
  { state: RootStateLike; rejectValue: string }
>('users/toggle', async (userId, { getState, rejectWithValue }) => {
  try {
    const token = requireToken(getState());
    if (!token) return rejectWithValue('No session token found.');
    await toggleUserActive(userId, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const deleteUserThunk = createAsyncThunk<
  void,
  string,
  { state: RootStateLike; rejectValue: string }
>('users/delete', async (userId, { getState, rejectWithValue }) => {
  try {
    const token = requireToken(getState());
    if (!token) return rejectWithValue('No session token found.');
    await deleteUser(userId, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAdminUsers.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAdminUsers.fulfilled, (state, action) => {
        state.status = 'idle';
        state.list = action.payload;
      })
      .addCase(fetchAdminUsers.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load users.';
      })
      .addCase(logout.fulfilled, () => initialState)
      .addCase(bootstrapAuth.fulfilled, (state, action) => {
        if (!action.payload) {
          return initialState;
        }
        return state;
      })
      .addMatcher(
        action =>
          [assignUserRole, removeUserRole, toggleUserActiveThunk, deleteUserThunk].some(
            thunk => thunk.pending.match(action),
          ),
        state => {
          state.status = 'loading';
          state.error = null;
        },
      )
      .addMatcher(
        action =>
          [assignUserRole, removeUserRole, toggleUserActiveThunk, deleteUserThunk].some(
            thunk => thunk.fulfilled.match(action),
          ),
        state => {
          state.status = 'idle';
        },
      )
      .addMatcher(
        action =>
          [assignUserRole, removeUserRole, toggleUserActiveThunk, deleteUserThunk].some(
            thunk => thunk.rejected.match(action),
          ),
        (state, action: { payload?: string }) => {
          state.status = 'idle';
          state.error = action.payload ?? 'User action failed.';
        },
      );
  },
});

export default usersSlice.reducer;
