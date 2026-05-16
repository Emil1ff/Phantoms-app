import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  AnnouncementItem,
  AnnouncementListResponse,
  CreateAnnouncementRequest,
  UpdateAnnouncementRequest,
} from '../../types/announcements';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeAnnouncement(item: unknown): AnnouncementItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    content: asString(raw.content),
    category: asString(raw.category),
    createdAt: asString(raw.createdAt),
    isApproved: typeof raw.isApproved === 'boolean' ? raw.isApproved : undefined,
  };
}

function normalizeList(raw: unknown): AnnouncementListResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];
  return {
    items: itemsRaw.map(normalizeAnnouncement),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 10) || 10,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getAnnouncements(
  params: { page?: number; pageSize?: number; category?: string; search?: string } = {},
  token?: string,
): Promise<AnnouncementListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  if (params.category?.trim()) query.set('category', params.category.trim());
  if (params.search?.trim()) query.set('search', params.search.trim());

  const response = await apiRequest<unknown>(`/Announcements?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function getTeacherAnnouncements(
  params: { page?: number; pageSize?: number } = {},
  token: string,
): Promise<AnnouncementListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));

  const response = await apiRequest<unknown>(`/Announcements/my?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function createAnnouncement(payload: CreateAnnouncementRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Announcements', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function getAnnouncementById(id: string, token?: string): Promise<AnnouncementItem> {
  const response = await apiRequest<unknown>(`/Announcements/${id}`, {
    method: 'GET',
    token,
  });
  return normalizeAnnouncement(response.data);
}

export async function updateAnnouncement(id: string, payload: UpdateAnnouncementRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Announcements/${id}`, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export async function deleteAnnouncementById(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Announcements/${id}`, {
    method: 'DELETE',
    token,
  });
}
