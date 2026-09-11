import { useEffect, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { MdArrowBack } from 'react-icons/md';
import {
  deactivateRepresentative,
  getRepresentative,
  updateRepresentative,
  type Representative,
} from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { Badge, SituationBadge } from '../components/Badge';
import Button from '../components/Button';
import Card, { CardLabel } from '../components/Card';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import ListRow from '../components/ListRow';
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

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <div className="flex shrink-0 items-center gap-1 border-b border-border bg-surface px-2 py-1.5 lg:px-6">
          <Link
            to="/representantes"
            aria-label="Voltar"
            className="mpn-tap flex size-9 shrink-0 items-center justify-center rounded-md text-fg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-fg"
          >
            <MdArrowBack size={20} aria-hidden />
          </Link>
          <div className="flex min-w-0 flex-1 items-center gap-2 pr-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold tracking-tight text-fg">
              {item?.name || 'Representante'}
            </p>
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
            <div className="space-y-4">
              <Card>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h1 className="truncate text-lg font-semibold tracking-tight text-fg">
                      {item.name}
                    </h1>
                    <p className="mt-1 text-sm text-fg-muted">{item.username}</p>
                    {wpp ? (
                      <a
                        href={wpp}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 block text-sm text-fg underline-offset-2 hover:underline"
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
                <p className="mt-3 text-xs text-fg-muted">
                  Último acesso {formatDateTime(item.lastLoginAt)}
                </p>
              </Card>

              <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border">
                <Card className="rounded-none border-0">
                  <p className="text-xs text-fg-muted">Comissões</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                    {formatCurrencyBRL(item.commissionTotal)}
                  </p>
                </Card>
                <Card className="rounded-none border-0">
                  <p className="text-xs text-fg-muted">Regras</p>
                  <p className="mt-1 text-sm font-medium text-fg">
                    {item.firstMonthPercent}% 1ª
                  </p>
                  <p className="text-sm text-fg-muted">
                    {item.recurringPercent}% seguintes
                  </p>
                </Card>
              </div>

              <section>
                <CardLabel>Quadras</CardLabel>
                {item.companies.length === 0 ? (
                  <p className="mt-3 text-sm text-fg-muted">
                    Nenhuma arena atribuída. Defina o representante no detalhe do
                    cliente.
                  </p>
                ) : (
                  <ul className="mt-2 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
                    {item.companies.map((company) => (
                      <li key={company.publicId}>
                        <ListRow
                          to={`/clientes/${company.publicId}`}
                          title={company.name}
                          badge={
                            <SituationBadge
                              situation={clientSituation(company)}
                            />
                          }
                          subtitle={company.city || '—'}
                          meta={`${formatCurrencyBRL(company.commissions.total)} em comissões`}
                        />
                      </li>
                    ))}
                  </ul>
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
          title="Telefone (opcional)"
          type="tel"
          value={phone}
          onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
        />
        <Input
          name="password"
          title="Nova senha (opcional)"
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (typeof message === 'string' && message.trim()) return message;
    if (Array.isArray(message) && message[0]) return String(message[0]);
  }
  return fallback;
}
