import api from './axios';

export type SiteMaintenance = {
  maintenance: boolean;
  message: string | null;
  updatedAt: string;
};

export async function getMaintenance() {
  const response = await api.get<SiteMaintenance>('/platform/maintenance');
  return response.data;
}

export async function updateMaintenance(body: {
  maintenance: boolean;
  message?: string | null;
}) {
  const response = await api.patch<SiteMaintenance>(
    '/platform/maintenance',
    body,
  );
  return response.data;
}
