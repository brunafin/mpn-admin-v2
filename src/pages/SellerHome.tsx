import { useEffect, useState } from 'react';
import { getMyPortfolio, type Representative } from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import { metricTileClass } from '../components/Card';
import EmptyState from '../components/EmptyState';
import ListRow, { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import { clientSituation } from '../utils/clientSituation';
import { formatCurrencyBRL } from '../utils/formatCurrency';

export default function SellerHomePage() {
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
        if (!cancelled) setError('Não foi possível carregar suas quadras.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const companies = portfolio?.companies ?? [];

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Início" />
        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {loading && !portfolio ? <ClientsListSkeleton /> : null}

          {portfolio ? (
            <>
              <div className="mb-4 grid grid-cols-2 gap-2">
                <div className={metricTileClass}>
                  <p className="text-xs text-fg-muted">Quadras</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                    {portfolio.companiesCount}
                  </p>
                </div>
                <div className={metricTileClass}>
                  <p className="text-xs text-fg-muted">Comissões</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                    {formatCurrencyBRL(portfolio.commissionTotal)}
                  </p>
                </div>
              </div>
              <p className="mb-3 text-sm text-fg-muted">
                {portfolio.firstMonthPercent}% da 1ª mensalidade ·{' '}
                {portfolio.recurringPercent}% das seguintes
              </p>

              {companies.length === 0 ? (
                <EmptyState
                  title="Nenhuma quadra vinculada"
                  description="Quando uma arena for atribuída a você, ela aparece aqui."
                />
              ) : (
                <ul className={listClassName}>
                  {companies.map((company) => {
                    const situation = clientSituation(company);
                    return (
                      <li key={company.publicId}>
                        <ListRow
                          to={`/clientes/${company.publicId}`}
                          title={company.name}
                          badge={<SituationBadge situation={situation} />}
                          subtitle={
                            company.city
                              ? `${company.city}${company.uf ? `/${company.uf}` : ''}`
                              : '—'
                          }
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
