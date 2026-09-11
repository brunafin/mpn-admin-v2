import api from './axios';

export type CostRecurrence = 'monthly' | 'yearly' | 'once';

export type Cost = {
  id: number;
  description: string;
  amount: number;
  recurrence: CostRecurrence;
  monthlyEquivalent: number;
  createdAt: string;
  updatedAt: string;
};

export type CostInput = {
  description: string;
  amount: number;
  recurrence: CostRecurrence;
};

export async function listCosts() {
  const response = await api.get<Cost[]>('/costs');
  return response.data;
}

export async function createCost(body: CostInput) {
  const response = await api.post<Cost>('/costs', body);
  return response.data;
}

export async function updateCost(id: number, body: Partial<CostInput>) {
  const response = await api.patch<Cost>(`/costs/${id}`, body);
  return response.data;
}

export async function deleteCost(id: number) {
  const response = await api.delete<{ ok: true }>(`/costs/${id}`);
  return response.data;
}
