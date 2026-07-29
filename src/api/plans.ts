import api from './axios';

export type Plan = {
  id: number;
  name: string;
  description: string;
  basePrice: number;
  pricePerCourt: number;
  isSystem: boolean;
  /** Plano FREE do trial de 2 meses. */
  isTrialPlan: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PlanInput = {
  name: string;
  description: string;
  basePrice: number;
  pricePerCourt: number;
};

export async function listPlans() {
  const response = await api.get<Plan[]>('/plans');
  return response.data;
}

export async function createPlan(body: PlanInput) {
  const response = await api.post<Plan>('/plans', body);
  return response.data;
}

export async function updatePlan(id: number, body: Partial<PlanInput>) {
  const response = await api.patch<Plan>(`/plans/${id}`, body);
  return response.data;
}

export async function deletePlan(id: number) {
  const response = await api.delete<{ ok: true }>(`/plans/${id}`);
  return response.data;
}
