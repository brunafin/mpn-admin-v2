import { useEffect, useState } from 'react';
import {
  getDelinquencyPolicy,
  updateDelinquencyPolicy,
  type DelinquencyPolicy,
} from '../api/delinquency';
import Alert from '../components/Alert';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { fieldOutlineClass } from '../components/Input';
import { PageHeader } from '../components/PageTitle';
import { SettingsFormSkeleton } from '../components/Skeleton';

const BLOCK_AFTER_DAYS_MIN = 4;
const BLOCK_AFTER_DAYS_MAX = 60;

function savedNotice(saved: DelinquencyPolicy): string {
  if ((saved.blocked ?? 0) > 0) {
    return 'Salvo. Arenas que já passaram desse prazo ficaram somente leitura.';
  }
  if ((saved.released ?? 0) > 0) {
    return 'Salvo. Arenas abaixo desse prazo voltaram ao acesso completo.';
  }
  return 'Salvo.';
}

export default function DelinquencyPage() {
  const [state, setState] = useState<DelinquencyPolicy | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getDelinquencyPolicy()
      .then((data) => {
        if (cancelled) return;
        setState(data);
        setDraft(String(data.blockAfterDays));
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar o prazo.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const parsed = Number(draft);
  const valid =
    Number.isInteger(parsed) &&
    parsed >= BLOCK_AFTER_DAYS_MIN &&
    parsed <= BLOCK_AFTER_DAYS_MAX;
  const dirty = state != null && valid && parsed !== state.blockAfterDays;

  const save = async (blockAfterDays: number) => {
    setSaving(true);
    setError('');
    setNotice('');
    try {
      const saved = await updateDelinquencyPolicy(blockAfterDays);
      setState(saved);
      setDraft(String(saved.blockAfterDays));
      setNotice(savedNotice(saved));
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setSaving(false);
    }
  };

  const requestSave = () => {
    if (!state || !valid) return;
    if (parsed < state.blockAfterDays) {
      setConfirmOpen(true);
      return;
    }
    void save(parsed);
  };

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Inadimplência" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {loading ? <SettingsFormSkeleton /> : null}

          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {state ? (
            <Card className="max-w-xl">
              <p className="text-sm text-fg">
                Bloqueio no {state.blockAfterDays}º dia depois do vencimento.
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                O aviso de mensalidade pendente aparece do 3º dia até a
                véspera. No dia indicado, reservar, cancelar e alterar ficam
                suspensos para todas as arenas.
              </p>

              <label className="mt-6 flex flex-col">
                <span className="mb-1.5 text-sm font-medium text-fg">
                  Dias até o bloqueio
                </span>
                <input
                  name="blockAfterDays"
                  type="number"
                  inputMode="numeric"
                  min={BLOCK_AFTER_DAYS_MIN}
                  max={BLOCK_AFTER_DAYS_MAX}
                  value={draft}
                  disabled={saving}
                  onChange={(event) => {
                    setDraft(event.target.value);
                    setNotice('');
                  }}
                  className={`${fieldOutlineClass} w-28`}
                />
                <span className="mt-1 text-xs text-fg-muted">
                  De {BLOCK_AFTER_DAYS_MIN} a {BLOCK_AFTER_DAYS_MAX}. O padrão
                  é 10.
                </span>
              </label>

              {notice ? (
                <p className="mt-3 text-sm text-fg" role="status">
                  {notice}
                </p>
              ) : null}

              <div className="mt-4">
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!dirty || saving}
                  onClick={requestSave}
                >
                  Salvar
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </section>

      <Alert
        open={confirmOpen}
        title="Antecipar o bloqueio?"
        confirmLabel="Salvar"
        confirmVariant="danger"
        dismissLabel="Cancelar"
        onDismiss={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void save(parsed);
        }}
      >
        Arenas com {parsed} dias ou mais de atraso ficam somente leitura agora.
      </Alert>
    </AppLayout>
  );
}
