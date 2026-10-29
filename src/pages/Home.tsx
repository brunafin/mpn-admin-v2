import { useEffect, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboard,
  type DashboardOverdueClient,
  type DashboardTrialEndingSoon,
  type PlatformDashboard,
} from '../api/dashboard';
import {
  listProspectCities,
  listProspects,
  PLACE_KIND_LABEL,
  updateProspect,
  type GoogleCourtProspect,
  type ProspectCity,
} from '../api/prospects';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { buttonClassName } from '../components/Button';
import { CardLabel, metricTileClass, surfaceShadowClass } from '../components/Card';
import { SurfaceEmpty } from '../components/EmptyState';
import { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import Select from '../components/Select';
import {
  formatCalendarDate,
  formatCurrency,
  formatDate,
  formatMinutesAgo,
  todayKeyBrazil,
} from '../utils/format';
import {
  paymentReminderMessage,
  prospectOutreachMessage,
  trialActivationMessage,
  whatsappUrlWithText,
} from '../utils/whatsapp';
import {
  parseWeekCityKey,
  readWeekCity,
  weekCityKey,
  writeWeekCity,
  type WeekCity,
} from '../utils/weekCity';
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
  overdueClients: [],
};

export default function HomePage() {
  if (isRepresentativeToken()) {
    return <SellerHomePage />;
  }
  return <AdminHomePage />;
}

