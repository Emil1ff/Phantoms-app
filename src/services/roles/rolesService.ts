import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  CreateRoleRequest,
  Role,
  RolePermissionsCatalog,
} from '../../types/roles';

export async function getRoles(token: string): Promise<Role[]> {
  const response = await apiRequest<Role[]>('/Roles', {
    method: 'GET',
    token,
  });

  return response.data ?? [];
}

export async function createRole(
  payload: CreateRoleRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Roles', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function addRolePermissions(
  roleName: string,
  permissions: string[],
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Roles/${roleName}/permissions`, {
    method: 'POST',
    body: permissions,
    token,
  });
}

export async function removeRolePermissions(
  roleName: string,
  permissions: string[],
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Roles/${roleName}/permissions`, {
    method: 'DELETE',
    body: permissions,
    token,
  });
}

export async function getRolePermissions(
  roleName: string,
  token: string,
): Promise<string[]> {
  const response = await apiRequest<string[]>(`/Roles/${roleName}/permissions`, {
    method: 'GET',
    token,
  });

  return response.data ?? [];
}

export async function getRolePermissionsCatalog(
  token: string,
): Promise<RolePermissionsCatalog> {
  const response = await apiRequest<RolePermissionsCatalog>('/Roles/permissions', {
    method: 'GET',
    token,
  });

  return response.data ?? {};
}

export async function deleteRole(
  roleName: string,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Roles/${roleName}`, {
    method: 'DELETE',
    token,
  });
}
