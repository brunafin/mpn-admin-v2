import { Navigate, Outlet } from 'react-router-dom';
import {
  getAccessToken,
  getAccessTokenPayload,
  type AdminTokenPayload,
} from '../utils/authCookie';

export const PLATFORM_ADMIN = 'platform_admin';
export const REPRESENTATIVE = 'representative';

export type PortalRole = typeof PLATFORM_ADMIN | typeof REPRESENTATIVE;

export function getPortalRole(): PortalRole | null {
  if (!getAccessToken()) return null;
  const payload = getAccessTokenPayload<AdminTokenPayload>();
  if (payload?.role === PLATFORM_ADMIN) return PLATFORM_ADMIN;
  if (payload?.role === REPRESENTATIVE) return REPRESENTATIVE;
  return null;
}

export function isPlatformAdminToken(): boolean {
  return getPortalRole() === PLATFORM_ADMIN;
}

export function isRepresentativeToken(): boolean {
  return getPortalRole() === REPRESENTATIVE;
}

export function isPlatformPortalToken(): boolean {
  return getPortalRole() != null;
}

/** Exige JWT de platform_admin ou representative. */
export default function ProtectedRoute() {
  if (!isPlatformPortalToken()) {
    return <Navigate to="/" replace />;
  }
  return <Outlet />;
}

/** Só a dona da plataforma. */
export function AdminOnlyRoute() {
  if (!isPlatformAdminToken()) {
    return <Navigate to="/inicio" replace />;
  }
  return <Outlet />;
}

/** Só o representante. */
export function SellerOnlyRoute() {
  if (!isRepresentativeToken()) {
    return <Navigate to="/inicio" replace />;
  }
  return <Outlet />;
}
