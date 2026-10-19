import { useEffect, useMemo, useState } from 'react';
import {
  getMyPortfolio,
  type CommissionLine,
  type Representative,
} from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Card, { CardLabel } from '../components/Card';
import EmptyState from '../components/EmptyState';
import { PageHeader } from '../components/PageTitle';
import { MonthCardsSkeleton } from '../components/Skeleton';
import { formatDate } from '../utils/format';
import { formatCurrencyBRL } from '../utils/formatCurrency';

const MONTH_LABELS = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro',
];

type CommissionRow = CommissionLine & { companyName: string };

type MonthGroup = {
  year: number;
  month: number;
  total: number;
  lines: CommissionRow[];
};

function monthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1] ?? month} de ${year}`;
}

function monthGroups(lines: CommissionRow[]): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  for (const line of lines) {
    if (!line.paidAt) continue;
    const [yearText, monthText] = line.paidAt.slice(0, 7).split('-');
    const year = Number(yearText);
    const month = Number(monthText);
    if (!year || !month) continue;
    const key = `${year}-${month}`;
    let group = map.get(key);
    if (!group) {
      group = { year, month, total: 0, lines: [] };
      map.set(key, group);
    }
    group.total += line.amount;
    group.lines.push(line);
  }

  for (const group of map.values()) {
    group.total = Number(group.total.toFixed(2));
    group.lines.sort((a, b) =>
      a.companyName.localeCompare(b.companyName, 'pt-BR'),
    );
  }

  return [...map.values()].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );
}

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

  const months = useMemo(() => {
    if (!portfolio) return [];
    const lines = portfolio.companies.flatMap((company) =>
      company.commissions.lines.map((line) => ({
        ...line,
        companyName: company.name,
      })),
    );
    return monthGroups(lines);
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

          {loading && !portfolio ? <MonthCardsSkeleton /> : null}

          {portfolio ? (
            <div className="space-y-6">
              <Card aria-labelledby="total-heading">
                <CardLabel id="total-heading">Total acumulado</CardLabel>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                  {formatCurrencyBRL(portfolio.commissionTotal)}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {portfolio.firstMonthPercent}% na 1ª mensalidade ·{' '}
                  {portfolio.recurringPercent}% nas seguintes
                </p>
              </Card>

              <section aria-labelledby="meses-heading">
                <CardLabel id="meses-heading">Por mês</CardLabel>
                {months.length === 0 ? (
                  <EmptyState
                    title="Nenhuma comissão ainda"
                    description="As comissões aparecem quando uma mensalidade das suas quadras é paga."
                    className="py-10"
                  />
                ) : (
                  <div className="mt-3 space-y-3">
                    {months.map((group) => (
                      <Card
                        key={`${group.year}-${group.month}`}
                        aria-label={monthLabel(group.year, group.month)}
                      >
                        <div className="flex items-baseline justify-between gap-3">
                          <h3 className="text-base font-semibold text-fg">
                            {monthLabel(group.year, group.month)}
                          </h3>
                          <p className="shrink-0 text-sm font-medium tabular-nums text-fg">
                            {formatCurrencyBRL(group.total)}
                          </p>
                        </div>
                        <ul className="mt-3 space-y-2">
                          {group.lines.map((line) => (
                            <li
                              key={`${line.companyName}-${line.paymentId}`}
                              className="flex items-baseline justify-between gap-3 text-sm"
                            >
                              <span className="min-w-0">
                                <span className="block truncate text-fg">
                                  {line.companyName}
                                </span>
                                <span className="text-fg-muted">
                                  {line.kind === 'first_month'
                                    ? '1ª mensalidade'
                                    : 'Recorrente'}{' '}
                                  · {line.percent}% · {formatDate(line.paidAt)}
                                </span>
                              </span>
                              <span className="shrink-0 tabular-nums text-fg">
                                {formatCurrencyBRL(line.amount)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </Card>
                    ))}
                  </div>
                )}
              </section>
            </div>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
