import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  CreateLostFoundRequest,
  LostFoundItem,
  LostFoundListResponse,
  UpdateLostFoundRequest,
} from '../../types/lostFound';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeLostFound(item: unknown): LostFoundItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    contact: asString(raw.contact),
    status: asString(raw.status),
    createdAt: asString(raw.createdAt),
  };
}

function normalizeList(raw: unknown): LostFoundListResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(normalizeLostFound),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 10) || 10,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getLostFound(
  params: { page?: number; pageSize?: number; status?: string; search?: string } = {},
  token?: string,
): Promise<LostFoundListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  if (params.status?.trim()) query.set('status', params.status.trim());
  if (params.search?.trim()) query.set('search', params.search.trim());

  const response = await apiRequest<unknown>(`/LostFound?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function createLostFound(payload: CreateLostFoundRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/LostFound', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function getLostFoundById(id: string, token?: string): Promise<LostFoundItem> {
  const response = await apiRequest<unknown>(`/LostFound/${id}`, {
    method: 'GET',
    token,
  });

  return normalizeLostFound(response.data);
}

export async function updateLostFound(id: string, payload: UpdateLostFoundRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/LostFound/${id}`, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export async function deleteLostFoundById(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/LostFound/${id}`, {
    method: 'DELETE',
    token,
  });
}
