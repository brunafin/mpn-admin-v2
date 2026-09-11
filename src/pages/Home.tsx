import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getDashboard, type PlatformDashboard } from '../api/dashboard';
import {
  listClients,
  type PlatformClientListItem,
} from '../api/clients';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import Card, { CardLabel } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { PageHeader } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import {
  clientSituation,
  SITUATION_LABEL,
  type ClientSituation,
} from '../utils/clientSituation';
import { formatMinutesAgo, formatPhone } from '../utils/format';
import { whatsappUrl } from '../utils/whatsapp';
import { isRepresentativeToken } from '../components/ProtectedRoute';
import SellerHomePage from './SellerHome';

const emptyDashboard: PlatformDashboard = {
  clients: 0,
  arenas: 0,
  arenaOwners: 0,
  activeArenas: 0,
  trialArenas: 0,
  expiredArenas: 0,
  onboarding: 0,
  monthlyRevenue: 0,
  receivedThisMonth: 0,
  reservationsToday: 0,
  reservationsLast7Days: 0,
  arenasActiveThisWeek: 0,
  trialsEndingSoon: [],
  recentLogins: [],
  lastHourLogins: [],
};

const SITUATION_FILTERS: Array<{ id: '' | ClientSituation; name: string }> = [
  { id: '', name: 'Todas' },
  { id: 'active', name: SITUATION_LABEL.active },
  { id: 'trial', name: SITUATION_LABEL.trial },
  { id: 'expired', name: SITUATION_LABEL.expired },
];

const filterSelectClass =
  'h-10 w-full appearance-none rounded-md border border-border bg-surface px-3 pr-8 text-sm text-fg focus:outline-none focus-visible:ring-1 focus-visible:ring-fg';

export default function HomePage() {
  if (isRepresentativeToken()) {
    return <SellerHomePage />;
  }
  return <AdminHomePage />;
}

