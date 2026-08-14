import api from './axios';

export type DashboardTrialEndingSoon = {
  publicId: string;
  name: string;
  trialEndsAt: string;
  courtsCount: number;
};

export type DashboardRecentLogin = {
  publicId: string;
  ownerName: string;
  arenaName: string | null;
  lastLoginAt: string;
};

export type PlatformDashboard = {
  courts: number;
  activeCourts: number;
  trialCourts: number;
  expiredArenas: number;
  onboarding: number;
  monthlyRevenue: number;
  receivedThisMonth: number;
  reservationsToday: number;
  reservationsLast7Days: number;
  arenasActiveThisWeek: number;
  trialsEndingSoon: DashboardTrialEndingSoon[];
  recentLogins: DashboardRecentLogin[];
};

export async function getDashboard() {
  const response = await api.get<PlatformDashboard>('/platform/dashboard');
  return response.data;
}
