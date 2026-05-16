export type EventItem = {
  id: string;
  title: string;
  description: string;
  date: string;
};

export type EventListResponse = {
  items: EventItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CreateEventRequest = {
  title: string;
  description: string;
  date: string;
};

export type UpdateEventRequest = {
  title: string;
  description: string;
  date: string;
};