function AdminHomePage() {
  const [stats, setStats] = useState<PlatformDashboard>(emptyDashboard);
  const [items, setItems] = useState<PlatformClientListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [nameQuery, setNameQuery] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [situationFilter, setSituationFilter] = useState<'' | ClientSituation>(
    '',
  );

  useEffect(() => {
    let cancelled = false;

    const load = (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setError('');
      }
      Promise.all([
        getDashboard(),
        listClients({ sort: 'name', limit: 100 }),
      ])
        .then(([dashboard, clients]) => {
          if (cancelled) return;
          setStats(dashboard);
          setItems(clients.items.filter((item) => item.kind === 'company'));
          setError('');
        })
        .catch(() => {
          if (cancelled) return;
          if (!opts?.silent) {
            setError('Não foi possível carregar o dashboard.');
          }
        })
        .finally(() => {
          if (!cancelled && !opts?.silent) setLoading(false);
        });
    };

    load();

    const onVisible = () => {
      if (document.visibilityState === 'visible') load({ silent: true });
    };
    document.addEventListener('visibilitychange', onVisible);

    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const cities = useMemo(() => {
    const unique = new Set<string>();
    for (const item of items) {
      const city = item.city?.trim();
      if (city) unique.add(city);
    }
    return [...unique].sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { sensitivity: 'base' }),
    );
  }, [items]);

  const visibleItems = useMemo(() => {
    const term = nameQuery.trim().toLowerCase();
    return items.filter((item) => {
      if (cityFilter && (item.city || '') !== cityFilter) return false;
      const situation = clientSituation(item);
      if (situationFilter && situation !== situationFilter) return false;
      if (!term) return true;
      const haystack = [
        item.name,
        item.owner?.name,
        item.representative?.name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [items, nameQuery, cityFilter, situationFilter]);

  const metrics = [
    { label: 'Clientes', value: stats.arenas },
    { label: 'Ativos', value: stats.activeArenas },
    { label: 'Trial', value: stats.trialArenas },
    { label: 'Expirados', value: stats.expiredArenas },
  ];

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Início" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {error ? (
            <p className="mb-4 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading ? (
            <HomeSkeleton />
          ) : (
            <div className="space-y-8">
              <section aria-labelledby="resumo-heading">
                <CardLabel id="resumo-heading" as="h2">
                  Clientes
                </CardLabel>
                <MetricGrid items={metrics} className="mt-2" />
              </section>

              <section aria-labelledby="online-heading">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <CardLabel id="online-heading">
                    Acesso na última hora
                  </CardLabel>
                  <p className="text-sm tabular-nums text-fg-muted">
                    {stats.lastHourLogins?.length ?? 0}
                  </p>
                </div>
                {stats.lastHourLogins?.length ? (
                  <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                    {stats.lastHourLogins.map((item) => (
                      <li key={`${item.publicId}-${item.lastLoginAt}`}>
                        <Link
                          to={`/clientes/${item.publicId}`}
                          className="mpn-tap flex items-baseline justify-between gap-3 px-4 py-2.5 hover:bg-canvas focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-fg"
                        >
                          <span className="min-w-0 truncate text-sm text-fg">
                            {item.arenaName ? (
                              <>
                                {item.arenaName}
                                <span className="text-fg-muted">
                                  {' '}
                                  · {item.ownerName}
                                </span>
                              </>
                            ) : (
                              item.ownerName
                            )}
                          </span>
                          <span className="shrink-0 text-xs tabular-nums text-fg-muted">
                            {formatMinutesAgo(item.lastLoginAt)}
                          </span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-fg-muted">
                    Ninguém acessou na última hora.
                  </p>
                )}
              </section>

              <section aria-labelledby="lista-heading">
                <CardLabel id="lista-heading">Lista de clientes</CardLabel>

                <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <label className="block">
                    <span className="sr-only">Filtrar por nome</span>
                    <input
                      type="search"
                      value={nameQuery}
                      onChange={(event) => setNameQuery(event.target.value)}
                      placeholder="Arena, dono ou representante"
                      autoComplete="off"
                      className="mpn-field h-10 w-full rounded-md border border-border bg-surface px-3 text-sm text-fg placeholder:text-fg-muted focus:outline-none focus-visible:ring-1 focus-visible:ring-fg"
                    />
                  </label>
                  <label className="block">
                    <span className="sr-only">Filtrar por cidade</span>
                    <select
                      value={cityFilter}
                      onChange={(event) => setCityFilter(event.target.value)}
                      className={filterSelectClass}
                    >
                      <option value="">Todas as cidades</option>
                      {cities.map((city) => (
                        <option key={city} value={city}>
                          {city}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block">
                    <span className="sr-only">Filtrar por situação</span>
                    <select
                      value={situationFilter}
                      onChange={(event) =>
                        setSituationFilter(
                          event.target.value as '' | ClientSituation,
                        )
                      }
                      className={filterSelectClass}
                    >
                      {SITUATION_FILTERS.map((option) => (
                        <option key={option.id || 'all'} value={option.id}>
                          {option.name === 'Todas'
                            ? 'Todas as situações'
                            : option.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>

                {visibleItems.length === 0 ? (
                  <EmptyState
                    title="Nenhum cliente encontrado"
                    description="Ajuste os filtros e tente de novo."
                    className="py-10"
                  />
                ) : (
                  <div className="mt-3 overflow-hidden rounded-lg border border-border bg-surface">
                    <div className="hidden border-b border-border bg-canvas px-4 py-2 text-xs font-medium text-fg-muted lg:grid lg:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1.6fr)_5.5rem_7.5rem] lg:gap-3">
                      <span>Quadra</span>
                      <span>Cidade</span>
                      <span>Dono</span>
                      <span>Situação</span>
                      <span>Representante</span>
                    </div>
                    <ul className="divide-y divide-border">
                      {visibleItems.map((item) => (
                        <ClientRow key={item.publicId} item={item} />
                      ))}
                    </ul>
                  </div>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

function ClientRow({ item }: { item: PlatformClientListItem }) {
  const situation = clientSituation(item);
  const city = item.city?.trim() || '—';
  const ownerName = item.owner?.name?.trim() || 'Sem dono';
  const phoneLabel = formatPhone(item.owner?.phone);
  const wpp = whatsappUrl(item.owner?.phone);
  const representative = item.representative?.name?.trim() || '—';

  return (
    <li>
      <div className="grid grid-cols-1 gap-1 px-4 py-3 lg:grid-cols-[minmax(0,1.4fr)_8rem_minmax(0,1.6fr)_5.5rem_7.5rem] lg:items-center lg:gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            to={`/clientes/${item.publicId}`}
            className="min-w-0 truncate text-sm font-medium text-fg underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            {item.name}
          </Link>
          <span className="lg:hidden">
            <SituationBadge situation={situation} />
          </span>
        </div>
        <p className="truncate text-sm text-fg-muted lg:text-fg">{city}</p>
        <div className="min-w-0 text-sm text-fg">
          <span className="truncate">{ownerName}</span>
          {wpp ? (
            <>
              <span className="text-fg-muted"> · </span>
              <a
                href={wpp}
                target="_blank"
                rel="noreferrer"
                aria-label={`WhatsApp de ${ownerName} — ${phoneLabel}`}
                className="text-fg underline-offset-2 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
              >
                {phoneLabel}
              </a>
            </>
          ) : (
            <span className="text-fg-muted"> · {phoneLabel}</span>
          )}
        </div>
        <div className="hidden lg:block">
          <SituationBadge situation={situation} />
        </div>
        <p className="truncate text-sm text-fg-muted">
          <span className="lg:hidden">Representante · </span>
          {representative}
        </p>
      </div>
    </li>
  );
}

function MetricGrid({
  items,
  className = '',
}: {
  items: { label: string; value: number }[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <div key={item.label} className="bg-surface px-4 py-3">
          <p className="text-xs text-fg-muted">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
            {item.value}
          </p>
        </div>
      ))}
    </div>
  );
}

function HomeSkeleton() {
  return (
    <div className="space-y-8" aria-label="Carregando indicadores" aria-busy="true">
      <Card className="animate-pulse">
        <span className="block h-3 w-16 rounded-md bg-border" />
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <span className="block h-3 w-12 rounded-md bg-border" />
              <span className="block h-6 w-10 rounded-md bg-border" />
            </div>
          ))}
        </div>
      </Card>
      <ClientsListSkeleton count={4} />
    </div>
  );
}
