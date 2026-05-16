import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type { CreateEventRequest, EventItem, EventListResponse, UpdateEventRequest } from '../../types/events';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeEvent(item: unknown): EventItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    title: asString(raw.title),
    description: asString(raw.description),
    date: asString(raw.date),
  };
}

function normalizeList(raw: unknown): EventListResponse {
  const payload = (raw ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(normalizeEvent),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 10) || 10,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function getEvents(
  params: { page?: number; pageSize?: number; search?: string; upcomingOnly?: boolean } = {},
  token?: string,
): Promise<EventListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));
  query.set('upcomingOnly', String(params.upcomingOnly ?? false));
  if (params.search?.trim()) query.set('search', params.search.trim());

  const response = await apiRequest<unknown>(`/Events?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function getTeacherEvents(
  params: { page?: number; pageSize?: number } = {},
  token: string,
): Promise<EventListResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 10));

  const response = await apiRequest<unknown>(`/Events/teacher?${query.toString()}`, {
    method: 'GET',
    token,
  });

  return normalizeList(response.data);
}

export async function createEvent(payload: CreateEventRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Events', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function getEventById(id: string, token?: string): Promise<EventItem> {
  const response = await apiRequest<unknown>(`/Events/${id}`, {
    method: 'GET',
    token,
  });

  return normalizeEvent(response.data);
}

export async function updateEvent(id: string, payload: UpdateEventRequest, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Events/${id}`, {
    method: 'PUT',
    body: payload,
    token,
  });
}

export async function deleteEventById(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Events/${id}`, {
    method: 'DELETE',
    token,
  });
}
