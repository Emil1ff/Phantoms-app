import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  CreateTeamFinderRequest,
  TeamFinderItem,
  TeamFinderListResponse,
  UpdateTeamFinderRequest,
} from '../../types/teamFinder';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeTeamFinder(item: unknown): TeamFinderItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    skillsNeeded: asString(raw.skillsNeeded),
    createdAt: asString(raw.createdAt),
  };
}

function normalizeList(raw: unknown): TeamFinderListResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(normalizeTeamFinder),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 10) || 10,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getTeamFinder(
  params: { page?: number; pageSize?: number; search?: string } = {},
  token?: string,
): Promise<TeamFinderListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  if (params.search?.trim()) query.set('search', params.search.trim());

  const response = await apiRequest<unknown>(`/TeamFinder?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function createTeamFinder(payload: CreateTeamFinderRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/TeamFinder', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function getTeamFinderById(id: string, token?: string): Promise<TeamFinderItem> {
  const response = await apiRequest<unknown>(`/TeamFinder/${id}`, {
    method: 'GET',
    token,
  });

  return normalizeTeamFinder(response.data);
}

export async function updateTeamFinder(id: string, payload: UpdateTeamFinderRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/TeamFinder/${id}`, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export async function deleteTeamFinderById(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/TeamFinder/${id}`, {
    method: 'DELETE',
    token,
  });
}
