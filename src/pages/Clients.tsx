import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  MdOutlineChevronRight,
  MdOutlineSearch,
} from 'react-icons/md';
import {
  listClients,
  type PartnerStatus,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout from '../components/AppLayout';
import { cardClassName } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { ClientsListSkeleton } from '../components/Skeleton';
import { formatDate, formatDateTime } from '../utils/format';

export default function ClientsPage() {
  const [items, setItems] = useState<PlatformClientListItem[]>([]);
  const [q, setQ] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listClients({ sort: 'name', limit: 100 })
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Não foi possível carregar as quadras.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [item.name, item.owner?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, search]);

  function handleSearchSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSearch(q.trim());
  }

  return (
    <AppLayout>
      <section className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden bg-master text-text-light lg:max-w-5xl">
        <form
          onSubmit={handleSearchSubmit}
          className="shrink-0 px-4 pb-2 pt-3 lg:px-8 lg:pb-3 lg:pt-6"
        >
          <div className="relative">
            <label htmlFor="search" className="sr-only">
              Buscar arena ou dono
            </label>
            <input
              id="search"
              name="search"
              type="search"
              placeholder="Arena ou dono…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              enterKeyHint="search"
              autoComplete="off"
              className="mpn-field-dark w-full min-h-11 rounded-xl border-0 bg-master-light py-2.5 pe-12 ps-3.5 text-base font-medium text-text-light placeholder:font-normal placeholder:text-text-light/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-blue/80 focus-visible:ring-offset-2 focus-visible:ring-offset-master"
            />
            <button
              type="submit"
              aria-label="Buscar"
              className="mpn-tap absolute right-1.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-lg text-text-light/70 transition hover:bg-master hover:text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
            >
              <MdOutlineSearch size={22} aria-hidden />
            </button>
          </div>
        </form>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {error ? (
            <p
              className="mb-3 text-base font-medium text-danger-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loading && items.length === 0 ? <ClientsListSkeleton /> : null}

          {!loading && visibleItems.length === 0 ? (
            <EmptyState
              title="Nenhuma quadra encontrada"
              description="Ajuste a busca e tente de novo."
            />
          ) : null}

          {visibleItems.length > 0 ? (
            <ul
              className={`space-y-3 transition-opacity lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0 ${
                loading ? 'opacity-60' : ''
              }`}
              aria-busy={loading}
            >
              {visibleItems.map((item) => (
                <li key={`${item.kind}-${item.publicId}`}>
                  <Link
                    to={`/quadras/${item.publicId}`}
                    className={`mpn-tap flex min-h-[4.5rem] items-center gap-3 ${cardClassName} px-5 py-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex min-w-0 items-center gap-2">
                        <p className="min-w-0 truncate text-lg font-semibold leading-6 text-text-light">
                          {item.name}
                        </p>
                        <PartnerStatusPill status={item.partnerStatus} />
                      </div>

                      <p className="mt-1 truncate text-base leading-6 text-text-light/80">
                        {item.owner?.name || 'Sem dono'}
                        {item.kind === 'company' ? (
                          <span className="text-text-light/55">
                            {' '}
                            · {item.courtsCount}{' '}
                            {item.courtsCount === 1 ? 'quadra' : 'quadras'}
                          </span>
                        ) : null}
                      </p>

                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs leading-4 text-text-light/50">
                        {item.kind === 'company' && item.trialEndsAt ? (
                          <>
                            <span>
                              {item.isTrial
                                ? `Trial até ${formatDate(item.trialEndsAt)}`
                                : `Trial encerrou em ${formatDate(item.trialEndsAt)}`}
                            </span>
                            <span aria-hidden>·</span>
                          </>
                        ) : null}
                        <span>
                          Último acesso{' '}
                          {formatDateTime(item.owner?.lastLoginAt)}
                        </span>
                      </div>
                    </div>
                    <MdOutlineChevronRight
                      size={26}
                      className="shrink-0 text-text-light/35"
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}

function PartnerStatusPill({ status }: { status: PartnerStatus }) {
  const styles: Record<PartnerStatus, string> = {
    active: 'bg-accent-green/20 text-accent-green',
    onboarding: 'bg-accent-blue/20 text-accent-blue-soft',
    inactive: 'bg-text-light/10 text-text-light/55',
    expired: 'bg-warning-500/20 text-warning-500',
  };
  const labels: Record<PartnerStatus, string> = {
    active: 'Ativo',
    onboarding: 'Onboarding',
    inactive: 'Inativo',
    expired: 'Expirado',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}
