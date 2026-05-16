export type ConversationItem = {
  otherUserId: string;
  otherUserName: string;
  otherUserEmail: string;
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
};

export type MessageItem = {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  createdAt: string;
};

export type ConversationMessagesResponse = {
  items: MessageItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type SendMessageRequest = {
  receiverId: string;
  content: string;
};
