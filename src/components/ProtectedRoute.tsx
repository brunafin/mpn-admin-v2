import { Navigate, Outlet } from 'react-router-dom';
import {
  getAccessToken,
  getAccessTokenPayload,
  type AdminTokenPayload,
} from '../utils/authCookie';

const PLATFORM_ADMIN = 'platform_admin';

export function isPlatformAdminToken(): boolean {
  if (!getAccessToken()) return false;
  const payload = getAccessTokenPayload<AdminTokenPayload>();
  return payload?.role === PLATFORM_ADMIN;
}

/** Exige JWT de platform_admin. */
export default function ProtectedRoute() {
  if (!isPlatformAdminToken()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}