function AdminHomePage() {
  const [stats, setStats] = useState<PlatformDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [queue, setQueue] = useState<WorkQueue>('cobrar');
  const [weekCity, setWeekCity] = useState<WeekCity | null>(readWeekCity);
  const [cities, setCities] = useState<ProspectCity[]>([]);
  const [approach, setApproach] = useState<GoogleCourtProspect[]>([]);
  const [approachTotal, setApproachTotal] = useState(0);
  const [approachLoading, setApproachLoading] = useState(false);
  const [approachError, setApproachError] = useState('');

  useEffect(() => {
    let cancelled = false;

    const load = (opts?: { silent?: boolean }) => {
      if (!opts?.silent) {
        setLoading(true);
        setError('');
      }
      getDashboard()
        .then((dashboard) => {
          if (cancelled) return;
          setStats(dashboard);
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

  useEffect(() => {
    let cancelled = false;
    listProspectCities()
      .then((rows) => {
        if (!cancelled) setCities(rows);
      })
      .catch(() => {
        if (!cancelled) setCities([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!weekCity) return;
    let cancelled = false;
    setApproachLoading(true);
    setApproachError('');
    listProspects({
      city: weekCity.city,
      uf: weekCity.uf || undefined,
      hasPhone: true,
      hourly: 'yes',
      due: true,
      open: true,
      sort: 'reviews',
      page: 1,
      limit: 20,
    })
      .then((list) => {
        if (cancelled) return;
        setApproach(list.items);
        setApproachTotal(list.total);
      })
      .catch(() => {
        if (!cancelled) setApproachError('Não foi possível carregar a fila de abordagem.');
      })
      .finally(() => {
        if (!cancelled) setApproachLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [weekCity]);

  const clientMetrics = [
    { label: 'Clientes', value: String(stats.arenas) },
    { label: 'Ativos', value: String(stats.activeArenas) },
    { label: 'Trial', value: String(stats.trialArenas) },
    { label: 'Expirados', value: String(stats.expiredArenas) },
  ];
  const operationMetrics = [
    { label: 'Receita do mês', value: formatCurrency(stats.monthlyRevenue) },
    { label: 'Recebido no mês', value: formatCurrency(stats.receivedThisMonth) },
    { label: 'Reservas hoje', value: String(stats.reservationsToday) },
    { label: 'Reservas em 7 dias', value: String(stats.reservationsLast7Days) },
  ];

  const overdue = stats.overdueClients ?? [];
  const trials = stats.trialsEndingSoon ?? [];
  const approachItems = weekCity ? approach : [];
  const approachCount = weekCity ? approachTotal : 0;
  const queueCounts: Record<WorkQueue, number> = {
    cobrar: overdue.length,
    ativar: trials.length,
    abordar: approachCount,
  };

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
              <section aria-labelledby="filas-heading">
                <CardLabel id="filas-heading" as="h2" className="sr-only">
                  Filas do dia
                </CardLabel>
                <div
                  role="tablist"
                  aria-label="Filas do dia"
                  className="grid grid-cols-3 gap-2"
                >
                  {(
                    [
                      ['cobrar', 'Cobrar'],
                      ['ativar', 'Ativar'],
                      ['abordar', 'Abordar'],
                    ] as const
                  ).map(([id, label]) => {
                    const selected = queue === id;
                    return (
                      <button
                        key={id}
                        type="button"
                        role="tab"
                        id={`fila-${id}`}
                        aria-selected={selected}
                        aria-controls={`painel-${id}`}
                        onClick={() => setQueue(id)}
                        className={buttonClassName({
                          variant: selected ? 'primary' : 'secondary',
                          size: 'sm',
                          fullWidth: true,
                        })}
                      >
                        {label}
                        <span className="tabular-nums">{queueCounts[id]}</span>
                      </button>
                    );
                  })}
                </div>

                <div
                  role="tabpanel"
                  id={`painel-${queue}`}
                  aria-labelledby={`fila-${queue}`}
                  className="mt-4"
                >
                  {queue === 'cobrar' ? (
                    <OverdueClientsSection clients={overdue} />
                  ) : null}
                  {queue === 'ativar' ? (
                    <TrialsEndingSection trials={trials} />
                  ) : null}
                  {queue === 'abordar' ? (
                    <ApproachSection
                      cities={cities}
                      weekCity={weekCity}
                      items={approachItems}
                      total={approachCount}
                      loading={approachLoading}
                      error={approachError}
                      onWeekCity={(value) => {
                        const next = parseWeekCityKey(value);
                        writeWeekCity(next);
                        setWeekCity(next);
                      }}
                    />
                  ) : null}
                </div>
              </section>

              <section aria-labelledby="resumo-heading">
                <CardLabel id="resumo-heading" as="h2">
                  Números
                </CardLabel>
                <MetricGrid items={clientMetrics} className="mt-2" />
                <MetricGrid items={operationMetrics} className="mt-2" />
              </section>

              <Panel
                id="online-heading"
                title="Acesso na última hora"
                count={stats.lastHourLogins?.length ?? 0}
                empty="Ninguém acessou na última hora."
              >
                {stats.lastHourLogins?.length
                  ? stats.lastHourLogins.map((item) => (
                      <li key={`${item.publicId}-${item.lastLoginAt}`}>
                        <Link
                          to={`/clientes/${item.publicId}`}
                          className="mpn-tap flex min-h-11 items-center justify-between gap-3 px-4 py-3 hover:bg-arena-hover"
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
                          <span className="shrink-0 text-sm tabular-nums text-fg-muted">
                            {formatMinutesAgo(item.lastLoginAt)}
                          </span>
                        </Link>
                      </li>
                    ))
                  : null}
              </Panel>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

type WorkQueue = 'cobrar' | 'ativar' | 'abordar';

function overdueSubtitle(item: DashboardOverdueClient): string {
  const money = formatCurrency(item.amount);
  const when =
    item.daysOverdue === 1 ? 'há 1 dia' : `há ${item.daysOverdue} dias`;
  const parcels =
    item.overdueCount > 1 ? `${item.overdueCount} parcelas` : null;
  return [item.ownerName?.trim() || null, parcels, money, when]
    .filter(Boolean)
    .join(' · ');
}

function OverdueClientsSection({
  clients,
}: {
  clients: DashboardOverdueClient[];
}) {
  return (
    <>
      <Panel
        id="atraso-heading"
        title="Em atraso"
        count={clients.length}
        empty="Nenhum cliente em atraso."
      >
        {clients.length
          ? clients.map((item) => {
              const reminder = whatsappUrlWithText(
                item.phone,
                paymentReminderMessage({
                  ownerName: item.ownerName,
                  arenaName: item.name,
                  amountLabel: formatCurrency(item.amount),
                  dueDate: item.oldestDueDate,
                  overdueCount: item.overdueCount,
                }),
              );
              return (
                <li
                  key={item.publicId}
                  className="flex items-center gap-3 px-4 py-3"
                >
                  <Link
                    to={`/clientes/${item.publicId}`}
                    className="mpn-tap min-w-0 flex-1 rounded-md hover:bg-arena-hover"
                  >
                    <span className="block truncate text-sm font-medium text-fg">
                      {item.name}
                    </span>
                    <span className="mt-0.5 block truncate text-sm text-fg-muted">
                      {overdueSubtitle(item)}
                    </span>
                  </Link>
                  {reminder ? (
                    <a
                      href={reminder}
                      target="_blank"
                      rel="noreferrer"
                      aria-label={`Lembrar ${item.name} do pagamento no WhatsApp`}
                      className={buttonClassName({
                        variant: 'primary',
                        size: 'sm',
                        className: 'shrink-0',
                      })}
                    >
                      WhatsApp
                    </a>
                  ) : (
                    <span className="shrink-0 text-xs text-fg-muted">
                      Sem telefone
                    </span>
                  )}
                </li>
              );
            })
          : null}
      </Panel>
    </>
  );
}

function TrialsEndingSection({
  trials,
}: {
  trials: DashboardTrialEndingSoon[];
}) {
  return (
    <Panel
      id="trial-heading"
      title="Teste acabando"
      count={trials.length}
      empty="Nenhum teste acabando nesta semana."
    >
      {trials.length
        ? trials.map((item) => {
            const reminder = whatsappUrlWithText(
              item.phone,
              trialActivationMessage({
                ownerName: item.ownerName,
                arenaName: item.name,
                trialEndsAt: item.trialEndsAt,
              }),
            );
            return (
              <li
                key={item.publicId}
                className="flex items-center gap-3 px-4 py-3"
              >
                <Link
                  to={`/clientes/${item.publicId}`}
                  className="mpn-tap min-w-0 flex-1 rounded-md hover:bg-arena-hover"
                >
                  <span className="block truncate text-sm font-medium text-fg">
                    {item.name}
                  </span>
                  <span className="mt-0.5 block text-sm text-fg-muted">
                    {item.courtsCount}{' '}
                    {item.courtsCount === 1 ? 'quadra' : 'quadras'}
                    {' · '}
                    {formatDate(item.trialEndsAt)}
                  </span>
                </Link>
                {reminder ? (
                  <a
                    href={reminder}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Chamar ${item.name} para ativar o plano`}
                    className={buttonClassName({
                      variant: 'primary',
                      size: 'sm',
                      className: 'shrink-0',
                    })}
                  >
                    WhatsApp
                  </a>
                ) : (
                  <span className="shrink-0 text-xs text-fg-muted">
                    Sem telefone
                  </span>
                )}
              </li>
            );
          })
        : null}
    </Panel>
  );
}

function ApproachSection({
  cities,
  weekCity,
  items,
  total,
  loading,
  error,
  onWeekCity,
}: {
  cities: ProspectCity[];
  weekCity: WeekCity | null;
  items: GoogleCourtProspect[];
  total: number;
  loading: boolean;
  error: string;
  onWeekCity: (value: string) => void;
}) {
  return (
    <section aria-labelledby="abordar-heading">
      <CardLabel id="abordar-heading" as="h2">
        Abordar
      </CardLabel>
      <div className="mt-2">
        <Select
          name="cidade-semana-inicio"
          title="Cidade da semana"
          value={weekCityKey(weekCity)}
          omitPlaceholder
          options={[
            { id: '', name: 'Escolha a cidade' },
            ...cities.map((row) => ({
              id: `${row.city}|${row.uf || ''}`,
              name: `${row.city}${row.uf ? `/${row.uf}` : ''} (${row.count})`,
            })),
          ]}
          onChange={(event) => onWeekCity(event.target.value)}
        />
      </div>
      <p className="mb-3 text-sm text-fg-muted">
        Com telefone, que aluga hora ou ainda não foi marcado. Próxima ação
        futura fica de fora. As mais avaliadas no Google vêm primeiro.
      </p>
      {error ? (
        <p className="mb-3 text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : null}
      {!weekCity ? (
        <div className={listClassName}>
          <SurfaceEmpty>Escolha a cidade da semana para abrir a fila.</SurfaceEmpty>
        </div>
      ) : (
        <div className={listClassName}>
          {loading && items.length === 0 ? (
            <SurfaceEmpty>Carregando a fila…</SurfaceEmpty>
          ) : items.length === 0 ? (
            <SurfaceEmpty>
              Nada para abordar hoje nessa cidade.
            </SurfaceEmpty>
          ) : (
            <ul>
              {items.map((item) => {
                const text = prospectOutreachMessage({
                  name: item.name,
                  placeKind: item.placeKind,
                  competitor: item.competitor,
                });
                const reminder = text
                  ? whatsappUrlWithText(item.phone, text)
                  : null;
                return (
                  <li
                    key={item.googlePlaceId}
                    className="flex items-center gap-3 px-4 py-3"
                  >
                    <Link
                      to={`/prospectos/${encodeURIComponent(item.googlePlaceId)}?from=abordar`}
                      className="mpn-tap min-w-0 flex-1 rounded-md hover:bg-arena-hover"
                    >
                      <span className="block truncate text-sm font-medium text-fg">
                        {item.name}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-fg-muted">
                        {approachSubtitle(item)}
                      </span>
                    </Link>
                    {reminder ? (
                      <a
                        href={reminder}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abordar ${item.name} no WhatsApp`}
                        onClick={() => {
                          void updateProspect(item.googlePlaceId, {
                            markContacted: true,
                          }).catch(() => undefined);
                        }}
                        className={buttonClassName({
                          variant: 'primary',
                          size: 'sm',
                          className: 'shrink-0',
                        })}
                      >
                        WhatsApp
                      </a>
                    ) : (
                      <span className="shrink-0 text-xs text-fg-muted">
                        Sem telefone
                      </span>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
      {weekCity && total > items.length ? (
        <p className="mt-3">
          <Link
            to="/prospectos?fila=abordar"
            className={buttonClassName({ variant: 'secondary', size: 'sm' })}
          >
            Ver as {total}
          </Link>
        </p>
      ) : null}
    </section>
  );
}

function approachSubtitle(item: GoogleCourtProspect): string {
  const reviews =
    item.userRatingsTotal != null
      ? `${item.userRatingsTotal} avaliações`
      : 'Sem avaliações';
  const kind = item.placeKind ? PLACE_KIND_LABEL[item.placeKind] : null;
  const when = item.nextActionOn
    ? item.nextActionOn < todayKeyBrazil()
      ? `atrasada ${formatCalendarDate(item.nextActionOn)}`
      : item.nextActionOn === todayKeyBrazil()
        ? 'hoje'
        : formatCalendarDate(item.nextActionOn)
    : 'sem data';
  return [reviews, kind, when].filter(Boolean).join(' · ');
}

function Panel({
  id,
  title,
  count,
  empty,
  children,
}: {
  id: string;
  title: string;
  count?: number;
  empty: string;
  children: ReactNode;
}) {
  return (
    <section aria-labelledby={id}>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <CardLabel id={id} as="h2">
          {title}
        </CardLabel>
        {count ? (
          <p className="text-sm tabular-nums text-fg-muted">{count}</p>
        ) : null}
      </div>
      <div className={listClassName}>
        {children ? <ul>{children}</ul> : <SurfaceEmpty>{empty}</SurfaceEmpty>}
      </div>
    </section>
  );
}

function MetricGrid({
  items,
  className = '',
}: {
  items: { label: string; value: string }[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-2 lg:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <div key={item.label} className={metricTileClass}>
          <p className="text-xs font-medium text-fg-muted">{item.label}</p>
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
    <div aria-label="Carregando indicadores" aria-busy="true">
      <span className="block h-3 w-16 rounded-md bg-border" />
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className={`animate-pulse rounded-lg bg-surface px-4 py-3 ${surfaceShadowClass}`}
          >
            <span className="block h-3 w-12 rounded-md bg-border" />
            <span className="mt-2 block h-6 w-10 rounded-md bg-border" />
          </div>
        ))}
      </div>
    </div>
  );
}
