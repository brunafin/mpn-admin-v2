import api from './axios';

export type DelinquencyPolicy = {
  blockAfterDays: number;
  updatedAt: string;
  blocked?: number;
  released?: number;
};

export async function getDelinquencyPolicy() {
  const response = await api.get<DelinquencyPolicy>('/platform/delinquency');
  return response.data;
}

export async function updateDelinquencyPolicy(blockAfterDays: number) {
  const response = await api.patch<DelinquencyPolicy>('/platform/delinquency', {
    blockAfterDays,
  });
  return response.data;
}
