import { useEffect, useMemo, useState } from 'react';
import { MdOutlineSearch } from 'react-icons/md';
import {
  listClients,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import ListRow from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import { clientSituation } from '../utils/clientSituation';
import { formatDate, formatDateTime } from '../utils/format';

export default function ClientsPage() {
  const [items, setItems] = useState<PlatformClientListItem[]>([]);
  const [q, setQ] = useState('');
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
        setError('Não foi possível carregar os clientes.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const visibleItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return items;
    return items.filter((item) => {
      const haystack = [item.name, item.owner?.name, item.city, item.representative?.name]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, q]);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Clientes">
          <div className="relative">
            <label htmlFor="search" className="sr-only">
              Buscar cliente, arena ou dono
            </label>
            <input
              id="search"
              name="search"
              type="search"
              placeholder="Arena, dono ou cidade…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
              className="mpn-field h-10 w-full rounded-md border border-border bg-surface py-2 pe-11 ps-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
            />
            <span className="pointer-events-none absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-fg-muted">
              <MdOutlineSearch size={18} aria-hidden />
            </span>
          </div>
        </PageHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && items.length === 0 ? <ClientsListSkeleton /> : null}

          {!loading && visibleItems.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste a busca e tente de novo."
            />
          ) : null}

          {visibleItems.length > 0 ? (
            <ul
              className={`divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface transition-opacity ${
                loading ? 'opacity-60' : ''
              }`}
              aria-busy={loading}
            >
              {visibleItems.map((item) => {
                const courtsLabel =
                  item.kind === 'company'
                    ? ` · ${item.courtsCount} ${item.courtsCount === 1 ? 'quadra' : 'quadras'}`
                    : '';
                const trialLabel =
                  item.kind === 'company' && item.trialEndsAt
                    ? item.isTrial
                      ? `Trial até ${formatDate(item.trialEndsAt)} · `
                      : `Trial encerrou em ${formatDate(item.trialEndsAt)} · `
                    : '';

                return (
                  <li key={`${item.kind}-${item.publicId}`}>
                    <ListRow
                      to={`/clientes/${item.publicId}`}
                      title={item.name}
                      badge={<SituationBadge situation={clientSituation(item)} />}
                      subtitle={`${item.owner?.name || 'Sem dono'}${courtsLabel}`}
                      meta={`${trialLabel}Último acesso ${formatDateTime(item.owner?.lastLoginAt)}`}
                    />
                  </li>
                );
              })}
            </ul>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
