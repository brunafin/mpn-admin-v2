import { useEffect, useState, type FormEvent } from 'react';
import axios from 'axios';
import { MdAdd } from 'react-icons/md';
import {
  createPlan,
  deletePlan,
  listPlans,
  updatePlan,
  type Plan,
} from '../api/plans';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import { Badge } from '../components/Badge';
import Button from '../components/Button';
import EmptyState, { emptyStateActionClassName } from '../components/EmptyState';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import ListRow from '../components/ListRow';
import { PageHeader } from '../components/PageTitle';
import { PlansListSkeleton } from '../components/Skeleton';
import { formatCurrencyBRL } from '../utils/formatCurrency';

export default function PlansPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Plan | null>(null);

  const loadPlans = async () => {
    const data = await listPlans();
    setPlans(data);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listPlans()
      .then((data) => {
        if (!cancelled) setPlans(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os planos.');
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
          title="Planos"
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
          {loading && plans.length === 0 ? <PlansListSkeleton /> : null}

          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && plans.length === 0 && !error ? (
            <EmptyState
              title="Nenhum plano cadastrado"
              description="Crie o primeiro plano de mensalidade."
              action={
                <button
                  type="button"
                  className={emptyStateActionClassName()}
                  onClick={() => setCreateOpen(true)}
                >
                  Novo plano
                </button>
              }
            />
          ) : null}

          {plans.length > 0 ? (
            <ul
              className={`divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface transition-opacity ${
                loading ? 'opacity-60' : ''
              }`}
              aria-busy={loading}
            >
              {plans.map((plan) => (
                <li key={plan.id}>
                  <ListRow
                    onClick={() => setEditing(plan)}
                    aria-label={`Editar plano ${plan.name}`}
                    title={plan.name}
                    badge={
                      plan.isTrialPlan ? (
                        <Badge>Plano trial</Badge>
                      ) : undefined
                    }
                    subtitle={plan.description || undefined}
                  >
                    <div className="mt-3 grid grid-cols-2 gap-3 border-t border-border pt-3">
                      <div className="min-w-0">
                        <p className="text-xs text-fg-muted">Mensalidade</p>
                        <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-fg">
                          {formatCurrencyBRL(Number(plan.basePrice))}
                        </p>
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-fg-muted">2ª quadra+</p>
                        <p className="mt-0.5 truncate text-sm font-medium tabular-nums text-fg">
                          +{formatCurrencyBRL(Number(plan.pricePerCourt))}
                        </p>
                      </div>
                    </div>
                  </ListRow>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </section>

      <PlanFormSheet
        isOpen={createOpen}
        title="Novo plano"
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await createPlan(values);
          await loadPlans();
        }}
      />

      <PlanFormSheet
        isOpen={Boolean(editing)}
        title="Editar plano"
        plan={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          if (!editing) return;
          await updatePlan(editing.id, values);
          await loadPlans();
        }}
        onDelete={
          editing
            ? async () => {
                await deletePlan(editing.id);
                await loadPlans();
              }
            : undefined
        }
      />
    </AppLayout>
  );
}

function PlanFormSheet({
  isOpen,
  title,
  plan,
  onClose,
  onSubmit,
  onDelete,
}: {
  isOpen: boolean;
  title: string;
  plan?: Plan | null;
  onClose: () => void;
  onSubmit: (values: {
    name: string;
    description: string;
    basePrice: number;
    pricePerCourt: number;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [basePriceInput, setBasePriceInput] = useState('');
  const [perCourtInput, setPerCourtInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setName(plan?.name ?? '');
    setDescription(plan?.description ?? '');
    setBasePriceInput(
      plan != null ? formatMoneyInput(Number(plan.basePrice)) : '100,00',
    );
    setPerCourtInput(
      plan != null ? formatMoneyInput(Number(plan.pricePerCourt)) : '10,00',
    );
    setFormError('');
    setSubmitting(false);
    setDeleting(false);
  }, [isOpen, plan]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedName = name.trim();
    const trimmedDescription = description.trim();
    const basePrice = parseMoneyInput(basePriceInput);
    const pricePerCourt = parseMoneyInput(perCourtInput);

    if (!trimmedName) {
      setFormError('Informe o nome do plano.');
      return;
    }
    if (!trimmedDescription) {
      setFormError('Informe a descrição.');
      return;
    }
    if (basePrice == null || basePrice < 0) {
      setFormError('Informe a mensalidade base.');
      return;
    }
    if (pricePerCourt == null || pricePerCourt < 0) {
      setFormError('Informe o valor a partir da 2ª quadra.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({
        name: trimmedName,
        description: trimmedDescription,
        basePrice,
        pricePerCourt,
      });
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível salvar o plano.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmed = window.confirm(
      'Excluir este plano? Esta ação não pode ser desfeita.',
    );
    if (!confirmed) return;

    setDeleting(true);
    setFormError('');
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setFormError(
        getApiErrorMessage(error, 'Não foi possível excluir o plano.'),
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <FormSheet isOpen={isOpen} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        {plan?.isTrialPlan ? (
          <p className="mb-3 rounded-md border border-border bg-canvas px-3 py-2 text-sm leading-5 text-fg-muted">
            Plano trial — usado automaticamente nos 2 meses de teste após o
            onboarding.
          </p>
        ) : null}
        <Input
          name="name"
          title="Nome"
          required
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <Input
          name="description"
          title="Descrição"
          required
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Input
          name="basePrice"
          title="Mensalidade base"
          required
          inputMode="decimal"
          placeholder="100,00"
          value={basePriceInput}
          onChange={(event) => setBasePriceInput(event.target.value)}
        />
        <Input
          name="pricePerCourt"
          title="A partir da 2ª quadra"
          required
          inputMode="decimal"
          placeholder="10,00"
          value={perCourtInput}
          onChange={(event) => setPerCourtInput(event.target.value)}
        />
        {formError ? (
          <p className="mb-3 text-sm font-medium text-danger" role="alert">
            {formError}
          </p>
        ) : null}
        <Button type="submit" fullWidth disabled={submitting || deleting}>
          {submitting ? 'Salvando…' : 'Salvar'}
        </Button>
        {onDelete ? (
          <Button
            type="button"
            variant="dangerOutline"
            fullWidth
            className="mt-2"
            disabled={submitting || deleting}
            onClick={handleDelete}
          >
            {deleting ? 'Excluindo…' : 'Excluir plano'}
          </Button>
        ) : null}
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

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const message = error.response?.data?.message;
    if (Array.isArray(message)) return message.join(', ');
    if (typeof message === 'string') return message;
  }
  return fallback;
}
