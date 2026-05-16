import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type { NotificationItem, NotificationListResponse } from '../../types/notifications';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeNotification(item: unknown): NotificationItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    message: asString(raw.message),
    isRead: Boolean(raw.isRead),
    createdAt: asString(raw.createdAt),
  };
}

function normalizeList(raw: unknown): NotificationListResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(normalizeNotification),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 20) || 20,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getMyNotifications(
  params: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
  token: string,
): Promise<NotificationListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 20));
  query.set('unreadOnly', String(params.unreadOnly ?? false));

  const response = await apiRequest<unknown>(`/Notifications/my?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function markNotificationAsRead(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Notifications/${id}/read`, {
    method: 'PATCH',
    token,
  });
}

export async function markAllNotificationsRead(token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Notifications/read-all', {
    method: 'PATCH',
    token,
  });
}
