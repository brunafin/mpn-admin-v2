import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineLogout } from 'react-icons/md';
import { ADMIN_LOGO_URL } from '../../constants/brand';
import { ADMIN_NAV, SELLER_NAV } from '../../constants/nav';
import { logoutAndRedirect } from '../../utils/authCookie';
import Header from '../Header';
import { isRepresentativeToken } from '../ProtectedRoute';

export const PAGE_SHELL =
  'mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col overflow-hidden bg-canvas text-fg';

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();
  const nav = isRepresentativeToken() ? SELLER_NAV : ADMIN_NAV;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-canvas">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-border bg-surface lg:flex">
          <div className="flex items-center px-4 py-4">
            <Link
              to="/inicio"
              aria-label="MPN Admin — início"
              className="flex size-10 shrink-0 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
            >
              <img
                src={ADMIN_LOGO_URL}
                alt=""
                className="size-full object-contain"
              />
            </Link>
          </div>

          <nav aria-label="Navegação principal" className="flex-1 px-2 py-1">
            <ul className="flex flex-col gap-0.5">
              {nav.map(({ to, label, Icon, match }) => {
                const isActive = match(location.pathname);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg ${
                        isActive
                          ? 'bg-canvas font-medium text-fg'
                          : 'font-normal text-fg-muted hover:bg-canvas hover:text-fg'
                      }`}
                    >
                      <Icon size={18} className="shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-border p-2">
            <button
              type="button"
              className="flex h-9 w-full items-center justify-center gap-2 rounded-md px-2.5 text-sm text-fg-muted transition hover:bg-canvas hover:text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
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
