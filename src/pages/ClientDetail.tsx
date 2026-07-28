import { useEffect, useState, type ReactNode } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { FaWhatsapp } from 'react-icons/fa';
import {
  MdArrowBack,
  MdOpenInNew,
  MdOutlineChevronRight,
} from 'react-icons/md';
import {
  createClientPayment,
  getClient,
  markClientPaymentPaid,
  updateClientAccess,
  updateClientPlan,
  updateCourtVisibility,
  type PartnerStatus,
  type PlatformClientDetail,
  type PlatformPaymentHistoryItem,
} from '../api/clients';
import { listPlans, type Plan } from '../api/plans';
import AppLayout from '../components/AppLayout';
import Button, { buttonClassName } from '../components/Button';
import FormSheet from '../components/FormSheet';
import { PageTitle } from '../components/PageTitle';
import Input from '../components/Input';
import Select from '../components/Select';
import MonthYearWheelPicker from '../components/MonthYearWheelPicker';
import { ClientDetailSkeleton } from '../components/Skeleton';
import { formatCurrencyBRL } from '../utils/formatCurrency';
import { formatPhoneMask } from '../utils/formatPhone';
import { computeMonthlyFee } from '../utils/computeMonthlyFee';
import {
  formatDate,
  formatDateTime,
  formatMonthYear,
} from '../utils/format';

const WHATSAPP_BASE =
  import.meta.env.VITE_WHATSAPP_URL_BASE || 'https://wa.me/55';

/**
 * Hierarquia (mobile-first, dona da plataforma):
 * 1. Nome + status (header sticky)
 * 2. Contato — identidade do dono + CTA WhatsApp
 * 3. Comercial — mensalidade em destaque + meta do plano
 * 4. Pagamentos — timeline e total recebido
 * 5. Quadras / Estabelecimento — contexto operacional
 */
