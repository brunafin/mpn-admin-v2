import api from './axios';

export type PartnerStatus = 'onboarding' | 'active' | 'inactive' | 'expired';
export type AccessMode = 'full' | 'read_only';

export type PlatformPaymentHistoryItem = {
  id: number;
  date: string;
  dueDate: string | null;
  value: number;
  formOfPayment: string | null;
  paid: boolean;
  status?: 'open' | 'overdue' | 'awaiting_pix' | 'paid';
  mpPaymentId?: string | null;
};

export type PlatformClientListItem = {
  kind: 'company' | 'onboarding';
  publicId: string;
  name: string;
  slug: string | null;
  city: string | null;
  uf: string | null;
  onPortal: boolean | null;
  partnerStatus: PartnerStatus;
  trialEndsAt: string | null;
  firstAccessAt: string | null;
  isTrial: boolean;
  accessMode: AccessMode;
  accessReason: string | null;
  accessRestrictedAt: string | null;
  createdAt: string;
  dayDue: number | null;
  monthlyFee: number;
  plan: {
    id: number | null;
    name: string;
    basePrice: number;
    pricePerCourt: number;
    price: number;
  } | null;
  owner: {
    publicId: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    username: string;
    emailVerified: boolean;
    lastLoginAt: string | null;
  } | null;
  courtsCount: number;
  visibleCourtsCount: number;
  lastPayment: {
    date: string | null;
    price: number;
    formOfPayment: string | null;
    paid: boolean;
  } | null;
};

export type PlatformClientDetail = PlatformClientListItem & {
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  address: {
    cep: string | null;
    street: string | null;
    number: string | null;
    neighborhood: string | null;
    city: string | null;
    uf: string | null;
  };
  instagramUrl: string | null;
  facebookUrl: string | null;
  publicLink: string | null;
  courts: Array<{
    publicId: string;
    name: string;
    floor: string | null;
    show: boolean;
    sports: string[];
    price: number | null;
  }>;
  paymentHistory: PlatformPaymentHistoryItem[];
  plan: (PlatformClientListItem['plan'] & { dayDue: number | null }) | null;
};

export type ListClientsResponse = {
  items: PlatformClientListItem[];
  total: number;
  page: number;
  limit: number;
};

export async function listClients(params: {
  q?: string;
  sort?: 'name' | 'created_at' | 'last_login_at' | 'status';
  page?: number;
  limit?: number;
}) {
  const response = await api.get<ListClientsResponse>('/platform/clients', {
    params,
  });
  return response.data;
}

export async function getClient(publicId: string) {
  const response = await api.get<PlatformClientDetail>(
    `/platform/clients/${publicId}`,
  );
  return response.data;
}

export async function createClientPayment(
  publicId: string,
  body: { year: number; month: number; value: number },
) {
  const response = await api.post<PlatformPaymentHistoryItem>(
    `/platform/clients/${publicId}/payments`,
    body,
  );
  return response.data;
}

export async function markClientPaymentPaid(
  publicId: string,
  paymentId: number,
  body: { paidAt: string },
) {
  const response = await api.patch<PlatformPaymentHistoryItem>(
    `/platform/clients/${publicId}/payments/${paymentId}/mark-paid`,
    body,
  );
  return response.data;
}

export async function updateClientPlan(
  publicId: string,
  body: {
    planId: number;
    dayDue?: number;
    endTrial?: boolean;
    trialEndsAt?: string;
  },
) {
  const response = await api.patch<PlatformClientDetail>(
    `/platform/clients/${publicId}/plan`,
    body,
  );
  return response.data;
}

export async function updateClientAccess(
  publicId: string,
  body: { accessMode: AccessMode; reason?: 'delinquency' | 'admin' },
) {
  const response = await api.patch<PlatformClientDetail>(
    `/platform/clients/${publicId}/access`,
    body,
  );
  return response.data;
}

export async function updateCourtVisibility(
  companyPublicId: string,
  courtPublicId: string,
  body: { show: boolean },
) {
  const response = await api.patch<PlatformClientDetail>(
    `/platform/clients/${companyPublicId}/courts/${courtPublicId}/visibility`,
    body,
  );
  return response.data;
}
