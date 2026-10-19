import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack } from 'react-icons/md';
import {
  createClientPayment,
  deleteClient,
  getClient,
  markClientPaymentPaid,
  updateClientPlan,
  updateClientRepresentative,
  type PlatformClientDetail,
  type PlatformPaymentHistoryItem,
} from '../api/clients';
import { listPlans, type Plan } from '../api/plans';
import { listRepresentatives, type RepresentativeListItem } from '../api/representatives';
import AppLayout, { BACK_BAR, PAGE_SHELL } from '../components/AppLayout';
import { isRepresentativeToken } from '../components/ProtectedRoute';
import SellerCompanyPage from './SellerCompany';
import { SituationBadge } from '../components/Badge';
import Button from '../components/Button';
import { CardLabel } from '../components/Card';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import Checkbox from '../components/Checkbox';
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
import { clientSituation } from '../utils/clientSituation';

const WHATSAPP_BASE =
  import.meta.env.VITE_WHATSAPP_URL_BASE || 'https://wa.me/55';

/**
 * Hierarquia (dona da plataforma):
 * 1. Arena + dono
 * 2. Quadras
 * 3. Reservas
 * 4. Plano + pagamentos
 * 5. Excluir cliente
 */
export default function ClientDetailPage() {
  if (isRepresentativeToken()) {
    return <SellerCompanyPage />;
  }
  return <AdminClientDetailPage />;
}

