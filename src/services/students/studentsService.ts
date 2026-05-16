import { apiRequest } from '../api/httpClient';
import type { StudentDashboard } from '../../types/students';

export async function getMyStudentDashboard(token: string): Promise<StudentDashboard> {
  const response = await apiRequest<Record<string, unknown>>('/Students/me/dashboard', {
    method: 'GET',
    token,
  });

  const raw = (response.data ?? {}) as Record<string, unknown>;
  return {
    announcementsCount: Number(raw.announcementsCount ?? 0) || 0,
    eventsCount: Number(raw.eventsCount ?? 0) || 0,
    lostFoundCount: Number(raw.lostFoundCount ?? 0) || 0,
    teamFinderCount: Number(raw.teamFinderCount ?? 0) || 0,
    unreadNotificationsCount: Number(raw.unreadNotificationsCount ?? 0) || 0,
  };
}
