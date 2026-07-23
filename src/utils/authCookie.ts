import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const COOKIE_NAME = 'access_token';

const cookieOptions = {
  path: '/',
  secure: true,
  sameSite: 'strict' as const,
};

export function setAccessToken(token: string) {
  Cookies.set(COOKIE_NAME, token, cookieOptions);
}

export function getAccessToken(): string | undefined {
  return Cookies.get(COOKIE_NAME);
}

export function getAccessTokenPayload<T = Record<string, unknown>>(): T | null {
  const token = getAccessToken();
  if (!token) return null;
  try {
    return jwtDecode<T>(token);
  } catch {
    return null;
  }
}

export function clearAccessToken() {
  Cookies.remove(COOKIE_NAME, { path: '/' });
  Cookies.remove(COOKIE_NAME, cookieOptions);
}

export function logoutAndRedirect() {
  clearAccessToken();
  window.location.replace('/');
}

export type AdminTokenPayload = {
  sub?: string;
  username?: string;
  role?: string;
};
