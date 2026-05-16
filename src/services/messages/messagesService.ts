import { apiRequest } from '../api/httpClient';
import type { ApiResponse } from '../../types/auth';
import type {
  ConversationItem,
  ConversationMessagesResponse,
  MessageItem,
  SendMessageRequest,
} from '../../types/messages';

function asString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function asNumber(value: unknown): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function normalizeConversation(item: unknown): ConversationItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    otherUserId:
      asString(raw.otherUserId) ||
      asString(raw.userId) ||
      asString(raw.receiverId) ||
      asString(raw.senderId),
    otherUserName:
      asString(raw.otherUserName) ||
      asString(raw.fullName) ||
      asString(raw.userName) ||
      asString(raw.name),
    otherUserEmail: asString(raw.otherUserEmail) || asString(raw.email),
    lastMessage: asString(raw.lastMessage) || asString(raw.message) || asString(raw.content),
    lastMessageAt: asString(raw.lastMessageAt) || asString(raw.createdAt) || asString(raw.sentAt),
    unreadCount: asNumber(raw.unreadCount),
  };
}

function normalizeMessage(item: unknown): MessageItem {
  const raw = (item ?? {}) as Record<string, unknown>;
  return {
    id: asString(raw.id),
    senderId: asString(raw.senderId),
    receiverId: asString(raw.receiverId),
    content: asString(raw.content) || asString(raw.message),
    createdAt: asString(raw.createdAt) || asString(raw.sentAt),
  };
}

export async function getConversations(token: string): Promise<ConversationItem[]> {
  const response = await apiRequest<unknown>('/Messages/conversations', {
    method: 'GET',
    token,
  });
  const payload = response.data;
  const items = Array.isArray(payload)
    ? payload
    : Array.isArray((payload as Record<string, unknown> | undefined)?.items)
      ? (((payload as Record<string, unknown>).items as unknown[]) ?? [])
      : [];

  return items.map(normalizeConversation).filter(item => Boolean(item.otherUserId));
}

export async function getConversationMessages(
  otherUserId: string,
  token: string,
  params: { page?: number; pageSize?: number } = {},
): Promise<ConversationMessagesResponse> {
  const query = new URLSearchParams();
  query.set('page', String(params.page ?? 1));
  query.set('pageSize', String(params.pageSize ?? 30));

  const response = await apiRequest<unknown>(
    `/Messages/conversations/${otherUserId}?${query.toString()}`,
    {
      method: 'GET',
      token,
    },
  );

  const payload = (response.data ?? {}) as Record<string, unknown>;
  const itemsRaw = Array.isArray(payload.items) ? payload.items : [];

  return {
    items: itemsRaw.map(normalizeMessage),
    totalCount: Number(payload.totalCount ?? itemsRaw.length) || 0,
    page: Number(payload.page ?? 1) || 1,
    pageSize: Number(payload.pageSize ?? 30) || 30,
    totalPages: Number(payload.totalPages ?? 1) || 1,
    hasNextPage: Boolean(payload.hasNextPage),
    hasPreviousPage: Boolean(payload.hasPreviousPage),
  };
}

export async function sendMessage(
  payload: SendMessageRequest,
  token: string,
): Promise<ApiResponse<never>> {
  return apiRequest<never>('/Messages/send', {
    method: 'POST',
    body: payload,
    token,
  });
}

export async function deleteMessage(id: string, token: string): Promise<ApiResponse<never>> {
  return apiRequest<never>(`/Messages/${id}`, {
    method: 'DELETE',
    token,
  });
}