function AdminClientDetailPage() {
  const { companyPublicId } = useParams<{ companyPublicId: string }>();
  const navigate = useNavigate();
  const [client, setClient] = useState<PlatformClientDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [addMonthOpen, setAddMonthOpen] = useState(false);
  const [markPaidPayment, setMarkPaidPayment] =
    useState<PlatformPaymentHistoryItem | null>(null);
  const [planSheetOpen, setPlanSheetOpen] = useState(false);
  const [representativeSheetOpen, setRepresentativeSheetOpen] = useState(false);
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
        className={`${PAGE_SHELL} transition-opacity ${
          loading && client ? 'opacity-80' : ''
        }`}
        aria-busy={loading}
      >
        <div className={BACK_BAR}>
          <Link
            to="/clientes"
            aria-label="Voltar para clientes"
            className="mpn-tap flex size-9 shrink-0 items-center justify-center rounded-md text-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-fg">
              {client?.name || 'Detalhe'}
            </p>
            {client ? (
              <SituationBadge situation={clientSituation(client)} />
            ) : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {loading && !client ? <ClientDetailSkeleton /> : null}

          {error ? (
            <p className="text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {client ? (
            <div className="space-y-4">
              {client.kind === 'onboarding' ||
              client.partnerStatus === 'expired' ||
              (client.owner && !client.owner.emailVerified) ? (
                <p
                  role="status"
                  className="rounded-md bg-warning-soft px-4 py-3 text-sm leading-5 text-warning"
                >
                  {client.kind === 'onboarding'
                    ? 'Em cadastro — ainda sem estabelecimento no sistema.'
                    : client.partnerStatus === 'expired'
                      ? 'Trial expirado. Atribua um plano para reativar agenda e site.'
                      : 'E-mail do dono ainda não confirmado.'}
                </p>
              ) : null}

              <section aria-labelledby="arena-heading">
                <h1
                  id="arena-heading"
                  className="truncate text-lg font-semibold tracking-tight text-fg"
                >
                  {client.name}
                </h1>
                <div className="mt-2 flex flex-wrap items-start justify-between gap-2">
                  <div className="min-w-0">
                    {ownerPhoneDigits ? (
                      <a
                        href={`${WHATSAPP_BASE}${ownerPhoneDigits}`}
                        target="_blank"
                        rel="noreferrer"
                        aria-label={`Abrir WhatsApp de ${client.owner?.name || 'dono'} — ${formatPhoneMask(client.owner?.phone || '')}`}
                        className="mpn-tap block min-w-0 truncate rounded-md text-sm font-medium text-fg underline-offset-2 hover:underline"
                      >
                        {client.owner?.name || 'Sem nome'}
                      </a>
                    ) : (
                      <p className="min-w-0 truncate text-sm font-medium text-fg">
                        {client.owner?.name || 'Sem nome'}
                      </p>
                    )}
                    {client.isTrial ? (
                      <p className="mt-0.5 text-sm text-fg-muted">
                        {client.trialEndsAt
                          ? `Trial até ${formatDate(client.trialEndsAt)}`
                          : 'Trial'}
                      </p>
                    ) : null}
                  </div>
                  <span className="shrink-0 text-xs text-fg-muted">
                    Último acesso {formatDateTime(client.owner?.lastLoginAt)}
                  </span>
                </div>
                {client.kind === 'company' ? (
                  <div className="mt-3 flex items-center justify-between gap-3">
                    <p className="min-w-0 truncate text-sm text-fg-muted">
                      Representante{' '}
                      <span className="text-fg">
                        {client.representative?.name?.trim() || '—'}
                      </span>
                    </p>
                    <TextAction onClick={() => setRepresentativeSheetOpen(true)}>
                      {client.representative?.name?.trim() ? 'Alterar' : 'Definir'}
                    </TextAction>
                  </div>
                ) : null}
              </section>

              {client.kind === 'company' ? (
                <>
                  <section aria-labelledby="quadras-heading">
                    <CardLabel id="quadras-heading">Quadras</CardLabel>
                    <p
                      className="mt-2 text-sm text-fg"
                      aria-label={`${client.courtsCount} quadras no total, ${client.visibleCourtsCount} ativas no site`}
                    >
                      Total {client.courtsCount}
                      <span className="mx-2 text-fg-muted" aria-hidden>
                        ·
                      </span>
                      Ativas {client.visibleCourtsCount}
                    </p>
                  </section>

                  <section aria-labelledby="reservas-heading">
                    <CardLabel id="reservas-heading">
                      Reservas deste mês
                    </CardLabel>
                    <p
                      className="mt-2 text-sm text-fg"
                      aria-label="Reservas do mês atual"
                    >
                      Passadas {client.usage?.pastReservations ?? 0}
                      <span className="mx-2 text-fg-muted" aria-hidden>
                        ·
                      </span>
                      Futuras {client.usage?.futureReservations ?? 0}
                      <span className="mx-2 text-fg-muted" aria-hidden>
                        ·
                      </span>
                      Fixos {client.usage?.fixedSlots ?? 0}
                    </p>
                  </section>

                  <section aria-labelledby="comercial-heading">
                    <header className="flex items-center justify-between gap-3">
                      <CardLabel id="comercial-heading">Plano</CardLabel>
                      <TextAction onClick={() => setPlanSheetOpen(true)}>
                        Alterar
                      </TextAction>
                    </header>
                    <p className="mt-2 text-sm font-medium tabular-nums text-fg">
                      {formatCurrencyBRL(Number(client.monthlyFee ?? 0))}
                      <span className="ms-1 font-normal text-fg-muted">
                        /mês
                      </span>
                    </p>
                    <p className="mt-0.5 text-sm text-fg-muted">
                      {client.plan?.name || 'Sem plano'}
                    </p>

                    <header className="mt-6 flex items-center justify-between gap-3">
                      <CardLabel id="pagamentos-heading">Pagamentos</CardLabel>
                      <TextAction onClick={() => setAddMonthOpen(true)}>
                        Adicionar
                      </TextAction>
                    </header>

                    <p className="mt-2 text-sm font-medium text-fg">
                      {formatCurrencyBRL(totalReceived)}{' '}
                      <span className="font-normal text-fg-muted">
                        recebido
                      </span>
                    </p>

                    {paymentHistory.length === 0 ? (
                      <p className="mt-3 text-sm text-fg-muted">
                        Nenhum pagamento registrado.
                      </p>
                    ) : (
                      <>
                        <ul className="mt-4 space-y-3">
                          {visiblePayments.map((payment) => {
                            const status = paymentStatus(payment);
                            return (
                              <li key={payment.id}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-medium capitalize text-fg">
                                      {formatMonthYear(payment.dueDate)}
                                    </p>
                                    <p className="mt-0.5 text-sm tabular-nums text-fg-muted">
                                      {formatCurrencyBRL(Number(payment.value))}
                                    </p>
                                  </div>
                                  <div className="flex shrink-0 items-center gap-2">
                                    <span
                                      className={`text-xs font-medium ${status.className}`}
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
                        </ul>
                        {hasMorePayments ? (
                          <div className="mt-2">
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

                  {client.commissions ? (
                    <section>
                      <CardLabel>Comissão do representante</CardLabel>
                      <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                        {formatCurrencyBRL(client.commissions.total)}
                      </p>
                      <p className="mt-1 text-sm text-fg-muted">
                        {client.commissions.firstMonthPercent}% da 1ª ·{' '}
                        {client.commissions.recurringPercent}% das seguintes
                      </p>
                    </section>
                  ) : null}
                </>
              ) : null}

              <div className="pt-2">
                <Button
                  type="button"
                  variant="dangerOutline"
                  fullWidth
                  onClick={() => setDeleteSheetOpen(true)}
                >
                  Excluir cliente
                </Button>
              </div>
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
          {client && client.kind === 'company' && companyPublicId ? (
            <RepresentativeSheet
              isOpen={representativeSheetOpen}
              publicId={companyPublicId}
              representative={client.representative}
              onClose={() => setRepresentativeSheetOpen(false)}
              onSaved={refreshClient}
            />
          ) : null}
          {client ? (
            <DeleteClientSheet
              isOpen={deleteSheetOpen}
              publicId={companyPublicId}
              client={client}
              onClose={() => setDeleteSheetOpen(false)}
              onDeleted={() => navigate('/clientes', { replace: true })}
            />
          ) : null}
        </>
      ) : null}
    </AppLayout>
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
      className={`mpn-tap inline-flex min-h-8 shrink-0 items-center rounded-md px-1 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${
        tone === 'danger'
          ? 'text-danger hover:bg-danger-soft'
          : 'text-fg hover:bg-arena-hover'
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
    return { label: 'Pago', className: 'text-success' };
  }
  if (payment.status === 'awaiting_pix') {
    return { label: 'Aguardando PIX', className: 'text-fg-muted' };
  }
  if (payment.status === 'overdue') {
    return { label: 'Vencido', className: 'text-danger' };
  }
  return { label: 'Pendente', className: 'text-warning' };
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
          name="value"
          title="Valor"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={valueInput}
          onChange={(event) => setValueInput(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting}>
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
          <p className="mb-3 text-sm leading-5 text-fg-muted">
            Valor{' '}
            <span className="font-medium text-fg">
              {formatCurrencyBRL(Number(payment.value))}
            </span>
          </p>
        ) : null}
        <Input
          type="date"
          name="paidAt"
          title="Data do pagamento"
          required
          value={paidAt}
          onChange={(event) => setPaidAt(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting || !payment}>
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
          <Checkbox
            name="endTrial"
            label="Encerrar trial agora"
            checked={endTrial}
            onChange={(event) => setEndTrial(event.target.checked)}
            className="mb-3"
          />
        ) : null}
        <p className="mb-3 text-sm leading-5 text-fg-muted">
          Mensalidade prevista:{' '}
          <span className="font-medium text-fg">
            {formatCurrencyBRL(previewFee)}
          </span>
          {selectedPlan && !(client.isTrial && !endTrial) ? (
            <span className="block text-fg-muted">
              {formatCurrencyBRL(selectedPlan.basePrice)} base
              {client.courtsCount > 1
                ? ` + ${formatCurrencyBRL(selectedPlan.pricePerCourt)} × ${client.courtsCount - 1} extra${client.courtsCount - 1 === 1 ? '' : 's'}`
                : ' (1ª quadra inclusa)'}
            </span>
          ) : null}
        </p>
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting || loadingPlans}>
          {submitting ? 'Salvando…' : 'Salvar plano'}
        </Button>
      </form>
    </FormSheet>
  );
}

function RepresentativeSheet({
  isOpen,
  publicId,
  representative,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  publicId: string;
  representative: PlatformClientDetail['representative'];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [sellers, setSellers] = useState<RepresentativeListItem[]>([]);
  const [value, setValue] = useState(representative?.publicId ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setValue(representative?.publicId ?? '');
    setFormError('');
    setSubmitting(false);
    listRepresentatives()
      .then((items) =>
        setSellers(
          items.filter(
            (item) => item.status || item.publicId === representative?.publicId,
          ),
        ),
      )
      .catch(() =>
        setFormError('Não foi possível carregar os representantes.'),
      );
  }, [isOpen, representative?.publicId]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setFormError('');
    try {
      await updateClientRepresentative(publicId, {
        representativePublicId: value || null,
      });
      await onSaved();
      onClose();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível salvar o representante.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Representante" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <Select
          name="representative"
          title="Quem acompanha esta arena"
          placeholder="Nenhum"
          value={value}
          options={sellers.map((seller) => ({
            id: seller.publicId,
            name: seller.name,
          }))}
          onChange={(event) => setValue(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : 'Salvar'}
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
        <p className="mb-3 text-sm leading-5 text-fg-muted">
          Isso apaga{' '}
          <span className="font-medium text-fg">{confirmName}</span>
          {client.kind === 'company'
            ? `, ${client.courtsCount} quadra${client.courtsCount === 1 ? '' : 's'}, agendas, reservas e pagamentos`
            : ' e o cadastro em andamento'}
          . Não tem volta.
        </p>
        <Input
          name="confirmName"
          title={`Digite “${confirmName}” para confirmar`}
          required
          autoComplete="off"
          value={typedName}
          onChange={(event) => setTypedName(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="danger"
          fullWidth
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
