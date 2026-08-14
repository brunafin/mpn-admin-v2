import type { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdOutlineDashboard, MdOutlineLogout, MdOutlinePayments, MdOutlineSportsTennis } from 'react-icons/md';
import { ADMIN_LOGO_URL } from '../../constants/brand';
import { logoutAndRedirect } from '../../utils/authCookie';
import Header from '../Header';

type NavItem = {
  to: string;
  label: string;
  Icon: typeof MdOutlineDashboard;
  match: (path: string) => boolean;
  activeClass: string;
  idleClass: string;
};

const navItems: NavItem[] = [
  {
    to: '/inicio',
    label: 'Início',
    Icon: MdOutlineDashboard,
    match: (path) => path === '/inicio',
    activeClass: 'bg-accent-blue/12 text-accent-blue',
    idleClass: 'text-text-light/70 hover:bg-accent-blue/8 hover:text-accent-blue',
  },
  {
    to: '/quadras',
    label: 'Quadras',
    Icon: MdOutlineSportsTennis,
    match: (path) => path === '/quadras' || path.startsWith('/quadras/'),
    activeClass: 'bg-accent-green/12 text-accent-green',
    idleClass: 'text-text-light/70 hover:bg-accent-green/8 hover:text-accent-green',
  },
  {
    to: '/planos',
    label: 'Planos',
    Icon: MdOutlinePayments,
    match: (path) => path === '/planos' || path.startsWith('/planos/'),
    activeClass: 'bg-accent-purple/12 text-accent-purple-soft',
    idleClass: 'text-text-light/70 hover:bg-accent-purple/8 hover:text-accent-purple-soft',
  },
];

type AppLayoutProps = {
  children: ReactNode;
};

function AppLayout({ children }: AppLayoutProps) {
  const location = useLocation();

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-master">
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <aside className="hidden w-56 shrink-0 flex-col bg-master-light lg:flex">
          <div className="flex items-center px-4 py-5">
            <Link
              to="/inicio"
              aria-label="MPN Admin — início"
              className="flex size-14 shrink-0 items-center justify-center focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <img
                src={ADMIN_LOGO_URL}
                alt=""
                className="size-full object-contain"
              />
            </Link>
          </div>

          <nav aria-label="Navegação principal" className="flex-1 px-3 py-2">
            <ul className="flex flex-col gap-1">
              {navItems.map(({ to, label, Icon, match, activeClass, idleClass }) => {
                const isActive = match(location.pathname);
                return (
                  <li key={to}>
                    <Link
                      to={to}
                      aria-current={isActive ? 'page' : undefined}
                      className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue ${
                        isActive ? activeClass : idleClass
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

          <div className="p-3">
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
