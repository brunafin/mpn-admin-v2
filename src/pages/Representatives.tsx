import { useEffect, useState, type FormEvent } from 'react';
import { MdAdd } from 'react-icons/md';
import axios from 'axios';
import {
  createRepresentative,
  listRepresentatives,
  type RepresentativeListItem,
} from '../api/representatives';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Button from '../components/Button';
import EmptyState, { emptyStateActionClassName } from '../components/EmptyState';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import ListRow, { listClassName } from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { ClientsListSkeleton } from '../components/Skeleton';
import { formatPhoneMask, onlyPhoneDigits } from '../utils/formatPhone';

export default function RepresentativesPage() {
  const [items, setItems] = useState<RepresentativeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    listRepresentatives()
      .then((data) => {
        if (!cancelled) setItems(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os representantes.');
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
      <section className={PAGE_SHELL}>
        <PageHeader
          title="Representantes"
          action={
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => setCreateOpen(true)}
            >
              <MdAdd size={16} aria-hidden />
              Novo
            </Button>
          }
        />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {loading && items.length === 0 ? <ClientsListSkeleton /> : null}
          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && items.length === 0 && !error ? (
            <EmptyState
              title="Nenhum representante"
              description="Cadastre quem fecha quadras e acompanha as comissões."
              action={
                <button
                  type="button"
                  className={emptyStateActionClassName()}
                  onClick={() => setCreateOpen(true)}
                >
                  Novo representante
                </button>
              }
            />
          ) : null}

          {items.length > 0 ? (
            <ul className={listClassName}>
              {items.map((item) => (
                <li key={item.publicId}>
                  <ListRow
                    to={`/representantes/${item.publicId}`}
                    title={item.name}
                    subtitle={`${item.companiesCount} ${
                      item.companiesCount === 1 ? 'quadra' : 'quadras'
                    }`}
                  />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <RepresentativeSheet
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(created) => {
          setItems((current) =>
            [...current, created].sort((a, b) =>
              a.name.localeCompare(b.name, 'pt-BR', { sensitivity: 'base' }),
            ),
          );
        }}
      />
    </AppLayout>
  );
}

function RepresentativeSheet({
  isOpen,
  onClose,
  onCreated,
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (item: RepresentativeListItem) => void;
}) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [firstMonthPercent, setFirstMonthPercent] = useState('100');
  const [recurringPercent, setRecurringPercent] = useState('25');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName('');
    setUsername('');
    setEmail('');
    setPhone('');
    setFirstMonthPercent('100');
    setRecurringPercent('25');
    setFormError('');
    setSubmitting(false);
  }, [isOpen]);

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
      const created = await createRepresentative({
        name: name.trim(),
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        firstMonthPercent: Number(firstMonthPercent),
        recurringPercent: Number(recurringPercent),
        ...(phoneDigits ? { phone: phoneDigits } : {}),
      });
      onCreated(created);
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível cadastrar.'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title="Novo representante" onClose={onClose}>
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
          autoComplete="off"
          value={username}
          onChange={(event) => setUsername(event.target.value)}
        />
        <p className="mb-3 text-xs text-fg-muted">
          3 a 20 caracteres, sem espaços. É o login no portal.
        </p>
        <Input
          name="email"
          title="E-mail"
          type="email"
          required
          autoComplete="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <p className="mb-3 text-xs text-fg-muted">
          O código de primeiro acesso e de redefinição só vai para este e-mail.
        </p>
        <Input
          name="phone"
          title="Telefone"
          type="tel"
          inputMode="tel"
          value={phone}
          onChange={(event) => setPhone(formatPhoneMask(event.target.value))}
        />
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
          {submitting ? 'Salvando…' : 'Cadastrar'}
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
