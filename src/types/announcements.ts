export type AnnouncementItem = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  isApproved?: boolean;
};

export type CreateAnnouncementRequest = {
  title: string;
  content: string;
  category: string;
};

export type UpdateAnnouncementRequest = {
  title: string;
  content: string;
  category: string;
};

export type AnnouncementListResponse = {
  items: AnnouncementItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};
