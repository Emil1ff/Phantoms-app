import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';

import {
  addRolePermissions,
  createRole,
  deleteRole,
  getRoles,
  getRolePermissionsCatalog,
  getRolePermissions,
  removeRolePermissions,
} from '../../services/roles/rolesService';
import type { Role, RolePermissionsCatalog } from '../../types/roles';
import { mapAuthError } from '../../services/auth/authService';
import { bootstrapAuth, logout } from './authSlice';

type RootStateLike = {
  auth: {
    session: { accessToken?: string } | null;
  };
};

type RolesState = {
  status: 'idle' | 'loading';
  error: string | null;
  list: Role[];
  catalogStatus: 'idle' | 'loading';
  catalogError: string | null;
  permissionsCatalog: RolePermissionsCatalog;
};

const initialState: RolesState = {
  status: 'idle',
  error: null,
  list: [],
  catalogStatus: 'idle',
  catalogError: null,
  permissionsCatalog: {},
};

function tokenFromState(state: RootStateLike) {
  return state.auth.session?.accessToken;
}

export const fetchRoles = createAsyncThunk<
  Role[],
  void,
  { state: RootStateLike; rejectValue: string }
>('roles/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    return await getRoles(token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const fetchRolePermissions = createAsyncThunk<
  { roleName: string; permissions: string[] },
  string,
  { state: RootStateLike; rejectValue: string }
>('roles/fetchPerms', async (roleName, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    const permissions = await getRolePermissions(roleName, token);
    return { roleName, permissions };
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const createRoleThunk = createAsyncThunk<
  void,
  { name: string; description: string; permissions: string[] },
  { state: RootStateLike; rejectValue: string }
>('roles/create', async (payload, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await createRole(payload, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const fetchPermissionsCatalog = createAsyncThunk<
  RolePermissionsCatalog,
  void,
  { state: RootStateLike; rejectValue: string }
>('roles/fetchPermissions', async (_, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    return await getRolePermissionsCatalog(token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const addPermissionThunk = createAsyncThunk<
  void,
  { roleName: string; permission: string },
  { state: RootStateLike; rejectValue: string }
>('roles/addPerm', async ({ roleName, permission }, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await addRolePermissions(roleName, [permission], token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const addPermissionsThunk = createAsyncThunk<
  void,
  { roleName: string; permissions: string[] },
  { state: RootStateLike; rejectValue: string }
>('roles/addPerms', async ({ roleName, permissions }, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await addRolePermissions(roleName, permissions, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const removePermissionThunk = createAsyncThunk<
  void,
  { roleName: string; permission: string },
  { state: RootStateLike; rejectValue: string }
>('roles/removePerm', async ({ roleName, permission }, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await removeRolePermissions(roleName, [permission], token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const removePermissionsThunk = createAsyncThunk<
  void,
  { roleName: string; permissions: string[] },
  { state: RootStateLike; rejectValue: string }
>('roles/removePerms', async ({ roleName, permissions }, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await removeRolePermissions(roleName, permissions, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

export const deleteRoleThunk = createAsyncThunk<
  void,
  string,
  { state: RootStateLike; rejectValue: string }
>('roles/delete', async (roleName, { getState, rejectWithValue }) => {
  try {
    const token = tokenFromState(getState());
    if (!token) return rejectWithValue('No session token found.');
    await deleteRole(roleName, token);
  } catch (error) {
    return rejectWithValue(mapAuthError(error));
  }
});

const rolesSlice = createSlice({
  name: 'roles',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchPermissionsCatalog.pending, state => {
        state.catalogStatus = 'loading';
        state.catalogError = null;
      })
      .addCase(fetchPermissionsCatalog.fulfilled, (state, action) => {
        state.catalogStatus = 'idle';
        state.permissionsCatalog = action.payload ?? {};
      })
      .addCase(fetchPermissionsCatalog.rejected, (state, action) => {
        state.catalogStatus = 'idle';
        state.catalogError = action.payload ?? 'Failed to load permissions.';
      })
      .addCase(fetchRoles.pending, state => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchRoles.fulfilled, (state, action) => {
        state.status = 'idle';
        state.list = action.payload.map(role => {
          const existing = state.list.find(item => item.name === role.name);
          return {
            ...role,
            permissions: Array.isArray(role.permissions)
              ? role.permissions
              : existing?.permissions ?? [],
          };
        });
      })
      .addCase(fetchRolePermissions.fulfilled, (state, action) => {
        state.status = 'idle';
        state.list = state.list.map(role =>
          role.name === action.payload.roleName
            ? { ...role, permissions: action.payload.permissions }
            : role,
        );
      })
      .addCase(fetchRoles.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload ?? 'Failed to load roles.';
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
          [
            createRoleThunk,
            addPermissionThunk,
            addPermissionsThunk,
            fetchRolePermissions,
            removePermissionThunk,
            removePermissionsThunk,
            deleteRoleThunk,
          ].some(thunk => thunk.pending.match(action)),
        state => {
          state.status = 'loading';
          state.error = null;
        },
      )
      .addMatcher(
        action =>
          [
            createRoleThunk,
            addPermissionThunk,
            addPermissionsThunk,
            fetchRolePermissions,
            removePermissionThunk,
            removePermissionsThunk,
            deleteRoleThunk,
          ].some(thunk => thunk.fulfilled.match(action)),
        state => {
          state.status = 'idle';
        },
      )
      .addMatcher(
        action =>
          [
            createRoleThunk,
            addPermissionThunk,
            addPermissionsThunk,
            fetchRolePermissions,
            removePermissionThunk,
            removePermissionsThunk,
            deleteRoleThunk,
          ].some(thunk => thunk.rejected.match(action)),
        (state, action: { payload?: string }) => {
          state.status = 'idle';
          state.error = action.payload ?? 'Role action failed.';
        },
      );
  },
});

export default rolesSlice.reducer;
