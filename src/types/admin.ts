export type AdminUser = {
  userId: string;
  fullName: string;
  email: string;
  userName: string;
  isActive: boolean;
  roles: string[];
};

export type AdminPagedResult<T> = {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

export type AdminAnnouncement = {
  id: string;
  title: string;
  content: string;
  category: string;
  createdAt: string;
  isApproved: boolean;
};

export type AdminDashboardStats = {
  usersCount: number;
  announcementsCount: number;
  pendingAnnouncementsCount: number;
  eventsCount: number;
  lostFoundCount: number;
  teamFinderCount: number;
};

export type AssignRoleRequest = {
  userId: string;
  roleName: string;
};

export type RemoveRoleRequest = {
  userId: string;
  roleName: string;
};
