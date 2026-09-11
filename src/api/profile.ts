import api from './axios';

export type PortalProfile = {
  publicId: string;
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  role: string;
};

export type PortalProfileInput = {
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  cpf: string | null;
  cep: string | null;
  street: string | null;
  number: string | null;
  neighborhood: string | null;
  city: string | null;
  uf: string | null;
  password?: string;
};

export async function getProfile() {
  const response = await api.get<PortalProfile>('/profile');
  return response.data;
}

export async function updateProfile(body: PortalProfileInput) {
  const response = await api.patch<PortalProfile>('/profile', body);
  return response.data;
}
