import { useEffect, useMemo, useState, type FormEvent } from 'react';
import axios from 'axios';
import { MdAdd } from 'react-icons/md';
import {
  createCost,
  deleteCost,
  listCosts,
  updateCost,
  type Cost,
  type CostRecurrence,
} from '../api/costs';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Alert from '../components/Alert';
import Button from '../components/Button';
import { metricTileClass } from '../components/Card';
import EmptyState, { emptyStateActionClassName } from '../components/EmptyState';
import FormSheet from '../components/FormSheet';
import Input from '../components/Input';
import { PageHeader } from '../components/PageTitle';
import Select from '../components/Select';
import { ClientsListSkeleton } from '../components/Skeleton';
import Table, { TableCell, TableRow } from '../components/Table';
import { formatCurrencyBRL } from '../utils/formatCurrency';

const RECURRENCE_OPTIONS = [
  { id: 'monthly', name: 'Mensal' },
  { id: 'yearly', name: 'Anual' },
  { id: 'once', name: 'Única' },
];

export default function CostsPage() {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [editing, setEditing] = useState<Cost | null>(null);

  const loadCosts = async () => {
    const data = await listCosts();
    setCosts(data);
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    listCosts()
      .then((data) => {
        if (!cancelled) setCosts(data);
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar os custos.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const monthlyTotal = useMemo(
    () =>
      costs.reduce((sum, cost) => sum + Number(cost.monthlyEquivalent || 0), 0),
    [costs],
  );

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader
          title="Custos"
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
          {loading && costs.length === 0 ? <ClientsListSkeleton /> : null}

          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {!loading && costs.length === 0 && !error ? (
            <EmptyState
              title="Nenhum custo cadastrado"
              description="Registre hospedagem, ferramentas e outros gastos da plataforma."
              action={
                <button
                  type="button"
                  className={emptyStateActionClassName()}
                  onClick={() => setCreateOpen(true)}
                >
                  Novo custo
                </button>
              }
            />
          ) : null}

          {costs.length > 0 ? (
            <>
              <div className={`${metricTileClass} mb-3 max-w-xs`}>
                <p className="text-xs font-medium text-fg-muted">Recorrente /mês</p>
                <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight text-fg">
                  {formatCurrencyBRL(monthlyTotal)}
                </p>
              </div>
              <Table
                columns={['Descrição', 'Recorrência', 'Valor', 'No mês']}
                gridClass="lg:grid-cols-[minmax(0,1.6fr)_7rem_8rem_8rem]"
                className={loading ? 'opacity-60' : ''}
              >
                {costs.map((cost) => (
                  <TableRow
                    key={cost.id}
                    gridClass="lg:grid-cols-[minmax(0,1.6fr)_7rem_8rem_8rem]"
                    label={`Editar custo ${cost.description}`}
                    onClick={() => setEditing(cost)}
                  >
                    <TableCell>
                      <span className="block truncate text-sm font-medium text-fg">
                        {cost.description}
                      </span>
                    </TableCell>
                    <TableCell label="Recorrência">
                      <span className="block text-sm text-fg">
                        {RECURRENCE_OPTIONS.find(
                          (option) => option.id === cost.recurrence,
                        )?.name || cost.recurrence}
                      </span>
                    </TableCell>
                    <TableCell label="Valor">
                      <span className="block text-sm tabular-nums text-fg">
                        {formatCurrencyBRL(Number(cost.amount))}
                      </span>
                    </TableCell>
                    <TableCell label="No mês">
                      <span className="block text-sm tabular-nums text-fg-muted">
                        {formatCurrencyBRL(Number(cost.monthlyEquivalent))}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </Table>
            </>
          ) : null}
        </div>
      </section>

      <CostFormSheet
        isOpen={createOpen}
        title="Novo custo"
        onClose={() => setCreateOpen(false)}
        onSubmit={async (values) => {
          await createCost(values);
          await loadCosts();
        }}
      />

      <CostFormSheet
        isOpen={Boolean(editing)}
        title="Editar custo"
        cost={editing}
        onClose={() => setEditing(null)}
        onSubmit={async (values) => {
          if (!editing) return;
          await updateCost(editing.id, values);
          await loadCosts();
        }}
        onDelete={
          editing
            ? async () => {
                await deleteCost(editing.id);
                await loadCosts();
              }
            : undefined
        }
      />
    </AppLayout>
  );
}

function CostFormSheet({
  isOpen,
  title,
  cost,
  onClose,
  onSubmit,
  onDelete,
}: {
  isOpen: boolean;
  title: string;
  cost?: Cost | null;
  onClose: () => void;
  onSubmit: (values: {
    description: string;
    amount: number;
    recurrence: CostRecurrence;
  }) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [description, setDescription] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [recurrence, setRecurrence] = useState<CostRecurrence>('monthly');
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [formError, setFormError] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    setDescription(cost?.description ?? '');
    setAmountInput(
      cost != null ? formatMoneyInput(Number(cost.amount)) : '',
    );
    setRecurrence(cost?.recurrence ?? 'monthly');
    setFormError('');
    setSubmitting(false);
    setDeleting(false);
    setConfirmDelete(false);
  }, [isOpen, cost]);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmed = description.trim();
    const amount = parseMoneyInput(amountInput);

    if (!trimmed) {
      setFormError('Informe a descrição.');
      return;
    }
    if (amount == null || amount <= 0) {
      setFormError('Informe o valor.');
      return;
    }

    setSubmitting(true);
    setFormError('');
    try {
      await onSubmit({ description: trimmed, amount, recurrence });
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível salvar o custo.'));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    setDeleting(true);
    setFormError('');
    try {
      await onDelete();
      onClose();
    } catch (error) {
      setFormError(getApiErrorMessage(error, 'Não foi possível excluir o custo.'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
    <FormSheet isOpen={isOpen} title={title} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-1">
        <Input
          name="description"
          title="Descrição"
          required
          placeholder="Ex.: Railway, domínio, ferramenta"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
        />
        <Input
          name="amount"
          title="Valor"
          required
          inputMode="decimal"
          placeholder="0,00"
          value={amountInput}
          onChange={(event) => setAmountInput(event.target.value)}
        />
        <Select
          name="recurrence"
          title="Recorrência"
          required
          value={recurrence}
          options={RECURRENCE_OPTIONS}
          onChange={(event) =>
            setRecurrence(event.target.value as CostRecurrence)
          }
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
            onClick={() => setConfirmDelete(true)}
          >
            {deleting ? 'Excluindo…' : 'Excluir custo'}
          </Button>
        ) : null}
      </form>
    </FormSheet>
    <Alert
      open={confirmDelete}
      title="Excluir este custo?"
      confirmLabel="Excluir"
      confirmVariant="danger"
      dismissLabel="Cancelar"
      onDismiss={() => setConfirmDelete(false)}
      onConfirm={() => {
        setConfirmDelete(false);
        void handleDelete();
      }}
    >
      Esta ação não pode ser desfeita.
    </Alert>
    </>
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
