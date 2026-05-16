import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  AdminAnnouncement,
  AdminDashboardStats,
  AdminPagedResult,
  AdminUser,
  AssignRoleRequest,
  RemoveRoleRequest,
} from '../../types/admin';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeAdminUser(item: unknown): AdminUser {
  const raw = (item ?? {}) as Record<string, unknown>;
  const userId =
    asString(raw.userId) ||
    asString(raw.userID) ||
    asString(raw.id) ||
    asString(raw.userGuid);

  const fullName =
    asString(raw.fullName) ||
    [asString(raw.firstName), asString(raw.lastName)].filter(Boolean).join(' ') ||
    asString(raw.name);

  const rolesRaw = raw.roles;
  const roles = Array.isArray(rolesRaw)
    ? rolesRaw.filter(role => typeof role === 'string') as string[]
    : [];

  return {
    userId,
    fullName: fullName || 'Unknown User',
    email: asString(raw.email),
    userName: asString(raw.userName) || asString(raw.username),
    isActive: Boolean(raw.isActive),
    roles,
  };
}

export async function getAdminUsers(
  token: string,
  params: { page?: number; pageSize?: number; search?: string } = {},
): Promise<AdminUser[]> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 100));
  if (params.search?.trim()) query.set('search', params.search.trim());

  const response = await apiRequest<{ items?: unknown[] } | unknown[]>(`/Admin/users?${query.toString()}`, {
    method: 'GET',
    token,
  });

  const payload = response.data;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.items)
      ? payload.items
      : [];

  return items.map(normalizeAdminUser);
}

function normalizeAnnouncement(item: unknown): AdminAnnouncement {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    content: asString(raw.content),
    category: asString(raw.category),
    createdAt: asString(raw.createdAt),
    isApproved: Boolean(raw.isApproved),
  };
}

function normalizePagedResult<T>(raw: unknown, mapper: (item: unknown) => T): AdminPagedResult<T> {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(mapper),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number((payload.pageSize ?? itemsRaw.length) || 10) || 10,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getAdminAnnouncements(
  token: string,
  params: { page?: number; pageSize?: number; category?: string; isApproved?: boolean } = {},
): Promise<AdminPagedResult<AdminAnnouncement>> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 20));
  if (params.category) query.set('category', params.category);
  if (typeof params.isApproved === 'boolean') query.set('isApproved', String(params.isApproved));

  const response = await apiRequest<unknown>(`/Admin/announcements?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizePagedResult(response.data, normalizeAnnouncement);
}

export async function approveAnnouncement(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Admin/announcements/${id}/approve`, {
    method: 'PATCH',
    token,
  });
}

export async function deleteAnnouncement(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Admin/announcements/${id}`, {
    method: 'DELETE',
    token,
  });
}

export async function getAdminDashboard(token: string): Promise<AdminDashboardStats> {
  const response = await apiRequest<unknown>('/Admin/dashboard', {
    method: 'GET',
    token,
  });
  const raw = (response.data ?? {}) as Record<string, unknown>;
  return {
    usersCount: Number(raw.usersCount ?? raw.totalUsers ?? 0) || 0,
    announcementsCount: Number(raw.announcementsCount ?? raw.totalAnnouncements ?? 0) || 0,
    pendingAnnouncementsCount: Number(raw.pendingAnnouncementsCount ?? raw.pendingApprovals ?? 0) || 0,
    eventsCount: Number(raw.eventsCount ?? raw.totalEvents ?? 0) || 0,
    lostFoundCount: Number(raw.lostFoundCount ?? raw.totalLostFound ?? 0) || 0,
    teamFinderCount: Number(raw.teamFinderCount ?? raw.totalTeamFinder ?? 0) || 0,
  };
}

export async function assignRole(
  payload: AssignRoleRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Admin/users/assign-role', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function removeRole(
  payload: RemoveRoleRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Admin/users/remove-role', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function toggleUserActive(
  userId: string,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Admin/users/${userId}/toggle-active`, {
    method: 'PATCH',
    token,
  });
}

export async function deleteUser(
  userId: string,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Admin/users/${userId}`, {
    method: 'DELETE',
    token,
  });
}
