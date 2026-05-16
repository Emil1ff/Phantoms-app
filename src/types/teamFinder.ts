export type TeamFinderItem = {
  id: string;
  title: string;
  skillsNeeded: string;
  createdAt?: string;
};

export type TeamFinderListResponse = {
  items: TeamFinderItem[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type CreateTeamFinderRequest = {
  title: string;
  skillsNeeded: string;
};

export type UpdateTeamFinderRequest = {
  title: string;
  skillsNeeded: string;
};
