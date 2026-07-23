import api from './axios';

export async function login(username: string, password: string) {
  const response = await api.post('/auth/login', { username, password });
  return response.data as { access_token: string };
}
