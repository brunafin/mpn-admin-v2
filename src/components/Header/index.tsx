import { useEffect, useId, useRef, useState } from 'react';
import { MdClose, MdMenu, MdOutlineLogout, MdOutlinePerson } from 'react-icons/md';
import { Link, useLocation } from 'react-router-dom';
import { ADMIN_LOGO_URL } from '../../constants/brand';
import { ADMIN_NAV, SELLER_NAV, navItemClass } from '../../constants/nav';
import {
  getAccessTokenPayload,
  logoutAndRedirect,
  type AdminTokenPayload,
} from '../../utils/authCookie';
import { isRepresentativeToken } from '../ProtectedRoute';

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const titleId = useId();
  const location = useLocation();
  const nav = isRepresentativeToken() ? SELLER_NAV : ADMIN_NAV;
  const username =
    getAccessTokenPayload<AdminTokenPayload>()?.username?.trim() || '';
  const profileActive = location.pathname === '/perfil';

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!menuOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const focusTimer = window.setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', onKeyDown);
      window.clearTimeout(focusTimer);
    };
  }, [menuOpen]);

  return (
    <header className="sticky top-0 z-20 flex h-12 shrink-0 items-center justify-between gap-3 bg-surface px-4 shadow-[0_4px_16px_rgb(0_0_0/0.04)] lg:hidden">
      <Link
        to="/inicio"
        aria-label="MPN Admin — início"
        className="flex min-w-0 items-center gap-2"
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

      <button
        type="button"
        aria-label="Abrir menu"
        aria-expanded={menuOpen}
        aria-haspopup="dialog"
        onClick={() => setMenuOpen(true)}
        className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-md text-fg transition hover:bg-arena-hover"
      >
        <MdMenu size={22} aria-hidden />
      </button>

      {menuOpen && (
        <div
          className="fixed inset-0 z-40 flex justify-end"
          role="presentation"
        >
          <button
            type="button"
            aria-label="Fechar menu"
            className="absolute inset-0 bg-black/40"
            onClick={() => setMenuOpen(false)}
          />

          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 flex h-full w-[min(100%,18rem)] flex-col bg-surface text-fg shadow-[-8px_0_24px_rgb(0_0_0/0.08)]"
          >
            <div className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="flex min-w-0 items-center gap-2">
                <img
                  src={ADMIN_LOGO_URL}
                  alt=""
                  className="size-8 shrink-0 object-contain"
                />
                <span className="truncate text-sm font-semibold tracking-tight text-fg">
                  MPN Admin
                </span>
              </div>
              <h2 id={titleId} className="sr-only">
                Menu da plataforma
              </h2>
              <button
                ref={closeButtonRef}
                type="button"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar"
                className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-md text-fg-muted hover:bg-arena-hover hover:text-fg"
              >
                <MdClose size={22} aria-hidden />
              </button>
            </div>

            <nav
              aria-label="Menu principal"
              className="flex-1 overflow-y-auto px-2 py-3"
            >
              <ul className="flex flex-col gap-0.5">
                {nav.map((item) => {
                  const { to, label, description, Icon, match } = item;
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
                        className={`flex min-h-11 items-center gap-3 rounded-md px-2.5 py-2 transition ${navItemClass(isActive)}`}
                      >
                        <Icon size={18} className="shrink-0" aria-hidden />
                        <span className="min-w-0">
                          <span className="block text-sm font-medium">
                            {label}
                          </span>
                          <span className="block truncate text-xs opacity-80">
                            {description}
                          </span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>

            <div className="flex flex-col gap-0.5 p-2 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
              <Link
                to="/perfil"
                aria-current={profileActive ? 'page' : undefined}
                className={`flex min-h-11 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition ${navItemClass(profileActive)}`}
              >
                <MdOutlinePerson size={18} className="shrink-0" aria-hidden />
                <span className="truncate">{username || 'Perfil'}</span>
              </Link>
              <button
                type="button"
                className={`flex h-10 w-full items-center gap-3 rounded-md px-2.5 text-sm transition ${navItemClass(false)}`}
                onClick={() => {
                  void logoutAndRedirect();
                }}
              >
                <MdOutlineLogout size={16} aria-hidden />
                Sair
              </button>
            </div>
          </aside>
        </div>
      )}
    </header>
  );
}

export default Header;
