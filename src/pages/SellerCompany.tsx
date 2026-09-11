import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { MdArrowBack } from 'react-icons/md';
import { getMyCompany, type RepresentativeCompany } from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { SituationBadge } from '../components/Badge';
import Card, { CardLabel } from '../components/Card';
import { ClientDetailSkeleton } from '../components/Skeleton';
import { clientSituation } from '../utils/clientSituation';
import { formatDate, formatMonthYear, formatPhone } from '../utils/format';
import { formatCurrencyBRL } from '../utils/formatCurrency';
import { whatsappUrl } from '../utils/whatsapp';

export default function SellerCompanyPage() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  const [company, setCompany] = useState<RepresentativeCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!companyPublicId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    getMyCompany(companyPublicId)
      .then((data) => {
        if (!cancelled) setCompany(data);
      })
      .catch(() => {
        if (!cancelled) setError('Quadra não encontrada.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyPublicId]);

  const situation = company ? clientSituation(company) : null;
  const wpp = whatsappUrl(company?.owner?.phone);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5 lg:px-6">
          <Link
            to="/inicio"
            aria-label="Voltar"
            className="mpn-tap flex size-9 shrink-0 items-center justify-center rounded-md text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-fg">
              {company?.name || 'Quadra'}
            </p>
            {situation ? <SituationBadge situation={situation} /> : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {loading && !company ? <ClientDetailSkeleton /> : null}
          {error ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {company ? (
            <div className="space-y-4">
              <Card>
                <h1 className="truncate text-lg font-semibold tracking-tight text-fg">
                  {company.name}
                </h1>
                <p className="mt-1 text-sm text-fg-muted">
                  {company.city
                    ? `${company.city}${company.uf ? `/${company.uf}` : ''}`
                    : '—'}
                </p>
                <div className="mt-3 border-t border-border pt-3 text-sm">
                  {wpp ? (
                    <a
                      href={wpp}
                      target="_blank"
                      rel="noreferrer"
                      className="font-medium text-fg underline-offset-2 hover:underline"
                    >
                      {company.owner?.name || 'Sem dono'} ·{' '}
                      {formatPhone(company.owner?.phone)}
                    </a>
                  ) : (
                    <p className="text-fg">
                      {company.owner?.name || 'Sem dono'} ·{' '}
                      {formatPhone(company.owner?.phone)}
                    </p>
                  )}
                </div>
              </Card>

              <Card>
                <CardLabel>Comissões nesta quadra</CardLabel>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                  {formatCurrencyBRL(company.commissions.total)}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {company.commissions.firstMonthPercent}% da 1ª ·{' '}
                  {company.commissions.recurringPercent}% das seguintes
                </p>
              </Card>

              <Card>
                <CardLabel>Pagamentos</CardLabel>
                {company.paymentHistory.length === 0 ? (
                  <p className="mt-3 text-sm text-fg-muted">
                    Nenhum pagamento registrado.
                  </p>
                ) : (
                  <ol className="relative mt-4 ms-1.5 border-s border-border ps-5">
                    {company.paymentHistory.map((payment) => {
                      const commission = company.commissions.lines.find(
                        (line) => line.paymentId === payment.id,
                      );
                      return (
                        <li key={payment.id} className="relative pb-4 last:pb-0">
                          <span
                            className={`absolute -start-[1.35rem] top-1.5 size-2 rounded-full ${
                              payment.paid ? 'bg-success' : 'bg-fg-muted'
                            }`}
                            aria-hidden
                          />
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-medium capitalize text-fg">
                                {formatMonthYear(payment.dueDate)}
                              </p>
                              <p className="mt-0.5 text-sm tabular-nums text-fg-muted">
                                {formatCurrencyBRL(payment.value)}
                                {commission
                                  ? ` · sua comissão ${formatCurrencyBRL(commission.amount)}`
                                  : ''}
                              </p>
                            </div>
                            <span className="text-xs font-medium text-fg-muted">
                              {payment.paid
                                ? `Pago ${formatDate(payment.paidAt)}`
                                : 'Em aberto'}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ol>
                )}
              </Card>
            </div>
          ) : null}
        </div>
      </section>
    </AppLayout>
  );
}
