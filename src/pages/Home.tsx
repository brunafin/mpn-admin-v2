import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  getDashboard,
  type DashboardOverdueClient,
  type PlatformDashboard,
} from '../api/dashboard';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { buttonClassName } from '../components/Button';
import { CardLabel, surfaceShadowClass } from '../components/Card';
import { badgeToneClass } from '../components/Badge';
import { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { formatCurrency, formatMinutesAgo } from '../utils/format';
import {
  paymentReminderMessage,
  whatsappUrlWithText,
} from '../utils/whatsapp';
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

  const metrics = [
    { label: 'Clientes', value: stats.arenas, tone: badgeToneClass.neutral },
    { label: 'Ativos', value: stats.activeArenas, tone: badgeToneClass.accent },
    { label: 'Trial', value: stats.trialArenas, tone: badgeToneClass.ink },
    { label: 'Expirados', value: stats.expiredArenas, tone: badgeToneClass.danger },
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

              <OverdueClientsSection clients={stats.overdueClients ?? []} />

              <section aria-labelledby="online-heading">
                <div className="mb-2 flex items-baseline justify-between gap-3">
                  <CardLabel id="online-heading">
                    Acesso na última hora
                  </CardLabel>
                  {stats.lastHourLogins?.length ? (
                    <p className="text-sm tabular-nums text-fg-muted">
                      {stats.lastHourLogins.length}
                    </p>
                  ) : null}
                </div>
                {stats.lastHourLogins?.length ? (
                  <ul className={listClassName}>
                    {stats.lastHourLogins.map((item) => (
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
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-fg-muted">
                    Ninguém acessou na última hora.
                  </p>
                )}
              </section>
            </div>
          )}
        </div>
      </section>
    </AppLayout>
  );
}

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
    <section aria-labelledby="atraso-heading">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <CardLabel id="atraso-heading" as="h2">
          Em atraso
        </CardLabel>
        {clients.length ? (
          <p className="text-sm tabular-nums text-fg-muted">{clients.length}</p>
        ) : null}
      </div>
      {clients.length ? (
        <ul className={listClassName}>
          {clients.map((item) => {
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
          })}
        </ul>
      ) : (
        <p className="text-sm text-fg-muted">Nenhum cliente em atraso.</p>
      )}
    </section>
  );
}

function MetricGrid({
  items,
  className = '',
}: {
  items: { label: string; value: number; tone: string }[];
  className?: string;
}) {
  return (
    <div
      className={`grid grid-cols-2 gap-2 sm:grid-cols-4 ${className}`.trim()}
    >
      {items.map((item) => (
        <div
          key={item.label}
          className={`rounded-lg px-4 py-3 ${surfaceShadowClass} ${item.tone}`}
        >
          <p className="text-xs font-medium">{item.label}</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">
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
