export type NotificationItem = {
  id: string;
  message: string;
  isRead: boolean;
  createdAt?: string;
};

export type NotificationListResponse = {
  items: NotificationItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
