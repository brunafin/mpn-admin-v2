import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineGroups, MdOutlineLogout, MdOutlinePayments } from 'react-icons/md';
import { ADMIN_LOGO_URL } from '../../constants/brand';
import { logoutAndRedirect } from '../../utils/authCookie';
import Header from '../Header';

type NavItem = {
  to: string;
  label: string;
  Icon: typeof MdOutlineGroups;
  match: (path: string) => boolean;
};

const navItems: NavItem[] = [
  {
    to: '/clientes',
    label: 'Clientes',
    Icon: MdOutlineGroups,
    match: (path) => path === '/clientes' || path.startsWith('/clientes/'),
  },
  {
    to: '/planos',
    label: 'Planos',
    Icon: MdOutlinePayments,
    match: (path) => path === '/planos' || path.startsWith('/planos/'),
  },
];

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex min-h-dvh flex-col bg-master lg:h-dvh lg:overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-text-light/10 bg-master-light lg:flex">
          <div className="flex items-center gap-3 px-4 py-5">
            <Link
              to="/clientes"
              className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <img
                src={ADMIN_LOGO_URL}
                alt="MPN Admin"
                className="size-full object-contain"
              />
            </Link>
            <div className="min-w-0">
              <p className="text-xs font-semibold uppercase tracking-wider text-text-light/50">
                Plataforma
              </p>
              <p className="truncate text-sm font-semibold text-text-light">
                MPN Admin
              </p>
            </div>
          </div>

          <nav aria-label="Navegação principal" className="flex-1 px-3 py-2">
            <ul className="flex flex-col gap-1">
              {navItems.map(({ to, label, Icon, match }) => {
                const isActive = match(location.pathname);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                        isActive
                          ? 'bg-accent-blue text-white shadow-[0_0_0_1px_rgba(37,84,160,0.45)]'
                          : 'text-text-light/70 hover:bg-text-light/10 hover:text-text-light'
                      }`}
                    >
                      <Icon size={20} className="shrink-0" aria-hidden />
                      <span className="truncate">{label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          <div className="border-t border-text-light/10 p-3">
            <button
              type="button"
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold text-text-light/70 transition hover:bg-text-light/10 hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
              onClick={() => {
                void logoutAndRedirect();
              }}
            >
              <MdOutlineLogout size={18} aria-hidden />
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
