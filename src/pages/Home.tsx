import { useEffect, useState } from 'react';
import { MdOutlineChevronRight } from 'react-icons/md';
import { Link } from 'react-router-dom';
import {
  getDashboard,
  type PlatformDashboard,
} from '../api/dashboard';
import AppLayout from '../components/AppLayout';
import Card, { CardLabel, CardMetric } from '../components/Card';
import { formatDate, formatDateTime } from '../utils/format';
import { formatCurrencyBRL } from '../utils/formatCurrency';

const emptyDashboard: PlatformDashboard = {
  courts: 0,
  activeCourts: 0,
  trialCourts: 0,
  expiredArenas: 0,
  onboarding: 0,
  monthlyRevenue: 0,
  receivedThisMonth: 0,
  reservationsToday: 0,
  reservationsLast7Days: 0,
  arenasActiveThisWeek: 0,
  trialsEndingSoon: [],
  recentLogins: [],
};

export default function HomePage() {
  const [stats, setStats] = useState<PlatformDashboard>(emptyDashboard);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDashboard()
      .then((data) => {
        if (cancelled) return;
        setStats(data);
      })
      .catch(() => {
        if (cancelled) return;
        setError('Não foi possível carregar os indicadores.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <AppLayout>
      <section className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden bg-master text-text-light lg:max-w-5xl">
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8 lg:pt-6">
          {error ? (
            <p
              className="mb-4 text-base font-medium text-danger-400"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {loading ? (
            <div
              className="space-y-4"
              aria-label="Carregando indicadores"
              aria-busy="true"
            >
              <Card className="animate-pulse">
                <div className="flex items-end justify-between gap-3">
                  <span className="block h-3 w-16 rounded bg-text-light/10" />
                  <span className="block h-8 w-12 rounded bg-text-light/10" />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                  {Array.from({ length: 4 }).map((_, index) => (
                    <div key={index} className="space-y-1.5">
                      <span className="block h-3 w-10 rounded bg-text-light/10" />
                      <span className="block h-5 w-8 rounded bg-text-light/10" />
                    </div>
                  ))}
                </div>
              </Card>
              <Card className="h-24 animate-pulse">
                <span className="sr-only">Carregando</span>
              </Card>
              <Card className="h-24 animate-pulse">
                <span className="sr-only">Carregando</span>
              </Card>
              <Card className="h-20 animate-pulse">
                <span className="sr-only">Carregando</span>
              </Card>
              <div className="space-y-2 pt-2">
                <span className="block h-3 w-28 rounded bg-text-light/10" />
                <span className="block h-4 w-full rounded bg-text-light/10" />
                <span className="block h-4 w-2/3 rounded bg-text-light/10" />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Card aria-labelledby="quadras-heading">
                <div className="flex items-end justify-between gap-3">
                  <CardLabel id="quadras-heading" as="h1">
                    Quadras
                  </CardLabel>
                  <CardMetric className="mt-0 text-4xl leading-none" tone="green">
                    {stats.courts}
                  </CardMetric>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-4">
                  <Counter label="Ativas" value={stats.activeCourts} />
                  <Counter label="Em teste" value={stats.trialCourts} />
                  <Counter label="Cadastro" value={stats.onboarding} />
                  <Counter label="Expirados" value={stats.expiredArenas} />
                </div>
              </Card>

              <Card aria-labelledby="trials-heading">
                <div className="flex items-end justify-between gap-3">
                  <CardLabel id="trials-heading">Trials em 7 dias</CardLabel>
                  <CardMetric className="mt-0 text-4xl leading-none" tone="purple">
                    {stats.trialsEndingSoon.length}
                  </CardMetric>
                </div>

                {stats.trialsEndingSoon.length > 0 ? (
                  <ul className="mt-3 space-y-1">
                    {stats.trialsEndingSoon.map((item) => (
                      <li key={item.publicId}>
                        <Link
                          to={`/quadras/${item.publicId}`}
                          className="-mx-2 flex min-h-11 items-center gap-3 rounded-xl px-2 py-1.5 transition hover:bg-text-light/8 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-base font-semibold text-text-light">
                              {item.name}
                            </span>
                            <span className="block text-sm text-text-light/55">
                              Vence {formatDate(item.trialEndsAt)}
                            </span>
                          </span>
                          <MdOutlineChevronRight
                            size={22}
                            className="shrink-0 text-text-light/35"
                            aria-hidden
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-light/55">
                    Nenhum trial vence nesta semana.
                  </p>
                )}
              </Card>

              <Card aria-labelledby="reservas-heading">
                <div className="flex items-end justify-between gap-3">
                  <CardLabel id="reservas-heading">Reservas hoje</CardLabel>
                  <CardMetric className="mt-0 text-4xl leading-none" tone="blue">
                    {stats.reservationsToday}
                  </CardMetric>
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Counter
                    label="Últimos 7 dias"
                    value={stats.reservationsLast7Days}
                  />
                  <Counter
                    label="Arenas ativas"
                    value={stats.arenasActiveThisWeek}
                  />
                </div>
              </Card>

              <Card aria-labelledby="receita-heading">
                <div className="flex items-end justify-between gap-3">
                  <CardLabel id="receita-heading">Receita /mês</CardLabel>
                  <CardMetric className="mt-0 text-3xl leading-none" tone="purple">
                    {formatCurrencyBRL(stats.monthlyRevenue)}
                  </CardMetric>
                </div>
                <p className="mt-1 text-sm text-text-light/55">Contratada</p>
                <div className="mt-3">
                  <Counter
                    label="Recebido no mês"
                    valueLabel={formatCurrencyBRL(stats.receivedThisMonth)}
                  />
                </div>
              </Card>

              <section aria-labelledby="acessos-heading" className="pt-2">
                <CardLabel id="acessos-heading">Últimos acessos</CardLabel>
                {stats.recentLogins.length > 0 ? (
                  <ul className="mt-2 space-y-2">
                    {stats.recentLogins.map((item) => (
                      <li
                        key={`${item.publicId}-${item.lastLoginAt}`}
                        className="flex items-baseline justify-between gap-3"
                      >
                        <span className="min-w-0 truncate text-base text-text-light">
                          {item.arenaName ? (
                            <>
                              {item.arenaName}
                              <span className="text-text-light/55">
                                {' '}
                                - {item.ownerName}
                              </span>
                            </>
                          ) : (
                            item.ownerName
                          )}
                        </span>
                        <span className="shrink-0 text-sm tabular-nums text-text-light/55">
                          {formatDateTime(item.lastLoginAt)}
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-text-light/55">
                    Nenhum acesso registrado ainda.
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

function Counter({
  label,
  value,
  valueLabel,
}: {
  label: string;
  value?: number;
  valueLabel?: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-text-light/55">{label}</p>
      <p className="mt-0.5 text-xl font-semibold tabular-nums tracking-tight text-text-light">
        {valueLabel ?? value}
      </p>
    </div>
  );
}
