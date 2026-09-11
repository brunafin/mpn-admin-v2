import api from './axios';

export async function login(username: string, password: string) {
  const response = await api.post('/auth/login', { username, password });
  return response.data as { access_token: string };
}

export async function portalForgotPassword(username: string, email: string) {
  const response = await api.post<{ message: string }>(
    '/auth/portal-forgot-password',
    { username, email },
  );
  return response.data;
}

export async function portalResetPassword(body: {
  username: string;
  email: string;
  code: string;
  newPassword: string;
}) {
  const response = await api.post<{ message: string }>(
    '/auth/portal-reset-password',
    body,
  );
  return response.data;
}
