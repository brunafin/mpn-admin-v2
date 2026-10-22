import { useEffect, useState } from 'react';
import {
  getMaintenance,
  updateMaintenance,
  type SiteMaintenance,
} from '../api/maintenance';
import Alert from '../components/Alert';
import AppLayout, { PAGE_SHELL } from '../components/AppLayout';
import Button from '../components/Button';
import { Card } from '../components/Card';
import { fieldOutlineBase } from '../components/Input';
import { PageHeader } from '../components/PageTitle';
import Switch from '../components/Switch';
import { formatDateTime } from '../utils/format';

const MESSAGE_LIMIT = 280;

export default function MaintenancePage() {
  const [state, setState] = useState<SiteMaintenance | null>(null);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<'switch' | 'message' | null>(null);
  const [error, setError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getMaintenance()
      .then((data) => {
        if (cancelled) return;
        setState(data);
        setDraft(data.message ?? '');
      })
      .catch(() => {
        if (!cancelled) setError('Não foi possível carregar a manutenção.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const apply = async (
    next: { maintenance: boolean; message?: string },
    kind: 'switch' | 'message',
  ) => {
    setSaving(kind);
    setError('');
    try {
      const saved = await updateMaintenance(next);
      setState(saved);
      if (next.message !== undefined) setDraft(saved.message ?? '');
    } catch {
      setError('Não foi possível salvar. Tente de novo.');
    } finally {
      setSaving(null);
    }
  };

  const messageDirty = (state?.message ?? '') !== draft.trim();

  return (
    <AppLayout>
      <section className={PAGE_SHELL}>
        <PageHeader title="Manutenção" />

        <div className="min-h-0 flex-1 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 lg:px-8">
          {loading ? (
            <p className="text-sm text-fg-muted">Carregando…</p>
          ) : null}

          {error ? (
            <p className="mb-3 text-sm font-medium text-danger" role="alert">
              {error}
            </p>
          ) : null}

          {state ? (
            <Card className="max-w-xl">
              <p className="text-sm text-fg">
                {state.maintenance
                  ? 'O site público está fora do ar.'
                  : 'O site público está no ar.'}
              </p>
              <p className="mt-1 text-sm text-fg-muted">
                Jogadores veem a tela de manutenção. O sistema das arenas e
                este admin continuam funcionando.
              </p>
              {state.updatedAt ? (
                <p className="mt-2 text-xs text-fg-muted">
                  Atualizado {formatDateTime(state.updatedAt)}
                </p>
              ) : null}

              <div className="mt-5">
                <Switch
                  name="maintenance"
                  label="Site público fora do ar"
                  checked={state.maintenance}
                  disabled={saving != null}
                  onChange={(event) => {
                    if (event.target.checked) {
                      setConfirmOpen(true);
                      return;
                    }
                    void apply({ maintenance: false }, 'switch');
                  }}
                />
              </div>

              <label className="mt-6 flex flex-col">
                <span className="mb-1.5 text-sm font-medium text-fg">
                  Mensagem na tela
                </span>
                <textarea
                  name="message"
                  value={draft}
                  maxLength={MESSAGE_LIMIT}
                  rows={3}
                  disabled={saving != null}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Estamos em manutenção por um momento. Voltamos já."
                  className={`${fieldOutlineBase} w-full py-2`}
                />
                <span className="mt-1 text-xs text-fg-muted">
                  {draft.trim().length}/{MESSAGE_LIMIT}. Em branco, o site usa
                  o texto padrão.
                </span>
              </label>

              <div className="mt-4">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={!messageDirty || saving != null}
                  onClick={() => {
                    void apply(
                      { maintenance: state.maintenance, message: draft },
                      'message',
                    );
                  }}
                >
                  Salvar mensagem
                </Button>
              </div>
            </Card>
          ) : null}
        </div>
      </section>

      <Alert
        open={confirmOpen}
        title="Tirar o site do ar?"
        confirmLabel="Tirar do ar"
        confirmVariant="danger"
        dismissLabel="Cancelar"
        onDismiss={() => setConfirmOpen(false)}
        onConfirm={() => {
          setConfirmOpen(false);
          void apply({ maintenance: true, message: draft }, 'switch');
        }}
      >
        Jogadores deixam de ver horários e arenas até você desligar a
        manutenção.
      </Alert>
    </AppLayout>
  );
}
