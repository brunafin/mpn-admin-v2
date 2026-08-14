import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import {
  MdArrowBack,
} from 'react-icons/md';
import {
  createClientPayment,
  deleteClient,
  getClient,
  markClientPaymentPaid,
  updateClientPlan,
  type PartnerStatus,
  type PlatformClientDetail,
  type PlatformPaymentHistoryItem,
} from '../api/clients';
import { listPlans, type Plan } from '../api/plans';
import AppLayout from '../components/AppLayout';
import Button from '../components/Button';
import Card, { CardLabel } from '../components/Card';
import FormSheet from '../components/FormSheet';
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
 * 1. Arena + dono (faixa escura)
 * 2. Quadras (card)
 * 3. Reservas
 * 4. Plano + pagamentos (faixa comercial)
 * 5. Zona de risco
 */
export default function ClientDetailPage() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<PlatformClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] =
    useState<PlatformPaymentHistoryItem | null>(null);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [deleteSheetOpen, setDeleteSheetOpen] = useState(false);
  const [showAllPayments, setShowAllPayments] = useState(false);

  useEffect(() => {
    if (!companyPublicId) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    setShowAllPayments(false);
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
        className={`mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-hidden bg-master text-text-light transition-opacity lg:max-w-5xl ${
          loading && client ? 'opacity-80' : ''
        }`}
        aria-busy={loading}
      >
        <div className="z-10 flex shrink-0 items-center gap-1 bg-master px-2 py-2 lg:px-6">
          <Link
            to="/quadras"
            aria-label="Voltar para quadras"
            className="mpn-tap flex size-11 shrink-0 items-center justify-center rounded-xl text-text-light focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent-blue"
          >
            <MdArrowBack size={24} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <p className="min-w-0 flex-1 truncate text-xl font-semibold tracking-tight text-text-light">
              {client?.name || 'Detalhe'}
            </p>
            {client ? (
              <PartnerStatusPill status={client.partnerStatus} />
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {loading && !client ? (
            <div className="px-4 pt-4 lg:px-8">
              <ClientDetailSkeleton />
            </div>
          ) : null}

          {error ? (
            <p
              className="px-4 pt-4 text-base font-medium text-danger-400 lg:px-8"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          {client ? (
            <>
              {client.kind === 'onboarding' ||
              client.partnerStatus === 'expired' ||
              (client.owner && !client.owner.emailVerified) ? (
                <p
                  role="status"
                  className="mx-4 mt-4 rounded-3xl bg-warning-500/10 px-5 py-4 text-base leading-6 text-warning-500 lg:mx-8"
                >
                  {client.kind === 'onboarding'
                    ? 'Em cadastro — ainda sem estabelecimento no sistema.'
                    : client.partnerStatus === 'expired'
                      ? 'Trial expirado. Atribua um plano para reativar agenda e site.'
                      : 'E-mail do dono ainda não confirmado.'}
                </p>
              ) : null}

              <div className="bg-text-light px-4 pb-10 pt-5 text-white lg:px-8">
                <h1 className="truncate text-2xl font-semibold tracking-tight text-white">
                  {client.name}
                </h1>
                <div className="mt-3 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {ownerPhoneDigits ? (
                      <a
                        href={`${WHATSAPP_BASE}${ownerPhoneDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir WhatsApp de ${client.owner?.name || 'dono'} — ${formatPhoneMask(client.owner?.phone || '')}`}
                        className="mpn-tap block min-w-0 truncate rounded-lg text-base font-semibold text-white transition hover:text-accent-green focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
                      >
                        {client.owner?.name || 'Sem nome'}
                      </a>
                    ) : (
                      <p className="min-w-0 truncate text-base font-semibold text-white/90">
                        {client.owner?.name || 'Sem nome'}
                      </p>
                    )}
                    {client.isTrial ? (
                      <p className="mt-0.5 text-base text-white/85">
                        {client.trialEndsAt
                          ? `Trial até ${formatDate(client.trialEndsAt)}`
                          : 'Trial'}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 pt-0.5 text-base text-white/85">
                    Último acesso {formatDateTime(client.owner?.lastLoginAt)}
                  </span>
                </div>
              </div>

              <div className="relative z-[1] -mt-6 space-y-4 px-4 lg:px-8">
                {client.kind === 'company' ? (
                  <>
                    <Card
                      aria-labelledby="quadras-heading"
                      className="overflow-hidden !bg-master"
                    >
                      <SectionLabel id="quadras-heading">Quadras</SectionLabel>
                      <div
                        className="mt-4 grid grid-cols-2 gap-4"
                        aria-label={`${client.courtsCount} quadras no total, ${client.visibleCourtsCount} ativas no site`}
                      >
                        <div className="rounded-2xl bg-accent-blue/10 px-4 py-3">
                          <p className="text-sm font-medium text-accent-blue">
                            Total
                          </p>
                          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-accent-blue">
                            {client.courtsCount}
                          </p>
                        </div>
                        <div className="rounded-2xl bg-accent-green/10 px-4 py-3">
                          <p className="text-sm font-medium text-accent-green">
                            Ativas
                          </p>
                          <p className="mt-1 text-4xl font-semibold tabular-nums tracking-tight text-accent-green">
                            {client.visibleCourtsCount}
                          </p>
                        </div>
                      </div>
                    </Card>

                    <section aria-labelledby="reservas-heading" className="px-1 text-center">
                      <SectionLabel id="reservas-heading">
                        Reservas deste mês
                      </SectionLabel>
                      <p
                        className="mt-2 text-base font-semibold text-text-light"
                        aria-label="Reservas do mês atual"
                      >
                        <span className="text-accent-green">
                          Passadas {client.usage?.pastReservations ?? 0}
                        </span>
                        <span className="mx-2 text-text-light/35" aria-hidden>
                          |
                        </span>
                        <span className="text-accent-blue">
                          Futuras {client.usage?.futureReservations ?? 0}
                        </span>
                        <span className="mx-2 text-text-light/35" aria-hidden>
                          |
                        </span>
                        <span className="text-accent-purple-soft">
                          Fixos {client.usage?.fixedSlots ?? 0}
                        </span>
                      </p>
                    </section>

                    <section
                      aria-labelledby="comercial-heading"
                      className="-mx-4 bg-master-light px-4 py-5 lg:-mx-8 lg:px-8"
                    >
                      <header className="flex items-center justify-between gap-3">
                        <SectionLabel id="comercial-heading">
                          Plano
                        </SectionLabel>
                        <TextAction onClick={() => setPlanSheetOpen(true)}>
                          Alterar
                        </TextAction>
                      </header>
                      <p className="mt-3 text-base font-semibold tabular-nums text-text-light">
                        {formatCurrencyBRL(Number(client.monthlyFee ?? 0))}
                        <span className="ms-1 font-medium text-text-light/70">
                          /mês
                        </span>
                      </p>
                      <p className="mt-1 text-base text-text-light">
                        {client.plan?.name || 'Sem plano'}
                      </p>

                      <header className="mt-6 flex items-center justify-between gap-3">
                        <SectionLabel id="pagamentos-heading">
                          Pagamentos
                        </SectionLabel>
                        <TextAction onClick={() => setAddMonthOpen(true)}>
                          Adicionar
                        </TextAction>
                      </header>

                      <p className="mt-2 text-base font-semibold text-text-light">
                        {formatCurrencyBRL(totalReceived)}{' '}
                        <span className="font-medium text-text-light/70">
                          recebido
                        </span>
                      </p>

                      {paymentHistory.length === 0 ? (
                        <p className="mt-3 text-base text-text-light/70">
                          Nenhum pagamento registrado.
                        </p>
                      ) : (
                        <>
                          <ol className="relative mt-4 ms-1.5 border-s border-text-light/25 ps-5">
                            {visiblePayments.map((payment) => {
                              const status = paymentStatus(payment);
                              return (
                                <li
                                  key={payment.id}
                                  className="relative pb-5 last:pb-0"
                                >
                                  <span
                                    className={`absolute -start-[1.4rem] top-1.5 size-2.5 rounded-full ${
                                      payment.paid
                                        ? 'bg-accent-green'
                                        : payment.status === 'overdue'
                                          ? 'bg-danger-400'
                                          : 'bg-accent-blue'
                                    }`}
                                    aria-hidden
                                  />
                                  <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                      <p className="truncate text-base font-semibold capitalize text-text-light">
                                        {formatMonthYear(payment.dueDate)}
                                      </p>
                                      <p className="mt-0.5 text-base tabular-nums text-text-light">
                                        {formatCurrencyBRL(Number(payment.value))}
                                      </p>
                                    </div>
                                    <div className="flex shrink-0 items-center gap-2">
                                      <span
                                        className={`text-base font-semibold ${status.className}`}
                                      >
                                        {status.label}
                                      </span>
                                      {!payment.paid ? (
                                        <TextAction
                                          onClick={() =>
                                            setMarkPaidPayment(payment)
                                          }
                                        >
                                          Marcar
                                        </TextAction>
                                      ) : null}
                                    </div>
                                  </div>
                                </li>
                              );
                            })}
                          </ol>
                          {hasMorePayments ? (
                            <div className="mt-1">
                              <TextAction
                                onClick={() =>
                                  setShowAllPayments((open) => !open)
                                }
                              >
                                {showAllPayments
                                  ? 'Ver menos'
                                  : `Ver mais (${paymentHistory.length - 3})`}
                              </TextAction>
                            </div>
                          ) : null}
                        </>
                      )}
                    </section>
                  </>
                ) : null}

                <div className="mt-10 border-t border-danger-400/20 pt-8">
                  <p className="mb-3 text-base text-text-light/70">
                    Zona de risco
                  </p>
                  <button
                    type="button"
                    onClick={() => setDeleteSheetOpen(true)}
                    className="mpn-tap flex min-h-11 w-full items-center justify-center rounded-2xl bg-danger-400/10 px-4 text-base font-semibold text-danger-400 transition hover:bg-danger-400/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-danger-400"
                  >
                    Excluir cliente
                  </button>
                </div>
              </div>
            </>
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
          {client ? (
            <DeleteClientSheet
              isOpen={deleteSheetOpen}
              publicId={companyPublicId}
              client={client}
              onClose={() => setDeleteSheetOpen(false)}
              onDeleted={() => navigate('/quadras', { replace: true })}
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
    <CardLabel id={id} as="h2">
      {children}
    </CardLabel>
  );
}

function TextAction({
  children,
  onClick,
  disabled,
  tone = 'accent',
  'aria-label': ariaLabel,
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  tone?: 'accent' | 'danger';
  'aria-label'?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      className={`mpn-tap inline-flex min-h-8 shrink-0 items-center rounded-md px-1 text-base font-semibold transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === 'danger'
          ? 'text-danger-400/75 hover:text-danger-400 focus-visible:outline-danger-400'
          : 'text-accent-blue-soft hover:bg-accent-blue/10 focus-visible:outline-accent-blue'
      }`}
    >
      {children}
    </button>
  );
}

function paymentStatus(payment: PlatformPaymentHistoryItem): {
  label: string;
  className: string;
} {
  if (payment.paid) {
    return { label: 'Pago', className: 'text-accent-green' };
  }
  if (payment.status === 'awaiting_pix') {
    return { label: 'Aguardando PIX', className: 'text-accent-blue-soft' };
  }
  if (payment.status === 'overdue') {
    return { label: 'Vencido', className: 'text-danger-400' };
  }
  return { label: 'Pendente', className: 'text-warning-500' };
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

function DeleteClientSheet({
  isOpen,
  publicId,
  client,
  onClose,
  onDeleted,
}: {
  isOpen: boolean;
  publicId: string;
  client: PlatformClientDetail;
  onClose: () => void;
  onDeleted: () => void;
}) {
  const confirmName = client.name.trim();
  const [typedName, setTypedName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setTypedName('');
    setFormError('');
    setSubmitting(false);
  }, [isOpen, client.publicId]);

  const canConfirm =
    typedName.trim().localeCompare(confirmName, 'pt-BR', {
      sensitivity: 'accent',
    }) === 0;

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canConfirm) {
      setFormError('Digite o nome do cliente exatamente como aparece.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await deleteClient(publicId);
      onDeleted();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível excluir o cliente.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Excluir cliente" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <p className="mb-3 text-base leading-6 text-text-light/80">
          Isso apaga{' '}
          <span className="font-semibold text-text-light">{confirmName}</span>
          {client.kind === 'company'
            ? `, ${client.courtsCount} quadra${client.courtsCount === 1 ? '' : 's'}, agendas, reservas e pagamentos`
            : ' e o cadastro em andamento'}
          . Não tem volta.
        </p>
        <Input
          mode="dark"
          name="confirmName"
          title={`Digite “${confirmName}” para confirmar`}
          required
          autoComplete="off"
          value={typedName}
          onChange={(event) => setTypedName(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-base font-medium text-danger-400" role="alert">
            {formError}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="danger"
          size="md"
          disabled={submitting || !canConfirm}
        >
          {submitting ? 'Excluindo…' : 'Excluir definitivamente'}
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
