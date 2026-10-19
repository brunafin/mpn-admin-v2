import api from './axios';

export type CommissionKind = 'first_month' | 'recurring';

export type CommissionLine = {
  paymentId: number;
  dueDate: string | null;
  paidAt: string | null;
  paymentValue: number;
  percent: number;
  amount: number;
  kind: CommissionKind;
};

export type CommissionSummary = {
  firstMonthPercent: number;
  recurringPercent: number;
  total: number;
  lines: CommissionLine[];
};

export type RepresentativeSummary = {
  publicId: string;
  name: string;
  phone: string | null;
};

export type RepresentativeCompany = {
  publicId: string;
  name: string;
  city: string | null;
  uf: string | null;
  kind: 'company';
  partnerStatus: string;
  isTrial: boolean;
  trialEndsAt: string | null;
  courtsCount: number;
  visibleCourtsCount: number;
  monthlyFee: number;
  owner: {
    publicId: string;
    name: string | null;
    phone: string | null;
  } | null;
  lastPayment: {
    date: string | null;
    price: number;
    paid: boolean;
  } | null;
  paymentHistory: Array<{
    id: number;
    dueDate: string | null;
    paidAt: string | null;
    value: number;
    paid: boolean;
  }>;
  commissions: CommissionSummary;
};

export type RepresentativePayout = {
  year: number;
  month: number;
  amount: number;
  paidAt: string;
};

export type Representative = {
  publicId: string;
  name: string;
  phone: string | null;
  email: string | null;
  username: string;
  status: boolean;
  lastLoginAt: string | null;
  firstMonthPercent: number;
  recurringPercent: number;
  companiesCount: number;
  commissionTotal: number;
  companies: RepresentativeCompany[];
  payouts: RepresentativePayout[];
};

export type RepresentativeListItem = Omit<
  Representative,
  'companies' | 'payouts'
>;

export type RepresentativeInput = {
  name: string;
  username: string;
  email: string;
  phone?: string;
  password?: string;
  firstMonthPercent: number;
  recurringPercent: number;
};

export async function listRepresentatives() {
  const response = await api.get<RepresentativeListItem[]>('/representatives');
  return response.data;
}

export async function getRepresentative(publicId: string) {
  const response = await api.get<Representative>(`/representatives/${publicId}`);
  return response.data;
}

export async function getMyPortfolio() {
  const response = await api.get<Representative>('/representatives/me');
  return response.data;
}

export async function getMyCompany(companyPublicId: string) {
  const response = await api.get<RepresentativeCompany>(
    `/representatives/me/companies/${companyPublicId}`,
  );
  return response.data;
}

export async function createRepresentative(body: RepresentativeInput) {
  const response = await api.post<Representative>('/representatives', body);
  return response.data;
}

export async function updateRepresentative(
  publicId: string,
  body: Partial<RepresentativeInput>,
) {
  const response = await api.patch<Representative>(
    `/representatives/${publicId}`,
    body,
  );
  return response.data;
}

export async function deactivateRepresentative(publicId: string) {
  const response = await api.delete<{ ok: true }>(`/representatives/${publicId}`);
  return response.data;
}

export async function createRepresentativePayout(
  publicId: string,
  body: { year: number; month: number; amount: number; paidAt: string },
) {
  const response = await api.post<Representative>(
    `/representatives/${publicId}/payouts`,
    body,
  );
  return response.data;
}