export default function ClientDetailPage() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  const [client, setClient] = useState<PlatformClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accessBusy, setAccessBusy] = useState(false);

  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] =
    useState<PlatformPaymentHistoryItem | null>(null);
  const [selectedCourt, setSelectedCourt] = useState<
    PlatformClientDetail['courts'][number] | null
  >(null);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    if (!companyPublicId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setShowAllPayments(false);
    setSelectedCourt(null);
    getClient(companyPublicId)
      .then((data) => {
        if (!cancelled) setClient(data);
      })
      .catch(() => {
        if (!cancelled) setError('Cliente não encontrado.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [companyPublicId]);

  const refreshClient = async () => {
    if (!companyPublicId) return;
    const data = await getClient(companyPublicId);
    setClient(data);
  };

  const ownerPhoneDigits = client?.owner?.phone?.replace(/\D/g, '') || '';
  const totalReceived =
    client?.paymentHistory
      ?.filter((payment) => payment.paid)
      .reduce((sum, payment) => sum + Number(payment.value || 0), 0) ?? 0;
  const paymentHistory = client?.paymentHistory ?? [];
  const visiblePayments = showAllPayments
    ? paymentHistory
    : paymentHistory.slice(0, 3);
  const hasMorePayments = paymentHistory.length > 3;

  return (
    <AppLayout>
      <section
        className={`mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden bg-master text-text-light transition-opacity lg:max-w-3xl ${
          loading && client ? 'opacity-80' : ''
        }`}
        aria-busy={loading}
      >
        <div className="sticky top-0 z-10 flex shrink-0 items-center gap-1 border-b border-text-light/10 bg-master px-2 py-2 lg:px-6">
          <Link
            to="/clientes"
            aria-label="Voltar para clientes"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdArrowBack size={24} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <PageTitle className="min-w-0 flex-1">
              {client?.name || 'Detalhe'}
            </PageTitle>
            {client ? (
              <PartnerStatusPill status={client.partnerStatus} />
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {loading && !client ? <ClientDetailSkeleton /> : null}

          {error ? (
            <p className="text-base font-medium text-danger-400" role="alert">
              {error}
            </p>
          ) : null}

          {client ? (
            <div className="space-y-4">
              {client.kind === 'onboarding' ||
              client.partnerStatus === 'expired' ||
              (client.owner && !client.owner.emailVerified) ? (
                <div
                  role="status"
                  className="rounded-2xl border border-warning-500/35 bg-warning-500/10 px-4 py-3.5"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-warning-500">
                    Atenção
                  </p>
                  <p className="mt-1.5 text-base leading-6 text-text-light">
                    {client.kind === 'onboarding'
                      ? 'Em cadastro — ainda sem estabelecimento no sistema.'
                      : client.partnerStatus === 'expired'
                        ? 'Trial expirado — sem plano. O cliente pode logar, mas não vê a agenda nem aparece no site. Atribua um plano promocional para reativar.'
                        : 'E-mail do dono ainda não confirmado.'}
                  </p>
                </div>
              ) : null}

              <section
                aria-labelledby="contato-heading"
                className="rounded-2xl bg-master-light px-4 py-5"
              >
                <SectionLabel id="contato-heading">Contato</SectionLabel>
                <p className="mt-3 text-xl font-semibold tracking-tight text-text-light">
                  {client.owner?.name || 'Sem nome'}
                </p>
                {ownerPhoneDigits ? (
                  <a
                    href={`${WHATSAPP_BASE}${ownerPhoneDigits}`}
                    target="_blank"
                    rel="noreferrer"
                    aria-label={`Abrir WhatsApp de ${client.owner?.name || 'dono'} — ${formatPhoneMask(client.owner?.phone || '')}`}
                    className={buttonClassName({
                      variant: 'secondary',
                      size: 'md',
                      className:
                        'mpn-tap mt-4 border-accent-green/40 text-accent-green hover:bg-accent-green/10 focus-visible:outline-accent-green',
                    })}
                  >
                    <FaWhatsapp size={20} aria-hidden />
                    <span>{formatPhoneMask(client.owner?.phone || '')}</span>
                  </a>
                ) : (
                  <p className="mt-3 text-base text-text-light/55">
                    Sem telefone cadastrado
                  </p>
                )}
              </section>

              {client.kind === 'company' ? (
                <section
                  aria-labelledby="comercial-heading"
                  className="rounded-2xl bg-master-light px-4 py-5"
                >
                  <div className="flex items-start justify-between gap-3">
                    <SectionLabel id="comercial-heading">
                      Comercial
                    </SectionLabel>
                    <button
                      type="button"
                      onClick={() => setPlanSheetOpen(true)}
                      className="mpn-tap inline-flex min-h-11 shrink-0 items-center rounded-xl px-2.5 text-sm font-semibold text-accent-blue-soft transition hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                    >
                      Alterar plano
                    </button>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm font-medium text-text-light/55">
                      Mensalidade
                    </p>
                    <p className="mt-1 text-3xl font-semibold tracking-tight text-text-light">
                      {formatCurrencyBRL(Number(client.monthlyFee ?? 0))}
                    </p>
                    <div className="mt-1.5 flex min-w-0 flex-wrap items-center gap-2">
                      <p className="text-base font-medium text-text-light/80">
                        {client.partnerStatus === 'expired'
                          ? 'Plano expirado'
                          : client.plan?.name ||
                            (client.isTrial ? 'Gratuito' : 'Sem plano')}
                      </p>
                      {client.isTrial && client.partnerStatus !== 'expired' ? (
                        <span className="shrink-0 rounded-full bg-accent-blue/20 px-2.5 py-1 text-xs font-semibold text-accent-blue-soft">
                          Plano trial
                        </span>
                      ) : null}
                    </div>
                    {!client.isTrial && client.plan ? (
                      <p className="mt-2 text-sm leading-5 text-text-light/55">
                        {formatCurrencyBRL(Number(client.plan.basePrice))} base
                        {client.courtsCount > 1
                          ? ` + ${formatCurrencyBRL(Number(client.plan.pricePerCourt))} × ${client.courtsCount - 1} quadra${client.courtsCount - 1 === 1 ? '' : 's'} extra${client.courtsCount - 1 === 1 ? '' : 's'}`
                          : ' · 1ª quadra inclusa'}
                      </p>
                    ) : null}
                  </div>

                  <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-4 border-t border-text-light/10 pt-4">
                    <Meta
                      label="Vencimento"
                      value={
                        client.dayDue != null ? `Dia ${client.dayDue}` : '—'
                      }
                    />
                    <Meta
                      label={client.isTrial ? 'Trial até' : 'Trial encerrou em'}
                      value={
                        client.trialEndsAt
                          ? formatDate(client.trialEndsAt)
                          : '—'
                      }
                    />
                  </dl>

                  <div className="mt-5 border-t border-text-light/10 pt-4">
                    <p className="text-sm font-medium text-text-light/55">
                      Acesso ao manager
                    </p>
                    <p className="mt-1 text-base font-semibold text-text-light">
                      {client.accessMode === 'read_only'
                        ? 'Somente leitura (inadimplência) — fora do site'
                        : 'Completo'}
                    </p>
                    <Button
                      type="button"
                      size="md"
                      fullWidth
                      disabled={accessBusy}
                      variant={
                        client.accessMode === 'read_only'
                          ? 'secondary'
                          : 'dangerOutline'
                      }
                      onClick={async () => {
                        if (!companyPublicId) return;
                        setAccessBusy(true);
                        try {
                          const next =
                            client.accessMode === 'read_only'
                              ? 'full'
                              : 'read_only';
                          const updated = await updateClientAccess(
                            companyPublicId,
                            next === 'read_only'
                              ? {
                                  accessMode: 'read_only',
                                  reason: 'delinquency',
                                }
                              : { accessMode: 'full' },
                          );
                          setClient(updated);
                        } catch {
                          setError(
                            'Não foi possível atualizar o acesso do cliente.',
                          );
                        } finally {
                          setAccessBusy(false);
                        }
                      }}
                      className="mpn-tap mt-3"
                    >
                      {accessBusy
                        ? 'Salvando…'
                        : client.accessMode === 'read_only'
                          ? 'Liberar escrita'
                          : 'Bloquear por inadimplência'}
                    </Button>
                  </div>
                </section>
              ) : null}

              {client.kind === 'company' ? (
                <section
                  aria-labelledby="pagamentos-heading"
                  className="rounded-2xl bg-master-light px-4 py-5"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <SectionLabel id="pagamentos-heading">
                        Pagamentos
                      </SectionLabel>
                      <p className="mt-3 text-sm font-medium text-text-light/55">
                        Total recebido
                      </p>
                      <p className="mt-1 text-2xl font-semibold tracking-tight text-accent-green">
                        {formatCurrencyBRL(totalReceived)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAddMonthOpen(true)}
                      className="mpn-tap inline-flex min-h-11 shrink-0 items-center rounded-xl px-2.5 text-sm font-semibold text-accent-blue-soft transition hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                    >
                      Adicionar mês
                    </button>
                  </div>

                  {paymentHistory.length === 0 ? (
                    <p className="mt-5 text-base text-text-light/55">
                      Nenhum registro de pagamento.
                    </p>
                  ) : (
                    <>
                      <ol className="relative ms-1 mt-5 border-s border-text-light/20 ps-5">
                        {visiblePayments.map((payment) => (
                          <li
                            key={payment.id}
                            className="relative pb-5 last:pb-0"
                          >
                            <span
                              className={`absolute -start-[1.4rem] top-2 size-2.5 rounded-full ring-4 ring-master-light ${
                                payment.paid
                                  ? 'bg-accent-green'
                                  : payment.status === 'awaiting_pix'
                                    ? 'bg-accent-blue'
                                    : 'bg-warning-500'
                              }`}
                              aria-hidden
                            />
                            <div className="min-w-0">
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-base font-semibold capitalize leading-6 text-text-light">
                                    {formatMonthYear(payment.dueDate)}
                                  </p>
                                  <p className="mt-0.5 text-sm leading-5 text-text-light/70">
                                    {formatCurrencyBRL(Number(payment.value))}
                                    {payment.paid
                                      ? ` · pago em ${formatDate(payment.date)}`
                                      : payment.status === 'awaiting_pix'
                                        ? ' · aguardando PIX'
                                        : ' · pendente'}
                                  </p>
                                </div>
                                {payment.paid ? (
                                  <span className="shrink-0 rounded-full bg-accent-green/20 px-2.5 py-1 text-xs font-semibold text-accent-green">
                                    Pago
                                  </span>
                                ) : payment.status === 'awaiting_pix' ? (
                                  <span className="shrink-0 rounded-full bg-accent-blue/20 px-2.5 py-1 text-xs font-semibold text-accent-blue-soft">
                                    Aguardando PIX
                                  </span>
                                ) : payment.status === 'overdue' ? (
                                  <span className="shrink-0 rounded-full bg-danger-400/20 px-2.5 py-1 text-xs font-semibold text-danger-400">
                                    Vencido
                                  </span>
                                ) : (
                                  <span className="shrink-0 rounded-full bg-warning-500/20 px-2.5 py-1 text-xs font-semibold text-warning-500">
                                    Pendente
                                  </span>
                                )}
                              </div>
                              {payment.mpPaymentId ? (
                                <p className="mt-1 text-xs text-text-light/45">
                                  MP: {payment.mpPaymentId}
                                </p>
                              ) : null}
                              {!payment.paid ? (
                                <Button
                                  type="button"
                                  variant="primary"
                                  size="md"
                                  fullWidth={false}
                                  className="mt-3 min-h-11 px-3 text-sm"
                                  onClick={() => setMarkPaidPayment(payment)}
                                >
                                  Marcar como pago
                                </Button>
                              ) : null}
                            </div>
                          </li>
                        ))}
                      </ol>
                      {hasMorePayments ? (
                        <button
                          type="button"
                          onClick={() =>
                            setShowAllPayments((open) => !open)
                          }
                          className="mpn-tap mt-2 inline-flex min-h-11 items-center rounded-xl px-1 text-sm font-semibold text-accent-blue-soft transition hover:bg-accent-blue/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                        >
                          {showAllPayments
                            ? 'Ver menos'
                            : `Ver mais (${paymentHistory.length - 3})`}
                        </button>
                      ) : null}
                    </>
                  )}
                </section>
              ) : null}

              {client.kind === 'company' ? (
                <section
                  aria-labelledby="quadras-heading"
                  className="rounded-2xl bg-master-light px-4 py-5"
                >
                  <div className="flex items-baseline justify-between gap-3">
                    <SectionLabel id="quadras-heading">Quadras</SectionLabel>
                    <p
                      className="text-sm font-semibold tabular-nums text-text-light/55"
                      aria-label={`${client.courtsCount} quadras`}
                    >
                      {client.courtsCount}
                    </p>
                  </div>

                  {client.courts.length === 0 ? (
                    <p className="mt-4 text-base text-text-light/55">
                      Nenhuma quadra cadastrada.
                    </p>
                  ) : (
                    <ul className="mt-2 divide-y divide-text-light/10">
                      {client.courts.map((court) => (
                        <li key={court.publicId}>
                          <button
                            type="button"
                            onClick={() => setSelectedCourt(court)}
                            aria-label={`${court.name}, ${court.show ? 'visível no site' : 'oculta'}`}
                            className="mpn-tap flex min-h-14 w-full items-center gap-3 py-3 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
                          >
                            <span className="min-w-0 flex-1 truncate text-base font-semibold leading-6 text-text-light">
                              {court.name}
                            </span>
                            <span
                              className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                                court.show
                                  ? 'bg-accent-green/20 text-accent-green'
                                  : 'bg-text-light/10 text-text-light/55'
                              }`}
                            >
                              {court.show ? 'No site' : 'Oculta'}
                            </span>
                            <MdOutlineChevronRight
                              size={22}
                              className="shrink-0 text-text-light/35"
                              aria-hidden
                            />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              ) : null}

              {client.kind === 'company' ? (
                <section
                  aria-labelledby="estabelecimento-heading"
                  className="rounded-2xl bg-master-light px-4 py-5"
                >
                  <SectionLabel id="estabelecimento-heading">
                    Estabelecimento
                  </SectionLabel>

                  <dl className="mt-4 divide-y divide-text-light/10">
                    <MetaRow
                      label="No portal"
                      value={client.onPortal ? 'Sim' : 'Não'}
                    />
                    <MetaRow
                      label="Primeiro acesso"
                      value={formatDateTime(client.firstAccessAt)}
                    />
                    <MetaRow
                      label="Último acesso"
                      value={formatDateTime(client.owner?.lastLoginAt)}
                    />
                    <MetaRow
                      label="Criado em"
                      value={formatDateTime(client.createdAt)}
                    />
                    <MetaRow
                      label="Endereço"
                      value={formatAddress(client.address)}
                      stacked
                    />
                  </dl>

                  {client.publicLink ? (
                    <a
                      href={client.publicLink}
                      target="_blank"
                      rel="noreferrer"
                      className={buttonClassName({
                        variant: 'secondary',
                        size: 'md',
                        className: 'mpn-tap mt-5',
                      })}
                    >
                      Ver página pública
                      <MdOpenInNew size={18} aria-hidden />
                    </a>
                  ) : null}
                </section>
              ) : null}
            </div>
          ) : null}
        </div>
      </section>

      {companyPublicId ? (
        <>
          <AddMonthSheet
            isOpen={addMonthOpen}
            publicId={companyPublicId}
            defaultValue={Number(client?.monthlyFee ?? 0)}
            onClose={() => setAddMonthOpen(false)}
            onCreated={refreshClient}
          />
          <MarkPaidSheet
            isOpen={Boolean(markPaidPayment)}
            publicId={companyPublicId}
            payment={markPaidPayment}
            onClose={() => setMarkPaidPayment(null)}
            onMarked={refreshClient}
          />
          <CourtDetailSheet
            isOpen={Boolean(selectedCourt)}
            court={selectedCourt}
            companyPublicId={companyPublicId}
            onClose={() => setSelectedCourt(null)}
            onUpdated={(updated) => {
              setClient(updated);
              const next = updated.courts.find(
                (c) => c.publicId === selectedCourt?.publicId,
              );
              setSelectedCourt(next ?? null);
            }}
          />
          {client ? (
            <AssignPlanSheet
              isOpen={planSheetOpen}
              publicId={companyPublicId}
              client={client}
              onClose={() => setPlanSheetOpen(false)}
              onSaved={async () => {
                await refreshClient();
              }}
            />
          ) : null}
        </>
      ) : null}
    </AppLayout>
  );
}

function SectionLabel({
  children,
  id,
}: {
  children: ReactNode;
  id?: string;
}) {
  return (
    <h2
      id={id}
      className="text-sm font-semibold uppercase tracking-wide text-text-light/55"
    >
      {children}
    </h2>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-sm font-medium leading-5 text-text-light/55">
        {label}
      </dt>
      <dd className="mt-1 break-words text-base font-semibold leading-6 text-text-light">
        {value}
      </dd>
    </div>
  );
}

function MetaRow({
  label,
  value,
  stacked = false,
}: {
  label: string;
  value: string;
  stacked?: boolean;
}) {
  return (
    <div
      className={
        stacked
          ? 'flex flex-col gap-1 py-3.5 first:pt-0 last:pb-0'
          : 'flex items-baseline justify-between gap-4 py-3.5 first:pt-0 last:pb-0'
      }
    >
      <dt className="shrink-0 text-sm font-medium leading-5 text-text-light/55">
        {label}
      </dt>
      <dd
        className={`break-words text-base font-semibold leading-6 text-text-light ${
          stacked ? '' : 'min-w-0 text-right'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function PartnerStatusPill({ status }: { status: PartnerStatus }) {
  const styles: Record<PartnerStatus, string> = {
    active: 'bg-accent-green/20 text-accent-green',
    onboarding: 'bg-accent-blue/20 text-accent-blue-soft',
    inactive: 'bg-text-light/10 text-text-light/55',
    expired: 'bg-warning-500/20 text-warning-500',
  };
  const labels: Record<PartnerStatus, string> = {
    active: 'Ativo',
    onboarding: 'Onboarding',
    inactive: 'Inativo',
    expired: 'Expirado',
  };

  return (
    <span
      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${styles[status]}`}
    >
      {labels[status]}
    </span>
  );
}

function formatAddress(address: PlatformClientDetail['address']): string {
  const parts = [
    address.street,
    address.number,
    address.neighborhood,
    address.city,
    address.uf,
    address.cep,
  ].filter(Boolean);
  return parts.length ? parts.join(', ') : '—';
}

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}

function AddMonthSheet({
  isOpen,
  publicId,
  defaultValue,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  publicId: string;
  defaultValue: number;
  onClose: () => void;
  onCreated: () => Promise<void>;
}) {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [valueInput, setValueInput] = useState(
    formatMoneyInput(defaultValue),
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const current = new Date();
    setMonth(current.getMonth() + 1);
    setYear(current.getFullYear());
    setValueInput(formatMoneyInput(defaultValue));
    setFormError('');
    setSubmitting(false);
  }, [isOpen, defaultValue]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = parseMoneyInput(valueInput);
    if (value == null || value < 0) {
      setFormError('Informe um valor válido.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await createClientPayment(publicId, { year, month, value });
      await onCreated();
      onClose();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível adicionar o mês.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Adicionar parcela" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <MonthYearWheelPicker
          month={month}
          year={year}
          minYear={2018}
          maxYear={new Date().getFullYear() + 3}
          onChange={({ month: nextMonth, year: nextYear }) => {
            setMonth(nextMonth);
            setYear(nextYear);
          }}
        />
        <Input
          mode="dark"
          name="value"
          title="Valor"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={valueInput}
          onChange={(event) => setValueInput(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-base font-medium text-danger-400" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="md" disabled={submitting}>
          {submitting ? 'Salvando…' : 'Adicionar parcela'}
        </Button>
      </form>
    </FormSheet>
  );
}

function MarkPaidSheet({
  isOpen,
  publicId,
  payment,
  onClose,
  onMarked,
}: {
  isOpen: boolean;
  publicId: string;
  payment: PlatformPaymentHistoryItem | null;
  onClose: () => void;
  onMarked: () => Promise<void>;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const [paidAt, setPaidAt] = useState(today);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPaidAt(new Date().toISOString().slice(0, 10));
    setFormError('');
    setSubmitting(false);
  }, [isOpen, payment?.id]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!payment) return;
    if (!paidAt) {
      setFormError('Informe a data do pagamento.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await markClientPaymentPaid(publicId, payment.id, { paidAt });
      await onMarked();
      onClose();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível marcar como pago.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet
      isOpen={isOpen}
      title={
        payment
          ? `Marcar pago · ${formatMonthYear(payment.dueDate)}`
          : 'Marcar pago'
      }
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-1">
        {payment ? (
          <p className="mb-3 text-base leading-6 text-text-light/80">
            Valor{' '}
            <span className="font-semibold text-text-light">
              {formatCurrencyBRL(Number(payment.value))}
            </span>
          </p>
        ) : null}
        <Input
          mode="dark"
          type="date"
          name="paidAt"
          title="Data do pagamento"
          required
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-base font-medium text-danger-400" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="md" disabled={submitting || !payment}>
          {submitting ? 'Salvando…' : 'Confirmar pagamento'}
        </Button>
      </form>
    </FormSheet>
  );
}

function CourtDetailSheet({
  isOpen,
  court,
  companyPublicId,
  onClose,
  onUpdated,
}: {
  isOpen: boolean;
  court: PlatformClientDetail['courts'][number] | null;
  companyPublicId?: string;
  onClose: () => void;
  onUpdated: (client: PlatformClientDetail) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  return (
    <FormSheet
      isOpen={isOpen}
      title={court?.name || 'Quadra'}
      onClose={onClose}
    >
      {court ? (
        <dl className="space-y-4 pb-2">
          <Meta
            label="Status no site"
            value={court.show ? 'No site' : 'Oculta'}
          />
          <Meta
            label="Esportes"
            value={court.sports.length ? court.sports.join(', ') : '—'}
          />
          <Meta
            label="Preço"
            value={
              court.price != null
                ? `${formatCurrencyBRL(court.price)}/h`
                : '—'
            }
          />
          {court.floor ? <Meta label="Piso" value={court.floor} /> : null}
          {formError ? (
            <p className="text-base font-medium text-danger-400" role="alert">
              {formError}
            </p>
          ) : null}
          {companyPublicId ? (
            <Button
              type="button"
              size="md"
              variant="secondary"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                setFormError(null);
                try {
                  const updated = await updateCourtVisibility(
                    companyPublicId,
                    court.publicId,
                    { show: !court.show },
                  );
                  onUpdated(updated);
                } catch {
                  setFormError('Não foi possível atualizar a visibilidade.');
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy
                ? 'Salvando…'
                : court.show
                  ? 'Ocultar do site'
                  : 'Publicar no site'}
            </Button>
          ) : null}
        </dl>
      ) : null}
    </FormSheet>
  );
}

function AssignPlanSheet({
  isOpen,
  publicId,
  client,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  publicId: string;
  client: PlatformClientDetail;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [planId, setPlanId] = useState<string>('');
  const [dayDue, setDayDue] = useState(String(client.dayDue ?? 10));
  const [endTrial, setEndTrial] = useState(false);
  const [loadingPlans, setLoadingPlans] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setPlanId(client.plan?.id != null ? String(client.plan.id) : '');
    setDayDue(String(client.dayDue ?? 10));
    setEndTrial(false);
    setFormError('');
    setSubmitting(false);
    setLoadingPlans(true);
    listPlans()
      .then((data) => setPlans(data))
      .catch(() => setFormError('Não foi possível carregar os planos.'))
      .finally(() => setLoadingPlans(false));
  }, [isOpen, client]);

  const selectedPlan = plans.find((plan) => String(plan.id) === planId);
  const previewFee = computeMonthlyFee({
    basePrice: Number(selectedPlan?.basePrice ?? client.plan?.basePrice ?? 0),
    pricePerCourt: Number(
      selectedPlan?.pricePerCourt ?? client.plan?.pricePerCourt ?? 0,
    ),
    courtsCount: client.courtsCount,
    isTrial: client.isTrial && !endTrial,
  });

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedPlanId = Number(planId);
    const parsedDayDue = Number(dayDue);
    if (!Number.isInteger(parsedPlanId) || parsedPlanId < 1) {
      setFormError('Selecione um plano.');
      return;
    }
    if (
      !Number.isInteger(parsedDayDue) ||
      parsedDayDue < 1 ||
      parsedDayDue > 28
    ) {
      setFormError('Informe o dia de vencimento (1–28).');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await updateClientPlan(publicId, {
        planId: parsedPlanId,
        dayDue: parsedDayDue,
        endTrial: endTrial || undefined,
      });
      await onSaved();
      onClose();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível atualizar o plano.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Alterar plano" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <Select
          mode="dark"
          name="planId"
          title="Plano"
          required
          value={planId}
          disabled={loadingPlans}
          options={plans.map((plan) => ({
            id: plan.id,
            name: `${plan.name} · ${formatCurrencyBRL(plan.basePrice)} + ${formatCurrencyBRL(plan.pricePerCourt)}/extra`,
          }))}
          onChange={(event) => setPlanId(event.target.value)}
        />
        <Input
          mode="dark"
          name="dayDue"
          title="Dia de vencimento"
          required
          inputMode="numeric"
          value={dayDue}
          onChange={(event) =>
            setDayDue(event.target.value.replace(/\D/g, '').slice(0, 2))
          }
        />
        {client.isTrial ? (
          <label className="mb-3 flex min-h-11 items-center gap-3 text-base text-text-light">
            <input
              type="checkbox"
              checked={endTrial}
              onChange={(event) => setEndTrial(event.target.checked)}
              className="size-5 accent-accent-blue"
            />
            Encerrar trial agora
          </label>
        ) : null}
        <p className="mb-3 text-base leading-6 text-text-light/75">
          Mensalidade prevista:{' '}
          <span className="font-semibold text-text-light">
            {formatCurrencyBRL(previewFee)}
          </span>
          {selectedPlan && !(client.isTrial && !endTrial) ? (
            <span className="block text-text-light/70">
              {formatCurrencyBRL(selectedPlan.basePrice)} base
              {client.courtsCount > 1
                ? ` + ${formatCurrencyBRL(selectedPlan.pricePerCourt)} × ${client.courtsCount - 1} extra${client.courtsCount - 1 === 1 ? '' : 's'}`
                : ' (1ª quadra inclusa)'}
            </span>
          ) : null}
        </p>
        {formError ? (
          <p className="mb-3 text-base font-medium text-danger-400" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" size="md" disabled={submitting || loadingPlans}>
          {submitting ? 'Salvando…' : 'Salvar plano'}
        </Button>
      </form>
    </FormSheet>
  );
}

function formatMoneyInput(value: number): string {
  if (!Number.isFinite(value)) return '';
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function parseMoneyInput(raw: string): number | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(/\./g, '').replace(',', '.');
  const value = Number(normalized);
  if (!Number.isFinite(value)) return null;
  return value;
}
