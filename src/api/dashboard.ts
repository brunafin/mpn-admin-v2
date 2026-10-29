import api from './axios';

export type DashboardTrialEndingSoon = {
  publicId: string;
  name: string;
  trialEndsAt: string;
  courtsCount: number;
  ownerName: string | null;
  phone: string | null;
};

export type DashboardRecentLogin = {
  publicId: string;
  ownerName: string;
  arenaName: string | null;
  lastLoginAt: string;
};

export type DashboardOverdueClient = {
  publicId: string;
  name: string;
  ownerName: string | null;
  phone: string | null;
  amount: number;
  oldestDueDate: string;
  overdueCount: number;
  daysOverdue: number;
};

export type PlatformDashboard = {
  clients: number;
  arenas: number;
  arenaOwners: number;
  activeArenas: number;
  trialArenas: number;
  expiredArenas: number;
  onboarding: number;
  monthlyRevenue: number;
  receivedThisMonth: number;
  reservationsToday: number;
  reservationsLast7Days: number;
  arenasActiveThisWeek: number;
  trialsEndingSoon: DashboardTrialEndingSoon[];
  recentLogins: DashboardRecentLogin[];
  lastHourLogins: DashboardRecentLogin[];
  overdueClients: DashboardOverdueClient[];
};

export async function getDashboard() {
  const response = await api.get<PlatformDashboard>('/platform/dashboard');
  return response.data;
}
