import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack } from 'react-icons/md';
import {
  createRepresentativePayout,
  deactivateRepresentative,
  getRepresentative,
  updateRepresentative,
  type Representative,
} from '../api/representatives';
import AppLayout, { BACK_BAR, BACK_TITLE, PAGE_SHELL } from '../components/AppLayout';
import { Badge, SituationBadge } from '../components/Badge';
import Button from '../components/Button';
import Card, { CardLabel, cardClassName } from '../components/Card';
import { SurfaceEmpty } from '../components/EmptyState';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import Table, { TableCell, TableRow } from '../components/Table';
import MonthYearWheelPicker from '../components/MonthYearWheelPicker';
import { ClientDetailSkeleton } from '../components/Skeleton';
import { clientSituation } from '../utils/clientSituation';
import { formatDateTime, formatPhone } from '../utils/format';
import { formatCurrencyBRL } from '../utils/formatCurrency';
import { formatPhoneMask, onlyPhoneDigits } from '../utils/formatPhone';
import { whatsappUrl } from '../utils/whatsapp';

export default function RepresentativeDetailPage() {
  const { publicId } = useParams<{ publicId: string }>();
  const [item, setItem] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [payOpen, setPayOpen] = useState(false);
  const [deactivating, setDeactivating] = useState(false);

  const load = async () => {
    if (!publicId) return;
    const data = await getRepresentative(publicId);
    setItem(data);
  };

  useEffect(() => {
    if (!publicId) return;
    let cancelled = false;
    setLoading(true);
    getRepresentative(publicId)
      .then((data) => {
        if (!cancelled) setItem(data);
      })
      .catch(() => {
        if (!cancelled) setError('Representante não encontrado.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [publicId]);

  const handleDeactivate = async () => {
    if (!publicId || !item) return;
    setDeactivating(true);
    try {
      await deactivateRepresentative(publicId);
      await load();
    } catch {
      setError('Não foi possível desativar.');
    } finally {
      setDeactivating(false);
    }
  };

  const wpp = whatsappUrl(item?.phone);
  const months = useMemo(() => (item ? monthGroups(item) : []), [item]);

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className={BACK_BAR}>
          <Link
            to="/representantes"
            aria-label="Voltar"
            className="mpn-tap flex size-9 shrink-0 items-center justify-center rounded-md text-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-3 pr-2">
            <h1 className={BACK_TITLE}>{item?.name || 'Representante'}</h1>
            {item && !item.status ? <Badge tone="danger">Inativo</Badge> : null}
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-4 lg:px-8">
          {loading && !item ? <ClientDetailSkeleton /> : null}
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {item ? (
            <div className="space-y-6">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm text-fg-muted">{item.username}</p>
                    {wpp ? (
                      <a
                        href={wpp}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-sm font-medium text-fg"
                      >
                        {formatPhone(item.phone)}
                      </a>
                    ) : item.phone ? (
                      <p className="mt-1 text-sm text-fg-muted">
                        {formatPhone(item.phone)}
                      </p>
                    ) : null}
                    {item.email ? (
                      <p className="mt-1 text-sm text-fg-muted">{item.email}</p>
                    ) : null}
                  </div>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setEditOpen(true)}
                  >
                    Editar
                  </Button>
                </div>
                <p className="mt-3 text-sm text-fg-muted">
                  Último acesso {formatDateTime(item.lastLoginAt)}
                </p>
              </div>

              <Card aria-labelledby="comissoes-heading">
                <CardLabel id="comissoes-heading">Comissões</CardLabel>
                <p className="mt-2 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                  {formatCurrencyBRL(item.commissionTotal)}
                </p>
                <p className="mt-1 text-sm text-fg-muted">
                  {item.firstMonthPercent}% da 1ª · {item.recurringPercent}% das
                  seguintes
                </p>
              </Card>

              <section aria-labelledby="meses-heading">
                <div className="flex items-center justify-between gap-3">
                  <CardLabel id="meses-heading">Meses</CardLabel>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => setPayOpen(true)}
                  >
                    Informar pagamento
                  </Button>
                </div>
                {months.length === 0 ? (
                  <div className={`mt-3 ${cardClassName}`}>
                    <SurfaceEmpty>
                      Nenhum pagamento de comissão informado.
                    </SurfaceEmpty>
                  </div>
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
                          {group.payout ? (
                            <p className="shrink-0 text-sm text-fg-muted">
                              Pago em {formatDay(group.payout.paidAt)}
                            </p>
                          ) : group.earned > 0 ? (
                            <p className="shrink-0 text-sm font-medium text-fg">
                              Em aberto
                            </p>
                          ) : null}
                        </div>
                        {group.earned > 0 || group.payout ? (
                          <p className="mt-2 text-sm text-fg">
                            Comissão {formatCurrencyBRL(group.earned)}
                            {group.payout ? (
                              <span className="text-fg-muted">
                                {' '}
                                · pago {formatCurrencyBRL(group.payout.amount)}
                              </span>
                            ) : null}
                          </p>
                        ) : (
                          <p className="mt-2 text-sm text-fg-muted">
                            Nenhuma comissão neste mês.
                          </p>
                        )}
                        {group.courts.length > 0 ? (
                          <ul className="mt-3 space-y-2">
                            {group.courts.map((court) => (
                              <li
                                key={court.publicId}
                                className="flex items-baseline justify-between gap-3 text-sm"
                              >
                                <span className="min-w-0 truncate text-fg">
                                  {court.name}
                                </span>
                                <span className="shrink-0 tabular-nums text-fg-muted">
                                  {formatCurrencyBRL(court.amount)}
                                </span>
                              </li>
                            ))}
                          </ul>
                        ) : null}
                      </Card>
                    ))}
                  </div>
                )}
              </section>

              <section aria-labelledby="quadras-heading">
                <CardLabel id="quadras-heading">Quadras</CardLabel>
                {item.companies.length === 0 ? (
                  <div className={`mt-3 ${cardClassName}`}>
                    <SurfaceEmpty>
                      Nenhuma arena atribuída. Defina o representante no detalhe do cliente.
                    </SurfaceEmpty>
                  </div>
                ) : (
                  <div className="mt-3">
                    <Table
                      columns={['Quadra', 'Cidade', 'Status']}
                      gridClass="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_7rem]"
                    >
                      {item.companies.map((company) => (
                        <TableRow
                          key={company.publicId}
                          to={`/clientes/${company.publicId}`}
                          gridClass="lg:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)_7rem]"
                          label={company.name}
                        >
                          <TableCell>
                            <p className="truncate text-sm font-medium text-fg">
                              {company.name}
                            </p>
                          </TableCell>
                          <TableCell label="Cidade">
                            <p className="truncate text-sm text-fg">
                              {company.city
                                ? `${company.city}${company.uf ? `/${company.uf}` : ''}`
                                : '—'}
                            </p>
                          </TableCell>
                          <TableCell label="Status">
                            <SituationBadge
                              situation={clientSituation(company)}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </Table>
                  </div>
                )}
              </section>

              {item.status ? (
                <Button
                  type="button"
                  variant="dangerOutline"
                  size="sm"
                  disabled={deactivating}
                  onClick={() => {
                    void handleDeactivate();
                  }}
                >
                  {deactivating ? 'Desativando…' : 'Desativar acesso'}
                </Button>
              ) : (
                <p className="text-sm text-fg-muted">
                  Acesso desativado. As quadras foram desvinculadas.
                </p>
              )}
            </div>
          ) : null}
        </div>
      </section>

      {item ? (
        <EditRepresentativeSheet
          isOpen={editOpen}
          item={item}
          onClose={() => setEditOpen(false)}
          onSaved={async () => {
            await load();
            setEditOpen(false);
          }}
        />
      ) : null}
      {item ? (
        <InformPayoutSheet
          isOpen={payOpen}
          item={item}
          onClose={() => setPayOpen(false)}
          onSaved={async () => {
            await load();
            setPayOpen(false);
          }}
        />
      ) : null}
    </AppLayout>
  );
}

function EditRepresentativeSheet({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  item: Representative;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [username, setUsername] = useState(item.username);
  const [email, setEmail] = useState(item.email || '');
  const [phone, setPhone] = useState(formatPhoneMask(item.phone || ''));
  const [password, setPassword] = useState('');
  const [firstMonthPercent, setFirstMonthPercent] = useState(
    String(item.firstMonthPercent),
  );
  const [recurringPercent, setRecurringPercent] = useState(
    String(item.recurringPercent),
  );
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(item.name);
    setUsername(item.username);
    setEmail(item.email || '');
    setPhone(formatPhoneMask(item.phone || ''));
    setPassword('');
    setFirstMonthPercent(String(item.firstMonthPercent));
    setRecurringPercent(String(item.recurringPercent));
    setFormError('');
    setSubmitting(false);
  }, [isOpen, item]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const phoneDigits = onlyPhoneDigits(phone);
    if (!email.trim()) {
      setFormError('Informe o e-mail da conta.');
      return;
    }
    if (phone && phoneDigits.length < 10) {
      setFormError('Informe um telefone válido.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await updateRepresentative(item.publicId, {
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        firstMonthPercent: Number(firstMonthPercent),
        recurringPercent: Number(recurringPercent),
        ...(phoneDigits ? { phone: phoneDigits } : {}),
        ...(password ? { password } : {}),
      });
      await onSaved();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível salvar.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Editar representante" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <Input
          name="name"
          title="Nome"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          name="username"
          title="Usuário (login)"
          required
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <Input
          name="email"
          title="E-mail"
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <Input
          name="phone"
          title="Telefone"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
        />
        <Input
          name="password"
          title="Nova senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <p className="mb-3 text-xs text-fg-muted">
          Só preencha se quiser definir a senha por aqui. Senão, a pessoa usa
          Primeiro acesso ou esqueci a senha.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <Input
            name="firstMonthPercent"
            title="1ª mensalidade %"
            inputMode="decimal"
            required
            value={firstMonthPercent}
            onChange={(event) => setFirstMonthPercent(event.target.value)}
          />
          <Input
            name="recurringPercent"
            title="Demais %"
            inputMode="decimal"
            required
            value={recurringPercent}
            onChange={(event) => setRecurringPercent(event.target.value)}
          />
        </div>
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

function InformPayoutSheet({
  isOpen,
  item,
  onClose,
  onSaved,
}: {
  isOpen: boolean;
  item: Representative;
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [year, setYear] = useState(today.getFullYear());
  const [paidAt, setPaidAt] = useState(today.toISOString().slice(0, 10));
  const [valueInput, setValueInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const now = new Date();
    const nextMonth = now.getMonth() + 1;
    const nextYear = now.getFullYear();
    setMonth(nextMonth);
    setYear(nextYear);
    setPaidAt(now.toISOString().slice(0, 10));
    setValueInput(formatMoneyInput(commissionForMonth(item, nextYear, nextMonth)));
    setFormError('');
    setSubmitting(false);
  }, [isOpen, item]);

  const suggested = commissionForMonth(item, year, month);
  const existing = (item.payouts ?? []).find(
    (payout) => payout.year === year && payout.month === month,
  );

  const handleMonthChange = (next: { month: number; year: number }) => {
    setMonth(next.month);
    setYear(next.year);
    setValueInput(formatMoneyInput(commissionForMonth(item, next.year, next.month)));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const amount = parseMoneyInput(valueInput);
    if (amount == null || amount < 0) {
      setFormError('Informe um valor válido.');
      return;
    }
    if (!paidAt) {
      setFormError('Informe a data do pagamento.');
      return;
    }
    setSubmitting(true);
    setFormError('');
    try {
      await createRepresentativePayout(item.publicId, {
        year,
        month,
        amount,
        paidAt,
      });
      await onSaved();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível informar o pagamento.'),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Informar pagamento" onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <p className="mb-3 text-sm leading-5 text-fg-muted">
          Comissão paga a {item.name} neste mês. O valor sugerido é{' '}
          <span className="font-medium text-fg">
            {formatCurrencyBRL(suggested)}
          </span>
          .
        </p>
        <MonthYearWheelPicker
          month={month}
          year={year}
          minYear={2018}
          maxYear={new Date().getFullYear() + 1}
          onChange={handleMonthChange}
        />
        {existing ? (
          <p className="mb-3 text-sm text-fg-muted">
            Este mês já foi pago em {formatDay(existing.paidAt)}. Confirmar
            substitui o valor.
          </p>
        ) : null}
        <Input
          name="amount"
          title="Valor"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={valueInput}
          onChange={(event) => setValueInput(event.target.value)}
        />
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
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? 'Salvando…' : 'Confirmar pagamento'}
        </Button>
      </form>
    </FormSheet>
  );
}

type MonthGroup = {
  year: number;
  month: number;
  earned: number;
  payout: Representative['payouts'][number] | null;
  courts: { publicId: string; name: string; amount: number }[];
};

function monthGroups(item: Representative): MonthGroup[] {
  const map = new Map<string, MonthGroup>();

  const ensure = (year: number, month: number) => {
    const key = `${year}-${month}`;
    let group = map.get(key);
    if (!group) {
      group = { year, month, earned: 0, payout: null, courts: [] };
      map.set(key, group);
    }
    return group;
  };

  for (const company of item.companies) {
    for (const line of company.commissions.lines) {
      if (!line.paidAt) continue;
      const [yearText, monthText] = line.paidAt.slice(0, 7).split('-');
      const year = Number(yearText);
      const month = Number(monthText);
      if (!year || !month) continue;
      const group = ensure(year, month);
      group.earned += line.amount;
      const court = group.courts.find(
        (entry) => entry.publicId === company.publicId,
      );
      if (court) {
        court.amount += line.amount;
      } else {
        group.courts.push({
          publicId: company.publicId,
          name: company.name,
          amount: line.amount,
        });
      }
    }
  }

  for (const payout of item.payouts ?? []) {
    ensure(payout.year, payout.month).payout = payout;
  }

  if (item.companies.length > 0) {
    const now = new Date();
    ensure(now.getFullYear(), now.getMonth() + 1);
  }

  for (const group of map.values()) {
    group.earned = Number(group.earned.toFixed(2));
    for (const court of group.courts) {
      court.amount = Number(court.amount.toFixed(2));
    }
    group.courts.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));
  }

  return [...map.values()].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  );
}

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

function monthLabel(year: number, month: number) {
  return `${MONTH_LABELS[month - 1] ?? month} de ${year}`;
}

function formatDay(value: string) {
  const [year, month, day] = value.slice(0, 10).split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function commissionForMonth(item: Representative, year: number, month: number) {
  const prefix = `${year}-${String(month).padStart(2, '0')}`;
  const total = item.companies.reduce((sum, company) => {
    return (
      sum +
      company.commissions.lines.reduce((lineSum, line) => {
        return line.paidAt?.startsWith(prefix) ? lineSum + line.amount : lineSum;
      }, 0)
    );
  }, 0);
  return Number(total.toFixed(2));
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
  }
  return fallback;
}
