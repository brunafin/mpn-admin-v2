import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineLogout, MdOutlinePerson } from 'react-icons/md';
import { ADMIN_LOGO_URL } from '../../constants/brand';
import { ADMIN_NAV, SELLER_NAV, navItemClass } from '../../constants/nav';
import {
  getAccessTokenPayload,
  logoutAndRedirect,
  type AdminTokenPayload,
} from '../../utils/authCookie';
import Header from '../Header';
import { isRepresentativeToken } from '../ProtectedRoute';

export const PAGE_SHELL =
  'flex min-h-0 w-full min-w-0 flex-1 flex-col overflow-hidden bg-canvas text-fg';

/** Barra de voltar. Fica no chão, sem faixa nem linha. */
export const BACK_BAR =
  'flex shrink-0 items-center gap-1 px-2 py-1.5 lg:px-6';

/** Único título da subpágina. O nome não se repete no corpo. */
export const BACK_TITLE =
  'min-w-0 flex-1 truncate text-lg font-semibold tracking-tight text-fg';

type AppLayoutProps = {
  children: ReactNode;
};

function portalUsername() {
  return getAccessTokenPayload<AdminTokenPayload>()?.username?.trim() || '';
}

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const nav = isRepresentativeToken() ? SELLER_NAV : ADMIN_NAV;
  const username = portalUsername();
  const profileActive = location.pathname === '/perfil';

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-canvas">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 flex-col bg-surface shadow-[4px_0_16px_rgb(0_0_0/0.04)] lg:flex">
          <div className="px-3 py-4">
            <Link
              to="/inicio"
              aria-label="MPN Admin — início"
              className="flex min-w-0 items-center gap-2.5"
            >
              <img
                src={ADMIN_LOGO_URL}
                alt=""
                className="size-8 shrink-0 object-contain"
              />
              <span className="truncate text-sm font-semibold tracking-tight text-fg">
                MPN Admin
              </span>
            </Link>
          </div>

          <nav aria-label="Navegação principal" className="flex-1 px-2 py-1">
            <ul className="flex flex-col gap-0.5">
              {nav.map((item) => {
                const { to, label, Icon, match } = item;
                const separated = 'separated' in item && item.separated;
                const isActive = match(location.pathname);
                return (
                  <li key={to}>
                    {separated ? (
                      <p className="px-2.5 pb-1 pt-4 text-xs font-medium text-fg-muted">
                        Sistema
                      </p>
                    ) : null}
                    <Link
                      to={to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition ${navItemClass(isActive)}`}
                    >
                      <Icon size={18} className="shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="flex flex-col gap-0.5 p-2">
            <Link
              to="/perfil"
              aria-current={profileActive ? 'page' : undefined}
              className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition ${navItemClass(profileActive)}`}
            >
              <MdOutlinePerson size={18} className="shrink-0" aria-hidden />
              <span className="truncate">{username || 'Perfil'}</span>
            </Link>
            <button
              type="button"
              className={`flex h-9 w-full items-center gap-2.5 rounded-md px-2.5 text-sm transition ${navItemClass(false)}`}
              onClick={() => {
                void logoutAndRedirect();
              }}
            >
              <MdOutlineLogout size={16} aria-hidden />
              Sair
            </button>
          </div>
        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <Header />
          {children}
        </div>
      </div>
    </div>
  );
}

export default AppLayout;
