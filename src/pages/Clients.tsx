import { useEffect, useMemo, useState } from 'react';
import { MdOutlineFilterAlt, MdOutlineSearch } from 'react-icons/md';
import {
  listClients,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import { buttonClassName } from '../components/Button';
import EmptyState from '../components/EmptyState';
import FilterChip from '../components/FilterChip';
import FormSheet from '../components/FormSheet';
import { fieldOutlineClass } from '../components/Input';
import Select from '../components/Select';
import { ClientsListSkeleton } from '../components/Skeleton';
import Table, { TableCell, TableRow } from '../components/Table';
import { PageHeader } from '../components/PageTitle';
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

const CLIENTS_GRID =
  'lg:grid-cols-[minmax(0,1.6fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_6.5rem_9.5rem]';

function cityLabel(item: PlatformClientListItem) {
  const city = item.city?.trim();
  if (!city) return '—';
  const uf = item.uf?.trim();
  return uf ? `${city}/${uf}` : city;
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
  const [filtersOpen, setFiltersOpen] = useState(false);
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

  const activeFilters =
    (sort !== 'name' ? 1 : 0) + (status ? 1 : 0) + (city ? 1 : 0);

  const clearFilters = () => {
    setSort('name');
    setStatus('');
    setCity('');
  };

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Clientes">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
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
            <button
              type="button"
              onClick={() => setFiltersOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={filtersOpen}
              aria-label={
                activeFilters
                  ? `Filtros, ${activeFilters} ${activeFilters === 1 ? 'selecionado' : 'selecionados'}`
                  : 'Filtros'
              }
              className={buttonClassName({
                variant: activeFilters ? 'primary' : 'secondary',
                size: 'md',
                className: 'shrink-0 px-3',
              })}
            >
              <MdOutlineFilterAlt size={18} aria-hidden />
              Filtros
              {activeFilters ? (
                <span className="tabular-nums">{activeFilters}</span>
              ) : null}
            </button>
          </div>
          {activeFilters ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {sort !== 'name' ? (
                <FilterChip
                  label={
                    SORT_OPTIONS.find((option) => option.id === sort)?.name ||
                    'Ordenação'
                  }
                  onRemove={() => setSort('name')}
                />
              ) : null}
              {status ? (
                <FilterChip
                  label={SITUATION_LABEL[status]}
                  onRemove={() => setStatus('')}
                />
              ) : null}
              {city ? (
                <FilterChip
                  label={
                    cities.find((option) => option.id === city)?.name || city
                  }
                  onRemove={() => setCity('')}
                />
              ) : null}
            </div>
          ) : null}
        </PageHeader>

        <FormSheet
          isOpen={filtersOpen}
          title="Filtros"
          onClose={() => setFiltersOpen(false)}
        >
          <Select
            name="clientes-ordenar"
            title="Ordenar"
            value={sort}
            omitPlaceholder
            options={SORT_OPTIONS}
            onChange={(event) => setSort(event.target.value as SortId)}
          />
          <Select
            name="clientes-status"
            title="Status"
            value={status}
            omitPlaceholder
            options={STATUS_OPTIONS}
            onChange={(event) =>
              setStatus(event.target.value as '' | ClientSituation)
            }
          />
          <Select
            name="clientes-cidade"
            title="Cidade"
            value={city}
            omitPlaceholder
            options={[{ id: '', name: 'Todas as cidades' }, ...cities]}
            onChange={(event) => setCity(event.target.value)}
          />
          {activeFilters ? (
            <button
              type="button"
              onClick={clearFilters}
              className={buttonClassName({
                variant: 'ghost',
                fullWidth: true,
              })}
            >
              Limpar filtros
            </button>
          ) : null}
        </FormSheet>

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
            <Table
              columns={['Quadra', 'Cidade', 'Plano', 'Status', 'Último acesso']}
              gridClass={CLIENTS_GRID}
              className={loading ? 'opacity-60' : ''}
            >
              {visibleItems.map((item) => (
                <TableRow
                  key={`${item.kind}-${item.publicId}`}
                  to={`/clientes/${item.publicId}`}
                  gridClass={CLIENTS_GRID}
                  label={item.name}
                >
                  <TableCell>
                    <p className="truncate text-sm font-medium text-fg">
                      {item.name}
                    </p>
                    {item.accessMode === 'read_only' ? (
                      <p className="truncate text-xs text-fg-muted">
                        Acesso bloqueado por falta de pagamento
                      </p>
                    ) : null}
                  </TableCell>
                  <TableCell label="Cidade">
                    <p className="truncate text-sm text-fg">{cityLabel(item)}</p>
                  </TableCell>
                  <TableCell label="Plano">
                    <p className="truncate text-sm text-fg">
                      {item.plan?.name || '—'}
                    </p>
                  </TableCell>
                  <TableCell label="Status">
                    <SituationBadge situation={clientSituation(item)} />
                  </TableCell>
                  <TableCell label="Último acesso">
                    <p className="truncate text-sm tabular-nums text-fg-muted">
                      {formatDateTime(item.owner?.lastLoginAt)}
                    </p>
                  </TableCell>
                </TableRow>
              ))}
            </Table>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
