import { useEffect, useMemo, useState } from 'react';
import { MdOutlineSearch } from 'react-icons/md';
import {
  listClients,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import EmptyState from '../components/EmptyState';
import { fieldOutlineClass } from '../components/Input';
import ListRow, { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import {
  clientSituation,
  SITUATION_LABEL,
  type ClientSituation,
} from '../utils/clientSituation';
import { formatDateTime } from '../utils/format';

type SortId = 'name' | 'last_login';

const SORT_OPTIONS: Array<{ id: SortId; name: string }> = [
  { id: 'name', name: 'Quadra' },
  { id: 'last_login', name: 'Último acesso' },
];

const STATUS_OPTIONS: Array<{ id: '' | ClientSituation; name: string }> = [
  { id: '', name: 'Todos os status' },
  { id: 'active', name: SITUATION_LABEL.active },
  { id: 'trial', name: SITUATION_LABEL.trial },
  { id: 'expired', name: SITUATION_LABEL.expired },
  { id: 'inactive', name: SITUATION_LABEL.inactive },
  { id: 'onboarding', name: SITUATION_LABEL.onboarding },
];

async function fetchAllClients() {
  const limit = 100;
  const first = await listClients({ page: 1, limit, sort: 'name' });
  const items = [...first.items];
  const pages = Math.ceil(first.total / limit);
  if (pages <= 1) return items;
  const rest = await Promise.all(
    Array.from({ length: pages - 1 }, (_, index) =>
      listClients({ page: index + 2, limit, sort: 'name' }),
    ),
  );
  for (const page of rest) items.push(...page.items);
  return items;
}

function lastAccessTime(item: PlatformClientListItem) {
  const value = item.owner?.lastLoginAt;
  if (!value) return null;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

export default function ClientsPage() {
  const [items, setItems] = useState<PlatformClientListItem[]>([]);
  const [q, setQ] = useState('');
  const [sort, setSort] = useState<SortId>('name');
  const [status, setStatus] = useState<'' | ClientSituation>('');
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    fetchAllClients()
      .then((data) => {
        if (cancelled) return;
        setItems(data);
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

  const cities = useMemo(() => {
    const unique = new Map<string, string>();
    for (const item of items) {
      const name = item.city?.trim();
      if (!name) continue;
      const uf = item.uf?.trim() || '';
      const id = uf ? `${name}|${uf}` : name;
      unique.set(id, uf ? `${name}/${uf}` : name);
    }
    return [...unique.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) =>
        a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
      );
  }, [items]);

  const visibleItems = useMemo(() => {
    const term = q.trim().toLowerCase();
    const [cityName, cityUf = ''] = city.split('|');
    const filtered = items.filter((item) => {
      if (status && clientSituation(item) !== status) return false;
      if (city) {
        if ((item.city?.trim() || '') !== cityName) return false;
        if ((item.uf?.trim() || '') !== cityUf) return false;
      }
      if (!term) return true;
      return (item.owner?.name || '').toLowerCase().includes(term);
    });
    return [...filtered].sort((a, b) => {
      if (sort === 'last_login') {
        const aTime = lastAccessTime(a);
        const bTime = lastAccessTime(b);
        if (aTime == null && bTime == null) {
          return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
        }
        if (aTime == null) return 1;
        if (bTime == null) return -1;
        return bTime - aTime;
      }
      return a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' });
    });
  }, [items, q, sort, status, city]);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Clientes">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
            <div className="relative">
              <label htmlFor="gerente" className="sr-only">
                Buscar pelo gerente
              </label>
              <input
                id="gerente"
                name="gerente"
                type="search"
                placeholder="Gerente"
                value={q}
                onChange={(event) => setQ(event.target.value)}
                autoComplete="off"
                className={`${fieldOutlineClass} w-full pe-11`}
              />
              <span className="pointer-events-none absolute right-0.5 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center text-fg-muted">
                <MdOutlineSearch size={18} aria-hidden />
              </span>
            </div>
            <label className="block">
              <span className="sr-only">Ordenar</span>
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value as SortId)}
                className={`${fieldOutlineClass} w-full`}
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Filtrar por status</span>
              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value as '' | ClientSituation)
                }
                className={`${fieldOutlineClass} w-full`}
              >
                {STATUS_OPTIONS.map((option) => (
                  <option key={option.id || 'all'} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="sr-only">Filtrar por cidade</span>
              <select
                value={city}
                onChange={(event) => setCity(event.target.value)}
                className={`${fieldOutlineClass} w-full`}
              >
                <option value="">Todas as cidades</option>
                {cities.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.name}
                  </option>
                ))}
              </select>
            </label>
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
              description="Ajuste a busca ou os filtros e tente de novo."
            />
          ) : null}

          {visibleItems.length > 0 ? (
            <ul className={listClassName} aria-busy={loading}>
              {visibleItems.map((item) => (
                <li key={`${item.kind}-${item.publicId}`}>
                  <ListRow
                    to={`/clientes/${item.publicId}`}
                    title={item.name}
                    badge={
                      <SituationBadge situation={clientSituation(item)} />
                    }
                    meta={`Último acesso ${formatDateTime(item.owner?.lastLoginAt)}`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
