import Cookies from 'js-cookie';
import { jwtDecode } from 'jwt-decode';

const COOKIE_NAME = 'access_token';

function cookieOptions() {
  const secure =
    typeof window !== 'undefined' && window.location.protocol === 'https:';
  return {
    path: '/',
    secure,
    sameSite: 'strict' as const,
  };
}

export function setAccessToken(token: string) {
  Cookies.set(COOKIE_NAME, token, cookieOptions());
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
  const opts = cookieOptions();
  Cookies.remove(COOKIE_NAME, { path: '/' });
  Cookies.remove(COOKIE_NAME, opts);
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
