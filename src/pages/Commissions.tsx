import { useEffect, useMemo, useState } from 'react';
import { getMyPortfolio, type Representative } from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Card, { CardLabel } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { PageHeader } from '../components/PageTitle';
import { PlansListSkeleton } from '../components/Skeleton';
import { formatDate } from '../utils/format';
import { formatCurrencyBRL } from '../utils/formatCurrency';

export default function CommissionsPage() {
  const [portfolio, setPortfolio] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getMyPortfolio()
      .then((data) => {
        if (!cancelled) setPortfolio(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar as comissões.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const lines = useMemo(() => {
    if (!portfolio) return [];
    return portfolio.companies.flatMap((company) =>
      company.commissions.lines.map((line) => ({
        ...line,
        companyName: company.name,
      })),
    );
  }, [portfolio]);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Comissões" />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && !portfolio ? <PlansListSkeleton /> : null}

          {portfolio ? (
            <>
              <Card className="mb-4">
                <p className="text-xs text-fg-muted">Total acumulado</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                  {formatCurrencyBRL(portfolio.commissionTotal)}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {portfolio.firstMonthPercent}% na 1ª mensalidade ·{' '}
                  {portfolio.recurringPercent}% nas seguintes
                </p>
              </Card>

              <CardLabel>Por pagamento</CardLabel>
              {lines.length === 0 ? (
                <EmptyState
                  title="Nenhuma comissão ainda"
                  description="As comissões aparecem quando uma mensalidade das suas quadras é paga."
                  className="py-10"
                />
              ) : (
                <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                  {lines.map((line) => (
                    <li
                      key={`${line.companyName}-${line.paymentId}`}
                      className="flex items-start justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-fg">
                          {line.companyName}
                        </p>
                        <p className="mt-0.5 text-sm text-fg-muted">
                          {line.kind === 'first_month'
                            ? '1ª mensalidade'
                            : 'Recorrente'}{' '}
                          · {line.percent}% · {formatDate(line.paidAt)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-medium tabular-nums text-fg">
                        {formatCurrencyBRL(line.amount)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
