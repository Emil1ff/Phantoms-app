export type LostFoundItem = {
  id: string;
  title: string;
  contact: string;
  status: string;
  createdAt?: string;
};

export type LostFoundListResponse = {
  items: LostFoundItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CreateLostFoundRequest = {
  title: string;
  contact: string;
  status: string;
};

export type UpdateLostFoundRequest = {
  title: string;
  contact: string;
  status: string;
};
